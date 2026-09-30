/**
 * Aktualisierung per Knopf (Issue #5) — nur für Owner („Super Admin“).
 *
 *  * Quelle sind die GitHub-Releases des Repositorys (UPDATE_REPO), Versionen nach SemVer.
 *  * Die API führt nichts selbst aus: sie legt einen Auftrag an (update_runs). Der Dienst
 *    „updater“ (deploy/updater) holt ihn ab, sichert, baut, startet, prüft — und fällt bei
 *    einem Fehler auf den letzten stabilen Stand zurück. Protokoll und Fehler stehen im Lauf.
 *  * Höchstens ein offener Auftrag (Datenbankregel). Jede Anforderung im Zugriffsprotokoll.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { one, q } from '../../db/pool.js';
import { AppError, bad, conflict } from '../../lib/errors.js';
import { body } from '../../lib/http.js';
import { SEMVER, appVersion, compareVersions } from '../../lib/version.js';
import { discord } from '../../services/discord.js';
import { logged } from './core.js';
import { requireOwner } from './team.js';

export interface Release {
  version: string;
  tag: string;
  name: string;
  notes: string;
  publishedAt: string;
  prerelease: boolean;
  url: string;
}

let cache: { at: number; releases: Release[]; error: string | null } | null = null;
const CACHE_MS = 10 * 60_000;

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
let fetcher: Fetcher = (url, init) => fetch(url, init);
/** Nur für Tests */
export function setReleaseFetcher(f: Fetcher | null) {
  fetcher = f ?? ((url, init) => fetch(url, init));
  cache = null;
}

export async function releases(force = false): Promise<{ releases: Release[]; error: string | null }> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache;
  const e = env();
  try {
    const res = await fetcher(`https://api.github.com/repos/${e.UPDATE_REPO}/releases?per_page=20`, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'cruizy-updater',
        ...(e.GITHUB_TOKEN ? { authorization: `Bearer ${e.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`GitHub antwortet mit ${res.status}`);
    const list = (await res.json()) as { tag_name: string; name: string | null; body: string | null; published_at: string; draft: boolean; prerelease: boolean; html_url: string }[];
    const rel = list
      .filter((r) => !r.draft && /^v/.test(r.tag_name) && SEMVER.test(r.tag_name.slice(1)))
      .map((r) => ({
        version: r.tag_name.slice(1),
        tag: r.tag_name,
        name: r.name || r.tag_name,
        notes: (r.body ?? '').slice(0, 20_000),
        publishedAt: r.published_at,
        prerelease: r.prerelease,
        url: r.html_url,
      }))
      .sort((a, b) => compareVersions(b.version, a.version));
    cache = { at: Date.now(), releases: rel, error: null };
  } catch (err) {
    cache = { at: Date.now(), releases: cache?.releases ?? [], error: (err as Error).message };
  }
  return cache;
}

function runView(r: any) {
  return {
    id: Number(r.id),
    targetVersion: r.target_version,
    fromVersion: r.from_version,
    requestedBy: r.requested_name,
    requestedAt: r.requested_at,
    status: r.status,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    log: r.log,
    error: r.error,
  };
}

export default async function updateRoutes(app: FastifyInstance) {
  app.get('/mod-api/updates', async (req) => {
    await requireOwner(req);
    const force = (req.query as { neu?: string }).neu === '1';
    const current = appVersion();
    const { releases: rel, error } = await releases(force);
    const agent = await one(`SELECT last_seen_at, version, git_commit FROM update_agent`);
    const runs = await q(
      `SELECT u.*, st.name AS requested_name FROM update_runs u JOIN staff st ON st.id = u.requested_by ORDER BY u.id DESC LIMIT 20`,
    );
    const newer = rel.filter((r) => compareVersions(r.version, current) > 0);
    return {
      current,
      latest: rel.find((r) => !r.prerelease) ?? null,
      updateAvailable: newer.some((r) => !r.prerelease),
      // relation: > 0 neuer als installiert, 0 installiert, < 0 älter (SemVer)
      releases: rel.map((r) => ({ ...r, relation: compareVersions(r.version, current) })),
      releaseError: error,
      repo: env().UPDATE_REPO,
      agent: agent
        ? { online: Date.now() - new Date(agent.last_seen_at).getTime() < 2 * 60_000, lastSeenAt: agent.last_seen_at, version: agent.version, commit: agent.git_commit }
        : { online: false, lastSeenAt: null, version: null, commit: null },
      runs: runs.map(runView),
    };
  });

  app.post('/mod-api/updates', async (req) => {
    const s = await requireOwner(req);
    const b = body(req, z.object({ version: z.string().regex(SEMVER), reason: z.string().trim().min(5).max(500) }));
    const { releases: rel } = await releases(true);
    const target = rel.find((r) => r.version === b.version);
    if (!target) throw bad('UI-UPDATE-UNBEKANNT', {}, 'version_unbekannt');
    const current = appVersion();
    if (compareVersions(b.version, current) === 0) throw bad('UI-UPDATE-SCHON', {}, 'schon_installiert');
    const agent = await one(`SELECT last_seen_at FROM update_agent`);
    if (!agent || Date.now() - new Date(agent.last_seen_at).getTime() > 2 * 60_000) throw new AppError(503, 'UI-UPDATE-KEIN-UPDATER', {}, 'updater_offline');
    const kind = compareVersions(b.version, current) > 0 ? 'aktualisierung' : 'zurueck_auf_aeltere_version';
    try {
      const id = await logged(s, `update:${b.version}`, `update_angefordert_${kind}`, `${b.reason} · ${current} → ${b.version}`, async (c) => {
        const r = await c.query(
          `INSERT INTO update_runs (target_version, from_version, requested_by) VALUES ($1, $2, $3) RETURNING id`,
          [b.version, current, s.id],
        );
        return Number(r.rows[0].id);
      }, true);
      discord('system', { title: `Aktualisierung angefordert: ${current} → ${b.version}`, level: 'info', fields: [{ name: 'Person', value: s.name }] });
      return { id, status: 'angefordert' };
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw conflict('UI-UPDATE-LAEUFT', 'laeuft');
      throw e;
    }
  });

  /** Ein noch nicht gestarteter Auftrag lässt sich zurücknehmen. */
  app.post('/mod-api/updates/:id/cancel', async (req) => {
    const s = await requireOwner(req);
    const id = Number((req.params as { id: string }).id);
    if (!Number.isInteger(id)) throw bad('UI-EINGABE-PRUEFEN');
    const r = await one(`SELECT target_version FROM update_runs WHERE id = $1 AND status = 'angefordert'`, [id]);
    if (!r) throw conflict('UI-UPDATE-LAEUFT', 'nicht_abbrechbar');
    await logged(s, `update:${r.target_version}`, 'update_abgebrochen', 'vor dem Start zurückgenommen', async (c) => {
      await c.query(`UPDATE update_runs SET status = 'abgebrochen', finished_at = now() WHERE id = $1 AND status = 'angefordert'`, [id]);
    });
    return { ok: true };
  });
}

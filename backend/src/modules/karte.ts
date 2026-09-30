/**
 * Karte (Issue #17) — ohne Google oder andere US-Dienste.
 *
 *  1. MAP_TILE_URL: eigener Kachelserver (die Geräte laden direkt dort).
 *  2. MAP_TILE_UPSTREAM: EU-Kachelserver über unseren Server (Zwischenspeicher auf der Platte).
 *     Die Geräte sprechen nur mit uns; der Kachelserver sieht nie Netzadressen der Nutzer.
 *  3. Sonst: Grundkarte aus mitgelieferten Daten (Ländergrenzen, Ortsnamen) — nichts verlässt den Server.
 *
 * Der Abruf ist auf DACH und Umgebung begrenzt, braucht eine Anmeldung und ist gedrosselt —
 * sonst wäre er ein offener Vermittler für fremde Kacheln.
 */
import type { FastifyInstance } from 'fastify';
import { mkdir, readFile, rename, stat, writeFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { env } from '../config/env.js';
import { requireMember } from '../lib/context.js';
import { tooMany } from '../lib/errors.js';
import { params } from '../lib/http.js';
import { hit } from '../lib/rate.js';
import { appVersion } from '../lib/version.js';

const AREA = { minLat: 43, maxLat: 58, minLng: 1, maxLng: 21 };
const MAX_ZOOM = 17;
const CACHE_DAYS = 30;

export function mapConfig() {
  const e = env();
  if (e.MAP_TILE_URL) return { mode: 'eigen' as const, tiles: e.MAP_TILE_URL, attribution: e.MAP_ATTRIBUTION || null, maxZoom: MAX_ZOOM };
  if (e.MAP_TILE_UPSTREAM) return { mode: 'vermittelt' as const, tiles: '/api/map/tiles/{z}/{x}/{y}', attribution: e.MAP_TILE_UPSTREAM_ATTRIBUTION || null, maxZoom: MAX_ZOOM };
  return { mode: 'grundkarte' as const, tiles: null, attribution: 'Grenzen: Natural Earth · Orte: GeoNames (CC BY 4.0)', maxZoom: 14 };
}

function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
const tile2lng = (x: number, z: number) => (x / 2 ** z) * 360 - 180;

/** Liegt die Kachel (auch nur teilweise) im erlaubten Gebiet? */
export function tileInArea(z: number, x: number, y: number) {
  if (x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return false;
  const north = tile2lat(y, z);
  const south = tile2lat(y + 1, z);
  const west = tile2lng(x, z);
  const east = tile2lng(x + 1, z);
  return south < AREA.maxLat && north > AREA.minLat && west < AREA.maxLng && east > AREA.minLng;
}

function cacheRoot() {
  return join(env().DATA_DIR, 'kacheln');
}

const inflight = new Map<string, Promise<Buffer | null>>();

async function fetchTile(z: number, x: number, y: number): Promise<Buffer | null> {
  const file = join(cacheRoot(), String(z), String(x), `${y}.png`);
  try {
    const st = await stat(file);
    if (Date.now() - st.mtimeMs < CACHE_DAYS * 86400_000) return await readFile(file);
  } catch {
    /* noch nicht im Speicher */
  }
  const key = `${z}/${x}/${y}`;
  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      const url = env().MAP_TILE_UPSTREAM.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
      const res = await fetch(url, {
        headers: { 'user-agent': `Cruizy/${appVersion()} (Kachel-Zwischenspeicher; ${env().APP_URL})` },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (!res || !res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 1_000_000) return null;
      await mkdir(dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, buf);
      await rename(`${file}.tmp`, file);
      return buf;
    })().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

/** Hintergrundauftrag: alte Kacheln entfernen. */
export async function pruneTiles() {
  const root = cacheRoot();
  const walk = async (d: string): Promise<void> => {
    const entries = await readdir(d, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else {
        const st = await stat(p).catch(() => null);
        if (st && Date.now() - st.mtimeMs > CACHE_DAYS * 86400_000) await rm(p, { force: true });
      }
    }
  };
  await walk(root);
}

export default async function karteRoutes(app: FastifyInstance) {
  app.get('/api/map/config', async (req) => {
    await requireMember(req, { allowDeletionPending: true });
    return mapConfig();
  });

  app.get('/api/map/tiles/:z/:x/:y', async (req, reply) => {
    const a = await requireMember(req, { allowDeletionPending: true });
    const { z: zz, x, y } = params(req, z.object({ z: z.coerce.number().int().min(0).max(MAX_ZOOM), x: z.coerce.number().int().min(0), y: z.coerce.number().int().min(0) }));
    if (!env().MAP_TILE_UPSTREAM || !tileInArea(zz, x, y)) return reply.status(404).send();
    if (!hit('kacheln', a.id, 3000, 3600_000)) throw tooMany();
    const buf = await fetchTile(zz, x, y);
    if (!buf) return reply.status(502).send();
    reply.header('content-type', 'image/png');
    reply.header('cache-control', 'private, max-age=604800');
    return reply.send(buf);
  });
}

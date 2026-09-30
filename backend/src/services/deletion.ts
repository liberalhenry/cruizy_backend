/**
 * Endgültige Löschung eines Kontos (F68, FV-77 Weg A, FV-97) und die
 * gesperrte Nachlauf-Ablage.
 *
 * PRÜFUNG ERFORDERLICH (Löschpfade).
 *
 *  * Nach der Karenz findet ein Prüflauf in keiner Tabelle und keiner Ablage einen
 *    Eintrag des Kontos — außer gesicherten Fallinhalten (AK-F68-07/08).
 *  * Gemeinsame Gespräche verschwinden auch bei der Gegenseite, einschließlich ihrer
 *    eigenen Nachrichten (AK-F68-10).
 *  * Vorher gehen sie für P-LOESCH-NACHLAUF in die gesperrte Ablage — ohne Kennung
 *    des gelöschten Kontos, erreichbar nur über einen Meldefall der Gegenseite (AK-F68-11).
 */
import { p } from '../config/params.js';
import { one, q, tx } from '../db/pool.js';
import { decStr, decrypt, encrypt } from '../lib/crypto.js';
import { copyFile, deleteFile } from '../lib/files.js';
import { purgeConversation } from '../modules/chat.js';
import { closeAllFor } from './hub.js';
import { createNotice } from './notify.js';
import { t } from '../lib/texts.js';

interface VaultMessage {
  from: 'geloeschtes_konto' | 'gegenseite' | 'system';
  kind: string;
  text: string | null;
  sealedFile: string | null;
  at: string;
}

export async function moveConversationsToVault(accountId: string) {
  const convs = await q(`SELECT * FROM conversations WHERE user_low = $1 OR user_high = $1`, [accountId]);
  for (const c of convs) {
    const counterpart = c.user_low === accountId ? c.user_high : c.user_low;
    const msgs = await q(
      `SELECT m.*, pm.file FROM messages m LEFT JOIN private_media pm ON pm.id = m.media_id
        WHERE m.conversation_id = $1 AND (m.expires_at IS NULL OR m.expires_at > now()) ORDER BY m.created_at`,
      [c.id],
    );
    const out: VaultMessage[] = [];
    for (const m of msgs) {
      let sealedFile: string | null = null;
      if ((m.kind === 'image' || m.kind === 'audio') && m.file && (m.delivery === 'sent' || m.sender_id === counterpart)) {
        sealedFile = await copyFile('zone2', m.file, 'sealed');
      }
      out.push({
        from: m.kind === 'system' ? 'system' : m.sender_id === accountId ? 'geloeschtes_konto' : 'gegenseite',
        kind: m.kind,
        text: m.body_enc ? decStr('messages', m.body_enc, `msg:${c.id}`) : (m.system_code ?? null),
        sealedFile,
        at: new Date(m.created_at).toISOString(),
      });
    }
    if (out.length) {
      await q(
        `INSERT INTO deletion_vault (counterpart_id, payload_enc, purge_at) VALUES ($1, $2, now() + make_interval(secs => $3))`,
        [counterpart, encrypt('sealed', JSON.stringify({ conversationStartedAt: c.created_at, messages: out }), 'vault'), p('P-LOESCH-NACHLAUF')],
      );
    }
    await purgeConversation(c.id);
  }
}

export function readVault(payload: Buffer) {
  return JSON.parse(decrypt('sealed', payload, 'vault').toString()) as { conversationStartedAt: string; messages: VaultMessage[] };
}

export async function purgeVaultEntry(id: string) {
  const v = await one(`DELETE FROM deletion_vault WHERE id = $1 RETURNING payload_enc`, [id]);
  if (!v) return;
  for (const m of readVault(v.payload_enc).messages) await deleteFile('sealed', m.sealedFile);
}

/** Löscht ein Konto sofort und vollständig (nach der Karenz, nach FV-17, vorläufige Konten). */
export async function deleteAccountNow(accountId: string, opts: { vault?: boolean } = { vault: true }) {
  closeAllFor(accountId);
  if (opts.vault !== false) await moveConversationsToVault(accountId);
  else {
    const convs = await q(`SELECT id FROM conversations WHERE user_low = $1 OR user_high = $1`, [accountId]);
    for (const c of convs) await purgeConversation(c.id);
  }
  const files = {
    photos: await q(`SELECT original_file, public_file FROM photos WHERE account_id = $1`, [accountId]),
    media: await q(`SELECT file FROM private_media WHERE owner_id = $1`, [accountId]),
    exports: await q(`SELECT file FROM exports WHERE account_id = $1`, [accountId]),
    idcheck: await q(`SELECT unnest(files) AS file FROM id_reviews WHERE account_id = $1`, [accountId]),
    events: await q(`SELECT ei.file FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE e.host_id = $1`, [accountId]),
  };
  // Issue #16: eigene Veranstaltungen verschwinden mit dem Konto — Gäste kommender erfahren die Absage
  const upcoming = await q(
    `SELECT DISTINCT r.account_id, e.title, e.id FROM events e JOIN event_rsvps r ON r.event_id = e.id
      WHERE e.host_id = $1 AND e.status = 'approved' AND e.ends_at > now() AND r.status IN ('angenommen','angefragt')`,
    [accountId],
  );
  for (const g of upcoming) {
    await createNotice(g.account_id, 'veranstaltung', t('UI-VA-N-ABGESAGT-TITEL'), t('UI-VA-N-ABGESAGT', { titel: g.title }), null, undefined, { push: false }).catch(() => {});
  }
  await tx(async (c) => {
    await c.query(`DELETE FROM events WHERE host_id = $1`, [accountId]);
    // Web-Abo endet mit der Löschung (AK-X10-01) — die Berechtigungen hängen am Konto
    await c.query(`DELETE FROM accounts WHERE id = $1`, [accountId]);
  });
  for (const ph of files.photos) {
    await deleteFile('zone1-original', ph.original_file);
    await deleteFile('zone1-public', ph.public_file);
  }
  for (const m of files.media) await deleteFile('zone2', m.file);
  for (const e of files.exports) await deleteFile('exports', e.file);
  for (const f of files.idcheck) await deleteFile('idcheck', f.file);
  for (const f of files.events) await deleteFile('zone1-public', f.file);
}

export async function startDeletion(accountId: string) {
  await q(
    `UPDATE accounts SET deletion_requested_at = COALESCE(deletion_requested_at, now()),
            deletion_due_at = COALESCE(deletion_due_at, now() + make_interval(secs => $2)) WHERE id = $1`,
    [accountId, p('P-KARENZ')],
  );
}

/**
 * Anbieterabstraktion für Prüfpartner (Code-Planer AP-9, AK-Z03-10).
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * „ausweis“ (Voreinstellung, Issue #7): Stufe 1 über ein Ausweisbild, das unser Server
 * auswertet — nur das Geburtsdatum zählt (services/id-check.ts); ist die Auswertung
 * unsicher, prüft ein Mensch aus dem Team.
 *
 * Ohne Prüfpartner prüft das Team auch Stufe 2 und die Fotoprüfung von Hand („team“):
 * Die Person lädt Ausweis und Selfie bzw. ein Selfie mit vorgegebener Geste hoch, das Team
 * entscheidet im Werkzeug unter „Bestätigen“, die Bilder werden mit der Entscheidung gelöscht.
 *
 * Ein echter Prüfpartner (EU-Sitz, vertraglich zugesicherte Sofortlöschung — AK-F04-09)
 * wird als weitere Umsetzung dieser Schnittstelle angebunden und meldet sein Ergebnis
 * signiert an den Webhook.
 */
import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';
import { safeEqual } from '../lib/crypto.js';

export type VerificationKind = 'age1' | 'age2' | 'face';
export type VerificationResult = 'passed' | 'failed' | 'unclear' | 'minor' | 'cancelled';

export interface ProviderStart {
  /** Adresse der Prüfung — beim Anbieter oder in der App */
  url: string;
}

export interface VerificationProvider {
  name: string;
  methods(kind: VerificationKind): string[];
  start(sessionId: string, kind: VerificationKind, method: string): Promise<ProviderStart>;
}

const ausweis: VerificationProvider = {
  name: 'ausweis',
  methods(kind) {
    return kind === 'age1' ? ['ausweis'] : ['team'];
  },
  async start(sessionId, kind, method) {
    if (kind === 'age1' && method === 'ausweis') return { url: `/pruefung/ausweis?s=${sessionId}` };
    return { url: `/pruefung/team?s=${sessionId}` };
  },
};

let override: VerificationProvider | null = null;
/** Für Tests: einen eigenen Anbieter einsetzen. */
export function setVerificationProvider(p: VerificationProvider | null) {
  override = p;
}

export function provider(): VerificationProvider {
  return override ?? ausweis;
}

function secret() {
  return env().AGE_WEBHOOK_SECRET || `${env().MASTER_KEY}:webhook`;
}

export function signWebhook(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('hex');
}

export function verifyWebhookSignature(body: string, signature: string | undefined): boolean {
  if (!signature || !/^[0-9a-f]{64}$/.test(signature)) return false;
  return safeEqual(Buffer.from(signWebhook(body), 'hex'), Buffer.from(signature, 'hex'));
}

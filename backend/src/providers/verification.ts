/**
 * Anbieterabstraktion für Prüfpartner (Code-Planer AP-9, AK-Z03-10).
 *
 * PRÜFUNG ERFORDERLICH.
 *
 * „ausweis“ (Issue #7, Voreinstellung): Stufe 1 über ein Ausweisbild, das unser Server
 * auswertet — nur das Geburtsdatum zählt (services/id-check.ts); ist die Auswertung
 * unsicher, prüft ein Mensch aus dem Team. Stufe 2 und Fotoprüfung gibt es auf diesem
 * Weg nicht (im Testbetrieb weiter über die Attrappe).
 *
 * Ein echter Prüfpartner (EU-Sitz, vertraglich zugesicherte Sofortlöschung —
 * AK-F04-09) wird als weitere Umsetzung dieser Schnittstelle angebunden. Bis
 * dahin gibt es die Attrappe „mock“: eine Seite auf unserem Server, die den
 * Prüfpartner nachstellt und das Ergebnis — wie ein echter Anbieter — signiert
 * an den Webhook meldet. Die Attrappe ist im Echtbetrieb gesperrt.
 */
import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';
import { safeEqual } from '../lib/crypto.js';

export type VerificationKind = 'age1' | 'age2' | 'face';
export type VerificationResult = 'passed' | 'failed' | 'unclear' | 'minor' | 'cancelled';

export interface ProviderStart {
  /** Adresse der eingebetteten Prüfung beim Anbieter */
  url: string;
}

export interface VerificationProvider {
  name: string;
  methods(kind: VerificationKind): string[];
  start(sessionId: string, kind: VerificationKind, method: string): Promise<ProviderStart>;
}

/** Wege nach FV-15: mindestens zwei, einer ohne Biometrie. Die Brieftasche folgt, sobald angebunden. */
const mock: VerificationProvider = {
  name: 'mock',
  methods(kind) {
    if (kind === 'face') return ['selfie'];
    return ['selfie', 'eid'];
  },
  async start(sessionId) {
    return { url: `/api/pruefpartner-attrappe/${sessionId}` };
  },
};

/** Die Attrappe ist im Echtbetrieb gesperrt. */
export function assertMockAllowed() {
  if (env().OPERATION_MODE === 'live') throw new Error('Die Attrappe des Prüfpartners ist im Echtbetrieb gesperrt');
}

const ausweis: VerificationProvider = {
  name: 'ausweis',
  methods(kind) {
    if (kind === 'age1') return ['ausweis'];
    return env().OPERATION_MODE === 'test' ? mock.methods(kind) : [];
  },
  async start(sessionId, kind, method) {
    if (kind === 'age1' && method === 'ausweis') return { url: `/pruefung/ausweis?s=${sessionId}` };
    assertMockAllowed();
    return mock.start(sessionId, kind, method);
  },
};

export function provider(): VerificationProvider {
  if (env().AGE_PROVIDER === 'ausweis') return ausweis;
  assertMockAllowed();
  return mock;
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

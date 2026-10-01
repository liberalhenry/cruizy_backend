/**
 * Gesichtsverifizierung für Cruizy Date (Issue #19) — gekapselt, keine eigene Biometrie.
 *
 * PRÜFUNG ERFORDERLICH (DSGVO Art. 9, biometrische Daten).
 *  * Selfie und Referenzbild gehen nur im Speicher an den Anbieter und werden nie abgelegt.
 *  * Gespeichert werden ausschließlich Ergebnis, Anbieter und Zeitpunkt (date_access).
 *  * Vorher ausdrückliche Einwilligung (date_access.biometric_consent_at).
 *
 * Ohne Anbieter (DATE_FACE_PROVIDER=none) vergleicht das Team Selfie und erstes Foto im Werkzeug
 * („Bestätigen“); das Selfie liegt bis zur Entscheidung verschlüsselt in der Ablage „idcheck“.
 *
 * Betrieb: Anbieter wählen (EU-Verarbeitung, AV-Vertrag, keine Speicherung von Templates)
 * und DATE_FACE_PROVIDER=http mit DATE_FACE_URL/DATE_FACE_HEADERS setzen.
 */
import { env } from '../config/env.js';

export interface FaceVerificationInput {
  selfie: Buffer;
  reference: Buffer;
  /** die zufällige Pose, die die Person zeigen sollte */
  pose: string;
}
export interface FaceVerificationResult {
  match: boolean;
  livenessOk: boolean;
  confidence?: number;
}
export interface FaceVerificationProvider {
  readonly name: string;
  available(): boolean;
  verify(input: FaceVerificationInput): Promise<FaceVerificationResult>;
}

class HttpProvider implements FaceVerificationProvider {
  readonly name = 'http';
  available() {
    return !!env().DATE_FACE_URL;
  }
  async verify(input: FaceVerificationInput): Promise<FaceVerificationResult> {
    const fd = new FormData();
    fd.append('selfie', new Blob([new Uint8Array(input.selfie)], { type: 'image/jpeg' }), 'selfie.jpg');
    fd.append('reference', new Blob([new Uint8Array(input.reference)], { type: 'image/jpeg' }), 'reference.jpg');
    fd.append('pose', input.pose);
    let headers: Record<string, string> = {};
    try {
      headers = JSON.parse(env().DATE_FACE_HEADERS || '{}');
    } catch {
      headers = {};
    }
    const res = await fetch(env().DATE_FACE_URL, { method: 'POST', body: fd, headers, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`Gesichtsverifizierung: Anbieter antwortet ${res.status}`);
    const j = (await res.json()) as Partial<FaceVerificationResult>;
    return { match: !!j.match, livenessOk: j.livenessOk !== false, confidence: typeof j.confidence === 'number' ? j.confidence : undefined };
  }
}

class NoneProvider implements FaceVerificationProvider {
  readonly name = 'none';
  available() {
    return false;
  }
  async verify(): Promise<FaceVerificationResult> {
    throw new Error('Gesichtsverifizierung nicht eingerichtet');
  }
}

let override: FaceVerificationProvider | null = null;
/** Für Tests: einen eigenen Anbieter einsetzen. */
export function setFaceProvider(p: FaceVerificationProvider | null) {
  override = p;
}

export function faceProvider(): FaceVerificationProvider {
  if (override) return override;
  const k = env().DATE_FACE_PROVIDER;
  if (k === 'http') return new HttpProvider();
  return new NoneProvider();
}

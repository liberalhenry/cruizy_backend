/**
 * Bildadressen: verschlüsselt, an die betrachtende Person gebunden und nur
 * P-BILDLINK-GUELTIG gültig (FV-27, AK-F12-02, AK-F48-04). Aus einer Adresse
 * lässt sich weder die Kennung des Originals noch die der anderen Fassung
 * ablesen (AK-F11-03).
 */
import { p } from '../config/params.js';
import { openToken, sealToken } from '../lib/crypto.js';

export type ImgKind = 'photo' | 'album' | 'chat' | 'own' | 'ticket' | 'once' | 'audio' | 'teaser' | 'event' | 'date';
export type PhotoVariant = 'public' | 'clear' | 'guest' | 'original';

export interface ImgToken {
  k: ImgKind;
  id: string;
  v?: PhotoVariant;
  r: string; // Kennung der betrachtenden Person oder „gast:…“
  e: number;
}

export function imgUrl(k: ImgKind, id: string, viewer: string, v?: PhotoVariant, ttlS?: number): string {
  const tok = sealToken({ k, id, v, r: viewer, e: Date.now() + (ttlS ?? p('P-BILDLINK-GUELTIG')) * 1000 } satisfies ImgToken);
  return `/api/img/${tok}`;
}

/** Adresse einer Sprachaufnahme — gleiche Regeln wie Bilder, eigener Pfad (Range-Anfragen für Safari). */
export function audioUrl(id: string, viewer: string, kind: 'audio' | 'date' = 'audio'): string {
  const tok = sealToken({ k: kind, id, r: viewer, e: Date.now() + Math.max(p('P-BILDLINK-GUELTIG'), 30 * 60) * 1000 } satisfies ImgToken);
  return `/api/audio/${tok}`;
}

export function readImgToken(token: string): ImgToken | null {
  const t = openToken<ImgToken>(token);
  if (!t || typeof t.e !== 'number' || t.e < Date.now()) return null;
  return t;
}

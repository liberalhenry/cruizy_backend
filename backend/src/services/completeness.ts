/**
 * Profil-Vollständigkeit (Issue #29) — nur für die Person selbst, ohne Einfluss auf Sortierung
 * oder Sichtbarkeit. Punkte aus P-VOLLSTAENDIG (Summe 100). Fehlt ein Merkmal in der App,
 * werden seine Punkte anteilig auf die übrigen verteilt. Freiwillige oder sensible Angaben
 * (Kinks, Position, Gesundheit, Religion, Politik) zählen nie.
 */
import { p } from '../config/params.js';

export type CompletenessKey = 'profilbild' | 'drei_fotos' | 'bio' | 'basis' | 'foto_echt' | 'interessen' | 'absicht';

export interface CompletenessInput {
  approvedPhotos: number;
  photoMode: 'photo' | 'initial';
  bio: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bodyTypes: string[];
  faceChecked: boolean;
  traits: number[];
  intentionSet: boolean;
}

/** Sprungmarken im Profil-Editor */
const ANCHOR: Record<CompletenessKey, string> = {
  profilbild: 'fotos',
  drei_fotos: 'fotos',
  bio: 'text',
  basis: 'ueber',
  foto_echt: 'pruefung',
  interessen: 'interessen',
  absicht: 'absicht',
};

export function completeness(input: CompletenessInput, available?: Partial<Record<CompletenessKey, boolean>>) {
  const weights = p('P-VOLLSTAENDIG') as Record<CompletenessKey, number>;
  const keys = (Object.keys(weights) as CompletenessKey[]).filter((k) => available?.[k] !== false);
  const total = keys.reduce((s, k) => s + weights[k], 0) || 1;
  // proportionale Umverteilung: jedes vorhandene Merkmal bekommt seinen Anteil an 100
  const scale = 100 / total;
  const basisFields = [input.age, input.heightCm, input.weightKg, input.bodyTypes.length ? 1 : null];
  const share: Record<CompletenessKey, number> = {
    profilbild: input.approvedPhotos > 0 && input.photoMode === 'photo' ? 1 : 0,
    drei_fotos: input.approvedPhotos >= 3 ? 1 : 0,
    bio: [...input.bio.trim()].length >= 50 ? 1 : 0,
    basis: basisFields.filter((x) => x !== null && x !== undefined).length / basisFields.length,
    foto_echt: input.faceChecked ? 1 : 0,
    interessen: input.traits.length >= 3 ? 1 : 0,
    absicht: input.intentionSet ? 1 : 0,
  };
  let score = 0;
  const missing: { key: CompletenessKey; points: number; anchor: string; count?: number }[] = [];
  for (const k of keys) {
    const pts = weights[k] * scale;
    score += pts * share[k];
    if (share[k] < 1) {
      const extra = k === 'drei_fotos' ? { count: Math.max(0, 3 - input.approvedPhotos) } : {};
      missing.push({ key: k, points: Math.round(pts * (1 - share[k])), anchor: ANCHOR[k], ...extra });
    }
  }
  missing.sort((a, b) => b.points - a.points);
  return { pct: Math.min(100, Math.round(score)), tips: missing.slice(0, 3) };
}

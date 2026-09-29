/**
 * Standortarchitektur (F69, F70, FV-02).
 *
 * PRÜFUNG ERFORDERLICH — Prüffrage: „Kann aus irgendeiner Antwort des Servers
 * eine Position genauer als die Rasterzelle der gewählten Stufe bestimmt werden?“
 * Antwort dieses Moduls: Nein. Jede Position wird sofort auf den Mittelpunkt
 * einer Rasterzelle gerundet; alle Entfernungen werden zwischen Zellmittelpunkten
 * berechnet und verlassen den Server nur als eines von vier Bändern.
 */
import { p } from '../config/params.js';

const M_PER_DEG_LAT = 111_320;
const R_EARTH_KM = 6371.0088;

export type Level = 'grob' | 'nah' | 'aus';
export interface LatLng {
  lat: number;
  lng: number;
}

export function cellSize(level: Exclude<Level, 'aus'>): number {
  return level === 'nah' ? p('P-ZELLE-NAH') : p('P-ZELLE-GROB');
}

/**
 * Rundet eine Position auf den Mittelpunkt ihrer Rasterzelle.
 * Das Raster ist deterministisch: Zeilen fester Höhe, je Zeile Spalten, deren
 * Breite so gewählt ist, dass die Zellen annähernd quadratisch sind.
 */
export function roundToCell(pos: LatLng, sizeM: number): LatLng {
  if (!isValid(pos)) throw new Error('Ungültige Position');
  const dLat = sizeM / M_PER_DEG_LAT;
  const row = Math.floor((pos.lat + 90) / dLat);
  const centerLat = Math.min(89.999, -90 + (row + 0.5) * dLat);
  const cos = Math.max(Math.cos((centerLat * Math.PI) / 180), 0.01);
  const dLng = sizeM / (M_PER_DEG_LAT * cos);
  const col = Math.floor((pos.lng + 180) / dLng);
  let centerLng = -180 + (col + 0.5) * dLng;
  if (centerLng > 180) centerLng -= 360;
  return { lat: round6(centerLat), lng: round6(centerLng) };
}

export function roundForLevel(pos: LatLng, level: Exclude<Level, 'aus'>): LatLng {
  return roundToCell(pos, cellSize(level));
}

function round6(v: number) {
  return Math.round(v * 1e6) / 1e6;
}

export function isValid(pos: LatLng | null | undefined): pos is LatLng {
  return (
    !!pos &&
    Number.isFinite(pos.lat) &&
    Number.isFinite(pos.lng) &&
    pos.lat >= -90 &&
    pos.lat <= 90 &&
    pos.lng >= -180 &&
    pos.lng <= 180
  );
}

/** Großkreisentfernung in km — nur serverintern. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Die vier Entfernungsbänder (Handbuch A, Mikro-UX). 1 = unter 1 km … 4 = über 10 km */
export type Band = 1 | 2 | 3 | 4;
export function band(km: number): Band {
  if (km < 1) return 1;
  if (km < 3) return 2;
  if (km < 10) return 3;
  return 4;
}

export const BAND_TEXT_ID: Record<Band, string> = {
  1: 'ST-STO-10',
  2: 'ST-STO-11',
  3: 'ST-STO-12',
  4: 'ST-STO-13',
};

/** Umgebendes Rechteck für eine Vorauswahl in SQL. */
export function boundingBox(center: LatLng, km: number) {
  const dLat = km / 111.32;
  const cos = Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01);
  const dLng = km / (111.32 * cos);
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLng: center.lng - dLng, maxLng: center.lng + dLng };
}

/** Punkt in Richtung (Grad) und Entfernung (km) — für Vorschläge von Ersatzpunkten. */
export function destination(from: LatLng, bearingDeg: number, km: number): LatLng {
  const δ = km / R_EARTH_KM;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (from.lat * Math.PI) / 180;
  const λ1 = (from.lng * Math.PI) / 180;
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: (φ2 * 180) / Math.PI, lng: ((((λ2 * 180) / Math.PI + 540) % 360) - 180) };
}

export function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
}

/**
 * Land aus einer gerundeten Position (für die Notrufnummern, AK-F55-17).
 * Grobe Rechtecke für DE, AT, CH; im Grenzgebiet bewusst „unbestimmt“ —
 * dann zeigt die App 112 allein. Das Land wird nicht gespeichert (FV-75).
 */
export function countryOf(pos: LatLng | null): 'DE' | 'AT' | 'CH' | null {
  if (!pos) return null;
  const inBox = (a: number, b: number, c: number, d: number) =>
    pos.lat >= a && pos.lat <= b && pos.lng >= c && pos.lng <= d;
  const ch = inBox(45.9, 47.4, 6.1, 9.4) || inBox(46.3, 47.6, 7.0, 9.3);
  const at = inBox(46.6, 48.8, 12.2, 16.9) || inBox(46.9, 47.5, 9.9, 12.2);
  const de = inBox(47.9, 54.8, 6.1, 14.9) || inBox(47.4, 47.9, 7.8, 12.9);
  const hits = [ch && 'CH', at && 'AT', de && 'DE'].filter(Boolean) as ('DE' | 'AT' | 'CH')[];
  return hits.length === 1 ? hits[0] : null;
}

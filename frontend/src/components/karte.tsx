/**
 * Karte ohne Google oder andere US-Dienste (Issue #17).
 *  * Kacheln vom eigenen oder EU-Kachelserver (über unseren Server vermittelt), sonst eine
 *    Grundkarte aus mitgelieferten Daten: Ländergrenzen (Natural Earth) und Ortsnamen (GeoNames).
 *  * Veranstaltungen als Punkte im sichtbaren Ausschnitt — beim Herauszoomen gebündelt, sodass man
 *    von Hamburg aus auch Veranstaltungen in München sieht.
 *  * Genaue Punkte nur bei öffentlichen Orten; sonst ein gestrichelter Kreis „ungefähre Gegend“.
 */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { useApp } from '../lib/app';
import { t } from '../lib/texts';
import { Icon } from './ui';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  exact: boolean;
  title: string;
  startsAt: string;
  categories: string[];
  featured: boolean;
}

let laender: Promise<any> | null = null;
let orte: Promise<[string, number, number, number][]> | null = null;
const loadJson = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null));

/** Ab welcher Zoomstufe erscheinen Orte welchen Rangs (0 = Millionenstadt … 6 = Stadtteil)? */
const RANK_ZOOM = [4, 6, 7, 8, 9, 11, 12];

/** Grundlage: Kacheln oder die eigene Grundkarte. Gibt eine Aufräumfunktion zurück. */
export function addBaseLayer(map: L.Map, cfg: { tiles: string | null; attribution: string | null; maxZoom?: number } | undefined) {
  if (cfg?.tiles) {
    L.tileLayer(cfg.tiles, { attribution: cfg.attribution ?? '', maxZoom: cfg.maxZoom ?? 17, crossOrigin: false }).addTo(map);
    return () => {};
  }
  // Grundkarte: Wasser als Hintergrund, Länder als Flächen, Orte als Beschriftung
  map.getContainer().style.background = '#0d1420';
  if (cfg?.attribution) map.attributionControl.addAttribution(cfg.attribution);
  let alive = true;
  // Ortsnamen über den Flächen, aber unter den Veranstaltungspunkten
  if (!map.getPane('orte')) map.createPane('orte').style.zIndex = '450';
  const labels = L.layerGroup().addTo(map);
  laender ??= loadJson('/karte/laender.json');
  orte ??= loadJson('/karte/orte.json');
  laender.then((geo) => {
    if (!alive || !geo) return;
    L.geoJSON(geo, {
      interactive: false,
      style: (f) => ({
        color: f?.properties?.d ? '#56617a' : '#39425a',
        weight: f?.properties?.d ? 1.4 : 0.8,
        fillColor: f?.properties?.d ? '#1c2230' : '#161b26',
        fillOpacity: 1,
      }),
    }).addTo(map).bringToBack();
  });
  const draw = async () => {
    const list = await orte;
    if (!alive || !list) return;
    labels.clearLayers();
    const z = map.getZoom();
    const b = map.getBounds().pad(0.1);
    let n = 0;
    // einfache Kollisionsprüfung: wichtigere Orte zuerst, überlappende Namen fallen weg
    const boxes: [number, number, number, number][] = [];
    for (const [name, lat, lng, rank] of list) {
      if (z < RANK_ZOOM[rank]) continue;
      if (!b.contains([lat, lng])) continue;
      const pt = map.latLngToContainerPoint([lat, lng]);
      const w = name.length * (rank <= 1 ? 7.5 : 6.2) + 6;
      const box: [number, number, number, number] = [pt.x - w / 2, pt.y - 9, pt.x + w / 2, pt.y + 9];
      if (boxes.some((o) => box[0] < o[2] && box[2] > o[0] && box[1] < o[3] && box[3] > o[1])) continue;
      boxes.push(box);
      if (++n > 160) break;
      const big = rank <= 1;
      L.marker([lat, lng], {
        pane: 'orte',
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'karte-ort',
          html: `<span class="${big ? 'gross' : rank === 6 ? 'teil' : ''}">${name.replace(/[<>&]/g, '')}</span>`,
          iconSize: [0, 0],
        }),
      }).addTo(labels);
    }
  };
  map.on('moveend zoomend', draw);
  draw();
  return () => {
    alive = false;
    map.off('moveend zoomend', draw);
  };
}

function eventIcon(p: MapPoint, icons: Map<string, string>) {
  const emoji = icons.get(p.categories[0]) ?? '✨';
  const cls = ['va-punkt', p.exact ? 'genau' : 'ungefaehr', p.featured ? 'empfohlen' : ''].join(' ');
  return L.divIcon({ className: '', html: `<div class="${cls}"><span>${emoji}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
}

function groupIcon(n: number, featured: boolean) {
  const size = n >= 100 ? 52 : n >= 10 ? 44 : 38;
  return L.divIcon({ className: '', html: `<div class="va-gruppe ${featured ? 'empfohlen' : ''}" style="width:${size}px;height:${size}px">${n}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

export function EventMap({
  center,
  filters,
  onPick,
  places,
  clusters,
  focus,
}: {
  center: { lat: number; lng: number } | null;
  filters: { cats: string[]; when: string };
  onPick: (p: MapPoint) => void;
  places?: any[];
  clusters?: any[];
  focus?: { lat: number; lng: number } | null;
}) {
  const { config } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const icons = new Map((config?.events?.categories ?? []).map((c) => [c.key, c.icon]));
  const iconsRef = useRef(icons);
  iconsRef.current = icons;

  const load = useRef<() => void>(() => {});
  load.current = async () => {
    const map = mapRef.current;
    if (!map || !layer.current) return;
    const b = map.getBounds();
    const f = filtersRef.current;
    const qs = new URLSearchParams({
      minLat: String(Math.max(-90, b.getSouth())),
      maxLat: String(Math.min(90, b.getNorth())),
      minLng: String(Math.max(-180, b.getWest())),
      maxLng: String(Math.min(180, b.getEast())),
      zoom: String(map.getZoom()),
      when: f.when,
      ...(f.cats.length ? { cats: f.cats.join(',') } : {}),
    });
    setLoading(true);
    try {
      const r = await api.get(`/api/events/map?${qs}`);
      layer.current.clearLayers();
      for (const g of r.groups) {
        L.marker([g.lat, g.lng], { icon: groupIcon(g.n, g.featured), title: t('UI-KARTE-GRUPPE', { zahl: g.n }), keyboard: true })
          .on('click', () => map.flyTo([g.lat, g.lng], Math.min(map.getZoom() + 3, 14), { duration: 0.6 }))
          .addTo(layer.current);
      }
      for (const p of r.points as MapPoint[]) {
        if (!p.exact) L.circle([p.lat, p.lng], { radius: 1000, color: '#5aa9ff', weight: 1, dashArray: '4 4', fillOpacity: 0.06, interactive: false }).addTo(layer.current);
        L.marker([p.lat, p.lng], { icon: eventIcon(p, iconsRef.current), title: p.title, keyboard: true, zIndexOffset: p.featured ? 500 : 0 })
          .on('click', () => pickRef.current(p))
          .addTo(layer.current);
      }
      setCount(r.points.length + r.groups.reduce((s: number, g: any) => s + g.n, 0));
    } catch {
      /* Netz weg: die letzten Punkte bleiben stehen */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ref.current) return;
    const start = focus ?? center ?? { lat: 51.2, lng: 10.4 };
    const map = L.map(ref.current, { zoomControl: false, attributionControl: true, minZoom: 4, maxZoom: config?.map.maxZoom ?? 16, worldCopyJump: false });
    map.setView([start.lat, start.lng], focus ? 13 : center ? 11 : 6);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    const cleanBase = addBaseLayer(map, config?.map);
    const people = L.layerGroup().addTo(map);
    for (const c of clusters ?? []) {
      L.circle([c.lat, c.lng], { radius: 350 + c.level * 150, color: '#5aa9ff', weight: 1, fillOpacity: 0.12, interactive: false }).addTo(people);
    }
    for (const p of places ?? []) {
      L.circleMarker([p.lat, p.lng], { radius: 5, color: p.confirmed ? '#5fd0a4' : '#9aa3b2', weight: 2, fillOpacity: 0.9, fillColor: '#191d25' })
        .bindTooltip(p.name)
        .addTo(people);
    }
    if (center) {
      L.circleMarker([center.lat, center.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#5aa9ff', fillOpacity: 1 }).addTo(map).bindTooltip(t('UI-HEUTE-DU'));
    }
    layer.current = L.layerGroup().addTo(map);
    let h: ReturnType<typeof setTimeout>;
    const onMove = () => {
      clearTimeout(h);
      h = setTimeout(() => load.current(), 250);
    };
    map.on('moveend', onMove);
    load.current();
    return () => {
      clearTimeout(h);
      cleanBase();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.map.tiles]);

  useEffect(() => {
    load.current();
  }, [filters.when, filters.cats.join(',')]);

  return (
    <div className="relative h-full">
      <div ref={ref} className="absolute inset-0 rounded-xl overflow-hidden border border-linie" role="application" aria-label={t('UI-HEUTE-KARTE')} />
      <div className="absolute top-2 left-2 z-[500] flex flex-col gap-1 pointer-events-none">
        <span className="rounded-full bg-grund/90 border border-linie px-3 py-1 text-xs">
          {loading ? t('UI-KARTE-LAEDT') : count === null ? '' : t('UI-KARTE-ANZAHL', { zahl: count })}
        </span>
      </div>
      {center && (
        <button
          className="absolute bottom-24 right-2 z-[500] w-10 h-10 grid place-items-center rounded-lg bg-flaeche border border-linie"
          onClick={() => mapRef.current?.flyTo([center.lat, center.lng], 12, { duration: 0.6 })}
          aria-label={t('UI-KARTE-ZU-MIR')}
        >
          <Icon name="pin" />
        </button>
      )}
      <div className="absolute bottom-2 left-2 z-[500] rounded-lg bg-grund/90 border border-linie px-2 py-1 text-[11px] flex gap-3 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-akzent bg-flaeche" /> {t('UI-KARTE-GENAU')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full border border-dashed border-akzent" /> {t('UI-KARTE-UNGEFAEHR')}
        </span>
      </div>
    </div>
  );
}

/** Stecknadel für öffentliche Veranstaltungsorte setzen (Issue #16/#17). */
export function PinPicker({ around, value, onChange }: { around: { lat: number; lng: number }; value: { lat: number; lng: number } | null; onChange: (p: { lat: number; lng: number } | null) => void }) {
  const { config } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const marker = useRef<L.Marker | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, { zoomControl: true, minZoom: 8, maxZoom: config?.map.maxZoom ?? 16 }).setView([value?.lat ?? around.lat, value?.lng ?? around.lng], 14);
    const clean = addBaseLayer(map, config?.map);
    const icon = L.divIcon({ className: '', html: '<div class="va-punkt genau"><span>📍</span></div>', iconSize: [36, 36], iconAnchor: [18, 18] });
    if (value) marker.current = L.marker([value.lat, value.lng], { icon }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      const p = { lat: Math.round(e.latlng.lat * 1e5) / 1e5, lng: Math.round(e.latlng.lng * 1e5) / 1e5 };
      if (marker.current) marker.current.setLatLng(e.latlng);
      else marker.current = L.marker(e.latlng, { icon }).addTo(map);
      cb.current(p);
    });
    return () => {
      clean();
      map.remove();
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [around.lat, around.lng]);
  return <div ref={ref} className="h-56 rounded-xl overflow-hidden border border-linie" role="application" aria-label={t('UI-VA-PIN')} />;
}

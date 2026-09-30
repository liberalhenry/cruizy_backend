/** Travel-Modus, Punkt verschieben und Reisen (Issue #18). */
import { useEffect, useState } from 'react';
import { Banner, Empty, Header, Icon, Page, Section, Toggle, useAsync } from '../components/ui';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { t } from '../lib/texts';

export interface PlaceHit {
  id: number;
  label: string;
  detail: string;
  kind: 'ort' | 'stadtteil';
  lat?: number;
  lng?: number;
}

/** Ortssuche im mitgelieferten Verzeichnis — nur Dörfer, Städte, Stadtteile. */
export function PlacePicker({ onPick, value }: { onPick: (p: PlaceHit | null) => void; value: PlaceHit | null }) {
  const [text, setText] = useState(value?.label ?? '');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [region, setRegion] = useState(false);
  useEffect(() => {
    if (value && text === value.label) return;
    if (text.trim().length < 2) {
      setHits([]);
      setRegion(false);
      return;
    }
    const h = setTimeout(() => {
      api
        .get(`/api/places-dir/search?q=${encodeURIComponent(text.trim())}`)
        .then((r) => {
          setHits(r.results);
          setRegion(r.region);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(h);
  }, [text, value]);
  return (
    <div>
      <input
        className="input"
        placeholder={t('UI-TRAVEL-ORT')}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (value) onPick(null);
        }}
        aria-label={t('UI-TRAVEL-ORT')}
      />
      {region && <p className="text-sm text-warn mt-1">{t('UI-TRAVEL-ZU-GROB', { ort: text.trim() })}</p>}
      {!value && hits.length > 0 && (
        <ul className="card mt-1 overflow-hidden" role="listbox">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                className="row hover:bg-flaeche2"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onPick(h);
                  setText(h.label);
                  setHits([]);
                }}
              >
                <span className="flex-1 py-2">
                  <span className="block">{h.label}</span>
                  <span className="block text-xs muted">{h.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!value && !region && text.trim().length >= 2 && hits.length === 0 && <p className="text-sm muted mt-1">{t('UI-TRAVEL-KEIN-ORT')}</p>}
      <p className="text-xs muted mt-1">{t('UI-TRAVEL-ORT-HINWEIS')}</p>
    </div>
  );
}

const DIRS = [
  { key: 'N', deg: 0 },
  { key: 'NO', deg: 45 },
  { key: 'O', deg: 90 },
  { key: 'SO', deg: 135 },
  { key: 'S', deg: 180 },
  { key: 'SW', deg: 225 },
  { key: 'W', deg: 270 },
  { key: 'NW', deg: 315 },
];

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: '2-digit' });

export function Reisen() {
  const { refreshMe, toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/travel'), []);
  const [travelPlace, setTravelPlace] = useState<PlaceHit | null>(null);
  const [dir, setDir] = useState(90);
  const [km, setKm] = useState(5);
  const [trip, setTrip] = useState<{ place: PlaceHit | null; from: string; to: string; public: boolean }>({ place: null, from: '', to: '', public: true });
  const [adding, setAdding] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const run = async (fn: () => Promise<unknown>, done?: () => void) => {
    try {
      await fn();
      done?.();
      reload();
      refreshMe();
    } catch (e) {
      toast(errText(e));
    }
  };
  if (!data) return <div className="min-h-screen"><Header title={t('UI-TRAVEL-TITEL')} back /></div>;
  const max = data.limits.shiftMaxKm;
  return (
    <div className="min-h-screen">
      <Header title={t('UI-TRAVEL-TITEL')} back />
      <Page>
        <Section title={t('UI-TRAVEL-MODUS')}>
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-sm muted">{t('UI-TRAVEL-MODUS-ERKL')}</p>
            {data.needsPlus && <Banner>{t('UI-TRAVEL-ABO')}</Banner>}
            {data.travel ? (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <Icon name="plane" className="w-5 h-5 text-warn" /> {t('UI-TRAVEL-AKTIV', { ort: data.travel.place })}
                </p>
                <button className="btn-secondary" onClick={() => run(() => api.del('/api/travel'))}>
                  {t('UI-TRAVEL-BEENDEN')}
                </button>
              </>
            ) : (
              <>
                <PlacePicker value={travelPlace} onPick={setTravelPlace} />
                <button className="btn-primary" disabled={!travelPlace} onClick={() => travelPlace && run(() => api.put('/api/travel', { placeId: travelPlace.id }), () => setTravelPlace(null))}>
                  {t('UI-TRAVEL-STARTEN')}
                </button>
              </>
            )}
          </div>
        </Section>

        <Section title={t('UI-VERSCHIEBEN')}>
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-sm muted">{t('UI-VERSCHIEBEN-ERKL', { km: max })}</p>
            {data.shifted && (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-gut">{t('UI-VERSCHIEBEN-AKTIV')}</span>
                <button className="btn-ghost" onClick={() => run(() => api.del('/api/location/shift'))}>
                  {t('UI-VERSCHIEBEN-ZURUECK')}
                </button>
              </div>
            )}
            <div>
              <p className="label">{t('UI-VERSCHIEBEN-RICHTUNG')}</p>
              <div className="grid grid-cols-3 gap-2 w-48 mx-auto" role="radiogroup">
                {[315, 0, 45, 270, -1, 90, 225, 180, 135].map((deg) =>
                  deg < 0 ? (
                    <span key="mitte" className="grid place-items-center text-2xl" aria-hidden="true">
                      📍
                    </span>
                  ) : (
                    <button
                      key={deg}
                      role="radio"
                      aria-checked={dir === deg}
                      className={`chip min-h-tap justify-center ${dir === deg ? 'border-akzent text-akzent' : ''}`}
                      onClick={() => setDir(deg)}
                      aria-label={t(`UI-RICHTUNG-${DIRS.find((d) => d.deg === deg)!.key}`)}
                    >
                      {DIRS.find((d) => d.deg === deg)!.key}
                    </button>
                  ),
                )}
              </div>
            </div>
            <label>
              <span className="label">{t('UI-VERSCHIEBEN-WEITE', { km })}</span>
              <input type="range" className="w-full accent-akzent" min={1} max={max} step={1} value={km} onChange={(e) => setKm(Number(e.target.value))} />
            </label>
            <button className="btn-secondary" onClick={() => run(() => api.put('/api/location/shift', { bearing: dir, km }))}>
              {t('UI-VERSCHIEBEN-SETZEN')}
            </button>
          </div>
        </Section>

        <Section title={t('UI-REISEN')}>
          <p className="text-sm muted mb-3">{t('UI-REISEN-ERKL', { tage: data.limits.soonDays })}</p>
          {data.trips.length === 0 && !adding && <Empty text={t('UI-REISEN-LEER')} />}
          <ul className="flex flex-col gap-2">
            {data.trips.map((tr: any) => (
              <li key={tr.id} className="card p-3 flex items-center gap-3">
                <Icon name="calendar" className="w-5 h-5 text-akzent" />
                <span className="flex-1">
                  <span className="block font-semibold">{tr.place}</span>
                  <span className="block text-sm muted">
                    {fmtDay(tr.from)} – {fmtDay(tr.to)}
                  </span>
                </span>
                <label className="text-xs flex items-center gap-1">
                  <input type="checkbox" className="accent-akzent" checked={tr.public} onChange={(e) => run(() => api.patch(`/api/trips/${tr.id}`, { public: e.target.checked }))} />
                  {t('UI-REISEN-OEFFENTLICH')}
                </label>
                <button className="btn-ghost px-2" onClick={() => run(() => api.del(`/api/trips/${tr.id}`))} aria-label={t('UI-APP-LOESCHEN')}>
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
          {adding ? (
            <div className="card p-4 mt-3 flex flex-col gap-3">
              <PlacePicker value={trip.place} onPick={(p) => setTrip({ ...trip, place: p })} />
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="label">{t('UI-REISEN-VON')}</span>
                  <input type="date" className="input" min={today} value={trip.from} onChange={(e) => setTrip({ ...trip, from: e.target.value, to: trip.to && trip.to < e.target.value ? e.target.value : trip.to })} />
                </label>
                <label>
                  <span className="label">{t('UI-REISEN-BIS')}</span>
                  <input type="date" className="input" min={trip.from || today} value={trip.to} onChange={(e) => setTrip({ ...trip, to: e.target.value })} />
                </label>
              </div>
              <Toggle checked={trip.public} onChange={(v) => setTrip({ ...trip, public: v })} label={t('UI-REISEN-OEFFENTLICH')} hint={t('UI-REISEN-OEFFENTLICH-ERKL')} />
              <button
                className="btn-primary"
                disabled={!trip.place || !trip.from || !trip.to}
                onClick={() =>
                  run(
                    () => api.post('/api/trips', { placeId: trip.place!.id, from: trip.from, to: trip.to, public: trip.public }),
                    () => {
                      setAdding(false);
                      setTrip({ place: null, from: '', to: '', public: true });
                    },
                  )
                }
              >
                {t('UI-REISEN-NEU')}
              </button>
            </div>
          ) : (
            <button className="btn-secondary w-full mt-3" onClick={() => setAdding(true)}>
              {t('UI-REISEN-NEU')}
            </button>
          )}
        </Section>
        <p className="text-xs muted">{t('UI-GEONAMES')}</p>
      </Page>
    </div>
  );
}

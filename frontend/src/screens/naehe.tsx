/** S10 Nähe · S11 Sortierung · S12 Filter · S13 Standortgenauigkeit · S14 Rechteabfrage Standort. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Choice, Empty, Header, Icon, Page, Sheet, Toggle } from '../components/ui';
import { Tile, TileSkeletonGrid, type TileData } from '../components/tile';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { BAND_TEXT, INTENTION_TEXT, fmtTime, t } from '../lib/texts';
import { reportPosition } from '../App';

type Sort = 'naehe' | 'antwortquote' | 'neu' | 'absicht';
interface Filters {
  bands?: number[];
  intentions?: string[];
  age?: { min: number; max: number };
}

const LEVEL_TEXT: Record<string, string> = { grob: 'UI-STUFE-GROB', nah: 'UI-STUFE-NAH', aus: 'UI-STUFE-AUS' };

function filterCount(f: Filters) {
  return (f.bands?.length ? 1 : 0) + (f.intentions?.length ? 1 : 0) + (f.age ? 1 : 0);
}

/** Kopfzeilen-Element S00.01: Standortstufe, Tipp öffnet S13. */
export function LocationChip({ onOpen }: { onOpen: () => void }) {
  const { me } = useApp();
  const level = me?.profile?.location?.level ?? 'grob';
  return (
    <button className="chip min-h-tap mr-2" onClick={onOpen} aria-label={t('ST-STO-01', { stufe: t(LEVEL_TEXT[level]) })}>
      <Icon name="pin" className="w-4 h-4" />
      <span className="text-xs">{t(LEVEL_TEXT[level])}</span>
    </button>
  );
}

export function Naehe() {
  const nav = useNavigate();
  const { me, config, online, refreshMe, toast } = useApp();
  const [data, setData] = useState<any | null>(null);
  const [stamp, setStamp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>(me?.profile?.settings?.sort ?? 'naehe');
  const [filters, setFilters] = useState<Filters>(me?.profile?.settings?.filters ?? {});
  const [sheet, setSheet] = useState<null | 'sort' | 'filter' | 'standort' | 'recht'>(null);
  const [page, setPage] = useState(0);
  const [locState, setLocState] = useState<string | null>(null);
  const asked = useRef(false);

  const load = useCallback(
    async (opts: { sort?: Sort; filters?: Filters; page?: number } = {}) => {
      setErr(null);
      try {
        const r = await api.post('/api/discovery', { sort: opts.sort ?? sort, filters: opts.filters ?? filters, page: opts.page ?? 0 });
        if ((opts.page ?? 0) > 0) setData((d: any) => ({ ...r, tiles: [...(d?.tiles ?? []), ...r.tiles] }));
        else {
          setData(r);
          idbSet('raster', { data: r, at: new Date().toISOString() });
          setStamp(null);
        }
      } catch (e) {
        setErr(errText(e));
        const cached = await idbGet<{ data: any; at: string }>('raster');
        if (cached && !data) {
          setData(cached.data);
          setStamp(cached.at);
        }
      }
    },
    [sort, filters, data],
  );

  // Standort: nur im Kontext und nur nach eigener Erklärung (S14)
  useEffect(() => {
    const loc = me?.profile?.location;
    if (!loc || asked.current) return;
    asked.current = true;
    if (loc.level === 'aus') {
      load();
      return;
    }
    const granted = localStorage.getItem('standort-ok') === '1';
    if (granted) {
      reportPosition().then((r) => {
        if (!r.ok && r.reason === 'abgelehnt') setLocState('abgelehnt');
        load();
      });
    } else if (!loc.hasLocation && !loc.cityId) {
      setSheet('recht');
      load();
    } else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const allowLocation = async () => {
    setSheet(null);
    const r = await reportPosition();
    if (r.ok) {
      localStorage.setItem('standort-ok', '1');
      setLocState(null);
    } else setLocState(r.reason === 'abgelehnt' ? 'abgelehnt' : 'fehlt');
    await refreshMe();
    load();
  };

  const tiles: TileData[] = data?.tiles ?? [];
  const far = data && data.radiusKm > 10 && !data.cityMode ? tiles.filter((x) => x.band === 4) : [];
  const near = far.length ? tiles.filter((x) => x.band !== 4) : tiles;

  const removeFilter = (k: keyof Filters) => {
    const f = { ...filters };
    delete f[k];
    setFilters(f);
    load({ filters: f });
  };

  return (
    <>
      <Header
        title={t('UI-TAB-NAEHE')}
        right={<LocationChip onOpen={() => setSheet('standort')} />}
        sub={
          <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
            <button className="chip min-h-tap shrink-0" onClick={() => setSheet('sort')}>
              <Icon name="sort" className="w-4 h-4" />
              {t('UI-NAEHE-SORTIERT', { sortierung: t(`UI-SORT-${sort.toUpperCase()}`) })}
            </button>
            {filters.bands?.length ? (
              <button className="chip min-h-tap shrink-0 border-akzent" onClick={() => removeFilter('bands')} aria-label={t('UI-FILTER-ENTFERNEN')}>
                {filters.bands.map((b) => t(BAND_TEXT[b])).join(', ')} ✕
              </button>
            ) : null}
            {filters.intentions?.length ? (
              <button className="chip min-h-tap shrink-0 border-akzent" onClick={() => removeFilter('intentions')} aria-label={t('UI-FILTER-ENTFERNEN')}>
                {filters.intentions.map((i) => (i === 'offen' ? t('ST-PRO-06') : t(INTENTION_TEXT[i]))).join(', ')} ✕
              </button>
            ) : null}
            {filters.age ? (
              <button className="chip min-h-tap shrink-0 border-akzent" onClick={() => removeFilter('age')} aria-label={t('UI-FILTER-ENTFERNEN')}>
                {filters.age.min}–{filters.age.max} ✕
              </button>
            ) : null}
            <button className="chip min-h-tap shrink-0" onClick={() => setSheet('filter')}>
              <Icon name="filter" className="w-4 h-4" />
              {t('UI-FILTER')}
            </button>
          </div>
        }
      />
      <Page>
        {config?.mode === 'test' && (
          <div className="mb-3">
            <Banner kind="warn">{t('UI-TESTBETRIEB-HINWEIS')}</Banner>
          </div>
        )}
        {me?.profile?.renewal && <RenewalBar renewal={me.profile.renewal} />}
        {err && online && (
          <div className="mb-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
        {stamp && <p className="text-xs muted mb-2">{t('UI-NAEHE-STAND', { uhrzeit: fmtTime(stamp) })}</p>}
        {locState === 'abgelehnt' && (
          <div className="mb-3">
            <Banner kind="warn">{t('ST-REC-06')}</Banner>
          </div>
        )}
        {!data ? (
          <TileSkeletonGrid />
        ) : data.needsLocation ? (
          <Empty
            text={t('ST-REC-05')}
            action={
              <div className="flex flex-col gap-2">
                <button className="btn-primary" onClick={() => setSheet('recht')}>
                  {t('ST-REC-03')}
                </button>
                <button className="btn-secondary" onClick={() => setSheet('standort')}>
                  {t('UI-NAEHE-STADT-WAEHLEN')}
                </button>
              </div>
            }
          />
        ) : (
          <>
            {data.noResultsWithFilters && (
              <div className="mb-3">
                <Banner
                  action={
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setFilters({});
                        load({ filters: {} });
                      }}
                    >
                      {t('UI-FILTER-ALLE-ENTFERNEN')}
                    </button>
                  }
                >
                  {t('ST-LEER-05')}
                </Banner>
              </div>
            )}
            {data.fewNearby && !data.noResultsWithFilters && <p className="mb-3 muted">{t('ST-LEER-01')}</p>}
            <div className="grid grid-cols-3 gap-2">
              {near.map((x) => (
                <Tile key={x.id} x={x} onClick={() => nav(`/profil/${x.id}`)} />
              ))}
            </div>
            {far.length > 0 && (
              <section className="mt-6">
                <h2 className="font-semibold">{t('ST-STO-14')}</h2>
                <p className="text-sm muted mb-3">{t('ST-STO-15')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {far.map((x) => (
                    <Tile key={x.id} x={x} onClick={() => nav(`/profil/${x.id}`)} />
                  ))}
                </div>
              </section>
            )}
            {data.hasMore && (
              <button
                className="btn-secondary w-full mt-4"
                onClick={() => {
                  const n = page + 1;
                  setPage(n);
                  load({ page: n });
                }}
              >
                {t('UI-APP-MEHR')}
              </button>
            )}
            {data.weekly?.length > 0 && (
              <section className="mt-6">
                <h2 className="font-semibold">{t('UI-NAEHE-WOCHENAKTIVE')}</h2>
                <p className="text-sm muted mb-3">{t('ST-LEER-03', { zahl: data.weekly.length })}</p>
                <ul className="card overflow-hidden">
                  {data.weekly.map((x: TileData & { activity?: number }) => (
                    <li key={x.id}>
                      <button className="row hover:bg-flaeche2" onClick={() => nav(`/profil/${x.id}`)}>
                        <span className="flex-1 py-2">
                          <span className="block">{x.name}</span>
                          <span className="block text-sm muted">{x.band ? t(BAND_TEXT[x.band]) : ''}</span>
                        </span>
                        <span className="muted">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(data.fewNearby || tiles.length === 0) && (
              <button className="card p-4 w-full text-left mt-6" onClick={() => nav('/heute')}>
                {t('ST-LEER-04')}
              </button>
            )}
          </>
        )}
      </Page>

      <SortSheet
        open={sheet === 'sort'}
        value={sort}
        responseEnabled={!!me?.profile?.responseRate?.enabled}
        onClose={() => setSheet(null)}
        onChange={(s) => {
          setSort(s);
          setSheet(null);
          setPage(0);
          load({ sort: s });
        }}
      />
      <FilterSheet
        open={sheet === 'filter'}
        value={filters}
        onClose={() => setSheet(null)}
        onApply={(f) => {
          setFilters(f);
          setSheet(null);
          setPage(0);
          load({ filters: f });
        }}
      />
      <LocationSheet
        open={sheet === 'standort'}
        onClose={() => {
          setSheet(null);
          load();
        }}
      />
      <Sheet open={sheet === 'recht'} onClose={() => setSheet(null)} title={t('ST-REC-01')}>
        <div className="flex flex-col gap-3">
          <Icon name="pin" className="w-8 h-8 text-akzent" />
          <p>{t('ST-REC-02')}</p>
          <button className="btn-primary" onClick={allowLocation}>
            {t('ST-REC-03')}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setSheet(null);
              toast(t('ST-REC-05'));
            }}
          >
            {t('ST-REC-04')}
          </button>
        </div>
      </Sheet>
    </>
  );
}

/** Erneuerungsleiste nach stillem Ablauf der Absicht (F14, ST-PRO-01). */
function RenewalBar({ renewal }: { renewal: { key: string; duration: string } }) {
  const { refreshMe } = useApp();
  return (
    <div className="mb-3">
      <Banner
        action={
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={async () => {
                await api.post('/api/profile/intention/renew').catch(() => {});
                refreshMe();
              }}
            >
              {t('UI-ABSICHT-ERNEUERN', { absicht: t(INTENTION_TEXT[renewal.key] ?? 'ST-PRO-06') })}
            </button>
            <button
              className="btn-ghost"
              onClick={async () => {
                await api.post('/api/profile/intention/dismiss').catch(() => {});
                refreshMe();
              }}
            >
              {t('UI-APP-NICHT-JETZT')}
            </button>
          </div>
        }
      >
        {t('ST-PRO-01').replace(/Wisch,?\s*/i, '')}
      </Banner>
    </div>
  );
}

function SortSheet({ open, value, responseEnabled, onClose, onChange }: { open: boolean; value: Sort; responseEnabled: boolean; onClose: () => void; onChange: (s: Sort) => void }) {
  const opts: { value: Sort; label: string; hint: string }[] = [
    { value: 'naehe', label: t('UI-SORT-NAEHE'), hint: t('UI-SORT-NAEHE-ERKL') },
    ...(responseEnabled ? [{ value: 'antwortquote' as Sort, label: t('UI-SORT-ANTWORTQUOTE'), hint: t('UI-SORT-ANTWORTQUOTE-ERKL') }] : []),
    { value: 'neu', label: t('UI-SORT-NEU'), hint: t('UI-SORT-NEU-ERKL') },
    { value: 'absicht', label: t('UI-SORT-ABSICHT'), hint: t('UI-SORT-ABSICHT-ERKL') },
  ];
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-SORT-TITEL')}>
      <Choice name="sort" value={value} onChange={onChange} options={opts} />
    </Sheet>
  );
}

function FilterSheet({ open, value, onClose, onApply }: { open: boolean; value: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const { config } = useApp();
  const [f, setF] = useState<Filters>(value);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);
  useEffect(() => {
    if (!open) return;
    const h = setTimeout(() => {
      api
        .post('/api/discovery/count', { filters: f })
        .then((r) => setCount(r.count))
        .catch(() => setCount(null));
    }, 150);
    return () => clearTimeout(h);
  }, [f, open]);
  const n = filterCount(f);
  const blocked = (k: keyof Filters) => n >= 2 && !(k === 'bands' ? f.bands?.length : k === 'intentions' ? f.intentions?.length : f.age);
  const toggle = (k: 'bands' | 'intentions', v: any) => {
    const arr = new Set<any>(f[k] ?? []);
    arr.has(v) ? arr.delete(v) : arr.add(v);
    const next = { ...f, [k]: [...arr] };
    if (!next[k]!.length) delete next[k];
    setF(next);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-FILTER')}>
      <p className="text-sm muted mb-4">{t('UI-FILTER-HOECHSTENS-ZWEI')}</p>
      {n >= 2 && (
        <div className="mb-3">
          <Banner kind="warn">{t('ST-FEH-61')}</Banner>
        </div>
      )}
      <fieldset className="mb-4" disabled={blocked('bands')}>
        <legend className="label">{t('UI-FILTER-ENTFERNUNG')}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((b) => (
            <button key={b} className={`chip min-h-tap ${f.bands?.includes(b) ? 'border-akzent text-akzent' : ''} disabled:opacity-40`} onClick={() => toggle('bands', b)} aria-pressed={!!f.bands?.includes(b)}>
              {t(BAND_TEXT[b])}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mb-4" disabled={blocked('intentions')}>
        <legend className="label">{t('UI-FILTER-ABSICHT')}</legend>
        <div className="flex flex-wrap gap-2">
          {[...(config?.intentions ?? []).map((i) => ({ key: i.key, label: t(i.textId) })), { key: 'offen', label: t('ST-PRO-06') }].map((i) => (
            <button key={i.key} className={`chip min-h-tap ${f.intentions?.includes(i.key) ? 'border-akzent text-akzent' : ''} disabled:opacity-40`} onClick={() => toggle('intentions', i.key)} aria-pressed={!!f.intentions?.includes(i.key)}>
              {i.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mb-4" disabled={blocked('age')}>
        <legend className="label">{t('UI-FILTER-ALTER')}</legend>
        <Toggle checked={!!f.age} onChange={(v) => setF(v ? { ...f, age: { min: 18, max: 99 } } : (({ age, ...rest }) => rest)(f))} label={t('UI-FILTER-ALTER-AN')} />
        {f.age && (
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="label">{t('UI-FILTER-VON')}</span>
              <input type="number" min={18} max={99} className="input" value={f.age.min} onChange={(e) => setF({ ...f, age: { ...f.age!, min: Math.max(18, Number(e.target.value) || 18) } })} />
              <input type="range" min={18} max={99} value={f.age.min} className="w-full accent-akzent" onChange={(e) => setF({ ...f, age: { ...f.age!, min: Number(e.target.value) } })} aria-hidden="true" />
            </label>
            <label className="flex-1">
              <span className="label">{t('UI-FILTER-BIS')}</span>
              <input type="number" min={18} max={120} className="input" value={f.age.max} onChange={(e) => setF({ ...f, age: { ...f.age!, max: Math.max(18, Number(e.target.value) || 18) } })} />
              <input type="range" min={18} max={99} value={Math.min(99, f.age.max)} className="w-full accent-akzent" onChange={(e) => setF({ ...f, age: { ...f.age!, max: Number(e.target.value) } })} aria-hidden="true" />
            </label>
          </div>
        )}
      </fieldset>
      <p className="mb-3" aria-live="polite">
        {count === null ? '…' : t('UI-FILTER-TREFFER', { zahl: count })}
      </p>
      {count === 0 && <p className="text-sm muted mb-3">{t('ST-LEER-05')}</p>}
      <div className="flex flex-col gap-2">
        <button className="btn-primary" onClick={() => onApply(f)}>
          {t('UI-FILTER-ANZEIGEN')}
        </button>
        <button className="btn-ghost" onClick={() => setF({})}>
          {t('UI-FILTER-ALLE-ENTFERNEN')}
        </button>
      </div>
    </Sheet>
  );
}

/** S13: Standortgenauigkeit und Zonen. Der Client erhält nie eine fremde Koordinate. */
export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refreshMe, toast } = useApp();
  const [loc, setLoc] = useState<any | null>(null);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [newZone, setNewZone] = useState(false);
  const reload = () => api.get('/api/location').then(setLoc).catch(() => {});
  useEffect(() => {
    if (!open) return;
    reload();
    api.get('/api/cities').then((r) => setCities(r.cities)).catch(() => {});
  }, [open]);

  const setLevel = async (level: string) => {
    try {
      await api.put('/api/location/level', { level });
      if (level !== 'aus' && localStorage.getItem('standort-ok') === '1') await reportPosition();
      await reload();
      await refreshMe();
    } catch (e) {
      toast(errText(e));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('ST-STO-02')}>
      {!loc ? (
        <p className="muted">…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <Choice
            name="stufe"
            value={loc.level}
            onChange={setLevel}
            options={[
              { value: 'grob', label: t('UI-STUFE-GROB'), hint: t('UI-STUFE-GROB-ERKL') },
              { value: 'nah', label: t('UI-STUFE-NAH'), hint: t('UI-STUFE-NAH-ERKL') },
              { value: 'aus', label: t('UI-STUFE-AUS'), hint: t('UI-STUFE-AUS-ERKL') },
            ]}
          />
          <p className="text-sm muted">{t('UI-STANDORT-ANDERE-SEHEN')}</p>
          {loc.level !== 'aus' && localStorage.getItem('standort-ok') !== '1' && (
            <button
              className="btn-secondary"
              onClick={async () => {
                const r = await reportPosition();
                if (r.ok) localStorage.setItem('standort-ok', '1');
                else toast(t(r.reason === 'abgelehnt' ? 'ST-REC-06' : 'ST-FEH-20'));
                reload();
                refreshMe();
              }}
            >
              {t('ST-REC-03')}
            </button>
          )}
          <div>
            <label className="label">{t('UI-STANDORT-STADT')}</label>
            <select
              className="input"
              value={loc.cityId ?? ''}
              onChange={async (e) => {
                await api.put('/api/location/level', { cityId: e.target.value || null });
                reload();
              }}
            >
              <option value="">—</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-sm muted mt-1">{t('UI-STANDORT-STADT-ERKL')}</p>
          </div>
          <section>
            <h3 className="font-semibold">{t('ST-STO-30')}</h3>
            <p className="text-sm muted mb-2">{t('ST-STO-31', { max: loc.limits.zonesMax })}</p>
            {loc.inZone && <p className="text-sm mb-2">{loc.invisible ? t('UI-ZONE-GERADE-UNSICHTBAR') : t('UI-ZONE-GERADE-ERSATZ')}</p>}
            <ul className="flex flex-col gap-2 mb-2">
              {loc.zones.map((z: any) => (
                <li key={z.id} className="card px-3 py-2 flex items-center gap-2">
                  <span className="flex-1">
                    {z.label || t('UI-ZONE')} · {z.radiusKm} km · {z.effect === 'unsichtbar' ? t('UI-ZONE-UNSICHTBAR') : t('UI-ZONE-ERSATZPUNKT')}
                  </span>
                  <button
                    className="btn-ghost px-2"
                    aria-label={t('UI-APP-LOESCHEN')}
                    onClick={async () => {
                      await api.del(`/api/zones/${z.id}`);
                      reload();
                    }}
                  >
                    <Icon name="trash" />
                  </button>
                </li>
              ))}
            </ul>
            {loc.zones.length < loc.limits.zonesMax && (
              <button className="btn-secondary w-full" onClick={() => setNewZone(true)}>
                {t('UI-ZONE-ANLEGEN')}
              </button>
            )}
            {newZone && (
              <ZoneEditor
                limits={loc.limits}
                onDone={() => {
                  setNewZone(false);
                  reload();
                  reportPosition();
                }}
              />
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}

function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function ZoneEditor({ limits, onDone }: { limits: any; onDone: () => void }) {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(limits.radius.min);
  const [effect, setEffect] = useState<'ersatzpunkt' | 'unsichtbar'>('ersatzpunkt');
  const [subst, setSubst] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr(t('ST-FEH-20')),
      { enableHighAccuracy: false, timeout: 15_000 },
    );
  const suggest = async () => {
    if (!center) return;
    const r = await api.post('/api/zones/suggest', center);
    setSubst(r.point);
  };
  useEffect(() => {
    if (center) suggest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  const save = async () => {
    setErr(null);
    try {
      await api.post('/api/zones', { center, radiusKm: radius, effect, subst: effect === 'ersatzpunkt' ? subst : null, label: label || null });
      onDone();
    } catch (e) {
      setErr(errText(e));
    }
  };

  return (
    <div className="card p-3 mt-3 flex flex-col gap-3">
      <p className="text-sm">{t('UI-ZONE-MITTE-ERKL')}</p>
      {!center ? (
        <button className="btn-secondary" onClick={locate}>
          {t('UI-ZONE-HIER')}
        </button>
      ) : (
        <p className="text-sm text-gut">{t('UI-ZONE-MITTE-GESETZT')}</p>
      )}
      <label>
        <span className="label">{t('UI-ZONE-RADIUS-LABEL', { km: radius })}</span>
        <input type="range" className="w-full accent-akzent" min={limits.radius.min} max={limits.radius.max} step={0.5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
      </label>
      <Choice
        name="wirkung"
        value={effect}
        onChange={setEffect}
        options={[
          { value: 'ersatzpunkt', label: t('UI-ZONE-ERSATZPUNKT'), hint: t('ST-STO-43') },
          ...(limits.invisibleAllowed ? [{ value: 'unsichtbar' as const, label: t('UI-ZONE-UNSICHTBAR'), hint: t('ST-STO-40') }] : []),
        ]}
      />
      {!limits.invisibleAllowed && <p className="text-xs muted">{t('ST-STO-40')}</p>}
      {effect === 'ersatzpunkt' && center && subst && (
        <div className="flex items-center gap-2">
          <p className="flex-1 text-sm">{t('UI-ZONE-ERSATZ-ABSTAND', { km: kmBetween(center, subst).toFixed(1) })}</p>
          <button className="btn-ghost" onClick={suggest}>
            {t('UI-ZONE-ANDERER-PUNKT')}
          </button>
        </div>
      )}
      <input className="input" placeholder={t('UI-ZONE-NAME')} maxLength={30} value={label} onChange={(e) => setLabel(e.target.value)} aria-label={t('UI-ZONE-NAME')} />
      {err && <Banner kind="error">{err}</Banner>}
      <button className="btn-primary" disabled={!center || (effect === 'ersatzpunkt' && !subst)} onClick={save}>
        {t('UI-APP-SPEICHERN')}
      </button>
    </div>
  );
}

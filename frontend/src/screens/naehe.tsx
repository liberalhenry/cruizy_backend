/** S10 Nähe · S11 Sortierung · S12 Filter · S13 Standortgenauigkeit · S14 Rechteabfrage Standort · Suche (Issue #20). */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Choice, Empty, Header, Icon, Page, Sheet, Toggle } from '../components/ui';
import { Tile, TileSkeletonGrid, type TileData } from '../components/tile';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { INTENTION_TEXT, fmtTime, t } from '../lib/texts';
import { reportPosition } from '../App';
import { CompletenessHint } from './extras';

type Sort = 'naehe' | 'antwortquote' | 'neu' | 'absicht';
interface Range {
  min: number;
  max: number;
}
export interface Filters {
  intentions?: string[];
  age?: Range;
  weight?: Range;
  height?: Range;
  bodyTypes?: string[];
  kinks?: string[];
  positions?: string[];
  responsive?: boolean;
  withPhoto?: boolean;
}
interface Grid {
  radiusKm: number;
  expand: boolean;
}
type GridTile = TileData & { section: number };
interface Section {
  index: number;
  km: number;
  prevKm: number | null;
}

const LEVEL_TEXT: Record<string, string> = { grob: 'UI-STUFE-GROB', nah: 'UI-STUFE-NAH', aus: 'UI-STUFE-AUS' };
const RADIUS_STOPS = [1, 2, 3, 5, 10, 15, 25, 50, 75, 100, 150, 200, 300];

/**
 * Seed der Rastersitzung (Issue #22): neu bei jedem Laden der Seite und nach 30 Minuten
 * ohne Aktivität — so mischt sich die Reihenfolge beim Wiederkommen, bleibt aber beim Scrollen stabil.
 */
let seed = Math.random().toString(36).slice(2, 12);
let seedUsedAt = Date.now();
function currentSeed(pauseMin: number) {
  if (Date.now() - seedUsedAt > pauseMin * 60_000) seed = Math.random().toString(36).slice(2, 12);
  seedUsedAt = Date.now();
  return seed;
}

export function filterCount(f: Filters) {
  return (
    (f.intentions?.length ? 1 : 0) +
    (f.age ? 1 : 0) +
    (f.weight ? 1 : 0) +
    (f.height ? 1 : 0) +
    (f.bodyTypes?.length ? 1 : 0) +
    (f.kinks?.length ? 1 : 0) +
    (f.positions?.length ? 1 : 0) +
    (f.responsive ? 1 : 0) +
    (f.withPhoto ? 1 : 0)
  );
}

/** Kopfzeilen-Element S00.01: Standortstufe, Tipp öffnet S13. */
export function LocationChip({ onOpen }: { onOpen: () => void }) {
  const { me } = useApp();
  const level = me?.profile?.location?.level ?? 'grob';
  const travel = me?.profile?.location?.travel;
  return (
    <button className={`chip min-h-tap mr-2 ${travel ? 'border-warn text-warn' : ''}`} onClick={onOpen} aria-label={t('ST-STO-01', { stufe: t(LEVEL_TEXT[level]) })}>
      <Icon name="pin" className="w-4 h-4" />
      <span className="text-xs truncate max-w-[7rem]">{travel ? travel.place : t(LEVEL_TEXT[level])}</span>
    </button>
  );
}

/** Kurzbeschreibung eines Filters für die Chips unter der Kopfzeile. */
function filterChips(f: Filters, config: any): { key: keyof Filters; label: string }[] {
  const out: { key: keyof Filters; label: string }[] = [];
  const names = (keys: string[] | undefined, list: { key: string; label?: string; name?: string }[] | undefined) =>
    (keys ?? []).map((k) => list?.find((x) => x.key === k)?.label ?? list?.find((x) => x.key === k)?.name ?? k).join(', ');
  if (f.intentions?.length) out.push({ key: 'intentions', label: f.intentions.map((i) => (i === 'offen' ? t('ST-PRO-06') : t(INTENTION_TEXT[i]))).join(', ') });
  if (f.age) out.push({ key: 'age', label: `${f.age.min}–${f.age.max} J.` });
  if (f.weight) out.push({ key: 'weight', label: `${f.weight.min}–${f.weight.max} kg` });
  if (f.height) out.push({ key: 'height', label: `${f.height.min}–${f.height.max} cm` });
  if (f.bodyTypes?.length) out.push({ key: 'bodyTypes', label: names(f.bodyTypes, config?.bodyTypes) });
  if (f.positions?.length) out.push({ key: 'positions', label: names(f.positions, config?.positions) });
  if (f.kinks?.length) out.push({ key: 'kinks', label: names(f.kinks, config?.kinks?.flatMap((g: any) => g.items)) });
  if (f.responsive) out.push({ key: 'responsive', label: t('UI-FILTER-ANTWORTET') });
  if (f.withPhoto) out.push({ key: 'withPhoto', label: t('UI-FILTER-MIT-FOTO') });
  return out;
}

export function Naehe() {
  const nav = useNavigate();
  const { me, config, online, refreshMe, toast } = useApp();
  const settings = me?.profile?.settings ?? {};
  const [data, setData] = useState<any | null>(null);
  const [tiles, setTiles] = useState<GridTile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stamp, setStamp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>(settings.sort ?? 'naehe');
  const [filters, setFilters] = useState<Filters>(() => {
    const { bands: _b, ...rest } = (settings.filters ?? {}) as Filters & { bands?: unknown };
    return rest;
  });
  const [grid, setGrid] = useState<Grid>({ radiusKm: settings.gridRadiusKm ?? 10, expand: settings.gridExpand ?? true });
  const [sheet, setSheet] = useState<null | 'sort' | 'filter' | 'standort' | 'recht' | 'umkreis'>(null);
  const [locState, setLocState] = useState<string | null>(null);
  const asked = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const pauseMin = data?.seedPauseMin ?? 30;

  const load = useCallback(
    async (opts: { sort?: Sort; filters?: Filters; grid?: Grid } = {}) => {
      setErr(null);
      try {
        const r = await api.post('/api/discovery', {
          sort: opts.sort ?? sort,
          filters: opts.filters ?? filters,
          grid: opts.grid ?? grid,
          seed: currentSeed(pauseMin),
        });
        setData(r);
        setTiles(r.tiles ?? []);
        setCursor(r.cursor ?? null);
        idbSet('raster', { data: r, at: new Date().toISOString() });
        setStamp(null);
      } catch (e) {
        setErr(errText(e));
        const cached = await idbGet<{ data: any; at: string }>('raster');
        if (cached && !data) {
          setData(cached.data);
          setTiles(cached.data.tiles ?? []);
          setCursor(null);
          setStamp(cached.at);
        }
      }
    },
    [sort, filters, grid, data, pauseMin],
  );

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      currentSeed(pauseMin);
      const r = await api.post('/api/discovery', { filters, cursor });
      if (r.expired) {
        await load();
        return;
      }
      setTiles((x) => [...x, ...r.tiles]);
      setCursor(r.cursor ?? null);
    } catch (e) {
      toast(errText(e));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, filters, load, toast, pauseMin]);

  // Nachladen beim Scrollen (Issue #22): Seiten zu 30, keine feste Höchstzahl
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore]);

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

  const removeFilter = (k: keyof Filters) => {
    const f = { ...filters };
    delete f[k];
    setFilters(f);
    load({ filters: f });
  };

  const sections: Section[] = data?.sections ?? [];
  const n = filterCount(filters);
  const chips = filterChips(filters, config);

  return (
    <>
      <Header
        title={t('UI-TAB-NAEHE')}
        right={
          <>
            <button className="btn-ghost px-2" onClick={() => nav('/suche')} aria-label={t('UI-SUCHE')}>
              <Icon name="search" />
            </button>
            <LocationChip onOpen={() => setSheet('standort')} />
          </>
        }
        sub={
          <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto">
            <button className="chip min-h-tap shrink-0" onClick={() => setSheet('umkreis')}>
              <Icon name="pin" className="w-4 h-4" />
              {t('UI-RASTER-RADIUS-WERT', { km: grid.radiusKm })}
            </button>
            <button className={`chip min-h-tap shrink-0 ${n ? 'border-akzent text-akzent' : ''}`} onClick={() => setSheet('filter')}>
              <Icon name="filter" className="w-4 h-4" />
              {t('UI-FILTER')}
              {n > 0 && <span className="rounded-full bg-akzent text-grund px-1.5 text-xs">{n}</span>}
            </button>
            <button className="chip min-h-tap shrink-0" onClick={() => setSheet('sort')}>
              <Icon name="sort" className="w-4 h-4" />
              {t(`UI-SORT-${sort.toUpperCase()}`)}
            </button>
            {chips.map((c) => (
              <button key={c.key} className="chip min-h-tap shrink-0 border-akzent max-w-[14rem]" onClick={() => removeFilter(c.key)} aria-label={`${t('UI-FILTER-ENTFERNEN')}: ${c.label}`}>
                <span className="truncate">{c.label}</span> ✕
              </button>
            ))}
          </div>
        }
      />
      <Page className="max-w-4xl">
        {config?.mode === 'test' && (
          <div className="mb-3">
            <Banner kind="warn">{t('UI-TESTBETRIEB-HINWEIS')}</Banner>
          </div>
        )}
        {me?.profile?.location?.travel && (
          <div className="mb-3">
            <Banner kind="warn" action={<button className="btn-secondary" onClick={() => nav('/ich/reisen')}>{t('UI-TRAVEL-BEENDEN')}</button>}>
              ✈ {t('UI-RASTER-TRAVEL', { ort: me.profile.location.travel.place })}
            </Banner>
          </div>
        )}
        <CompletenessHint />
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
            {data.soonNearby?.length > 0 && <Row title={t('UI-TRAVEL-BALD-REIHE')} tiles={data.soonNearby} onOpen={(id) => nav(`/profil/${id}`)} />}
            {data.newNearby?.length > 0 && <Row title={t('UI-RASTER-NEU-REIHE')} tiles={data.newNearby} onOpen={(id) => nav(`/profil/${id}`)} />}
            {tiles.length === 0 && !data.noResultsWithFilters && (
              <Empty
                text={t('UI-RASTER-LEER', { km: data.radiusKm })}
                action={
                  <button className="btn-secondary" onClick={() => setSheet('umkreis')}>
                    {t('UI-RASTER-LEER-ERWEITERN')}
                  </button>
                }
              />
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tiles.map((x, i) => {
                const sec = sections[x.section];
                const newSection = i > 0 && tiles[i - 1].section !== x.section;
                return (
                  <Fragment key={x.id}>
                    {(newSection || (i === 0 && x.section > 0)) && sec && (
                      <div className="col-span-3 sm:col-span-4 mt-4 mb-1 flex items-center gap-3" role="separator">
                        <span className="h-px flex-1 bg-linie" />
                        <span className="text-sm muted text-center">{t('UI-RASTER-TRENNER', { x: sec.prevKm ?? data.radiusKm, y: sec.km })}</span>
                        <span className="h-px flex-1 bg-linie" />
                      </div>
                    )}
                    <Tile x={x} onClick={() => nav(`/profil/${x.id}`)} />
                  </Fragment>
                );
              })}
            </div>
            <div ref={sentinel} className="h-8" />
            {loadingMore && <p className="text-center text-sm muted py-3">{t('UI-RASTER-LAEDT')}</p>}
            {!cursor && tiles.length > 0 && <p className="text-center text-sm muted py-3">{t('UI-RASTER-ENDE')}</p>}
            {(data.fewNearby || tiles.length === 0) && (
              <button className="card p-4 w-full text-left mt-4" onClick={() => nav('/heute')}>
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
          load({ sort: s });
        }}
      />
      <FilterSheet
        open={sheet === 'filter'}
        value={filters}
        grid={grid}
        onClose={() => setSheet(null)}
        onApply={(f) => {
          setFilters(f);
          setSheet(null);
          load({ filters: f });
        }}
      />
      <RadiusSheet
        open={sheet === 'umkreis'}
        value={grid}
        onClose={() => setSheet(null)}
        onApply={(g) => {
          setGrid(g);
          setSheet(null);
          load({ grid: g });
        }}
      />
      <LocationSheet
        open={sheet === 'standort'}
        onClose={() => {
          setSheet(null);
          refreshMe();
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

/** Waagerechte Reihe (z. B. „Neu in deiner Nähe“). */
function Row({ title, tiles, onOpen }: { title: string; tiles: TileData[]; onOpen: (id: string) => void }) {
  return (
    <section className="mb-5">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
        {tiles.map((x) => (
          <div key={x.id} className="w-28 shrink-0 snap-start">
            <Tile x={x} compact onClick={() => onOpen(x.id)} />
          </div>
        ))}
      </div>
    </section>
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

/** Umkreis und Erweiterung (Issue #22). */
function RadiusSheet({ open, value, onClose, onApply }: { open: boolean; value: Grid; onClose: () => void; onApply: (g: Grid) => void }) {
  const { config } = useApp();
  const [g, setG] = useState<Grid>(value);
  useEffect(() => {
    if (open) setG(value);
  }, [open, value]);
  const idx = Math.max(0, RADIUS_STOPS.findIndex((x) => x >= g.radiusKm));
  const min = config?.params.gridMin ?? 50;
  const cap = !g.expand ? g.radiusKm : g.radiusKm >= 150 ? g.radiusKm : g.radiusKm >= 100 ? 150 : 100;
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-RASTER-UMKREIS-TITEL')}>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="label">{t('UI-RASTER-RADIUS')}</span>
            <span className="text-2xl font-semibold text-akzent">{t('UI-RASTER-RADIUS-WERT', { km: g.radiusKm })}</span>
          </div>
          <input
            type="range"
            className="w-full accent-akzent"
            min={0}
            max={RADIUS_STOPS.length - 1}
            step={1}
            value={idx}
            onChange={(e) => setG({ ...g, radiusKm: RADIUS_STOPS[Number(e.target.value)] })}
            aria-valuetext={t('UI-RASTER-RADIUS-WERT', { km: g.radiusKm })}
            aria-label={t('UI-RASTER-RADIUS')}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {[5, 10, 25, 50, 100, 150].map((km) => (
              <button key={km} className={`chip min-h-tap ${g.radiusKm === km ? 'border-akzent text-akzent' : ''}`} onClick={() => setG({ ...g, radiusKm: km })}>
                {km} km
              </button>
            ))}
          </div>
          <p className="text-sm muted mt-2">{t('UI-RASTER-RADIUS-ERKL')}</p>
        </div>
        <Toggle checked={g.expand} onChange={(v) => setG({ ...g, expand: v })} label={t('UI-RASTER-ERWEITERN')} hint={t('UI-RASTER-ERWEITERN-ERKL', { zahl: min, km: cap })} />
        <button className="btn-primary" onClick={() => onApply(g)}>
          {t('UI-RASTER-ANWENDEN')}
        </button>
      </div>
    </Sheet>
  );
}

function RangeField({ label, value, bounds, unit, onChange }: { label: string; value: Range | undefined; bounds: Range; unit: string; onChange: (r: Range | undefined) => void }) {
  return (
    <fieldset className="mb-4">
      <legend className="label">{label}</legend>
      <Toggle checked={!!value} onChange={(v) => onChange(v ? { ...bounds } : undefined)} label={t('UI-FILTER-BEREICH-AN')} />
      {value && (
        <div className="flex gap-3 items-end">
          <label className="flex-1">
            <span className="label">{t('UI-FILTER-VON')}</span>
            <input type="number" min={bounds.min} max={bounds.max} className="input" value={value.min} onChange={(e) => onChange({ ...value, min: Math.max(bounds.min, Math.min(bounds.max, Number(e.target.value) || bounds.min)) })} />
          </label>
          <label className="flex-1">
            <span className="label">{t('UI-FILTER-BIS')}</span>
            <input type="number" min={bounds.min} max={bounds.max} className="input" value={value.max} onChange={(e) => onChange({ ...value, max: Math.max(bounds.min, Math.min(bounds.max, Number(e.target.value) || bounds.max)) })} />
          </label>
          <span className="muted pb-3">{unit}</span>
        </div>
      )}
    </fieldset>
  );
}

function ChipSet({ label, hint, options, value, onChange }: { label: string; hint?: string; options: { key: string; label: string }[]; value: string[] | undefined; onChange: (v: string[] | undefined) => void }) {
  const set = new Set(value ?? []);
  return (
    <fieldset className="mb-4">
      <legend className="label">{label}</legend>
      {hint && <p className="text-xs muted mb-1">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = set.has(o.key);
          return (
            <button
              key={o.key}
              className={`chip min-h-tap ${on ? 'border-akzent text-akzent' : ''}`}
              aria-pressed={on}
              onClick={() => {
                on ? set.delete(o.key) : set.add(o.key);
                onChange(set.size ? [...set] : undefined);
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Filter (S12, Issue #20) — dieselben Angaben wie im Profil. Gilt für Raster und Suche. */
export function FilterSheet({ open, value, grid, onClose, onApply, noCount }: { open: boolean; value: Filters; grid?: Grid; onClose: () => void; onApply: (f: Filters) => void; noCount?: boolean }) {
  const { config } = useApp();
  const [f, setF] = useState<Filters>(value);
  const [count, setCount] = useState<number | null>(null);
  const [kinksOpen, setKinksOpen] = useState(false);
  useEffect(() => {
    if (open) {
      setF(value);
      setKinksOpen(!!value.kinks?.length);
    }
  }, [open, value]);
  useEffect(() => {
    if (!open || noCount) return;
    const h = setTimeout(() => {
      api
        .post('/api/discovery/count', { filters: f, grid })
        .then((r) => setCount(r.count))
        .catch(() => setCount(null));
    }, 150);
    return () => clearTimeout(h);
  }, [f, open, grid, noCount]);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    const next = { ...f, [k]: v };
    if (v === undefined || v === false) delete next[k];
    setF(next);
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-FILTER')}>
      <ChipSet
        label={t('UI-FILTER-ABSICHT')}
        options={[...(config?.intentions ?? []).map((i) => ({ key: i.key, label: t(i.textId) })), { key: 'offen', label: t('ST-PRO-06') }]}
        value={f.intentions}
        onChange={(v) => set('intentions', v)}
      />
      <RangeField label={t('UI-FILTER-ALTER')} value={f.age} bounds={{ min: 18, max: 99 }} unit="J." onChange={(v) => set('age', v)} />
      <RangeField label={t('UI-FILTER-GEWICHT')} value={f.weight} bounds={{ min: 50, max: 130 }} unit="kg" onChange={(v) => set('weight', v)} />
      <RangeField label={t('UI-FILTER-GROESSE')} value={f.height} bounds={{ min: 155, max: 205 }} unit="cm" onChange={(v) => set('height', v)} />
      <ChipSet label={t('UI-FILTER-KOERPERTYP')} hint={t('UI-FILTER-ODER')} options={(config?.bodyTypes ?? []).map((b) => ({ key: b.key, label: b.label }))} value={f.bodyTypes} onChange={(v) => set('bodyTypes', v)} />
      <ChipSet label={t('UI-FILTER-POSITION')} hint={t('UI-FILTER-ODER')} options={config?.positions ?? []} value={f.positions} onChange={(v) => set('positions', v)} />
      <div className="mb-4">
        <button className="btn-ghost px-0" onClick={() => setKinksOpen(!kinksOpen)} aria-expanded={kinksOpen}>
          {t('UI-FILTER-KINKS')} {kinksOpen ? '▴' : '▾'}
        </button>
        {kinksOpen &&
          (config?.kinks ?? []).map((g) => (
            <ChipSet
              key={g.group}
              label={g.group}
              options={g.items.map((i) => ({ key: i.key, label: i.name }))}
              value={f.kinks?.filter((k) => g.items.some((i) => i.key === k))}
              onChange={(v) => {
                const others = (f.kinks ?? []).filter((k) => !g.items.some((i) => i.key === k));
                const all = [...others, ...(v ?? [])];
                set('kinks', all.length ? all : undefined);
              }}
            />
          ))}
      </div>
      <Toggle checked={!!f.responsive} onChange={(v) => set('responsive', v || undefined)} label={t('UI-FILTER-ANTWORTET')} />
      <Toggle checked={!!f.withPhoto} onChange={(v) => set('withPhoto', v || undefined)} label={t('UI-FILTER-MIT-FOTO')} />
      {!noCount && (
        <p className="my-3" aria-live="polite">
          {count === null ? '…' : t('UI-FILTER-TREFFER', { zahl: count })}
        </p>
      )}
      {count === 0 && !noCount && <p className="text-sm muted mb-3">{t('ST-LEER-05')}</p>}
      <div className="sticky bottom-0 bg-flaeche pt-2 flex flex-col gap-2">
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

/** Namenssuche (Issue #20): Name eintippen, dieselben Filter wie im Raster. */
export function Suche() {
  const nav = useNavigate();
  const { me } = useApp();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState<Filters>(() => {
    const { bands: _b, ...rest } = (me?.profile?.settings?.filters ?? {}) as Filters & { bands?: unknown };
    return rest;
  });
  const [res, setRes] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const min = 2;

  useEffect(() => {
    if ([...text.trim()].length < min) {
      setRes(null);
      return;
    }
    const h = setTimeout(() => {
      api
        .post('/api/search', { q: text.trim(), filters })
        .then((r) => {
          setRes(r);
          setErr(null);
        })
        .catch((e) => setErr(errText(e)));
    }, 250);
    return () => clearTimeout(h);
  }, [text, filters]);

  const n = filterCount(filters);
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-SUCHE-TITEL')}
        back
        sub={
          <div className="flex gap-2 px-4 pb-2">
            <input
              className="input flex-1"
              autoFocus
              type="search"
              placeholder={t('UI-SUCHE-PLATZHALTER')}
              value={text}
              maxLength={40}
              onChange={(e) => setText(e.target.value)}
              aria-label={t('UI-SUCHE-PLATZHALTER')}
            />
            <button className={`chip min-h-tap shrink-0 ${n ? 'border-akzent text-akzent' : ''}`} onClick={() => setFilterOpen(true)}>
              <Icon name="filter" className="w-4 h-4" />
              {n > 0 ? n : t('UI-FILTER')}
            </button>
          </div>
        }
      />
      <Page className="max-w-4xl">
        {err && <Banner kind="error">{err}</Banner>}
        {!res ? (
          <p className="text-sm muted">{[...text.trim()].length > 0 && [...text.trim()].length < min ? t('UI-SUCHE-ZU-KURZ', { zahl: min }) : t('UI-SUCHE-ERKL', { km: 150 })}</p>
        ) : res.needsLocation ? (
          <Empty text={t('ST-REC-05')} />
        ) : res.results.length === 0 ? (
          <Empty text={t('UI-SUCHE-KEINE', { km: res.maxKm })} />
        ) : (
          <>
            <p className="text-sm muted mb-2">{t('UI-SUCHE-TREFFER', { zahl: res.results.length })}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {res.results.map((x: TileData) => (
                <Tile key={x.id} x={x} onClick={() => nav(`/profil/${x.id}`)} />
              ))}
            </div>
          </>
        )}
      </Page>
      <FilterSheet
        open={filterOpen}
        value={filters}
        noCount
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}

/** S13: Standortgenauigkeit und Zonen. Der Client erhält nie eine fremde Koordinate. */
export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
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
          <button className="btn-secondary" onClick={() => (onClose(), nav('/ich/reisen'))}>
            ✈ {t('UI-TRAVEL-TITEL')}
          </button>
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

/**
 * S40/S41 Heute (Issue #15): Veranstaltungen mit Umkreis, Zeitraum, Kategorien, „bald“ oder „nah“,
 * empfohlene Veranstaltungen von Cruizy, heute geöffnete Orte, Karte (Issue #17).
 * S42 Ort · S43 Veranstaltung mit Zusage, Anfrage, Absagefrist, Chat mit dem Veranstalter (Issue #16).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Empty, Header, Icon, Page, Sheet, Skeleton, useAsync } from '../components/ui';
import { EventMap, type MapPoint } from '../components/karte';
import { ReportSheet } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { on } from '../lib/realtime';
import { fmtDate, fmtKm, fmtTime, t } from '../lib/texts';
import { LocationChip, LocationSheet } from './naehe';

const DAYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
const DAY_TEXT: Record<string, string> = { mo: 'UI-TAG-MO', di: 'UI-TAG-DI', mi: 'UI-TAG-MI', do: 'UI-TAG-DO', fr: 'UI-TAG-FR', sa: 'UI-TAG-SA', so: 'UI-TAG-SO' };
const WHEN = ['alle', 'heute', 'morgen', 'wochenende', '7tage', '30tage'] as const;
type When = (typeof WHEN)[number];

function kindLabel(kind: string) {
  const id = `UI-ORT-ART-${kind.toUpperCase()}`;
  const s = t(id);
  return s === id ? kind : s;
}

function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* privates Fenster */
  }
}

export function useCategories() {
  const { config } = useApp();
  const list = config?.events?.categories ?? [];
  return useMemo(() => ({ list, icon: (k: string) => list.find((c) => c.key === k)?.icon ?? '✨', label: (k: string) => list.find((c) => c.key === k)?.label ?? k }), [list]);
}

/** Datum als Überschrift: „Heute“, „Morgen“, sonst „Sa., 4. Okt.“ */
function dayHeading(d: string) {
  const x = new Date(d);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400_000);
  if (x.toDateString() === today.toDateString() || x < today) return t('UI-HEUTE-HEUTE');
  if (x.toDateString() === tomorrow.toDateString()) return t('UI-HEUTE-MORGEN');
  return x.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function DateBlock({ d }: { d: string }) {
  const x = new Date(d);
  return (
    <span className="w-14 shrink-0 rounded-lg bg-flaeche2 border border-linie flex flex-col items-center justify-center py-1.5 leading-tight">
      <span className="text-[11px] uppercase text-akzent font-semibold">{x.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')}</span>
      <span className="text-xl font-bold">{x.getDate()}</span>
      <span className="text-[11px] muted">{x.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')}</span>
    </span>
  );
}

function StatusBadge({ e }: { e: any }) {
  if (e.cancelled) return <span className="rounded-full bg-gefahr/15 text-gefahr px-2 py-0.5 text-xs">{t('UI-EREIGNIS-ABGESAGT')}</span>;
  if (e.isHost) return <span className="rounded-full bg-akzent/15 text-akzent px-2 py-0.5 text-xs">{t('UI-VA-DEINE')}</span>;
  if (e.myStatus === 'angenommen') return <span className="rounded-full bg-gut/15 text-gut px-2 py-0.5 text-xs">✓ {t('UI-VA-DABEI')}</span>;
  if (e.myStatus === 'angefragt') return <span className="rounded-full bg-warn/15 text-warn px-2 py-0.5 text-xs">{t('UI-VA-ANGEFRAGT')}</span>;
  if (e.spotsLeft === 0) return <span className="rounded-full bg-flaeche2 muted px-2 py-0.5 text-xs">{t('UI-VA-AUSGEBUCHT')}</span>;
  return null;
}

function Spots({ e }: { e: any }) {
  if (e.spotsLeft === null || e.spotsLeft === undefined || e.cancelled) return null;
  const low = e.spotsLeft > 0 && e.spotsLeft <= Math.max(5, e.capacity * 0.1);
  return <span className={low ? 'text-warn' : ''}>{e.spotsLeft > 0 ? t('UI-VA-PLAETZE-FREI', { frei: e.spotsLeft, gesamt: e.capacity }) : t('UI-VA-AUSGEBUCHT')}</span>;
}

/** Liste: Datum links, Titel, Ort, Entfernung, Kategorien, Plätze. */
export function EventRow({ e, showKm = true }: { e: any; showKm?: boolean }) {
  const nav = useNavigate();
  const cats = useCategories();
  return (
    <button className="card w-full text-left flex gap-3 p-3 hover:bg-flaeche2 transition" onClick={() => nav(`/ereignisse/${e.id}`)}>
      {e.cover ? (
        <span className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-flaeche2">
          <img src={e.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-center text-[11px] py-0.5">{new Date(e.startsAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
        </span>
      ) : (
        <DateBlock d={e.startsAt} />
      )}
      <span className="flex-1 min-w-0">
        <span className={`block font-semibold leading-snug ${e.cancelled ? 'line-through muted' : ''}`}>{e.title}</span>
        <span className="block text-sm muted truncate">
          {fmtTime(e.startsAt)} · {e.place?.name ?? e.area ?? ''}
          {showKm && e.km !== null && e.km !== undefined ? ` · ${fmtKm(e.km)}` : ''}
        </span>
        <span className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
          {(e.categories ?? []).slice(0, 3).map((c: string) => (
            <span key={c} className="rounded-full bg-flaeche2 border border-linie px-2 py-0.5">
              {cats.icon(c)} {cats.label(c)}
            </span>
          ))}
          <StatusBadge e={e} />
        </span>
        <span className="flex flex-wrap gap-x-3 mt-1 text-xs muted">
          {e.organizer && (
            <span>
              {e.organizer.name}
              {e.organizer.verified && <span className="text-akzent"> ✓</span>}
            </span>
          )}
          <Spots e={e} />
          {e.price && <span>{e.price}</span>}
        </span>
      </span>
    </button>
  );
}

/** Große Karte für empfohlene Veranstaltungen. */
function FeaturedCard({ e }: { e: any }) {
  const nav = useNavigate();
  const cats = useCategories();
  return (
    <button className="relative w-full h-56 rounded-2xl overflow-hidden text-left border border-[#f5c451]/40 shadow-lg" onClick={() => nav(`/ereignisse/${e.id}`)}>
      {e.cover ? <img src={e.cover} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 bg-gradient-to-br from-akzentdunkel to-grund" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <span className="absolute top-3 left-3 rounded-full bg-[#f5c451] text-grund text-xs font-semibold px-2.5 py-1">★ {t('UI-VA-EMPFOHLEN')}</span>
      <span className="absolute top-3 right-3 rounded-lg bg-black/60 px-2 py-1 text-center leading-tight">
        <span className="block text-[11px] uppercase text-[#f5c451]">{new Date(e.startsAt).toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')}</span>
        <span className="block text-lg font-bold">{new Date(e.startsAt).getDate()}</span>
      </span>
      <span className="absolute bottom-0 inset-x-0 p-4">
        <span className="block text-xl font-bold leading-tight">{e.title}</span>
        <span className="block text-sm text-white/80 mt-1">
          {e.categories.map((c: string) => cats.icon(c)).join(' ')} {fmtTime(e.startsAt)} · {e.area ?? e.place?.name}
          {e.km !== null && e.km !== undefined ? ` · ${fmtKm(e.km)}` : ''}
        </span>
        <span className="flex gap-3 text-xs text-white/80 mt-1">
          {e.organizer && <span>{t('UI-VA-VON', { name: e.organizer.name })}</span>}
          <Spots e={e} />
        </span>
      </span>
    </button>
  );
}

function RadiusSheet({ open, onClose, value, onPick }: { open: boolean; onClose: () => void; value: number; onPick: (km: number) => void }) {
  const { config } = useApp();
  const radii = config?.events?.radii ?? [5, 10, 25, 50, 100, 250, 500, 1000];
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-HEUTE-UMKREIS')}>
      <p className="text-sm muted mb-3">{t('UI-HEUTE-UMKREIS-ERKL')}</p>
      <div className="grid grid-cols-4 gap-2" role="radiogroup">
        {radii.map((km) => (
          <button
            key={km}
            role="radio"
            aria-checked={value === km}
            className={`chip justify-center min-h-tap ${value === km ? 'border-akzent text-akzent bg-akzent/10' : ''}`}
            onClick={() => {
              onPick(km);
              onClose();
            }}
          >
            {km >= 1000 ? t('UI-HEUTE-DACH') : fmtKm(km)}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function CategorySheet({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: string[]; onChange: (v: string[]) => void }) {
  const cats = useCategories();
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-VA-KATEGORIEN')}>
      <div className="flex flex-wrap gap-2">
        {cats.list.map((c) => {
          const on = value.includes(c.key);
          return (
            <button
              key={c.key}
              aria-pressed={on}
              className={`chip min-h-tap ${on ? 'border-akzent text-akzent bg-akzent/10' : ''}`}
              onClick={() => onChange(on ? value.filter((x) => x !== c.key) : [...value, c.key])}
            >
              {c.icon} {c.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-secondary flex-1" onClick={() => onChange([])}>
          {t('UI-HEUTE-ALLE-KATEGORIEN')}
        </button>
        <button className="btn-primary flex-1" onClick={onClose}>
          {t('UI-APP-ERLEDIGT')}
        </button>
      </div>
    </Sheet>
  );
}

// ─────────────────────────── S40/S41 ───────────────────────────

export function Heute() {
  const nav = useNavigate();
  const loc = useLocation();
  const { config } = useApp();
  const focus = (loc.state as { focus?: { lat: number; lng: number } } | null)?.focus ?? null;
  const [view, setView] = useState<'liste' | 'karte'>(() => (focus ? 'karte' : readPref('heute-ansicht', 'liste')));
  const [sort, setSort] = useState<'bald' | 'naehe'>(() => readPref('heute-sort', 'bald'));
  const [when, setWhen] = useState<When>(() => readPref('heute-wann', 'alle'));
  const [cats, setCats] = useState<string[]>(() => readPref('heute-kategorien', []));
  const [radius, setRadius] = useState<number | null>(() => readPref('heute-umkreis', null));
  const [sheet, setSheet] = useState<'umkreis' | 'kategorien' | 'ort' | null>(null);
  const [today, setToday] = useState<any | null>(null);
  const [list, setList] = useState<any | null>(null);
  const [more, setMore] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<MapPoint | null>(null);

  useEffect(() => writePref('heute-ansicht', view), [view]);
  useEffect(() => writePref('heute-sort', sort), [sort]);
  useEffect(() => writePref('heute-wann', when), [when]);
  useEffect(() => writePref('heute-kategorien', cats), [cats]);
  useEffect(() => writePref('heute-umkreis', radius), [radius]);

  const loadToday = useCallback(async () => {
    try {
      const r = await api.get('/api/today');
      setToday(r);
      idbSet('heute', r);
    } catch {
      const c = await idbGet('heute');
      if (c) setToday(c);
    }
  }, []);

  const query = useCallback(
    (offset: number) => {
      const qs = new URLSearchParams({ sort, when, offset: String(offset) });
      if (radius) qs.set('radius', String(radius));
      if (cats.length) qs.set('cats', cats.join(','));
      return api.get(`/api/events?${qs}`);
    },
    [sort, when, radius, cats],
  );

  const loadList = useCallback(async () => {
    try {
      const r = await query(0);
      setList(r);
      setMore([]);
      setErr(null);
      if (!r.hasRef) idbSet('heute-liste', r);
    } catch (e) {
      setErr(errText(e));
      const c = await idbGet('heute-liste');
      if (c) setList(c);
    }
  }, [query]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);
  useEffect(() => {
    loadList();
  }, [loadList]);

  const next = list ? (more.length ? more[more.length - 1].next : list.next) : null;
  const events: any[] = [...(list?.events ?? []), ...more.flatMap((m) => m.events)];
  const open = (today?.places ?? []).filter((p: any) => p.openToday);
  const effRadius = radius ?? list?.radius ?? config?.events?.radius ?? 50;

  const groups = useMemo(() => {
    if (sort !== 'bald') return [{ heading: null as string | null, items: events }];
    const out: { heading: string | null; items: any[] }[] = [];
    for (const e of events) {
      const h = dayHeading(e.startsAt);
      if (!out.length || out[out.length - 1].heading !== h) out.push({ heading: h, items: [] });
      out[out.length - 1].items.push(e);
    }
    return out;
  }, [events, sort]);

  const filterBar = (
    <div className="scroll-x flex gap-2 px-4 pb-2">
      <button className={`chip min-h-tap shrink-0 ${radius ? 'border-akzent text-akzent' : ''}`} onClick={() => setSheet('umkreis')} aria-label={t('UI-HEUTE-UMKREIS')}>
        <Icon name="pin" className="w-4 h-4" />
        {effRadius >= 1000 ? t('UI-HEUTE-DACH') : fmtKm(effRadius)} ▾
      </button>
      <button className={`chip min-h-tap shrink-0 ${cats.length ? 'border-akzent text-akzent' : ''}`} onClick={() => setSheet('kategorien')}>
        <Icon name="filter" className="w-4 h-4" />
        {cats.length ? t('UI-HEUTE-KATEGORIEN-N', { zahl: cats.length }) : t('UI-VA-KATEGORIEN')} ▾
      </button>
      {view === 'liste' && (
        <button className="chip min-h-tap shrink-0" onClick={() => setSort(sort === 'bald' ? 'naehe' : 'bald')} aria-label={t('UI-HEUTE-SORTIERUNG')}>
          <Icon name="sort" className="w-4 h-4" />
          {t(sort === 'bald' ? 'UI-HEUTE-BALD' : 'UI-HEUTE-NAH')}
        </button>
      )}
      <span className="w-px bg-linie shrink-0 my-1" />
      {WHEN.map((w) => (
        <button key={w} aria-pressed={when === w} className={`chip min-h-tap shrink-0 ${when === w ? 'border-akzent text-akzent bg-akzent/10' : ''}`} onClick={() => setWhen(w)}>
          {t(`UI-HEUTE-WANN-${w.toUpperCase()}`)}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Header
        title={t('ST-HEU-01')}
        right={
          <>
            <LocationChip onOpen={() => setSheet('ort')} />
            <button className="btn-ghost px-2" onClick={() => nav('/veranstalter')} aria-label={t('UI-VA-EINTRAGEN')}>
              <Icon name="plus" />
            </button>
          </>
        }
        sub={
          <>
            <div className="flex gap-1 mx-4 mb-2 p-1 rounded-xl bg-flaeche2 border border-linie" role="tablist">
              {(['liste', 'karte'] as const).map((v) => (
                <button key={v} role="tab" aria-selected={view === v} className={`flex-1 rounded-lg min-h-[40px] flex items-center justify-center gap-2 text-sm ${view === v ? 'bg-akzent text-grund font-semibold' : 'muted'}`} onClick={() => setView(v)}>
                  <Icon name={v === 'karte' ? 'map' : 'list'} className="w-4 h-4" />
                  {t(v === 'karte' ? 'UI-HEUTE-KARTE' : 'UI-HEUTE-ENTDECKEN')}
                </button>
              ))}
            </div>
            {filterBar}
          </>
        }
      />
      {view === 'karte' ? (
        <div className="px-3 pt-3" style={{ height: 'calc(100dvh - 250px)', minHeight: 360 }}>
          <EventMap center={today?.center ?? null} focus={focus} filters={{ cats, when }} onPick={setPreview} places={today?.places} clusters={today?.clusters} />
        </div>
      ) : (
        <Page>
          {err && !list && <Banner kind="error">{err}</Banner>}
          {list && !list.hasRef && (
            <div className="mb-4">
              <Banner action={<button className="btn-ghost" onClick={() => setSheet('ort')}>{t('UI-HEUTE-ORT-WAEHLEN')}</button>}>{t('UI-HEUTE-OHNE-ORT')}</Banner>
            </div>
          )}
          {list?.travel && <p className="text-sm text-warn mb-3">✈ {t('UI-HEUTE-TRAVEL')}</p>}

          {list?.featured?.length > 0 && (
            <section className="mb-6 flex flex-col gap-3">
              {list.featured.map((e: any) => (
                <FeaturedCard key={e.id} e={e} />
              ))}
            </section>
          )}

          {open.length > 0 && (when === 'alle' || when === 'heute') && (
            <section className="mb-6">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gut" /> {t('UI-HEUTE-OFFEN')}
              </h2>
              <div className="scroll-x flex gap-2 -mx-4 px-4">
                {open.map((p: any) => (
                  <button key={p.id} className="card shrink-0 w-44 p-3 text-left hover:bg-flaeche2" onClick={() => nav(`/orte/${p.id}`)}>
                    <span className="block font-semibold truncate">
                      {p.name} {p.confirmed && <span className="text-akzent">✓</span>}
                    </span>
                    <span className="block text-xs muted truncate">
                      {kindLabel(p.kind)} · {p.district}
                    </span>
                    <span className="block text-xs mt-1">
                      {p.hoursToday?.length ? p.hoursToday.map((s: string[]) => s.join('–')).join(', ') : ''}
                      {p.km !== null && p.km !== undefined ? ` · ${fmtKm(p.km)}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!list ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : events.length === 0 && !list.featured.length ? (
            <Empty
              text={t('UI-HEUTE-LEER')}
              action={
                <div className="flex flex-col gap-2">
                  {radius !== 1000 && (
                    <button className="btn-secondary" onClick={() => setRadius(Math.min(1000, (effRadius || 50) * 2))}>
                      {t('UI-HEUTE-UMKREIS-GROESSER')}
                    </button>
                  )}
                  {(cats.length > 0 || when !== 'alle') && (
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setCats([]);
                        setWhen('alle');
                      }}
                    >
                      {t('UI-HEUTE-FILTER-WEG')}
                    </button>
                  )}
                </div>
              }
            />
          ) : (
            groups.map((g, i) => (
              <section key={`${g.heading}-${i}`} className="mb-5">
                {g.heading && <h2 className="font-semibold mb-2 capitalize">{g.heading}</h2>}
                <div className="flex flex-col gap-2">
                  {g.items.map((e) => (
                    <EventRow key={e.id} e={e} />
                  ))}
                </div>
              </section>
            ))
          )}
          {next !== null && next !== undefined && (
            <button className="btn-secondary w-full" onClick={async () => setMore([...more, await query(next)])}>
              {t('UI-APP-MEHR')}
            </button>
          )}

          <Link to="/veranstalter" className="card mt-6 p-4 flex items-center gap-3 hover:bg-flaeche2">
            <span className="text-2xl" aria-hidden="true">
              🎟️
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{t('UI-VA-DU-VERANSTALTEST')}</span>
              <span className="block text-sm muted">{t('UI-VA-DU-VERANSTALTEST-ERKL')}</span>
            </span>
            <span className="muted">›</span>
          </Link>
          <p className="text-xs muted mt-4">{t('UI-VA-HAFTUNG')}</p>
        </Page>
      )}

      <Sheet open={!!preview} onClose={() => setPreview(null)} title={preview?.title}>
        {preview && <MapPreview id={preview.id} />}
      </Sheet>
      <RadiusSheet open={sheet === 'umkreis'} onClose={() => setSheet(null)} value={effRadius} onPick={setRadius} />
      <CategorySheet open={sheet === 'kategorien'} onClose={() => setSheet(null)} value={cats} onChange={setCats} />
      <LocationSheet
        open={sheet === 'ort'}
        onClose={() => {
          setSheet(null);
          loadToday();
          loadList();
        }}
      />
    </>
  );
}

function MapPreview({ id }: { id: string }) {
  const nav = useNavigate();
  const { data } = useAsync(() => api.get(`/api/events/${id}`), [id]);
  const cats = useCategories();
  if (!data) return <Skeleton className="h-24" />;
  const e = data.event;
  return (
    <div className="flex flex-col gap-3">
      {e.images[0] && <img src={e.images[0].url} alt="" className="w-full h-36 object-cover rounded-xl" />}
      <p className="text-sm">
        {fmtDate(e.startsAt, true)} · {e.place?.name ?? e.area}
        {e.km !== null ? ` · ${fmtKm(e.km)}` : ''}
      </p>
      <p className="text-sm">{e.categories.map((c: string) => `${cats.icon(c)} ${cats.label(c)}`).join(' · ')}</p>
      {!e.point?.exact && <p className="text-xs muted">{t('UI-VA-LAGE-UNGEFAEHR')}</p>}
      <button className="btn-primary" onClick={() => nav(`/ereignisse/${id}`)}>
        {t('UI-VA-DETAILS')}
      </button>
    </div>
  );
}

// ─────────────────────────── S43 · Veranstaltung ───────────────────────────

export function Ereignis() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const cats = useCategories();
  const { data, error, reload } = useAsync(() => api.get(`/api/events/${id}`), [id]);
  const [group, setGroup] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [report, setReport] = useState(false);
  const [info, setInfo] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const e = data?.event;

  const rsvp = async (yes: boolean) => {
    try {
      if (yes) {
        const r = await api.post(`/api/events/${id}/rsvp`, {});
        toast(t(r.status === 'angefragt' ? 'UI-VA-ANFRAGE-GESENDET' : 'UI-VA-ZUGESAGT'));
      } else {
        await api.del(`/api/events/${id}/rsvp`);
        setConfirmCancel(false);
      }
      reload();
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'alterspruefung_noetig' || err.code === 'vertrag_noetig')) nav(`/pruefung?weiter=/ereignisse/${id}`);
      else toast(errText(err));
      reload();
    }
  };

  if (group) return <Gruppe id={id!} title={e?.title} onBack={() => setGroup(false)} />;

  const deadline = e?.cancelUntil ? new Date(e.cancelUntil) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={e?.title ?? ''}
        back
        right={
          e && !data.isHost ? (
            <button className="btn-ghost px-2" onClick={() => setReport(true)} aria-label={t('ST-MEL-01')}>
              <Icon name="more" />
            </button>
          ) : undefined
        }
      />
      {error && (
        <Page>
          <Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner>
        </Page>
      )}
      {!e && !error && (
        <Page>
          <Skeleton className="h-56" />
        </Page>
      )}
      {e && (
        <>
          {/* Bilder */}
          <div className="relative max-w-2xl mx-auto w-full">
            {e.images.length ? (
              <>
                <div
                  className="scroll-x flex snap-x snap-mandatory"
                  onScroll={(ev) => {
                    const el = ev.currentTarget;
                    setImgIdx(Math.round(el.scrollLeft / el.clientWidth));
                  }}
                >
                  {e.images.map((im: any) => (
                    <img key={im.id} src={im.url} alt="" className="w-full shrink-0 snap-center aspect-[3/2] object-cover" />
                  ))}
                </div>
                {e.images.length > 1 && (
                  <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
                    {e.images.map((im: any, i: number) => (
                      <span key={im.id} className={`w-2 h-2 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-[3/1] bg-gradient-to-br from-akzentdunkel/60 to-flaeche grid place-items-center text-5xl" aria-hidden="true">
                {e.categories.map((c: string) => cats.icon(c)).join(' ')}
              </div>
            )}
            {e.featured && <span className="absolute top-3 left-3 rounded-full bg-[#f5c451] text-grund text-xs font-semibold px-2.5 py-1">★ {t('UI-VA-EMPFOHLEN')}</span>}
          </div>

          <Page className="flex-1">
            {data.isHost && (
              <div className="mb-4">
                <Banner
                  kind={e.pending ? 'warn' : 'info'}
                  action={
                    <button className="btn-ghost" onClick={() => nav(`/veranstalter/veranstaltungen/${id}`)}>
                      {t('UI-VA-VERWALTEN')}
                    </button>
                  }
                >
                  {e.pending ? t('UI-VA-IN-PRUEFUNG') : e.rejected ? t('UI-VA-NICHT-FREIGEGEBEN') : t('UI-VA-DEINE-ERKL')}
                </Banner>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {e.categories.map((c: string) => (
                <span key={c} className="chip text-xs">
                  {cats.icon(c)} {cats.label(c)}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold leading-tight">{e.title}</h1>
            {(e.organizer || e.host) && (
              <p className="mt-1 text-sm">
                {t('UI-VA-VON', { name: e.organizer?.name ?? e.host?.name ?? '' })}
                {e.organizer?.verified ? (
                  <button className="ml-1 text-akzent" onClick={() => setInfo(true)}>
                    ✓ {t('UI-VA-VERIFIZIERT')}
                  </button>
                ) : (
                  <button className="ml-1 muted underline" onClick={() => setInfo(true)}>
                    {t('UI-VA-EINGEREICHT')}
                  </button>
                )}
              </p>
            )}

            {e.cancelled && (
              <div className="mt-3">
                <Banner kind="warn">
                  {t('UI-EREIGNIS-ABGESAGT')}
                  {e.cancelNote ? ` — ${e.cancelNote}` : ''}
                </Banner>
              </div>
            )}
            {e.over && (
              <div className="mt-3">
                <Banner>{t('UI-EREIGNIS-VORBEI')}</Banner>
              </div>
            )}

            <ul className="card mt-4 overflow-hidden">
              <li className="row">
                <Icon name="calendar" className="w-5 h-5 text-akzent shrink-0" />
                <span className="flex-1 py-2">
                  <span className="block font-medium">{new Date(e.startsAt).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="block text-sm muted">
                    {fmtTime(e.startsAt)} – {new Date(e.endsAt).toDateString() === new Date(e.startsAt).toDateString() ? fmtTime(e.endsAt) : fmtDate(e.endsAt, true)}
                  </span>
                </span>
              </li>
              <li className="row">
                <Icon name="pin" className="w-5 h-5 text-akzent shrink-0" />
                <span className="flex-1 py-2">
                  <span className="block font-medium">
                    {e.place ? (
                      <Link to={`/orte/${e.place.id}`} className="underline">
                        {e.place.name}
                      </Link>
                    ) : (
                      e.area
                    )}
                    {e.km !== null && e.km !== undefined && <span className="muted font-normal"> · {fmtKm(e.km)}</span>}
                  </span>
                  {e.address ? <span className="block text-sm">{e.address}</span> : e.addressHidden ? <span className="block text-sm muted">{t('UI-VA-ADRESSE-NACH-ZUSAGE')}</span> : null}
                  {e.point && !e.point.exact && <span className="block text-xs muted">{t('UI-VA-LAGE-UNGEFAEHR')}</span>}
                </span>
                {e.point && (
                  <button className="btn-ghost px-2" onClick={() => nav('/heute', { state: { focus: { lat: e.point.lat, lng: e.point.lng } } })} aria-label={t('UI-VA-AUF-KARTE')}>
                    <Icon name="map" />
                  </button>
                )}
              </li>
              {(e.capacity || e.price || e.dressCode) && (
                <li className="row">
                  <Icon name="users" className="w-5 h-5 text-akzent shrink-0" />
                  <span className="flex-1 py-2 text-sm">
                    {e.capacity ? (
                      <span className="block">
                        <Spots e={e} />
                      </span>
                    ) : null}
                    {e.capacity ? (
                      <span className="block h-1.5 rounded-full bg-flaeche2 mt-1 overflow-hidden" aria-hidden="true">
                        <span className="block h-full bg-akzent" style={{ width: `${Math.min(100, ((e.capacity - (e.spotsLeft ?? 0)) / e.capacity) * 100)}%` }} />
                      </span>
                    ) : null}
                    {e.price && <span className="block mt-1">💶 {e.price}</span>}
                    {e.dressCode && <span className="block">👕 {e.dressCode}</span>}
                  </span>
                </li>
              )}
            </ul>

            {e.description && <p className="mt-5 whitespace-pre-wrap leading-relaxed">{e.description}</p>}

            {deadline && !e.cancelled && !e.over && (
              <p className="text-sm muted mt-4 flex items-center gap-2">
                <Icon name="clock" className="w-4 h-4" /> {t('UI-VA-ABSAGEN-BIS', { zeit: fmtDate(deadline, true) })}
              </p>
            )}
            {e.approvalRequired && !data.isHost && <p className="text-sm muted mt-2">{t('UI-VA-ANNAHME-ERKL')}</p>}

            {data.canChat && (
              <button className="btn-secondary w-full mt-4" onClick={() => nav(`/veranstaltungen/${id}/chat/${data.myGuestId ?? ''}`)}>
                <Icon name="chat" /> {t('UI-VA-CHAT-MIT-VERANSTALTER')}
              </button>
            )}

            <section className="mt-6">
              <h2 className="font-semibold mb-1">{t('UI-EREIGNIS-ZUSAGEN-TITEL')}</h2>
              <p className="text-sm muted mb-2">{t('ST-HEU-03')}</p>
              {data.attendees && (
                <>
                  <p className="mb-2">{t('UI-EREIGNIS-ZUSAGEN', { zahl: data.count })}</p>
                  <ul className="flex flex-wrap gap-3">
                    {data.attendees.map((a: any) => (
                      <li key={a.id}>
                        <button className="flex flex-col items-center gap-1 w-16" onClick={() => !a.me && nav(`/profil/${a.id}`)} disabled={a.me}>
                          <Avatar name={a.name} initial={a.initial} color={a.color} photo={a.photo} size={48} />
                          <span className="text-xs truncate w-full text-center">{a.me ? t('UI-CHAT-DU') : a.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <section className="mt-6">
              <h2 className="font-semibold mb-1">{t('UI-EREIGNIS-GRUPPE')}</h2>
              <p className="text-sm muted mb-2">{t('ST-HEU-04')}</p>
              {data.group.open ? (
                <button className="btn-secondary" onClick={() => setGroup(true)}>
                  {t('UI-EREIGNIS-ZUR-GRUPPE')}
                </button>
              ) : data.rsvp ? (
                <p className="text-sm">{t('UI-EREIGNIS-GRUPPE-AB', { zeit: fmtDate(data.group.opensAt, true) })}</p>
              ) : null}
            </section>
            <p className="text-xs muted mt-8">{t('UI-VA-HAFTUNG')}</p>
          </Page>

          {!data.isHost && !e.cancelled && !e.over && !e.pending && (
            <BottomBar>
              {data.myStatus === 'angenommen' ? (
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-gut font-semibold">✓ {t('UI-VA-DU-BIST-DABEI')}</span>
                  <button className="btn-secondary" disabled={!data.canCancel} onClick={() => setConfirmCancel(true)}>
                    {t('UI-VA-ABSAGEN')}
                  </button>
                </div>
              ) : data.myStatus === 'angefragt' ? (
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-warn">{t('UI-VA-ANFRAGE-OFFEN')}</span>
                  <button className="btn-secondary" onClick={() => rsvp(false)}>
                    {t('UI-VA-ANFRAGE-ZURUECK')}
                  </button>
                </div>
              ) : data.myStatus === 'abgelehnt' ? (
                <p className="text-sm muted text-center">{t('UI-VA-ABGELEHNT')}</p>
              ) : e.full ? (
                <button className="btn-secondary" disabled>
                  {t('UI-VA-AUSGEBUCHT')}
                </button>
              ) : (
                <button className="btn-primary" onClick={() => rsvp(true)}>
                  {e.approvalRequired ? t('UI-VA-ANFRAGEN') : t('ST-HEU-02')}
                </button>
              )}
              {data.myStatus === 'angenommen' && !data.canCancel && <p className="text-xs muted text-center">{t('UI-VA-FRIST-VORBEI')}</p>}
            </BottomBar>
          )}
          <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title={t('UI-VA-ABSAGEN')}>
            <p className="mb-4">{t('UI-VA-ABSAGEN-FRAGE')}</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setConfirmCancel(false)}>
                {t('UI-VA-ABBRECHEN')}
              </button>
              <button className="btn-danger flex-1" onClick={() => rsvp(false)}>
                {t('UI-VA-ABSAGEN')}
              </button>
            </div>
          </Sheet>
          <Sheet open={info} onClose={() => setInfo(false)} title={t('UI-VA-INFO-TITEL')}>
            <VerificationInfo />
          </Sheet>
          <ReportSheet open={report} onClose={() => setReport(false)} context="ereignis" contextId={id} targetId={e.hostId ?? undefined} items={[]} />
        </>
      )}
    </div>
  );
}

/** Info-Knopf (Issue #16): was „verifizierter Veranstalter“ heißt und wie man es wird. */
export function VerificationInfo() {
  const nav = useNavigate();
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>{t('UI-VA-INFO-1')}</p>
      <p>{t('UI-VA-INFO-2')}</p>
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>{t('UI-VA-INFO-SCHRITT-1')}</li>
        <li>{t('UI-VA-INFO-SCHRITT-2')}</li>
        <li>{t('UI-VA-INFO-SCHRITT-3')}</li>
      </ul>
      <p className="muted">{t('UI-VA-INFO-3')}</p>
      <button className="btn-primary" onClick={() => nav('/veranstalter/verifizieren')}>
        {t('UI-VA-VERIFIZIERUNG-BEANTRAGEN')}
      </button>
    </div>
  );
}

// ─────────────────────────── S42 · Ort ───────────────────────────

function mapLink(p: { lat: number; lng: number; name: string; address?: string | null }) {
  const q = encodeURIComponent(p.address || p.name);
  if (/iPhone|iPad|Macintosh/.test(navigator.userAgent)) return `maps://?q=${q}&ll=${p.lat},${p.lng}`;
  return `geo:${p.lat},${p.lng}?q=${p.lat},${p.lng}(${q})`;
}

export function Ort() {
  const { id } = useParams();
  const { data, error } = useAsync(() => api.get(`/api/places/${id}`), [id]);
  const p = data?.place;
  const todayKey = DAYS[(new Date().getDay() + 6) % 7];
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={p?.name ?? ''} back />
      <Page>
        {error && <Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner>}
        {!p ? (
          !error && <Skeleton className="h-40" />
        ) : (
          <>
            <p className="muted">
              {kindLabel(p.kind)} · {p.district}
              {p.km !== null && p.km !== undefined ? ` · ${fmtKm(p.km)}` : ''}
            </p>
            {p.confirmed && <p className="text-sm text-gut mt-1">✓ {t('UI-ORT-BESTAETIGT')}</p>}
            {p.paidTool && <p className="text-xs muted mt-1">{t('UI-ORT-WERKZEUGKONTO')}</p>}
            {p.description && <p className="mt-3">{p.description}</p>}
            <section className="mt-5">
              <h2 className="font-semibold mb-2">{t('UI-ORT-OEFFNUNGSZEITEN')}</h2>
              {Object.keys(p.openingHours ?? {}).length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {DAYS.map((d) => (
                      <tr key={d} className={d === todayKey ? 'text-akzent font-semibold' : ''}>
                        <td className="py-1 w-16">{t(DAY_TEXT[d])}</td>
                        <td>{(p.openingHours[d] ?? []).length ? p.openingHours[d].map((s: string[]) => s.join('–')).join(', ') : t('UI-ORT-GESCHLOSSEN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm muted">{t('UI-ORT-ZEITEN-UNBEKANNT')}</p>
              )}
            </section>
            <section className="mt-5">
              <h2 className="font-semibold mb-2">{t('UI-ORT-EREIGNISSE')}</h2>
              {data.events.length ? <div className="flex flex-col gap-2">{data.events.map((ev: any) => <EventRow key={ev.id} e={ev} />)}</div> : <p className="text-sm muted">{t('ST-LEER-20')}</p>}
            </section>
            {p.address && (
              <section className="mt-5">
                <h2 className="font-semibold mb-1">{t('UI-ORT-ADRESSE')}</h2>
                <p>{p.address}</p>
                <a className="btn-secondary mt-2" href={mapLink(p)}>
                  {t('UI-ORT-KARTEN-APP')}
                </a>
              </section>
            )}
            <p className="text-xs muted mt-6">{t('UI-ORT-QUELLE', { quelle: p.source, datum: fmtDate(p.sourceDate) })}</p>
            {!p.confirmed && (
              <Link to={`/orte/beanspruchen/${p.id}`} className="btn-ghost px-0 mt-2">
                {t('UI-ORT-DEIN-ORT')}
              </Link>
            )}
          </>
        )}
      </Page>
    </div>
  );
}

function Gruppe({ id, title, onBack }: { id: string; title?: string; onBack: () => void }) {
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get(`/api/events/${id}/group`), [id]);
  const [text, setText] = useState('');
  const [report, setReport] = useState(false);
  useEffect(() => on('gruppe', (d: any) => d?.eventId === id && reload()), [id, reload]);
  const send = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/api/events/${id}/group`, { text });
      setText('');
      reload();
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) nav(`/pruefung?weiter=/ereignisse/${id}`);
      else toast(errText(e));
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-grund/95 border-b border-linie flex items-center gap-1 px-2 min-h-[56px] safe-top">
        <button className="btn-ghost px-2" onClick={onBack} aria-label={t('UI-APP-ZURUECK')}>
          <Icon name="back" />
        </button>
        <h1 className="flex-1 font-semibold truncate">{title}</h1>
        <button className="btn-ghost" onClick={() => setReport(true)}>
          {t('ST-MEL-01')}
        </button>
      </header>
      <div className="flex-1 max-w-2xl w-full mx-auto px-3 py-3 flex flex-col gap-2">
        {data && <p className="text-xs muted text-center">{t('UI-GRUPPE-SCHLIESST', { zeit: fmtDate(data.closesAt, true) })}</p>}
        {data?.messages.map((m: any) => (
          <div key={m.id} className={`max-w-[80%] ${m.mine ? 'self-end' : 'self-start'}`}>
            {!m.mine && <p className="text-xs muted mb-0.5">{m.sender?.name}</p>}
            <div className={`rounded-2xl px-3 py-2 whitespace-pre-wrap ${m.mine ? 'bg-akzentdunkel text-white' : 'bg-flaeche2'}`}>{m.text}</div>
            <p className="text-[11px] muted">{fmtTime(m.createdAt)}</p>
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 bg-grund/95 border-t border-linie px-3 py-2 safe-bottom flex gap-2">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('UI-CHAT-NACHRICHT')} aria-label={t('UI-CHAT-NACHRICHT')} />
        <button className="btn-primary px-3" onClick={send} aria-label={t('UI-CHAT-SENDEN')}>
          <Icon name="send" />
        </button>
      </div>
      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        context="gruppe"
        items={(data?.messages ?? []).filter((m: any) => !m.mine).map((m: any) => ({ kind: 'group_message' as const, id: m.id, label: `${m.sender?.name}: ${m.text}` }))}
      />
    </div>
  );
}

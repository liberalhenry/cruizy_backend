/** S40 Heute Karte · S41 Liste · S42 Ort · S43 Ereignis und temporäre Gruppe. */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Avatar, Banner, BottomBar, Empty, Header, Icon, Page, Sheet, Skeleton, useAsync } from '../components/ui';
import { ReportSheet } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { on } from '../lib/realtime';
import { fmtDate, fmtKm, fmtTime, t } from '../lib/texts';
import { LocationChip, LocationSheet } from './naehe';

const DAYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
const DAY_TEXT: Record<string, string> = { mo: 'UI-TAG-MO', di: 'UI-TAG-DI', mi: 'UI-TAG-MI', do: 'UI-TAG-DO', fr: 'UI-TAG-FR', sa: 'UI-TAG-SA', so: 'UI-TAG-SO' };

function kindLabel(kind: string) {
  const id = `UI-ORT-ART-${kind.toUpperCase()}`;
  const s = t(id);
  return s === id ? kind : s;
}

// ─────────────────────────── S40/S41 ───────────────────────────

export function Heute() {
  const nav = useNavigate();
  const { config } = useApp();
  const [view, setView] = useState<'karte' | 'liste'>(() => (localStorage.getItem('heute-ansicht') as 'karte' | 'liste') ?? 'liste');
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [locOpen, setLocOpen] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/api/today');
      setData(r);
      idbSet('heute', r);
    } catch (e) {
      setErr(errText(e));
      const c = await idbGet('heute');
      if (c) setData(c);
    }
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    localStorage.setItem('heute-ansicht', view);
  }, [view]);

  const today = new Date().toDateString();
  const tonight = (data?.events ?? []).filter((e: any) => new Date(e.startsAt).toDateString() === today || (new Date(e.startsAt) < new Date() && new Date(e.endsAt) > new Date()));
  const week = (data?.events ?? []).filter((e: any) => !tonight.includes(e));
  const open = (data?.places ?? []).filter((p: any) => p.openToday);

  return (
    <>
      <Header
        title={t('ST-HEU-01')}
        right={<LocationChip onOpen={() => setLocOpen(true)} />}
        sub={
          <div className="flex gap-2 px-4 pb-2" role="tablist">
            {(['karte', 'liste'] as const).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} className={`chip min-h-tap ${view === v ? 'border-akzent text-akzent' : ''}`} onClick={() => setView(v)}>
                <Icon name={v === 'karte' ? 'map' : 'list'} className="w-4 h-4" />
                {t(v === 'karte' ? 'UI-HEUTE-KARTE' : 'UI-HEUTE-LISTE')}
              </button>
            ))}
          </div>
        }
      />
      <Page>
        {err && !data && <Banner kind="error">{err}</Banner>}
        {!data ? (
          <Skeleton className="h-64" />
        ) : view === 'karte' ? (
          <>
            <TodayMap data={data} tiles={config?.map.tiles ?? data.mapTiles} attribution={config?.map.attribution ?? data.mapAttribution} onPlace={setPreview} />
            <p className="text-xs muted mt-2">{t('ST-HEU-05')}</p>
            {!data.clusters.length && <p className="text-sm muted mt-2">{t('ST-LEER-22')}</p>}
            {!data.places.length && <p className="text-sm muted mt-2">{t('ST-LEER-21')}</p>}
          </>
        ) : (
          <>
            <section className="mb-6">
              <h2 className="font-semibold mb-2">{t('UI-HEUTE-JETZT')}</h2>
              {tonight.length ? <EventList events={tonight} /> : <p className="text-sm muted">{t('ST-LEER-20')}</p>}
            </section>
            <section className="mb-6">
              <h2 className="font-semibold mb-2">{t('UI-HEUTE-OFFEN')}</h2>
              {open.length ? (
                <ul className="card overflow-hidden">
                  {open.map((p: any) => (
                    <li key={p.id}>
                      <button className="row hover:bg-flaeche2" onClick={() => nav(`/orte/${p.id}`)}>
                        <span className="flex-1 py-2">
                          <span className="block">
                            {p.name} {p.confirmed && <span className="text-xs text-akzent">✓ {t('UI-ORT-BESTAETIGT')}</span>}
                          </span>
                          <span className="block text-sm muted">
                            {kindLabel(p.kind)} · {p.district}
                            {p.km !== null && p.km !== undefined ? ` · ${fmtKm(p.km)}` : ''}
                            {p.hoursToday?.length ? ` · ${p.hoursToday.map((s: string[]) => s.join('–')).join(', ')}` : ''}
                          </span>
                          {p.paidTool && <span className="block text-xs muted">{t('UI-ORT-WERKZEUGKONTO')}</span>}
                        </span>
                        <span className="muted">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm muted">{t('ST-LEER-21')}</p>
              )}
            </section>
            {week.length > 0 && (
              <section className="mb-6">
                <h2 className="font-semibold mb-2">{t('UI-HEUTE-WOCHE')}</h2>
                <EventList events={week} withDate />
              </section>
            )}
          </>
        )}
      </Page>
      <Sheet open={!!preview} onClose={() => setPreview(null)} title={preview?.name}>
        {preview && (
          <div className="flex flex-col gap-2">
            <p className="muted">
              {kindLabel(preview.kind)} · {preview.district}
            </p>
            <p>{preview.openToday ? t('UI-ORT-HEUTE-OFFEN', { zeiten: (preview.hoursToday ?? []).map((s: string[]) => s.join('–')).join(', ') }) : preview.openToday === false ? t('UI-ORT-HEUTE-ZU') : t('UI-ORT-ZEITEN-UNBEKANNT')}</p>
            {(data?.events ?? [])
              .filter((e: any) => e.place?.id === preview.id)
              .slice(0, 1)
              .map((e: any) => (
                <p key={e.id} className="text-sm">
                  {t('UI-ORT-NAECHSTES', { titel: e.title, zeit: fmtDate(e.startsAt, true) })}
                </p>
              ))}
            <button className="btn-primary mt-2" onClick={() => nav(`/orte/${preview.id}`)}>
              {t('UI-APP-MEHR')}
            </button>
          </div>
        )}
      </Sheet>
      <LocationSheet
        open={locOpen}
        onClose={() => {
          setLocOpen(false);
          load();
        }}
      />
    </>
  );
}

function EventList({ events, withDate }: { events: any[]; withDate?: boolean }) {
  const nav = useNavigate();
  return (
    <ul className="card overflow-hidden">
      {events.map((e) => (
        <li key={e.id}>
          <button className="row hover:bg-flaeche2" onClick={() => nav(`/ereignisse/${e.id}`)}>
            <span className="w-16 shrink-0 text-sm muted">{withDate ? fmtDate(e.startsAt) : fmtTime(e.startsAt)}</span>
            <span className="flex-1 py-2">
              <span className={`block ${e.cancelled ? 'line-through muted' : ''}`}>{e.title}</span>
              <span className="block text-sm muted">
                {e.place?.name ?? ''}
                {e.km !== null && e.km !== undefined ? ` · ${fmtKm(e.km)}` : ''}
                {e.count !== null && e.count !== undefined ? ` · ${t('UI-EREIGNIS-ZUSAGEN', { zahl: e.count })}` : ''}
                {e.cancelled ? ` · ${t('UI-EREIGNIS-ABGESAGT')}` : ''}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Karte: Orte als Punkte, Personen nur als grobe Gruppen (F30). Ohne Kachelserver eine schematische Ansicht. */
function TodayMap({ data, tiles, attribution, onPlace }: { data: any; tiles: string | null; attribution: string | null; onPlace: (p: any) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tiles || !ref.current || !data.center) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: true }).setView([data.center.lat, data.center.lng], 13);
    L.tileLayer(tiles, { attribution: attribution ?? '', maxZoom: 17 }).addTo(map);
    for (const c of data.clusters) {
      L.circle([c.lat, c.lng], { radius: 350 + c.level * 150, color: '#5aa9ff', weight: 1, fillOpacity: 0.18 }).addTo(map).bindTooltip(c.label);
    }
    for (const p of data.places) {
      L.circleMarker([p.lat, p.lng], { radius: 8, color: p.confirmed ? '#5fd0a4' : '#e8ecf2', weight: 2, fillOpacity: 0.9, fillColor: '#191d25' })
        .addTo(map)
        .on('click', () => onPlace(p));
    }
    L.circleMarker([data.center.lat, data.center.lng], { radius: 6, color: '#5aa9ff', fillColor: '#5aa9ff', fillOpacity: 1 }).addTo(map).bindTooltip(t('UI-HEUTE-DU'));
    return () => {
      map.remove();
    };
  }, [tiles, attribution, data, onPlace]);

  if (!data.hasRef) return <Empty text={t('ST-REC-05')} />;
  if (tiles) return <div ref={ref} className="h-[60vh] rounded-xl overflow-hidden border border-linie" role="application" aria-label={t('UI-HEUTE-KARTE')} />;

  // Schematische Karte: gleicher Ausschnitt, keine Kacheln eines Dritten
  const c = data.center;
  const kmX = (lng: number) => (lng - c.lng) * 111.32 * Math.cos((c.lat * Math.PI) / 180);
  const kmY = (lat: number) => (lat - c.lat) * 111.32;
  const R = 6; // km sichtbarer Radius
  const sx = (lng: number) => 50 + (kmX(lng) / R) * 50;
  const sy = (lat: number) => 50 - (kmY(lat) / R) * 50;
  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full aspect-square rounded-xl bg-flaeche border border-linie" role="img" aria-label={t('UI-HEUTE-KARTE')}>
        {[1, 2, 3].map((r) => (
          <circle key={r} cx={50} cy={50} r={(r * 2 * 50) / R} fill="none" stroke="#2e3441" strokeWidth={0.3} />
        ))}
        {data.clusters.map((cl: any, i: number) => (
          <circle key={i} cx={sx(cl.lng)} cy={sy(cl.lat)} r={3 + cl.level * 1.5} fill="#5aa9ff" fillOpacity={0.18} stroke="#5aa9ff" strokeWidth={0.3}>
            <title>{cl.label}</title>
          </circle>
        ))}
        {data.places.map((p: any) => (
          <g key={p.id} onClick={() => onPlace(p)} className="cursor-pointer" role="button" aria-label={p.name}>
            <circle cx={sx(p.lng)} cy={sy(p.lat)} r={1.8} fill="#191d25" stroke={p.confirmed ? '#5fd0a4' : '#e8ecf2'} strokeWidth={0.6} />
            <circle cx={sx(p.lng)} cy={sy(p.lat)} r={4} fill="transparent" />
          </g>
        ))}
        <circle cx={50} cy={50} r={1.4} fill="#5aa9ff" />
      </svg>
      <p className="text-xs muted mt-1">{t('UI-HEUTE-SCHEMATISCH', { km: R })}</p>
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
              {data.events.length ? <EventList events={data.events} withDate /> : <p className="text-sm muted">{t('ST-LEER-20')}</p>}
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

// ─────────────────────────── S43 · Ereignis ───────────────────────────

export function Ereignis() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, error, reload } = useAsync(() => api.get(`/api/events/${id}`), [id]);
  const [group, setGroup] = useState(false);
  const e = data?.event;

  const rsvp = async (yes: boolean) => {
    try {
      if (yes) await api.post(`/api/events/${id}/rsvp`);
      else await api.del(`/api/events/${id}/rsvp`);
      reload();
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'alterspruefung_noetig' || err.code === 'vertrag_noetig')) nav(`/pruefung?weiter=/ereignisse/${id}`);
      else toast(errText(err));
    }
  };

  if (group) return <Gruppe id={id!} title={e?.title} onBack={() => setGroup(false)} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={e?.title ?? ''} back />
      <Page className="flex-1">
        {error && <Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner>}
        {e && (
          <>
            <p className="muted">
              {fmtDate(e.startsAt, true)} – {fmtTime(e.endsAt)}
            </p>
            {e.place && (
              <Link to={`/orte/${e.place.id}`} className="text-akzent underline">
                {e.place.name}
              </Link>
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
            {e.description && <p className="mt-4 whitespace-pre-wrap">{e.description}</p>}
            <section className="mt-6">
              <h2 className="font-semibold mb-1">{t('UI-EREIGNIS-ZUSAGEN-TITEL')}</h2>
              <p className="text-sm muted mb-2">{t('ST-HEU-03')}</p>
              {data.rsvp && data.attendees && (
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
          </>
        )}
      </Page>
      {e && !e.cancelled && !e.over && (
        <BottomBar>
          {data.rsvp ? (
            <button className="btn-secondary" onClick={() => rsvp(false)}>
              {t('UI-EREIGNIS-ZURUECKNEHMEN')}
            </button>
          ) : (
            <button className="btn-primary" onClick={() => rsvp(true)}>
              {t('ST-HEU-02')}
            </button>
          )}
        </BottomBar>
      )}
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

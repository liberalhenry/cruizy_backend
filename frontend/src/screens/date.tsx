/**
 * Cruizy Date (Issue #19) — ernsthaftes Kennenlernen als eigener Bereich auf demselben Konto.
 * Landing für Nicht-Mitglieder, Onboarding (Intention, Fotos, Gesichtsverifizierung, Profil,
 * Präferenzen, Kodex), „Heute“ mit Tagesvorschlägen, „Likes“, Profil, Einstellungen.
 * Kamera und Mikrofon: getUserMedia/MediaRecorder mit sauberer Fehlerbehandlung (Chrome, Safari/iOS, Firefox).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Empty, Field, Header, Icon, Page, Section, Sheet, Skeleton, TextArea, Toggle, useAsync } from '../components/ui';
import { AudioPlayer, VoiceRecorder, type Recorded } from '../components/voice';
import { ReportSheet } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { on } from '../lib/realtime';
import { fmtKm, t } from '../lib/texts';

type DateMe = any;
const STEPS = ['intention', 'fotos', 'verifizierung', 'profil', 'praeferenzen', 'kodex'] as const;
type Step = (typeof STEPS)[number];

function useDateMe() {
  const r = useAsync<DateMe>(() => api.get('/api/date/me'), []);
  const rl = useRef(r.reload);
  rl.current = r.reload;
  useEffect(() => on('date', () => rl.current()), []);
  return r;
}

function DateLabel({ className = '' }: { className?: string }) {
  return <span className={`rounded-full bg-rose-500/15 text-rose-300 border border-rose-400/30 px-2 py-0.5 text-xs font-semibold ${className}`}>♥ {t('UI-DATE')}</span>;
}

// ─────────────────────────── Einstieg /date ───────────────────────────

export function DateHome() {
  const nav = useNavigate();
  const { data: me, reload, error } = useDateMe();
  const [tab, setTab] = useState<'heute' | 'likes'>('heute');
  const { refreshCounts } = useApp();
  useEffect(() => {
    if (me?.status === 'onboarding') nav('/date/onboarding', { replace: true });
  }, [me?.status, nav]);
  useEffect(() => {
    if (tab === 'likes') refreshCounts();
  }, [tab, refreshCounts]);

  if (error) return <Page><Banner kind="error">{errText(error)}</Banner></Page>;
  if (!me) return <Page><Skeleton className="h-64" /></Page>;
  if (!me.enabled) return <Page><Empty text={t('UI-NICHT-VERFUEGBAR')} /></Page>;
  if (!me.status) return <DateLanding me={me} reload={reload} />;
  if (me.status === 'gesperrt')
    return (
      <>
        <Header title={t('UI-DATE-TITEL')} />
        <Page>
          <Banner kind="warn">{t('UI-DATE-N-GESPERRT')}</Banner>
        </Page>
      </>
    );

  return (
    <>
      <Header
        title={t('UI-DATE-TITEL')}
        right={
          <>
            <button className="btn-ghost px-2" onClick={() => nav('/date/profil')} aria-label={t('UI-DATE-PROFIL-BEARBEITEN')}>
              <Icon name="edit" />
            </button>
            <button className="btn-ghost px-2" onClick={() => nav('/date/einstellungen')} aria-label={t('UI-DATE-EINSTELLUNGEN')}>
              <Icon name="more" />
            </button>
          </>
        }
        sub={
          me.status === 'aktiv' ? (
            <div className="flex gap-1 mx-4 mb-2 p-1 rounded-xl bg-flaeche2 border border-linie" role="tablist">
              {(['heute', 'likes'] as const).map((k) => (
                <button key={k} role="tab" aria-selected={tab === k} className={`relative flex-1 rounded-lg min-h-[40px] text-sm ${tab === k ? 'bg-rose-400 text-grund font-semibold' : 'muted'}`} onClick={() => setTab(k)}>
                  {t(k === 'heute' ? 'UI-DATE-HEUTE' : 'UI-DATE-LIKES')}
                  {k === 'likes' && me.badges?.likes > 0 && <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-gefahr" aria-label={t('UI-APP-NEUES')} />}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />
      {me.status === 'pausiert' ? (
        <Page>
          <Banner
            action={
              <button className="btn-ghost" onClick={() => api.post('/api/date/resume').then(reload)}>
                {t('UI-DATE-FORTSETZEN')}
              </button>
            }
          >
            {me.settings?.autoPaused ? t('UI-DATE-AUTO-PAUSIERT') : t('UI-DATE-PAUSIERT')}
          </Banner>
        </Page>
      ) : tab === 'heute' ? (
        <DateToday />
      ) : (
        <DateLikes premium={me.premium} />
      )}
    </>
  );
}

function DateLanding({ me, reload }: { me: DateMe; reload: () => void }) {
  const nav = useNavigate();
  const { toast } = useApp();
  const start = async () => {
    try {
      await api.post('/api/date/start');
      nav('/date/onboarding');
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) nav('/pruefung?weiter=/date');
      else toast(errText(e));
    }
  };
  const waitlist = async () => {
    await api.post('/api/date/waitlist');
    reload();
  };
  return (
    <div className="relative min-h-[calc(100dvh-56px)] overflow-hidden">
      {/* verschwommene Platzhalter — keine echten Daten */}
      <div className="absolute inset-0 grid grid-cols-3 gap-2 p-2 opacity-30 blur-xl pointer-events-none" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl" style={{ background: `linear-gradient(135deg, hsl(${(i * 37) % 360} 55% 45%), hsl(${(i * 37 + 60) % 360} 50% 25%))` }} />
        ))}
      </div>
      <div className="relative max-w-xl mx-auto px-5 pt-10 pb-28 flex flex-col gap-5">
        <DateLabel className="self-start" />
        <h1 className="text-3xl font-bold leading-tight">{t('UI-DATE-L-HEADLINE')}</h1>
        <p className="text-lg text-text/90">{t('UI-DATE-L-SUB')}</p>
        <ul className="flex flex-col gap-3">
          {[
            ['✓', 'UI-DATE-L-PUNKT-1'],
            ['🎙️', 'UI-DATE-L-PUNKT-2'],
            ['☀️', 'UI-DATE-L-PUNKT-3'],
          ].map(([ic, id]) => (
            <li key={id} className="card p-4 flex gap-3 items-start bg-flaeche/90">
              <span className="text-xl" aria-hidden="true">
                {ic}
              </span>
              <span>{t(id)}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border-2 border-rose-400/60 bg-rose-500/10 p-4 font-medium">{t('UI-DATE-L-HINWEIS')}</div>
        {me.region.active ? (
          <button className="btn-primary !bg-rose-400 text-lg min-h-[52px]" onClick={start}>
            {t('UI-DATE-FREISCHALTEN')}
          </button>
        ) : me.waitlisted ? (
          <Banner kind="ok">{t('UI-DATE-WARTELISTE-DABEI', { stadt: me.region.city ?? '' })}</Banner>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{t('UI-DATE-WARTELISTE')}</p>
            <button className="btn-secondary min-h-[52px]" onClick={waitlist}>
              {t('UI-DATE-AUF-WARTELISTE')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── Profilkarte ───────────────────────────

type LikeTarget = { kind: 'foto' | 'prompt' | 'audio'; id: string; label: string; preview?: string | null };

function LikeButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="w-12 h-12 rounded-full bg-grund/90 border border-rose-400/60 text-rose-300 grid place-items-center shadow-lg hover:scale-105 transition" onClick={onClick} aria-label={label}>
      <Icon name="heart" className="w-6 h-6" />
    </button>
  );
}

export function DateProfileCard({ p, onLike, onReport }: { p: any; onLike?: (t: LikeTarget) => void; onReport?: () => void }) {
  const photos: any[] = p.photos ?? [];
  const items: ReactNode[] = [];
  const photo = (ph: any, i: number) => (
    <div key={ph.id} className="relative rounded-2xl overflow-hidden bg-flaeche2">
      <img src={ph.url} alt={t('UI-DATE-FOTO-VON', { name: p.name, nr: i + 1 })} className="w-full aspect-[4/5] object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
      {ph.status === 'queued' && <span className="absolute top-2 left-2 rounded-full bg-warn text-grund text-xs px-2 py-0.5">{t('UI-DATE-FOTO-PRUEFUNG')}</span>}
      {onLike && (
        <div className="absolute bottom-3 right-3">
          <LikeButton onClick={() => onLike({ kind: 'foto', id: ph.id, label: t('UI-DATE-DEIN-FOTO'), preview: ph.url })} label={t('UI-DATE-LIKE-FOTO')} />
        </div>
      )}
    </div>
  );
  const prompt = (pr: any) => (
    <div key={pr.id} className="relative card p-5 pr-16">
      <p className="text-sm muted">{pr.prompt}</p>
      <p className="text-xl font-semibold mt-1 leading-snug">{pr.answer}</p>
      {onLike && (
        <div className="absolute bottom-3 right-3">
          <LikeButton onClick={() => onLike({ kind: 'prompt', id: pr.id, label: pr.prompt, preview: pr.answer })} label={t('UI-DATE-LIKE-PROMPT')} />
        </div>
      )}
    </div>
  );
  const audio = (au: any, title: string) => (
    <div key={au.id} className="relative card p-4 pr-16">
      <p className="text-sm muted mb-2">🎙️ {title}</p>
      <AudioPlayer src={au.url} durationMs={au.durationMs} />
      {onLike && (
        <div className="absolute bottom-3 right-3">
          <LikeButton onClick={() => onLike({ kind: 'audio', id: au.id, label: title })} label={t('UI-DATE-LIKE-AUDIO')} />
        </div>
      )}
    </div>
  );
  // abwechselnd: Foto, Prompt, Foto, Audio, …
  const prompts: any[] = p.prompts ?? [];
  items.push(photos[0] ? photo(photos[0], 0) : null);
  items.push(
    <div key="kopf" className="px-1">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        {p.name}
        {p.age ? <span className="font-normal">{p.age}</span> : null}
        {p.verified && (
          <span className="text-akzent text-base" title={t('UI-DATE-VERIFIZIERT')} aria-label={t('UI-DATE-VERIFIZIERT')}>
            ✓
          </span>
        )}
      </h2>
      <p className="muted">
        {[p.job, p.employer, p.heightCm ? `${p.heightCm} cm` : null, p.km !== null && p.km !== undefined ? fmtKm(p.km) : null].filter(Boolean).join(' · ')}
      </p>
      {p.intentionLabel && <p className="mt-2 inline-block rounded-full bg-rose-500/15 text-rose-200 px-3 py-1 text-sm">💞 {p.intentionLabel}</p>}
    </div>,
  );
  if (p.voice) items.push(audio(p.voice, t('UI-DATE-VOICE-INTRO')));
  prompts.forEach((pr, i) => {
    items.push(prompt(pr));
    if (photos[i + 1]) items.push(photo(photos[i + 1], i + 1));
  });
  for (let i = prompts.length + 1; i < photos.length; i++) items.push(photo(photos[i], i));
  if (p.audioPrompt) items.push(audio(p.audioPrompt, p.audioPrompt.prompt ?? t('UI-DATE-AUDIO-PROMPT')));
  const values = Object.entries(p.values ?? {}).filter(([, v]) => v) as [string, string][];
  items.push(
    <div key="infos" className="card p-4 flex flex-col gap-3">
      {p.interests?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.interests.map((x: string) => (
            <span key={x} className="chip">
              {x}
            </span>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          {values.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="muted">{t(`UI-DATE-WERT-${k.replace(/_/g, '').toUpperCase()}`)}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {p.lookingFor && (
        <div>
          <p className="text-sm muted">{t('UI-DATE-WAS-ICH-SUCHE')}</p>
          <p className="whitespace-pre-wrap">{p.lookingFor}</p>
        </div>
      )}
    </div>,
  );
  return (
    <article className="flex flex-col gap-3" aria-label={p.name}>
      {items}
      {onReport && (
        <button className="btn-ghost self-center text-sm muted" onClick={onReport}>
          {t('ST-MEL-01')}
        </button>
      )}
    </article>
  );
}

function LikeSheet({ target, name, premium, onClose, onSent }: { target: LikeTarget | null; name: string; premium: boolean; onClose: () => void; onSent: (r: any) => void }) {
  const { toast } = useApp();
  const [comment, setComment] = useState('');
  const [superLike, setSuper] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: me } = useAsync<DateMe>(() => api.get('/api/date/me'), []);
  const max = me?.catalog?.limits?.comment ?? 150;
  useEffect(() => {
    setComment('');
    setSuper(false);
  }, [target?.id]);
  if (!target) return null;
  return (
    <Sheet open={!!target} onClose={onClose} title={t('UI-DATE-LIKE-TITEL', { name })}>
      <div className="flex flex-col gap-3">
        <div className="card p-3 flex gap-3 items-center">
          {target.kind === 'foto' && target.preview ? <img src={target.preview} alt="" className="w-16 h-20 object-cover rounded-lg" /> : <span className="text-3xl">{target.kind === 'audio' ? '🎙️' : '💬'}</span>}
          <span className="text-sm">
            <span className="block muted">{target.label}</span>
            {target.kind === 'prompt' && <span className="block font-semibold">{target.preview}</span>}
          </span>
        </div>
        <TextArea label={t('UI-DATE-KOMMENTAR')} hint={`${[...comment].length} / ${max}`} value={comment} onChange={(e) => setComment(e.target.value.slice(0, max))} rows={3} placeholder={t('UI-DATE-KOMMENTAR-BSP')} />
        {premium && <Toggle checked={superLike} onChange={setSuper} label={t('UI-DATE-SUPERLIKE')} hint={t('UI-DATE-SUPERLIKE-ERKL')} />}
        <button
          className="btn-primary !bg-rose-400"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              onSent({ target, comment: comment.trim() || undefined, super: superLike });
            } catch (e) {
              toast(errText(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Icon name="heart" /> {t('UI-DATE-LIKE-SENDEN')}
        </button>
      </div>
    </Sheet>
  );
}

function MatchSheet({ match, name, onClose }: { match: { conversationId: string } | null; name: string; onClose: () => void }) {
  const nav = useNavigate();
  return (
    <Sheet open={!!match} onClose={onClose} title={t('UI-DATE-MATCH-TITEL')}>
      <div className="flex flex-col items-center gap-4 text-center py-4">
        <span className="text-6xl" aria-hidden="true">
          💞
        </span>
        <p className="text-lg">{t('UI-DATE-MATCH-TEXT', { name })}</p>
        <button className="btn-primary !bg-rose-400 w-full" onClick={() => match && nav(`/chats/${match.conversationId}`)}>
          {t('UI-DATE-ZUM-CHAT')}
        </button>
        <button className="btn-ghost" onClick={onClose}>
          {t('UI-DATE-WEITER-STOEBERN')}
        </button>
      </div>
    </Sheet>
  );
}

async function sendLike(to: string, x: { target: LikeTarget; comment?: string; super?: boolean }) {
  return api.post('/api/date/like', { to, target: { kind: x.target.kind, id: x.target.id }, comment: x.comment, super: x.super });
}

// ─────────────────────────── Heute ───────────────────────────

function DateToday() {
  const { toast, refreshCounts } = useApp();
  const { data, reload, error } = useAsync(() => api.get('/api/date/today'), []);
  const { data: me } = useAsync<DateMe>(() => api.get('/api/date/me'), []);
  const [like, setLike] = useState<LikeTarget | null>(null);
  const [match, setMatch] = useState<{ conversationId: string; name: string } | null>(null);
  const [report, setReport] = useState(false);
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const cur = data?.current;

  const pass = useCallback(async () => {
    if (!cur) return;
    setDx(0);
    await api.post('/api/date/pass', { to: cur.id }).catch((e) => toast(errText(e)));
    window.scrollTo({ top: 0 });
    reload();
  }, [cur, reload, toast]);

  // Tastatur: ← oder X = weiter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (like || match || report) return;
      if ((e.target as HTMLElement)?.closest('input,textarea,select')) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'x') pass();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pass, like, match, report]);

  if (error) return <Page><Banner kind="error">{errText(error)}</Banner></Page>;
  if (!data) return <Page><Skeleton className="h-[70vh]" /></Page>;
  if (!cur)
    return (
      <Page>
        <div className="card p-8 text-center flex flex-col items-center gap-3 mt-6">
          <span className="text-5xl" aria-hidden="true">
            🌙
          </span>
          <p className="text-lg font-semibold">{t('UI-DATE-FERTIG-HEUTE')}</p>
          <p className="text-sm muted">{t('UI-DATE-FERTIG-HEUTE-ERKL', { zahl: data.limit })}</p>
        </div>
      </Page>
    );

  return (
    <>
      <div
        className="max-w-md mx-auto w-full px-3 pt-3 pb-32 touch-pan-y"
        style={{ transform: dx ? `translateX(${dx}px) rotate(${dx / 40}deg)` : undefined, transition: startX.current === null ? 'transform .2s' : 'none', opacity: dx < -60 ? 0.6 : 1 }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') return;
          startX.current = e.clientX;
        }}
        onPointerMove={(e) => {
          if (startX.current === null) return;
          const d = e.clientX - startX.current;
          setDx(d < 0 ? d : 0);
        }}
        onPointerUp={() => {
          const d = dx;
          startX.current = null;
          if (d < -110) pass();
          else setDx(0);
        }}
        onPointerCancel={() => {
          startX.current = null;
          setDx(0);
        }}
      >
        <p className="text-xs muted text-center mb-2">
          {t('UI-DATE-VORSCHLAG-VON', { nr: data.done + 1, gesamt: data.total })}
          {cur.likedMe && <span className="ml-2 text-rose-300">♥ {t('UI-DATE-HAT-DICH-GELIKT')}</span>}
        </p>
        <DateProfileCard p={cur} onLike={setLike} onReport={() => setReport(true)} />
      </div>
      <div className="fixed bottom-[76px] inset-x-0 z-20 flex justify-center pointer-events-none">
        <button className="pointer-events-auto w-16 h-16 rounded-full bg-flaeche border border-linie shadow-xl grid place-items-center hover:bg-flaeche2" onClick={pass} aria-label={t('UI-DATE-WEITER')} title={t('UI-DATE-WEITER-TASTE')}>
          <Icon name="close" className="w-7 h-7" />
        </button>
      </div>
      <LikeSheet
        target={like}
        name={cur.name}
        premium={!!me?.premium?.superLike}
        onClose={() => setLike(null)}
        onSent={async (x) => {
          try {
            const r = await sendLike(cur.id, x);
            setLike(null);
            if (r.match) setMatch({ conversationId: r.match.conversationId, name: cur.name });
            else toast(t('UI-DATE-GELIKT', { name: cur.name }));
            refreshCounts();
            reload();
          } catch (e) {
            toast(errText(e));
          }
        }}
      />
      <MatchSheet match={match} name={match?.name ?? ''} onClose={() => setMatch(null)} />
      <ReportSheet open={report} onClose={() => setReport(false)} context="date" targetId={cur.id} targetName={cur.name} onBlocked={() => pass()} />
    </>
  );
}

// ─────────────────────────── Likes ───────────────────────────

function DateLikes({ premium }: { premium: any }) {
  const nav = useNavigate();
  const { data } = useAsync(() => api.get('/api/date/likes'), []);
  if (!data) return <Page><Skeleton className="h-40" /></Page>;
  if (!data.full)
    return (
      <Page>
        <div className="card p-6 text-center flex flex-col items-center gap-4">
          <p className="text-4xl font-bold text-rose-300">{data.count}</p>
          <p>{t('UI-DATE-LIKES-ANZAHL', { zahl: data.count })}</p>
          <div className="grid grid-cols-3 gap-2 w-full">
            {data.previews.map((u: string | null, i: number) => (
              <div key={i} className="aspect-[4/5] rounded-xl overflow-hidden bg-flaeche2">{u && <img src={u} alt="" className="w-full h-full object-cover" />}</div>
            ))}
          </div>
          <p className="text-sm muted">{t('UI-DATE-LIKES-PREMIUM')}</p>
          <button className="btn-secondary" onClick={() => nav('/ich/abo')}>
            {t('UI-DATE-PREMIUM-ANSEHEN')}
          </button>
          <p className="text-xs muted">{t('UI-DATE-LIKES-TIPP')}</p>
        </div>
      </Page>
    );
  if (!data.likes.length) return <Page><Empty text={t('UI-DATE-LIKES-LEER')} /></Page>;
  return (
    <Page>
      <ul className="flex flex-col gap-3">
        {data.likes.map((l: any) => (
          <li key={l.likeId}>
            <button className="card w-full p-3 flex gap-3 text-left hover:bg-flaeche2" onClick={() => nav(`/date/u/${l.from.id}`)}>
              {l.from.photo ? <img src={l.from.photo} alt="" className="w-20 h-24 rounded-xl object-cover" /> : <Avatar name={l.from.name} initial={l.from.initial} size={80} />}
              <span className="flex-1 min-w-0">
                <span className="block font-semibold">
                  {l.from.name} {l.from.age ?? ''} {l.super && <span className="text-rose-300">★</span>}
                </span>
                <span className="block text-sm muted">
                  {l.element?.kind === 'prompt' ? t('UI-DATE-GELIKT-PROMPT', { prompt: l.element.prompt ?? '' }) : l.element?.kind === 'audio' ? t('UI-DATE-GELIKT-AUDIO') : t('UI-DATE-GELIKT-FOTO')}
                </span>
                {l.comment && <span className="block mt-1 rounded-xl bg-rose-500/10 px-3 py-2 text-sm">„{l.comment}“</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!premium?.likesSehen && null}
    </Page>
  );
}

// ─────────────────────────── Fremdes Date-Profil ───────────────────────────

export function DateUser() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, error, reload } = useAsync(() => api.get(`/api/date/profiles/${id}`), [id]);
  const { data: me } = useAsync<DateMe>(() => api.get('/api/date/me'), []);
  const [like, setLike] = useState<LikeTarget | null>(null);
  const [match, setMatch] = useState<{ conversationId: string } | null>(null);
  const [report, setReport] = useState(false);
  const p = data?.profile;
  return (
    <div className="min-h-screen">
      <Header title={p?.name ?? ''} back right={<DateLabel className="mr-2" />} />
      <div className="max-w-md mx-auto px-3 py-3 pb-24">
        {error && <Banner>{error instanceof ApiError && error.code === 'date_nur_mitglieder' ? t('UI-DATE-NUR-MITGLIEDER') : t('UI-NICHT-VERFUEGBAR')}</Banner>}
        {!p && !error && <Skeleton className="h-[70vh]" />}
        {p && (
          <>
            {data.match && (
              <div className="mb-3">
                <Banner kind="ok" action={<button className="btn-ghost" onClick={() => nav(`/chats/${data.match.conversationId}`)}>{t('UI-DATE-ZUM-CHAT')}</button>}>
                  {t('UI-DATE-IHR-SEID-MATCH')}
                </Banner>
              </div>
            )}
            {data.liked && !data.match && <p className="text-sm text-rose-300 mb-2">♥ {t('UI-DATE-DU-HAST-GELIKT')}</p>}
            <DateProfileCard p={p} onLike={data.liked || data.match ? undefined : setLike} onReport={() => setReport(true)} />
          </>
        )}
      </div>
      {p && (
        <>
          <LikeSheet
            target={like}
            name={p.name}
            premium={!!me?.premium?.superLike}
            onClose={() => setLike(null)}
            onSent={async (x) => {
              try {
                const r = await sendLike(p.id, x);
                setLike(null);
                if (r.match) setMatch({ conversationId: r.match.conversationId });
                else toast(t('UI-DATE-GELIKT', { name: p.name }));
                reload();
              } catch (e) {
                toast(errText(e));
              }
            }}
          />
          <MatchSheet match={match} name={p.name} onClose={() => setMatch(null)} />
          <ReportSheet open={report} onClose={() => setReport(false)} context="date" targetId={p.id} targetName={p.name} onBlocked={() => nav('/date')} />
        </>
      )}
    </div>
  );
}

// ─────────────────────────── Onboarding ───────────────────────────

function Progress({ step }: { step: Step }) {
  const i = STEPS.indexOf(step);
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-1" aria-hidden="true">
        {STEPS.map((s, j) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${j <= i ? 'bg-rose-400' : 'bg-flaeche2'}`} />
        ))}
      </div>
      <p className="text-xs muted mt-1">{t('UI-DATE-SCHRITT', { nr: i + 1, gesamt: STEPS.length, name: t(`UI-DATE-S-${step.toUpperCase()}`) })}</p>
    </div>
  );
}

export function DateOnboarding() {
  const nav = useNavigate();
  const { refreshCounts } = useApp();
  const { data: me, reload } = useDateMe();
  const [step, setStep] = useState<Step | null>(null);
  useEffect(() => {
    if (!me) return;
    if (!me.status) nav('/date', { replace: true });
    else if (me.status !== 'onboarding' && step === null) nav('/date', { replace: true });
    else if (step === null) setStep((STEPS as readonly string[]).includes(me.step) ? (me.step as Step) : 'intention');
  }, [me, step, nav]);
  if (!me || !step) return <Page><Skeleton className="h-64" /></Page>;
  const go = (s: Step) => {
    setStep(s);
    reload();
    window.scrollTo({ top: 0 });
  };
  const next = () => go(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]);
  const prev = () => (STEPS.indexOf(step) > 0 ? go(STEPS[STEPS.indexOf(step) - 1]) : nav('/date'));
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-grund/95 backdrop-blur border-b border-linie safe-top">
        <div className="flex items-center gap-1 px-2 min-h-[56px]">
          <button className="btn-ghost px-2" onClick={prev} aria-label={t('UI-APP-ZURUECK')}>
            <Icon name="back" />
          </button>
          <h1 className="flex-1 text-lg font-semibold">{t('UI-DATE-EINRICHTEN')}</h1>
          <DateLabel className="mr-2" />
        </div>
        <Progress step={step} />
      </header>
      <Page className="flex-1 pb-28">
        {step === 'intention' && <StepIntention me={me} onDone={next} />}
        {step === 'fotos' && <PhotosEditor me={me} onDone={next} />}
        {step === 'verifizierung' && <Verification me={me} onDone={next} />}
        {step === 'profil' && <ProfileEditor me={me} onDone={next} />}
        {step === 'praeferenzen' && <PreferencesEditor me={me} onDone={next} />}
        {step === 'kodex' && (
          <StepCode
            me={me}
            onJump={go}
            onActive={() => {
              refreshCounts();
              nav('/date', { replace: true });
            }}
          />
        )}
      </Page>
    </div>
  );
}

function StepIntention({ me, onDone }: { me: DateMe; onDone: () => void }) {
  const [v, setV] = useState<string | null>(me.intention ?? null);
  const { toast } = useApp();
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('UI-DATE-INTENTION-FRAGE')}</h2>
      <p className="text-sm muted">{t('UI-DATE-INTENTION-ERKL')}</p>
      <div className="flex flex-col gap-2" role="radiogroup">
        {me.catalog.intentions.map((x: any) => (
          <button key={x.key} role="radio" aria-checked={v === x.key} className={`card p-4 text-left ${v === x.key ? 'border-rose-400 bg-rose-500/10' : ''}`} onClick={() => setV(x.key)}>
            {x.label}
          </button>
        ))}
      </div>
      <BottomBar>
        <button
          className="btn-primary !bg-rose-400"
          disabled={!v}
          onClick={() =>
            api
              .put('/api/date/intention', { intention: v })
              .then(onDone)
              .catch((e) => toast(errText(e)))
          }
        >
          {t('UI-DATE-WEITER-BTN')}
        </button>
      </BottomBar>
    </div>
  );
}

export function PhotosEditor({ me, onDone }: { me: DateMe; onDone?: () => void }) {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/date/profile'), []);
  const [photos, setPhotos] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [min, max] = me.catalog.limits.photos as [number, number];
  useEffect(() => setPhotos(data?.view?.photos ?? []), [data]);
  const saveOrder = async (list: any[]) => {
    setPhotos(list);
    try {
      const r = await api.put('/api/date/photos/order', { ids: list.map((x) => x.id) });
      if (r.reverify) toast(t('UI-DATE-NEU-VERIFIZIEREN'));
    } catch (e) {
      toast(errText(e));
    }
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= photos.length) return;
    const list = [...photos];
    [list[i], list[j]] = [list[j], list[i]];
    saveOrder(list);
  };
  const add = async (files: File[]) => {
    setBusy(true);
    for (const f of files.slice(0, max - photos.length)) {
      try {
        const r = await api.upload('/api/date/photos', f);
        if (r.status === 'rejected') toast(t('UI-DATE-FOTO-ABGELEHNT'));
      } catch (e) {
        toast(errText(e));
      }
    }
    setBusy(false);
    reload();
  };
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('UI-DATE-FOTOS-TITEL')}</h2>
      <p className="text-sm muted">{t('UI-DATE-FOTOS-ERKL', { min, max })}</p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((ph, i) => (
          <div
            key={ph.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag === null || drag === i) return;
              const list = [...photos];
              const [x] = list.splice(drag, 1);
              list.splice(i, 0, x);
              setDrag(null);
              saveOrder(list);
            }}
            className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-flaeche2 cursor-grab ${i === 0 ? 'ring-2 ring-rose-400' : ''}`}
          >
            <img src={ph.url} alt="" className="w-full h-full object-cover pointer-events-none" />
            {i === 0 && <span className="absolute top-1 left-1 rounded-full bg-rose-400 text-grund text-[10px] font-semibold px-2">{t('UI-DATE-FOTO-ERSTES')}</span>}
            {ph.status === 'queued' && <span className="absolute bottom-8 left-1 rounded-full bg-warn text-grund text-[10px] px-2">{t('UI-DATE-FOTO-PRUEFUNG')}</span>}
            <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/60">
              <button className="px-2 py-1 text-xs" onClick={() => move(i, -1)} aria-label={t('UI-DATE-FOTO-VOR')} disabled={i === 0}>
                ◀
              </button>
              <button
                className="px-2 py-1 text-xs"
                onClick={async () => {
                  await api.del(`/api/date/photos/${ph.id}`);
                  reload();
                }}
                aria-label={t('UI-APP-LOESCHEN')}
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
              <button className="px-2 py-1 text-xs" onClick={() => move(i, 1)} aria-label={t('UI-DATE-FOTO-ZURUECK')} disabled={i === photos.length - 1}>
                ▶
              </button>
            </div>
          </div>
        ))}
        {photos.length < max && (
          <button className="aspect-[4/5] rounded-xl border-2 border-dashed border-linie grid place-items-center muted hover:bg-flaeche2" onClick={() => file.current?.click()} disabled={busy}>
            {busy ? t('UI-APP-LAEDT') : <Icon name="plus" className="w-8 h-8" />}
          </button>
        )}
      </div>
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden onChange={(e) => (add([...(e.target.files ?? [])]), (e.target.value = ''))} />
      <p className="text-xs muted">{t('UI-DATE-FOTOS-SFW')}</p>
      {onDone && (
        <BottomBar>
          <button className="btn-primary !bg-rose-400" disabled={photos.length < min} onClick={onDone}>
            {photos.length < min ? t('UI-DATE-NOCH-FOTOS', { zahl: min - photos.length }) : t('UI-DATE-WEITER-BTN')}
          </button>
        </BottomBar>
      )}
    </div>
  );
}

/** Fehlertext für die Kamera. */
function camError(e: unknown): string {
  if (!window.isSecureContext) return t('UI-DATE-KAMERA-HTTPS');
  if (!navigator.mediaDevices?.getUserMedia) return t('UI-DATE-KAMERA-BROWSER');
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return t('UI-DATE-KAMERA-ABGELEHNT');
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return t('UI-DATE-KAMERA-FEHLT');
  if (name === 'NotReadableError') return t('UI-DATE-KAMERA-BELEGT');
  return t('UI-DATE-KAMERA-BROWSER');
}

export function Verification({ me, onDone }: { me: DateMe; onDone?: () => void }) {
  const [consent, setConsent] = useState<boolean>(!!me.biometricConsent);
  const [check, setCheck] = useState(false);
  const [challenge, setChallenge] = useState<{ pose: string; label: string; nonce: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<boolean>(!!me.verified);
  const [live, setLive] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fallback = useRef<HTMLInputElement>(null);
  const stop = () => {
    stream.current?.getTracks().forEach((x) => x.stop());
    stream.current = null;
    setLive(false);
  };
  useEffect(() => stop, []);

  const getChallenge = async () => {
    const r = await api.post('/api/date/verification/challenge');
    setChallenge(r);
    return r;
  };
  const startCam = async () => {
    setErr(null);
    try {
      await getChallenge();
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('x'), { name: 'Unsupported' });
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false });
      stream.current = s;
      setLive(true);
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = s;
          // iOS Safari braucht playsInline + muted + play()
          video.current.play().catch(() => {});
        }
      });
    } catch (e) {
      if (e instanceof ApiError) setErr(errText(e));
      else setErr(camError(e));
    }
  };
  const submit = async (blob: Blob, nonce: string) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.upload('/api/date/verification', blob, { nonce });
      stop();
      if (r.ok) {
        setDone(true);
      } else {
        setErr(t(r.reason === 'pose' ? 'UI-DATE-VERIFIZIERUNG-POSE' : 'UI-DATE-VERIFIZIERUNG-KEIN-ABGLEICH'));
        setChallenge(null);
      }
    } catch (e) {
      setErr(errText(e));
      setChallenge(null);
    } finally {
      setBusy(false);
    }
  };
  const capture = async () => {
    const v = video.current;
    if (!v || !challenge) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth || 720;
    c.height = v.videoHeight || 960;
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.9));
    if (blob) await submit(blob, challenge.nonce);
  };

  if (done)
    return (
      <div className="flex flex-col gap-4">
        <div className="card p-6 text-center flex flex-col items-center gap-2">
          <span className="w-14 h-14 rounded-full bg-akzent text-grund grid place-items-center text-3xl">✓</span>
          <p className="text-lg font-semibold">{t('UI-DATE-VERIFIZIERT-OK')}</p>
          <p className="text-sm muted">{t('UI-DATE-VERIFIZIERT-OK-ERKL')}</p>
        </div>
        {onDone && (
          <BottomBar>
            <button className="btn-primary !bg-rose-400" onClick={onDone}>
              {t('UI-DATE-WEITER-BTN')}
            </button>
          </BottomBar>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('UI-DATE-VERIFIZIERUNG-TITEL')}</h2>
      <p className="text-sm muted">{t('UI-DATE-VERIFIZIERUNG-ERKL')}</p>
      {!consent ? (
        <div className="card p-4 flex flex-col gap-3">
          <p className="font-semibold">{t('UI-DATE-ART9-TITEL')}</p>
          <p className="text-sm">{t('UI-DATE-ART9-TEXT')}</p>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="accent-rose-400 w-5 h-5 mt-0.5" checked={check} onChange={(e) => setCheck(e.target.checked)} />
            <span className="text-sm">{t('UI-DATE-ART9-CHECK')}</span>
          </label>
          <button
            className="btn-primary !bg-rose-400"
            disabled={!check}
            onClick={async () => {
              await api.post('/api/date/verification/consent', { accept: true });
              setConsent(true);
            }}
          >
            {t('UI-DATE-ART9-OK')}
          </button>
        </div>
      ) : (
        <>
          {err && <Banner kind="error">{err}</Banner>}
          {challenge && (
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-500/10 p-4 text-center">
              <p className="text-sm muted">{t('UI-DATE-POSE')}</p>
              <p className="text-xl font-bold">{challenge.label}</p>
            </div>
          )}
          {live ? (
            <div className="flex flex-col gap-3">
              <video ref={video} playsInline muted autoPlay className="w-full max-w-sm mx-auto rounded-2xl bg-black aspect-[3/4] object-cover -scale-x-100" aria-label={t('UI-DATE-KAMERA-BILD')} />
              <button className="btn-primary !bg-rose-400" onClick={capture} disabled={busy}>
                {busy ? t('UI-APP-LAEDT') : t('UI-DATE-SELFIE-AUFNEHMEN')}
              </button>
              <button className="btn-ghost" onClick={stop}>
                {t('UI-DATE-KAMERA-AUS')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button className="btn-primary !bg-rose-400" onClick={startCam} disabled={busy}>
                <Icon name="eye" /> {t('UI-DATE-KAMERA-STARTEN')}
              </button>
              {/* Rückfall: Kamera des Geräts über die Dateiauswahl (ältere Browser) */}
              <button
                className="btn-ghost text-sm"
                onClick={async () => {
                  try {
                    await getChallenge();
                    fallback.current?.click();
                  } catch (e) {
                    setErr(errText(e));
                  }
                }}
              >
                {t('UI-DATE-KAMERA-RUECKFALL')}
              </button>
              <input
                ref={fallback}
                type="file"
                accept="image/*"
                capture="user"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f && challenge) submit(f, challenge.nonce);
                }}
              />
            </div>
          )}
          <p className="text-xs muted">{t('UI-DATE-VERIFIZIERUNG-DATENSCHUTZ')}</p>
        </>
      )}
    </div>
  );
}

const VALUE_FIELDS = ['relationship_model', 'kids', 'smoking', 'alcohol', 'sport', 'religion', 'politics'] as const;

export function ProfileEditor({ me, onDone }: { me: DateMe; onDone?: () => void }) {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/date/profile'), []);
  const [f, setF] = useState<any | null>(null);
  const [prompts, setPrompts] = useState<{ key: string; answer: string }[]>([]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [audioKey, setAudioKey] = useState<string | null>(null);
  const cat = me.catalog;
  const [minI, maxI] = cat.limits.interests as [number, number];
  const [minP, maxP] = cat.limits.prompts as [number, number];
  useEffect(() => {
    if (!data) return;
    setF(data.raw);
    setPrompts(data.view.prompts.length ? data.view.prompts.map((x: any) => ({ key: x.key, answer: x.answer })) : [{ key: cat.prompts[0].key, answer: '' }, { key: cat.prompts[2].key, answer: '' }]);
  }, [data, cat.prompts]);
  if (!f || !data) return <Skeleton className="h-64" />;
  const toggleInterest = (x: string) =>
    setF({ ...f, interests: f.interests.includes(x) ? f.interests.filter((y: string) => y !== x) : f.interests.length < maxI ? [...f.interests, x] : f.interests });
  const save = async () => {
    setBusy(true);
    try {
      await api.put('/api/date/profile', { job: f.job, employer: f.employer || null, interests: f.interests, lookingFor: f.lookingFor || null, values: f.values });
      await api.put('/api/date/prompts', { prompts: prompts.filter((x) => x.answer.trim()) });
      toast(t('UI-DATE-GESPEICHERT'));
      if (onDone) {
        if (!data.view.voice) {
          toast(t('UI-DATE-VOICE-FEHLT'));
          return;
        }
        onDone();
      }
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const valid = f.job?.trim().length >= 2 && f.interests.length >= minI && prompts.filter((x) => x.answer.trim()).length >= minP;
  const upVoice = (kind: 'intro' | 'prompt', promptKey?: string) => async (r: Recorded) => {
    try {
      await api.upload('/api/date/audio', r.blob, { kind, ...(promptKey ? { promptKey } : {}) });
      toast(t('UI-DATE-GESPEICHERT'));
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  const audioPromptKey: string = audioKey ?? data.view.audioPrompt?.promptKey ?? cat.prompts[1].key;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">{t('UI-DATE-PROFIL-TITEL')}</h2>

      <Section title={t('UI-DATE-VOICE-INTRO')}>
        <p className="text-sm muted mb-2">{t('UI-DATE-VOICE-ERKL', { s: cat.limits.voiceMax })}</p>
        {data.view.voice && (
          <div className="card p-3 mb-2">
            <AudioPlayer src={data.view.voice.url} durationMs={data.view.voice.durationMs} own />
          </div>
        )}
        <div className="card p-3">
          <VoiceRecorder maxSeconds={cat.limits.voiceMax} onSend={upVoice('intro')} onError={(m) => toast(m)} sendLabel={t('UI-DATE-AUFNAHME-SPEICHERN')} />
        </div>
      </Section>

      <div>
        <Field label={t('UI-DATE-BERUF')} value={f.job} onChange={(e) => setF({ ...f, job: e.target.value })} maxLength={80} />
        <Field label={t('UI-DATE-ARBEITGEBER')} hint={t('UI-DATE-ARBEITGEBER-ERKL')} value={f.employer ?? ''} onChange={(e) => setF({ ...f, employer: e.target.value })} maxLength={80} />
      </div>

      <Section title={t('UI-DATE-INTERESSEN', { min: minI, max: maxI })}>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...cat.interests, ...f.interests])].map((x: string) => (
            <button key={x} aria-pressed={f.interests.includes(x)} className={`chip min-h-tap ${f.interests.includes(x) ? 'border-rose-400 text-rose-200 bg-rose-500/10' : ''}`} onClick={() => toggleInterest(x)}>
              {x}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input className="input" placeholder={t('UI-DATE-EIGENES-INTERESSE')} value={custom} maxLength={30} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && custom.trim().length >= 2 && (toggleInterest(custom.trim()), setCustom(''))} />
          <button className="btn-secondary" disabled={custom.trim().length < 2} onClick={() => (toggleInterest(custom.trim()), setCustom(''))}>
            <Icon name="plus" />
          </button>
        </div>
        <p className="text-xs muted mt-1">{t('UI-DATE-GEWAEHLT', { zahl: f.interests.length, max: maxI })}</p>
      </Section>

      <Section title={t('UI-DATE-PROMPTS', { min: minP, max: maxP })}>
        <div className="flex flex-col gap-3">
          {prompts.map((pr, i) => (
            <div key={i} className="card p-3 flex flex-col gap-2">
              <select className="input" value={pr.key} onChange={(e) => setPrompts(prompts.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))}>
                {cat.prompts.map((x: any) => (
                  <option key={x.key} value={x.key} disabled={prompts.some((y, j) => j !== i && y.key === x.key)}>
                    {x.label}
                  </option>
                ))}
              </select>
              <textarea className="input py-2 min-h-[80px]" maxLength={300} value={pr.answer} onChange={(e) => setPrompts(prompts.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} placeholder={t('UI-DATE-PROMPT-ANTWORT')} aria-label={t('UI-DATE-PROMPT-ANTWORT')} />
              {prompts.length > minP && (
                <button className="btn-ghost self-end text-sm" onClick={() => setPrompts(prompts.filter((_, j) => j !== i))}>
                  {t('UI-APP-LOESCHEN')}
                </button>
              )}
            </div>
          ))}
          {prompts.length < maxP && (
            <button className="btn-secondary" onClick={() => setPrompts([...prompts, { key: cat.prompts.find((x: any) => !prompts.some((y) => y.key === x.key))!.key, answer: '' }])}>
              <Icon name="plus" /> {t('UI-DATE-PROMPT-NEU')}
            </button>
          )}
        </div>
      </Section>

      <Section title={t('UI-DATE-AUDIO-PROMPT')}>
        <p className="text-sm muted mb-2">{t('UI-DATE-AUDIO-PROMPT-ERKL')}</p>
        <select className="input mb-2" value={audioPromptKey} onChange={(e) => setAudioKey(e.target.value)} aria-label={t('UI-DATE-AUDIO-PROMPT')}>
          {cat.prompts.map((x: any) => (
            <option key={x.key} value={x.key}>
              {x.label}
            </option>
          ))}
        </select>
        {data.view.audioPrompt && (
          <div className="card p-3 mb-2 flex items-center gap-2">
            <div className="flex-1">
              <AudioPlayer src={data.view.audioPrompt.url} durationMs={data.view.audioPrompt.durationMs} own />
            </div>
            <button className="btn-ghost px-2" onClick={() => api.del('/api/date/audio/prompt').then(reload)} aria-label={t('UI-APP-LOESCHEN')}>
              <Icon name="trash" />
            </button>
          </div>
        )}
        <div className="card p-3">
          <VoiceRecorder maxSeconds={cat.limits.voiceMax} onSend={upVoice('prompt', audioPromptKey)} onError={(m) => toast(m)} sendLabel={t('UI-DATE-AUFNAHME-SPEICHERN')} />
        </div>
      </Section>

      <Section title={t('UI-DATE-WERTE')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VALUE_FIELDS.map((k) => (
            <label key={k}>
              <span className="label">
                {t(`UI-DATE-WERT-${k.replace(/_/g, '').toUpperCase()}`)}
                {(k === 'religion' || k === 'politics') && <span className="muted"> · {t('UI-DATE-FREIWILLIG-NICHT-MATCHING')}</span>}
              </span>
              <select className="input" value={f.values[k] ?? ''} onChange={(e) => setF({ ...f, values: { ...f.values, [k]: e.target.value || null } })}>
                <option value="">—</option>
                {cat.values[k].map((x: any) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </Section>

      <TextArea
        label={t('UI-DATE-WAS-ICH-SUCHE')}
        hint={`${[...(f.lookingFor ?? '')].length} / ${cat.limits.lookingFor}`}
        value={f.lookingFor ?? ''}
        onChange={(e) => setF({ ...f, lookingFor: e.target.value.slice(0, cat.limits.lookingFor) })}
        rows={5}
      />

      <BottomBar>
        <button className="btn-primary !bg-rose-400" disabled={!valid || busy} onClick={save}>
          {onDone ? t('UI-DATE-SPEICHERN-WEITER') : t('UI-APP-SPEICHERN')}
        </button>
      </BottomBar>
    </div>
  );
}

const DISTANCES = [10, 25, 50, 100, 200, 500, 1000];

export function PreferencesEditor({ me, onDone }: { me: DateMe; onDone?: () => void }) {
  const { toast } = useApp();
  const { data } = useAsync(() => api.get('/api/date/profile'), []);
  const [f, setF] = useState<{ ageMin: number; ageMax: number; distanceKm: number; dealbreakers: Record<string, string[]> } | null>(null);
  useEffect(() => {
    if (data) setF(data.preferences ?? { ageMin: 18, ageMax: 99, distanceKm: 100, dealbreakers: {} });
  }, [data]);
  if (!f) return <Skeleton className="h-40" />;
  const cat = me.catalog;
  const toggle = (field: string, key: string) => {
    const cur = f.dealbreakers[field] ?? [];
    setF({ ...f, dealbreakers: { ...f.dealbreakers, [field]: cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key] } });
  };
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-semibold">{t('UI-DATE-PRAEF-TITEL')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('UI-DATE-ALTER-VON')} type="number" min={18} max={99} value={f.ageMin} onChange={(e) => setF({ ...f, ageMin: Number(e.target.value) })} />
        <Field label={t('UI-DATE-ALTER-BIS')} type="number" min={18} max={99} value={f.ageMax} onChange={(e) => setF({ ...f, ageMax: Number(e.target.value) })} />
      </div>
      <label>
        <span className="label">{t('UI-DATE-ENTFERNUNG')}</span>
        <select className="input" value={f.distanceKm} onChange={(e) => setF({ ...f, distanceKm: Number(e.target.value) })}>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>
              {d >= 1000 ? t('UI-HEUTE-DACH') : fmtKm(d)}
            </option>
          ))}
        </select>
      </label>
      <Section title={t('UI-DATE-DEALBREAKER')}>
        <p className="text-sm muted mb-3">{t('UI-DATE-DEALBREAKER-ERKL')}</p>
        {cat.dealbreakerFields.map((field: string) => (
          <div key={field} className="mb-3">
            <p className="text-sm mb-1">{t(`UI-DATE-WERT-${field.replace(/_/g, '').toUpperCase()}`)}</p>
            <div className="flex flex-wrap gap-2">
              {cat.values[field].map((x: any) => {
                const onx = (f.dealbreakers[field] ?? []).includes(x.key);
                return (
                  <button key={x.key} aria-pressed={onx} className={`chip min-h-tap ${onx ? 'border-gefahr text-gefahr bg-gefahr/10 line-through' : ''}`} onClick={() => toggle(field, x.key)}>
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Section>
      <BottomBar>
        <button
          className="btn-primary !bg-rose-400"
          disabled={f.ageMin > f.ageMax}
          onClick={async () => {
            try {
              await api.put('/api/date/preferences', f);
              toast(t('UI-DATE-GESPEICHERT'));
              onDone?.();
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          {onDone ? t('UI-DATE-WEITER-BTN') : t('UI-APP-SPEICHERN')}
        </button>
      </BottomBar>
    </div>
  );
}

function StepCode({ me, onActive, onJump }: { me: DateMe; onActive: () => void; onJump: (s: Step) => void }) {
  const { toast } = useApp();
  const [ok, setOk] = useState(!!me.codeAccepted);
  const [missing, setMissing] = useState<string[] | null>(null);
  const STEP_OF: Record<string, Step> = { intention: 'intention', fotos: 'fotos', verifizierung: 'verifizierung', beruf: 'profil', prompts: 'profil', voice: 'profil', kodex: 'kodex' };
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{t('UI-DATE-KODEX-TITEL')}</h2>
      <blockquote className="card p-5 border-l-4 border-l-rose-400 flex flex-col gap-2 text-[15px] leading-relaxed">
        {[1, 2, 3, 4, 5].map((i) => (
          <p key={i}>{t(`UI-DATE-KODEX-${i}`)}</p>
        ))}
      </blockquote>
      <label className="flex items-start gap-3 card p-4">
        <input type="checkbox" className="accent-rose-400 w-5 h-5 mt-0.5" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <span>{t('UI-DATE-KODEX-CHECK')}</span>
      </label>
      {missing && missing.length > 0 && (
        <Banner kind="warn">
          <p className="mb-2">{t('UI-DATE-FEHLT-NOCH')}</p>
          <ul className="flex flex-col gap-1">
            {missing.map((m) => (
              <li key={m}>
                <button className="underline" onClick={() => onJump(STEP_OF[m] ?? 'profil')}>
                  {t(`UI-DATE-MIN-${m.toUpperCase()}`)}
                </button>
              </li>
            ))}
          </ul>
        </Banner>
      )}
      <BottomBar>
        <button
          className="btn-primary !bg-rose-400"
          disabled={!ok}
          onClick={async () => {
            try {
              const r = await api.post('/api/date/code', { accept: true });
              if (r.active) {
                toast(t('UI-DATE-FREIGESCHALTET'));
                onActive();
              } else setMissing(r.minimum.missing.filter((x: string) => x !== 'kodex'));
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          {t('UI-DATE-KODEX-OK')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── Profil bearbeiten ───────────────────────────

export function DateProfil() {
  const nav = useNavigate();
  const { data: me } = useDateMe();
  const [part, setPart] = useState<'vorschau' | 'fotos' | 'profil' | 'praeferenzen' | 'verifizierung'>('vorschau');
  const { data: own } = useAsync(() => api.get('/api/date/profile'), [part]);
  if (!me || !me.status) return <div className="min-h-screen"><Header title={t('UI-DATE-PROFIL-BEARBEITEN')} back /><Page><Skeleton className="h-40" /></Page></div>;
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-DATE-PROFIL-BEARBEITEN')}
        back="/date"
        sub={
          <div className="scroll-x flex gap-2 px-4 pb-2" role="tablist">
            {(['vorschau', 'fotos', 'profil', 'praeferenzen', 'verifizierung'] as const).map((k) => (
              <button key={k} role="tab" aria-selected={part === k} className={`chip min-h-tap ${part === k ? 'border-rose-400 text-rose-200' : ''}`} onClick={() => setPart(k)}>
                {t(`UI-DATE-TEIL-${k.toUpperCase()}`)}
              </button>
            ))}
          </div>
        }
      />
      <Page className="flex-1 pb-28">
        {me.minimum && !me.minimum.ok && me.status !== 'onboarding' && <Banner kind="warn">{t('UI-DATE-MINIMUM-FEHLT')}</Banner>}
        {part === 'vorschau' && (own?.view ? <div className="max-w-md mx-auto"><p className="text-sm muted mb-3">{t('UI-DATE-SO-SIEHT-ES-AUS')}</p><DateProfileCard p={own.view} /></div> : <Skeleton className="h-64" />)}
        {part === 'fotos' && <PhotosEditor me={me} />}
        {part === 'profil' && <ProfileEditor me={me} />}
        {part === 'praeferenzen' && <PreferencesEditor me={me} />}
        {part === 'verifizierung' && <Verification me={me} />}
        {me.status === 'onboarding' && (
          <button className="btn-secondary w-full mt-6" onClick={() => nav('/date/onboarding')}>
            {t('UI-DATE-EINRICHTEN')}
          </button>
        )}
      </Page>
    </div>
  );
}

// ─────────────────────────── Einstellungen ───────────────────────────

export function DateEinstellungen() {
  const nav = useNavigate();
  const { toast, refreshCounts } = useApp();
  const { data: me, reload } = useDateMe();
  const [leave, setLeave] = useState(false);
  const [confirm, setConfirm] = useState('');
  if (!me) return <div className="min-h-screen"><Header title={t('UI-DATE-EINSTELLUNGEN')} back /><Page><Skeleton className="h-40" /></Page></div>;
  const set = async (b: Record<string, unknown>) => {
    try {
      await api.put('/api/date/settings', b);
      reload();
      refreshCounts();
    } catch (e) {
      toast(errText(e));
    }
  };
  return (
    <div className="min-h-screen">
      <Header title={t('UI-DATE-EINSTELLUNGEN')} back />
      <Page>
        <div className="card px-4 divide-y divide-linie">
          <Toggle checked={!me.hidden} onChange={(v) => set({ hidden: !v })} label={t('UI-DATE-REITER-ZEIGEN')} hint={t('UI-DATE-REITER-ZEIGEN-ERKL')} />
          {me.status && me.status !== 'gesperrt' && (
            <Toggle checked={!!me.settings?.badgeInGrid} onChange={(v) => set({ badgeInGrid: v })} label={t('UI-DATE-BADGE-GRID')} hint={t('UI-DATE-BADGE-GRID-ERKL')} />
          )}
        </div>
        {me.status && me.status !== 'gesperrt' && (
          <>
            <Section title={t('UI-DATE-NSFW-TITEL')}>
              <p className="text-sm muted mb-2">{t('UI-DATE-NSFW-ERKL')}</p>
              <div className="flex flex-col gap-2" role="radiogroup">
                {(['freigabe', 'nein', 'ja'] as const).map((k) => (
                  <button key={k} role="radio" aria-checked={me.settings?.nsfwReceive === k} className={`card p-3 text-left ${me.settings?.nsfwReceive === k ? 'border-rose-400 bg-rose-500/10' : ''}`} onClick={() => set({ nsfwReceive: k })}>
                    <span className="block font-medium">{t(`UI-DATE-NSFW-${k.toUpperCase()}`)}</span>
                    <span className="block text-sm muted">{t(`UI-DATE-NSFW-${k.toUpperCase()}-ERKL`)}</span>
                  </button>
                ))}
              </div>
            </Section>
            <Section title={t('UI-DATE-PAUSE-TITEL')}>
              {me.status === 'pausiert' ? (
                <button className="btn-secondary w-full" onClick={() => api.post('/api/date/resume').then(reload)}>
                  {t('UI-DATE-FORTSETZEN')}
                </button>
              ) : me.status === 'aktiv' ? (
                <>
                  <p className="text-sm muted mb-2">{t('UI-DATE-PAUSE-ERKL')}</p>
                  <button className="btn-secondary w-full" onClick={() => api.post('/api/date/pause').then(reload)}>
                    {t('UI-DATE-PAUSIEREN')}
                  </button>
                </>
              ) : null}
            </Section>
            <Section title={t('UI-DATE-VERLASSEN')}>
              <p className="text-sm muted mb-2">{t('UI-DATE-VERLASSEN-ERKL')}</p>
              <button className="btn-danger w-full" onClick={() => setLeave(true)}>
                {t('UI-DATE-VERLASSEN')}
              </button>
            </Section>
          </>
        )}
        <p className="text-xs muted mt-6">
          <Link to="/date" className="underline">
            {t('UI-DATE-ZURUECK-ZU-DATE')}
          </Link>
        </p>
      </Page>
      <Sheet open={leave} onClose={() => setLeave(false)} title={t('UI-DATE-VERLASSEN')}>
        <p className="mb-3">{t('UI-DATE-VERLASSEN-FRAGE')}</p>
        <Field label={t('UI-DATE-VERLASSEN-TIPPEN')} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />
        <button
          className="btn-danger w-full"
          disabled={confirm.trim().toUpperCase() !== 'VERLASSEN'}
          onClick={async () => {
            try {
              await api.del('/api/date', { confirm: 'VERLASSEN' });
              refreshCounts();
              nav('/date', { replace: true });
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          {t('UI-DATE-VERLASSEN-JETZT')}
        </button>
      </Sheet>
    </div>
  );
}

/** S30 Chats · S31 Chat · S32 Eisbrecher · S33 Privates Album · eigenes Album. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Banner, Empty, Header, Icon, Page, Sheet, Skeleton, Toggle, useAsync } from '../components/ui';
import { AudioPlayer, VoiceRecorder, type Recorded } from '../components/voice';
import { EmojiPicker, insertAtCursor } from '../components/emoji';
import { ReportSheet, useBlock, type ReportItem } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { on } from '../lib/realtime';
import { enablePush, isIosSafariNotInstalled, pushSupported } from '../lib/push';
import { ACTIVITY_TEXT, fmtTime, fmtWhen, t } from '../lib/texts';

// ─────────────────────────── S30 · Liste ───────────────────────────

export function Chats() {
  const nav = useNavigate();
  const [box, setBox] = useState<'gespraeche' | 'anfragen' | 'archiv'>('gespraeche');
  const [list, setList] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [explain, setExplain] = useState(true);
  const [menuFor, setMenuFor] = useState<any | null>(null);
  const [reportFor, setReportFor] = useState<any | null>(null);
  const { block, sheet } = useBlock();

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/conversations');
      setList(r.conversations);
      idbSet('gespraeche', r.conversations);
      setErr(null);
    } catch (e) {
      setErr(errText(e));
      const cached = await idbGet<any[]>('gespraeche');
      if (cached) setList(cached);
    }
  }, []);

  useEffect(() => {
    load();
    return on('nachricht', () => load());
  }, [load]);

  const rows = (list ?? []).filter((c) => c.box === box);
  // Issue #14: ungelesene Gespräche je Reiter — der Lesestand kommt vom Server (nur der eigene)
  const counts: Record<string, number> = {
    gespraeche: (list ?? []).filter((c) => c.box === 'gespraeche' && c.unread > 0).length,
    anfragen: (list ?? []).filter((c) => c.box === 'anfragen' && c.unread > 0).length,
  };

  return (
    <>
      <Header
        title={t('UI-TAB-CHATS')}
        sub={
          <div className="flex gap-2 px-4 pb-2" role="tablist">
            {(['gespraeche', 'anfragen'] as const).map((b) => (
              <button key={b} role="tab" aria-selected={box === b} className={`chip min-h-tap ${box === b ? 'border-akzent text-akzent' : ''}`} onClick={() => setBox(b)}>
                {t(b === 'gespraeche' ? 'ST-CHAT-02' : 'ST-CHAT-01')}
                {counts[b] > 0 && <span className="ml-1 rounded-full bg-gefahr text-white px-1.5 text-xs" aria-label={t('UI-CHATS-UNGELESEN', { zahl: counts[b] })}>{counts[b]}</span>}
              </button>
            ))}
            <button role="tab" aria-selected={box === 'archiv'} className={`chip min-h-tap ${box === 'archiv' ? 'border-akzent text-akzent' : ''}`} onClick={() => setBox('archiv')}>
              {t('UI-CHATS-ARCHIV')}
            </button>
          </div>
        }
      />
      <Page>
        {err && !list && <Banner kind="error">{err}</Banner>}
        {box === 'anfragen' && (
          <div className="mb-3">
            <button className="text-sm muted underline" onClick={() => setExplain(!explain)} aria-expanded={explain}>
              {t('UI-CHATS-WAS-SIND-ANFRAGEN')}
            </button>
            {explain && <p className="text-sm muted mt-1">{t('ST-CHAT-03')}</p>}
          </div>
        )}
        {box === 'archiv' && <p className="text-sm muted mb-3">{t('ST-CHAT-20')}</p>}
        {!list ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty
            text={t(box === 'gespraeche' ? 'ST-LEER-11' : box === 'anfragen' ? 'ST-LEER-10' : 'ST-LEER-12')}
            action={
              box === 'gespraeche' ? (
                <button className="btn-secondary" onClick={() => nav('/naehe')}>
                  {t('UI-CHATS-ZUM-RASTER')}
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="card overflow-hidden">
            {rows.map((c) => {
              const fresh = c.unread > 0;
              return (
                <li key={c.id} className={`border-b border-linie last:border-b-0 flex items-center ${fresh ? 'bg-akzent/5' : ''}`} onContextMenu={(e) => (e.preventDefault(), setMenuFor(c))}>
                  <button className="flex-1 flex items-center gap-3 px-3 py-3 text-left hover:bg-flaeche2 min-w-0" onClick={() => nav(`/chats/${c.id}`)} aria-label={`${c.other.name ?? ''}${fresh ? `, ${t('UI-CHATS-UNGELESEN', { zahl: c.unread })}` : ''}`}>
                    <span className="relative shrink-0">
                      <Avatar name={c.other.name} initial={c.other.initial} color={c.other.color} photo={c.other.photo} size={48} />
                      {c.other.activity === 1 && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gut border-2 border-flaeche" aria-hidden="true" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className={`truncate ${fresh ? 'font-semibold text-text' : ''}`}>{c.other.name ?? t('UI-CHATS-NICHT-MEHR-DA')}</span>
                        {c.disappearing && <Icon name="clock" className="w-4 h-4 muted shrink-0" />}
                      </span>
                      <span className={`block text-sm truncate ${fresh ? 'text-text' : 'muted'}`}>{preview(c)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs ${fresh ? 'text-gefahr font-semibold' : 'muted'}`}>{fmtWhen(c.lastAt)}</span>
                      {fresh && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gefahr text-white text-xs font-semibold grid place-items-center">{c.unread > 99 ? '99+' : c.unread}</span>}
                    </span>
                  </button>
                  <button className="btn-ghost px-2" onClick={() => setMenuFor(c)} aria-label={t('UI-APP-MENUE')}>
                    <Icon name="more" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Page>
      <Sheet open={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.other?.name ?? ''}>
        <div className="flex flex-col gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setReportFor(menuFor);
              setMenuFor(null);
            }}
          >
            {t('ST-MEL-01')}
          </button>
          {menuFor?.other?.id && (
            <button
              className="btn-danger"
              onClick={() => {
                const c = menuFor;
                setMenuFor(null);
                block(c.other.id, c.other.name, load);
              }}
            >
              {t('ST-BLO-01')}
            </button>
          )}
        </div>
      </Sheet>
      <ReportSheet open={!!reportFor} onClose={() => setReportFor(null)} targetId={reportFor?.other?.id} targetName={reportFor?.other?.name} context="gespraech" contextId={reportFor?.id} onBlocked={load} />
      {sheet}
    </>
  );
}

function preview(c: any) {
  if (!c.last) return '';
  if (c.last.kind === 'image') return `${c.last.mine ? `${t('UI-CHAT-DU')}: ` : ''}${c.last.once ? '⏱ ' : '📷 '}${t('UI-CHAT-BILD')}`;
  if (c.last.kind === 'audio') return `${c.last.mine ? `${t('UI-CHAT-DU')}: ` : ''}🎤 ${t('UI-SPRACHE')}`;
  if (c.last.kind === 'place') return t('UI-CHAT-ORT');
  if (c.last.kind === 'album_offer') return t('UI-CHAT-ALBUM');
  if (c.last.kind === 'system') return t(`UI-SYS-${String(c.last.system ?? '').toUpperCase().replace(/_/g, '-')}`);
  return `${c.last.mine ? `${t('UI-CHAT-DU')}: ` : ''}${c.last.text ?? ''}`;
}

// ─────────────────────────── S31 · Einzelansicht ───────────────────────────

interface Pending {
  ref: string;
  text: string;
  failed?: boolean;
}


export function Chat() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { config, toast, refreshCounts, refreshMe, me } = useApp();
  const newTo = id === 'neu' ? params.get('an') : null;
  const [data, setData] = useState<any | null>(null);
  const [other, setOther] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [sheet, setSheet] = useState<null | 'menu' | 'report' | 'push' | 'bild' | 'anhang' | 'vorlagen' | 'alben' | 'einmal'>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [startersHidden, setStartersHidden] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [exitUntil, setExitUntil] = useState<number | null>(null);
  const [onceView, setOnceView] = useState<{ url: string; seconds: number; messageId: string } | null>(null);
  const [reportPreset, setReportPreset] = useState<string | null>(null);
  const [screenshotNote, setScreenshotNote] = useState(() => !localStorage.getItem(`bildschirmfoto:${id}`));
  const fileRef = useRef<HTMLInputElement>(null);
  const onceFileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { block, sheet: blockSheet } = useBlock();

  const load = useCallback(async () => {
    if (!id || id === 'neu') return;
    try {
      const r = await api.get(`/api/conversations/${id}`);
      setData(r);
      idbSet(`gespraech:${id}`, r);
      refreshCounts();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setErr(t('ST-BLO-02', { name: t('UI-DIE-PERSON') }).split('.')[0]);
        return;
      }
      const cached = await idbGet<any>(`gespraech:${id}`);
      if (cached) setData(cached);
      setErr(errText(e));
    }
  }, [id, refreshCounts]);

  const loadStarters = useCallback(async (to: string | undefined) => {
    if (!to) return;
    const r = await api.get(`/api/icebreakers/${to}`).catch(() => null);
    if (r) setStarters(r.suggestions);
  }, []);

  // Neues Gespräch: gibt es schon eines mit dieser Person?
  useEffect(() => {
    if (!newTo) return;
    api.get('/api/conversations').then((r) => {
      const c = r.conversations.find((x: any) => x.other?.id === newTo);
      if (c) nav(`/chats/${c.id}`, { replace: true });
    });
    api
      .get(`/api/profiles/${newTo}`)
      .then((r) => setOther(r.profile))
      .catch(() => setErr(t('UI-PROFIL-WEG')));
    if (me?.profile?.settings?.startersEnabled !== false) loadStarters(newTo);
  }, [newTo, nav, loadStarters, me]);

  useEffect(() => {
    load();
    return on('nachricht', (d: any) => d?.conversationId === id && load());
  }, [id, load]);

  // Issue #30: Vorschläge nur im leeren Chat
  useEffect(() => {
    if (data?.icebreakerAvailable && data.startersEnabled && data.conversation?.other?.id) loadStarters(data.conversation.other.id);
  }, [data?.icebreakerAvailable, data?.startersEnabled, data?.conversation?.other?.id, loadStarters]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages?.length, pending.length]);

  // Nach dem Prüfablauf: zurückgehaltene Nachricht senden (S34.06)
  useEffect(() => {
    const held = sessionStorage.getItem('zurueckgehalten');
    if (!held) return;
    const h = JSON.parse(held);
    if ((newTo && h.to === newTo) || (!newTo && h.conv === id)) {
      sessionStorage.removeItem('zurueckgehalten');
      setText(h.text);
    }
  }, [id, newTo]);

  const conv = data?.conversation;
  const otherInfo = conv?.other ?? (other ? { id: other.id, name: other.name, initial: other.initial, color: other.color, photo: other.photo, activity: other.activity } : null);
  const firstContact = !!newTo || (conv && !conv.bothWrote);
  const ended = conv?.state === 'ended';
  const hasMessages = (data?.messages ?? []).some((m: any) => m.kind !== 'system') || pending.length > 0;
  const showStarters = starters.length > 0 && !startersHidden && !text && !hasMessages && (newTo ? me?.profile?.settings?.startersEnabled !== false : data?.startersEnabled);
  const voiceReason = !conv ? t('UI-SPRACHE-ERST-ANTWORT') : data?.voiceAllowed ? null : data?.voiceBlocked === 'aus' ? t('UI-SPRACHE-AUS') : t('UI-SPRACHE-ERST-ANTWORT');

  const askPush = () => {
    if (!pushSupported() || localStorage.getItem('push-gefragt')) return;
    if (Notification.permission !== 'default') return;
    setSheet('push');
  };

  const handleWriteError = (e: unknown, draft: string) => {
    if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) {
      sessionStorage.setItem('zurueckgehalten', JSON.stringify({ to: newTo, conv: id, text: draft }));
      nav(`/pruefung?weiter=${encodeURIComponent(location.pathname + location.search)}`);
      return true;
    }
    return false;
  };

  const send = async (draft = text, ref = `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`) => {
    const body = draft.trim();
    if (!body) return;
    if (draft === text) setText('');
    setEmojiOpen(false);
    setPending((p) => [...p.filter((x) => x.ref !== ref), { ref, text: body }]);
    try {
      if (newTo) {
        const r = await api.post('/api/conversations', { to: newTo, text: body, clientRef: ref });
        askPush();
        nav(`/chats/${r.conversationId}`, { replace: true });
      } else {
        await api.post(`/api/conversations/${id}/messages`, { text: body, clientRef: ref });
        askPush();
        await load();
      }
      setPending((p) => p.filter((x) => x.ref !== ref));
    } catch (e) {
      if (handleWriteError(e, body)) {
        setPending((p) => p.filter((x) => x.ref !== ref));
        return;
      }
      setPending((p) => p.map((x) => (x.ref === ref ? { ...x, failed: true } : x)));
      if (!(e instanceof ApiError && e.status === 0)) toast(errText(e));
    }
  };

  // Offline-Ausgang: beim Wiederverbinden erneut senden (ST-LEER-31)
  useEffect(() => {
    const retry = () => pending.filter((x) => x.failed).forEach((x) => send(x.text, x.ref));
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  });

  const sendImage = async (f: File | undefined, once = false) => {
    if (!f || !id) return;
    try {
      await api.upload(`/api/conversations/${id}/images`, f, once ? { once: 'true' } : {});
      if (once) refreshMe();
      await load();
    } catch (e) {
      if (!handleWriteError(e, '')) toast(errText(e));
    }
  };

  const sendVoice = async (r: Recorded) => {
    if (!id) return;
    try {
      const fd = new FormData();
      fd.append('clientRef', `v${Date.now()}`);
      fd.append('file', r.blob, r.mime.includes('mp4') ? 'sprache.m4a' : 'sprache.webm');
      const res = await fetch(`/api/conversations/${id}/audio`, { method: 'POST', headers: { 'x-cruizy': '1' }, body: fd, credentials: 'same-origin' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new ApiError(res.status, j?.fehler ?? 'ST-FEH-02', j?.code ?? null, j?.vars ?? {});
      }
      await load();
    } catch (e) {
      toast(errText(e));
      throw e;
    }
  };

  const openOnce = async (messageId: string) => {
    try {
      const r = await api.post(`/api/conversations/${id}/messages/${messageId}/open`);
      setOnceView({ url: r.url, seconds: r.seconds, messageId });
    } catch (e) {
      toast(errText(e));
      load();
    }
  };

  const exit = async () => {
    try {
      const r = await api.post(`/api/conversations/${id}/exit`);
      setExitUntil(new Date(r.undoUntil).getTime());
      setTimeout(() => {
        setExitUntil(null);
        load();
      }, new Date(r.undoUntil).getTime() - Date.now() + 700);
    } catch (e) {
      toast(errText(e));
    }
  };

  const undoExit = async () => {
    try {
      await api.del(`/api/conversations/${id}/exit`);
      setExitUntil(null);
    } catch (e) {
      toast(errText(e));
    }
  };

  const reportItems: ReportItem[] = (data?.messages ?? [])
    .filter((m: any) => !m.mine && (m.kind === 'text' || m.kind === 'image' || m.kind === 'audio'))
    .slice(-30)
    .map((m: any) => ({
      kind: 'message',
      id: m.id,
      label: m.kind === 'image' ? `${t('UI-CHAT-BILD')} · ${fmtTime(m.createdAt)}` : m.kind === 'audio' ? `${t('UI-SPRACHE')} · ${fmtTime(m.createdAt)}` : `${m.text} · ${fmtTime(m.createdAt)}`,
      image: m.kind === 'image',
    }));

  const pickEmoji = (e: string) => {
    const r = insertAtCursor(inputRef.current, e, text);
    setText(r.text);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(r.caret, r.caret);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={otherInfo?.name ?? ''}
        back="/chats"
        right={
          <>
            <button className="btn-ghost px-2" onClick={() => nav(`/ich/sicherheit${id && id !== 'neu' ? `?gespraech=${id}` : ''}`)} aria-label={t('ST-SIC-01')}>
              <Icon name="shield" />
              <span className="text-xs hidden sm:inline">{t('ST-SIC-01')}</span>
            </button>
            {conv && (
              <button className="btn-ghost px-2" onClick={() => setSheet('menu')} aria-label={t('UI-APP-MENUE')}>
                <Icon name="more" />
              </button>
            )}
          </>
        }
        sub={
          otherInfo?.id && (
            <button className="flex items-center gap-2 px-4 pb-2 text-left" onClick={() => nav(`/profil/${otherInfo.id}`)}>
              <Avatar name={otherInfo.name} initial={otherInfo.initial} color={otherInfo.color} photo={otherInfo.photo} size={32} />
              <span className="text-sm muted">{otherInfo.activity ? t('ST-PRO-20', { band: t(ACTIVITY_TEXT[otherInfo.activity]) }) : ''}</span>
            </button>
          )
        }
      />
      <div className="flex-1 max-w-2xl w-full mx-auto px-3 py-3 flex flex-col gap-2">
        {err && <Banner kind="error">{err}</Banner>}
        {conv?.disappearing && <Banner>{t('ST-CHAT-32')}</Banner>}
        {ended && (
          <Banner>
            {conv.endedByMe ? t('ST-CHAT-12') : t('ST-CHAT-13', { name: otherInfo?.name ?? t('UI-DIE-PERSON') })} {t('ST-CHAT-20')}
          </Banner>
        )}
        {data?.fromOutside && <Banner>{t('ST-STO-46')}</Banner>}
        {conv?.mediaRequest && (
          <Banner
            action={
              <div className="flex gap-2">
                <button
                  className="btn-primary"
                  onClick={async () => {
                    await api.post(`/api/conversations/${id}/media-request`, { decision: 'zulassen' });
                    toast(t('ST-CHAT-71'));
                    load();
                  }}
                >
                  {t('UI-CHAT-ZULASSEN')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await api.post(`/api/conversations/${id}/media-request`, { decision: 'ablehnen' });
                    toast(t('ST-CHAT-72', { name: otherInfo?.name ?? '' }));
                    load();
                  }}
                >
                  {t('UI-CHAT-ABLEHNEN')}
                </button>
              </div>
            }
          >
            {t('ST-CHAT-70', { name: otherInfo?.name ?? '' }).replace(/\s*\[[^\]]+\]/g, '')}
          </Banner>
        )}
        {screenshotNote && data?.messages?.some((m: any) => m.kind === 'image' && !m.mine) && (
          <Banner
            action={
              <button
                className="btn-ghost px-0"
                onClick={() => {
                  localStorage.setItem(`bildschirmfoto:${id}`, '1');
                  setScreenshotNote(false);
                }}
              >
                {t('ST-KON-32')}
              </button>
            }
          >
            {t('ST-CHAT-46')}
          </Banner>
        )}
        {!data && !newTo && !err && <Skeleton className="h-40" />}
        {(data?.messages ?? []).map((m: any) => (
          <Message key={m.id} m={m} otherName={otherInfo?.name} onChange={load} onOpenOnce={openOnce} />
        ))}
        {pending.map((p) => (
          <div key={p.ref} className="self-end max-w-[80%]">
            <button className={`rounded-2xl px-3 py-2 bg-akzentdunkel/60 text-left ${p.failed ? 'border border-gefahr' : ''}`} onClick={() => p.failed && send(p.text, p.ref)}>
              <span className="whitespace-pre-wrap">{p.text}</span>
            </button>
            <p className="text-xs muted text-right mt-0.5">{p.failed ? (navigator.onLine ? t('ST-FEH-33') : t('ST-LEER-31')) : '…'}</p>
          </div>
        ))}
        {conv?.bothWrote && !ended && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="card p-3 text-sm text-left" onClick={() => nav(`/ich/treffpunkt?gespraech=${id}`)}>
              {t('ST-SIC-20')}
            </button>
            <button className="card p-3 text-sm text-left" onClick={() => nav(`/ich/check-in?gespraech=${id}`)}>
              {t('ST-SIC-10')}
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-grund/95 backdrop-blur border-t border-linie safe-bottom">
        <div className="max-w-2xl mx-auto px-3 py-2 flex flex-col gap-2">
          {exitUntil ? (
            <div className="flex items-center gap-3">
              <span className="flex-1 text-sm">{t('ST-CHAT-11')}</span>
              <button className="btn-secondary" onClick={undoExit}>
                {t('ST-BLO-04')}
              </button>
            </div>
          ) : ended ? (
            conv.endedByMe ? (
              <div className="flex flex-col gap-1">
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await api.post(`/api/conversations/${id}/reopen`);
                    load();
                  }}
                >
                  {t('ST-CHAT-21')}
                </button>
                <p className="text-xs muted">{t('ST-CHAT-22', { name: otherInfo?.name ?? '' })}</p>
              </div>
            ) : (
              <p className="text-sm muted">{t('ST-CHAT-23')}</p>
            )
          ) : (
            <>
              {showStarters && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs muted">{t('UI-STARTER-TITEL')}</span>
                    <button className="text-xs text-akzent" onClick={() => loadStarters(newTo ?? otherInfo?.id)}>
                      {t('UI-STARTER-ANDERE')}
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {starters.map((s) => (
                      <button
                        key={s}
                        className="chip min-h-tap shrink-0 max-w-[80%] text-left whitespace-normal"
                        onClick={() => {
                          // nie automatisch senden — der Text bleibt bearbeitbar
                          setText(s);
                          setStartersHidden(true);
                          requestAnimationFrame(() => inputRef.current?.focus());
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!recording && (
                <div className="flex gap-2 overflow-x-auto">
                  {conv && !newTo && (
                    <button className="chip min-h-tap shrink-0" onClick={exit}>
                      {t('ST-CHAT-10')}
                    </button>
                  )}
                  <button className="chip min-h-tap shrink-0" onClick={() => setSheet('vorlagen')}>
                    <Icon name="list" className="w-4 h-4" />
                    {t('UI-VORLAGEN')}
                  </button>
                </div>
              )}
              {emojiOpen && !recording && <EmojiPicker onPick={pickEmoji} />}
              <div className="flex items-end gap-1">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => (sendImage(e.target.files?.[0]), (e.target.value = ''))} />
                <input ref={onceFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => (sendImage(e.target.files?.[0], true), (e.target.value = ''))} />
                {!recording && (
                  <>
                    <button
                      className="btn-ghost px-2"
                      disabled={!conv}
                      onClick={() => (data?.mediaAllowed ? setSheet('anhang') : setSheet('bild'))}
                      aria-label={t('UI-CHAT-BILD-SENDEN')}
                      title={!data?.mediaAllowed ? t('ST-FEH-30', { name: otherInfo?.name ?? '' }) : undefined}
                    >
                      <Icon name="plus" className={`w-5 h-5 ${data?.mediaAllowed ? '' : 'opacity-40'}`} />
                    </button>
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        className="input py-2 pr-10 min-h-tap max-h-40 resize-none"
                        rows={1}
                        placeholder={firstContact ? t('ST-CHAT-04') : t('UI-CHAT-NACHRICHT')}
                        value={text}
                        maxLength={config?.params.messageMax ?? 2000}
                        onChange={(e) => {
                          setText(e.target.value);
                          if (e.target.value) setStartersHidden(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        aria-label={t('UI-CHAT-NACHRICHT')}
                      />
                      <button className="absolute right-1 bottom-1 btn-ghost px-1.5 min-h-0 h-9" onClick={() => setEmojiOpen(!emojiOpen)} aria-label={t('UI-EMOJI')} aria-expanded={emojiOpen}>
                        <Icon name="smile" />
                      </button>
                    </div>
                  </>
                )}
                {text.trim() ? (
                  <button className="btn-primary px-3" onClick={() => send()} aria-label={t('UI-CHAT-SENDEN')}>
                    <Icon name="send" />
                  </button>
                ) : (
                  <div className={recording ? 'flex-1' : ''}>
                    <VoiceRecorder maxSeconds={config?.params.voiceMaxS ?? 320} disabledReason={voiceReason} onSend={sendVoice} onError={(m) => toast(m)} onActive={setRecording} />
                  </div>
                )}
              </div>
              {firstContact && !data?.mediaAllowed && <p className="text-xs muted">{t('ST-FEH-30', { name: otherInfo?.name ?? '' })}</p>}
            </>
          )}
        </div>
      </div>

      <Sheet open={sheet === 'bild'} onClose={() => setSheet(null)} title={t('UI-CHAT-BILD-SENDEN')}>
        <p>{t('ST-FEH-30', { name: otherInfo?.name ?? '' })}</p>
      </Sheet>
      <Sheet open={sheet === 'anhang'} onClose={() => setSheet(null)} title={t('UI-CHAT-BILD-SENDEN')}>
        <div className="grid grid-cols-3 gap-2">
          <button className="card p-4 flex flex-col items-center gap-2" onClick={() => (setSheet(null), fileRef.current?.click())}>
            <Icon name="image" className="w-7 h-7 text-akzent" />
            <span className="text-sm">{t('UI-CHAT-BILD')}</span>
          </button>
          <button
            className="card p-4 flex flex-col items-center gap-2"
            onClick={() => {
              if (!data?.onceHintSeen && !localStorage.getItem('einmal-erklaert')) setSheet('einmal');
              else {
                setSheet(null);
                onceFileRef.current?.click();
              }
            }}
          >
            <Icon name="clock" className="w-7 h-7 text-akzent" />
            <span className="text-sm text-center">{t('UI-EINMAL')}</span>
          </button>
          <button className="card p-4 flex flex-col items-center gap-2" onClick={() => setSheet('alben')}>
            <Icon name="album" className="w-7 h-7 text-akzent" />
            <span className="text-sm text-center">{t('UI-CHAT-ALBUM-TEILEN')}</span>
          </button>
        </div>
      </Sheet>
      <Sheet open={sheet === 'einmal'} onClose={() => setSheet(null)} title={t('UI-EINMAL')}>
        <div className="flex flex-col gap-3">
          <Icon name="clock" className="w-8 h-8 text-akzent" />
          <p>{t('UI-EINMAL-HINWEIS')}</p>
          <button
            className="btn-primary"
            onClick={() => {
              localStorage.setItem('einmal-erklaert', '1');
              setSheet(null);
              onceFileRef.current?.click();
            }}
          >
            {t('UI-EINMAL-VERSTANDEN')}
          </button>
        </div>
      </Sheet>
      <TemplatesSheet
        open={sheet === 'vorlagen'}
        onClose={() => setSheet(null)}
        onSend={(txt) => {
          setSheet(null);
          send(txt);
        }}
      />
      <AlbumPickerSheet
        open={sheet === 'alben'}
        onClose={() => setSheet(null)}
        onPick={async (albumId) => {
          try {
            await api.post('/api/album/offer', { conversationId: id, albumId });
            setSheet(null);
            toast(t('UI-ALBEN-GETEILT'));
            load();
          } catch (e) {
            toast(errText(e));
          }
        }}
      />
      <Sheet open={sheet === 'menu'} onClose={() => setSheet(null)} title={otherInfo?.name ?? ''}>
        <div className="flex flex-col gap-2">
          <button className="btn-secondary" onClick={() => setSheet('report')}>
            {t('ST-MEL-01')}
          </button>
          {otherInfo?.id && (
            <button
              className="btn-danger"
              onClick={() => {
                setSheet(null);
                block(otherInfo.id, otherInfo.name, () => nav('/chats'));
              }}
            >
              {t('ST-BLO-01')}
            </button>
          )}
          {conv && !ended && (conv.disappearingMine || !conv.disappearing) && (
            <button
              className="btn-secondary text-left"
              onClick={async () => {
                try {
                  await api.post(`/api/conversations/${id}/disappearing`, { on: !conv.disappearing });
                  setSheet(null);
                  load();
                } catch (e) {
                  toast(errText(e));
                }
              }}
            >
              <span>
                {conv.disappearing ? t('UI-CHAT-VERFALL-AUS') : t('ST-CHAT-30')}
                {!conv.disappearing && <span className="block text-xs muted">{t('ST-CHAT-31')}</span>}
              </span>
            </button>
          )}
          {data?.faceUnlock?.possible && !ended && (
            <button
              className="btn-secondary text-left"
              onClick={async () => {
                try {
                  await api.post(`/api/conversations/${id}/face`, { on: !data.faceUnlock.active });
                  toast(data.faceUnlock.active ? t('ST-CHAT-52', { name: otherInfo?.name ?? '' }) : t('ST-CHAT-51', { name: otherInfo?.name ?? '' }), undefined, 8000);
                  setSheet(null);
                  load();
                } catch (e) {
                  toast(errText(e));
                }
              }}
            >
              {data.faceUnlock.active ? t('UI-CHAT-GESICHT-AUS') : t('ST-CHAT-50')}
            </button>
          )}
          {conv && !ended && data?.mediaAllowed && (
            <button className="btn-secondary" onClick={() => setSheet('alben')}>
              {t('UI-CHAT-ALBUM-TEILEN')}
            </button>
          )}
        </div>
      </Sheet>
      <Sheet
        open={sheet === 'push'}
        onClose={() => {
          localStorage.setItem('push-gefragt', '1');
          setSheet(null);
        }}
        title={t('ST-REC-10')}
      >
        <div className="flex flex-col gap-3">
          <Icon name="bell" className="w-8 h-8 text-akzent" />
          <p>{t('ST-REC-11')}</p>
          <p className="text-sm muted">{t('ST-REC-12')}</p>
          <p className="text-sm muted">{t('ST-REC-15')}</p>
          {isIosSafariNotInstalled() ? (
            <button className="btn-primary" onClick={() => nav('/home-bildschirm')}>
              {t('ST-KON-60')}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={async () => {
                localStorage.setItem('push-gefragt', '1');
                setSheet(null);
                const r = await enablePush(config?.vapidKey ?? '');
                if (r === 'abgelehnt') toast(t('ST-REC-16'));
                if (r === 'blockiert') toast(t('ST-REC-06'));
              }}
            >
              {t('ST-REC-13')}
            </button>
          )}
          <button
            className="btn-ghost"
            onClick={() => {
              localStorage.setItem('push-gefragt', '1');
              setSheet(null);
              toast(t('ST-REC-16'));
            }}
          >
            {t('ST-REC-14')}
          </button>
        </div>
      </Sheet>
      <ReportSheet
        open={sheet === 'report'}
        onClose={() => setSheet(null)}
        targetId={otherInfo?.id}
        targetName={otherInfo?.name}
        context="gespraech"
        contextId={id}
        items={reportItems}
        onBlocked={() => nav('/chats')}
      />
      {onceView && (
        <OnceViewer
          view={onceView}
          onClose={() => {
            setOnceView(null);
            load();
          }}
          onReport={() => {
            const mid = onceView.messageId;
            setOnceView(null);
            setReportPreset(mid);
          }}
        />
      )}
      <ReportSheet
        open={!!reportPreset}
        onClose={() => {
          setReportPreset(null);
          load();
        }}
        targetId={otherInfo?.id}
        targetName={otherInfo?.name}
        context="gespraech"
        contextId={id}
        items={reportPreset ? [{ kind: 'message', id: reportPreset, label: t('UI-EINMAL'), image: true }] : []}
        onBlocked={() => nav('/chats')}
      />
      {blockSheet}
    </div>
  );
}

/**
 * Anzeige eines Einmal-Bilds (Issue #26): Vollbild, höchstens P-EINMAL-ANZEIGE Sekunden,
 * ohne Speichern, Kontextmenü und Ziehen. Ehrlicher Hinweis: abfotografieren geht trotzdem.
 */
function OnceViewer({ view, onClose, onReport }: { view: { url: string; seconds: number }; onClose: () => void; onReport: () => void }) {
  const [left, setLeft] = useState(view.seconds);
  useEffect(() => {
    const iv = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    if (left <= 0) onClose();
  }, [left, onClose]);
  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col select-none" role="dialog" aria-modal="true" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex items-center gap-2 p-3 text-sm safe-top">
        <span className="flex-1 text-white/80">{t('UI-EINMAL-NOCH', { sekunden: Math.max(0, left) })}</span>
        <button className="btn-ghost text-white" onClick={onReport}>
          {t('ST-MEL-01')}
        </button>
        <button className="btn-ghost text-white px-2" onClick={onClose} aria-label={t('UI-APP-SCHLIESSEN')}>
          <Icon name="close" />
        </button>
      </div>
      <div className="flex-1 grid place-items-center overflow-hidden">
        <img src={view.url} alt="" className="max-w-full max-h-full pointer-events-none" draggable={false} />
      </div>
      <div className="h-1 bg-white/10">
        <div className="h-1 bg-akzent transition-all" style={{ width: `${(Math.max(0, left) / view.seconds) * 100}%` }} />
      </div>
      <p className="text-center text-xs text-white/70 p-3 safe-bottom">{t('UI-EINMAL-ANZEIGE')}</p>
    </div>
  );
}

/** Vorformulierte Nachrichten (Issue #21): ein Tipp sendet; Bearbeiten legt an, ändert, löscht. */
function TemplatesSheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (text: string) => void }) {
  const { toast } = useApp();
  const [data, setData] = useState<{ templates: { id: string; text: string }[]; max: number; maxChars: number } | null>(null);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const reload = () => api.get('/api/templates').then(setData).catch(() => {});
  useEffect(() => {
    if (open) {
      reload();
      setEdit(false);
      setDraft('');
      setEditing(null);
    }
  }, [open]);
  const save = async () => {
    try {
      if (editing) await api.patch(`/api/templates/${editing}`, { text: draft });
      else await api.post('/api/templates', { text: draft });
      setDraft('');
      setEditing(null);
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-VORLAGEN-TITEL')}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm muted flex-1">{t('UI-VORLAGEN-ERKL')}</p>
        <button className="btn-ghost" onClick={() => setEdit(!edit)}>
          {edit ? t('UI-VORLAGEN-FERTIG') : t('UI-VORLAGEN-BEARBEITEN')}
        </button>
      </div>
      {data && data.templates.length === 0 && !edit && <Empty text={t('UI-VORLAGEN-LEER')} action={<button className="btn-secondary" onClick={() => setEdit(true)}>{t('UI-VORLAGEN-NEU')}</button>} />}
      <ul className="flex flex-col gap-2">
        {data?.templates.map((x) => (
          <li key={x.id} className="flex items-stretch gap-2">
            <button className="card p-3 text-left flex-1 whitespace-pre-wrap break-words disabled:opacity-100" disabled={edit} onClick={() => onSend(x.text)}>
              {x.text}
            </button>
            {edit && (
              <div className="flex flex-col gap-1">
                <button className="btn-ghost px-2" onClick={() => (setEditing(x.id), setDraft(x.text))} aria-label={t('UI-VORLAGEN-BEARBEITEN')}>
                  <Icon name="edit" />
                </button>
                <button
                  className="btn-ghost px-2"
                  onClick={async () => {
                    await api.del(`/api/templates/${x.id}`);
                    reload();
                  }}
                  aria-label={t('UI-APP-LOESCHEN')}
                >
                  <Icon name="trash" />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {edit && data && (editing || data.templates.length < data.max) && (
        <div className="mt-3">
          <textarea className="input py-2 min-h-[90px]" value={draft} maxLength={data.maxChars} placeholder={t('UI-VORLAGEN-PLATZHALTER')} onChange={(e) => setDraft(e.target.value)} aria-label={t('UI-VORLAGEN-NEU')} />
          <div className="flex gap-2 mt-2">
            <button className="btn-primary flex-1" disabled={!draft.trim()} onClick={save}>
              {editing ? t('UI-APP-SPEICHERN') : t('UI-VORLAGEN-NEU')}
            </button>
            {editing && (
              <button className="btn-ghost" onClick={() => (setEditing(null), setDraft(''))}>
                {t('UI-SPRACHE-ABBRECHEN')}
              </button>
            )}
          </div>
        </div>
      )}
      {edit && data && data.templates.length >= data.max && !editing && <p className="text-sm muted mt-3">{t('UI-VORLAGEN-MAX', { max: data.max })}</p>}
    </Sheet>
  );
}

/** Welches Album teilen? (Issue #23) */
function AlbumPickerSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (albumId: string) => void }) {
  const nav = useNavigate();
  const [data, setData] = useState<any | null>(null);
  useEffect(() => {
    if (open) api.get('/api/albums').then(setData).catch(() => {});
  }, [open]);
  const usable = (data?.albums ?? []).filter((a: any) => a.count > 0);
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-ALBEN-WAEHLEN')}>
      {data && !usable.length ? (
        <Empty text={t('UI-ALBEN-LEER-TEILEN')} action={<button className="btn-secondary" onClick={() => nav('/alben')}>{t('UI-ALBEN')}</button>} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {usable.map((a: any) => (
            <button key={a.id} className="card overflow-hidden text-left" onClick={() => onPick(a.id)}>
              <div className="aspect-square bg-flaeche2">{a.cover && <img src={a.cover} alt="" className="w-full h-full object-cover" />}</div>
              <div className="p-2">
                <p className="font-semibold truncate">{a.name}</p>
                <p className="text-xs muted">{t('UI-ALBEN-BILDER', { zahl: a.count })}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function Message({ m, otherName, onChange, onOpenOnce }: { m: any; otherName?: string; onChange: () => void; onOpenOnce: (id: string) => void }) {
  const nav = useNavigate();
  const [full, setFull] = useState(false);
  if (m.kind === 'system') {
    const key = `UI-SYS-${String(m.system ?? '').toUpperCase().replace(/_/g, '-')}`;
    return <p className="self-center text-xs muted text-center px-4">{t(key, { name: m.actorIsMe ? t('UI-CHAT-DU') : otherName ?? '' })}</p>;
  }
  const side = m.mine ? 'self-end items-end' : 'self-start items-start';
  const bubble = m.mine ? 'bg-akzentdunkel text-white' : 'bg-flaeche2';
  return (
    <div className={`flex flex-col max-w-[80%] ${side}`}>
      {(m.kind === 'text' || m.kind === 'exit') && <div className={`rounded-2xl px-3 py-2 whitespace-pre-wrap break-words ${bubble} ${m.kind === 'exit' ? 'italic' : ''}`}>{m.text}</div>}
      {m.kind === 'image' && m.once && (
        m.mine ? (
          <div className="rounded-2xl px-3 py-3 bg-akzentdunkel/70 text-white text-sm flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4" />
            {m.once.state === 'neu' ? t('UI-EINMAL-GESENDET') : m.once.state === 'angesehen' ? t('UI-EINMAL-ANGESEHEN') : t('UI-EINMAL-ABGELAUFEN')}
          </div>
        ) : m.closed ? (
          <button className="rounded-2xl px-3 py-6 bg-flaeche2 text-sm" onClick={() => nav('/pruefung?art=age2')}>
            <Icon name="lock" className="w-5 h-5 inline mr-1" />
            {t('ST-VER-43')}
          </button>
        ) : m.once.state === 'neu' ? (
          <button className="rounded-2xl px-4 py-5 bg-flaeche2 border border-akzent/50 text-sm flex items-center gap-2" onClick={() => onOpenOnce(m.id)}>
            <Icon name="clock" className="w-5 h-5 text-akzent" />
            {t('UI-EINMAL-KACHEL')}
          </button>
        ) : (
          <div className="rounded-2xl px-3 py-3 bg-flaeche2 text-sm muted flex items-center gap-2">
            <Icon name="clock" className="w-4 h-4" />
            {m.once.state === 'angesehen' ? t('UI-EINMAL-ANGESEHEN') : t('UI-EINMAL-ABGELAUFEN')}
          </div>
        )
      )}
      {m.kind === 'image' &&
        !m.once &&
        (m.image ? (
          <>
            <button onClick={() => setFull(true)} aria-label={t('UI-CHAT-BILD')}>
              <img src={m.image} alt="" className="rounded-2xl max-h-72 object-cover bg-flaeche2" loading="lazy" onContextMenu={(e) => e.preventDefault()} draggable={false} />
            </button>
            {full && (
              <div className="fixed inset-0 z-50 bg-black grid place-items-center" onClick={() => setFull(false)} role="dialog">
                <img src={m.image} alt="" className="max-w-full max-h-full" onContextMenu={(e) => e.preventDefault()} draggable={false} />
              </div>
            )}
          </>
        ) : (
          <button className="rounded-2xl px-3 py-6 bg-flaeche2 text-sm" onClick={() => nav('/pruefung?art=age2')}>
            <Icon name="lock" className="w-5 h-5 inline mr-1" />
            {t('ST-VER-43')}
          </button>
        ))}
      {m.kind === 'audio' && m.audio && (
        <div className="w-64 max-w-full">
          <AudioPlayer src={m.audio.url} durationMs={m.audio.durationMs} own={m.mine} />
        </div>
      )}
      {m.kind === 'place' && m.place && (
        <button className="card p-3 text-left" onClick={() => nav(`/orte/${m.place.id}`)}>
          <span className="block text-xs muted">{t('ST-SIC-20')}</span>
          <span className="block font-semibold">{m.place.name}</span>
          <span className="block text-sm muted">{m.place.district}</span>
        </button>
      )}
      {m.kind === 'album_offer' && m.album && <AlbumOffer album={m.album} otherName={otherName} onChange={onChange} />}
      <span className="text-[11px] muted mt-0.5">
        {fmtTime(m.createdAt)}
        {m.expiresAt ? ` · ${t('UI-CHAT-VERSCHWINDET')}` : ''}
      </span>
    </div>
  );
}


function AlbumOffer({ album, otherName, onChange }: { album: any; otherName?: string; onChange: () => void }) {
  const nav = useNavigate();
  const { toast } = useApp();
  if (album.mine) {
    return (
      <div className="card p-3 text-sm">
        {t('UI-ALBUM-ANGEBOTEN')} · {t(`UI-ALBUM-STATUS-${String(album.state).toUpperCase()}`)}
        {(album.state === 'offered' || album.state === 'accepted') && (
          <button
            className="btn-ghost px-0 block"
            onClick={async () => {
              await api.post(`/api/album/shares/${album.shareId}/end`);
              toast(t('UI-ALBUM-BEENDET'));
              onChange();
            }}
          >
            {t('UI-ALBUM-NICHT-MEHR-ZEIGEN')}
          </button>
        )}
      </div>
    );
  }
  if (album.state === 'offered') {
    return (
      <div className="card p-3">
        <p className="mb-2">{t('ST-CHAT-40', { name: otherName ?? '' })}</p>
        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={async () => {
              await api.post(`/api/album/shares/${album.shareId}/answer`, { accept: true });
              nav(`/album/${album.shareId}`);
            }}
          >
            {t('ST-CHAT-41')}
          </button>
          <button
            className="btn-secondary"
            onClick={async () => {
              await api.post(`/api/album/shares/${album.shareId}/answer`, { accept: false });
              onChange();
            }}
          >
            {t('ST-CHAT-42')}
          </button>
        </div>
      </div>
    );
  }
  if (album.state === 'accepted') {
    return (
      <button className="card p-3 text-left" onClick={() => nav(`/album/${album.shareId}`)}>
        {t('UI-ALBUM-OEFFNEN')}
      </button>
    );
  }
  return <div className="card p-3 text-sm muted">{t(`UI-ALBUM-STATUS-${String(album.state).toUpperCase()}`)}</div>;
}

// ─────────────────────────── S33 · Album ansehen ───────────────────────────

export function AlbumAnsicht() {
  const { shareId } = useParams();
  const nav = useNavigate();
  const { data, error } = useAsync(() => api.get(`/api/album/shares/${shareId}`), [shareId]);
  const [full, setFull] = useState<string | null>(null);
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-ALBUM-TITEL')} back />
      <Page>
        {error && <Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner>}
        {data?.state === 'geschlossen' ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold">{t('ST-VER-40')}</h2>
            <p>{t('ST-VER-41')}</p>
            <p className="text-sm muted">{t('ST-VER-42')}</p>
            <button className="btn-primary" onClick={() => nav(`/pruefung?art=age2&weiter=/album/${shareId}`)}>
              {t('UI-PRUEFUNG-STARTEN')}
            </button>
          </div>
        ) : data?.state && data.state !== 'accepted' && !data.images.length ? (
          <Banner>{t(`UI-ALBUM-STATUS-${String(data.state).toUpperCase()}`)}</Banner>
        ) : (
          <>
            <div className="mb-3 flex flex-col gap-2">
              <Banner>{t('ST-CHAT-43')}</Banner>
              <Banner>{t('ST-CHAT-46')}</Banner>
            </div>
            <div className="grid grid-cols-3 gap-2 select-none">
              {data?.images.map((i: any) => (
                <button key={i.id} onClick={() => setFull(i.url)} aria-label={t('UI-CHAT-BILD')}>
                  <img src={i.url} alt="" className="aspect-square object-cover rounded-lg bg-flaeche2" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                </button>
              ))}
            </div>
          </>
        )}
      </Page>
      {full && (
        <div className="fixed inset-0 z-50 bg-black grid place-items-center" onClick={() => setFull(null)} role="dialog">
          <img src={full} alt="" className="max-w-full max-h-full" draggable={false} onContextMenu={(e) => e.preventDefault()} />
        </div>
      )}
    </div>
  );
}


// ─────────────────────────── eigene Alben (Issue #23) ───────────────────────────

export function Alben() {
  const nav = useNavigate();
  const { toast } = useApp();
  const { data } = useAsync(() => api.get('/api/albums'), []);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const create = async () => {
    try {
      const r = await api.post('/api/albums', { name: name.trim() });
      setName('');
      setCreating(false);
      nav(`/alben/${r.id}`);
    } catch (e) {
      toast(errText(e));
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-ALBEN')} back />
      <Page>
        <p className="text-sm muted mb-2">{t('UI-ALBEN-ERKL', { max: data?.max ?? 10, bilder: data?.imagesMax ?? 30 })}</p>
        <p className="text-xs muted mb-4">{t('ST-CHAT-43')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data?.albums.map((a: any) => (
            <button key={a.id} className="card overflow-hidden text-left hover:border-akzent/60" onClick={() => nav(`/alben/${a.id}`)}>
              <div className="aspect-square bg-flaeche2 grid place-items-center">
                {a.cover ? <img src={a.cover} alt="" className="w-full h-full object-cover" /> : <Icon name="album" className="w-10 h-10 muted" />}
              </div>
              <div className="p-2">
                <p className="font-semibold truncate">{a.name}</p>
                <p className="text-xs muted">{t('UI-ALBEN-BILDER', { zahl: a.count })}</p>
              </div>
            </button>
          ))}
          {data && data.albums.length < data.max && !creating && (
            <button className="card border-dashed aspect-square grid place-items-center text-leise hover:text-akzent hover:border-akzent" onClick={() => setCreating(true)}>
              <span className="flex flex-col items-center gap-1">
                <Icon name="plus" className="w-8 h-8" />
                <span className="text-sm">{t('UI-ALBEN-NEU')}</span>
              </span>
            </button>
          )}
        </div>
        {creating && (
          <div className="card p-3 mt-4 flex flex-col gap-2">
            <input className="input" autoFocus maxLength={40} placeholder={t('UI-ALBEN-NAME')} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && create()} aria-label={t('UI-ALBEN-NAME')} />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" disabled={!name.trim()} onClick={create}>
                {t('UI-ALBEN-NEU')}
              </button>
              <button className="btn-ghost" onClick={() => setCreating(false)}>
                {t('UI-SPRACHE-ABBRECHEN')}
              </button>
            </div>
          </div>
        )}
        {data && data.albums.length >= data.max && <p className="text-sm muted mt-3">{t('UI-ALBEN-MAX', { max: data.max })}</p>}
      </Page>
    </div>
  );
}

export function AlbumBearbeiten() {
  const { albumId } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get(`/api/albums/${albumId}`), [albumId]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rename, setRename] = useState<string | null>(null);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) await api.upload(`/api/albums/${albumId}/images`, f);
    } catch (err) {
      toast(errText(err));
    } finally {
      setBusy(false);
      reload();
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={data?.album?.name ?? t('UI-ALBEN')}
        back="/alben"
        right={
          <button className="btn-ghost px-2" onClick={() => setMenu(true)} aria-label={t('UI-APP-MENUE')}>
            <Icon name="more" />
          </button>
        }
      />
      <Page>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => (upload(e.target.files), (e.target.value = ''))} />
        <div className="grid grid-cols-3 gap-2">
          {data?.images.map((i: any) => (
            <div key={i.id} className="relative">
              <img src={i.url} alt="" className="aspect-square object-cover rounded-lg bg-flaeche2 w-full" />
              <button
                className="absolute top-1 right-1 btn bg-black/60 px-2 min-h-0 h-8"
                aria-label={t('UI-APP-LOESCHEN')}
                onClick={async () => {
                  await api.del(`/api/albums/${albumId}/images/${i.id}`);
                  reload();
                }}
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
          {data && data.images.length < data.max && (
            <button className="aspect-square rounded-lg border-2 border-dashed border-linie grid place-items-center text-leise hover:border-akzent hover:text-akzent" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={t('UI-ALBUM-HINZU')}>
              {busy ? '…' : <Icon name="plus" className="w-8 h-8" />}
            </button>
          )}
        </div>
        {data?.shares?.length > 0 && (
          <section className="mt-6">
            <h2 className="font-semibold mb-2">{t('UI-ALBUM-FREIGABEN')}</h2>
            <ul className="card overflow-hidden">
              {data.shares.map((s: any) => (
                <li key={s.id} className="row">
                  <span className="flex-1 py-3">
                    {s.name ?? '—'} · {t(`UI-ALBUM-STATUS-${String(s.state).toUpperCase()}`)}
                  </span>
                  <button
                    className="btn-ghost"
                    onClick={async () => {
                      await api.post(`/api/album/shares/${s.id}/end`);
                      reload();
                    }}
                  >
                    {t('UI-ALBUM-NICHT-MEHR-ZEIGEN')}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Page>
      <Sheet open={menu} onClose={() => setMenu(false)} title={data?.album?.name ?? ''}>
        <div className="flex flex-col gap-2">
          {rename === null ? (
            <button className="btn-secondary" onClick={() => setRename(data?.album?.name ?? '')}>
              {t('UI-ALBEN-UMBENENNEN')}
            </button>
          ) : (
            <div className="flex gap-2">
              <input className="input flex-1" maxLength={40} value={rename} onChange={(e) => setRename(e.target.value)} aria-label={t('UI-ALBEN-NAME')} />
              <button
                className="btn-primary"
                disabled={!rename.trim()}
                onClick={async () => {
                  try {
                    await api.patch(`/api/albums/${albumId}`, { name: rename.trim() });
                    setRename(null);
                    setMenu(false);
                    reload();
                  } catch (e) {
                    toast(errText(e));
                  }
                }}
              >
                {t('UI-APP-SPEICHERN')}
              </button>
            </div>
          )}
          <button
            className="btn-danger"
            onClick={async () => {
              if (!confirm(t('UI-ALBEN-LOESCHEN-FRAGE'))) return;
              await api.del(`/api/albums/${albumId}`);
              nav('/alben', { replace: true });
            }}
          >
            {t('UI-ALBEN-LOESCHEN')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

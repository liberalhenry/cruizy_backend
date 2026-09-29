/** S30 Chats · S31 Chat · S32 Eisbrecher · S33 Privates Album · eigenes Album. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Banner, Empty, Header, Icon, Page, Sheet, Skeleton, useAsync } from '../components/ui';
import { ReportSheet, useBlock, type ReportItem } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { markSeen, useApp } from '../lib/app';
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

  const seen = JSON.parse(localStorage.getItem('gesehen') ?? '{}');
  const rows = (list ?? []).filter((c) => c.box === box);
  const counts = { gespraeche: (list ?? []).filter((c) => c.box === 'gespraeche' && c.last && !c.last.mine && (!seen[c.id] || new Date(c.lastAt) > new Date(seen[c.id]))).length };

  return (
    <>
      <Header
        title={t('UI-TAB-CHATS')}
        sub={
          <div className="flex gap-2 px-4 pb-2" role="tablist">
            {(['gespraeche', 'anfragen'] as const).map((b) => (
              <button key={b} role="tab" aria-selected={box === b} className={`chip min-h-tap ${box === b ? 'border-akzent text-akzent' : ''}`} onClick={() => setBox(b)}>
                {t(b === 'gespraeche' ? 'ST-CHAT-02' : 'ST-CHAT-01')}
                {b === 'gespraeche' && counts.gespraeche > 0 && <span className="ml-1 rounded-full bg-akzent text-grund px-1.5 text-xs">{counts.gespraeche}</span>}
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
              const fresh = c.last && !c.last.mine && (!seen[c.id] || new Date(c.lastAt) > new Date(seen[c.id]));
              return (
                <li key={c.id} className="border-b border-linie last:border-b-0 flex items-center" onContextMenu={(e) => (e.preventDefault(), setMenuFor(c))}>
                  <button className="flex-1 flex items-center gap-3 px-3 py-3 text-left hover:bg-flaeche2 min-w-0" onClick={() => nav(`/chats/${c.id}`)}>
                    <Avatar name={c.other.name} initial={c.other.initial} color={c.other.color} photo={c.other.photo} size={48} />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className={`truncate ${fresh ? 'font-semibold' : ''}`}>{c.other.name ?? t('UI-CHATS-NICHT-MEHR-DA')}</span>
                        {c.disappearing && <Icon name="clock" className="w-4 h-4 muted shrink-0" />}
                      </span>
                      <span className="block text-sm muted truncate">{preview(c)}</span>
                    </span>
                    <span className="text-xs muted shrink-0">{fmtWhen(c.lastAt)}</span>
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
  if (c.last.kind === 'image') return t('UI-CHAT-BILD');
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
  const { config, toast, refreshCounts } = useApp();
  const newTo = id === 'neu' ? params.get('an') : null;
  const [data, setData] = useState<any | null>(null);
  const [other, setOther] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [sheet, setSheet] = useState<null | 'menu' | 'eis' | 'report' | 'push' | 'bild'>(null);
  const [ice, setIce] = useState<string[]>([]);
  const [icePage, setIcePage] = useState(0);
  const [exitUntil, setExitUntil] = useState<number | null>(null);
  const [screenshotNote, setScreenshotNote] = useState(() => !localStorage.getItem(`bildschirmfoto:${id}`));
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { block, sheet: blockSheet } = useBlock();

  const load = useCallback(async () => {
    if (!id || id === 'neu') return;
    try {
      const r = await api.get(`/api/conversations/${id}`);
      setData(r);
      idbSet(`gespraech:${id}`, r);
      markSeen(id);
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
    api
      .get(`/api/icebreakers/${newTo}`)
      .then((r) => setIce(r.suggestions))
      .catch(() => {});
  }, [newTo, nav]);

  useEffect(() => {
    load();
    return on('nachricht', (d: any) => d?.conversationId === id && load());
  }, [id, load]);

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
    setText('');
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

  const sendImage = async (f: File | undefined) => {
    if (!f || !id) return;
    try {
      await api.upload(`/api/conversations/${id}/images`, f);
      await load();
    } catch (e) {
      if (!handleWriteError(e, '')) toast(errText(e));
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

  const loadIce = async (page: number) => {
    const to = newTo ?? otherInfo?.id;
    if (!to) return;
    const r = await api.get(`/api/icebreakers/${to}?page=${page}`);
    setIce(r.suggestions);
    setIcePage(page);
  };

  const reportItems: ReportItem[] = (data?.messages ?? [])
    .filter((m: any) => !m.mine && (m.kind === 'text' || m.kind === 'image'))
    .slice(-30)
    .map((m: any) => ({ kind: 'message', id: m.id, label: m.kind === 'image' ? `${t('UI-CHAT-BILD')} · ${fmtTime(m.createdAt)}` : `${m.text} · ${fmtTime(m.createdAt)}`, image: m.kind === 'image' }));

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
          <Message key={m.id} m={m} otherName={otherInfo?.name} onChange={load} />
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
              <div className="flex gap-2 overflow-x-auto">
                {(newTo || data?.icebreakerAvailable) && (
                  <button
                    className="chip min-h-tap shrink-0"
                    onClick={() => {
                      loadIce(0);
                      setSheet('eis');
                    }}
                  >
                    {t('ST-CHAT-05')}
                  </button>
                )}
                {conv && !newTo && (
                  <button className="chip min-h-tap shrink-0" onClick={exit}>
                    {t('ST-CHAT-10')}
                  </button>
                )}
              </div>
              <div className="flex items-end gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => sendImage(e.target.files?.[0])} />
                <button
                  className="btn-ghost px-2"
                  disabled={!conv || !data?.mediaAllowed}
                  onClick={() => (data?.mediaAllowed ? fileRef.current?.click() : setSheet('bild'))}
                  aria-label={t('UI-CHAT-BILD-SENDEN')}
                  title={!data?.mediaAllowed ? t('ST-FEH-30', { name: otherInfo?.name ?? '' }) : undefined}
                >
                  <Icon name="image" />
                </button>
                <textarea
                  className="input py-2 min-h-tap max-h-40 resize-none"
                  rows={1}
                  placeholder={firstContact ? t('ST-CHAT-04') : t('UI-CHAT-NACHRICHT')}
                  value={text}
                  maxLength={config?.params.messageMax ?? 2000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  aria-label={t('UI-CHAT-NACHRICHT')}
                />
                <button className="btn-primary px-3" disabled={!text.trim()} onClick={() => send()} aria-label={t('UI-CHAT-SENDEN')}>
                  <Icon name="send" />
                </button>
              </div>
              {firstContact && !data?.mediaAllowed && <p className="text-xs muted">{t('ST-FEH-30', { name: otherInfo?.name ?? '' })}</p>}
            </>
          )}
        </div>
      </div>

      <Sheet open={sheet === 'bild'} onClose={() => setSheet(null)} title={t('UI-CHAT-BILD-SENDEN')}>
        <p>{t('ST-FEH-30', { name: otherInfo?.name ?? '' })}</p>
      </Sheet>
      <Sheet open={sheet === 'eis'} onClose={() => setSheet(null)} title={t('UI-EIS-TITEL')}>
        <p className="text-sm muted mb-3">{t('ST-CHAT-06')}</p>
        <div className="flex flex-col gap-2">
          {ice.map((s) => (
            <button
              key={s}
              className="card p-3 text-left"
              onClick={() => {
                setText(s);
                setSheet(null);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn-ghost w-full mt-3" onClick={() => loadIce(icePage + 1)}>
          {t('UI-EIS-ANDERE')}
        </button>
      </Sheet>
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
          {conv && !ended && (
            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  await api.post('/api/album/offer', { conversationId: id });
                  setSheet(null);
                  load();
                } catch (e) {
                  if (e instanceof ApiError && e.code === 'album_leer') nav('/album');
                  else toast(errText(e));
                }
              }}
            >
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
      {blockSheet}
    </div>
  );
}

function Message({ m, otherName, onChange }: { m: any; otherName?: string; onChange: () => void }) {
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
      {m.kind === 'image' &&
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

// ─────────────────────────── eigenes Album ───────────────────────────

export function EigenesAlbum() {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/album'), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-ALBUM-MEINS')} back />
      <Page>
        <p className="text-sm muted mb-3">{t('ST-CHAT-43')}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              await api.upload('/api/album', f);
              reload();
            } catch (err) {
              toast(errText(err));
            } finally {
              setBusy(false);
            }
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          {data?.images.map((i: any) => (
            <div key={i.id} className="relative">
              <img src={i.url} alt="" className="aspect-square object-cover rounded-lg bg-flaeche2" />
              <button
                className="absolute top-1 right-1 btn bg-black/60 px-2 min-h-0 h-8"
                aria-label={t('UI-APP-LOESCHEN')}
                onClick={async () => {
                  await api.del(`/api/album/${i.id}`);
                  reload();
                }}
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {data && data.images.length < data.max && (
          <button className="btn-secondary w-full mt-3" disabled={busy} onClick={() => fileRef.current?.click()}>
            {t('UI-ALBUM-HINZU')}
          </button>
        )}
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
    </div>
  );
}

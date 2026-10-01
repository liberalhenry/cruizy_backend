/** S34: Altersprüfung und Community-Vertrag (gebündelt), Fotoprüfung, Stufe 2. */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banner, BottomBar, Header, Page, Steps } from '../components/ui';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { t } from '../lib/texts';
import { authenticate, register, webauthnSupported } from '../lib/webauthn';

type Art = 'age1' | 'age2' | 'face';

async function startCheck(kind: Art, method: string, weiter: string, faceConsent = false) {
  const r = await api.post('/api/verify/start', { kind, method, faceConsent });
  sessionStorage.setItem('pruefung', JSON.stringify({ sessionId: r.sessionId, kind, weiter }));
  // Der Prüfpartner läuft auf seiner eigenen Seite; zurück kommt man über /pruefung/fertig
  location.assign(r.url);
}

export function Pruefung({ gate }: { gate?: boolean }) {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { refreshMe } = useApp();
  const art = (params.get('art') as Art) ?? 'age1';
  const weiter = params.get('weiter') ?? '/ich/profil';
  const [state, setState] = useState<any | null>(null);
  const [why, setWhy] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [lines, setLines] = useState<boolean[]>([false, false, false, false]);
  const [faceConsent, setFaceConsent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/verify/state').then(setState).catch((e) => setErr(errText(e)));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return <Page>{err ? <Banner kind="error">{err}</Banner> : <p className="muted">…</p>}</Page>;

  // ───── Stufe 2 (S34.08) ─────
  if (art === 'age2') {
    const needsCheck = !state.age2;
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('ST-VER-40')} back={!gate} />
        <Page className="flex-1">
          <p className="mb-3">{t('ST-VER-41')}</p>
          <p className="text-sm muted mb-4">{t('ST-VER-42')}</p>
          {needsCheck && state.reviewAge2 ? (
            <Banner kind="info">{t('UI-TEAMPRUEFUNG-LAEUFT')}</Banner>
          ) : needsCheck ? (
            <div className="flex flex-col gap-2">
              {state.methods.age2.map((m: string) => (
                <button key={m} className="btn-secondary" disabled={busy} onClick={() => run(() => startCheck('age2', m, weiter))}>
                  {m === 'eid' ? t('ST-VER-08') : m === 'team' ? t('UI-TEAMPRUEFUNG-WEG') : t('ST-VER-07')}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="mb-3">{t('UI-STUFE2-SCHLUESSEL')}</p>
              {!webauthnSupported() && <Banner kind="warn">{t('UI-STUFE2-NICHT-MOEGLICH')}</Banner>}
              <button
                className="btn-primary w-full"
                disabled={busy || !webauthnSupported()}
                onClick={() =>
                  run(async () => {
                    const o = await api.post('/api/verify/stage2/key/options');
                    const response = o.mode === 'register' ? await register(o.options) : await authenticate(o.options);
                    await api.post('/api/verify/stage2/key', { mode: o.mode, response });
                    await refreshMe();
                    nav(weiter);
                  })
                }
              >
                {t('UI-STUFE2-BESTAETIGEN')}
              </button>
            </>
          )}
          {err && (
            <div className="mt-3">
              <Banner kind="error">{err}</Banner>
            </div>
          )}
        </Page>
      </div>
    );
  }

  // ───── Fotoprüfung (F06) ─────
  if (art === 'face') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('ST-VER-20')} back />
        <Page className="flex-1">
          {state.facePassed ? (
            <Banner kind="ok">{t('ST-VER-22')}</Banner>
          ) : state.reviewFace ? (
            <Banner kind="info">{t('UI-TEAMPRUEFUNG-LAEUFT')}</Banner>
          ) : (
            <>
              <p className="mb-4">{t('ST-VER-21')}</p>
              <label className="flex items-start gap-3 mb-4">
                <input type="checkbox" className="mt-1 w-5 h-5 accent-akzent" checked={faceConsent} onChange={(e) => setFaceConsent(e.target.checked)} />
                <span>{t('UI-FOTOPRUEFUNG-EINWILLIGUNG-TEXT')}</span>
              </label>
              <p className="text-sm muted mb-4">{t('ST-FEST-02')}</p>
            </>
          )}
          {err && <Banner kind="error">{err}</Banner>}
        </Page>
        {!state.facePassed && !state.reviewFace && (
          <BottomBar>
            <button className="btn-primary" disabled={!faceConsent || busy} onClick={() => run(() => startCheck('face', state.methods.face[0] ?? 'selfie', weiter, true))}>
              {t('UI-PRUEFUNG-STARTEN')}
            </button>
          </BottomBar>
        )}
      </div>
    );
  }

  // ───── Schritt A: Alter (S34.02–04) ─────
  if (!state.age1) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('ST-CV-00')} back={!gate} />
        <Page className="flex-1">
          <Steps n={1} of={2} className="mb-3" />
          {state.minorLocked && (
            <div className="mb-3">
              <Banner kind="warn">
                {t('ST-VER-13')} <br />
                {t('ST-VER-14')}
              </Banner>
            </div>
          )}
          {state.review && (
            <div className="mb-3">
              <Banner kind="info">{t('UI-AUSWEIS-LAEUFT')}</Banner>
            </div>
          )}
          <p className="mb-2">{t('ST-FEST-01')}</p>
          <button className="btn-ghost px-0 mb-3" onClick={() => setWhy(!why)} aria-expanded={why}>
            {t('UI-PRUEFUNG-WARUM')}
          </button>
          {why && <p className="text-sm muted mb-4">{t(state.provider === 'ausweis' ? 'UI-AUSWEIS-WARUM' : 'ST-VER-10')}</p>}
          <h2 className="font-semibold mb-2">{t('ST-VER-06')}</h2>
          <div className="flex flex-col gap-2" role="radiogroup">
            {(state.minorLocked ? state.methods.age1.filter((m: string) => m === 'eid' || m === 'ausweis') : state.methods.age1).map((m: string) => (
              <label key={m} className={`card px-4 py-3 flex items-start gap-3 ${method === m ? 'border-akzent' : ''}`}>
                <input type="radio" name="weg" className="mt-1 accent-akzent" checked={method === m} onChange={() => setMethod(m)} />
                <span>
                  <span className="block">{m === 'eid' ? t('ST-VER-08') : m === 'wallet' ? t('ST-VER-09') : m === 'ausweis' ? t('UI-AUSWEIS-WEG') : t('ST-VER-07')}</span>
                  {m === 'selfie' && <span className="block text-sm muted mt-1">{t('ST-FEST-02')}</span>}
                  {m === 'ausweis' && <span className="block text-sm muted mt-1">{t('UI-AUSWEIS-ERKL')}</span>}
                </span>
              </label>
            ))}
          </div>
          {err && (
            <div className="mt-3">
              <Banner kind="error">{err}</Banner>
            </div>
          )}
        </Page>
        <BottomBar>
          <button className="btn-primary" disabled={!method || busy || state.review} onClick={() => run(() => startCheck('age1', method!, `/pruefung?weiter=${encodeURIComponent(weiter)}`))}>
            {t('ST-CV-07')}
          </button>
          {!gate && (
            <button className="btn-ghost" onClick={() => nav(-1)}>
              {t('ST-VER-05')}
            </button>
          )}
        </BottomBar>
      </div>
    );
  }

  // ───── Schritt B: Community-Vertrag (S34.05) ─────
  if (!state.contract) {
    const ids: string[] = state.contractLines;
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('ST-CV-01')} back={!gate} />
        <Page className="flex-1">
          <Steps n={2} of={2} className="mb-3" />
          <p className="mb-4">{t('ST-CV-02')}</p>
          <div className="flex flex-col gap-2">
            {ids.map((id, i) => (
              <label key={id} className="card px-4 py-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 w-5 h-5 accent-akzent"
                  checked={lines[i]}
                  onChange={(e) => {
                    const l = [...lines];
                    l[i] = e.target.checked;
                    setLines(l);
                  }}
                />
                <span>{t(id)}</span>
              </label>
            ))}
          </div>
          <p className="text-sm muted mt-4">{t('ST-CV-08')}</p>
          {err && <Banner kind="error">{err}</Banner>}
        </Page>
        <BottomBar>
          <button
            className="btn-primary"
            disabled={!lines.every(Boolean) || busy}
            onClick={() =>
              run(async () => {
                await api.post('/api/verify/contract', { version: state.contractVersion, lines: [true, true, true, true] });
                await refreshMe();
                nav(weiter, { replace: true });
              })
            }
          >
            {weiter.startsWith('/chats') ? t('UI-PRUEFUNG-NACHRICHT-SENDEN') : t('ST-CV-07')}
          </button>
        </BottomBar>
      </div>
    );
  }

  return (
    <Page>
      <Banner kind="ok">{t('ST-VER-12')}</Banner>
      <button className="btn-primary w-full mt-4" onClick={() => nav(weiter, { replace: true })}>
        {t('ST-KON-12')}
      </button>
    </Page>
  );
}

/** Rückkehr vom Prüfpartner: Ergebnis abfragen, nie ein geschätztes Alter (AK-F04-06). */
export function PruefungFertig() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { refreshMe } = useApp();
  const stored = JSON.parse(sessionStorage.getItem('pruefung') ?? 'null');
  const sid = params.get('s') ?? stored?.sessionId;
  const [st, setSt] = useState<string>('pending');

  useEffect(() => {
    let tries = 0;
    let alive = true;
    const poll = async () => {
      try {
        const r = await api.get(`/api/verify/session/${sid}`);
        if (!alive) return;
        setSt(r.state);
        if (r.state === 'pending' && tries++ < 30) setTimeout(poll, 2000);
        else refreshMe();
      } catch {
        setSt('failed');
      }
    };
    if (sid) poll();
    return () => {
      alive = false;
    };
  }, [sid, refreshMe]);

  const weiter = stored?.weiter ?? '/ich/profil';
  const text: Record<string, string> = {
    pending: 'UI-PRUEFUNG-LAEUFT',
    passed: stored?.kind === 'face' ? 'ST-VER-22' : 'ST-VER-12',
    unclear: 'ST-VER-11',
    minor: 'ST-VER-13',
    failed: 'ST-FEH-41',
    cancelled: 'ST-FEH-40',
    timeout: 'ST-FEH-42',
    review: 'UI-AUSWEIS-LAEUFT',
  };
  return (
    <Page>
      <Banner kind={st === 'passed' ? 'ok' : st === 'pending' ? 'info' : 'warn'}>{t(text[st] ?? 'ST-FEH-41')}</Banner>
      {st === 'minor' && <p className="mt-3 muted">{t('ST-VER-14')}</p>}
      {st !== 'pending' && (
        <button
          className="btn-primary w-full mt-4"
          onClick={() => {
            sessionStorage.removeItem('pruefung');
            nav(st === 'passed' ? weiter : `/pruefung?weiter=${encodeURIComponent(weiter)}`, { replace: true });
          }}
        >
          {t('ST-KON-12')}
        </button>
      )}
    </Page>
  );
}

/** Issue #7: Altersprüfung mit einem Foto des Ausweises — es zählt nur das Geburtsdatum. */
export function PruefungAusweis() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { refreshMe } = useApp();
  const stored = JSON.parse(sessionStorage.getItem('pruefung') ?? 'null');
  const sid = params.get('s') ?? stored?.sessionId;
  const weiter: string = stored?.weiter ?? '/ich/profil';
  const [vorne, setVorne] = useState<File | null>(null);
  const [hinten, setHinten] = useState<File | null>(null);
  const [state, setState] = useState<'eingabe' | 'laeuft' | 'retry' | 'review' | 'passed'>('eingabe');
  const [hours, setHours] = useState(24);
  const [err, setErr] = useState<string | null>(null);

  const send = async () => {
    if (!vorne || !sid) return;
    setErr(null);
    setState('laeuft');
    try {
      const fd = new FormData();
      fd.append('vorne', vorne, 'vorne.jpg');
      if (hinten) fd.append('hinten', hinten, 'hinten.jpg');
      const r = await api.post(`/api/verify/ausweis/${sid}`, fd);
      if (r.hours) setHours(r.hours);
      if (r.state === 'retry') {
        setVorne(null);
        setHinten(null);
      }
      setState(r.state);
      if (r.state === 'passed') await refreshMe();
    } catch (e) {
      setErr(errText(e));
      setState('eingabe');
    }
  };

  const done = () => {
    sessionStorage.removeItem('pruefung');
    nav(weiter, { replace: true });
  };

  const picker = (label: string, file: File | null, set: (f: File | null) => void, required: boolean) => (
    <label className="card p-4 flex items-center gap-3 cursor-pointer">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          set(e.target.files?.[0] ?? null);
          // leeren, damit dieselbe Datei nach „Bitte noch einmal“ wieder gewählt werden kann
          e.target.value = '';
        }}
      />
      <span className={`w-10 h-10 rounded-full grid place-items-center ${file ? 'bg-gut text-grund' : 'bg-flaeche2'}`} aria-hidden>
        {file ? '✓' : '+'}
      </span>
      <span className="flex-1">
        <span className="block">{label}</span>
        <span className="block text-sm muted">{file ? file.name : required ? t('UI-FOTO-HINZU') : '—'}</span>
      </span>
    </label>
  );

  if (!sid) return <Page><Banner kind="warn">{t('UI-LINK-UNGUELTIG')}</Banner></Page>;

  if (state === 'passed' || state === 'review') {
    return (
      <Page>
        <Banner kind={state === 'passed' ? 'ok' : 'info'}>{state === 'passed' ? t('UI-AUSWEIS-OK') : t('UI-AUSWEIS-PRUEFUNG', { stunden: hours })}</Banner>
        <button className="btn-primary w-full mt-4" onClick={done}>
          {t('ST-KON-12')}
        </button>
      </Page>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-AUSWEIS-UEBERSCHRIFT')} back="/pruefung" />
      <Page className="flex-1">
        <p className="mb-2">{t('UI-AUSWEIS-ERKL')}</p>
        <p className="text-sm muted mb-4">{t('UI-AUSWEIS-ERKL-2')}</p>
        {state === 'retry' && (
          <div className="mb-3">
            <Banner kind="warn">{t('UI-AUSWEIS-NOCHMAL')}</Banner>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {picker(t('UI-AUSWEIS-VORNE'), vorne, setVorne, true)}
          {picker(t('UI-AUSWEIS-HINTEN'), hinten, setHinten, false)}
        </div>
        {err && (
          <div className="mt-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!vorne || state === 'laeuft'} onClick={send}>
          {state === 'laeuft' ? t('UI-AUSWEIS-LAEUFT-JETZT') : t('UI-AUSWEIS-SENDEN')}
        </button>
      </BottomBar>
    </div>
  );
}

/** Ohne Prüfpartner: Stufe 2 (Ausweis + Selfie) bzw. Fotoprüfung (Selfie) prüft ein Mensch aus dem Team. */
export function PruefungTeam() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const stored = JSON.parse(sessionStorage.getItem('pruefung') ?? 'null');
  const sid = params.get('s') ?? stored?.sessionId;
  const weiter: string = stored?.weiter ?? '/ich/profil';
  const [info, setInfo] = useState<{ kind: 'age2' | 'face'; state: string; pose: { label: string } | null; hours: number } | null>(null);
  const [ausweis, setAusweis] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (sid) api.get(`/api/verify/team/${sid}`).then(setInfo).catch((e) => setErr(errText(e)));
  }, [sid]);

  const send = async () => {
    if (!sid || !info || !selfie || (info.kind === 'age2' && !ausweis)) return;
    setErr(null);
    setSending(true);
    try {
      const fd = new FormData();
      if (info.kind === 'age2' && ausweis) fd.append('ausweis', ausweis, 'ausweis.jpg');
      fd.append('selfie', selfie, 'selfie.jpg');
      await api.post(`/api/verify/team/${sid}`, fd);
      setSent(true);
    } catch (e) {
      setErr(errText(e));
    } finally {
      setSending(false);
    }
  };

  const done = () => {
    sessionStorage.removeItem('pruefung');
    nav(weiter, { replace: true });
  };

  const picker = (label: string, file: File | null, set: (f: File | null) => void, capture: 'user' | 'environment') => (
    <label className="card p-4 flex items-center gap-3 cursor-pointer">
      <input type="file" accept="image/*" capture={capture} className="sr-only" onChange={(e) => { set(e.target.files?.[0] ?? null); e.target.value = ''; }} />
      <span className={`w-10 h-10 rounded-full grid place-items-center ${file ? 'bg-gut text-grund' : 'bg-flaeche2'}`} aria-hidden>
        {file ? '✓' : '+'}
      </span>
      <span className="flex-1">
        <span className="block">{label}</span>
        <span className="block text-sm muted">{file ? file.name : t('UI-FOTO-HINZU')}</span>
      </span>
    </label>
  );

  if (!sid) return <Page><Banner kind="warn">{t('UI-LINK-UNGUELTIG')}</Banner></Page>;
  if (!info) return <Page>{err ? <Banner kind="error">{err}</Banner> : <p className="muted">…</p>}</Page>;

  if (sent || info.state === 'review') {
    return (
      <Page>
        <Banner kind="info">{sent ? t('UI-TEAMPRUEFUNG-GESENDET', { stunden: info.hours }) : t('UI-TEAMPRUEFUNG-LAEUFT')}</Banner>
        <button className="btn-primary w-full mt-4" onClick={done}>
          {t('ST-KON-12')}
        </button>
      </Page>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-TEAMPRUEFUNG-TITEL')} back={`/pruefung?art=${info.kind}`} />
      <Page className="flex-1">
        <p className="mb-4">{t(info.kind === 'age2' ? 'UI-TEAMPRUEFUNG-ERKL-STUFE2' : 'UI-TEAMPRUEFUNG-ERKL-FOTO', { stunden: info.hours })}</p>
        {info.pose && (
          <div className="card p-4 mb-4 border-akzent/50">
            <p className="font-display text-lg font-semibold">{t('UI-TEAMPRUEFUNG-GESTE', { geste: info.pose.label })}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {info.kind === 'age2' && picker(t('UI-TEAMPRUEFUNG-AUSWEIS'), ausweis, setAusweis, 'environment')}
          {picker(t('UI-TEAMPRUEFUNG-SELFIE'), selfie, setSelfie, 'user')}
        </div>
        {err && (
          <div className="mt-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!selfie || (info.kind === 'age2' && !ausweis) || sending} onClick={send}>
          {sending ? t('UI-AUSWEIS-LAEUFT-JETZT') : t('UI-TEAMPRUEFUNG-SENDEN')}
        </button>
      </BottomBar>
    </div>
  );
}

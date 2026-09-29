/** S34: Altersprüfung und Community-Vertrag (gebündelt), Fotoprüfung, Stufe 2. */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banner, BottomBar, Header, Page } from '../components/ui';
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
          {needsCheck ? (
            <div className="flex flex-col gap-2">
              {state.methods.age2.map((m: string) => (
                <button key={m} className="btn-secondary" disabled={busy} onClick={() => run(() => startCheck('age2', m, weiter))}>
                  {m === 'eid' ? t('ST-VER-08') : t('ST-VER-07')}
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
        {!state.facePassed && (
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
          <p className="text-xs muted mb-2">{t('UI-SCHRITT', { n: 1, von: 2 })}</p>
          {state.minorLocked && (
            <div className="mb-3">
              <Banner kind="warn">
                {t('ST-VER-13')} <br />
                {t('ST-VER-14')}
              </Banner>
            </div>
          )}
          <p className="mb-2">{t('ST-FEST-01')}</p>
          <button className="btn-ghost px-0 mb-3" onClick={() => setWhy(!why)} aria-expanded={why}>
            {t('UI-PRUEFUNG-WARUM')}
          </button>
          {why && <p className="text-sm muted mb-4">{t('ST-VER-10')}</p>}
          <h2 className="font-semibold mb-2">{t('ST-VER-06')}</h2>
          <div className="flex flex-col gap-2" role="radiogroup">
            {(state.minorLocked ? ['eid'] : state.methods.age1).map((m: string) => (
              <label key={m} className={`card px-4 py-3 flex items-start gap-3 ${method === m ? 'border-akzent' : ''}`}>
                <input type="radio" name="weg" className="mt-1 accent-akzent" checked={method === m} onChange={() => setMethod(m)} />
                <span>
                  <span className="block">{m === 'eid' ? t('ST-VER-08') : m === 'wallet' ? t('ST-VER-09') : t('ST-VER-07')}</span>
                  {m === 'selfie' && <span className="block text-sm muted mt-1">{t('ST-FEST-02')}</span>}
                </span>
              </label>
            ))}
          </div>
          {state.provider === 'mock' && (
            <div className="mt-4">
              <Banner kind="warn">{t('UI-PRUEFUNG-ATTRAPPE')}</Banner>
            </div>
          )}
          {err && (
            <div className="mt-3">
              <Banner kind="error">{err}</Banner>
            </div>
          )}
        </Page>
        <BottomBar>
          <button className="btn-primary" disabled={!method || busy} onClick={() => run(() => startCheck('age1', method!, `/pruefung?weiter=${encodeURIComponent(weiter)}`))}>
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
          <p className="text-xs muted mb-2">{t('UI-SCHRITT', { n: 2, von: 2 })}</p>
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

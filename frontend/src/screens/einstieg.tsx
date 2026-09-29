/** Einstieg: S01 Gast · S02 So läuft es hier · S03 Konto · S04 Einwilligung · S05 Profil anlegen · S06 Home-Bildschirm · Wiederherstellung. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Banner, BottomBar, Choice, Field, Header, Icon, Page, Sheet } from '../components/ui';
import { Tile, TileSkeletonGrid, type TileData } from '../components/tile';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { INTENTION_TEXT, parts, t } from '../lib/texts';
import { isIosSafariNotInstalled } from '../lib/push';

// ─────────────────────────── S01 · Gastmodus ───────────────────────────

export function Gast() {
  const nav = useNavigate();
  const { config } = useApp();
  const [tiles, setTiles] = useState<TileData[] | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [needsCity, setNeedsCity] = useState(false);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [hint, setHint] = useState(false);

  const load = async (body: Record<string, unknown>) => {
    try {
      const r = await api.post('/api/guest/grid', body);
      if (r.needsLocation) {
        setNeedsCity(true);
        return;
      }
      setNeedsCity(false);
      setTiles([...r.tiles, ...(r.weekly ?? [])]);
      setExpiresAt(new Date(r.expiresAt));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'gast_abgelaufen' || e.code === 'gast_pause')) setOver(true);
      else setErr(errText(e));
    }
  };

  useEffect(() => {
    api
      .post('/api/guest/start')
      .then((r) => {
        setExpiresAt(new Date(r.expiresAt));
        return load({});
      })
      .catch((e) => {
        if (e instanceof ApiError && (e.code === 'gast_pause' || e.code === 'gast_netz')) setOver(true);
        else setErr(errText(e));
      });
    api.get('/api/cities').then((r) => setCities(r.cities)).catch(() => {});
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (expiresAt && now > expiresAt.getTime()) setOver(true);
  }, [now, expiresAt]);

  const minutes = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / 60000)) : config?.params.guestMinutes ?? 3;

  const useLocationNow = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => load({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr(t('ST-REC-05')),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 15_000 },
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-flaeche border-b border-linie px-4 py-3 safe-top">
        <p className="text-sm">{t('ST-KON-01')}</p>
        {!over && <p className="text-xs muted mt-1">{t('ST-KON-02', { minuten: minutes })}</p>}
      </div>
      <Page className="flex-1">
        {config?.mode === 'test' && (
          <div className="mb-3">
            <Banner kind="warn">{t('UI-TESTBETRIEB-HINWEIS')}</Banner>
          </div>
        )}
        {err && <Banner kind="error">{err}</Banner>}
        {over ? (
          <Banner>{t('ST-KON-03')}</Banner>
        ) : needsCity ? (
          <div className="flex flex-col gap-3">
            <p>{t('ST-REC-01')}</p>
            <p className="text-sm muted">{t('ST-REC-02')}</p>
            <button className="btn-primary" onClick={useLocationNow}>
              {t('ST-REC-03')}
            </button>
            <label className="label mt-2">{t('UI-GAST-STADT')}</label>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button key={c.id} className="chip" onClick={() => load({ cityId: c.id })}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : !tiles ? (
          <TileSkeletonGrid />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((x) => (
              <Tile key={x.id} x={x} onClick={() => setHint(true)} />
            ))}
          </div>
        )}
        <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm muted">
          <Link to="/hilfe">{t('ST-HLF-01')}</Link>
          <Link to="/melden-ohne-konto">{t('UI-OEFF-MELDEN-TITEL')}</Link>
          <Link to="/rechtliches/impressum">{t('UI-RECHT-IMPRESSUM')}</Link>
          <Link to="/rechtliches/datenschutz">{t('UI-RECHT-DATENSCHUTZ')}</Link>
          <Link to="/moderationszeiten">{t('UI-OEFF-MODZEITEN-TITEL')}</Link>
        </nav>
      </Page>
      <BottomBar>
        <button className="btn-primary" onClick={() => nav('/willkommen')}>
          {t('ST-KON-04')}
        </button>
        <button className="btn-secondary" onClick={() => nav('/konto?modus=anmelden')}>
          {t('UI-KONTO-ANMELDEN')}
        </button>
      </BottomBar>
      <Sheet open={hint} onClose={() => setHint(false)} title={t('UI-APP-PROFIL')}>
        <p>{t('ST-KON-03')}</p>
        <button className="btn-primary w-full mt-4" onClick={() => nav('/willkommen')}>
          {t('ST-KON-04')}
        </button>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S02 · So läuft es hier ───────────────────────────

export function Willkommen() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('ST-KON-10')} back="/" sub={<p className="px-4 pb-2 text-xs muted">{t('UI-SCHRITT', { n: 1, von: 3 })}</p>} />
      <Page className="flex-1">
        <p className="mb-6">{t('ST-KON-11')}</p>
        <ul className="flex flex-col gap-4">
          {['ST-FEST-06', 'ST-FEST-08', 'ST-FEST-09'].map((id, i) => (
            <li key={id} className="card p-4 flex gap-3 items-start">
              <Icon name={['pin', 'chat', 'check'][i]} className="w-6 h-6 text-akzent shrink-0" />
              <span>{t(id)}</span>
            </li>
          ))}
        </ul>
      </Page>
      <BottomBar>
        <button className="btn-primary" onClick={() => nav('/konto')}>
          {t('ST-KON-12')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── S03 · Registrierung und Anmeldung ───────────────────────────

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="input text-center tracking-[0.5em] text-2xl font-mono"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      aria-label={t('UI-KONTO-CODE')}
      autoFocus
    />
  );
}

export function Konto() {
  const [params] = useSearchParams();
  const { config, refreshMe } = useApp();
  const [mode, setMode] = useState<'registrieren' | 'anmelden' | 'vergessen'>(params.get('modus') === 'anmelden' ? 'anmelden' : 'registrieren');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [invite, setInvite] = useState(params.get('einladung') ?? '');
  const [step, setStep] = useState<'form' | 'code' | 'geraet' | 'gesendet'>('form');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pwMin = config?.params.pwMin ?? 12;
  const resendS = config?.params.codeResendS ?? 60;

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
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

  const submit = () =>
    run(async () => {
      if (mode === 'registrieren') {
        const r = await api.post('/api/auth/register', { method: 'email', email, password, invite: invite || undefined });
        setToken(r.token);
        setStep('code');
        setSentAt(Date.now());
      } else if (mode === 'anmelden') {
        const r = await api.post('/api/auth/login', { identifier: email, password });
        if (r.next === 'code' || r.next === 'geraet') {
          setToken(r.token);
          setStep(r.next === 'code' ? 'code' : 'geraet');
          setSentAt(Date.now());
        } else await refreshMe();
      } else {
        await api.post('/api/auth/reset/request', { identifier: email });
        setStep('gesendet');
      }
    });

  const verify = () =>
    run(async () => {
      await api.post(step === 'geraet' ? '/api/auth/device-code' : '/api/auth/verify', { token, code });
      await refreshMe();
    });

  const resend = () =>
    run(async () => {
      await api.post('/api/auth/resend', { token });
      setSentAt(Date.now());
    });

  const title = mode === 'registrieren' ? t('ST-KON-20') : mode === 'anmelden' ? t('UI-KONTO-ANMELDEN') : t('UI-KONTO-VERGESSEN');

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} back={mode === 'registrieren' ? '/willkommen' : '/'} sub={mode === 'registrieren' ? <p className="px-4 pb-2 text-xs muted">{t('UI-SCHRITT', { n: 2, von: 3 })}</p> : undefined} />
      <Page className="flex-1">
        {err && (
          <div className="mb-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
        {step === 'form' && (
          <>
            {mode === 'registrieren' && <p className="mb-4 muted">{t('ST-KON-21')}</p>}
            {mode === 'registrieren' && config?.inviteRequired && (
              <Field label={t('UI-KONTO-EINLADUNG')} hint={t('UI-TESTBETRIEB-EINLADUNG')} value={invite} onChange={(e) => setInvite(e.target.value)} autoComplete="off" />
            )}
            <Field
              label={mode === 'registrieren' ? t('UI-KONTO-EMAIL') : t('UI-KONTO-EMAIL-ODER-NUMMER')}
              type={mode === 'registrieren' ? 'email' : 'text'}
              autoComplete={mode === 'registrieren' ? 'email' : 'username'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint={mode === 'registrieren' ? t('ST-KON-33') : undefined}
            />
            {mode !== 'vergessen' && (
              <div className="mb-3">
                <label className="label" htmlFor="pw">
                  {t('UI-KONTO-PASSWORT')}
                </label>
                <div className="flex gap-2">
                  <input
                    id="pw"
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'registrieren' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                  />
                  <button className="btn-secondary" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}>
                    {showPw ? t('UI-KONTO-VERBERGEN') : t('UI-KONTO-ANZEIGEN')}
                  </button>
                </div>
                {mode === 'registrieren' && <p className="text-sm muted mt-1">{t('UI-PASSWORT-KURZ', { zahl: pwMin })}</p>}
              </div>
            )}
            {mode === 'anmelden' && (
              <div className="flex flex-col items-start gap-1">
                <button className="btn-ghost px-0" onClick={() => setMode('vergessen')}>
                  {t('UI-KONTO-VERGESSEN')}
                </button>
                <Link className="btn-ghost px-0" to="/wiederherstellung">
                  {t('UI-KONTO-WIEDERHERSTELLEN')}
                </Link>
              </div>
            )}
            {mode === 'registrieren' && (
              <div className="mt-2">
                <button className="btn-ghost px-0" onClick={() => setWhyOpen(!whyOpen)} aria-expanded={whyOpen}>
                  {t('UI-KONTO-WARUM-NICHT-GOOGLE')}
                </button>
                {whyOpen && <p className="text-sm muted">{t('ST-KON-25')}</p>}
              </div>
            )}
          </>
        )}
        {(step === 'code' || step === 'geraet') && (
          <div className="flex flex-col gap-3">
            <p>{step === 'geraet' ? t('UI-KONTO-GERAETECODE') : t('UI-KONTO-CODE-GESENDET')}</p>
            <CodeInput value={code} onChange={setCode} />
            <button className="btn-ghost self-start px-0" disabled={now - sentAt < resendS * 1000 || busy} onClick={resend}>
              {now - sentAt < resendS * 1000 ? t('UI-KONTO-NEU-SENDEN-IN', { s: Math.ceil((resendS * 1000 - (now - sentAt)) / 1000) }) : t('UI-KONTO-NEU-SENDEN')}
            </button>
          </div>
        )}
        {step === 'gesendet' && <Banner kind="ok">{t('UI-KONTO-VERGESSEN-GESENDET')}</Banner>}
      </Page>
      <BottomBar>
        {step === 'form' && (
          <>
            <button className="btn-primary" disabled={busy || !email || (mode !== 'vergessen' && !password)} onClick={submit}>
              {mode === 'registrieren' ? t('ST-KON-22') : mode === 'anmelden' ? t('UI-KONTO-ANMELDEN') : t('UI-KONTO-LINK-SENDEN')}
            </button>
            {config?.apple && mode !== 'vergessen' && (
              <>
                <a className="btn bg-white text-black" href={`/api/auth/apple/start${invite ? `?invite=${encodeURIComponent(invite)}` : ''}`}>
                   {t('ST-KON-23')}
                </a>
                <p className="text-xs muted">{t('ST-KON-24')}</p>
              </>
            )}
            <button className="btn-ghost" onClick={() => setMode(mode === 'registrieren' ? 'anmelden' : 'registrieren')}>
              {mode === 'registrieren' ? t('UI-KONTO-SCHON-KONTO') : t('UI-KONTO-NOCH-KEINS')}
            </button>
          </>
        )}
        {(step === 'code' || step === 'geraet') && (
          <button className="btn-primary" disabled={busy || code.length !== 6} onClick={verify}>
            {t('ST-KON-12')}
          </button>
        )}
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── S04 · Einwilligung ───────────────────────────

export function Einwilligung() {
  const { config, refreshMe } = useApp();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [saved, setSaved] = useState(false);

  const accept = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post('/api/auth/consent', { accept: true, version: config?.consentVersion });
      if (r.recoveryCode) setCode(r.recoveryCode);
      else await refreshMe();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    await api.post('/api/auth/decline').catch(() => {});
    setDeclined(true);
  };

  if (declined) {
    return (
      <Page>
        <Banner>{t('UI-EINW-ABGELEHNT')}</Banner>
        <button className="btn-primary w-full mt-4" onClick={() => location.assign('/')}>
          {t('ST-KON-05')}
        </button>
      </Page>
    );
  }

  if (code) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header title={t('UI-WHR-CODE-TITEL')} />
        <Page className="flex-1">
          <p className="mb-4">{t('ST-WHR-02')}</p>
          <div className="card p-4 text-center font-mono text-xl tracking-wider select-all" aria-label={t('UI-WHR-CODE-TITEL')}>
            {code}
          </div>
          <button className="btn-secondary w-full mt-3" onClick={() => navigator.clipboard?.writeText(code)}>
            {t('UI-APP-KOPIEREN')}
          </button>
          <label className="flex items-center gap-3 mt-6">
            <input type="checkbox" className="w-5 h-5 accent-akzent" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <span>{t('UI-WHR-GESICHERT')}</span>
          </label>
        </Page>
        <BottomBar>
          <button className="btn-primary" disabled={!saved} onClick={() => refreshMe()}>
            {t('ST-KON-12')}
          </button>
        </BottomBar>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-EINW-TITEL')} />
      <Page className="flex-1">
        <p className="mb-4">{t('ST-KON-26')}</p>
        <div className="card p-4 text-sm leading-relaxed mb-3">{t('ST-KON-27')}</div>
        <p className="text-sm mb-4">
          <Link to="/rechtliches/datenschutz" className="text-akzent underline">
            {t('UI-RECHT-DATENSCHUTZ')}
          </Link>
        </p>
        <label className="flex items-start gap-3 mb-6">
          <input type="checkbox" className="mt-1 w-5 h-5 accent-akzent" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>{t('UI-EINW-KONTROLLE')}</span>
        </label>
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="font-semibold">{t('ST-KON-28')}</h2>
          <p className="text-sm">{t('ST-KON-29')}</p>
          <p className="text-sm">{t('ST-KON-30')}</p>
          <p className="text-sm">{t('ST-KON-31')}</p>
        </section>
        {err && (
          <div className="mt-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!checked || busy} onClick={accept}>
          {t('ST-KON-32')}
        </button>
        <button className="btn-ghost" onClick={decline}>
          {t('UI-EINW-NICHT')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── S05 · Profil anlegen ───────────────────────────

export function IntentionPicker({ value, duration, onChange }: { value: string | null; duration: string | null; onChange: (key: string | null, duration: string | null) => void }) {
  const { config } = useApp();
  const labels = parts('ST-PRO-08');
  const DUR_LABEL: Record<string, string> = { '1h': labels[1], '2h': labels[2], '4h': labels[3], '8h': labels[4], morgen: labels[5], wochenende: labels[6] };
  const current = config?.intentions.find((i) => i.key === value);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button className={`chip min-h-tap ${value === null ? 'border-akzent text-akzent' : ''}`} onClick={() => onChange(null, null)} aria-pressed={value === null}>
          {t('ST-PRO-06')}
        </button>
        {config?.intentions.map((i) => (
          <button key={i.key} className={`chip min-h-tap ${value === i.key ? 'border-akzent text-akzent' : ''}`} onClick={() => onChange(i.key, null)} aria-pressed={value === i.key}>
            {t(i.textId)}
          </button>
        ))}
      </div>
      {current && current.durations.length > 1 && (
        <div>
          <p className="label">{labels[0]}</p>
          <div className="flex flex-wrap gap-2">
            {current.durations.map((d) => (
              <button key={d} className={`chip min-h-tap ${(duration ?? current.default) === d ? 'border-akzent text-akzent' : ''}`} onClick={() => onChange(current.key, d)}>
                {DUR_LABEL[d] ?? d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfilAnlegen() {
  const nav = useNavigate();
  const { config, refreshMe } = useApp();
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<'foto' | 'unkenntlich' | 'initiale' | null>(null);
  const [intention, setIntention] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const colors: string[] = config?.params.colors ?? [];

  const done = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.post('/api/profile', { name, photoMode: 'initial', color: color ?? undefined, intention: intention ?? undefined, duration: duration ?? undefined });
      await refreshMe();
      if (photo === 'foto' || photo === 'unkenntlich') nav(`/ich/fotos?unkenntlich=${photo === 'unkenntlich' ? 1 : 0}&start=1`);
      else nav(isIosSafariNotInstalled() ? '/home-bildschirm' : '/naehe');
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('ST-KON-40')} sub={<p className="px-4 pb-2 text-xs muted">{t('UI-SCHRITT', { n: 3, von: 3 })}</p>} />
      <Page className="flex-1">
        <p className="mb-4 muted">{t('ST-KON-41')}</p>
        <Choice
          name="foto"
          value={photo}
          onChange={setPhoto}
          options={[
            { value: 'foto', label: t('ST-KON-42') },
            { value: 'unkenntlich', label: t('ST-KON-43'), hint: `${t('ST-KON-45')} ${t('ST-KON-46')}` },
            { value: 'initiale', label: t('ST-KON-44') },
          ]}
        />
        {photo === 'initiale' && colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3" role="radiogroup" aria-label={t('UI-PROFIL-FARBE')}>
            {colors.map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                onClick={() => setColor(c)}
                className={`w-11 h-11 rounded-full border-2 ${color === c ? 'border-text' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        )}
        <div className="mt-6">
          <Field label={t('UI-PROFIL-NAME')} hint={t('ST-KON-47')} value={name} maxLength={config?.params.nameMax ?? 20} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
        </div>
        <h2 className="font-semibold mt-4 mb-2">{t('ST-KON-48')}</h2>
        <IntentionPicker
          value={intention}
          duration={duration}
          onChange={(k, d) => {
            setIntention(k);
            setDuration(d);
          }}
        />
        <p className="text-sm muted mt-2">{t('ST-KON-49')}</p>
        {err && (
          <div className="mt-3">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!name.trim() || !photo || busy} onClick={done}>
          {t('ST-KON-50')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── S06 · Home-Bildschirm (iPhone) ───────────────────────────

export const SYMBOLS = [
  { key: 'a', name: 'Notizen' },
  { key: 'b', name: 'Rechner' },
  { key: 'c', name: 'Wetter' },
  { key: 'd', name: 'Liste' },
];

export function applySymbol(key: string) {
  const s = SYMBOLS.find((x) => x.key === key) ?? SYMBOLS[0];
  try {
    localStorage.setItem('tarn-symbol', s.key);
    localStorage.setItem('tarn-name', s.name);
  } catch {
    /* egal */
  }
  document.getElementById('manifest')?.setAttribute('href', `/manifest-${s.key}.webmanifest`);
  document.getElementById('favicon')?.setAttribute('href', `/icons/symbol-${s.key}.svg`);
  document.getElementById('touchicon')?.setAttribute('href', `/icons/symbol-${s.key}-180.png`);
  document.title = s.name;
}

export function SymbolPicker() {
  const [sel, setSel] = useState(() => localStorage.getItem('tarn-symbol') ?? 'a');
  return (
    <div className="grid grid-cols-4 gap-3" role="radiogroup">
      {SYMBOLS.map((s) => (
        <button
          key={s.key}
          role="radio"
          aria-checked={sel === s.key}
          onClick={() => {
            setSel(s.key);
            applySymbol(s.key);
          }}
          className={`card p-2 flex flex-col items-center gap-1 ${sel === s.key ? 'border-akzent' : ''}`}
        >
          <img src={`/icons/symbol-${s.key}.svg`} alt="" className="w-12 h-12" />
          <span className="text-xs">{s.name}</span>
        </button>
      ))}
    </div>
  );
}

export function HomeBildschirm() {
  const nav = useNavigate();
  const [how, setHow] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('ST-KON-60')} />
      <Page className="flex-1">
        <p className="mb-4">{t('ST-KON-61')}</p>
        <p className="mb-3 text-sm muted">{t('ST-KON-62')}</p>
        <SymbolPicker />
        {how && (
          <ol className="mt-6 flex flex-col gap-3 list-decimal list-inside">
            <li>{t('UI-HOME-SCHRITT-1')}</li>
            <li>{t('UI-HOME-SCHRITT-2')}</li>
            <li>{t('UI-HOME-SCHRITT-3')}</li>
          </ol>
        )}
      </Page>
      <BottomBar>
        <button className="btn-primary" onClick={() => setHow(true)}>
          {t('ST-KON-63')}
        </button>
        <button className="btn-ghost" onClick={() => nav('/naehe')}>
          {t('ST-KON-64')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── Passwort neu, Wiederherstellung ───────────────────────────

export function PasswortNeu() {
  const [params] = useSearchParams();
  const { refreshMe, config } = useApp();
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const token = params.get('token') ?? '';
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const submit = async () => {
    setErr(null);
    try {
      await api.post('/api/auth/reset/complete', token ? { token, password: pw } : { identifier, code, password: pw });
      await refreshMe();
      nav('/');
    } catch (e) {
      setErr(errText(e));
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('ST-MAIL-05')} back="/" />
      <Page className="flex-1">
        {!token && (
          <>
            <Field label={t('UI-KONTO-EMAIL-ODER-NUMMER')} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
            <Field label={t('UI-KONTO-CODE')} value={code} inputMode="numeric" onChange={(e) => setCode(e.target.value)} />
          </>
        )}
        <Field label={t('UI-KONTO-PASSWORT-NEU')} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint={t('UI-PASSWORT-KURZ', { zahl: config?.params.pwMin ?? 12 })} />
        {err && <Banner kind="error">{err}</Banner>}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!pw} onClick={submit}>
          {t('UI-APP-SPEICHERN')}
        </button>
      </BottomBar>
    </div>
  );
}

export function Wiederherstellung() {
  const { refreshMe } = useApp();
  const nav = useNavigate();
  const [way, setWay] = useState<'code' | 'schluessel'>('code');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [pending, setPending] = useState<{ token: string; dueAt: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('whr') ?? 'null');
    } catch {
      return null;
    }
  });
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    if (!pending) return;
    api.get(`/api/auth/recover/trusted/status?token=${encodeURIComponent(pending.token)}`).then((r) => setState(r.state)).catch(() => {});
  }, [pending]);

  const run = async (fn: () => Promise<void>) => {
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(errText(e));
    }
  };

  if (newCode) {
    return (
      <Page>
        <p className="mb-3">{t('ST-WHR-02')}</p>
        <div className="card p-4 text-center font-mono text-xl select-all">{newCode}</div>
        <button
          className="btn-primary w-full mt-4"
          onClick={async () => {
            await refreshMe();
            nav('/');
          }}
        >
          {t('ST-KON-12')}
        </button>
      </Page>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-KONTO-WIEDERHERSTELLEN')} back="/konto?modus=anmelden" />
      <Page className="flex-1">
        {pending ? (
          <div className="flex flex-col gap-3">
            <p>{state === 'bereit' ? t('UI-WHR-BEREIT') : state === 'beendet' ? t('UI-WHR-BEENDET') : t('UI-WHR-WARTET', { datum: new Date(pending.dueAt).toLocaleString('de-DE') })}</p>
            {state === 'bereit' && (
              <>
                <Field label={t('UI-KONTO-PASSWORT-NEU')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                <button
                  className="btn-primary"
                  onClick={() =>
                    run(async () => {
                      await api.post('/api/auth/recover/trusted/complete', { token: pending.token, password: pw });
                      localStorage.removeItem('whr');
                      await refreshMe();
                      nav('/');
                    })
                  }
                >
                  {t('UI-APP-SPEICHERN')}
                </button>
              </>
            )}
            {state === 'beendet' && (
              <button
                className="btn-secondary"
                onClick={() => {
                  localStorage.removeItem('whr');
                  setPending(null);
                }}
              >
                {t('UI-APP-ZURUECK')}
              </button>
            )}
          </div>
        ) : (
          <>
            <Choice
              name="weg"
              value={way}
              onChange={setWay}
              options={[
                { value: 'code', label: t('UI-WHR-MIT-CODE') },
                { value: 'schluessel', label: t('UI-WHR-MIT-SCHLUESSEL'), hint: t('ST-WHR-05') },
              ]}
            />
            <div className="mt-4">
              <Field label={t('UI-KONTO-EMAIL-ODER-NUMMER')} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              <Field label={way === 'code' ? t('UI-WHR-CODE-TITEL') : t('UI-WHR-SCHLUESSEL')} value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" />
              {way === 'code' && <Field label={t('UI-KONTO-PASSWORT-NEU')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />}
            </div>
            <p className="text-sm muted mb-3">{t('ST-WHR-01')}</p>
          </>
        )}
        {err && <Banner kind="error">{err}</Banner>}
      </Page>
      {!pending && (
        <BottomBar>
          <button
            className="btn-primary"
            disabled={!identifier || !secret || (way === 'code' && !pw)}
            onClick={() =>
              run(async () => {
                if (way === 'code') {
                  const r = await api.post('/api/auth/recover/code', { identifier, code: secret, password: pw });
                  setNewCode(r.recoveryCode);
                } else {
                  const r = await api.post('/api/auth/recover/trusted/start', { identifier, key: secret });
                  const p = { token: r.token, dueAt: r.dueAt };
                  localStorage.setItem('whr', JSON.stringify(p));
                  setPending(p);
                }
              })
            }
          >
            {t('ST-KON-12')}
          </button>
        </BottomBar>
      )}
    </div>
  );
}

export function WiederherstellungAbbrechen() {
  const [params] = useSearchParams();
  const [done, setDone] = useState<null | boolean>(null);
  const token = useMemo(() => params.get('t') ?? '', [params]);
  return (
    <Page>
      <h1 className="text-xl font-semibold mb-3">{t('UI-WHR-TITEL')}</h1>
      <p className="mb-4">{t('ST-WHR-07').replace(/\s*\[[^\]]+\]/g, '')}</p>
      {done === null ? (
        <button
          className="btn-danger w-full"
          onClick={async () => {
            try {
              await api.post('/api/auth/recover/trusted/cancel', { cancelToken: token });
              setDone(true);
            } catch {
              setDone(false);
            }
          }}
        >
          {t('UI-WHR-DAS-WAR-ICH-NICHT')}
        </button>
      ) : done ? (
        <Banner kind="ok">{t('UI-WHR-ABGEBROCHEN')}</Banner>
      ) : (
        <Banner kind="error">{t('UI-LINK-UNGUELTIG')}</Banner>
      )}
    </Page>
  );
}

export { INTENTION_TEXT };

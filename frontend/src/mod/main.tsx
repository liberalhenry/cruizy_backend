/**
 * Moderationswerkzeug — eigene Oberfläche unter eigener Adresse (M00).
 * Internes Werkzeug: Beschriftungen stehen direkt hier; Fehlermeldungen kommen als Text-ID vom Server.
 */
import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { api, ApiError, errText, setUnauthorizedHandler } from '../lib/api';
import { Banner, Field } from '../components/ui';
import { t } from '../lib/texts';
import { Screens, type Staff } from './screens';
import { Logo } from './common';

function Login({ onDone }: { onDone: () => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card p-6 w-full max-w-sm">
        <Logo className="h-9 w-auto mb-5" />
        <h1 className="text-xl font-semibold mb-4">Anmeldung Werkzeug</h1>
        <Field label="Kennung" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" />
        <Field label="Passwort" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <Field label="Zweiter Faktor (6 Ziffern)" inputMode="numeric" value={totp} onChange={(e) => setTotp(e.target.value)} autoComplete="one-time-code" />
        {err && <Banner kind="error">{err}</Banner>}
        <button
          className="btn-primary w-full mt-3"
          onClick={async () => {
            setErr(null);
            try {
              await api.post('/mod-api/login', { login, password, totp });
              onDone();
            } catch (e) {
              setErr(errText(e));
            }
          }}
        >
          Anmelden
        </button>
        <p className="text-xs muted mt-4">Abmeldung nach 30 Minuten ohne Eingabe, spätestens nach 12 Stunden.</p>
      </div>
    </div>
  );
}

function ModApp() {
  const [me, setMe] = useState<Staff | null | undefined>(undefined);
  const load = useCallback(() => {
    api
      .get('/mod-api/me')
      .then(setMe)
      .catch((e) => (e instanceof ApiError && e.status === 401 ? setMe(null) : setMe(null)));
  }, []);
  useEffect(() => {
    load();
    setUnauthorizedHandler(() => setMe(null));
  }, [load]);
  useEffect(() => {
    // 401 aus dem Werkzeug trägt eine eigene Text-ID — hier abfangen
    const orig = window.fetch;
    window.fetch = async (...args) => {
      const r = await orig(...args);
      if (r.status === 401 && String(args[0]).startsWith('/mod-api') && !String(args[0]).includes('/login')) setMe(null);
      return r;
    };
    return () => {
      window.fetch = orig;
    };
  }, []);
  if (me === undefined) return <p className="p-6 muted">…</p>;
  if (me === null) return <Login onDone={load} />;
  return <Screens me={me} onLogout={async () => (await api.post('/mod-api/logout').catch(() => {}), setMe(null))} reloadMe={load} />;
}

document.title = 'Werkzeug';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ModApp />
  </StrictMode>,
);

export { t };

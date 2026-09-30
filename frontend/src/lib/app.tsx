/** App-Zustand: Konfiguration, eigenes Profil, Verbindung, Zähler, kurze Hinweise. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, setUnauthorizedHandler } from './api';
import { idbClear } from './idb';
import { on, startRealtime, stopRealtime } from './realtime';
import { t } from './texts';

export type Phase = 'laden' | 'gast' | 'einwilligung' | 'profil' | 'mitglied' | 'gesperrt_minderjaehrig' | 'alterspruefung' | 'pruefung_vor_eintritt';

export interface Config {
  mode: 'test' | 'live';
  inviteRequired: boolean;
  apple: boolean;
  vapidKey: string;
  consentVersion: string;
  contract: { version: string; lines: string[] };
  stage2: boolean;
  zone2Check: boolean;
  beforeEntry: boolean;
  map: { tiles: string | null; attribution: string | null };
  params: Record<string, any>;
  intentions: { key: string; textId: string; default: string; durations: string[] }[];
  traits: { group: string; items: { id: number; name: string }[] }[];
  genders: { key: string; textId?: string; label?: string }[];
  positions: { key: string; label: string }[];
  bodyTypes: { key: string; label: string; hint: string }[];
  kinks: { group: string; items: { key: string; name: string }[] }[];
}

interface Ctx {
  config: Config | null;
  phase: Phase;
  me: any | null;
  refreshMe: () => Promise<void>;
  online: boolean;
  unread: number;
  convBadge: number;
  /** roter Punkt ohne Zahl (z. B. ungelesene Anfragen, neue Profilbesucher) */
  dot: { chats: boolean; ich: boolean };
  refreshCounts: () => void;
  toast: (text: string, action?: { label: string; run: () => void }, ms?: number) => void;
  logout: () => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider fehlt');
  return c;
}

interface ToastState {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [phase, setPhase] = useState<Phase>('laden');
  const [me, setMe] = useState<any | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [unread, setUnread] = useState(0);
  const [convBadge, setConvBadge] = useState(0);
  const [dot, setDot] = useState<{ chats: boolean; ich: boolean }>({ chats: false, ich: false });
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback((text: string, action?: { label: string; run: () => void }, ms = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, text, action }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), ms);
  }, []);

  const refreshCounts = useCallback(() => {
    api.get('/api/notices/unread').then((r) => setUnread(r.count)).catch(() => {});
    // Issue #14: ungelesene Gespräche vom Server (nur der eigene Lesestand). Zahl für „Gespräche“,
    // roter Punkt, wenn nur Anfragen ungelesen sind (F42: für Anfragen keine Mitteilung).
    api
      .get('/api/conversations/unread')
      .then((r) => {
        setConvBadge(r.conversations);
        setDot((d) => ({ ...d, chats: r.requests > 0 }));
      })
      .catch(() => {});
    // Issue #27: neue Profilbesucher als Punkt am Reiter „Ich“ — gebündelt, keine Push je Besuch
    api
      .get('/api/visitors/new')
      .then((r) => setDot((d) => ({ ...d, ich: r.count > 0 })))
      .catch(() => {});
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get('/api/profile/me');
      if (!r.profile) {
        setPhase('profil');
        setMe(null);
        return;
      }
      setMe(r);
      setPhase('mitglied');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) setPhase('gast');
        else if (e.code === 'einwilligung_fehlt') setPhase('einwilligung');
        else if (e.code === 'profil_fehlt') setPhase('profil');
        else if (e.code === 'gesperrt_minderjaehrig') setPhase('gesperrt_minderjaehrig');
        else if (e.code === 'alterspruefung_vor_nutzung') setPhase('alterspruefung');
        else if (e.code === 'pruefung_vor_eintritt') setPhase('pruefung_vor_eintritt');
        else if (e.status === 0) setPhase((p) => (p === 'laden' ? 'mitglied' : p));
        else setPhase('gast');
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => {});
    stopRealtime();
    await idbClear();
    try {
      localStorage.removeItem('gesehen');
    } catch {
      /* egal */
    }
    setMe(null);
    setPhase('gast');
  }, []);

  useEffect(() => {
    api.get<Config>('/api/config').then(setConfig).catch(() => {});
    refreshMe();
    setUnauthorizedHandler(() => setPhase('gast'));
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [refreshMe]);

  useEffect(() => {
    if (phase !== 'mitglied') return;
    startRealtime();
    refreshCounts();
    const offs = [
      on('mitteilung', () => refreshCounts()),
      on('nachricht', () => refreshCounts()),
      on('konto', () => refreshMe()),
      on('foto', () => refreshMe()),
    ];
    return () => offs.forEach((f) => f());
  }, [phase, refreshCounts, refreshMe]);

  const value = useMemo(
    () => ({ config, phase, me, refreshMe, online, unread, convBadge, dot, refreshCounts, toast, logout }),
    [config, phase, me, refreshMe, online, unread, convBadge, dot, refreshCounts, toast, logout],
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-20 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className="pointer-events-auto card px-4 py-3 max-w-md w-full flex items-center gap-3 shadow-lg">
            <span className="flex-1 text-sm">{x.text}</span>
            {x.action && (
              <button
                className="btn-ghost"
                onClick={() => {
                  x.action!.run();
                  setToasts((l) => l.filter((y) => y.id !== x.id));
                }}
              >
                {x.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      {!online && phase !== 'laden' && (
        <div className="fixed top-0 inset-x-0 z-[55] bg-warn/90 text-grund text-center text-sm py-1 safe-top" role="status">
          {t('ST-LEER-30')}
        </div>
      )}
    </AppCtx.Provider>
  );
}


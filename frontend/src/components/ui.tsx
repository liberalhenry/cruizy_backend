/** Grundbausteine der Oberfläche: dunkles Neutral, ein Akzent, Berührflächen ≥ 44 px. */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/texts';
import { tripleTap } from '../lib/hide';
import { ApiError, errText } from '../lib/api';

export function Icon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    back: 'M15 18l-6-6 6-6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    close: 'M18 6L6 18M6 6l12 12',
    send: 'M5 12h14M13 6l6 6-6 6',
    pin: 'M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    today: 'M4 7h16M7 3v4M17 3v4M5 7h14v13H5z',
    chat: 'M4 5h16v11H8l-4 4z',
    me: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-4 5-6 8-6s6.5 2 8 6',
    shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
    image: 'M4 5h16v14H4zM8 11a2 2 0 100-4 2 2 0 000 4zM20 16l-5-5-9 8',
    check: 'M5 12l5 5 9-10',
    bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0',
    filter: 'M4 6h16M7 12h10M10 18h4',
    sort: 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
    plus: 'M12 5v14M5 12h14',
    trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
    lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
    map: 'M9 4l6 2 5-2v14l-5 2-6-2-5 2V6z M9 4v14 M15 6v14',
    list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    star: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9 5.5-.8z',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
    search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
    mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3',
    smile: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 14.5s1.3 1.5 3.5 1.5 3.5-1.5 3.5-1.5M9 9.5h.01M15 9.5h.01',
    album: 'M4 7h16v12H4zM7 4h10M9 12l2 2 4-4',
    flame: 'M12 3s5 4.5 5 9a5 5 0 01-10 0c0-2 1-3.5 1-3.5S9 11 10.5 11C10.5 7.5 12 3 12 3z',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
    play: 'M8 5v14l11-7z',
    pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
    users: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c.8-3.3 3.3-5 6-5s5.2 1.7 6 5M16 11a3 3 0 100-6M18 15c1.5.7 2.6 2.4 3 5',
    plane: 'M2 13l8-2 5-7 2 1-3 7 5 2 1-1 2 1-2 3-3-1-7 3-2-1 3-4z',
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  );
}

/** Kopfzeile mit Zurück-Pfeil. Dreimal schnell auf den Titel → verstecken (ST-SIC-31). */
export function Header({ title, back, right, sub }: { title: string; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  const tap = useRef(tripleTap(1000)).current;
  return (
    <header className="sticky top-0 z-20 bg-grund/90 backdrop-blur-xl border-b border-white/[0.06] safe-top">
      <div className="flex items-center gap-1 px-2 min-h-[56px]">
        {back ? (
          <button className="btn-ghost px-2" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} aria-label={t('UI-APP-ZURUECK')}>
            <Icon name="back" />
          </button>
        ) : (
          <span className="w-2" />
        )}
        {/* Reiter-Seiten (ohne Zurück) tragen den Titel größer — Unterseiten ordnen sich darunter */}
        <h1 className={`flex-1 font-bold tracking-tight truncate select-none ${back ? 'text-xl' : 'text-[26px] leading-none pl-2'}`} onClick={tap}>
          {title}
        </h1>
        {right}
      </div>
      {sub}
    </header>
  );
}

/** Schrittanzeige: Balken je Schritt plus Text („Schritt 2 von 3“) für das Vorlesen. */
export function Steps({ n, of, className = 'px-4 pb-3' }: { n: number; of: number; className?: string }) {
  return (
    <div className={className}>
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: of }).map((_, k) => (
          <span key={k} className={`h-1 flex-1 rounded-full transition ${k < n ? 'bg-akzent' : 'bg-white/10'} ${k === n - 1 ? 'shadow-[0_0_10px_rgba(90,169,255,0.6)]' : ''}`} />
        ))}
      </div>
      <p className="text-xs muted mt-1.5">{t('UI-SCHRITT', { n, von: of })}</p>
    </div>
  );
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`px-4 py-4 max-w-2xl mx-auto w-full animate-auftritt ${className}`}>{children}</main>;
}

/** Hauptaktion fest am unteren Rand (Hauptaktionen im unteren Drittel). */
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 bg-grund/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3 safe-bottom">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">{children}</div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-einblenden" aria-label={t('UI-APP-SCHLIESSEN')} onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-flaeche border-t border-white/[0.08] safe-bottom animate-hochfahren"
        style={{ boxShadow: '0 -20px 50px -20px rgba(0,0,0,0.9)' }}
      >
        <div className="sticky top-0 z-10 bg-flaeche/95 backdrop-blur px-4 pt-2 pb-2 border-b border-linie/70">
          <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-white/15" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <div className="flex-1 font-display text-lg font-semibold tracking-tight">{title}</div>
            <button className="btn-ghost px-2" onClick={onClose} aria-label={t('UI-APP-SCHLIESSEN')}>
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1">
        <label htmlFor={id} className="block">
          {label}
        </label>
        {hint && <p className="text-sm muted mt-1">{hint}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-12 h-7 rounded-full border transition ${checked ? 'bg-akzent border-akzent shadow-[0_0_16px_-4px_rgba(90,169,255,0.7)]' : 'bg-flaeche2 border-linie'} disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 w-6 h-6 rounded-full transition-all shadow-[0_1px_3px_rgba(0,0,0,0.5)] ${checked ? 'left-[22px] bg-white' : 'left-0.5 bg-text/90'}`} />
      </button>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  ...props
}: { label: string; hint?: ReactNode; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="mb-3">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="input" aria-invalid={!!error} aria-describedby={hint ? `${id}-h` : undefined} {...props} />
      {hint && (
        <p id={`${id}-h`} className="text-sm muted mt-1">
          {hint}
        </p>
      )}
      {error && <p className="text-sm text-gefahr mt-1">{error}</p>}
    </div>
  );
}

export function TextArea({ label, hint, error, ...props }: { label: string; hint?: ReactNode; error?: string | null } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className="mb-3">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea id={id} className="input py-2 min-h-[110px]" {...props} />
      {hint && <p className="text-sm muted mt-1">{hint}</p>}
      {error && <p className="text-sm text-gefahr mt-1">{error}</p>}
    </div>
  );
}

export function Banner({ kind = 'info', children, action }: { kind?: 'info' | 'warn' | 'error' | 'ok'; children: ReactNode; action?: ReactNode }) {
  const cls = {
    info: 'bg-flaeche2/70 border-linie before:bg-akzent/70',
    warn: 'bg-warn/[0.07] border-warn/30 before:bg-warn',
    error: 'bg-gefahr/[0.08] border-gefahr/35 before:bg-gefahr',
    ok: 'bg-gut/[0.07] border-gut/30 before:bg-gut',
  }[kind];
  return (
    <div
      className={`relative overflow-hidden rounded-xl border pl-5 pr-4 py-3 text-sm leading-relaxed before:absolute before:left-0 before:inset-y-0 before:w-1 ${cls}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <div>{children}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Avatar({ name, initial, color, photo, blurred, size = 48 }: { name?: string | null; initial?: string; color?: string; photo?: string | null; blurred?: boolean; size?: number }) {
  const style = { width: size, height: size };
  if (photo) {
    return <img src={photo} alt="" style={style} className={`rounded-full object-cover bg-flaeche2 ${blurred ? '' : ''}`} loading="lazy" />;
  }
  return (
    <div style={{ ...style, background: color ?? '#3b4cc0' }} className="rounded-full grid place-items-center font-semibold text-white" aria-hidden="true">
      <span style={{ fontSize: size * 0.42 }}>{initial ?? (name ? [...name][0]?.toUpperCase() : '?')}</span>
    </div>
  );
}

/**
 * Warten auf das Team (kein Versandweg eingerichtet): fragt alle paar Sekunden nach, bis bestätigt.
 * `ask` wirft mit dem Code „wartet“, solange niemand bestätigt hat.
 */
export function TeamWait({ text, ask, onDone }: { text: ReactNode; ask: () => Promise<unknown>; onDone: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const fn = useRef(ask);
  fn.current = ask;
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let alive = true;
    const i = setInterval(async () => {
      try {
        await fn.current();
        if (alive) done.current();
      } catch (e) {
        if (alive && !(e instanceof ApiError && e.code === 'wartet')) setErr(errText(e));
      }
    }, 8000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, []);
  return (
    <div className="flex flex-col gap-2">
      <Banner kind="info">{text}</Banner>
      <p className="flex items-center gap-2 text-sm muted">
        <span className="w-4 h-4 rounded-full border-2 border-akzent border-t-transparent animate-spin" aria-hidden="true" />
        {t('UI-TEAM-WARTET-KURZ')}
      </p>
      {err && <Banner kind="error">{err}</Banner>}
    </div>
  );
}

export function Empty({ text, action }: { text: ReactNode; action?: ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto mb-3 w-10 h-10 rounded-full border border-dashed border-linie" aria-hidden="true" />
      <p className="muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gradient-to-r from-flaeche2 via-[#262c39] to-flaeche2 ${className}`} />;
}

export function Choice<T extends string>({ options, value, onChange, name }: { options: { value: T; label: ReactNode; hint?: ReactNode }[]; value: T | null; onChange: (v: T) => void; name: string }) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {options.map((o) => (
        <label key={o.value} className={`card px-4 py-3 flex items-start gap-3 cursor-pointer transition ${value === o.value ? '!border-akzent/80 ring-4 ring-akzent/10' : 'hover:border-[#3a4254]'}`}>
          <input type="radio" name={name} className="mt-1 accent-akzent" checked={value === o.value} onChange={() => onChange(o.value)} />
          <span className="flex-1">
            <span className="block">{o.label}</span>
            {o.hint && <span className="block text-sm muted mt-0.5">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export function ListCard({ children }: { children: ReactNode }) {
  return <div className="card overflow-hidden">{children}</div>;
}

export function RowLink({ to, label, hint, badge, onClick }: { to?: string; label: ReactNode; hint?: ReactNode; badge?: ReactNode; onClick?: () => void }) {
  const nav = useNavigate();
  return (
    <button className="row group hover:bg-white/[0.03]" onClick={() => (onClick ? onClick() : to && nav(to))}>
      <span className="flex-1 py-3">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm muted leading-snug mt-0.5">{hint}</span>}
      </span>
      {badge}
      <Icon name="back" className="w-4 h-4 rotate-180 text-leise/70 transition group-hover:translate-x-0.5 group-hover:text-leise" />
    </button>
  );
}

export function Section({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6">
      {title && (
        <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-leise mb-2.5">
          <span className="h-px w-3 bg-akzent" aria-hidden="true" />
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; error: any; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((x) => x + 1), setData: (d: T) => setState({ data: d, error: null, loading: false }) };
}

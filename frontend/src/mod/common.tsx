/** Gemeinsame Bausteine der Werkzeug-Bildschirme. */
import { useState, type ReactNode } from 'react';
import { Banner, TextArea } from '../components/ui';
import { errText } from '../lib/api';

export function useAction() {
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, success?: string) => {
    setErr(null);
    setOk(null);
    try {
      const r = await fn();
      if (success) setOk(success);
      return r;
    } catch (e) {
      setErr(errText(e));
      return null;
    }
  };
  const box = (
    <>
      {err && (
        <div className="my-2">
          <Banner kind="error">{err}</Banner>
        </div>
      )}
      {ok && (
        <div className="my-2">
          <Banner kind="ok">{ok}</Banner>
        </div>
      )}
    </>
  );
  return { run, box };
}

// Owner handeln allein und ohne Begründung — gesetzt beim Laden des eigenen Zugangs (main.tsx).
// Der Server füllt eine fehlende Begründung bei Owner selbst; hier wird nur nichts mehr gesperrt.
let ownerMode = false;
export function setOwnerMode(on: boolean) {
  ownerMode = on;
}
export function isOwnerMode() {
  return ownerMode;
}

/** Begründung zu kurz? Für Owner nie — sie brauchen keine. */
export function tooShort(value: string, min: number) {
  return !ownerMode && value.trim().length < min;
}

/** Grund-Eingabe: ohne Begründung wird nichts ausgeführt (M60) — außer von Owner. */
export function Reason({ value, onChange, label = 'Begründung (wird protokolliert)', min = 1 }: { value: string; onChange: (v: string) => void; label?: string; min?: number }) {
  const hint = ownerMode ? 'als Owner freiwillig' : min > 1 ? `mindestens ${min} Zeichen` : undefined;
  return <TextArea label={label} value={value} onChange={(e) => onChange(e.target.value)} hint={hint} />;
}

export function Card({ title, children, right }: { title?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="card p-4 mb-4">
      {(title || right) && (
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold flex-1">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}


/** Logo von Cruizy (shared/brand, erzeugt von build-brand.py) — nur im Werkzeug, nie in der getarnten App. */
export function Logo({ className = 'h-7 w-auto' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 388 128" className={className} role="img" aria-label="Cruizy">
      <path d="M90.79 43.07 A34 34 0 1 0 90.79 84.93" fill="none" stroke="#5aa9ff" strokeWidth="15" strokeLinecap="round"/><circle cx="98.00" cy="64" r="8.5" fill="#e8ecf2"/><g transform="translate(152 26)"><path d="M34.86 26.62 A20 20 0 1 0 34.86 53.38" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><path d="M48 60 V20 M48 38 Q48 20 70 20" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><path d="M82 20 V42 A18 18 0 0 0 118 42 M118 20 V60" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><path d="M132 20 V60" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="132" cy="4" r="5.58" fill="#5aa9ff"/><path d="M146 20 H178 L146 60 H178" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/><path d="M192 20 L210 52 M228 20 L202 80" fill="none" stroke="#e8ecf2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
  );
}

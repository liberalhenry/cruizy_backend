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

/** Grund-Eingabe: ohne Begründung wird nichts ausgeführt (M60). */
export function Reason({ value, onChange, label = 'Begründung (wird protokolliert)', min = 1 }: { value: string; onChange: (v: string) => void; label?: string; min?: number }) {
  return <TextArea label={label} value={value} onChange={(e) => onChange(e.target.value)} hint={min > 1 ? `mindestens ${min} Zeichen` : undefined} />;
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


/**
 * „Bestätigen“ — alles, was das Team von Hand bestätigt, weil ein Prüf- oder Versandweg fehlt
 * (und die unsicheren Ausweise, Issue #7). Zwei Listen: Bilder (Ausweis, Selfies) und Adressen/Nummern.
 */
import { useState } from 'react';
import { Banner, Sheet, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction, tooShort } from './common';

const KIND: Record<string, { label: string; hint: string }> = {
  age1: { label: 'Ausweis', hint: 'Nur das Geburtsdatum zählt. Die automatische Auswertung war unsicher.' },
  age2: { label: 'Stufe 2', hint: 'Ausweis und Selfie: 18 oder älter — und dieselbe Person? Die Geste muss zu sehen sein.' },
  face: { label: 'Fotoprüfung', hint: 'Selfie gegen die Profilfotos: dieselbe Person? Die Geste muss zu sehen sein.' },
  date_face: { label: 'Cruizy Date', hint: 'Selfie gegen das erste Date-Foto: dieselbe Person? Die Geste muss zu sehen sein.' },
};

const DECISION: Record<string, { label: string; cls: string; done: string }> = {
  volljaehrig: { label: '18 oder älter', cls: 'btn-primary', done: '18 oder älter' },
  passt: { label: 'Passt — bestätigen', cls: 'btn-primary', done: 'passt' },
  unlesbar: { label: 'Nicht eindeutig — neu versuchen lassen', cls: 'btn-secondary', done: 'nicht eindeutig' },
  passt_nicht: { label: 'Passt nicht', cls: 'btn-secondary', done: 'passt nicht' },
  minderjaehrig: { label: 'Unter 18 — Konto sperren', cls: 'btn-danger', done: 'unter 18' },
  abgelaufen: { label: 'abgelaufen', cls: '', done: 'abgelaufen (nicht rechtzeitig geprüft)' },
};

function Ampel({ v }: { v: string }) {
  const c = v === 'rot' ? 'bg-gefahr' : v === 'gelb' ? 'bg-warn' : 'bg-gut';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c}`} aria-label={`Ampel ${v}`} />;
}

function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4" role="tablist">
      {items.map((x) => (
        <button
          key={x.key}
          role="tab"
          aria-selected={value === x.key}
          className={`chip min-h-[36px] ${value === x.key ? '!border-akzent text-akzent bg-akzent/10' : ''}`}
          onClick={() => onChange(x.key)}
        >
          {x.label}
          {x.count !== undefined && <span className={`ml-1 rounded-full px-1.5 text-xs ${x.count ? 'bg-akzent text-grund' : 'bg-white/10 muted'}`}>{x.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Bestaetigen({ onChange }: { onChange?: () => void }) {
  const [tab, setTab] = useState<'bilder' | 'kontakte'>('bilder');
  const reviews = useAsync(() => api.get('/mod-api/id-reviews'), []);
  const contacts = useAsync(() => api.get('/mod-api/contacts'), []);
  const reload = () => {
    reviews.reload();
    contacts.reload();
    onChange?.();
  };
  const manual: { label: string; detail: string }[] = contacts.data?.manual ?? [];

  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Bestätigen</h1>
      <p className="text-sm muted mb-4">Was ein Mensch aus dem Team von Hand bestätigt — weil ein Prüf- oder Versandweg nicht angebunden ist oder die Automatik unsicher war.</p>
      {manual.length > 0 && (
        <details className="card p-4 mb-4">
          <summary className="cursor-pointer text-sm font-medium">Warum landet das hier? ({manual.length} Wege übernimmt gerade das Team)</summary>
          <ul className="mt-3 text-sm flex flex-col gap-1.5">
            {manual.map((m) => (
              <li key={m.label}>
                <span className="font-medium">{m.label}:</span> <span className="muted">{m.detail}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { key: 'bilder', label: 'Ausweise und Selfies', count: reviews.data?.items.length },
          { key: 'kontakte', label: 'Adressen und Nummern', count: contacts.data?.items.length },
        ]}
      />
      {tab === 'bilder' ? <Reviews data={reviews.data} reload={reload} /> : <Contacts data={contacts.data} reload={reload} />}
    </>
  );
}

function Reviews({ data, reload }: { data: any; reload: () => void }) {
  const [kind, setKind] = useState('alle');
  const [open, setOpen] = useState<any | null>(null);
  const [reveal, setReveal] = useState(false);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const items: any[] = (data?.items ?? []).filter((r: any) => kind === 'alle' || r.kind === kind);
  const count = (k: string) => (data?.items ?? []).filter((r: any) => r.kind === k).length;

  const decide = async (decision: string) => {
    const r = await run(() => api.post(`/mod-api/id-reviews/${open.id}/decide`, { decision, reason }), `Entschieden: ${DECISION[decision].done}. Die Bilder sind gelöscht.`);
    if (r) {
      setOpen(null);
      setReason('');
      reload();
    }
  };

  return (
    <>
      <Tabs
        value={kind}
        onChange={setKind}
        items={[{ key: 'alle', label: 'Alle' }, ...Object.entries(KIND).map(([k, v]) => ({ key: k, label: v.label, count: count(k) }))]}
      />
      {box}
      <Card title={`Offen (${items.length})`}>
        {!items.length && <p className="muted text-sm">Nichts offen.</p>}
        <ul className="flex flex-col divide-y divide-linie">
          {items.map((r) => (
            <li key={r.id} className="py-2.5 flex items-center gap-3">
              <Ampel v={r.ampel} />
              <span className="chip text-xs">{KIND[r.kind]?.label ?? r.kind}</span>
              <span className="font-mono text-sm">{r.number}</span>
              <span className="flex-1 text-sm muted truncate">{r.pose ? `Geste: ${r.pose}` : r.note}</span>
              <span className="text-xs muted hidden sm:inline">bis {fmtDate(r.deadlineAt, true)}</span>
              <button
                className="btn-secondary min-h-[36px]"
                onClick={async () => {
                  const res: any = await run(() => api.post(`/mod-api/id-reviews/${r.id}/open`, {}));
                  if (res) {
                    setOpen(res);
                    setReveal(false);
                  }
                }}
              >
                Öffnen
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Entschieden (7 Tage)">
        {!data?.done.length && <p className="muted text-sm">Noch nichts.</p>}
        <table className="w-full text-sm">
          <tbody>
            {data?.done.map((d: any) => (
              <tr key={d.number} className="border-t border-linie">
                <td className="py-2 font-mono">{d.number}</td>
                <td>{KIND[d.kind]?.label ?? d.kind}</td>
                <td>{DECISION[d.decision]?.done ?? d.decision}</td>
                <td className="muted">{d.decidedBy}</td>
                <td className="muted">{fmtDate(d.decidedAt, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `${KIND[open.kind]?.label} · ${open.number}` : ''}>
        {open && (
          <div className="flex flex-col gap-3 text-sm">
            <Banner kind="info">
              {KIND[open.kind]?.hint} Nichts abschreiben, nichts notieren.
            </Banner>
            {open.kind === 'age1' && <p className="muted">Automatische Auswertung: {open.note}</p>}
            {open.pose && (
              <p>
                Verlangte Geste: <span className="font-semibold">{open.pose}</span>
              </p>
            )}
            {!reveal ? (
              <button className="btn-secondary" onClick={() => setReveal(true)}>
                Bilder anzeigen
              </button>
            ) : (
              <div className={`grid gap-3 ${open.references.length ? 'sm:grid-cols-2' : ''}`}>
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-wide muted">Eingereicht</p>
                  {open.images.map((src: string, i: number) => (
                    <img key={i} src={src} alt={`Eingereichtes Bild ${i + 1}`} className="max-h-96 object-contain rounded-lg bg-black/30" />
                  ))}
                </div>
                {open.references.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-wide muted">{open.kind === 'date_face' ? 'Erstes Date-Foto' : 'Profilfotos'}</p>
                    {open.references.map((src: string, i: number) => (
                      <img key={i} src={src} alt={`Vergleichsbild ${i + 1}`} className="max-h-72 object-contain rounded-lg bg-black/30" />
                    ))}
                  </div>
                )}
              </div>
            )}
            {box}
            <Reason value={reason} onChange={setReason} min={3} label="Begründung (wird protokolliert — keine Daten vom Ausweis eintragen)" />
            <div className="flex flex-wrap gap-2">
              {open.decisions.map((d: string) => (
                <button key={d} className={DECISION[d].cls} disabled={tooShort(reason, 3)} onClick={() => decide(d)}>
                  {open.kind === 'age2' && d === 'volljaehrig' ? '18 oder älter und dieselbe Person' : DECISION[d].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function Contacts({ data, reload }: { data: any; reload: () => void }) {
  const [open, setOpen] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const act = async (decision: 'bestaetigen' | 'ablehnen') => {
    const r = await run(() => api.post(`/mod-api/contacts/${open.id}/${decision}`, { reason }), decision === 'bestaetigen' ? 'Bestätigt — die App geht bei der Person von selbst weiter.' : 'Abgelehnt.');
    if (r) {
      setOpen(null);
      setReason('');
      reload();
    }
  };
  return (
    <>
      {box}
      <Card title={`Offen (${data?.items.length ?? 0})`}>
        {!data?.items.length && <p className="muted text-sm">Nichts offen.</p>}
        <ul className="flex flex-col divide-y divide-linie">
          {data?.items.map((c: any) => (
            <li key={c.id} className="py-2.5 flex items-center gap-3">
              <span className="font-mono text-xs muted">{c.ref}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm">{c.label}</span>
                <span className="block text-xs muted truncate">
                  {c.target}
                  {c.name ? ` · Profil „${c.name}“` : ''} · Konto seit {fmtDate(c.accountSince)}
                </span>
              </span>
              {c.risky && <span className="chip text-xs text-warn border-warn/40">Vorsicht</span>}
              <button className="btn-secondary min-h-[36px]" onClick={() => setOpen(c)}>
                Prüfen
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Bestätigt (7 Tage)">
        {!data?.done.length && <p className="muted text-sm">Noch nichts.</p>}
        <table className="w-full text-sm">
          <tbody>
            {data?.done.map((d: any) => (
              <tr key={d.ref} className="border-t border-linie">
                <td className="py-2 font-mono text-xs">{d.ref}</td>
                <td>{d.label}</td>
                <td className="muted">{d.by}</td>
                <td className="muted">{fmtDate(d.at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.label}>
        {open && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              <span className="muted">Angabe:</span> {open.target}
              <br />
              <span className="muted">Angefragt:</span> {fmtDate(open.createdAt, true)} · gilt bis {fmtDate(open.expiresAt, true)}
            </p>
            <Banner kind={open.risky ? 'warn' : 'info'}>
              {open.risky
                ? 'Anmeldung auf einem neuen Gerät: Nur bestätigen, wenn die Person sich zusätzlich gemeldet hat (z. B. im Postfach) und es plausibel ist. Wer das Passwort gestohlen hat, sieht genauso aus.'
                : 'Ohne Versand kann niemand beweisen, dass die Angabe der Person gehört. Bestätige, wenn nichts dagegen spricht (keine Wegwerf-Adresse, kein auffälliges Muster).'}
            </Banner>
            {box}
            <Reason value={reason} onChange={setReason} min={3} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" disabled={tooShort(reason, 3)} onClick={() => act('bestaetigen')}>
                Bestätigen
              </button>
              <button className="btn-secondary" disabled={tooShort(reason, 3)} onClick={() => act('ablehnen')}>
                Ablehnen
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

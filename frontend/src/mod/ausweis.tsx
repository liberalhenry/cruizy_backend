/** Issue #7: Ausweisbilder, bei denen die automatische Auswertung unsicher war. Nur das Geburtsdatum zählt. */
import { useState } from 'react';
import { Banner, Sheet, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction, tooShort } from './common';

const LABEL: Record<string, string> = {
  volljaehrig: '18 oder älter',
  minderjaehrig: 'unter 18',
  unlesbar: 'nicht lesbar',
  abgelaufen: 'abgelaufen (nicht rechtzeitig geprüft)',
};

function Ampel({ v }: { v: string }) {
  const c = v === 'rot' ? 'bg-gefahr' : v === 'gelb' ? 'bg-warn' : 'bg-gut';
  return <span className={`inline-block w-3 h-3 rounded-full ${c}`} aria-label={`Ampel ${v}`} />;
}

export function Ausweise() {
  const { data, reload } = useAsync(() => api.get('/mod-api/id-reviews'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [reveal, setReveal] = useState(false);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();

  const decide = async (decision: string) => {
    const r = await run(() => api.post(`/mod-api/id-reviews/${open.id}/decide`, { decision, reason }), `Entschieden: ${LABEL[decision]}. Die Bilder sind gelöscht.`);
    if (r) {
      setOpen(null);
      setReason('');
      reload();
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Altersprüfung (Ausweis)</h1>
      <p className="text-sm muted mb-4">
        Hier landen Ausweisbilder, bei denen die automatische Auswertung unsicher war. Es zählt nur das Geburtsdatum — Name, Foto, Adresse und Nummer dürfen abgedeckt sein und werden nicht
        erfasst. Mit der Entscheidung werden die Bilder gelöscht.
      </p>
      {box}
      <Card title={`Offen (${data?.items.length ?? 0})`}>
        {!data?.items.length && <p className="muted text-sm">Nichts offen.</p>}
        <table className="w-full text-sm">
          <tbody>
            {data?.items.map((r: any) => (
              <tr key={r.id} className="border-t border-linie">
                <td className="py-2">
                  <Ampel v={r.ampel} />
                </td>
                <td>{r.number}</td>
                <td className="muted">{r.note}</td>
                <td>{fmtDate(r.deadlineAt, true)}</td>
                <td>
                  <button
                    className="btn-ghost"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card title="Entschieden (7 Tage)">
        <table className="w-full text-sm">
          <tbody>
            {data?.done.map((d: any) => (
              <tr key={d.number} className="border-t border-linie">
                <td className="py-2">{d.number}</td>
                <td>{LABEL[d.decision] ?? d.decision}</td>
                <td className="muted">{d.decidedBy}</td>
                <td className="muted">{fmtDate(d.decidedAt, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.number}>
        {open && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="muted">Automatische Auswertung: {open.note}</p>
            <Banner kind="info">Nur auf das Geburtsdatum schauen. Nichts abschreiben, nichts notieren.</Banner>
            {!reveal ? (
              <button className="btn-secondary" onClick={() => setReveal(true)}>
                Bilder anzeigen
              </button>
            ) : (
              open.images.map((src: string, i: number) => <img key={i} src={src} alt={`Ausweisbild ${i + 1}`} className="max-h-96 object-contain rounded-lg" />)
            )}
            {box}
            <Reason value={reason} onChange={setReason} min={3} label="Begründung (wird protokolliert — kein Geburtsdatum eintragen)" />
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" disabled={tooShort(reason, 3)} onClick={() => decide('volljaehrig')}>
                18 oder älter
              </button>
              <button className="btn-secondary" disabled={tooShort(reason, 3)} onClick={() => decide('unlesbar')}>
                Nicht lesbar — neu versuchen lassen
              </button>
              <button className="btn-danger" disabled={tooShort(reason, 3)} onClick={() => decide('minderjaehrig')}>
                Unter 18 — Konto sperren
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

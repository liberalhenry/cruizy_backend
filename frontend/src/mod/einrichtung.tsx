/** „Einrichtung“ (Owner, BETRIEB): Was ist angebunden, was übernimmt das Team — und alte Beispieldaten löschen. */
import { useState } from 'react';
import { Banner, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { Card, Reason, useAction, tooShort } from './common';

const STATE: Record<string, { label: string; cls: string }> = {
  ok: { label: 'angebunden', cls: 'text-gut border-gut/40 bg-gut/10' },
  team: { label: 'Team bestätigt', cls: 'text-akzent border-akzent/40 bg-akzent/10' },
  warnung: { label: 'prüfen', cls: 'text-warn border-warn/40 bg-warn/10' },
  aus: { label: 'aus', cls: 'muted' },
};

export function Einrichtung({ owner }: { owner: boolean }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/einrichtung'), []);
  const [reason, setReason] = useState('');
  const [sure, setSure] = useState(false);
  const { run, box } = useAction();
  if (!data) return <p className="muted">…</p>;
  const td = data.testdata;
  const tdTotal = td.konten + td.orte + td.termine + td.veranstalter;
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Einrichtung</h1>
      <p className="text-sm muted mb-4">
        Was in der <code>.env</code> angebunden ist. Fehlt ein Weg, läuft die App trotzdem — die Fälle landen dann unter „Bestätigen“ und ein Mensch entscheidet.
      </p>
      {box}
      <Card title="Prüf- und Versandwege">
        <ul className="flex flex-col divide-y divide-linie">
          {data.setup.map((x: any) => (
            <li key={x.key} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2">
              <span className="sm:w-48 font-medium">{x.label}</span>
              <span className="flex-1 text-sm">
                {x.detail}
                {x.env && x.state !== 'ok' && <span className="block text-xs muted mt-1">Für den Betrieb ohne Team: {x.env}</span>}
              </span>
              <span className={`chip text-xs self-start ${STATE[x.state]?.cls ?? ''}`}>{STATE[x.state]?.label ?? x.state}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Beispieldaten aus dem früheren Testbetrieb">
        {tdTotal === 0 ? (
          <p className="text-sm muted">Keine vorhanden.</p>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Noch vorhanden: {td.konten} Konten, {td.orte} Orte, {td.termine} Termine, {td.veranstalter} Veranstalter — alle erfunden (Kennzeichen „Testdaten“).
            </p>
            {owner ? (
              <>
                <Banner kind="warn">Löscht alle erfundenen Konten samt Fotos, Chats und Date-Profilen, dazu die erfundenen Orte und Termine. Echte Konten bleiben unberührt. Nicht umkehrbar.</Banner>
                <Reason value={reason} onChange={setReason} min={3} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-akzent w-4 h-4" checked={sure} onChange={(e) => setSure(e.target.checked)} />
                  Ja, alle Beispieldaten löschen
                </label>
                <button
                  className="btn-danger self-start"
                  disabled={!sure || tooShort(reason, 3)}
                  onClick={async () => {
                    const r: any = await run(() => api.post('/mod-api/einrichtung/testdaten-loeschen', { reason }));
                    if (r) {
                      setSure(false);
                      setReason('');
                      reload();
                    }
                  }}
                >
                  Beispieldaten löschen
                </button>
              </>
            ) : (
              <p className="muted">Löschen kann nur ein Owner.</p>
            )}
          </div>
        )}
      </Card>
    </>
  );
}

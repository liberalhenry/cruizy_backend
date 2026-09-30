/** Aktualisierung per Knopf (Issue #5, nur Owner). Ausgeführt vom Dienst „updater“ — mit Sicherung und Rückfall. */
import { useEffect, useState } from 'react';
import { Banner, Sheet, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction, tooShort } from './common';

const STATUS: Record<string, { text: string; cls: string }> = {
  angefordert: { text: 'angefordert — wartet auf den Updater', cls: 'text-warn' },
  laeuft: { text: 'läuft …', cls: 'text-akzent' },
  erfolgreich: { text: 'erfolgreich', cls: 'text-gut' },
  fehlgeschlagen: { text: 'fehlgeschlagen (nichts geändert)', cls: 'text-gefahr' },
  zurueckgerollt: { text: 'fehlgeschlagen — zurück auf den letzten stabilen Stand', cls: 'text-gefahr' },
  rueckfall_fehlgeschlagen: { text: 'fehlgeschlagen, Rückfall ebenfalls — bitte von Hand prüfen', cls: 'text-gefahr' },
  abgebrochen: { text: 'zurückgenommen', cls: 'muted' },
};

export function Aktualisierung() {
  const { data, reload } = useAsync(() => api.get('/mod-api/updates'), []);
  const [reason, setReason] = useState('');
  const [pick, setPick] = useState<any | null>(null);
  const [log, setLog] = useState<any | null>(null);
  const { run, box } = useAction();
  const busy = data?.runs?.some((r: any) => r.status === 'angefordert' || r.status === 'laeuft');

  // während eines Laufs regelmäßig nachsehen — die API startet dabei einmal neu
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => reload(), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  if (!data) return <p className="muted">…</p>;

  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Aktualisierung</h1>
      <p className="text-sm muted mb-4">
        Spielt ein Release aus <span className="font-mono">{data.repo}</span> ein: Sicherung → bauen → starten → prüfen. Scheitert ein Schritt, geht es automatisch zurück auf den letzten stabilen Stand;
        Fehler stehen im Protokoll des Laufs. Versionen nach Semantic Versioning (MAJOR.MINOR.PATCH).
      </p>
      {box}
      <Card title="Stand">
        <p className="text-sm">
          Installiert: <strong className="font-mono">{data.current}</strong>
          {data.latest && (
            <>
              {' '}
              · neuestes Release: <strong className="font-mono">{data.latest.version}</strong>
            </>
          )}
        </p>
        <p className="text-sm mt-1">
          Updater:{' '}
          {data.agent.online ? (
            <span className="text-gut">bereit</span>
          ) : (
            <span className="text-gefahr">nicht erreichbar{data.agent.lastSeenAt ? ` (zuletzt ${fmtDate(data.agent.lastSeenAt, true)})` : ''}</span>
          )}
        </p>
        {data.releaseError && (
          <div className="mt-2">
            <Banner kind="warn">Releases nicht abrufbar: {data.releaseError}</Banner>
          </div>
        )}
        {data.updateAvailable ? (
          <div className="mt-2">
            <Banner kind="info">Neue Version verfügbar: {data.latest.version}</Banner>
          </div>
        ) : (
          <p className="text-sm muted mt-2">Keine neuere Version.</p>
        )}
        <button className="btn-ghost px-0 mt-1" onClick={() => api.get('/mod-api/updates?neu=1').then(reload)}>
          Jetzt nach Releases suchen
        </button>
      </Card>

      <Card title="Releases">
        {!data.releases.length && <p className="text-sm muted">Keine Releases gefunden.</p>}
        {data.releases.map((r: any) => {
          const c: number = r.relation;
          return (
            <div key={r.tag} className="border-t border-linie py-2 text-sm flex items-start gap-3">
              <div className="flex-1">
                <p>
                  <span className="font-mono font-semibold">{r.version}</span> {r.prerelease && <span className="text-warn text-xs">Vorabversion</span>}{' '}
                  {c === 0 && <span className="text-gut text-xs">installiert</span>}
                  <span className="muted"> · {fmtDate(r.publishedAt)}</span>
                </p>
                {r.notes && (
                  <details className="mt-1">
                    <summary className="cursor-pointer muted">Änderungen</summary>
                    <pre className="whitespace-pre-wrap text-xs mt-1">{r.notes}</pre>
                  </details>
                )}
              </div>
              {c !== 0 && (
                <button className={c > 0 ? 'btn-primary' : 'btn-secondary'} disabled={busy || !data.agent.online} onClick={() => setPick(r)}>
                  {c > 0 ? 'Aktualisieren' : 'Zurück auf diese'}
                </button>
              )}
            </div>
          );
        })}
      </Card>

      <Card title="Läufe">
        {!data.runs.length && <p className="text-sm muted">Noch keine.</p>}
        <table className="w-full text-sm">
          <tbody>
            {data.runs.map((r: any) => (
              <tr key={r.id} className="border-t border-linie align-top">
                <td className="py-2 font-mono">
                  {r.fromVersion} → {r.targetVersion}
                </td>
                <td className={STATUS[r.status]?.cls}>{STATUS[r.status]?.text ?? r.status}</td>
                <td className="muted">
                  {r.requestedBy} · {fmtDate(r.requestedAt, true)}
                </td>
                <td>
                  {r.status === 'angefordert' && (
                    <button className="btn-ghost" onClick={() => run(() => api.post(`/mod-api/updates/${r.id}/cancel`), 'Zurückgenommen.').then(reload)}>
                      Zurücknehmen
                    </button>
                  )}
                  {(r.log || r.error) && (
                    <button className="btn-ghost" onClick={() => setLog(r)}>
                      Protokoll
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick ? `Auf ${pick.version} ${pick.relation > 0 ? 'aktualisieren' : 'zurückgehen'}` : ''}>
        {pick && (
          <div className="flex flex-col gap-3 text-sm">
            {pick.relation < 0 && (
              <Banner kind="warn">
                Das ist eine ältere Version. Datenbankänderungen der neueren Version bleiben bestehen (sie sind nur additiv); die Sicherung von vorher liegt in ./backups.
              </Banner>
            )}
            <p>Die App ist während des Neustarts kurz nicht erreichbar (meist unter einer Minute).</p>
            <Reason value={reason} onChange={setReason} min={5} />
            <button
              className="btn-primary"
              disabled={tooShort(reason, 5)}
              onClick={async () => {
                const r = await run(() => api.post('/mod-api/updates', { version: pick.version, reason }), 'Angefordert — der Updater beginnt in wenigen Sekunden.');
                if (r) {
                  setPick(null);
                  setReason('');
                  reload();
                }
              }}
            >
              Jetzt einspielen
            </button>
          </div>
        )}
      </Sheet>
      <Sheet open={!!log} onClose={() => setLog(null)} title={log ? `Lauf ${log.fromVersion} → ${log.targetVersion}` : ''}>
        {log && (
          <div className="text-xs">
            {log.error && (
              <div className="mb-2">
                <Banner kind="error">
                  <pre className="whitespace-pre-wrap">{log.error}</pre>
                </Banner>
              </div>
            )}
            <pre className="whitespace-pre-wrap font-mono bg-grund p-2 rounded-lg max-h-[60vh] overflow-auto">{log.log || '—'}</pre>
          </div>
        )}
      </Sheet>
    </>
  );
}

/**
 * Werkzeug · Cruizy Date (Issue #19): Überblick, Mitglieder mit Verifizierungsstatus,
 * Date-Zugang sperren/entsperren (nur Date), Date-Fotos prüfen, Date-Meldungen.
 */
import { useState } from 'react';
import { Sheet, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction, tooShort } from './common';

export function DateAdmin() {
  const [tab, setTab] = useState<'mitglieder' | 'fotos' | 'meldungen'>('mitglieder');
  const { data: ov, reload: reloadOv } = useAsync(() => api.get('/mod-api/date/overview'), []);
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Cruizy Date</h1>
      <p className="text-sm muted mb-4">
        Date-Sperren betreffen nur Date — das Hauptkonto bleibt. Verifizierung: gespeichert sind nur Ergebnis, Anbieter und Zeitpunkt (Art. 9 DSGVO).
      </p>
      {ov && (
        <Card>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {['onboarding', 'aktiv', 'pausiert', 'gesperrt'].map((k) => (
              <div key={k}>
                <p className="text-2xl font-bold">{ov.status[k] ?? 0}</p>
                <p className="muted">{k}</p>
              </div>
            ))}
            <div>
              <p className="text-2xl font-bold">{ov.photosQueued}</p>
              <p className="muted">Fotos in Prüfung</p>
            </div>
          </div>
          {ov.waitlist.length > 0 && <p className="text-xs muted mt-3">Warteliste: {ov.waitlist.map((w: any) => `${w.city} (${w.n})`).join(' · ')}</p>}
        </Card>
      )}
      <div className="flex gap-2 mb-3">
        {(['mitglieder', 'fotos', 'meldungen'] as const).map((k) => (
          <button key={k} className={`chip ${tab === k ? 'border-akzent text-akzent' : ''}`} onClick={() => setTab(k)}>
            {k === 'fotos' ? `Fotos (${ov?.photosQueued ?? 0})` : k === 'meldungen' ? `Date-Meldungen (${ov?.reportsOpen ?? 0})` : 'Mitglieder'}
          </button>
        ))}
      </div>
      {tab === 'mitglieder' && <Mitglieder onChange={reloadOv} />}
      {tab === 'fotos' && <Fotos onChange={reloadOv} />}
      {tab === 'meldungen' && <Meldungen />}
    </>
  );
}

function Mitglieder({ onChange }: { onChange: () => void }) {
  const [status, setStatus] = useState<'aktiv' | 'onboarding' | 'pausiert' | 'gesperrt'>('aktiv');
  const { data, reload } = useAsync(() => api.get(`/mod-api/date/members?status=${status}`), [status]);
  const [open, setOpen] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const act = async (what: 'suspend' | 'unsuspend') => {
    const r = await run(() => api.post(`/mod-api/date/members/${open.id}/${what}`, { reason }), 'Gespeichert.');
    if (r) {
      setOpen(null);
      setReason('');
      reload();
      onChange();
    }
  };
  return (
    <>
      {box}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(['aktiv', 'onboarding', 'pausiert', 'gesperrt'] as const).map((s) => (
          <button key={s} className={`chip ${status === s ? 'border-akzent text-akzent' : ''}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>
      <Card>
        {!data?.items.length && <p className="muted text-sm">Niemand.</p>}
        {data?.items.map((m: any) => (
          <button key={m.id} className="w-full text-left border-t border-linie first:border-t-0 py-2 text-sm hover:bg-flaeche2" onClick={() => setOpen(m)}>
            <span className="block">
              <b>{m.name}</b> · {m.verification.at ? `verifiziert (${m.verification.provider})` : `nicht verifiziert${m.verification.result ? ` – ${m.verification.result}` : ''}`}
            </span>
            <span className="block text-xs muted">
              seit {fmtDate(m.since)} · zuletzt aktiv {fmtDate(m.lastActive)} · Date-Meldungen {m.reports} (berechtigt {m.upheld})
              {m.suspended ? ` · gesperrt: ${m.suspended.reason}` : ''}
            </span>
          </button>
        ))}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Status <b>{open.status}</b> · Verifizierung: {open.verification.at ? `${fmtDate(open.verification.at, true)} (${open.verification.provider}, ${open.verification.result})` : open.verification.result ?? 'noch nicht'}
            </p>
            <p className="muted">Konto-ID: {open.id}</p>
            <MemberPhotos id={open.id} />
            <Reason value={reason} onChange={setReason} min={5} />
            {open.status === 'gesperrt' ? (
              <button className="btn-primary" disabled={tooShort(reason, 5)} onClick={() => act('unsuspend')}>
                Date-Zugang entsperren
              </button>
            ) : (
              <button className="btn-danger" disabled={tooShort(reason, 5)} onClick={() => act('suspend')}>
                Date-Zugang sperren (nur Date)
              </button>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

/** Issue #33: alle Date-Fotos eines Mitglieds mit Prüfstatus. */
function MemberPhotos({ id }: { id: string }) {
  const { data } = useAsync(() => api.get(`/mod-api/date/members/${id}/photos`), [id]);
  if (!data) return null;
  if (!data.items.length) return <p className="muted text-xs">Keine Date-Fotos.</p>;
  return (
    <div className="grid grid-cols-3 gap-2">
      {data.items.map((ph: any) => (
        <figure key={ph.id} className="flex flex-col gap-1">
          <img src={ph.image} alt="" className="w-full aspect-[4/5] object-cover rounded" />
          <figcaption className="text-xs muted">{ph.status === 'approved' ? 'freigegeben' : 'in Prüfung'}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Fotos({ onChange }: { onChange: () => void }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/date/photos'), []);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const decide = async (id: string, decision: 'freigeben' | 'ablehnen') => {
    const r = await run(() => api.post(`/mod-api/date/photos/${id}/decide`, { decision, reason }), decision === 'freigeben' ? 'Freigegeben.' : 'Abgelehnt.');
    if (r) {
      reload();
      onChange();
    }
  };
  return (
    <>
      {box}
      <p className="text-sm muted mb-2">Date-Fotos sind immer jugendfrei. Das erste Foto muss ein erkennbares Gesicht zeigen.</p>
      <Reason value={reason} onChange={setReason} min={3} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {!data?.items.length && <p className="muted text-sm">Nichts offen.</p>}
        {data?.items.map((ph: any) => (
          <div key={ph.id} className="card p-2 flex flex-col gap-2">
            <img src={ph.image} alt="" className="w-full aspect-[4/5] object-cover rounded" />
            <p className="text-xs muted">
              {ph.name ?? '—'}
              {ph.position === 0 ? ' · erstes Foto (Gesicht)' : ''} · {fmtDate(ph.at, true)}
            </p>
            <div className="flex gap-1">
              <button className="btn-primary flex-1 text-xs" disabled={tooShort(reason, 3)} onClick={() => decide(ph.id, 'freigeben')}>
                Frei
              </button>
              <button className="btn-danger flex-1 text-xs" disabled={tooShort(reason, 3)} onClick={() => decide(ph.id, 'ablehnen')}>
                Ablehnen
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Meldungen() {
  const { data } = useAsync(() => api.get('/mod-api/date/reports'), []);
  return (
    <Card title="Meldungen „Sucht nur Hookups / passt nicht zu Date“">
      <p className="text-sm muted mb-2">Entschieden wird im Bereich „Meldungen“. Die Entscheidung „Date-Verstoß“ zählt zur Date-Sperre (Schwellenwert P-DATE-MELDUNGEN-SPERRE).</p>
      {!data?.items.length && <p className="muted text-sm">Keine.</p>}
      {data?.items.map((r: any) => (
        <div key={r.id} className="border-t border-linie py-2 text-sm">
          {r.number} · {fmtDate(r.at, true)} · {r.target?.name ?? '—'} · {r.status}
          {r.decision ? ` · ${r.decision}` : ''}
        </div>
      ))}
    </Card>
  );
}

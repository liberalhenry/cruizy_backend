/**
 * Werkzeug · Veranstalter und Veranstaltungen (Issue #16).
 *  * Anträge auf Verifizierung prüfen (Kontaktdaten öffnen = protokolliert), verifizieren, ablehnen, entziehen.
 *  * Einreichungen ohne Verifizierung im Einzelfall freigeben — mit Prüfliste, Ampel und Bildern.
 *  * Veröffentlichte Veranstaltungen verifizierter Veranstalter gegenprüfen, Bilder entfernen, absagen.
 *  * „Empfohlen“ nur für eigene Veranstaltungen von Cruizy — keine bezahlte Hervorhebung.
 */
import { useState } from 'react';
import { Sheet, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction, tooShort } from './common';

export const CHECKS = [
  ['ampel', 'Ampel eingehalten'],
  ['keinePrivatadresse', 'keine Privatadresse öffentlich (Text, Bilder, Stecknadel)'],
  ['ab18', 'ab 18 genannt bzw. erkennbar'],
  ['keinVersprechen', 'kein unhaltbares Versprechen'],
  ['anbieter', 'bei gewerblich: Anbieterangaben vollständig'],
] as const;
const allChecks = () => Object.fromEntries(CHECKS.map(([k]) => [k, true]));

const KIND: Record<string, string> = {
  bar: 'Bar/Kneipe',
  club: 'Club',
  restaurant: 'Restaurant/Café',
  konzerthaus: 'Konzert-/Veranstaltungshaus',
  sauna: 'Sauna',
  kollektiv: 'Kollektiv/Partyreihe',
  verein: 'Verein/Initiative',
  agentur: 'Agentur/Veranstalter',
  privat: 'Privatperson',
};

// ─────────────────────────── Veranstalter ───────────────────────────

export function Veranstalter() {
  const [status, setStatus] = useState<'beantragt' | 'verifiziert' | 'abgelehnt' | 'entzogen'>('beantragt');
  const { data, reload } = useAsync(() => api.get(`/mod-api/organizers?status=${status}`), [status]);
  const [open, setOpen] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const { run, box } = useAction();
  const show = async (id: string) => {
    const r = await run(() => api.post(`/mod-api/organizers/${id}/open`));
    if (r) {
      setOpen(r);
      setReason('');
      setMessage('');
    }
  };
  const decide = async (decision: 'verifizieren' | 'ablehnen' | 'entziehen') => {
    const r = await run(() => api.post(`/mod-api/organizers/${open.id}/decide`, { decision, reason, message: message.trim() || undefined }), 'Gespeichert.');
    if (r) {
      setOpen(null);
      reload();
    }
  };
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Veranstalter</h1>
      <p className="text-sm muted mb-4">
        Verifizierte Veranstalter veröffentlichen ohne Wartezeit. Prüfen: Website/Impressum, Mail-Domain, ggf. Rückfrage per Mail. Kontaktdaten zu öffnen wird protokolliert.
      </p>
      {box}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(['beantragt', 'verifiziert', 'abgelehnt', 'entzogen'] as const).map((s) => (
          <button key={s} className={`chip ${status === s ? 'border-akzent text-akzent' : ''}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>
      <Card>
        {!data?.items.length && <p className="muted text-sm">Nichts hier.</p>}
        {data?.items.map((o: any) => (
          <div key={o.id} className="border-t border-linie first:border-t-0 py-2 text-sm flex items-center gap-2">
            <span className="flex-1">
              <b>{o.name}</b> · {KIND[o.kind] ?? o.kind} · {o.city}
              {o.website && (
                <>
                  {' · '}
                  <a className="text-akzent underline" href={o.website} target="_blank" rel="noreferrer noopener">
                    {o.website}
                  </a>
                </>
              )}
              <span className="block text-xs muted">
                seit {fmtDate(o.createdAt)} · {o.events} Veranstaltungen{o.team ? ' · Cruizy selbst' : ''}
              </span>
            </span>
            {!o.team && (
              <button className="btn-ghost" onClick={() => show(o.id)}>
                Öffnen
              </button>
            )}
          </div>
        ))}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              {KIND[open.kind] ?? open.kind} · {open.city} · Status: <b>{open.status}</b>
            </p>
            <p>
              Mail: <span className="font-mono">{open.email}</span>
            </p>
            {open.website && (
              <p>
                Website:{' '}
                <a className="text-akzent underline" href={open.website} target="_blank" rel="noreferrer noopener">
                  {open.website}
                </a>
              </p>
            )}
            {open.note && <pre className="card p-2 whitespace-pre-wrap text-xs">{open.note}</pre>}
            <input className="input" placeholder="Nachricht an das Konto (freiwillig, erscheint in der Mitteilung)" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Reason value={reason} onChange={setReason} min={3} />
            <div className="flex gap-2 flex-wrap">
              {open.status === 'beantragt' && (
                <>
                  <button className="btn-primary" disabled={tooShort(reason, 3)} onClick={() => decide('verifizieren')}>
                    Verifizieren
                  </button>
                  <button className="btn-secondary" disabled={tooShort(reason, 3)} onClick={() => decide('ablehnen')}>
                    Ablehnen
                  </button>
                </>
              )}
              {open.status === 'verifiziert' && (
                <button className="btn-danger" disabled={tooShort(reason, 3)} onClick={() => decide('entziehen')}>
                  Verifizierung entziehen
                </button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── Detail einer Veranstaltung ───────────────────────────

export function EventDetail({ id, onDone }: { id: string; onDone: () => void }) {
  const { data, reload } = useAsync(() => api.get(`/mod-api/events/${id}`), [id]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [ampel, setAmpel] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const { run, box } = useAction();
  if (!data) return <p className="muted">Lädt …</p>;
  const a = ampel ?? data.ampel;
  const all = CHECKS.every(([k]) => checks[k]);
  const ok = reason.trim().length >= 3;
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    const r = await run(fn, msg);
    if (r) {
      reload();
      onDone();
    }
  };
  return (
    <div className="flex flex-col gap-2 text-sm">
      {box}
      <p>
        <b>{data.status}</b> · {data.source} · {data.organizer ? `${data.organizer.name} (${data.organizer.status})` : data.fromMember ? 'Einreichung eines Mitglieds' : 'redaktionell'}
        {data.checked ? ' · geprüft' : ' · ungeprüft'}
        {data.featured ? ' · ★ empfohlen' : ''}
      </p>
      <p>
        {fmtDate(data.startsAt, true)} – {fmtDate(data.endsAt, true)} · {data.area}
      </p>
      <p>
        Adresse: {data.address ?? '—'} · {data.locationPublic ? 'öffentlich (genauer Punkt)' : 'privat (nur ungefähr, Adresse nur für Gäste)'}
      </p>
      <p>
        Kategorien: {data.categories.join(', ') || '—'} · Plätze: {data.capacity ?? '—'} · belegt {data.accepted} · angefragt {data.requested}
        {data.approvalRequired ? ' · Annahme durch Veranstalter' : ''} · Absagefrist {data.cancelUntilHours} Std.
      </p>
      {(data.price || data.dressCode) && (
        <p>
          {data.price} {data.dressCode ? `· Dresscode: ${data.dressCode}` : ''}
        </p>
      )}
      <pre className="card p-2 whitespace-pre-wrap text-xs max-h-60 overflow-auto">{data.description || '(keine Beschreibung)'}</pre>
      {data.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {data.images.map((im: any) => (
            <div key={im.id} className="relative">
              <img src={im.url} alt="" className="w-full aspect-[3/2] object-cover rounded" />
              <button
                className="absolute top-1 right-1 btn-danger px-2 py-0 min-h-0 text-xs"
                disabled={!ok}
                onClick={() => act(() => api.del(`/mod-api/events/${id}/images/${im.id}?reason=${encodeURIComponent(reason)}`), 'Bild entfernt.')}
              >
                Entfernen
              </button>
            </div>
          ))}
        </div>
      )}
      <select className="input" value={a} onChange={(e) => setAmpel(e.target.value)} aria-label="Ampel">
        <option value="gruen">Ampel grün</option>
        <option value="gelb">Ampel gelb</option>
        <option value="rot">Ampel rot (nur Konten mit Altersprüfung)</option>
      </select>
      {CHECKS.map(([k, l]) => (
        <label key={k} className="flex items-center gap-2">
          <input type="checkbox" checked={!!checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} /> {l}
        </label>
      ))}
      {data.status === 'pending' && <input className="input" placeholder="Nachricht an die einreichende Person (bei Ablehnung)" value={message} onChange={(e) => setMessage(e.target.value)} />}
      <Reason value={reason} onChange={setReason} min={3} />
      <div className="flex gap-2 flex-wrap">
        {data.status === 'pending' && (
          <>
            <button className="btn-primary" disabled={!ok || !all} onClick={() => act(() => api.post(`/mod-api/events/${id}/decide`, { decision: 'freigeben', reason, ampel: a, checklist: allChecks() }), 'Freigegeben.')}>
              Freigeben
            </button>
            <button className="btn-secondary" disabled={!ok} onClick={() => act(() => api.post(`/mod-api/events/${id}/decide`, { decision: 'ablehnen', reason, message: message.trim() || undefined }), 'Abgelehnt.')}>
              Ablehnen
            </button>
          </>
        )}
        {data.status === 'approved' && (
          <>
            {!data.checked && (
              <button className="btn-primary" disabled={!ok || !all} onClick={() => act(() => api.post(`/mod-api/events/${id}/check`, { reason, ampel: a, checklist: allChecks() }), 'Als geprüft markiert.')}>
                Geprüft
              </button>
            )}
            {data.source === 'cruizy' && (
              <button className="btn-secondary" disabled={!ok} onClick={() => act(() => api.post(`/mod-api/events/${id}/feature`, { featured: !data.featured, reason }), 'Gespeichert.')}>
                {data.featured ? 'Nicht mehr empfehlen' : '★ Empfehlen'}
              </button>
            )}
            <button className="btn-danger" disabled={!ok} onClick={() => act(() => api.post(`/mod-api/events/${id}/cancel`, { reason, note: message.trim() || undefined }), 'Abgesagt.')}>
              Absagen
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── Gegenprüfung ───────────────────────────

export function VeranstaltungenPruefen() {
  const [filter, setFilter] = useState<'ungeprueft' | 'kommend' | 'empfohlen' | 'abgesagt'>('ungeprueft');
  const { data, reload } = useAsync(() => api.get(`/mod-api/events?filter=${filter}`), [filter]);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Veranstaltungen</h1>
      <p className="text-sm muted mb-4">Veranstaltungen verifizierter Veranstalter sind sofort sichtbar — hier prüft das Team nach. Nach jeder Änderung oder neuem Bild erscheinen sie wieder als ungeprüft.</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {(['ungeprueft', 'kommend', 'empfohlen', 'abgesagt'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'border-akzent text-akzent' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <Card>
        {!data?.items.length && <p className="muted text-sm">Nichts hier.</p>}
        {data?.items.map((e: any) => (
          <button key={e.id} className="w-full text-left border-t border-linie first:border-t-0 py-2 text-sm hover:bg-flaeche2" onClick={() => setOpen(e.id)}>
            <span className="block">
              {e.featured ? '★ ' : ''}
              <b>{e.title}</b> · {fmtDate(e.startsAt, true)} · {e.area ?? '—'}
            </span>
            <span className="block text-xs muted">
              {e.organizer ?? e.source} · Ampel {e.ampel} · {e.accepted}
              {e.capacity ? `/${e.capacity}` : ''} dabei · {e.categories.join(', ')}
              {e.changedAfterCheck ? ' · geändert' : ''}
            </span>
          </button>
        ))}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Veranstaltung">
        {open && <EventDetail id={open} onDone={reload} />}
      </Sheet>
    </>
  );
}

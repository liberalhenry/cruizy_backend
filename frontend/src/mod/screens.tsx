/** Bildschirme des Moderationswerkzeugs M00–M90. Jede 📋-Handlung verlangt eine Begründung. */
import { useEffect, useState, type ReactNode } from 'react';
import { Banner, Sheet, TextArea, Toggle, useAsync } from '../components/ui';
import { api, errText } from '../lib/api';
import { fmtDate, t } from '../lib/texts';
import { Card, Reason, useAction } from './common';
import { MeinZugang, Team } from './team';

export interface Staff {
  staff: { id: string; name: string; role: 'MOD' | 'BETRIEB'; founder: boolean };
  others: { id: string; name: string; role: string }[];
  hashToday: number;
  hashLimit: number;
  hashLocked: boolean;
  mode: 'test' | 'live';
}

type Screen = 'uebersicht' | 'warteschlange' | 'meldungen' | 'hash' | 'freigaben' | 'sperren' | 'widerspruch' | 'protokoll' | 'orte' | 'einreichungen' | 'art18' | 'vorgaenge' | 'verwaltung' | 'team' | 'zugang';

const NAV: { key: Screen; label: string; betrieb?: boolean; owner?: boolean }[] = [
  { key: 'uebersicht', label: 'Tagesübersicht' },
  { key: 'warteschlange', label: 'Warteschlange Zone 1' },
  { key: 'meldungen', label: 'Meldungen' },
  { key: 'hash', label: 'Hash-Treffer' },
  { key: 'freigaben', label: 'Zweite Person' },
  { key: 'sperren', label: 'Sperren' },
  { key: 'widerspruch', label: 'Einspruch/Widerspruch' },
  { key: 'vorgaenge', label: 'Kontaktservice' },
  { key: 'orte', label: 'Orte' },
  { key: 'einreichungen', label: 'Freigabe Termine' },
  { key: 'art18', label: 'Art. 18 DSA' },
  { key: 'protokoll', label: 'Zugriffsprotokoll' },
  { key: 'verwaltung', label: 'Verwaltung', betrieb: true },
  { key: 'team', label: 'Team', owner: true },
  { key: 'zugang', label: 'Mein Zugang' },
];

function Ampel({ v }: { v: string }) {
  const c = v === 'rot' ? 'bg-gefahr' : v === 'gelb' ? 'bg-warn' : 'bg-gut';
  return <span className={`inline-block w-3 h-3 rounded-full ${c}`} aria-label={`Ampel ${v}`} />;
}

const EMERGENCY = (
  <p className="text-xs muted">
    {t('UI-MOD-NOTFALL-1')} · {t('UI-MOD-NOTFALL-2')}
  </p>
);

export function Screens({ me, onLogout, reloadMe }: { me: Staff; onLogout: () => void; reloadMe: () => void }) {
  const [screen, setScreen] = useState<Screen>('uebersicht');
  const isBetrieb = me.staff.role === 'BETRIEB';
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:min-h-screen bg-flaeche border-b md:border-b-0 md:border-r border-linie">
        <div className="p-4 border-b border-linie">
          <p className="font-semibold">{me.staff.name}</p>
          <p className="text-xs muted">
            {me.staff.role}
            {me.staff.founder ? ' · Owner' : ''}
          </p>
          {me.mode === 'test' && <p className="text-xs text-warn mt-1">Testbetrieb — nur erfundene Daten</p>}
        </div>
        <nav className="flex md:flex-col overflow-x-auto">
          {NAV.filter((n) => (!n.betrieb || isBetrieb) && (!n.owner || me.staff.founder)).map((n) => (
            <button key={n.key} className={`text-left px-4 py-2.5 text-sm whitespace-nowrap ${screen === n.key ? 'bg-flaeche2 text-akzent' : ''}`} onClick={() => setScreen(n.key)}>
              {n.label}
            </button>
          ))}
          <button className="text-left px-4 py-2.5 text-sm muted" onClick={onLogout}>
            Abmelden
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 max-w-5xl">
        {screen === 'uebersicht' && <Uebersicht me={me} go={setScreen} />}
        {screen === 'warteschlange' && <Warteschlange />}
        {screen === 'meldungen' && <Meldungen />}
        {screen === 'hash' && <Hash me={me} reloadMe={reloadMe} />}
        {screen === 'freigaben' && <Freigaben />}
        {screen === 'sperren' && <Sperren />}
        {screen === 'widerspruch' && <Widerspruch />}
        {screen === 'protokoll' && <Protokoll isBetrieb={isBetrieb} />}
        {screen === 'orte' && <Orte />}
        {screen === 'einreichungen' && <Einreichungen />}
        {screen === 'art18' && <Art18 isBetrieb={isBetrieb} />}
        {screen === 'vorgaenge' && <Vorgaenge />}
        {screen === 'verwaltung' && isBetrieb && <Verwaltung />}
        {screen === 'team' && me.staff.founder && <Team meId={me.staff.id} />}
        {screen === 'zugang' && <MeinZugang />}
      </main>
    </div>
  );
}

// ─────────────────────────── M90 · Tagesübersicht ───────────────────────────

function Uebersicht({ me, go }: { me: Staff; go: (s: Screen) => void }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/overview'), []);
  const { run, box } = useAction();
  if (!data) return <p className="muted">…</p>;
  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Tagesübersicht</h1>
      {box}
      {data.redDay && (
        <div className="mb-3">
          <Banner kind="error">Es gibt rote Fristen. Ein Tag mit einer roten Frist ist kein normaler Tag.</Banner>
        </div>
      )}
      {data.stopExpansion && (
        <div className="mb-3">
          <Banner kind="warn">Moderationsfristen zwei Monate in Folge gerissen — Abbruchkriterium: Expansion stoppen, bevor jemand zusammenbricht.</Banner>
        </div>
      )}
      {data.offerHandover && (
        <div className="mb-3">
          <Banner kind="warn">Alle sind heute an der Tagesgrenze. Offene Hash-Fälle bleiben offen; die Übergabe an die FSM-Beschwerdestelle ist möglich.</Banner>
        </div>
      )}
      {!data.contactPerson && (
        <div className="mb-3">
          <Banner kind="warn">Keine Ansprechperson hinterlegt — ohne sie lässt sich der Hash-Abgleich nicht einschalten (M90.06).</Banner>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Card title="Hash-Fälle heute">
          <p className="text-2xl">
            {data.me.hashToday} von {data.me.hashLimit}
          </p>
          <p className="text-sm muted">{data.me.hashLocked ? 'Ab 21 Uhr keine neuen Hash-Fälle.' : 'Tagesgrenze und Uhrzeitsperre sind nicht einstellbar.'}</p>
          {data.counters
            .filter((c: any) => !c.own)
            .map((c: any) => (
              <p key={c.name} className="text-sm">
                {c.name}: {c.hashToday} von {data.me.hashLimit}
              </p>
            ))}
        </Card>
        <Card title="Offen">
          <ul className="text-sm flex flex-col gap-1">
            <li>
              <button className="underline" onClick={() => go('warteschlange')}>
                Warteschlange: {data.queue.open}
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('meldungen')}>
                Meldungen: {data.reports.open} (rot {data.reports.red}, Vorrang {data.reports.priority})
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('hash')}>
                Hash-Fälle: {data.hashCases.open} (dringend {data.hashCases.urgent})
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('widerspruch')}>
                Einsprüche: {data.appeals.open} (rot {data.appeals.red})
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('freigaben')}>
                Freigaben für dich: {data.approvalsToGive + data.suspensionsToApprove}
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('orte')}>
                Beanspruchungen: {data.claims}
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('einreichungen')}>
                Einreichungen: {data.submissions}
              </button>
            </li>
            <li>
              <button className="underline" onClick={() => go('art18')}>
                Art.-18-Entwürfe: {data.art18Drafts}
              </button>
            </li>
          </ul>
        </Card>
        <Card title="Kontaktservice">
          {data.dangerTickets > 0 && <p className="text-gefahr font-semibold mb-2">Jemand ist in Gefahr: {data.dangerTickets}</p>}
          <ul className="text-sm">
            {data.pots.map((p: any) => (
              <li key={p.pot}>
                {p.pot}: {p.open} offen · rot {p.red}
                {p.oldest ? ` · ältester ${fmtDate(p.oldest)}` : ''}
              </li>
            ))}
          </ul>
          <button className="btn-ghost px-0" onClick={() => go('vorgaenge')}>
            Zu den Vorgängen
          </button>
        </Card>
      </div>
      {data.quarterReview && (
        <Card title={`Quartalsdurchsicht ${data.quarterReview.quarter}`}>
          <ul className="text-sm mb-2">
            {data.quarterReview.perPerson.map((p: any) => (
              <li key={p.name}>
                {p.name}: {p.cases} Fälle · {p.special} besondere Einträge · {p.hash_cases} Hash-Fälle
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Gerissene Fristen: {data.quarterReview.missedDeadlines} · Vermerke „Fehler bei uns“: {data.quarterReview.ourErrors}
          </p>
          <button className="btn-secondary mt-2" onClick={() => run(() => api.post('/mod-api/overview/quarter/ack')).then(reload)}>
            Gelesen und quittiert
          </button>
        </Card>
      )}
      {data.weeklySummary && (
        <Card title={`Wochenzusammenfassung · ${fmtDate(data.weeklySummary.at, true)}`}>
          <pre className="text-xs whitespace-pre-wrap">{data.weeklySummary.text}</pre>
        </Card>
      )}
      <Card title="Ansprechperson und Notfall">
        {data.contactPerson ? (
          <p>
            {data.contactPerson.name} · {data.contactPerson.phone}
          </p>
        ) : (
          <p className="muted">nicht hinterlegt</p>
        )}
        {EMERGENCY}
      </Card>
      <p className="text-xs muted">Angemeldet als {me.staff.name}. Es gibt keine Leistungsstatistik je Person.</p>
    </>
  );
}

// ─────────────────────────── M10 · Warteschlange ───────────────────────────

function Warteschlange() {
  const { data, reload } = useAsync(() => api.get('/mod-api/queue'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [reason, setReason] = useState('Prüfung Graubereich Zone 1');
  const [decision, setDecision] = useState<string>('freigeben');
  const [rejectReason, setRejectReason] = useState('ST-FEH-13');
  const [freeText, setFreeText] = useState('');
  const [decReason, setDecReason] = useState('');
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Warteschlange Zone 1</h1>
      <p className="text-sm muted mb-4">Nur öffentliche Profilbilder. Reihenfolge nach Alter. Zurücklegen ist ausdrücklich erwünscht.</p>
      {box}
      <table className="w-full text-sm mb-4">
        <thead className="text-left muted">
          <tr>
            <th className="py-1">Ampel</th>
            <th>Eingang</th>
            <th>Einschätzung</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.items.map((i: any) => (
            <tr key={i.id} className="border-t border-linie">
              <td className="py-2">
                <Ampel v={i.ampel} />
              </td>
              <td>{fmtDate(i.queuedAt, true)}</td>
              <td>
                {i.band}
                {i.score !== undefined && i.score !== null ? ` (${Number(i.score).toFixed(2)})` : ''}
              </td>
              <td>
                <button className="btn-ghost" onClick={async () => setOpen(await run(() => api.post(`/mod-api/queue/${i.id}/open`, { reason })))}>
                  Öffnen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data?.items.length && <p className="muted">Nichts in der Warteschlange.</p>}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Bild prüfen">
        {open && (
          <div className="flex flex-col gap-3">
            <img src={open.image} alt="" className="max-h-[50vh] object-contain rounded-lg bg-flaeche2" />
            <p className="text-sm muted">
              Konto seit {open.accountAgeDays} Tagen · frühere Entscheidungen: {open.priorDecisions.approved} frei, {open.priorDecisions.rejected} abgelehnt · Meldungen: {open.reports}
              {open.blurredChoice ? ' · als unkenntlich gewählt' : ''}
            </p>
            <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="freigeben">Freigeben</option>
              <option value="ablehnen">Ablehnen</option>
              <option value="hochstufen">Hochstufen (Meldefall)</option>
              <option value="zuruecklegen">Zurücklegen (zweite Person)</option>
            </select>
            {decision === 'ablehnen' && (
              <>
                <select className="input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                  {data?.reasons.map((r: string) => (
                    <option key={r} value={r}>
                      {t(r)}
                    </option>
                  ))}
                </select>
                <TextArea label="Zusatz für die Person (freiwillig)" value={freeText} onChange={(e) => setFreeText(e.target.value)} />
              </>
            )}
            <Reason value={decReason} onChange={setDecReason} />
            <button
              className="btn-primary"
              disabled={!decReason.trim()}
              onClick={async () => {
                const r = await run(() => api.post(`/mod-api/queue/${open.id}/decide`, { decision, reason: decReason, rejectReason: decision === 'ablehnen' ? rejectReason : undefined, freeText: freeText || undefined }), 'Entschieden.');
                if (r) {
                  setOpen(null);
                  setDecReason('');
                  reload();
                }
              }}
            >
              Entscheiden
            </button>
          </div>
        )}
      </Sheet>
      <div className="hidden">
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </>
  );
}

// ─────────────────────────── M20 · Meldungen ───────────────────────────

function Meldungen() {
  const { data, reload } = useAsync(() => api.get('/mod-api/reports'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [openReason, setOpenReason] = useState('');
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [ctxReason, setCtxReason] = useState('');
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<any | null>(null);
  const [decision, setDecision] = useState('bleibt');
  const [decReason, setDecReason] = useState('');
  const [vault, setVault] = useState<any | null>(null);
  const { run, box } = useAction();

  const openReport = async (r: any) => {
    const reason = openReason.trim() || `Prüfung Meldung: ${r.reason}`;
    const res = await run(() => api.post(`/mod-api/reports/${r.id}/open`, { reason }));
    if (res) {
      setOpen(res);
      setReveal({});
      setCtx(null);
      setApprovalId(null);
      setVault(null);
    }
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Meldungen (Zone 3)</h1>
      <p className="text-sm muted mb-4">Nur die markierten Inhalte. Mehrere Meldungen zum selben Konto werden gebündelt gezeigt, nie automatisch zu einer Sperre aufaddiert.</p>
      {box}
      <input className="input mb-3" placeholder="Grund zum Öffnen (sonst Meldegrund)" value={openReason} onChange={(e) => setOpenReason(e.target.value)} />
      <table className="w-full text-sm">
        <thead className="text-left muted">
          <tr>
            <th className="py-1">Ampel</th>
            <th>Nummer</th>
            <th>Grund</th>
            <th>Frist</th>
            <th>Bündel</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.items.map((r: any) => (
            <tr key={r.id} className="border-t border-linie">
              <td className="py-2">
                <Ampel v={r.ampel} /> {r.priority && <span className="text-gefahr text-xs">Vorrang</span>}
              </td>
              <td>
                {r.number}
                {r.fromWeb ? ' · Web' : ''}
                {r.vault ? ' · Nachlauf' : ''}
              </td>
              <td>{r.reason}</td>
              <td>{fmtDate(r.deadlineAt, true)}</td>
              <td>{r.sameTargetOpen > 1 ? `${r.sameTargetOpen} offen` : ''}</td>
              <td>
                <button className="btn-ghost" onClick={() => openReport(r)}>
                  Öffnen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.report?.number}>
        {open && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Grund: <strong>{open.report.reason}</strong> · Kontext: {open.report.context} · Frist: {fmtDate(open.report.deadlineAt, true)}
            </p>
            {open.report.description && <p className="card p-3 text-sm whitespace-pre-wrap">{open.report.description}</p>}
            <p className="text-sm muted">
              Meldende Person: {open.reporter.web ? 'ohne Konto' : `${open.reporter.earlierReports} frühere Meldungen, davon ${open.reporter.withoutViolation} ohne Verstoß`}
            </p>
            <p className="text-sm muted">
              Gemeldetes Konto:{' '}
              {open.target.gone ? 'nicht mehr vorhanden' : `seit ${open.target.accountAgeDays} Tagen · Zustand ${open.target.state} · frühere Entscheidungen ${open.target.priorDecisions} · offene Fälle ${open.target.openCases}`}
            </p>
            <h3 className="font-semibold">Markierte Inhalte</h3>
            {open.items.length === 0 && <p className="text-sm muted">keine</p>}
            {open.items.map((it: any) => (
              <div key={it.id} className="card p-3 text-sm">
                <p className="muted mb-1">{it.kind}</p>
                {it.content?.text && <p className="whitespace-pre-wrap">{it.content.text}</p>}
                {it.content?.name && <p>Name: {it.content.name}</p>}
                {it.image &&
                  (reveal[it.id] ? (
                    <img src={it.image} alt="" className="max-h-80 object-contain mt-2" />
                  ) : (
                    <button className="btn-secondary mt-2" onClick={() => setReveal({ ...reveal, [it.id]: true })}>
                      Bild scharf anzeigen (bewusster Tipp)
                    </button>
                  ))}
              </div>
            ))}
            <Card title="Kontext ausklappen (zweite Person)">
              {!approvalId ? (
                <>
                  <Reason value={ctxReason} onChange={setCtxReason} min={5} />
                  <button
                    className="btn-secondary"
                    disabled={ctxReason.trim().length < 5}
                    onClick={async () => {
                      const r: any = await run(() => api.post(`/mod-api/reports/${open.report.id}/context/request`, { reason: ctxReason }), 'Freigabe beantragt. Die zweite Person muss zustimmen.');
                      if (r) setApprovalId(r.approvalId);
                    }}
                  >
                    Freigabe beantragen
                  </button>
                </>
              ) : (
                <button className="btn-secondary" onClick={async () => setCtx(await run(() => api.post(`/mod-api/reports/${open.report.id}/context`, { approvalId, reason: ctxReason })))}>
                  Kontext öffnen (nach Freigabe)
                </button>
              )}
              {ctx?.context?.map((c: any, i: number) => (
                <div key={i} className="mt-2 text-sm">
                  {c.around.map((m: any, j: number) => (
                    <p key={j}>
                      <span className="muted">{fmtDate(m.at, true)}:</span> {m.text}
                    </p>
                  ))}
                </div>
              ))}
            </Card>
            {open.report.vault && (
              <Card title="Nachlauf-Ablage (FV-97)">
                <button className="btn-secondary" onClick={async () => setVault(await run(() => api.post(`/mod-api/reports/${open.report.id}/vault`, { reason: 'Meldung zu gelöschtem Gespräch prüfen' })))}>
                  Ablage öffnen
                </button>
                {vault?.entries?.map((v: any) => (
                  <div key={v.id} className="mt-2 card p-2 text-sm">
                    {v.messages.map((m: any, i: number) => (
                      <p key={i}>
                        {m.from}: {m.text ?? (m.image ? '[Bild]' : '')}
                      </p>
                    ))}
                    <button className="btn-ghost px-0" onClick={() => run(() => api.post(`/mod-api/reports/${open.report.id}/vault/${v.id}/attach`, { reason: 'In den Fall übernommen' }), 'Übernommen.')}>
                      In den Fall übernehmen
                    </button>
                  </div>
                ))}
              </Card>
            )}
            <Card title="Entscheidung">
              <select className="input mb-2" value={decision} onChange={(e) => setDecision(e.target.value)}>
                <option value="bleibt">Kein Verstoß</option>
                <option value="inhalt_entfernt">Inhalt entfernen</option>
                <option value="eingeschraenkt">Einschränken (Antrag, zweite Person)</option>
                <option value="gesperrt">Sperren (Antrag, zweite Person)</option>
                <option value="an_behoerde">An Behörde (Art. 18 vorbereiten)</option>
              </select>
              <Reason value={decReason} onChange={setDecReason} label="Begründung — geht wörtlich an die Beteiligten" min={10} />
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-primary"
                  disabled={decReason.trim().length < 10}
                  onClick={async () => {
                    const r = await run(() => api.post(`/mod-api/reports/${open.report.id}/decide`, { decision, reason: decReason }), 'Gespeichert.');
                    if (r) {
                      setOpen(null);
                      setDecReason('');
                      reload();
                    }
                  }}
                >
                  Entscheiden
                </button>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    const r = await run(() => api.post(`/mod-api/reports/${open.report.id}/close`, { reason: decReason || 'Fall abgeschlossen' }), 'Geschlossen.');
                    if (r) {
                      setOpen(null);
                      reload();
                    }
                  }}
                >
                  Fall schließen
                </button>
              </div>
            </Card>
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── M30 · Hash-Treffer ───────────────────────────

function Hash({ me, reloadMe }: { me: Staff; reloadMe: () => void }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/hash-cases'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [viewReason, setViewReason] = useState('');
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [talk, setTalk] = useState(false);
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Hash-Treffer</h1>
      <p className="text-sm muted mb-2">
        Heute {me.hashToday} von {me.hashLimit}. {me.hashLocked ? 'Ab 21 Uhr keine neuen Fälle.' : ''} Kein Vorschaubild. Es gibt keine Schaltfläche „Datei löschen“.
      </p>
      {EMERGENCY}
      {!data?.hashActive && (
        <div className="my-3">
          <Banner kind="warn">Der Hash-Abgleich ist ausgeschaltet.</Banner>
        </div>
      )}
      {box}
      <table className="w-full text-sm mt-3">
        <tbody>
          {data?.items.map((h: any) => (
            <tr key={h.id} className="border-t border-linie">
              <td className="py-2">{h.number}</td>
              <td>Zone {h.zone}</td>
              <td>Frist {fmtDate(h.deadlineAt, true)}</td>
              <td>
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    const r: any = await run(() => api.post(`/mod-api/hash-cases/${h.id}/open`, { reason: 'Bearbeitung Hash-Treffer' }));
                    if (r) {
                      setOpen(r.case);
                      setImage(null);
                      setApprovalId(null);
                      setTalk(true);
                      reloadMe();
                    }
                  }}
                >
                  Öffnen
                </button>
                <button className="btn-ghost" onClick={() => run(() => api.post(`/mod-api/hash-cases/${h.id}/handover`), 'Abgegeben.').then(reload)}>
                  Ich kann das gerade nicht
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.number}>
        {open && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Eingang {fmtDate(open.createdAt, true)} · Zone {open.zone} · Konto {open.account ?? '—'} · Liste {open.list} · Status {open.status}
            </p>
            {open.hash && <p className="font-mono break-all">Hash: {open.hash}</p>}
            <p>Gleicher Hash bei weiteren Uploads: {open.sameHashUploads}</p>
            <p>Erledigt: {open.done.join(' · ')}</p>
            <p className="muted">Vorläufige Einschränkung des Kontos: {open.restrictAllowed ? 'zulässig' : 'gesperrt (Nr. 31)'}</p>
            <Card title="Datei ansehen (M30.08) — nur mit Grund und zweiter Person">
              {!approvalId ? (
                <>
                  <Reason value={viewReason} onChange={setViewReason} min={20} />
                  <button
                    className="btn-secondary"
                    disabled={viewReason.trim().length < 20}
                    onClick={async () => {
                      const r: any = await run(() => api.post(`/mod-api/hash-cases/${open.id}/view/request`, { reason: viewReason }), 'Beantragt.');
                      if (r) setApprovalId(r.approvalId);
                    }}
                  >
                    Beantragen
                  </button>
                </>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    const r: any = await run(() => api.post(`/mod-api/hash-cases/${open.id}/view`, { approvalId, reason: viewReason }));
                    if (r) setImage(r.image);
                  }}
                >
                  Nach Freigabe ansehen
                </button>
              )}
              {image && <img src={image} alt="" className="max-h-80 object-contain mt-2" />}
            </Card>
            <Card title="Status">
              <Reason value={statusReason} onChange={setStatusReason} min={5} />
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => run(() => api.post(`/mod-api/hash-cases/${open.id}/status`, { status: 'false_positive', reason: statusReason }), 'Gespeichert.').then(reload)}>
                  Falschtreffer
                </button>
                <button className="btn-secondary" onClick={() => run(() => api.post(`/mod-api/hash-cases/${open.id}/status`, { status: 'closed', reason: statusReason }), 'Gespeichert.').then(reload)}>
                  Schließen
                </button>
              </div>
              <p className="text-xs muted mt-2">Meldung an die Behörde: Bereich „Art. 18 DSA“ mit Fallnummer {open.number}.</p>
            </Card>
          </div>
        )}
      </Sheet>
      <Sheet open={talk && !open} onClose={() => setTalk(false)} title="Nach einem Hash-Fall">
        <p className="mb-3">Zehn Minuten reden. Nicht über den Inhalt. Und vielleicht Schluss für heute.</p>
        {EMERGENCY}
        <button className="btn-secondary mt-3" onClick={() => run(() => api.post('/mod-api/overview/talk', { caseRef: 'hash' })).then(() => setTalk(false))}>
          Gespräch geführt — vermerken
        </button>
      </Sheet>
    </>
  );
}

// ─────────────────────────── Freigaben der zweiten Person ───────────────────────────

function Freigaben() {
  const approvals = useAsync(() => api.get('/mod-api/approvals'), []);
  const susp = useAsync(() => api.get('/mod-api/suspensions'), []);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const toDecide = (susp.data?.items ?? []).filter((s: any) => s.canDecide);
  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Freigaben durch die zweite Person</h1>
      <p className="text-sm muted mb-3">Die eigene Anfrage erscheint hier nie. Es gibt keinen Notfallzugang.</p>
      {box}
      <Reason value={reason} onChange={setReason} />
      <Card title="Kontext und Dateiansicht">
        {!approvals.data?.items.length && <p className="muted text-sm">Nichts offen.</p>}
        {approvals.data?.items.map((a: any) => (
          <div key={a.id} className="border-t border-linie py-2 text-sm">
            <p>
              {a.kind === 'kontext' ? 'Kontext ausklappen' : 'Datei ansehen'} · beantragt von {a.requested_by} · {fmtDate(a.created_at, true)}
            </p>
            <p className="muted">Grund: {a.reason}</p>
            <div className="flex gap-2 mt-1">
              <button className="btn-secondary" disabled={!reason.trim()} onClick={() => run(() => api.post(`/mod-api/approvals/${a.id}`, { approve: true, reason }), 'Freigegeben.').then(approvals.reload)}>
                Freigeben
              </button>
              <button className="btn-ghost" disabled={!reason.trim()} onClick={() => run(() => api.post(`/mod-api/approvals/${a.id}`, { approve: false, reason }), 'Abgelehnt.').then(approvals.reload)}>
                Ablehnen
              </button>
            </div>
          </div>
        ))}
      </Card>
      <Card title="Sperranträge">
        {!toDecide.length && <p className="muted text-sm">Nichts offen.</p>}
        {toDecide.map((s: any) => (
          <div key={s.id} className="border-t border-linie py-2 text-sm">
            <p>
              {s.action} · {s.caseRef} · beantragt von {s.requestedBy} · {fmtDate(s.requestedAt, true)}
            </p>
            <p className="muted">Grund: {s.reason}</p>
            <div className="flex gap-2 mt-1">
              <button className="btn-danger" disabled={!reason.trim()} onClick={() => run(() => api.post(`/mod-api/suspensions/${s.id}/approve`, { reason }), 'Freigegeben — wirkt jetzt.').then(susp.reload)}>
                Freigeben
              </button>
              <button className="btn-ghost" disabled={reason.trim().length < 10} onClick={() => run(() => api.post(`/mod-api/suspensions/${s.id}/reject`, { reason }), 'Abgelehnt — die Begründung bleibt im Fall.').then(susp.reload)}>
                Ablehnen (mind. 10 Zeichen)
              </button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ─────────────────────────── M40 · Sperren ───────────────────────────

function Sperren() {
  const { data, reload } = useAsync(() => api.get('/mod-api/suspensions'), []);
  const [action, setAction] = useState('restrict');
  const [caseRef, setCaseRef] = useState('');
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Kontosperre (vier Augen)</h1>
      <p className="text-sm muted mb-4">Ohne Bezug keine Sperre. Wirkt erst nach Freigabe durch eine andere Person.</p>
      {box}
      <Card title="Antrag">
        <select className="input mb-2" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="restrict">Einschränken (lesen ja, senden nein)</option>
          <option value="suspend">Sperren</option>
          <option value="suspend_delete">Sperren und nach Ablauf aller Fristen löschen</option>
          <option value="lift">Aufheben</option>
        </select>
        <input className="input mb-2" placeholder="Fall- oder Meldenummer (M-… oder T-…)" value={caseRef} onChange={(e) => setCaseRef(e.target.value)} />
        <Reason value={reason} onChange={setReason} label="Grund — geht wörtlich in die Mitteilung" min={10} />
        <button className="btn-primary" disabled={reason.trim().length < 10 || !caseRef} onClick={() => run(() => api.post('/mod-api/suspensions', { action, caseRef, reason }), 'Beantragt — wartet auf die zweite Person.').then(reload)}>
          Beantragen
        </button>
      </Card>
      <Card title="Verlauf (30 Tage)">
        <table className="w-full text-sm">
          <tbody>
            {data?.items.map((s: any) => (
              <tr key={s.id} className="border-t border-linie align-top">
                <td className="py-2">{s.state}</td>
                <td>{s.action}</td>
                <td>{s.caseRef}</td>
                <td>
                  {s.requestedBy}
                  {s.approvedBy ? ` → ${s.approvedBy}` : ''}
                  {s.rejectedBy ? ` ✕ ${s.rejectedBy}: ${s.rejectionReason}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// ─────────────────────────── M50 · Widerspruch ───────────────────────────

function Widerspruch() {
  const { data, reload } = useAsync(() => api.get('/mod-api/appeals'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [outcome, setOutcome] = useState('bleibt');
  const [answer, setAnswer] = useState('');
  const [ourError, setOurError] = useState(false);
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Einspruch und Widerspruch</h1>
      <p className="text-sm muted mb-4">Über die eigene Entscheidung entscheidet eine andere Person — technisch erzwungen.</p>
      {box}
      <table className="w-full text-sm">
        <tbody>
          {data?.items.map((a: any) => (
            <tr key={a.id} className="border-t border-linie">
              <td className="py-2">
                <Ampel v={a.ampel} />
              </td>
              <td>{a.number}</td>
              <td>{a.kind === 'bild' ? 'Bild (48 h)' : 'Entscheidung (72 h)'}</td>
              <td>{fmtDate(a.deadlineAt, true)}</td>
              <td>
                {a.ownCase ? (
                  <span className="muted">eigener Fall — wartet auf die andere Person</span>
                ) : (
                  <button className="btn-ghost" onClick={async () => setOpen(await run(() => api.post(`/mod-api/appeals/${a.id}/open`)))}>
                    Öffnen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.number}>
        {open && (
          <div className="flex flex-col gap-3 text-sm">
            <Card title="Ursprungsentscheidung (unveränderlich)">
              {open.original.hashCase ? (
                <p>Hash-Fall — keine Einzelheiten, kein Bild.</p>
              ) : (
                <>
                  <pre className="whitespace-pre-wrap text-xs">{JSON.stringify({ ...open.original, image: undefined }, null, 2)}</pre>
                  {open.original.image && <img src={open.original.image} alt="" className="max-h-72 object-contain" />}
                </>
              )}
              {open.automated && <p className="muted">Entschieden hat ein Programm.</p>}
            </Card>
            <Card title="Text der Person (ungekürzt)">
              <p className="whitespace-pre-wrap">{open.text}</p>
            </Card>
            {open.disclose && <Banner kind="warn">Du hast die ursprüngliche Entscheidung mit freigegeben — das wird in der Antwort offengelegt.</Banner>}
            {!open.mayDecide ? (
              <Banner kind="warn">Du hast ursprünglich entschieden. Eine andere Person entscheidet.</Banner>
            ) : (
              <>
                <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                  <option value="bleibt">Bleibt bestehen</option>
                  <option value="aufgehoben">Wird aufgehoben (vollständig herstellen)</option>
                  <option value="abgemildert">Wird abgemildert</option>
                </select>
                <TextArea label="Antwort — muss auf den Einspruch eingehen (mind. 30 Zeichen)" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                <Toggle checked={ourError} onChange={setOurError} label="Vermerk „Fehler bei uns“" hint="Fließt in die Quartalsdurchsicht." />
                <button
                  className="btn-primary"
                  disabled={answer.trim().length < 30}
                  onClick={async () => {
                    const r = await run(() => api.post(`/mod-api/appeals/${open.id}/decide`, { outcome, answer, ourError }), 'Entschieden und beantwortet.');
                    if (r) {
                      setOpen(null);
                      setAnswer('');
                      reload();
                    }
                  }}
                >
                  Entscheiden
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── M60 · Protokoll ───────────────────────────

function Protokoll({ isBetrieb }: { isBetrieb: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [next, setNext] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const load = async (before?: number) => {
    const r: any = await run(() => api.get(`/mod-api/log${before ? `?before=${before}` : ''}`));
    if (r) {
      setItems((x) => (before ? [...x, ...r.items] : r.items));
      setNext(r.next);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Zugriffsprotokoll</h1>
      <p className="text-sm muted mb-4">Nicht löschbar, nicht änderbar — für niemanden. Besondere Einträge sind hervorgehoben.</p>
      {box}
      <table className="w-full text-sm">
        <thead className="text-left muted">
          <tr>
            <th className="py-1">Zeit</th>
            <th>Person</th>
            <th>Fall</th>
            <th>Handlung</th>
            <th>Begründung</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id} className={`border-t border-linie align-top ${e.special ? 'bg-warn/10' : ''} ${e.own ? 'font-medium' : ''}`}>
              <td className="py-1 whitespace-nowrap">{fmtDate(e.at, true)}</td>
              <td>{e.who}</td>
              <td>{e.caseRef}</td>
              <td>{e.action}</td>
              <td className="break-words">{e.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {next && (
        <button className="btn-secondary mt-3" onClick={() => load(next)}>
          Ältere laden
        </button>
      )}
      {isBetrieb && (
        <Card title="Export (nur als Ganzes, steht selbst im Protokoll)">
          <Reason value={reason} onChange={setReason} min={10} />
          <button
            className="btn-secondary"
            disabled={reason.trim().length < 10}
            onClick={async () => {
              const res = await fetch('/mod-api/log/export', { method: 'POST', headers: { 'x-cruizy': '1', 'content-type': 'application/json' }, body: JSON.stringify({ reason }) });
              if (!res.ok) return;
              const blob = await res.blob();
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `zugriffsprotokoll-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              load();
            }}
          >
            Exportieren
          </button>
        </Card>
      )}
    </>
  );
}

// ─────────────────────────── M70 · Orte ───────────────────────────

function Orte() {
  const claims = useAsync(() => api.get('/mod-api/claims'), []);
  const places = useAsync(() => api.get('/mod-api/places'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [decision, setDecision] = useState('rueckfrage');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [newPlace, setNewPlace] = useState<any>({ name: '', kind: 'bar', cityId: 'koeln', district: '', address: '', lat: '', lng: '', website: '', impressumDomain: '', description: '', source: '', sourceFetchedAt: new Date().toISOString().slice(0, 10) });
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Orte</h1>
      <p className="text-sm muted mb-4">Keine bezahlte Hervorhebung — dafür gibt es keine Schaltfläche. Der Domainabgleich ist ein Hinweis, keine Entscheidung.</p>
      {box}
      <Card title="Offene Beanspruchungen (Frist 24 Std.)">
        {!claims.data?.items.length && <p className="muted text-sm">Nichts offen.</p>}
        {claims.data?.items.map((c: any) => (
          <div key={c.id} className="border-t border-linie py-2 text-sm flex items-center gap-2">
            <Ampel v={c.ampel} />
            <span className="flex-1">
              {c.number} · {c.kind === 'claim' ? 'Beanspruchen' : 'Entfernen'} · {c.place.name} · Status {c.status} · Frist {fmtDate(c.deadlineAt, true)}
              {c.competing > 0 ? ` · ${c.competing} weitere Anfrage(n)` : ''}
              {c.domainMatches ? ' · Domain passt (Hinweis)' : ''}
            </span>
            <button className="btn-ghost" onClick={async () => setOpen(await run(() => api.get(`/mod-api/claims/${c.id}`)))}>
              Öffnen
            </button>
          </div>
        ))}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.number}>
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>{open.place.name}</strong> · {open.place.address} · Website {open.place.website ?? '—'} · Impressumsdomain {open.place.impressumDomain ?? '—'}
            </p>
            <p>
              {open.contact.name} · {open.contact.role ?? '—'} · {open.contact.email}
            </p>
            {open.proof && <p className="card p-2 whitespace-pre-wrap">{open.proof}</p>}
            <p className="muted">Abgleich Domain: {open.domainMatches ? 'passt' : 'passt nicht'} (nur Hinweis)</p>
            <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="rueckfrage">Rückfrage stellen</option>
              <option value="bestaetigen">Bestätigen</option>
              <option value="ablehnen">Ablehnen</option>
            </select>
            <TextArea label="Nachricht an die Person (bei Rückfrage Pflicht)" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Reason value={reason} onChange={setReason} min={5} />
            <button
              className="btn-primary"
              disabled={reason.trim().length < 5}
              onClick={async () => {
                const r = await run(() => api.post(`/mod-api/claims/${open.id}/decide`, { decision, reason, message: message || undefined }), 'Gespeichert.');
                if (r) {
                  setOpen(null);
                  claims.reload();
                  places.reload();
                }
              }}
            >
              Entscheiden
            </button>
          </div>
        )}
      </Sheet>
      <Card title="Ortsverzeichnis">
        <table className="w-full text-sm mb-3">
          <tbody>
            {places.data?.items.map((p: any) => (
              <tr key={p.id} className={`border-t border-linie ${p.removed_at ? 'muted line-through' : ''}`}>
                <td className="py-1">{p.name}</td>
                <td>{p.kind}</td>
                <td>{p.district}</td>
                <td>{p.claimed_at ? 'bestätigt' : ''}</td>
                <td>
                  {!p.removed_at && (
                    <button className="btn-ghost" disabled={!reason.trim()} onClick={() => run(() => api.post(`/mod-api/places/${p.id}/remove`, { reason }), 'Entfernt.').then(places.reload)}>
                      Entfernen
                    </button>
                  )}
                  {p.claimed_at && (
                    <button className="btn-ghost" disabled={reason.trim().length < 5} onClick={() => run(() => api.post(`/mod-api/places/${p.id}/revoke-claim`, { reason }), 'Widerrufen.').then(places.reload)}>
                      Widerrufen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="font-semibold mb-2">Ort anlegen (redaktionell)</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {['name', 'kind', 'cityId', 'district', 'address', 'lat', 'lng', 'website', 'impressumDomain', 'source', 'sourceFetchedAt'].map((k) => (
            <input key={k} className="input" placeholder={k} value={newPlace[k]} onChange={(e) => setNewPlace({ ...newPlace, [k]: e.target.value })} />
          ))}
        </div>
        <TextArea label="Beschreibung" value={newPlace.description} onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })} />
        <Reason value={reason} onChange={setReason} />
        <button
          className="btn-secondary"
          disabled={!reason.trim() || !newPlace.name || !newPlace.lat || !newPlace.lng || !newPlace.source}
          onClick={() =>
            run(
              () =>
                api.post('/mod-api/places', {
                  reason,
                  place: {
                    ...newPlace,
                    lat: Number(newPlace.lat),
                    lng: Number(newPlace.lng),
                    website: newPlace.website || null,
                    impressumDomain: newPlace.impressumDomain || null,
                    description: newPlace.description || null,
                    openingHours: {},
                  },
                }),
              'Angelegt.',
            ).then(places.reload)
          }
        >
          Anlegen
        </button>
      </Card>
    </>
  );
}

// ─────────────────────────── M75 · Einreichungen ───────────────────────────

const CHECKS = [
  ['ampel', 'Ampel eingehalten'],
  ['keinePrivatadresse', 'keine Privatadresse im Text'],
  ['ab18', 'ab 18 genannt'],
  ['keinVersprechen', 'kein unhaltbares Versprechen'],
  ['anbieter', 'bei gewerblich: Anbieterangaben vollständig'],
] as const;

function Einreichungen() {
  const { data, reload } = useAsync(() => api.get('/mod-api/submissions'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [ev, setEv] = useState<any>({});
  const [decision, setDecision] = useState('freigeben');
  const [reason, setReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const { run, box } = useAction();
  const all = CHECKS.every(([k]) => checks[k]);
  const openMail = async (m: any) => {
    const r: any = await run(() => api.post(`/mod-api/submissions/mail/${m.id}/open`));
    if (r) {
      setOpen(r);
      setChecks({});
      setEv({
        title: r.suggestion?.title ?? '',
        startsAt: r.suggestion?.start?.slice(0, 16) ?? '',
        endsAt: r.suggestion?.end?.slice(0, 16) ?? '',
        description: '',
        ampel: 'gruen',
        placeId: r.placeHint ?? '',
      });
    }
  };
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Freigabe von Veranstaltungen</h1>
      <p className="text-sm muted mb-4">Fünf Prüfpunkte, eine Entscheidung, ein Grund. Die Adresse privater Veranstaltungen sieht niemand.</p>
      {box}
      <Card title="Eingang termine@">
        {!data?.mails.length && <p className="muted text-sm">Nichts offen.</p>}
        {data?.mails.map((m: any) => (
          <div key={m.id} className="border-t border-linie py-2 text-sm flex items-center gap-2">
            <span className="flex-1">
              {fmtDate(m.receivedAt, true)} · {m.domain ?? '—'} · Vorschlag: {m.suggestion?.title ?? '—'}
            </span>
            <button className="btn-ghost" onClick={() => openMail(m)}>
              Öffnen
            </button>
          </div>
        ))}
      </Card>
      <Card title="Eingereichte Veranstaltungen">
        {!data?.events.length && <p className="muted text-sm">Nichts offen.</p>}
        {data?.events.map((e: any) => (
          <div key={e.id} className="border-t border-linie py-2 text-sm">
            <p>
              {e.soon ? '⚡ ' : ''}
              {e.title} · {fmtDate(e.startsAt, true)} · {e.place ?? '—'}
            </p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {CHECKS.map(([k, l]) => (
                <label key={k} className="text-xs flex items-center gap-1">
                  <input type="checkbox" checked={!!checks[`${e.id}:${k}`]} onChange={(x) => setChecks({ ...checks, [`${e.id}:${k}`]: x.target.checked })} /> {l}
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                className="btn-secondary"
                disabled={!reason.trim() || !CHECKS.every(([k]) => checks[`${e.id}:${k}`])}
                onClick={() =>
                  run(() => api.post(`/mod-api/events/${e.id}/decide`, { decision: 'freigeben', reason, ampel: 'gruen', checklist: Object.fromEntries(CHECKS.map(([k]) => [k, true])) }), 'Freigegeben.').then(reload)
                }
              >
                Freigeben (grün)
              </button>
              <button className="btn-ghost" disabled={!reason.trim()} onClick={() => run(() => api.post(`/mod-api/events/${e.id}/decide`, { decision: 'ablehnen', reason }), 'Abgelehnt.').then(reload)}>
                Ablehnen
              </button>
            </div>
          </div>
        ))}
        <Reason value={reason} onChange={setReason} />
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Einreichung">
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="muted">
              Von {open.from} · Betreff {open.subject}
            </p>
            <pre className="card p-2 whitespace-pre-wrap text-xs max-h-60 overflow-auto">{open.text}</pre>
            <input className="input" placeholder="Titel" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input" type="datetime-local" value={ev.startsAt} onChange={(e) => setEv({ ...ev, startsAt: e.target.value })} aria-label="Beginn" />
              <input className="input" type="datetime-local" value={ev.endsAt} onChange={(e) => setEv({ ...ev, endsAt: e.target.value })} aria-label="Ende" />
            </div>
            <input className="input" placeholder="Ort-ID (optional)" value={ev.placeId} onChange={(e) => setEv({ ...ev, placeId: e.target.value })} />
            <TextArea label="Beschreibung" value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
            <select className="input" value={ev.ampel} onChange={(e) => setEv({ ...ev, ampel: e.target.value })}>
              <option value="gruen">Ampel grün</option>
              <option value="gelb">Ampel gelb</option>
              <option value="rot">Ampel rot (nur verifizierte Konten)</option>
            </select>
            {CHECKS.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={!!checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} /> {l}
              </label>
            ))}
            <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="freigeben">Freigeben</option>
              <option value="zurueckgeben">Zurückgeben</option>
              <option value="ablehnen">Ablehnen</option>
            </select>
            {decision === 'zurueckgeben' && <input className="input" placeholder="Grund für die einreichende Person" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />}
            <Reason value={reason} onChange={setReason} />
            <button
              className="btn-primary"
              disabled={!reason.trim() || (decision === 'freigeben' && (!all || !ev.title || !ev.startsAt || !ev.endsAt))}
              onClick={async () => {
                const r = await run(
                  () =>
                    api.post(`/mod-api/submissions/mail/${open.id}/decide`, {
                      decision,
                      reason,
                      returnReason: returnReason || undefined,
                      checklist: decision === 'freigeben' ? Object.fromEntries(CHECKS.map(([k]) => [k, true])) : undefined,
                      event:
                        decision === 'freigeben'
                          ? { title: ev.title, description: ev.description, startsAt: new Date(ev.startsAt).toISOString(), endsAt: new Date(ev.endsAt).toISOString(), placeId: ev.placeId || null, ampel: ev.ampel }
                          : undefined,
                    }),
                  'Gespeichert.',
                );
                if (r) {
                  setOpen(null);
                  reload();
                }
              }}
            >
              Entscheiden
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── M80 · Art. 18 DSA ───────────────────────────

function Art18({ isBetrieb }: { isBetrieb: boolean }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/art18'), []);
  const [caseRef, setCaseRef] = useState('');
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState<any | null>(null);
  const [content, setContent] = useState('');
  const [read, setRead] = useState(false);
  const [authorityRef, setAuthorityRef] = useState('');
  const [addendum, setAddendum] = useState('');
  const { run, box } = useAction();
  const show = async (id: string) => {
    const r: any = await run(() => api.get(`/mod-api/art18/${id}`));
    if (r) {
      setOpen(r);
      setContent(r.content);
      setRead(false);
    }
  };
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Meldung nach Art. 18 DSA</h1>
      <p className="text-sm muted mb-4">Vorbereiten · gegenzeichnen (andere Person) · absenden (nur BETRIEB) · Vorgangsnummer der Behörde. Eine Meldung wird nie gelöscht.</p>
      {data && !data.portalReady && (
        <div className="mb-3">
          <Banner kind="warn">Portalkonto der Behörde nicht als eingerichtet vermerkt (Nr. 72).</Banner>
        </div>
      )}
      {box}
      <Card title="Entwurf aus einem Fall">
        <input className="input mb-2" placeholder="Fallnummer (M-… oder T-…)" value={caseRef} onChange={(e) => setCaseRef(e.target.value)} />
        <Reason value={reason} onChange={setReason} min={5} />
        <button className="btn-primary" disabled={reason.trim().length < 5 || !caseRef} onClick={async () => { const r: any = await run(() => api.post('/mod-api/art18', { caseRef, reason }), 'Entwurf angelegt.'); if (r) { reload(); show(r.id); } }}>
          Entwurf anlegen
        </button>
      </Card>
      <Card title="Meldungen">
        <table className="w-full text-sm">
          <tbody>
            {data?.items.map((a: any) => (
              <tr key={a.id} className="border-t border-linie">
                <td className="py-2">{a.caseRef}</td>
                <td>{a.sentAt ? `gesendet ${fmtDate(a.sentAt, true)} · ${a.authorityRef}` : a.countersignedBy ? 'gegengezeichnet' : a.confirmedText ? 'Text bestätigt' : 'Entwurf'}</td>
                <td>
                  gemeldet nach {Math.floor(a.elapsedMinutes / 60)} Std. {a.elapsedMinutes % 60} Min.
                </td>
                <td>
                  <button className="btn-ghost" onClick={() => show(a.id)}>
                    Öffnen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {isBetrieb && (
        <button className="btn-ghost" onClick={() => run(() => api.post('/mod-api/art18/portal', { registered: !data?.portalReady }), 'Vermerkt.').then(reload)}>
          Portalkonto als {data?.portalReady ? 'nicht ' : ''}eingerichtet vermerken
        </button>
      )}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Meldung">
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            {open.missingIp && <Banner kind="warn">IP-Adresse fehlt — „unverzüglich“ gilt auch mit Lücken.</Banner>}
            <TextArea label="Sachverhalt (muss gelesen und bestätigt werden)" value={content} onChange={(e) => setContent(e.target.value)} disabled={!!open.countersignedBy} />
            {!open.countersignedBy && (
              <>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)} /> Gelesen und bestätigt
                </label>
                <button className="btn-secondary" disabled={!read} onClick={() => run(() => api.post(`/mod-api/art18/${open.id}/confirm`, { content, read: true }), 'Bestätigt.').then(() => show(open.id))}>
                  Text bestätigen
                </button>
                <button className="btn-secondary" disabled={!open.confirmedText} onClick={() => run(() => api.post(`/mod-api/art18/${open.id}/countersign`, { reason: 'Gegenzeichnung nach Prüfung' }), 'Gegengezeichnet.').then(() => show(open.id))}>
                  Gegenzeichnen (andere Person)
                </button>
              </>
            )}
            {isBetrieb && open.countersignedBy && !open.sentAt && (
              <>
                <input className="input" placeholder="Vorgangsnummer der Behörde (Pflicht)" value={authorityRef} onChange={(e) => setAuthorityRef(e.target.value)} />
                <button className="btn-danger" disabled={authorityRef.trim().length < 3} onClick={() => run(() => api.post(`/mod-api/art18/${open.id}/sent`, { authorityRef }), 'Als gesendet vermerkt.').then(() => (reload(), show(open.id)))}>
                  Über das Portal gesendet
                </button>
              </>
            )}
            {open.sentAt && (
              <>
                <p>
                  Gesendet {fmtDate(open.sentAt, true)} · Vorgangsnummer {open.authorityRef}
                </p>
                {(open.addenda ?? []).map((a: any, i: number) => (
                  <p key={i} className="card p-2">
                    {fmtDate(a.at, true)} · {a.by}: {a.text}
                  </p>
                ))}
                {isBetrieb && (
                  <>
                    <TextArea label="Nachtrag (z. B. Falschtreffer)" value={addendum} onChange={(e) => setAddendum(e.target.value)} />
                    <button className="btn-secondary" disabled={addendum.trim().length < 10} onClick={() => run(() => api.post(`/mod-api/art18/${open.id}/addendum`, { text: addendum }), 'Nachtrag vermerkt.').then(() => show(open.id))}>
                      Nachtrag
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── M85 · Vorgänge ───────────────────────────

function Vorgaenge() {
  const { data, reload } = useAsync(() => api.get('/mod-api/tickets'), []);
  const templates = useAsync(() => api.get('/mod-api/tickets/templates'), []);
  const [open, setOpen] = useState<any | null>(null);
  const [answer, setAnswer] = useState('');
  const [cat, setCat] = useState<number>(10);
  const [reason, setReason] = useState('');
  const [closeReason, setCloseReason] = useState('beantwortet');
  const [reportReason, setReportReason] = useState('belaestigung');
  const [search, setSearch] = useState('');
  const { run, box } = useAction();
  const openTicket = async (id: string) => {
    const r: any = await run(() => api.post(`/mod-api/tickets/${id}/open`, { reason: 'Bearbeitung Vorgang' }));
    if (r) {
      setOpen(r);
      setCat(r.category);
      setAnswer('');
    }
  };
  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Vorgänge des Kontaktservice</h1>
      <p className="text-sm muted mb-4">Sortiert nach Restfrist — nicht umstellbar. Rot lässt sich nicht wegklicken. Suche nur nach Fallnummer.</p>
      {box}
      {data?.danger?.length > 0 && (
        <div className="mb-3">
          <Banner kind="error">
            Jemand ist in Gefahr:{' '}
            {data.danger.map((d: any) => (
              <button key={d.id} className="underline mr-2" onClick={() => openTicket(d.id)}>
                {d.number}
              </button>
            ))}
          </Banner>
        </div>
      )}
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        {data?.pots.map((p: any) => (
          <div key={p.pot} className="card p-3 text-sm">
            <p className="font-semibold">{p.pot}</p>
            <p>
              {p.open} offen · rot {p.red}
            </p>
            {!p.mayOpen && <p className="text-xs muted">Inhalt nur für BETRIEB</p>}
          </div>
        ))}
      </div>
      <input className="input mb-3" placeholder="Fallnummer H-JJJJ-NNNNNN" value={search} onChange={(e) => setSearch(e.target.value.trim())} />
      <table className="w-full text-sm">
        <tbody>
          {data?.items
            .filter((i: any) => !search || i.number === search)
            .map((i: any) => (
              <tr key={i.id} className="border-t border-linie">
                <td className="py-2">
                  <Ampel v={i.ampel} />
                </td>
                <td>{i.number}</td>
                <td>
                  Kat. {i.category} · {i.pot}
                </td>
                <td>{i.category === 1 ? 'unverzüglich' : `${Math.floor(i.remainingMinutes / 60)} Std. ${Math.abs(i.remainingMinutes % 60)} Min.`}</td>
                <td>{i.withoutAccount ? 'ohne Konto' : ''}</td>
                <td>{i.assigned ?? ''}</td>
                <td>
                  {i.mayOpen ? (
                    <button className="btn-ghost" onClick={() => openTicket(i.id)}>
                      Öffnen
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <Sheet open={!!open} onClose={() => (setOpen(null), reload())} title={open?.number}>
        {open && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="muted">
              Kat. {open.category} · {open.pot} · Frist {fmtDate(open.deadlineAt, true)} · Antwortweg {open.replyWay}
              {open.relatedRef ? ` · Bezug ${open.relatedRef}` : ''}
              {open.withoutAccount ? ' · ohne Konto' : ''}
            </p>
            {open.previousDeadlines?.length > 0 && <p className="muted">Frühere Fristen: {open.previousDeadlines.map((d: any) => fmtDate(d.deadlineAt, true)).join(', ')}</p>}
            <p className="card p-2 whitespace-pre-wrap">{open.text}</p>
            {open.attachment && <img src={open.attachment} alt="" className="max-h-60 object-contain" />}
            {open.messages.map((m: any, i: number) => (
              <p key={i} className={`whitespace-pre-wrap ${m.fromTeam ? 'border-l-2 border-akzent pl-2' : ''}`}>
                {m.text}
              </p>
            ))}
            <select className="input" onChange={(e) => e.target.value && setAnswer(e.target.value)} defaultValue="">
              <option value="">Vorlage einsetzen (bearbeitbar, nie automatisch)</option>
              {templates.data?.templates.map((tp: any) => (
                <option key={tp.question} value={tp.answer}>
                  {tp.question}
                </option>
              ))}
            </select>
            <TextArea label="Antwort" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <button className="btn-primary" disabled={answer.trim().length < 10} onClick={() => run(() => api.post(`/mod-api/tickets/${open.id}/reply`, { text: answer }), 'Gesendet.').then(() => openTicket(open.id))}>
              Antworten
            </button>
            <Reason value={reason} onChange={setReason} min={3} />
            <div className="flex gap-2 flex-wrap items-center">
              <select className="input w-auto" value={cat} onChange={(e) => setCat(Number(e.target.value))}>
                {Array.from({ length: 10 }, (_, i) => i + 1)
                  .filter((n) => n !== 7)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n} · {t(`UI-HLF-KAT-${n}`)}
                    </option>
                  ))}
              </select>
              <button className="btn-secondary" disabled={reason.trim().length < 3 || cat === open.category} onClick={() => run(() => api.post(`/mod-api/tickets/${open.id}/category`, { category: cat, reason }), 'Kategorie geändert — neue Frist.').then(() => openTicket(open.id))}>
                Kategorie ändern
              </button>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select className="input w-auto" value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
                {data?.closeReasons.map((r: string) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button className="btn-secondary" onClick={() => run(() => api.post(`/mod-api/tickets/${open.id}/close`, { closeReason, reason: reason || undefined }), 'Geschlossen.').then(() => (setOpen(null), reload()))}>
                Schließen
              </button>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <select className="input w-auto" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                {['belaestigung', 'nacktbilder', 'intim_ohne_einwilligung', 'fake', 'minderjaehrig', 'hass', 'sexgeld', 'gefahr', 'anderes'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button className="btn-secondary" disabled={reason.trim().length < 5} onClick={() => run(() => api.post(`/mod-api/tickets/${open.id}/to-case`, { reportReason, reason }), 'Als Moderationsfall angelegt.').then(() => (setOpen(null), reload()))}>
                Als Moderationsfall öffnen
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

// ─────────────────────────── Verwaltung (BETRIEB) ───────────────────────────

function Verwaltung() {
  const params = useAsync(() => api.get('/mod-api/params'), []);
  const feedback = useAsync(() => api.get('/mod-api/feedback'), []);
  const metrics = useAsync(() => api.get('/mod-api/metrics'), []);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { run, box } = useAction();
  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Verwaltung</h1>
      {box}
      <Card title="Ansprechperson (M90.06)">
        <div className="grid sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <input className="input" placeholder="Telefon" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        </div>
        <button className="btn-secondary mt-2" disabled={!contact.name || !contact.phone} onClick={() => run(() => api.put('/mod-api/settings/contact', contact), 'Hinterlegt.').then(params.reload)}>
          Speichern
        </button>
      </Card>
      <Card title="Kennzahlen (nur Summen)">
        {metrics.data && (
          <>
            <ul className="text-sm grid sm:grid-cols-2 gap-1">
              {Object.entries(metrics.data.live).map(([k, v]) => (
                <li key={k}>
                  {k}: {String(v)}
                </li>
              ))}
            </ul>
            <p className="text-xs muted mt-2">Schwellen: {JSON.stringify(metrics.data.thresholds)}</p>
            {metrics.data.archive.map((a: any) => (
              <details key={a.month} className="text-xs mt-1">
                <summary>{a.month}</summary>
                <pre>{JSON.stringify(a.data, null, 1)}</pre>
              </details>
            ))}
          </>
        )}
      </Card>
      <Card title="Rückmeldungen">
        {feedback.data?.items.map((f: any) => (
          <div key={f.id} className="border-t border-linie py-2 text-sm">
            <p className="whitespace-pre-wrap">{f.text}</p>
            <p className="text-xs muted">
              {fmtDate(f.createdAt, true)}
              {f.wantsReply ? ' · Antwort gewünscht' : ''}
              {f.answeredAt ? ` · beantwortet ${fmtDate(f.answeredAt)}` : ''}
            </p>
            {f.wantsReply && !f.answeredAt && (
              <div className="flex gap-2 mt-1">
                <input className="input" value={answers[f.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })} />
                <button className="btn-secondary" onClick={() => run(() => api.post(`/mod-api/feedback/${f.id}/answer`, { text: answers[f.id] ?? '' }), 'Beantwortet.').then(feedback.reload)}>
                  Antworten
                </button>
              </div>
            )}
          </div>
        ))}
      </Card>
      <Card title="Parameter">
        <p className="text-sm muted mb-2">
          Hash-Abgleich angebunden: {params.data?.hashProvider ? 'ja' : 'nein'} · Ansprechperson: {params.data?.contactSet ? 'hinterlegt' : 'fehlt'}. Tagesgrenze und Uhrzeitsperre sind keine Parameter.
        </p>
        <Reason value={reason} onChange={setReason} min={5} />
        <table className="w-full text-xs">
          <tbody>
            {params.data?.params.map((p: any) => (
              <tr key={p.key} className="border-t border-linie align-top">
                <td className="py-1 font-mono">{p.key}</td>
                <td className="font-mono break-all">{JSON.stringify(p.wert)}</td>
                <td className="muted">
                  {p.einheit ?? ''} {p.quelle}
                </td>
                <td className="w-64">
                  <div className="flex gap-1">
                    <input className="input h-9 min-h-0 text-xs" placeholder="neuer Wert (JSON)" value={edit[p.key] ?? ''} onChange={(e) => setEdit({ ...edit, [p.key]: e.target.value })} />
                    <button
                      className="btn-secondary min-h-0 h-9"
                      disabled={!edit[p.key] || reason.trim().length < 5}
                      onClick={() => {
                        let value: unknown;
                        try {
                          value = JSON.parse(edit[p.key]);
                        } catch {
                          value = edit[p.key];
                        }
                        run(() => api.put(`/mod-api/params/${p.key}`, { value, reason }), 'Gespeichert.').then(params.reload);
                      }}
                    >
                      ✓
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

/**
 * Werkzeug · Postfach: alle Meldungen, Widersprüche, Rückmeldungen und Anfragen als Tickets untereinander.
 * Ein Ticket öffnet sich als Chat (links) mit den passenden Aktionen (rechts): Team, Frist, Übernehmen,
 * Meldung entscheiden, Widerspruch entscheiden, Datenfreigabe anfragen, Person sperren, Abschließen.
 * Owner handeln überall allein und ohne Begründung.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Banner, TextArea, Toggle, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate, t } from '../lib/texts';
import { Reason, isOwnerMode, tooShort, useAction } from './common';

type TeamKey = 'support' | 'moderation' | 'technik' | 'datenschutz' | 'abrechnung';
type View = 'offen' | 'wartet' | 'erledigt';

const KIND: Record<string, { label: string; cls: string }> = {
  meldung: { label: 'Meldung', cls: 'bg-gefahr/15 text-gefahr' },
  widerspruch: { label: 'Widerspruch', cls: 'bg-warn/15 text-warn' },
  anfrage: { label: 'Anfrage', cls: 'bg-akzent/15 text-akzent' },
  rueckmeldung: { label: 'Rückmeldung', cls: 'bg-flaeche2 muted' },
};

const DECISIONS: [string, string][] = [
  ['bleibt', 'Kein Verstoß'],
  ['inhalt_entfernt', 'Inhalt entfernen'],
  ['eingeschraenkt', 'Einschränken'],
  ['gesperrt', 'Sperren'],
  ['an_behoerde', 'An Behörde (Art. 18 vorbereiten)'],
  ['date_verstoss', 'Date-Verstoß (nur Date)'],
];

const SUSPEND: [string, string][] = [
  ['restrict', 'Einschränken (lesen ja, senden nein)'],
  ['suspend', 'Sperren'],
  ['suspend_delete', 'Sperren und Konto löschen'],
  ['lift', 'Sperre aufheben'],
];

/** Restzeit bis zur Antwort — „überfällig“ in Rot. */
function Due({ item }: { item: { waitingOn: string; remainingMinutes: number | null; priority?: boolean } }) {
  if (item.waitingOn === 'person') return <span className="text-xs muted">Person ist dran</span>;
  if (item.waitingOn === 'niemand') return <span className="text-xs muted">abgeschlossen</span>;
  const m = item.remainingMinutes ?? 0;
  const txt = (x: number) => (Math.abs(x) >= 60 ? `${Math.floor(Math.abs(x) / 60)} Std. ${Math.abs(x) % 60} Min.` : `${Math.abs(x)} Min.`);
  if (m < 0) return <span className="text-xs text-gefahr font-semibold">überfällig seit {txt(m)}</span>;
  return <span className={`text-xs ${m < 6 * 60 ? 'text-warn' : 'muted'}`}>noch {txt(m)}</span>;
}

function Dot({ v }: { v: string | null }) {
  if (!v) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-linie" aria-label="wartet" />;
  const c = v === 'rot' ? 'bg-gefahr' : v === 'gelb' ? 'bg-warn' : 'bg-gut';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c}`} aria-label={`Ampel ${v}`} />;
}

// ─────────────────────────── Postfach (Liste) ───────────────────────────

export function Postfach({ myTeams, goTo }: { myTeams: string[]; goTo: (screen: string) => void }) {
  const [team, setTeam] = useState<string>(myTeams.length ? 'meine' : 'alle');
  const [view, setView] = useState<View>('offen');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const qs = new URLSearchParams({ team, view, ...(search.trim() ? { suche: search.trim() } : {}) });
  const { data, reload } = useAsync(() => api.get(`/mod-api/postfach?${qs}`), [team, view, search]);
  const ov = useAsync(() => api.get('/mod-api/overview'), []);

  useEffect(() => {
    const i = setInterval(reload, 60_000);
    return () => clearInterval(i);
  }, [team, view, search]);

  if (openId) return <TicketView id={openId} onBack={() => (setOpenId(null), reload())} />;

  const o = ov.data;
  const tasks: [string, string, number][] = o
    ? [
        ['warteschlange', 'Warteschlange Zone 1', o.queue.open],
        ['sperren', 'Sperren zur Freigabe', o.suspensionsToApprove],
        ['freigaben', 'Zweite Person', o.approvalsToGive],
        ['hash', 'Hash-Treffer', o.hashCases.open],
        ['einreichungen', 'Termine', o.submissions],
        ['veranstaltungen', 'Veranstaltungen', o.eventsUnchecked],
        ['veranstalter', 'Veranstalter', o.organizerApplications],
      ]
    : [];

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold flex-1">Postfach</h1>
        <input className="input w-48" placeholder="H-… oder M-…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Nummer suchen" />
      </div>
      <p className="text-sm muted mb-3">Alle Meldungen, Widersprüche und Anfragen. Antwort binnen 24 Std., danach 24 Std. ab der letzten Nachricht der Person.</p>

      <div className="scroll-x flex gap-2 mb-2" role="tablist" aria-label="Team">
        {myTeams.length > 0 && (
          <TabChip on={team === 'meine'} onClick={() => setTeam('meine')}>
            Meine Teams
          </TabChip>
        )}
        <TabChip on={team === 'alle'} onClick={() => setTeam('alle')}>
          Alle
        </TabChip>
        {data?.teams.map((x: any) => (
          <TabChip key={x.key} on={team === x.key} onClick={() => setTeam(x.key)}>
            {x.label}
            {x.open > 0 && <span className={`ml-1 rounded-full px-1.5 text-xs ${x.overdue ? 'bg-gefahr text-white' : 'bg-akzent text-grund'}`}>{x.open}</span>}
          </TabChip>
        ))}
      </div>
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Status">
        {(['offen', 'wartet', 'erledigt'] as View[]).map((v) => (
          <TabChip key={v} on={view === v} onClick={() => setView(v)}>
            {v === 'offen' ? 'Team ist dran' : v === 'wartet' ? 'Person ist dran' : 'Erledigt (30 Tage)'}
          </TabChip>
        ))}
      </div>

      {!data ? (
        <p className="muted">…</p>
      ) : !data.items.length ? (
        <p className="muted card p-4">Nichts offen.</p>
      ) : (
        <ul className="card divide-y divide-linie overflow-hidden">
          {data.items.map((it: any) => (
            <li key={it.id}>
              <button
                className="w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-flaeche2 disabled:opacity-60"
                disabled={!it.mayOpen}
                onClick={() => setOpenId(it.id)}
                title={it.mayOpen ? undefined : 'Nur für BETRIEB'}
              >
                <span className="pt-1.5">
                  <Dot v={it.ampel} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded px-1.5 text-xs ${KIND[it.kind]?.cls ?? ''}`}>{KIND[it.kind]?.label ?? it.kind}</span>
                    {it.priority && <span className="rounded px-1.5 text-xs bg-gefahr text-white">Vorrang</span>}
                    <span className="font-semibold truncate">{it.subject}</span>
                    {it.unread > 0 && <span className="rounded-full bg-akzent text-grund px-1.5 text-xs">{it.unread} neu</span>}
                  </span>
                  <span className="block text-xs muted mt-0.5">
                    {it.number} · {it.teamLabel} · {fmtDate(it.lastPersonAt ?? it.createdAt, true)}
                    {it.assigned ? ` · bei ${it.assigned}` : ''}
                    {it.withoutAccount ? ' · ohne Konto' : ''}
                    {!it.mayOpen ? ' · nur BETRIEB' : ''}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <Due item={it} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tasks.some(([, , n]) => n > 0) && (
        <section className="mt-6">
          <h2 className="text-sm uppercase tracking-wide muted mb-2">Weitere Aufgaben</h2>
          <div className="flex flex-wrap gap-2">
            {tasks
              .filter(([, , n]) => n > 0)
              .map(([key, label, n]) => (
                <button key={key} className="chip min-h-tap" onClick={() => goTo(key)}>
                  {label} <span className="rounded-full bg-akzent text-grund px-1.5 text-xs">{n}</span>
                </button>
              ))}
          </div>
        </section>
      )}
    </>
  );
}

function TabChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="tab" aria-selected={on} className={`chip min-h-tap shrink-0 ${on ? 'border-akzent text-akzent bg-akzent/10' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ─────────────────────────── Ticket: Chat links, Aktionen rechts ───────────────────────────

function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const [tk, setTk] = useState<any | null>(null);
  const { run, box } = useAction();
  const load = async () => {
    const r: any = await run(() => api.post(`/mod-api/tickets/${id}/open`, { reason: 'Bearbeitung Ticket' }));
    if (r) setTk(r);
  };
  useEffect(() => {
    load();
  }, [id]);

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)]">
      <div className="flex items-center gap-2 mb-2">
        <button className="btn-ghost px-2" onClick={onBack} aria-label="Zurück zum Postfach">
          ‹ Postfach
        </button>
        {tk && (
          <>
            <span className={`rounded px-1.5 text-xs ${KIND[tk.kind]?.cls ?? ''}`}>{KIND[tk.kind]?.label}</span>
            <h1 className="font-semibold truncate flex-1">{tk.subject}</h1>
            <span className="text-xs muted font-mono">{tk.number}</span>
          </>
        )}
      </div>
      {box}
      {!tk ? (
        <p className="muted">…</p>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
          <Chat tk={tk} onChange={load} />
          <aside className="lg:w-96 shrink-0 overflow-y-auto flex flex-col gap-3 pb-6">
            <TicketCard tk={tk} onChange={load} onClosed={onBack} />
            {tk.report && <ReportCard tk={tk} onChange={load} />}
            {tk.appeal && !tk.appeal.decidedAt && <AppealCard tk={tk} onChange={load} />}
            <PersonCard tk={tk} onChange={load} />
          </aside>
        </div>
      )}
    </div>
  );
}

function Chat({ tk, onChange }: { tk: any; onChange: () => void }) {
  const [text, setText] = useState('');
  const [internal, setInternal] = useState(!tk.canWrite);
  const templates = useAsync(() => api.get('/mod-api/tickets/templates'), []);
  const end = useRef<HTMLDivElement>(null);
  const { run, box } = useAction();
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [tk.messages.length]);
  const closed = tk.status === 'abgeschlossen';
  const send = async () => {
    if (!text.trim()) return;
    const r = await run(() => api.post(`/mod-api/tickets/${tk.id}/reply`, { text, internal }));
    if (r) {
      setText('');
      onChange();
    }
  };
  const personName = tk.person?.name ?? (tk.withoutAccount ? 'Person ohne Konto' : 'Person');
  return (
    <section className="card flex-1 min-h-[24rem] flex flex-col overflow-hidden">
      <header className="px-4 py-2 border-b border-linie text-sm flex items-center gap-2">
        <span className="font-semibold flex-1">{personName}</span>
        <span className="muted text-xs">{tk.replyWay === 'email' && tk.withoutAccount ? 'Antwort per E-Mail' : 'Antwort in der App'}</span>
      </header>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-grund/40">
        <Bubble side="left" who={personName} at={tk.createdAt}>
          {tk.text || <span className="muted">(kein Text)</span>}
          {tk.attachment && <img src={tk.attachment} alt="" className="mt-2 max-h-60 rounded object-contain" />}
        </Bubble>
        {tk.messages.map((m: any, i: number) =>
          m.author === 'system' ? (
            <p key={i} className="self-center text-xs muted text-center px-3">
              {m.text} · {fmtDate(m.at, true)}
            </p>
          ) : m.internal ? (
            <div key={i} className="self-center max-w-[85%] rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm whitespace-pre-wrap">
              <span className="block text-xs text-warn mb-0.5">
                Interne Notiz · {m.staffName ?? 'Team'} · {fmtDate(m.at, true)}
              </span>
              {m.text}
            </div>
          ) : (
            <Bubble key={i} side={m.author === 'team' ? 'right' : 'left'} who={m.author === 'team' ? (m.staffName ?? 'Team') : personName} at={m.at}>
              {m.text}
            </Bubble>
          ),
        )}
        <div ref={end} />
      </div>
      {box}
      {closed ? (
        <p className="p-3 text-sm muted border-t border-linie">Abgeschlossen — keine neuen Nachrichten.</p>
      ) : (
        <footer className="border-t border-linie p-2 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={internal} disabled={!tk.canWrite} onChange={(e) => setInternal(e.target.checked)} />
              Interne Notiz (nur Team)
            </label>
            <select className="input w-auto text-sm py-1" defaultValue="" onChange={(e) => e.target.value && setText(e.target.value)} aria-label="Vorlage">
              <option value="">Vorlage einsetzen …</option>
              {templates.data?.templates.map((tp: any) => (
                <option key={tp.question} value={tp.answer}>
                  {tp.question}
                </option>
              ))}
            </select>
            {!tk.canWrite && <span className="text-xs muted">Kein Gegenüber — nur interne Notizen.</span>}
          </div>
          <div className="flex gap-2 items-end">
            <textarea
              className={`input min-h-[3rem] max-h-40 ${internal ? 'border-warn/60' : ''}`}
              rows={2}
              value={text}
              placeholder={internal ? 'Notiz für das Team …' : 'Nachricht an die Person …'}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className={internal ? 'btn-secondary' : 'btn-primary'} disabled={!text.trim()} onClick={send}>
              {internal ? 'Notieren' : 'Senden'}
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}

function Bubble({ side, who, at, children }: { side: 'left' | 'right'; who: string; at: string; children: ReactNode }) {
  return (
    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${side === 'right' ? 'self-end bg-akzent/20 rounded-br-md' : 'self-start bg-flaeche2 rounded-bl-md'}`}>
      <span className="block text-xs muted mb-0.5">
        {who} · {fmtDate(at, true)}
      </span>
      {children}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-3 text-sm flex flex-col gap-2">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TicketCard({ tk, onChange, onClosed }: { tk: any; onChange: () => void; onClosed: () => void }) {
  const [team, setTeam] = useState<TeamKey>(tk.team);
  const [note, setNote] = useState('');
  const [cat, setCat] = useState<number>(tk.category);
  const [closeReason, setCloseReason] = useState(tk.closeReasons?.[0] ?? 'beantwortet');
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const deadlinePassed = new Date(tk.deadlineAt).getTime() < Date.now();
  const closed = tk.status === 'abgeschlossen';
  return (
    <Panel title="Ticket">
      {box}
      <p>
        {closed ? (
          <span className="muted">Abgeschlossen</span>
        ) : tk.waitingOn === 'person' ? (
          <span className="muted">Person ist dran — keine Frist für das Team.</span>
        ) : (
          <span className={deadlinePassed ? 'text-gefahr font-semibold' : ''}>Antwort fällig bis {fmtDate(tk.deadlineAt, true)}</span>
        )}
      </p>
      <p className="text-xs muted">
        Eingang {fmtDate(tk.createdAt, true)}
        {tk.firstResponseAt ? ` · erste Antwort ${fmtDate(tk.firstResponseAt, true)}` : ' · noch keine Antwort'}
        {tk.relatedRef && tk.kind === 'anfrage' ? ` · Bezug ${tk.relatedRef}` : ''}
      </p>
      <div className="flex items-center gap-2">
        <span className="flex-1">
          {tk.assigned ? (
            <>
              Bearbeitet von <b>{tk.assigned.me ? 'dir' : tk.assigned.name}</b>
            </>
          ) : (
            <span className="muted">Niemand zugewiesen</span>
          )}
        </span>
        {!closed && (
          <button className="btn-ghost px-2" onClick={() => run(() => api.post(`/mod-api/tickets/${tk.id}/assign`, { take: !tk.assigned?.me })).then((r) => r && onChange())}>
            {tk.assigned?.me ? 'Abgeben' : 'Übernehmen'}
          </button>
        )}
      </div>
      {!closed && (
        <>
          <label className="label mb-0">Team</label>
          <div className="flex gap-2">
            <select className="input" value={team} onChange={(e) => setTeam(e.target.value as TeamKey)}>
              {tk.teams.map((x: any) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
            <button
              className="btn-secondary shrink-0"
              disabled={team === tk.team}
              onClick={() => run(() => api.post(`/mod-api/tickets/${tk.id}/team`, { team, note: note || undefined }), 'Weitergegeben.').then((r) => r && (setNote(''), onChange()))}
            >
              Weitergeben
            </button>
          </div>
          {team !== tk.team && <TextArea label="Notiz für das Team (optional)" value={note} onChange={(e) => setNote(e.target.value)} />}
          {tk.kind === 'anfrage' && (
            <div className="flex gap-2 items-center">
              <select className="input" value={cat} onChange={(e) => setCat(Number(e.target.value))} aria-label="Kategorie">
                {Array.from({ length: 10 }, (_, i) => i + 1)
                  .filter((n) => n !== 7)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n} · {t(`UI-HLF-KAT-${n}`)}
                    </option>
                  ))}
              </select>
              <button
                className="btn-ghost shrink-0"
                disabled={cat === tk.category || tooShort(reason, 3)}
                onClick={() => run(() => api.post(`/mod-api/tickets/${tk.id}/category`, { category: cat, reason }), 'Kategorie geändert.').then((r) => r && onChange())}
              >
                Ändern
              </button>
            </div>
          )}
          <label className="label mb-0">Abschließen</label>
          <div className="flex gap-2">
            <select className="input" value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
              {tk.closeReasons?.map((r: string) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button className="btn-secondary shrink-0" onClick={() => run(() => api.post(`/mod-api/tickets/${tk.id}/close`, { closeReason, reason: reason || undefined }), 'Abgeschlossen.').then((r) => r && onClosed())}>
              Schließen
            </button>
          </div>
          {!isOwnerMode() && tk.kind === 'anfrage' && <Reason value={reason} onChange={setReason} label="Begründung (für Kategorie-Wechsel)" min={3} />}
        </>
      )}
    </Panel>
  );
}

function ReportCard({ tk, onChange }: { tk: any; onChange: () => void }) {
  const [details, setDetails] = useState<any | null>(null);
  const [decision, setDecision] = useState('bleibt');
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  const r = tk.report;
  const done = r.status === 'decided' || r.status === 'closed';
  return (
    <Panel title={`Meldung ${r.number}`}>
      {box}
      <p>
        Grund: <b>{r.reason}</b> · Kontext: {r.context} · Status: {r.status}
        {r.decision ? ` · Entscheidung: ${r.decision}` : ''}
      </p>
      <p>
        Gemeldet: {r.target ? <b>{r.target.name ?? 'Konto'}</b> : <span className="muted">kein Konto</span>}
        {r.target?.moderationState && r.target.moderationState !== 'none' ? ` · ${r.target.moderationState}` : ''}
      </p>
      {!details ? (
        <button className="btn-secondary" onClick={async () => setDetails(await run(() => api.post(`/mod-api/reports/${r.id}/open`, { reason: 'Prüfung aus dem Postfach' })))}>
          Markierte Inhalte ansehen (protokolliert)
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {details.items.length === 0 && <p className="muted">Keine markierten Inhalte.</p>}
          {details.items.map((it: any) => (
            <div key={it.id} className="rounded-lg border border-linie p-2">
              <p className="text-xs muted">{it.kind}</p>
              {it.content?.text && <p className="whitespace-pre-wrap">{it.content.text}</p>}
              {it.content?.name && <p>Name: {it.content.name}</p>}
              {it.audio && <audio controls preload="none" src={it.audio} className="w-full mt-1" />}
              {it.image && <img src={it.image} alt="" className="max-h-60 object-contain mt-1" />}
            </div>
          ))}
          <p className="text-xs muted">
            Gemeldetes Konto:{' '}
            {details.target.gone ? 'nicht mehr vorhanden' : `seit ${details.target.accountAgeDays} Tagen · frühere Entscheidungen ${details.target.priorDecisions} · offene Fälle ${details.target.openCases}`}
          </p>
          <p className="text-xs muted">Kontext ausklappen und Nachlauf: im Bereich „Meldungen“.</p>
        </div>
      )}
      {!done && (
        <>
          <select className="input" value={decision} onChange={(e) => setDecision(e.target.value)} aria-label="Entscheidung">
            {DECISIONS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
                {(k === 'eingeschraenkt' || k === 'gesperrt') && (isOwnerMode() ? ' (wirkt sofort)' : ' (Antrag, zweite Person)')}
              </option>
            ))}
          </select>
          <Reason value={reason} onChange={setReason} label="Begründung — geht an die Beteiligten" min={10} />
          <button
            className="btn-primary"
            disabled={tooShort(reason, 10)}
            onClick={async () => {
              const res: any = await run(() => api.post(`/mod-api/reports/${r.id}/decide`, { decision, reason }), 'Entschieden.');
              if (res) {
                setReason('');
                onChange();
              }
            }}
          >
            Entscheiden
          </button>
        </>
      )}
    </Panel>
  );
}

function AppealCard({ tk, onChange }: { tk: any; onChange: () => void }) {
  const [open, setOpen] = useState<any | null>(null);
  const [outcome, setOutcome] = useState('bleibt');
  const [answer, setAnswer] = useState('');
  const [ourError, setOurError] = useState(false);
  const { run, box } = useAction();
  const a = tk.appeal;
  return (
    <Panel title={`${a.kind === 'bild' ? 'Einspruch (Bild)' : 'Widerspruch'} ${a.number}`}>
      {box}
      <p className="text-xs muted">Frist bis {fmtDate(a.deadlineAt, true)}</p>
      {!open ? (
        <button className="btn-secondary" onClick={async () => setOpen(await run(() => api.post(`/mod-api/appeals/${a.id}/open`)))}>
          Ursprungsentscheidung ansehen
        </button>
      ) : (
        <>
          {open.original.hashCase ? (
            <p>Hash-Fall — keine Einzelheiten, kein Bild.</p>
          ) : (
            <>
              <pre className="whitespace-pre-wrap text-xs bg-flaeche2 rounded p-2">{JSON.stringify({ ...open.original, image: undefined }, null, 2)}</pre>
              {open.original.image && <img src={open.original.image} alt="" className="max-h-60 object-contain" />}
            </>
          )}
          {open.disclose && <Banner kind="warn">Du hast die ursprüngliche Entscheidung mit freigegeben — das wird in der Antwort offengelegt.</Banner>}
          {!open.mayDecide ? (
            <Banner kind="warn">Du hast ursprünglich entschieden. Eine andere Person entscheidet.</Banner>
          ) : (
            <>
              <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Ergebnis">
                <option value="bleibt">Bleibt bestehen</option>
                <option value="aufgehoben">Wird aufgehoben</option>
                <option value="abgemildert">Wird abgemildert</option>
              </select>
              <TextArea label="Antwort an die Person — geht auf den Widerspruch ein (mind. 30 Zeichen)" value={answer} onChange={(e) => setAnswer(e.target.value)} />
              <Toggle checked={ourError} onChange={setOurError} label="Vermerk „Fehler bei uns“" />
              <button
                className="btn-primary"
                disabled={answer.trim().length < 30}
                onClick={async () => {
                  const r = await run(() => api.post(`/mod-api/appeals/${a.id}/decide`, { outcome, answer, ourError }), 'Entschieden und beantwortet.');
                  if (r) onChange();
                }}
              >
                Entscheiden
              </button>
            </>
          )}
        </>
      )}
    </Panel>
  );
}

function PersonCard({ tk, onChange }: { tk: any; onChange: () => void }) {
  const [action, setAction] = useState('restrict');
  const [reason, setReason] = useState('');
  const { run, box } = useAction();
  // Sperre: bei Meldungen trifft sie die gemeldete Person (Bezug Meldung), sonst die Person im Ticket (Bezug Ticket)
  const target = tk.report?.target ? { ...tk.report.target, caseRef: tk.report.number, label: 'Gemeldete Person' } : tk.person ? { ...tk.person, caseRef: tk.number, label: 'Person im Ticket' } : null;
  return (
    <>
      {tk.person && (
        <Panel title="Person im Ticket">
          <p>
            <b>{tk.person.name ?? 'ohne Profil'}</b>
            {tk.person.moderationState !== 'none' ? ` · ${tk.person.moderationState}` : ''}
          </p>
          <DataRelease ticket={tk} onChange={onChange} />
        </Panel>
      )}
      {target && (
        <Panel title={`${target.label} sperren`}>
          {box}
          <p className="text-xs muted">
            {target.name ?? 'Konto'} · Zustand {target.moderationState ?? 'none'} · Bezug {target.caseRef}
          </p>
          <select className="input" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Maßnahme">
            {SUSPEND.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <Reason value={reason} onChange={setReason} label="Begründung — geht an die betroffene Person" min={10} />
          <button
            className="btn-danger"
            disabled={tooShort(reason, 10)}
            onClick={async () => {
              const r: any = await run(
                () => api.post('/mod-api/suspensions', { action, reason, caseRef: target.caseRef }),
                isOwnerMode() ? 'Wirkt sofort.' : 'Beantragt — die zweite Person gibt frei.',
              );
              if (r) {
                setReason('');
                onChange();
              }
            }}
          >
            {isOwnerMode() ? 'Sofort ausführen' : 'Beantragen'}
          </button>
        </Panel>
      )}
    </>
  );
}

// ─────────────────────────── Datenfreigabe (Issue #37) ───────────────────────────

const RELEASE_SCOPES: [string, string][] = [
  ['konto', 'Kontodaten'],
  ['profil', 'Profildaten'],
  ['diagnose', 'Diagnosedaten des Geräts'],
];

/** Um Einsicht in Daten bitten — sichtbar erst nach Freigabe durch die Person. */
export function DataRelease({ ticket, onChange }: { ticket: any; onChange: () => void }) {
  const [scope, setScope] = useState<string[]>(['konto', 'diagnose']);
  const [why, setWhy] = useState('');
  const [shown, setShown] = useState<Record<string, any>>({});
  const { run, box } = useAction();
  const hasOpen = ticket.dataRequests.some((r: any) => r.status === 'offen');
  return (
    <div className="flex flex-col gap-2">
      {box}
      <p className="font-semibold text-sm">Zugriff anfragen</p>
      <p className="text-xs muted">Die Person entscheidet in der App. Befristet, jederzeit widerrufbar, endet mit dem Abschluss. Jede Einsicht steht im Zugriffsprotokoll.</p>
      {ticket.dataRequests.map((r: any) => (
        <div key={r.id} className="border-t border-linie pt-2">
          <p>
            {r.scope.join(', ')} · <b>{r.status}</b>
            {r.expiresAt && r.status === 'freigegeben' ? ` bis ${fmtDate(r.expiresAt, true)}` : ''}
          </p>
          <p className="text-xs muted">
            {fmtDate(r.createdAt, true)} · {r.reason}
          </p>
          {r.status === 'freigegeben' && (
            <button
              className="btn-secondary mt-1"
              onClick={async () => {
                const d: any = await run(() => api.post(`/mod-api/tickets/${ticket.id}/data`, { requestId: r.id, reason: 'Bearbeitung Ticket' }));
                if (d) setShown({ ...shown, [r.id]: d.data });
              }}
            >
              Freigegebene Daten ansehen
            </button>
          )}
          {shown[r.id] && <pre className="mt-2 text-xs bg-flaeche2 rounded p-2 overflow-auto max-h-80 whitespace-pre-wrap">{JSON.stringify(shown[r.id], null, 2)}</pre>}
        </div>
      ))}
      {ticket.mayRequestData && !hasOpen && (
        <div className="border-t border-linie pt-2 flex flex-col gap-2">
          <div className="flex gap-3 flex-wrap">
            {RELEASE_SCOPES.map(([k, label]) => (
              <label key={k} className="flex items-center gap-1">
                <input type="checkbox" checked={scope.includes(k)} onChange={(e) => setScope(e.target.checked ? [...scope, k] : scope.filter((x) => x !== k))} />
                {label}
              </label>
            ))}
          </div>
          <TextArea label={isOwnerMode() ? 'Begründung (sieht die Person; als Owner freiwillig)' : 'Begründung (sieht die Person)'} value={why} onChange={(e) => setWhy(e.target.value)} />
          <button
            className="btn-secondary self-start"
            disabled={!scope.length || tooShort(why, 10)}
            onClick={() => run(() => api.post(`/mod-api/tickets/${ticket.id}/data-request`, { scope, reason: why }), 'Anfrage gesendet.').then((r) => r && (setWhy(''), onChange()))}
          >
            Um Freigabe bitten
          </button>
        </div>
      )}
    </div>
  );
}

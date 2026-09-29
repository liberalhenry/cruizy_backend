/** Teamverwaltung (Issue #8, nur Owner) und „Mein Zugang“ (alle). */
import { useState } from 'react';
import { Banner, Sheet, Toggle, useAsync } from '../components/ui';
import { api } from '../lib/api';
import { fmtDate } from '../lib/texts';
import { Card, Reason, useAction } from './common';

interface Member {
  id: string;
  name: string;
  login: string;
  role: 'MOD' | 'BETRIEB';
  founder: boolean;
  createdAt: string;
  disabledAt: string | null;
  lastSeenAt: string | null;
  lastActionAt: string | null;
  passwordChangedAt: string | null;
}

interface Secret {
  title: string;
  login?: string;
  password?: string;
  totp?: { uri: string; secret: string; qr: string };
}

/** Zugangsdaten — nur einmal sichtbar. */
function SecretSheet({ secret, onClose }: { secret: Secret | null; onClose: () => void }) {
  return (
    <Sheet open={!!secret} onClose={onClose} title={secret?.title}>
      {secret && (
        <div className="flex flex-col gap-3 text-sm">
          <Banner kind="warn">Nur jetzt sichtbar. Sicher an die Person übergeben — nicht per Chat oder unverschlüsselter Mail.</Banner>
          {secret.login && (
            <p>
              Kennung: <span className="font-mono">{secret.login}</span>
            </p>
          )}
          {secret.password && (
            <p>
              Einmalpasswort: <span className="font-mono select-all break-all">{secret.password}</span>
              <br />
              <span className="muted">Die Person ändert es nach der ersten Anmeldung unter „Mein Zugang“.</span>
            </p>
          )}
          {secret.totp && (
            <div>
              <p className="mb-2">Zweiter Faktor — mit der Authenticator-App scannen:</p>
              <img src={secret.totp.qr} alt="QR-Code für den zweiten Faktor" className="w-48 h-48 bg-white p-2 rounded-lg" />
              <p className="mt-2 muted">
                Schlüssel zum Abtippen: <span className="font-mono select-all break-all">{secret.totp.secret}</span>
              </p>
            </div>
          )}
          <button className="btn-primary" onClick={onClose}>
            Übergeben — schließen
          </button>
        </div>
      )}
    </Sheet>
  );
}

export function Team({ meId }: { meId: string }) {
  const { data, reload } = useAsync(() => api.get('/mod-api/team'), []);
  const [reason, setReason] = useState('');
  const [neu, setNeu] = useState({ name: '', login: '', role: 'MOD', founder: false });
  const [edit, setEdit] = useState<Member | null>(null);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { run, box } = useAction();
  const reasonOk = reason.trim().length >= 5;
  const items: Member[] = data?.items ?? [];

  const act = async (fn: () => Promise<any>, ok: string, after?: (r: any) => void) => {
    const r = await run(fn, ok);
    if (r) {
      after?.(r);
      reload();
    }
    return r;
  };

  return (
    <>
      <h1 className="text-xl font-semibold mb-1">Team</h1>
      <p className="text-sm muted mb-4">
        Zugänge anlegen, ändern, sperren und löschen. Nur für Owner. Jede Änderung braucht eine Begründung und steht im Zugriffsprotokoll. Es bleibt immer mindestens ein aktiver Owner.
      </p>
      {box}
      <Reason value={reason} onChange={setReason} min={5} />

      <Card title="Neuer Zugang">
        <div className="grid sm:grid-cols-2 gap-2">
          <input className="input" placeholder="Name" value={neu.name} onChange={(e) => setNeu({ ...neu, name: e.target.value })} />
          <input className="input" placeholder="Kennung (a–z, 0–9, . _ -)" value={neu.login} onChange={(e) => setNeu({ ...neu, login: e.target.value.toLowerCase() })} autoComplete="off" />
          <select className="input" value={neu.role} onChange={(e) => setNeu({ ...neu, role: e.target.value })} aria-label="Rolle">
            <option value="MOD">MOD — Moderation</option>
            <option value="BETRIEB">BETRIEB — Moderation und Betrieb</option>
          </select>
          <Toggle checked={neu.founder} onChange={(v) => setNeu({ ...neu, founder: v })} label="Owner (Gründer)" hint="darf das Team verwalten" />
        </div>
        <button
          className="btn-primary mt-2"
          disabled={!reasonOk || neu.name.trim().length < 2 || neu.login.trim().length < 2}
          onClick={() =>
            act(() => api.post('/mod-api/team', { ...neu, reason }), 'Angelegt.', (r) => {
              setSecret({ title: `Zugang für ${neu.name}`, login: r.login, password: r.password, totp: r.totp });
              setNeu({ name: '', login: '', role: 'MOD', founder: false });
            })
          }
        >
          Anlegen
        </button>
      </Card>

      <Card title={`Zugänge (${items.length})`}>
        <table className="w-full text-sm">
          <thead className="text-left muted">
            <tr>
              <th className="py-1">Name</th>
              <th>Kennung</th>
              <th>Rolle</th>
              <th>Zuletzt aktiv</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className={`border-t border-linie ${m.disabledAt ? 'opacity-60' : ''}`}>
                <td className="py-2">
                  {m.name}
                  {m.id === meId ? ' (du)' : ''}
                </td>
                <td className="font-mono">{m.login}</td>
                <td>
                  {m.role}
                  {m.founder ? ' · Owner' : ''}
                  {m.disabledAt ? ' · gesperrt' : ''}
                </td>
                <td className="muted">{m.lastSeenAt ? fmtDate(m.lastSeenAt, true) : '—'}</td>
                <td>
                  <button className="btn-ghost" onClick={() => (setEdit({ ...m }), setConfirmDelete(false))}>
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit ? `${edit.name} · ${edit.login}` : ''}>
        {edit && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="muted">
              angelegt {fmtDate(edit.createdAt)} · letzte Handlung {edit.lastActionAt ? fmtDate(edit.lastActionAt, true) : '—'} · Passwort{' '}
              {edit.passwordChangedAt ? `selbst gesetzt ${fmtDate(edit.passwordChangedAt)}` : 'noch das Einmalpasswort'}
            </p>
            {box}
            <Reason value={reason} onChange={setReason} min={5} />
            <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-label="Name" />
            <select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Member['role'] })} aria-label="Rolle">
              <option value="MOD">MOD — Moderation</option>
              <option value="BETRIEB">BETRIEB — Moderation und Betrieb</option>
            </select>
            <Toggle checked={edit.founder} onChange={(v) => setEdit({ ...edit, founder: v })} label="Owner (Gründer)" hint="Rechte gelten ab der nächsten Anmeldung" />
            <button
              className="btn-primary"
              disabled={!reasonOk}
              onClick={() => act(() => api.patch(`/mod-api/team/${edit.id}`, { name: edit.name, role: edit.role, founder: edit.founder, reason }), 'Gespeichert.')}
            >
              Änderungen speichern
            </button>
            <div className="flex flex-wrap gap-2 border-t border-linie pt-3">
              <button
                className="btn-secondary"
                disabled={!reasonOk}
                onClick={() => act(() => api.post(`/mod-api/team/${edit.id}/password`, { reason }), 'Neues Passwort erzeugt.', (r) => setSecret({ title: `Neues Passwort für ${edit.name}`, login: edit.login, password: r.password }))}
              >
                Neues Passwort
              </button>
              <button
                className="btn-secondary"
                disabled={!reasonOk}
                onClick={() => act(() => api.post(`/mod-api/team/${edit.id}/totp`, { reason }), 'Neuer zweiter Faktor erzeugt.', (r) => setSecret({ title: `Neuer zweiter Faktor für ${edit.name}`, login: edit.login, totp: r.totp }))}
              >
                Neuer zweiter Faktor
              </button>
              {edit.id !== meId &&
                (edit.disabledAt ? (
                  <button className="btn-secondary" disabled={!reasonOk} onClick={() => act(() => api.post(`/mod-api/team/${edit.id}/enable`, { reason }), 'Entsperrt.', () => setEdit(null))}>
                    Entsperren
                  </button>
                ) : (
                  <button className="btn-secondary" disabled={!reasonOk} onClick={() => act(() => api.post(`/mod-api/team/${edit.id}/disable`, { reason }), 'Gesperrt.', () => setEdit(null))}>
                    Sperren
                  </button>
                ))}
            </div>
            {edit.id !== meId && (
              <div className="border-t border-linie pt-3">
                {!confirmDelete ? (
                  <button className="btn-ghost text-gefahr px-0" disabled={!reasonOk} onClick={() => setConfirmDelete(true)}>
                    Zugang löschen …
                  </button>
                ) : (
                  <>
                    <p className="mb-2">
                      Wirklich löschen? Hat die Person schon gehandelt, bleibt ein gesperrter Eintrag ohne Anmeldedaten für das Zugriffsprotokoll bestehen. Die Kennung wird frei.
                    </p>
                    <button className="btn-danger" disabled={!reasonOk} onClick={() => act(() => api.post(`/mod-api/team/${edit.id}/delete`, { reason }), 'Gelöscht.', () => setEdit(null))}>
                      Endgültig löschen
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Sheet>
      <SecretSheet secret={secret} onClose={() => setSecret(null)} />
    </>
  );
}

export function MeinZugang() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const { run, box } = useAction();
  const min = 12;
  return (
    <>
      <h1 className="text-xl font-semibold mb-4">Mein Zugang</h1>
      {box}
      <Card title="Passwort ändern">
        <input className="input mb-2" type="password" placeholder="Bisheriges Passwort" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        <input className="input mb-2" type="password" placeholder={`Neues Passwort (mindestens ${min} Zeichen)`} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        <input className="input mb-2" type="password" placeholder="Neues Passwort wiederholen" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" />
        {repeat && next !== repeat && <p className="text-sm text-gefahr mb-2">Die beiden Eingaben stimmen nicht überein.</p>}
        <button
          className="btn-primary"
          disabled={!current || next.length < min || next !== repeat}
          onClick={async () => {
            const r = await run(() => api.post('/mod-api/me/password', { current, next }), 'Geändert. Andere Sitzungen wurden abgemeldet.');
            if (r) {
              setCurrent('');
              setNext('');
              setRepeat('');
            }
          }}
        >
          Ändern
        </button>
      </Card>
    </>
  );
}

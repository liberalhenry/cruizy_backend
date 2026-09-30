/** Reiter „Ich“: S50 Übersicht · S51 Sicherheit · S52 Check-in · S53 Treffpunkt · S54 Verstecken ·
 * S55 Mitteilungen · S56 Meldungen · S60 Daten · S61/S62 Abo · S63 Einstellungen · S72 Blockiert ·
 * Merkliste · Hilfe und Kontakt · Konto sichern. */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Choice, Empty, Field, Header, Icon, ListCard, Page, RowLink, Section, Sheet, Skeleton, TextArea, Toggle, useAsync } from '../components/ui';
import { Tile, intentionLabel, type TileData } from '../components/tile';
import { ReportSheet, useBlock } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { idbGet, idbSet } from '../lib/idb';
import { currentDisguise, hasPin, hideNow, lockSettings, removePin, setLock, setPin } from '../lib/hide';
import { disablePush, enablePush, isIosSafariNotInstalled, pushSupported } from '../lib/push';
import { fmtDate, fmtKm, parts, plain, t } from '../lib/texts';
import { LocationSheet } from './naehe';
import { SymbolPicker } from './einstieg';
import { CompletenessCard, PremiumTest } from './extras';
import { TelegramHint } from '../components/telegram';
import { collectDiagnostics } from '../lib/diagnostics';

// ─────────────────────────── S50 · Übersicht ───────────────────────────

export function Ich() {
  const nav = useNavigate();
  const { me, unread, logout, refreshMe, toast, dot } = useApp();
  const [feedback, setFeedback] = useState('');
  const [wantsReply, setWantsReply] = useState(false);
  const [recovery, setRecovery] = useState<string | null>(null);
  if (!me) return null;
  const p = me.profile;
  const photo = p.photoMode === 'photo' ? me.photos.find((x: any) => x.status === 'approved')?.url : null;

  return (
    <>
      <Header title={t('UI-TAB-ICH')} />
      <Page>
        <button
          className="card group relative overflow-hidden p-5 w-full flex items-center gap-4 text-left mb-4 transition hover:border-[#3a4254]"
          onClick={() => nav('/ich/profil/bearbeiten')}
          aria-label={t('UI-PROFIL-BEARBEITEN')}
        >
          {/* Schimmer in der eigenen Profilfarbe */}
          <span className="absolute -left-10 -top-16 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: p.color }} aria-hidden="true" />
          <span className="relative rounded-full p-[3px] bg-gradient-to-br from-akzent to-akzent/10">
            <span className="block rounded-full ring-2 ring-flaeche">
              <Avatar name={p.name} color={p.color} photo={photo} size={64} />
            </span>
          </span>
          <span className="relative flex-1 min-w-0">
            <span className="block font-display text-2xl font-bold tracking-tight truncate">{p.name}</span>
            <span className="block text-sm muted truncate">{intentionLabel(p.intention)}</span>
          </span>
          <Icon name="edit" className="relative w-5 h-5 text-leise transition group-hover:text-akzent" />
        </button>

        <CompletenessCard />

        {p.account.restricted && (
          <div className="mb-3">
            <Banner kind="warn">{t('UI-KONTO-EINGESCHRAENKT')}</Banner>
          </div>
        )}
        {p.account.recoveryPrompt && (
          <div className="mb-3">
            <Banner
              action={
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      await api.post('/api/auth/recovery-prompt', { answer: 'gesichert' });
                      refreshMe();
                    }}
                  >
                    {t('UI-WHR-JA')}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={async () => {
                      const r = await api.post('/api/auth/recovery-prompt', { answer: 'neu' });
                      setRecovery(r.recoveryCode);
                      refreshMe();
                    }}
                  >
                    {t('UI-WHR-NEU-ZEIGEN')}
                  </button>
                </div>
              }
            >
              {plain('ST-WHR-03')}
            </Banner>
          </div>
        )}
        {p.agePrompt && (
          <div className="mb-3">
            <Banner
              action={
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      await api.post('/api/profile/age-confirm');
                      refreshMe();
                    }}
                  >
                    {t('UI-ALTER-STIMMT')}
                  </button>
                  <button className="btn-ghost" onClick={() => nav('/ich/profil/bearbeiten')}>
                    {t('UI-ALTER-AENDERN')}
                  </button>
                </div>
              }
            >
              {t('UI-ALTER-NOCH-AKTUELL', { alter: p.age })}
            </Banner>
          </div>
        )}

        <ListCard>
          <RowLink to="/ich/mitteilungen" label={t('ST-SIC-50')} badge={unread ? <span className="rounded-full bg-akzent text-grund px-2 text-xs">{unread}</span> : undefined} />
          <RowLink to="/ich/profil/bearbeiten" label={t('UI-ICH-PROFIL')} hint={t('UI-PROFIL-BEARBEITEN')} />
          <RowLink to="/date/einstellungen" label={t('UI-DATE-TITEL')} hint={t('UI-DATE-ICH-ERKL')} />
          <RowLink to="/veranstalter" label={t('UI-VA-BEREICH')} hint={t('UI-VA-BEREICH-ERKL')} />
          <RowLink to="/ich/reisen" label={t('UI-TRAVEL-TITEL')} hint={me.profile.location?.travel ? t('UI-TRAVEL-AKTIV', { ort: me.profile.location.travel.place }) : undefined} />
          <RowLink to="/ich/besucher" label={t('UI-BESUCHER')} badge={dot.ich ? <span className="rounded-full bg-gefahr text-white px-2 text-xs">{t('UI-APP-NEUES')}</span> : undefined} />
          <RowLink to="/ich/merkliste" label={t('UI-ICH-MERKLISTE')} />
          <RowLink to="/alben" label={t('UI-ALBUM-MEINS')} />
          <RowLink to="/ich/sicherheit" label={t('ST-SIC-01')} hint={t('ST-SIC-02')} />
          <RowLink to="/ich/gesundheit" label={t('UI-TEST-BEREICH')} />
          <RowLink to="/ich/daten" label={t('ST-DAT-01')} />
          <RowLink to="/ich/abo" label={t('UI-ICH-ABO')} />
          <RowLink to="/ich/einstellungen" label={t('UI-ICH-EINSTELLUNGEN')} />
          <RowLink to="/ich/hilfe?neu=1" label={t('UI-SUP-SCHREIBEN')} hint={t('UI-SUP-SCHREIBEN-ERKL')} />
          <RowLink to="/ich/hilfe" label={t('ST-HLF-01')} />
          <RowLink to="/rechtliches/uebersicht" label={t('UI-ICH-RECHTLICHES')} />
        </ListCard>

        <section className="card p-4 mt-6">
          <TextArea label={t('UI-ICH-RUECKMELDUNG')} value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={3000} />
          <Toggle checked={wantsReply} onChange={setWantsReply} label={t('UI-ICH-ANTWORT-GEWUENSCHT')} hint={t('UI-ICH-ANTWORT-HINWEIS')} />
          <button
            className="btn-secondary w-full mt-2"
            disabled={!feedback.trim()}
            onClick={async () => {
              try {
                await api.post('/api/feedback', { text: feedback, wantsReply });
                setFeedback('');
                toast(t('UI-ICH-DANKE'));
              } catch (e) {
                toast(errText(e));
              }
            }}
          >
            {t('UI-APP-SENDEN')}
          </button>
        </section>

        <button className="btn-ghost w-full mt-6" onClick={logout}>
          {t('UI-ICH-ABMELDEN')}
        </button>
      </Page>
      <Sheet open={!!recovery} onClose={() => setRecovery(null)} title={t('UI-WHR-CODE-TITEL')}>
        <p className="mb-3">{t('ST-WHR-02')}</p>
        <div className="card p-4 text-center font-mono text-xl select-all">{recovery}</div>
      </Sheet>
    </>
  );
}

// ─────────────────────────── S51 · Sicherheitszentrum ───────────────────────────

export function Sicherheit() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const conv = params.get('gespraech');
  const [loc, setLoc] = useState(false);
  const [pruefen, setPruefen] = useState(false);
  const [report, setReport] = useState(false);
  const { data: convData } = useAsync(() => (conv ? api.get(`/api/conversations/${conv}`) : Promise.resolve(null)), [conv]);
  const { data: dat } = useAsync(() => api.get('/api/data'), []);
  const { block, sheet } = useBlock();
  const other = convData?.conversation?.other;
  const q = conv ? `?gespraech=${conv}` : '';
  return (
    <div className="min-h-screen">
      <Header title={t('ST-SIC-01')} back />
      <Page>
        <p className="mb-1">{t('ST-FEST-04')}</p>
        <p className="text-sm muted mb-4">{t('ST-SIC-02')}</p>
        <a href="tel:112" className="card p-4 flex items-center gap-3 mb-4 border-gefahr/50">
          <span className="flex-1">{t('ST-MEL-11')}</span>
          <span className="btn-danger">{t('ST-CHK-18')}</span>
        </a>
        {other?.id && (
          <Section title={t('UI-SIC-DIESES-GESPRAECH')}>
            <ListCard>
              <RowLink label={t('UI-SIC-GESPRAECH-MELDEN')} onClick={() => setReport(true)} />
              <RowLink label={t('UI-SIC-GESPRAECH-BLOCKIEREN')} onClick={() => block(other.id, other.name, () => nav('/chats'))} />
            </ListCard>
          </Section>
        )}
        <ListCard>
          <RowLink to={`/ich/check-in${q}`} label={t('ST-SIC-10')} />
          <RowLink to={`/ich/treffpunkt${q}`} label={t('ST-SIC-20')} />
          <RowLink to="/ich/verstecken" label={t('ST-SIC-30')} />
          <RowLink to="/ich/verstecken#symbol" label={t('ST-SIC-40')} />
          <RowLink label={t('UI-SIC-STANDORT')} hint={t('ST-STO-30')} onClick={() => setLoc(true)} />
          <RowLink to="/ich/blockiert" label={t('ST-BLO-09')} />
          <RowLink to="/ich/meldungen" label={t('UI-MELDUNGEN-TITEL')} />
          <RowLink label={t('UI-SIC-WAS-WIR-PRUEFEN')} onClick={() => setPruefen(true)} />
          <RowLink to="/ich/konto-sichern" label={t('UI-KONTO-SICHERN')} />
        </ListCard>
      </Page>
      <LocationSheet open={loc} onClose={() => setLoc(false)} />
      <Sheet open={pruefen} onClose={() => setPruefen(false)} title={t('UI-SIC-WAS-WIR-PRUEFEN')}>
        <p className="whitespace-pre-wrap">{t(dat?.checkZone2 === 'A' ? 'ST-DAT-20-A' : 'ST-DAT-20-B')}</p>
      </Sheet>
      <ReportSheet open={report} onClose={() => setReport(false)} targetId={other?.id} targetName={other?.name} context="gespraech" contextId={conv ?? undefined} onBlocked={() => nav('/chats')} />
      {sheet}
    </div>
  );
}

// ─────────────────────────── S52 · Check-in ───────────────────────────

interface Recipient {
  // Issue #32: Telefonnummern bekommen die Nachricht über den Telegram-Bot
  kind: 'telegram' | 'email';
  to: string;
}

export function CheckIn() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { config, toast, me } = useApp();
  const conv = params.get('gespraech');
  const askId = params.get('frage');
  const relayId = params.get('weiter');
  const { data: cur, reload } = useAsync(() => api.get('/api/checkins/current'), []);
  const { data: help } = useAsync(() => api.get('/api/checkins/help'), []);
  const { data: convData } = useAsync(() => (conv ? api.get(`/api/conversations/${conv}`) : Promise.resolve(null)), [conv]);
  const [mode, setMode] = useState<'treffen' | 'unterwegs'>('treffen');
  const [startMode, setStartMode] = useState<'jetzt' | 'spaeter'>('jetzt');
  const [startAt, setStartAt] = useState('');
  const [effect, setEffect] = useState<'nichts' | 'benachrichtigen'>(me?.profile?.settings?.checkinEffect ?? 'nichts');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState('');
  const [deposit, setDeposit] = useState(false);
  const [newR, setNewR] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mins: number[] = config?.params.checkin ?? [15, 30, 60];
  const otherName = convData?.conversation?.other?.name ?? t('UI-DIE-PERSON');

  // Vertrauenspersonen liegen nur auf diesem Gerät (ST-CHK-08)
  useEffect(() => {
    idbGet<{ recipients: Recipient[]; text: string }>('vertrauen').then((v) => {
      if (v) {
        setRecipients(v.recipients);
        setMessage(v.text);
      }
    });
  }, []);

  // Durchreichen zur fälligen Zeit (Nr. 83 a) — ausgelöst über die Mitteilung
  useEffect(() => {
    if (!relayId) return;
    idbGet<{ recipients: Recipient[]; text: string }>('vertrauen').then(async (v) => {
      if (!v?.recipients.length) return;
      await api.post(`/api/checkins/${relayId}/relay`, v).catch(() => {});
      reload();
    });
  }, [relayId, reload]);

  const saveContacts = (rs: Recipient[], text: string) => idbSet('vertrauen', { recipients: rs, text });

  const create = async () => {
    setErr(null);
    try {
      if (effect === 'benachrichtigen') await saveContacts(recipients, message);
      await api.post('/api/checkins', {
        startsAt: startMode === 'spaeter' && startAt ? new Date(startAt).toISOString() : undefined,
        effect,
        deposit: effect === 'benachrichtigen' && deposit && recipients.length ? { recipients, text: message } : undefined,
      });
      reload();
    } catch (e) {
      setErr(errText(e));
    }
  };

  const answer = async (a: 'ja' | 'nein', again = false) => {
    if (!cur?.checkin) return;
    const r = await api.post(`/api/checkins/${cur.checkin.id}/answer`, { answer: a, again });
    if (r.help) setHelpOpen(true);
    reload();
  };

  const c = cur?.checkin;
  const due = c && c.asked > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('ST-SIC-10')} back />
      <Page className="flex-1">
        {c ? (
          <div className="flex flex-col gap-4">
            <Banner>
              {t('UI-CHECKIN-LAEUFT')} {c.questions.map((q: string) => fmtDate(q, true)).join(' · ')}
            </Banner>
            {(due || askId) && (
              <div className="card p-4">
                <p className="text-lg mb-3">{t('ST-CHK-03')}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-primary" onClick={() => answer('ja')}>
                    {parts('ST-CHK-04')[0]}
                  </button>
                  <button className="btn-danger" onClick={() => answer('nein')}>
                    {parts('ST-CHK-04')[1]}
                  </button>
                </div>
                <button className="btn-ghost w-full mt-2" onClick={() => answer('ja', true)}>
                  {t('ST-CHK-05')}
                </button>
              </div>
            )}
            {c.relayRequested && <Banner kind="warn">{t('UI-CHECKIN-WEITERGEREICHT')}</Banner>}
            <p className="text-sm muted">{t('ST-SIC-14')}</p>
            <button
              className="btn-secondary"
              onClick={async () => {
                await api.del(`/api/checkins/${c.id}`);
                reload();
              }}
            >
              {t('UI-CHECKIN-BEENDEN')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p>{t('ST-SIC-11', { name: otherName })}</p>
            <Choice
              name="vorhaben"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'treffen', label: parts('ST-CHK-01')[0] },
                { value: 'unterwegs', label: parts('ST-CHK-01')[1] },
              ]}
            />
            <div>
              <div className="flex gap-2 mb-2">
                <button className={`chip min-h-tap ${startMode === 'jetzt' ? 'border-akzent text-akzent' : ''}`} onClick={() => setStartMode('jetzt')}>
                  {parts('ST-CHK-02')[0]}
                </button>
                <button className={`chip min-h-tap ${startMode === 'spaeter' ? 'border-akzent text-akzent' : ''}`} onClick={() => setStartMode('spaeter')}>
                  {t('UI-CHECKIN-SPAETER')}
                </button>
              </div>
              {startMode === 'spaeter' && <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} aria-label={t('UI-CHECKIN-BEGINN')} />}
            </div>
            <p className="text-sm">{t('ST-SIC-12').replace('15, 30 und 60', mins.join(', ').replace(/, (\d+)$/, ` ${t('UI-UND')} $1`))}</p>
            <Choice
              name="wirkung"
              value={effect}
              onChange={setEffect}
              options={[
                { value: 'nichts', label: t('UI-CHECKIN-NICHTS') },
                { value: 'benachrichtigen', label: t('UI-CHECKIN-BENACHRICHTIGEN') },
              ]}
            />
            {effect === 'benachrichtigen' && (
              <div className="card p-3 flex flex-col gap-3">
                <p className="text-sm muted">{t('ST-CHK-08')}</p>
                {recipients.length === 0 && <p className="text-sm">{t('ST-CHK-14')}</p>}
                <ul className="flex flex-col gap-1">
                  {recipients.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{r.to}</span>
                      <button className="btn-ghost px-2" onClick={() => setRecipients(recipients.filter((_, j) => j !== i))} aria-label={t('UI-APP-LOESCHEN')}>
                        <Icon name="trash" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input className="input" placeholder={t('UI-CHECKIN-KONTAKT')} value={newR} onChange={(e) => setNewR(e.target.value)} aria-label={t('UI-CHECKIN-KONTAKT')} />
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const v = newR.trim();
                      if (!v) return;
                      setRecipients([...recipients, { kind: v.includes('@') ? 'email' : 'telegram', to: v }]);
                      setNewR('');
                    }}
                  >
                    <Icon name="plus" />
                  </button>
                </div>
                {recipients.some((r) => r.kind === 'telegram') && config?.telegramBot && (
                  <div className="card p-3 text-sm flex flex-col gap-2">
                    <p>{t('UI-TG-CHECKIN-HINWEIS')}</p>
                    <div className="flex gap-2 items-center">
                      <span className="flex-1 font-mono text-xs break-all">{config.telegramBot}</span>
                      <button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(config.telegramBot!).then(() => toast(t('UI-APP-KOPIERT')))}>
                        {t('UI-TG-LINK-KOPIEREN')}
                      </button>
                    </div>
                  </div>
                )}
                <TextArea label={t('UI-CHECKIN-NACHRICHT')} value={message} maxLength={600} onChange={(e) => setMessage(e.target.value)} hint={t('UI-CHECKIN-NACHRICHT-HINWEIS')} />
                <p className="text-sm muted">{plain('ST-CHK-09')}</p>
                <Toggle checked={deposit} onChange={setDeposit} label={t('ST-CHK-15')} hint={!deposit ? t('ST-CHK-16') : undefined} />
              </div>
            )}
            {help?.numbers?.some((n: any) => n.silentApp === 'nora') && <p className="text-sm muted">{t('ST-CHK-06')}</p>}
            {err && <Banner kind="error">{err}</Banner>}
          </div>
        )}
      </Page>
      {!c && (
        <BottomBar>
          <button className="btn-primary" disabled={effect === 'benachrichtigen' && (!recipients.length || !message.trim())} onClick={create}>
            {t('ST-SIC-13')}
          </button>
        </BottomBar>
      )}
      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title={t('ST-CHK-10')}>
        <div className="flex flex-col gap-2">
          {help?.numbers?.map((n: any) => (
            <a key={n.number} href={`tel:${n.number}`} className="btn-danger">
              {t(n.textId).replace('[NOTRUFNUMMER]', n.number)}
            </a>
          ))}
          {help?.numbers?.some((n: any) => n.silentApp === 'nora') && <p className="text-sm">{t('ST-CHK-13')}</p>}
          {help?.numbers?.some((n: any) => n.silentApp === 'dec112') && <p className="text-sm">{t('ST-CHK-19')}</p>}
          {help?.victimLine && <p className="text-sm muted">{t('UI-CHECKIN-OPFERTELEFON', { nummer: help.victimLine })}</p>}
          <button className="btn-secondary" onClick={() => nav('/ich/meldungen')}>
            {t('ST-MEL-01')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S53 · Treffpunkt ───────────────────────────

export function Treffpunkt() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const conv = params.get('gespraech');
  const { toast } = useApp();
  const { data, error } = useAsync(() => api.get(`/api/meeting${conv ? `?conversation=${conv}` : ''}`), [conv]);
  return (
    <div className="min-h-screen">
      <Header title={t('ST-SIC-20')} back />
      <Page>
        <p className="mb-4">{t('ST-SIC-21')}</p>
        {error && <Banner kind="error">{errText(error)}</Banner>}
        {!data ? (
          !error && <Skeleton className="h-40" />
        ) : !data.places.length ? (
          <Empty text={t('ST-LEER-21')} />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.places.map((p: any) => (
              <li key={p.id} className="card p-3">
                <button className="text-left w-full" onClick={() => nav(`/orte/${p.id}`)}>
                  <span className="block font-semibold">
                    {p.name} {p.confirmed && <span className="text-xs text-akzent">✓</span>}
                  </span>
                  <span className="block text-sm muted">
                    {p.district}
                    {p.km !== null && p.km !== undefined ? ` · ${fmtKm(p.km)}` : ''}
                    {p.openToday ? ` · ${t('UI-ORT-HEUTE-OFFEN-KURZ')}` : ''}
                  </span>
                </button>
                {conv && (
                  <button
                    className="btn-secondary w-full mt-2"
                    onClick={async () => {
                      try {
                        await api.post(`/api/conversations/${conv}/place`, { placeId: p.id });
                        nav(`/chats/${conv}`);
                      } catch (e) {
                        toast(errText(e));
                      }
                    }}
                  >
                    {t('UI-TREFFPUNKT-VORSCHLAGEN')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Page>
    </div>
  );
}

// ─────────────────────────── S54 · Verstecken und Tarnung ───────────────────────────

export function Verstecken() {
  const { config, toast } = useApp();
  const len = config?.params.pinLength ?? 4;
  const [pin, setPinValue] = useState('');
  const [has, setHas] = useState(hasPin());
  const [lock, setLockState] = useState(lockSettings());
  const [kind, setKind] = useState(currentDisguise());
  // Issue #38: vor dem Verstecken zeigen, wie es zurückgeht
  const [before, setBefore] = useState(false);
  useEffect(() => {
    if (location.hash === '#symbol') document.getElementById('symbol')?.scrollIntoView();
  }, []);
  const gesture: Record<string, string> = { a: 'UI-TARN-GESTE-A', b: 'UI-TARN-GESTE-B', c: 'UI-TARN-GESTE-C', d: 'UI-TARN-GESTE-D' };
  return (
    <div className="min-h-screen">
      <Header title={t('ST-SIC-30')} back />
      <Page>
        <p className="mb-3">{t('ST-SIC-31')}</p>

        <section id="symbol" className="mb-6">
          <h2 className="font-semibold mb-1">{t('UI-TARN-TITEL')}</h2>
          <p className="text-sm muted mb-3">{t('UI-TARN-ERKL')}</p>
          <SymbolPicker onChange={(k) => setKind(k as typeof kind)} />
          <p className="text-sm mt-3">
            <span className="muted">{t('UI-TARN-ZURUECK')}</span> {t('UI-TARN-ZURUECK-ALLE')}
          </p>
          <p className="text-sm mt-1">
            <span className="muted">{t('UI-TARN-AUSSERDEM')}</span> {t(gesture[kind])}
          </p>
          <p className="text-xs muted mt-2">{t('UI-VERSTECKEN-WEB-GRENZE')}</p>
        </section>

        <section className="card p-4">
          <p className="mb-2">{t('ST-SIC-32', { n: len })}</p>
          {has ? (
            <div className="flex gap-2">
              <span className="flex-1 text-gut">{t('UI-VERSTECKEN-PIN-GESETZT')}</span>
              <button
                className="btn-ghost"
                onClick={() => {
                  removePin();
                  setHas(false);
                  setLockState({ on: false, minutes: lock.minutes });
                }}
              >
                {t('UI-APP-LOESCHEN')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input className="input" type="password" inputMode="numeric" maxLength={len} value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))} aria-label="PIN" />
              <button
                className="btn-primary"
                disabled={pin.length !== len}
                onClick={async () => {
                  await setPin(pin);
                  setPinValue('');
                  setHas(true);
                  toast(t('UI-VERSTECKEN-PIN-GESETZT'));
                }}
              >
                {t('UI-APP-SPEICHERN')}
              </button>
            </div>
          )}
          <div className="mt-3 border-t border-linie pt-3">
            <Toggle
              checked={lock.on}
              disabled={!has}
              onChange={(v) => {
                setLock(v, lock.minutes);
                setLockState(lockSettings());
              }}
              label={t('UI-APPSPERRE')}
              hint={has ? t('UI-APPSPERRE-ERKL') : t('UI-APPSPERRE-PIN-ZUERST')}
            />
            {lock.on && (
              <div className="flex flex-wrap gap-2 mt-1" role="radiogroup" aria-label={t('UI-APPSPERRE-NACH')}>
                <span className="text-sm muted w-full">{t('UI-APPSPERRE-NACH')}</span>
                {[0, 1, 5, 15].map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={lock.minutes === m}
                    className={`chip min-h-tap ${lock.minutes === m ? 'border-akzent text-akzent' : ''}`}
                    onClick={() => {
                      setLock(true, m);
                      setLockState(lockSettings());
                    }}
                  >
                    {m === 0 ? t('UI-APPSPERRE-SOFORT') : t('UI-APPSPERRE-MIN', { min: m })}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <button className="btn-secondary w-full mt-4" onClick={() => setBefore(true)}>
          {t('UI-VERSTECKEN-JETZT')}
        </button>
      </Page>
      <Sheet open={before} onClose={() => setBefore(false)} title={t('UI-TARN-VORHER-TITEL')}>
        <p className="mb-2">{t('UI-TARN-ZURUECK-ALLE')}</p>
        <p className="text-sm muted mb-3">
          {t('UI-TARN-AUSSERDEM')} {t(gesture[kind])}
        </p>
        {!has && <Banner kind="warn">{t('UI-TARN-OHNE-PIN')}</Banner>}
        <button
          className="btn-primary w-full mt-3"
          onClick={() => {
            setBefore(false);
            hideNow();
          }}
        >
          {t('UI-TARN-VORHER-OK')}
        </button>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S55 · Mitteilungen ───────────────────────────

/** Beschriftung des Knopfs „Dorthin“ (Issue #36) — sprechend, wo das Ziel bekannt ist. */
function noticeTargetLabel(n: { kind: string; target: string }): string {
  if (n.kind === 'checkin') return t('ST-CHK-03');
  const byPath: [string, string][] = [
    ['/ich/meldungen', 'UI-MELDUNGEN-TITEL'],
    ['/ich/daten', 'ST-DAT-01'],
    ['/ich/hilfe', 'ST-HLF-01'],
    ['/ich/gesundheit', 'UI-TEST-BEREICH'],
    ['/ich/sicherheit', 'ST-SIC-01'],
    ['/ereignisse/', 'UI-MITTEILUNG-ZUR-VERANSTALTUNG'],
    ['/veranstalter', 'UI-VA-BEREICH'],
    ['/chats', 'UI-MITTEILUNG-ZUM-CHAT'],
    ['/date', 'UI-DATE-TITEL'],
    ['/pruefung', 'UI-MITTEILUNG-ZUR-PRUEFUNG'],
  ];
  const hit = byPath.find(([p]) => n.target.startsWith(p));
  return hit ? `${t(hit[1])} ›` : t('UI-MITTEILUNG-DORTHIN');
}

export function Mitteilungen() {
  const nav = useNavigate();
  const { refreshCounts, toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/notices'), []);
  const [open, setOpen] = useState<any | null>(null);
  const show = async (n: any) => {
    setOpen(n);
    if (!n.read) {
      await api.post(`/api/notices/${n.id}/read`).catch(() => {});
      refreshCounts();
      reload();
    }
  };
  return (
    <div className="min-h-screen">
      <Header title={t('ST-SIC-50')} back />
      <Page>
        {!data ? (
          <Skeleton className="h-40" />
        ) : !data.notices.length ? (
          <Empty text={t('ST-SIC-51')} />
        ) : (
          <ul className="card overflow-hidden">
            {data.notices.map((n: any) => (
              <li key={n.id}>
                <button className="row hover:bg-flaeche2" onClick={() => show(n)}>
                  <span className="flex-1 py-3">
                    <span className={`block ${n.read ? '' : 'font-semibold'}`}>
                      {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-akzent mr-2" aria-label={t('UI-MITTEILUNG-UNGELESEN')} />}
                      {n.title}
                    </span>
                    <span className="block text-sm muted">{fmtDate(n.createdAt, true)}</span>
                  </span>
                  <span className="muted">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Page>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <div className="flex flex-col gap-3">
            <p className="text-sm muted">
              {fmtDate(open.createdAt, true)}
              {open.ref && !['wiederherstellung', 'test_erinnerung', 'veranstaltung', 'date'].includes(open.kind) ? ` · ${open.ref}` : ''}
            </p>
            <p className="whitespace-pre-wrap">{open.body.replace(/\s*\[[^\]]+\]/g, '')}</p>
            {open.kind === 'wiederherstellung' && (
              <button
                className="btn-danger"
                onClick={async () => {
                  await api.post('/api/auth/recover/trusted/cancel', { attemptId: open.ref }).catch(() => {});
                  toast(t('UI-WHR-ABGEBROCHEN'));
                  setOpen(null);
                }}
              >
                {t('UI-WHR-DAS-WAR-ICH-NICHT')}
              </button>
            )}
            {/* Issue #36: ein Knopf dorthin, wo es weitergeht — statt Download als Textdatei */}
            {open.target && (
              <button className="btn-primary" onClick={() => nav(open.target)}>
                {noticeTargetLabel(open)}
              </button>
            )}
            {open.kind === 'test_erinnerung' && open.ref && (
              <a className="btn-secondary" href={open.ref} target="_blank" rel="noopener noreferrer">
                {t('UI-TEST-TESTSTELLEN')} ↗
              </a>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S56 · Meine Meldungen ───────────────────────────

function AppealForm({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button className="btn-secondary mt-2" onClick={() => setOpen(true)}>
        {t('ST-MEL-25')}
      </button>
    );
  return (
    <div className="mt-2">
      <TextArea label={t('UI-WIDERSPRUCH-TEXT')} value={text} maxLength={3000} onChange={(e) => setText(e.target.value)} />
      <button className="btn-primary" disabled={!text.trim()} onClick={() => onSend(text)}>
        {t('UI-APP-SENDEN')}
      </button>
    </div>
  );
}

export function Meldungen() {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/reports/mine'), []);
  const statusText = (r: any) =>
    r.status === 'received' ? t('ST-MEL-18', { datum: fmtDate(r.createdAt) }) : r.status === 'in_review' ? t('ST-MEL-19') : t('ST-MEL-20', { datum: fmtDate(r.decidedAt) });
  const appeal = async (payload: Record<string, string>) => {
    try {
      const r = await api.post('/api/appeals', payload);
      toast(t('ST-MEL-26', { stunden: r.hours }));
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  const decision = (d: string) => t(`UI-ENTSCHEIDUNG-${d.toUpperCase().replace(/_/g, '-')}`);
  return (
    <div className="min-h-screen">
      <Header title={t('UI-MELDUNGEN-TITEL')} back />
      <Page>
        {!data ? (
          <Skeleton className="h-40" />
        ) : (
          <>
            {(data.affecting.length > 0 || data.suspensions.length > 0) && (
              <Section title={t('UI-MELDUNGEN-BETRIFFT-DICH')}>
                <ul className="flex flex-col gap-2">
                  {data.suspensions.map((s: any) => (
                    <li key={s.id} className="card p-3">
                      <p className="font-semibold">{t(s.action === 'restrict' ? 'UI-ENTSCHEIDUNG-EINGESCHRAENKT' : s.action === 'lift' ? 'UI-SPERRE-AUFGEHOBEN-TITEL' : 'UI-ENTSCHEIDUNG-GESPERRT')}</p>
                      <p className="text-sm muted">{fmtDate(s.at, true)}</p>
                      <p className="mt-1">{s.reason}</p>
                      {s.action !== 'lift' && <AppealForm onSend={(text) => appeal({ suspensionId: s.id, text })} />}
                    </li>
                  ))}
                  {data.affecting.map((r: any) => (
                    <li key={r.id} className="card p-3">
                      <p className="font-semibold">
                        {r.number} · {decision(r.decision)}
                      </p>
                      <p className="text-sm muted">{fmtDate(r.decidedAt, true)}</p>
                      <p className="mt-1">{r.reason}</p>
                      <AppealForm onSend={(text) => appeal({ reportId: r.id, text })} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            <Section title={t('UI-MELDUNGEN-EIGENE')}>
              {!data.reports.length ? (
                <Empty text={t('UI-MELDUNGEN-LEER')} />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.reports.map((r: any) => (
                    <li key={r.id} className="card p-3">
                      <p className="font-semibold">{r.number}</p>
                      <p className="text-sm muted">{statusText(r)}</p>
                      {r.decision && <p className="mt-1">{r.decision === 'bleibt' ? t('ST-MEL-22', { name: t('UI-DIE-PERSON') }) : t('ST-MEL-21', { entscheidung: decision(r.decision), begruendung: r.reason ?? '' })}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            {data.appeals.length > 0 && (
              <Section title={t('UI-MELDUNGEN-WIDERSPRUECHE')}>
                <ul className="flex flex-col gap-2">
                  {data.appeals.map((a: any) => (
                    <li key={a.number} className="card p-3">
                      <p className="font-semibold">{a.number}</p>
                      <p className="text-sm muted">{a.decidedAt ? t('ST-MEL-20', { datum: fmtDate(a.decidedAt) }) : t('UI-WIDERSPRUCH-FRIST-BIS', { datum: fmtDate(a.deadlineAt, true) })}</p>
                      {a.outcome && <p className="mt-1">{t(`UI-WIDERSPRUCH-${a.outcome.toUpperCase()}`)}</p>}
                      {a.answer && <p className="mt-1 whitespace-pre-wrap text-sm">{a.answer}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </Page>
    </div>
  );
}

// ─────────────────────────── S60 · Deine Daten ───────────────────────────

export function Daten() {
  const { refreshMe, toast, logout, config } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/data'), []);
  const [pw, setPw] = useState('');
  const [reauth, setReauth] = useState(false);
  const [reauthPw, setReauthPw] = useState('');
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const download = async () => {
    setErr(null);
    try {
      const res = await api.raw('/api/data/export/download');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daten-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setReauth(true);
      else setErr(errText(e));
    }
  };

  if (!data) return <Skeleton className="h-40 m-4" />;
  const cats = data.categories;
  return (
    <div className="min-h-screen">
      <Header title={t('ST-DAT-01')} back />
      <Page>
        <p className="mb-4">{t('ST-DAT-02')}</p>
        <Section title={t('UI-DATEN-GESPEICHERT')}>
          <ListCard>
            {[
              ['konto', t('UI-DATEN-KONTO'), t('UI-DATEN-KONTO-ERKL', { datum: fmtDate(cats.konto.since) })],
              ['profil', t('UI-DATEN-PROFIL'), t('UI-DATEN-PROFIL-ERKL', { zahl: cats.profil.photos })],
              ['nachrichten', t('UI-DATEN-NACHRICHTEN'), t('UI-DATEN-NACHRICHTEN-ERKL', { gespraeche: cats.nachrichten.conversations, nachrichten: cats.nachrichten.ownMessages })],
              ['standort', t('UI-DATEN-STANDORT'), t('UI-DATEN-STANDORT-ERKL', { stufe: t(`UI-STUFE-${String(cats.standort?.level ?? 'grob').toUpperCase()}`) })],
              ['meldungen', t('UI-DATEN-MELDUNGEN'), t('UI-DATEN-MELDUNGEN-ERKL', { zahl: cats.meldungen })],
              ['album', t('UI-DATEN-ALBUM'), t('UI-DATEN-ALBUM-ERKL', { zahl: cats.album })],
            ].map(([k, label, hint]) => (
              <button key={k} className="row" onClick={() => setOpenCat(openCat === k ? null : k)} aria-expanded={openCat === k}>
                <span className="flex-1 py-3">
                  <span className="block">{label}</span>
                  {openCat === k && <span className="block text-sm muted mt-1">{hint}</span>}
                </span>
              </button>
            ))}
          </ListCard>
        </Section>
        <Section title={t('UI-DATEN-EINWILLIGUNGEN')}>
          <ListCard>
            {data.consents.map((c: any) => (
              <div key={c.id} className="row">
                <span className="flex-1 py-3">
                  <span className="block">{t(c.purpose === 'art9' ? 'UI-DATEN-EINWILLIGUNG-ART9' : 'UI-DATEN-EINWILLIGUNG')}</span>
                  <span className="block text-sm muted">
                    {fmtDate(c.granted_at)} · {c.text_version}
                    {c.revoked_at ? ` · ${t('UI-DATEN-WIDERRUFEN', { datum: fmtDate(c.revoked_at) })}` : ''}
                  </span>
                </span>
                {!c.revoked_at && (
                  <button className="btn-ghost" onClick={() => setRevokeId(c.id)}>
                    {t('UI-DATEN-WIDERRUFEN-KNOPF')}
                  </button>
                )}
              </div>
            ))}
          </ListCard>
        </Section>
        <Section title={t('UI-SIC-WAS-WIR-PRUEFEN')}>
          <p className="text-sm whitespace-pre-wrap card p-4">{t(data.checkZone2 === 'A' ? 'ST-DAT-20-A' : 'ST-DAT-20-B')}</p>
        </Section>
        <Section title={t('ST-DAT-03')}>
          <div className="card p-4 flex flex-col gap-3">
            {data.export?.status === 'ready' ? (
              <>
                <p>{t('ST-DAT-05', { tage: data.days })}</p>
                <p className="text-sm muted">{t('ST-DAT-06')}</p>
                <button className="btn-primary" onClick={download}>
                  {t('UI-DATEN-HERUNTERLADEN')}
                </button>
              </>
            ) : data.export?.status === 'queued' ? (
              <p>{t('ST-DAT-04', { stunden: data.hours })}</p>
            ) : (
              <>
                {data.export?.status === 'failed' && <Banner kind="warn">{t('ST-FEH-60')}</Banner>}
                <Field label={t('UI-DATEN-EXPORT-PASSWORT')} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint={t('UI-DATEN-EXPORT-PASSWORT-ERKL')} />
                <button
                  className="btn-primary"
                  disabled={pw.length < 8}
                  onClick={async () => {
                    try {
                      await api.post('/api/data/export', { password: pw });
                      setPw('');
                      reload();
                    } catch (e) {
                      toast(errText(e));
                    }
                  }}
                >
                  {t('ST-DAT-03')}
                </button>
              </>
            )}
            {err && <Banner kind="error">{err}</Banner>}
          </div>
        </Section>
        <Section title={t('ST-DAT-10')}>
          <div className="card p-4 flex flex-col gap-3">
            {data.deletionDueAt ? (
              <>
                <p>{t('ST-DAT-13', { datum: fmtDate(data.deletionDueAt) })}</p>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      await api.post('/api/data/delete/cancel', {});
                    } catch (e) {
                      if (e instanceof ApiError && e.code === 'einwilligung_noetig') {
                        if (confirm(t('ST-KON-27'))) await api.post('/api/data/delete/cancel', { reconsent: true, version: config?.consentVersion });
                        else return;
                      } else {
                        toast(errText(e));
                        return;
                      }
                    }
                    toast(t('ST-DAT-15'));
                    reload();
                    refreshMe();
                  }}
                >
                  {t('ST-DAT-14')}
                </button>
              </>
            ) : (
              <>
                <p>{t('ST-DAT-11')}</p>
                <p className="text-sm muted">{t('ST-DAT-12')}</p>
                <p className="text-sm muted">{t('ST-DAT-19')}</p>
                <p className="text-sm muted">{t('ST-DAT-18')}</p>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    await api.post('/api/data/delete');
                    reload();
                    refreshMe();
                  }}
                >
                  {t('ST-DAT-10')}
                </button>
              </>
            )}
          </div>
        </Section>
      </Page>
      <Sheet open={reauth} onClose={() => setReauth(false)} title={t('UI-NEU-ANMELDEN')}>
        <Field label={t('UI-KONTO-PASSWORT')} type="password" autoComplete="current-password" value={reauthPw} onChange={(e) => setReauthPw(e.target.value)} />
        <button
          className="btn-primary w-full"
          onClick={async () => {
            try {
              await api.post('/api/auth/reauth', { password: reauthPw });
              setReauth(false);
              setReauthPw('');
              download();
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          {t('ST-KON-12')}
        </button>
      </Sheet>
      <Sheet open={!!revokeId} onClose={() => setRevokeId(null)} title={t('UI-DATEN-WIDERRUFEN-KNOPF')}>
        <p className="mb-4">{t('UI-DATEN-WIDERRUF-FOLGE', { tage: data.graceDays })}</p>
        <button
          className="btn-danger w-full"
          onClick={async () => {
            await api.post('/api/data/consent/revoke', { consentId: revokeId });
            setRevokeId(null);
            reload();
            refreshMe();
          }}
        >
          {t('UI-DATEN-WIDERRUFEN-KNOPF')}
        </button>
        <button className="btn-ghost w-full mt-2" onClick={() => logout()}>
          {t('UI-ICH-ABMELDEN')}
        </button>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S61/S62 · Abo ───────────────────────────

export function Abo() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen">
      <Header title={t('ST-ABO-01')} back right={<button className="btn-ghost" onClick={() => nav(-1)}>{t('ST-ABO-21')}</button>} />
      <Page>
        <p className="mb-4">{t('ST-ABO-02')}</p>
        <Banner>{t('UI-ABO-NOCH-NICHT')}</Banner>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-1">PLUS</h2>
            <p className="text-sm">{t('ST-ABO-03')}</p>
            <ul className="text-sm muted mt-2">
              {['ST-ABO-10', 'ST-ABO-11', 'ST-ABO-12', 'ST-ABO-13'].map((id) => (
                <li key={id}>{t(id)}</li>
              ))}
            </ul>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold mb-1">PRO</h2>
            <p className="text-sm">{t('ST-ABO-04')}</p>
            <ul className="text-sm muted mt-2">
              {['ST-ABO-14', 'ST-ABO-15', 'ST-ABO-16', 'ST-ABO-17'].map((id) => (
                <li key={id}>{t(id)}</li>
              ))}
            </ul>
          </div>
        </div>
        <Section title={t('UI-ABO-KOSTENLOS-BLEIBT')}>
          <ul className="card p-4 text-sm flex flex-col gap-1">
            {['UI-ABO-FREI-1', 'UI-ABO-FREI-2', 'UI-ABO-FREI-3', 'UI-ABO-FREI-4', 'UI-ABO-FREI-5'].map((id) => (
              <li key={id}>✓ {t(id)}</li>
            ))}
          </ul>
        </Section>
        <PremiumTest />
        <p className="text-sm muted mt-4">{t('ST-ABO-19')}</p>
      </Page>
    </div>
  );
}

// ─────────────────────────── S63 · Einstellungen ───────────────────────────

/** Issue #35: Mitteilungen zusätzlich per E-Mail oder Telegram. */
function NotifyChannels({ settings: s, patch }: { settings: any; patch: (x: Record<string, unknown>) => Promise<void> }) {
  const { me, toast } = useApp();
  const tg = useAsync(() => api.get('/api/telegram'), []);
  const hasEmail = !!me?.profile?.account?.hasEmail;
  const connect = async () => {
    try {
      const r = await api.post('/api/telegram/link');
      window.open(r.url, '_blank', 'noopener');
    } catch (e) {
      toast(errText(e));
    }
  };
  return (
    <Section title={t('UI-NF-TITEL')}>
      <div className="card p-4 flex flex-col gap-2">
        <p className="text-sm muted">{t('UI-NF-ERKL')}</p>
        <Toggle
          checked={s.notifyEmail}
          disabled={!hasEmail && !s.notifyEmail}
          onChange={(v) => patch({ notifyEmail: v })}
          label={t('UI-NF-EMAIL')}
          hint={hasEmail ? t('UI-NF-EMAIL-HINT') : t('UI-NF-EMAIL-FEHLT')}
        />
        {tg.data && !tg.data.available ? (
          <p className="text-sm muted">{t('UI-NF-TELEGRAM-AUS')}</p>
        ) : tg.data?.linked ? (
          <>
            <Toggle checked={s.notifyTelegram} onChange={(v) => patch({ notifyTelegram: v })} label={t('UI-NF-TELEGRAM')} />
            <button
              className="btn-ghost self-start px-0"
              onClick={async () => {
                await api.del('/api/telegram/link').catch(() => {});
                tg.reload();
                patch({});
              }}
            >
              {t('UI-NF-TELEGRAM-TRENNEN')}
            </button>
          </>
        ) : tg.data ? (
          <div className="flex flex-col gap-1">
            <span>{t('UI-NF-TELEGRAM')}</span>
            <span className="text-sm muted">{t('UI-NF-TELEGRAM-VERBINDEN-ERKL')}</span>
            <div className="flex gap-2 mt-1">
              <button className="btn-secondary" onClick={connect}>
                {t('UI-NF-TELEGRAM-VERBINDEN')} ↗
              </button>
              <button className="btn-ghost" onClick={() => (tg.reload(), patch({}))}>
                {t('UI-NF-GEPRUEFT')}
              </button>
            </div>
          </div>
        ) : null}
        {(s.notifyEmail || s.notifyTelegram) && (
          <Toggle checked={s.notifyContent} onChange={(v) => patch({ notifyContent: v })} label={t('UI-NF-INHALT')} hint={t('UI-NF-INHALT-HINT')} />
        )}
      </div>
    </Section>
  );
}

export function Einstellungen() {
  const nav = useNavigate();
  const { me, config, refreshMe, toast } = useApp();
  const s = me?.profile?.settings;
  const [pushState, setPushState] = useState<string>(() => (pushSupported() ? Notification.permission : 'unsupported'));
  if (!s) return null;
  const patch = async (settings: Record<string, unknown>) => {
    try {
      await api.patch('/api/profile', { settings });
      refreshMe();
    } catch (e) {
      toast(errText(e));
    }
  };
  const media = parts('ST-CHAT-73');
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="min-h-screen">
      <Header title={t('UI-ICH-EINSTELLUNGEN')} back />
      <Page>
        <Section title={t('ST-SIC-50')}>
          <div className="card p-4">
            <Toggle
              checked={s.pushEnabled && pushState === 'granted'}
              onChange={async (v) => {
                if (v) {
                  if (isIosSafariNotInstalled()) return nav('/home-bildschirm');
                  const r = await enablePush(config?.vapidKey ?? '');
                  setPushState(pushSupported() ? Notification.permission : 'unsupported');
                  if (r !== 'ok') toast(t(r === 'blockiert' ? 'ST-REC-06' : 'ST-REC-16'));
                  else patch({ pushEnabled: true });
                } else {
                  await disablePush();
                  patch({ pushEnabled: false });
                }
              }}
              label={t('UI-EINST-MITTEILUNGEN')}
              hint={pushState === 'unsupported' ? t('UI-EINST-PUSH-NICHT-MOEGLICH') : t('ST-REC-11')}
            />
            <Toggle checked={s.pushPreview} onChange={(v) => patch({ pushPreview: v })} label={t('ST-PUSH-04')} hint={t('ST-PUSH-05')} />
            <div className="flex items-center gap-2 mt-2">
              <span className="flex-1">{t('ST-PUSH-20', { von: s.quietFrom, bis: s.quietTo })}</span>
              <select className="input w-20" value={s.quietFrom} onChange={(e) => patch({ quietFrom: Number(e.target.value) })} aria-label={t('UI-EINST-RUHE-VON')}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select className="input w-20" value={s.quietTo} onChange={(e) => patch({ quietTo: Number(e.target.value) })} aria-label={t('UI-EINST-RUHE-BIS')}>
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>
        <NotifyChannels settings={s} patch={patch} />
        <Section title={t('UI-TAB-CHATS')}>
          <div className="card p-4 flex flex-col gap-3">
            <Toggle checked={s.disappearingDefault} onChange={(v) => patch({ disappearingDefault: v })} label={t('ST-CHAT-30')} hint={t('ST-CHAT-31')} />
            <Toggle checked={s.voiceReceive !== false} onChange={(v) => patch({ voiceReceive: v })} label={t('UI-EINST-SPRACHE')} hint={t('UI-EINST-SPRACHE-ERKL')} />
            <Toggle checked={s.startersEnabled !== false} onChange={(v) => patch({ startersEnabled: v })} label={t('UI-EINST-STARTER')} hint={t('UI-EINST-STARTER-ERKL')} />
            <div>
              <p className="mb-2">{media[0]}</p>
              <Choice
                name="bilder"
                value={s.mediaReceive}
                onChange={(v: string) => patch({ mediaReceive: v })}
                options={[
                  { value: 'nach_antwort', label: media[1] },
                  { value: 'bestaetigung', label: media[2] },
                  { value: 'immer', label: media[3] },
                ]}
              />
              <p className="text-xs muted mt-2">{t('ST-CHAT-74')}</p>
            </div>
          </div>
        </Section>
        <Section title={t('UI-PROFIL-ANTWORTQUOTE')}>
          <div className="card p-4">
            <Toggle
              checked={me.profile.responseRate.enabled}
              onChange={async (v) => {
                if (!v && !confirm(t('ST-PRO-14'))) return;
                await api.patch('/api/profile', { responseRate: v });
                refreshMe();
              }}
              label={t('UI-PROFIL-ANTWORTQUOTE')}
              hint={t('ST-PRO-13')}
            />
          </div>
        </Section>
        <Section title={t('UI-TAB-NAEHE')}>
          <div className="card p-4">
            <Toggle checked={s.nameSearchable} onChange={(v) => patch({ nameSearchable: v })} label={t('UI-EINST-AUFFINDBAR')} hint={t('UI-EINST-AUFFINDBAR-ERKL')} />
            <Toggle
              checked={s.gridExpand}
              onChange={(v) => patch({ gridExpand: v })}
              label={t('UI-RASTER-ERWEITERN')}
              hint={t('UI-RASTER-ERWEITERN-ERKL', { zahl: config?.params.gridMin ?? 50, km: (s.gridRadiusKm ?? 10) >= 150 ? s.gridRadiusKm : (s.gridRadiusKm ?? 10) >= 100 ? 150 : 100 })}
            />
          </div>
        </Section>
        <Section title={t('UI-EINST-KONTO')}>
          <ListCard>
            <RowLink to="/ich/konto-sichern" label={t('UI-KONTO-SICHERN')} hint={t('UI-KONTO-SICHERN-ERKL')} />
          </ListCard>
        </Section>
        <Section title={t('UI-ICH-RECHTLICHES')}>
          <ListCard>
            <RowLink to="/rechtliches/impressum" label={t('UI-RECHT-IMPRESSUM')} />
            <RowLink to="/rechtliches/bedingungen" label={t('UI-RECHT-BEDINGUNGEN')} />
            <RowLink to="/rechtliches/datenschutz" label={t('UI-RECHT-DATENSCHUTZ')} />
            <RowLink to="/rechtliches/kontaktstellen" label={t('UI-RECHT-KONTAKTSTELLEN')} />
            <RowLink to="/moderationszeiten" label={t('UI-OEFF-MODZEITEN-TITEL')} />
          </ListCard>
        </Section>
      </Page>
    </div>
  );
}

// ─────────────────────────── Konto sichern (Z-09, Z-10) ───────────────────────────

export function KontoSichern() {
  const { me, toast, refreshMe } = useApp();
  const acc = me?.profile?.account;
  const [code, setCode] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [add, setAdd] = useState<null | 'email' | 'phone'>(null);
  const [addValue, setAddValue] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addSent, setAddSent] = useState(false);
  const [addTelegram, setAddTelegram] = useState<string | null | undefined>(undefined);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      toast(errText(e));
    }
  };
  if (!acc) return null;
  return (
    <div className="min-h-screen">
      <Header title={t('UI-KONTO-SICHERN')} back />
      <Page>
        <Section title={t('UI-WHR-CODE-TITEL')}>
          <div className="card p-4 flex flex-col gap-2">
            <p className="text-sm">{t('ST-WHR-02')}</p>
            {code ? (
              <div className="card p-3 text-center font-mono text-lg select-all">{code}</div>
            ) : (
              <>
                <Field label={t('UI-KONTO-PASSWORT')} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
                <button className="btn-secondary" disabled={!pw} onClick={() => run(async () => setCode((await api.post('/api/auth/recovery-code/new', { password: pw })).recoveryCode))}>
                  {t('UI-WHR-NEU-ERZEUGEN')}
                </button>
              </>
            )}
          </div>
        </Section>
        <Section title={t('UI-WHR-ZWEITER-WEG')}>
          <div className="card p-4 flex flex-col gap-2">
            <p className="text-sm">{plain('ST-WHR-04')}</p>
            <p className="text-sm muted">
              {t('UI-KONTO-EMAIL')}: {acc.hasEmail ? t('UI-APP-ERLEDIGT') : t('UI-APP-OFFEN')} · {t('UI-KONTO-NUMMER')}: {acc.hasPhone ? t('UI-APP-ERLEDIGT') : t('UI-APP-OFFEN')}
            </p>
            {!add ? (
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setAdd('email')}>
                  {t('UI-KONTO-EMAIL')}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setAdd('phone')}>
                  {t('UI-KONTO-NUMMER')}
                </button>
              </div>
            ) : !addSent ? (
              <>
                <Field label={add === 'email' ? t('UI-KONTO-EMAIL') : t('UI-KONTO-NUMMER-TELEGRAM')} value={addValue} onChange={(e) => setAddValue(e.target.value)} hint={t('ST-KON-33')} />
                <button
                  className="btn-primary"
                  onClick={() =>
                    run(async () => {
                      const r = await api.post(`/api/auth/add/${add}`, add === 'email' ? { email: addValue } : { phone: addValue });
                      setAddTelegram(add === 'phone' ? (r.telegram ?? null) : undefined);
                      setAddSent(true);
                    })
                  }
                >
                  {t('UI-KONTO-CODE-SENDEN')}
                </button>
              </>
            ) : (
              <>
                {addTelegram !== undefined && <TelegramHint url={addTelegram} />}
                <Field label={t('UI-KONTO-CODE')} inputMode="numeric" value={addCode} onChange={(e) => setAddCode(e.target.value)} />
                <button
                  className="btn-primary"
                  onClick={() =>
                    run(async () => {
                      await api.post('/api/auth/add/confirm', { kind: add, code: addCode });
                      setAdd(null);
                      setAddSent(false);
                      setAddValue('');
                      setAddCode('');
                      refreshMe();
                    })
                  }
                >
                  {t('ST-KON-12')}
                </button>
              </>
            )}
          </div>
        </Section>
        <Section title={t('UI-WHR-VERTRAUEN')}>
          <div className="card p-4 flex flex-col gap-2">
            <p className="text-sm">{t('ST-WHR-05')}</p>
            {!acc.hasEmail && !acc.hasPhone && <Banner kind="warn">{plain('ST-WHR-08')}</Banner>}
            {key ? (
              <>
                <p className="text-sm">{t('UI-WHR-SCHLUESSEL-WEITERGEBEN')}</p>
                <div className="card p-3 font-mono text-sm break-all select-all">{key}</div>
              </>
            ) : (
              <button className="btn-secondary" disabled={!acc.hasEmail && !acc.hasPhone} onClick={() => run(async () => setKey((await api.post('/api/auth/trusted-key')).key))}>
                {acc.hasTrusted ? t('UI-WHR-SCHLUESSEL-NEU') : t('UI-WHR-SCHLUESSEL-ERZEUGEN')}
              </button>
            )}
            {acc.hasTrusted && (
              <button
                className="btn-ghost"
                onClick={() =>
                  run(async () => {
                    await api.del('/api/auth/trusted-key');
                    setKey(null);
                    refreshMe();
                  })
                }
              >
                {t('UI-WHR-SCHLUESSEL-ENTFERNEN')}
              </button>
            )}
          </div>
        </Section>
        <Section title={t('UI-KONTO-PASSWORT-AENDERN')}>
          <div className="card p-4">
            <Field label={t('UI-KONTO-PASSWORT-ALT')} type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            <Field label={t('UI-KONTO-PASSWORT-NEU')} type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <button
              className="btn-secondary w-full"
              disabled={!newPw}
              onClick={() =>
                run(async () => {
                  await api.post('/api/auth/password', { old: oldPw, new: newPw });
                  setOldPw('');
                  setNewPw('');
                  toast(t('UI-KONTO-PASSWORT-GEAENDERT'));
                })
              }
            >
              {t('UI-APP-SPEICHERN')}
            </button>
          </div>
        </Section>
      </Page>
    </div>
  );
}

// ─────────────────────────── S72 · Blockiert ───────────────────────────

export function Blockiert() {
  const { toast } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/blocks'), []);
  return (
    <div className="min-h-screen">
      <Header title={t('ST-BLO-09')} back />
      <Page>
        <p className="text-sm muted mb-3">{t('ST-BLO-10')}</p>
        {!data ? (
          <Skeleton className="h-32" />
        ) : !data.blocks.length ? (
          <Empty text={t('UI-BLOCKIERT-LEER')} />
        ) : (
          <ul className="card overflow-hidden">
            {data.blocks.map((b: any) => (
              <li key={b.id} className="row">
                <Avatar initial={b.initial} color={b.color} size={36} />
                <span className="flex-1 py-3">
                  <span className="block">{b.name ?? '—'}</span>
                  <span className="block text-sm muted">{b.revocableUntil ? t('UI-BLOCKIERT-BIS', { datum: fmtDate(b.revocableUntil, true) }) : t('UI-BLOCKIERT-ENDGUELTIG')}</span>
                </span>
                {b.revocableUntil && (
                  <button
                    className="btn-ghost"
                    onClick={async () => {
                      try {
                        await api.del(`/api/blocks/${b.id}`);
                        reload();
                      } catch (e) {
                        toast(errText(e));
                      }
                    }}
                  >
                    {t('ST-BLO-04')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Page>
    </div>
  );
}

// ─────────────────────────── Merkliste (F21) ───────────────────────────

export function Merkliste() {
  const nav = useNavigate();
  const { data } = useAsync(() => api.get('/api/bookmarks'), []);
  return (
    <div className="min-h-screen">
      <Header title={t('UI-ICH-MERKLISTE')} back />
      <Page>
        {!data ? (
          <Skeleton className="h-32" />
        ) : !data.tiles.length ? (
          <Empty text={t('ST-LEER-13')} />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {data.tiles.map((x: TileData) => (
              <Tile key={x.id} x={x} onClick={() => nav(`/profil/${x.id}`)} />
            ))}
          </div>
        )}
      </Page>
    </div>
  );
}

// ─────────────────────────── Hilfe und Kontakt (F75) ───────────────────────────

/** Issue #37: ein Vorgang im Support-Postfach — Verlauf, Antwort nur in der App, Datenfreigabe. */
function SupportTicket({ tk, statusLabel, initiallyOpen, onChange }: { tk: any; statusLabel: string; initiallyOpen: boolean; onChange: () => void }) {
  const { me, config, toast, refreshCounts } = useApp();
  const [open, setOpen] = useState(initiallyOpen);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const days = Math.round((config?.params.supportReleaseS ?? 7 * 86400) / 86400);
  useEffect(() => {
    if (initiallyOpen) ref.current?.scrollIntoView({ block: 'start' });
  }, [initiallyOpen]);
  useEffect(() => {
    if (open && tk.unread) api.post(`/api/help/tickets/${tk.id}/read`).then(() => (onChange(), refreshCounts())).catch(() => {});
  }, [open, tk.unread, tk.id]);
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChange();
    } catch (e) {
      toast(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const openRequests = tk.dataRequests.filter((r: any) => r.status === 'offen');
  return (
    <li ref={ref} className="card overflow-hidden">
      <button className="w-full text-left p-3 flex items-center gap-2" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="flex-1">
          <span className="block font-semibold">
            {tk.number}
            {(tk.unread > 0 || openRequests.length > 0) && <span className="ml-2 rounded-full bg-akzent text-grund px-2 text-xs">{t('UI-SUP-NEU')}</span>}
          </span>
          {tk.subject && <span className="block text-sm">{tk.subject}</span>}
          <span className="block text-sm muted">
            {statusLabel} · {fmtDate(tk.createdAt)}
          </span>
        </span>
        <span className="muted">{open ? '▾' : '›'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Bubble mine text={tk.text} at={tk.createdAt} />
            {tk.messages.map((m: any, i: number) => (
              <Bubble key={i} mine={!m.fromTeam} text={m.text} at={m.at} />
            ))}
          </div>
          {tk.dataRequests.map((r: any) => (
            <div key={r.id} className={`rounded-lg border p-3 text-sm flex flex-col gap-2 ${r.status === 'offen' ? 'border-akzent' : 'border-linie'}`}>
              <p className="font-semibold">{t('UI-SUP-FREIGABE-TITEL')}</p>
              {r.status === 'offen' && <p>{t('UI-SUP-FREIGABE-ERKL', { tage: days })}</p>}
              <ul className="list-disc pl-5">
                {r.scope.map((sc: string) => (
                  <li key={sc}>{t(`UI-SUP-BEREICH-${sc.toUpperCase()}`)}</li>
                ))}
              </ul>
              <p>
                <span className="muted">{t('UI-SUP-GRUND')}</span> {r.reason}
              </p>
              <p className="muted">{t(`UI-SUP-STATUS-${r.status}`, { bis: r.expiresAt ? fmtDate(r.expiresAt, true) : '' })}</p>
              {r.status === 'offen' && (
                <div className="flex gap-2">
                  <button
                    className="btn-primary flex-1"
                    disabled={busy}
                    onClick={() =>
                      act(async () =>
                        api.post(`/api/help/data-requests/${r.id}`, {
                          decision: 'freigeben',
                          diagnostics: r.scope.includes('diagnose') ? await collectDiagnostics() : undefined,
                        }),
                      )
                    }
                  >
                    {t('UI-SUP-FREIGEBEN')}
                  </button>
                  <button className="btn-secondary flex-1" disabled={busy} onClick={() => act(() => api.post(`/api/help/data-requests/${r.id}`, { decision: 'ablehnen' }))}>
                    {t('UI-SUP-ABLEHNEN')}
                  </button>
                </div>
              )}
              {r.status === 'freigegeben' && (
                <button className="btn-secondary self-start" disabled={busy} onClick={() => act(() => api.post(`/api/help/data-requests/${r.id}/revoke`))}>
                  {t('UI-SUP-WIDERRUFEN')}
                </button>
              )}
            </div>
          ))}
          {tk.status === 'abgeschlossen' ? (
            <p className="text-sm muted">{t('UI-SUP-ABGESCHLOSSEN')}</p>
          ) : (
            <>
              <div className="flex gap-2 items-end">
                <textarea
                  className="input min-h-[3rem]"
                  rows={2}
                  placeholder={t('UI-SUP-ANTWORT-PLATZHALTER')}
                  value={reply}
                  maxLength={config?.params.ticketMax ?? 4000}
                  onChange={(e) => setReply(e.target.value)}
                  aria-label={t('UI-HILFE-ANTWORTEN')}
                />
                <button
                  className="btn-primary"
                  disabled={busy || !reply.trim()}
                  onClick={() =>
                    act(async () => {
                      await api.post(`/api/help/tickets/${tk.id}/reply`, { text: reply });
                      setReply('');
                    })
                  }
                >
                  {t('UI-APP-SENDEN')}
                </button>
              </div>
              <Toggle
                checked={tk.notifyEmail}
                disabled={!me?.profile?.account?.hasEmail && !tk.notifyEmail}
                onChange={(v) => act(() => api.patch(`/api/help/tickets/${tk.id}`, { notifyEmail: v }))}
                label={t('UI-SUP-MAIL-HINWEIS-SCHALTER')}
                hint={t('UI-SUP-NUR-APP')}
              />
            </>
          )}
        </div>
      )}
    </li>
  );
}

function Bubble({ mine, text, at }: { mine: boolean; text: string; at: string }) {
  return (
    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${mine ? 'self-end bg-akzent/15' : 'self-start bg-flaeche2'}`}>
      <span className="block text-xs muted mb-0.5">
        {mine ? t('UI-SUP-DU') : t('UI-SUP-TEAM')} · {fmtDate(at, true)}
      </span>
      {text}
    </div>
  );
}

export function Hilfe({ publicMode }: { publicMode?: boolean }) {
  const nav = useNavigate();
  const { phase, config, me } = useApp();
  const [search] = useSearchParams();
  const loggedIn = phase === 'mitglied' && !publicMode;
  // Issue #37: /ich/hilfe?vorgang=H-… öffnet den Vorgang, ?neu=1 gleich das Formular
  const focus = search.get('vorgang');
  const [faq, setFaq] = useState<number | null>(null);
  const [form, setForm] = useState(search.get('neu') === '1');
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [category, setCategory] = useState<number | null>(null);
  const [danger, setDanger] = useState(false);
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lookup, setLookup] = useState('');
  const [lookupRes, setLookupRes] = useState<string | null>(null);
  const mine = useAsync(() => (loggedIn ? api.get('/api/help/tickets') : Promise.resolve({ tickets: [] })), [loggedIn, done]);
  const statusLabels = parts('ST-HLF-18');
  const statusIndex: Record<string, number> = { eingegangen: 0, in_bearbeitung: 1, beantwortet: 2, abgeschlossen: 3 };

  const submit = async () => {
    setErr(null);
    try {
      const r = await api.post(
        '/api/help/tickets',
        loggedIn ? { category: category ?? undefined, text, notifyEmail } : { category: category ?? undefined, text, replyWay: 'email', email: email || undefined },
      );
      if (r.redirect === 'widerspruch') {
        setErr(t('ST-HLF-23'));
        return;
      }
      if (file && loggedIn) await api.upload(`/api/help/tickets/${r.id}/attachment`, file).catch(() => {});
      setDone(r.number);
    } catch (e) {
      setErr(errText(e));
    }
  };

  return (
    <div className="min-h-screen">
      <Header title={t('ST-HLF-01')} back={loggedIn ? true : '/'} />
      <Page>
        {done ? (
          <div className="flex flex-col gap-3">
            <Banner kind="ok">{t('ST-HLF-16', { fallnummer: done })}</Banner>
            <p className="muted">{t('ST-HLF-17')}</p>
            <button className="btn-secondary" onClick={() => (setDone(null), setForm(false), setText(''), setCategory(null))}>
              {t('UI-APP-ZURUECK')}
            </button>
          </div>
        ) : !form ? (
          <>
            <h2 className="text-lg font-semibold">{t('ST-HLF-02')}</h2>
            <p className="muted mb-4">{t('ST-HLF-03')}</p>
            <Section title={t('ST-HLF-04')}>
              <ListCard>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => {
                  const k = String(n).padStart(2, '0');
                  return (
                    <div key={n} className="border-b border-linie last:border-b-0">
                      <button className="w-full text-left px-4 py-3 min-h-tap" onClick={() => (n === 20 ? setForm(true) : setFaq(faq === n ? null : n))} aria-expanded={faq === n}>
                        {t(`UI-FAQ-${k}-F`)}
                      </button>
                      {faq === n && <p className="px-4 pb-3 text-sm muted">{t(`UI-FAQ-${k}-A`)}</p>}
                    </div>
                  );
                })}
              </ListCard>
            </Section>
            <button className="btn-primary w-full" onClick={() => setForm(true)}>
              {t('ST-HLF-05')}
            </button>
            {!loggedIn && <p className="text-sm muted mt-3">{t('ST-HLF-20')}</p>}
            {loggedIn && (mine.data?.tickets?.length ?? 0) > 0 && (
              <Section title={t('UI-SUP-POSTFACH')}>
                <ul className="flex flex-col gap-2">
                  {mine.data!.tickets.map((tk: any) => (
                    <SupportTicket key={tk.id} tk={tk} statusLabel={statusLabels[statusIndex[tk.status]] ?? tk.status} initiallyOpen={tk.number === focus} onChange={mine.reload} />
                  ))}
                </ul>
              </Section>
            )}
            {!loggedIn && (
              <Section title={t('UI-HILFE-STAND')}>
                <div className="flex gap-2">
                  <input className="input" placeholder="H-2026-000000" value={lookup} onChange={(e) => setLookup(e.target.value.trim())} aria-label={t('UI-HILFE-FALLNUMMER')} />
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      try {
                        const r = await api.get(`/api/public/tickets/${encodeURIComponent(lookup)}`);
                        setLookupRes(statusLabels[statusIndex[r.status]] ?? r.status);
                      } catch (e) {
                        setLookupRes(errText(e));
                      }
                    }}
                  >
                    {t('UI-HILFE-NACHSEHEN')}
                  </button>
                </div>
                {lookupRes && <p className="mt-2">{lookupRes}</p>}
              </Section>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t('ST-HLF-06')}</h2>
            <label className="label" htmlFor="kat">
              {t('ST-HLF-07')}
            </label>
            <select
              id="kat"
              className="input"
              value={category ?? ''}
              onChange={(e) => {
                const v = Number(e.target.value) || null;
                setCategory(v);
                setDanger(v === 1);
              }}
            >
              {/* Postfach: ohne Anlass landet die Frage im allgemeinen Support */}
              <option value="">{t('UI-HLF-KAT-ALLGEMEIN')}</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {t(`UI-HLF-KAT-${n}`)}
                </option>
              ))}
            </select>
            {danger && (
              <Banner kind="error" action={<a href="tel:112" className="btn-danger">112</a>}>
                {t('ST-HLF-21')}
              </Banner>
            )}
            {category === 7 ? (
              <Banner action={loggedIn ? <button className="btn-secondary" onClick={() => nav('/ich/meldungen')}>{t('ST-MEL-25')}</button> : undefined}>{t('ST-HLF-23')}</Banner>
            ) : (
              <>
                {category === 6 && <p className="text-sm muted">{t('ST-HLF-19')}</p>}
                <TextArea label={t('ST-HLF-08')} value={text} maxLength={config?.params.ticketMax ?? 4000} onChange={(e) => setText(e.target.value)} />
                {loggedIn && (
                  <label className="flex flex-col gap-1">
                    <span className="label">{t('ST-HLF-09')}</span>
                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                )}
                <fieldset>
                  <legend className="label">{t('ST-HLF-10')}</legend>
                  {loggedIn ? (
                    <>
                      <p className="text-sm">{t('ST-HLF-11')}</p>
                      <Toggle
                        checked={notifyEmail}
                        disabled={!me?.profile?.account?.hasEmail}
                        onChange={setNotifyEmail}
                        label={t('UI-SUP-MAIL-HINWEIS-SCHALTER')}
                        hint={me?.profile?.account?.hasEmail ? t('UI-SUP-MAIL-HINWEIS-ERKL') : t('UI-NF-EMAIL-FEHLT')}
                      />
                      <p className="text-sm muted">{t('UI-SUP-NUR-APP')}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm muted">{t('ST-HLF-22')}</p>
                      <Field label={t('UI-KONTO-EMAIL')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </>
                  )}
                </fieldset>
                <p className="text-sm muted">{t('ST-HLF-13')}</p>
                <p className="text-sm muted">{t('ST-HLF-14')}</p>
                {err && <Banner kind="error">{err}</Banner>}
                <button className="btn-primary" disabled={!text.trim() || (!loggedIn && !email)} onClick={submit}>
                  {t('ST-HLF-15')}
                </button>
              </>
            )}
            <button className="btn-ghost" onClick={() => setForm(false)}>
              {t('UI-APP-ZURUECK')}
            </button>
          </div>
        )}
        {!loggedIn && (
          <p className="text-sm mt-8">
            <Link className="text-akzent underline" to="/melden-ohne-konto">
              {t('UI-OEFF-MELDEN-TITEL')}
            </Link>
          </p>
        )}
      </Page>
    </div>
  );
}

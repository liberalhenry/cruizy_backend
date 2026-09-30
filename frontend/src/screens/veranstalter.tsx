/**
 * Veranstalter-Bereich (Issue #16): Verifizierung, eigene Veranstaltungen anlegen und bearbeiten,
 * Bilder, Gästeliste mit Annahme und Chat Veranstalter ↔ Gast.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Empty, Field, Header, Icon, Page, Section, Sheet, Skeleton, TextArea, Toggle, useAsync } from '../components/ui';
import { PinPicker } from '../components/karte';
import { ReportSheet } from '../components/report';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { on } from '../lib/realtime';
import { fmtDate, fmtTime, t } from '../lib/texts';
import { PlacePicker, type PlaceHit } from './reisen';
import { useCategories, VerificationInfo } from './heute';

const STATUS_TEXT: Record<string, string> = {
  pending: 'UI-VA-STATUS-PRUEFUNG',
  approved: 'UI-VA-STATUS-SICHTBAR',
  rejected: 'UI-VA-STATUS-ABGELEHNT',
  cancelled: 'UI-VA-STATUS-ABGESAGT',
};
const STATUS_CLS: Record<string, string> = {
  pending: 'bg-warn/15 text-warn',
  approved: 'bg-gut/15 text-gut',
  rejected: 'bg-gefahr/15 text-gefahr',
  cancelled: 'bg-flaeche2 muted',
};

// ─────────────────────────── Übersicht ───────────────────────────

export function Veranstalter() {
  const nav = useNavigate();
  const { data: org } = useAsync(() => api.get('/api/organizer'), []);
  const { data: mine } = useAsync(() => api.get('/api/host/events'), []);
  const [info, setInfo] = useState(false);
  const o = org?.organizer;
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-VA-BEREICH')}
        back
        right={
          <button className="btn-ghost px-2" onClick={() => setInfo(true)} aria-label={t('UI-VA-INFO-TITEL')}>
            <Icon name="info" />
          </button>
        }
      />
      <Page className="flex-1">
        {!org ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="card p-4 mb-6">
            {org.verified ? (
              <>
                <p className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-akzent text-grund grid place-items-center text-sm">✓</span> {o.name}
                </p>
                <p className="text-sm muted mt-1">{t('UI-VA-VERIFIZIERT-ERKL')}</p>
              </>
            ) : o?.status === 'beantragt' ? (
              <>
                <p className="font-semibold">{t('UI-VA-BEANTRAGT')}</p>
                <p className="text-sm muted mt-1">{t('UI-VA-BEANTRAGT-ERKL', { max: org.maxSubmissions })}</p>
              </>
            ) : (
              <>
                <p className="font-semibold">{t('UI-VA-NICHT-VERIFIZIERT')}</p>
                <p className="text-sm muted mt-1">{t('UI-VA-NICHT-VERIFIZIERT-ERKL', { max: org.maxSubmissions })}</p>
                {o?.note && <p className="text-sm text-warn mt-2">{o.note}</p>}
                <div className="flex gap-2 mt-3">
                  <button className="btn-secondary flex-1" onClick={() => nav('/veranstalter/verifizieren')}>
                    {t('UI-VA-VERIFIZIERUNG-BEANTRAGEN')}
                  </button>
                  <button className="btn-ghost" onClick={() => setInfo(true)}>
                    {t('UI-VA-WIE')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <button className="btn-primary w-full mb-2" onClick={() => nav('/veranstalter/neu')} disabled={!!org && !org.verified && org.openSubmissions >= org.maxSubmissions}>
          <Icon name="plus" /> {org?.verified ? t('UI-VA-NEU') : t('UI-VA-EINREICHEN')}
        </button>
        {org && !org.verified && (
          <p className="text-xs muted mb-6 text-center">{t('UI-VA-EINREICHUNGEN-OFFEN', { zahl: org.openSubmissions, max: org.maxSubmissions })}</p>
        )}

        <Section title={t('UI-VA-MEINE')}>
          {!mine ? (
            <Skeleton className="h-20" />
          ) : mine.events.length === 0 ? (
            <Empty text={t('UI-VA-MEINE-LEER')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {mine.events.map((e: any) => (
                <li key={e.id}>
                  <button className="card w-full p-3 flex gap-3 text-left hover:bg-flaeche2" onClick={() => nav(`/veranstalter/veranstaltungen/${e.id}`)}>
                    {e.cover ? <img src={e.cover} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <span className="w-16 h-16 rounded-lg bg-flaeche2 grid place-items-center text-2xl shrink-0">🎟️</span>}
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{e.title}</span>
                      <span className="block text-sm muted">
                        {fmtDate(e.startsAt, true)} · {e.area}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className={`rounded-full px-2 py-0.5 ${STATUS_CLS[e.status]}`}>{e.over ? t('UI-VA-STATUS-VORBEI') : t(STATUS_TEXT[e.status])}</span>
                        <span>{t('UI-VA-ZAHL-DABEI', { zahl: e.counts.angenommen })}{e.capacity ? ` / ${e.capacity}` : ''}</span>
                        {e.counts.angefragt > 0 && <span className="rounded-full bg-gefahr text-white px-2 py-0.5">{t('UI-VA-ZAHL-ANFRAGEN', { zahl: e.counts.angefragt })}</span>}
                        {e.counts.abgesagt > 0 && <span className="muted">{t('UI-VA-ZAHL-ABGESAGT', { zahl: e.counts.abgesagt })}</span>}
                      </span>
                      {e.note && <span className="block text-xs text-warn mt-1">{e.note}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <p className="text-xs muted mt-6">{t('UI-VA-HAFTUNG-VERANSTALTER')}</p>
      </Page>
      <Sheet open={info} onClose={() => setInfo(false)} title={t('UI-VA-INFO-TITEL')}>
        <VerificationInfo />
      </Sheet>
    </div>
  );
}

// ─────────────────────────── Verifizierung beantragen ───────────────────────────

export function VeranstalterVerifizieren() {
  const nav = useNavigate();
  const { config, toast } = useApp();
  const [f, setF] = useState({ name: '', kind: '', city: '', website: '', email: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.post('/api/organizer', { ...f, website: f.website.trim() || null });
      toast(t('UI-VA-BEANTRAGT'));
      nav('/veranstalter', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) nav('/pruefung?weiter=/veranstalter/verifizieren');
      else setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-VA-VERIFIZIERUNG-BEANTRAGEN')} back />
      <Page className="flex-1 flex flex-col gap-4">
        <p className="text-sm muted">{t('UI-VA-FORM-ERKL')}</p>
        {err && <Banner kind="error">{err}</Banner>}
        <Field label={t('UI-VA-FORM-NAME')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} />
        <label>
          <span className="label">{t('UI-VA-FORM-ART')}</span>
          <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option value="">—</option>
            {(config?.events?.organizerKinds ?? []).map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <Field label={t('UI-VA-FORM-STADT')} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} maxLength={80} />
        <Field label={t('UI-VA-FORM-WEBSITE')} hint={t('UI-VA-FORM-WEBSITE-ERKL')} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} type="url" placeholder="https://" />
        <Field label={t('UI-VA-FORM-MAIL')} hint={t('UI-VA-FORM-MAIL-ERKL')} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" />
        <TextArea label={t('UI-VA-FORM-NOTIZ')} hint={t('UI-VA-FORM-NOTIZ-ERKL')} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={1500} rows={4} />
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={busy || f.name.trim().length < 2 || !f.kind || f.city.trim().length < 2 || !f.email.includes('@')} onClick={send}>
          {t('UI-VA-VERIFIZIERUNG-BEANTRAGEN')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── Anlegen / Bearbeiten ───────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
function toLocalInput(d: string | Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
const FRISTEN = [0, 2, 6, 12, 24, 48, 72, 168];

export function VeranstaltungBearbeiten() {
  const { id } = useParams();
  const nav = useNavigate();
  const { config, toast } = useApp();
  const cats = useCategories();
  const editing = !!id;
  const { data: org } = useAsync(() => api.get('/api/organizer'), []);
  const [loaded, setLoaded] = useState(!editing);
  const [f, setF] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    categories: [] as string[],
    capacity: '' as string,
    approvalRequired: false,
    cancelUntilHours: 0,
    place: null as null | PlaceHit,
    area: '',
    address: '',
    publicVenue: false,
    pin: null as null | { lat: number; lng: number },
    price: '',
    dressCode: '',
    ampel: 'gruen' as 'gruen' | 'gelb' | 'rot',
  });
  const [images, setImages] = useState<any[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [placeCenter, setPlaceCenter] = useState<{ lat: number; lng: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxImages = config?.events?.images ?? 8;
  const textMax = config?.events?.textMax ?? 4000;

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/api/host/events/${id}`)
      .then((r) => {
        const e = r.event;
        setF((x) => ({
          ...x,
          title: e.title,
          description: e.description,
          startsAt: toLocalInput(e.startsAt),
          endsAt: toLocalInput(e.endsAt),
          categories: e.categories,
          capacity: e.capacity ? String(e.capacity) : '',
          approvalRequired: e.approvalRequired,
          cancelUntilHours: e.cancelUntilHours,
          area: e.area ?? '',
          address: e.address ?? '',
          publicVenue: e.publicVenue,
          pin: e.pin,
          price: e.price ?? '',
          dressCode: e.dressCode ?? '',
          ampel: e.ampel,
        }));
        setImages(e.images);
        if (e.pin) setPlaceCenter(e.pin);
        setLoaded(true);
      })
      .catch((e) => setErr(errText(e)));
  }, [editing, id]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        title: f.title,
        description: f.description,
        startsAt: new Date(f.startsAt).toISOString(),
        endsAt: new Date(f.endsAt).toISOString(),
        categories: f.categories,
        capacity: f.capacity ? Number(f.capacity) : null,
        approvalRequired: f.approvalRequired,
        cancelUntilHours: f.cancelUntilHours,
        placeDirId: f.place?.id ?? null,
        address: f.address.trim() || null,
        publicVenue: f.publicVenue,
        pin: f.publicVenue ? f.pin : null,
        price: f.price.trim() || null,
        dressCode: f.dressCode.trim() || null,
        ampel: f.ampel,
      };
      let eventId = id;
      let status: string;
      if (editing) {
        if (!f.place) throw new Error(t('UI-VA-ORT-NEU-WAEHLEN'));
        status = (await api.patch(`/api/host/events/${id}`, body)).status;
      } else {
        const r = await api.post('/api/host/events', body);
        eventId = r.id;
        status = r.status;
      }
      for (const file of pending) {
        await api.upload(`/api/host/events/${eventId}/images`, file);
      }
      toast(t(status === 'approved' ? 'UI-VA-GESPEICHERT-SICHTBAR' : 'UI-VA-GESPEICHERT-PRUEFUNG'));
      nav(`/veranstalter/veranstaltungen/${eventId}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) nav('/pruefung?weiter=/veranstalter/neu');
      else setErr(e instanceof ApiError ? errText(e) : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (imgId: string) => {
    try {
      await api.del(`/api/host/events/${id}/images/${imgId}`);
      setImages(images.filter((i) => i.id !== imgId));
    } catch (e) {
      toast(errText(e));
    }
  };

  const now = toLocalInput(new Date());
  const maxDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (config?.events?.monthsAhead ?? 12));
    return toLocalInput(d);
  })();
  const valid = f.title.trim().length >= 3 && f.startsAt && f.endsAt && f.endsAt > f.startsAt && f.categories.length > 0 && !!f.place;

  if (!loaded) return <div className="min-h-screen"><Header title={t('UI-VA-BEARBEITEN')} back />{err ? <Page><Banner kind="error">{err}</Banner></Page> : <Page><Skeleton className="h-64" /></Page>}</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={editing ? t('UI-VA-BEARBEITEN') : org?.verified ? t('UI-VA-NEU') : t('UI-VA-EINREICHEN')} back />
      <Page className="flex-1 flex flex-col gap-5">
        {org && !org.verified && <Banner>{t('UI-VA-EINREICHUNG-HINWEIS')}</Banner>}
        {err && <Banner kind="error">{err}</Banner>}

        <Field label={t('UI-VA-F-TITEL')} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} />

        <div>
          <span className="label">{t('UI-VA-F-KATEGORIEN', { max: config?.events?.categoryMax ?? 4 })}</span>
          <div className="flex flex-wrap gap-2">
            {cats.list.map((c) => {
              const sel = f.categories.includes(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={sel}
                  disabled={!sel && f.categories.length >= (config?.events?.categoryMax ?? 4)}
                  className={`chip min-h-tap disabled:opacity-40 ${sel ? 'border-akzent text-akzent bg-akzent/10' : ''}`}
                  onClick={() => setF({ ...f, categories: sel ? f.categories.filter((x) => x !== c.key) : [...f.categories, c.key] })}
                >
                  {c.icon} {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label>
            <span className="label">{t('UI-VA-F-BEGINN')}</span>
            <input type="datetime-local" className="input" min={now} max={maxDate} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value, endsAt: f.endsAt && f.endsAt > e.target.value ? f.endsAt : '' })} />
          </label>
          <label>
            <span className="label">{t('UI-VA-F-ENDE')}</span>
            <input type="datetime-local" className="input" min={f.startsAt || now} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} />
          </label>
        </div>
        <p className="text-xs muted -mt-3">{t('UI-VA-F-ZEIT-ERKL', { monate: config?.events?.monthsAhead ?? 12 })}</p>

        <Section title={t('UI-VA-F-ORT')}>
          <div className="flex flex-col gap-3">
            {editing && f.area && !f.place && <p className="text-sm">{t('UI-VA-F-ORT-BISHER', { ort: f.area })}</p>}
            <PlacePicker
              value={f.place}
              onPick={(pl) => {
                setF({ ...f, place: pl, pin: null });
                setPlaceCenter(pl?.lat != null && pl.lng != null ? { lat: pl.lat, lng: pl.lng } : null);
              }}
            />
            <Toggle checked={f.publicVenue} onChange={(v) => setF({ ...f, publicVenue: v, pin: v ? f.pin : null })} label={t('UI-VA-F-OEFFENTLICH')} hint={t('UI-VA-F-OEFFENTLICH-ERKL')} />
            <Field
              label={t('UI-VA-F-ADRESSE')}
              hint={f.publicVenue ? t('UI-VA-F-ADRESSE-OEFFENTLICH') : t('UI-VA-F-ADRESSE-PRIVAT')}
              value={f.address}
              onChange={(e) => setF({ ...f, address: e.target.value })}
              maxLength={200}
            />
            {f.publicVenue && (f.place || f.pin) && (
              <div>
                <span className="label">{t('UI-VA-PIN')}</span>
                <PinPicker around={placeCenter ?? f.pin ?? { lat: 51.2, lng: 10.4 }} value={f.pin} onChange={(p) => setF({ ...f, pin: p })} />
                <p className="text-xs muted mt-1">{f.pin ? t('UI-VA-PIN-GESETZT') : t('UI-VA-PIN-ERKL')}</p>
              </div>
            )}
          </div>
        </Section>

        <TextArea
          label={t('UI-VA-F-BESCHREIBUNG')}
          hint={`${[...f.description].length} / ${textMax} · ${t('UI-VA-F-BESCHREIBUNG-ERKL')}`}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
          rows={7}
          maxLength={textMax}
        />

        <Section title={t('UI-VA-F-BILDER', { max: maxImages })}>
          <div className="grid grid-cols-3 gap-2">
            {images.map((im) => (
              <div key={im.id} className="relative aspect-[3/2] rounded-lg overflow-hidden bg-flaeche2">
                <img src={im.url} alt="" className="w-full h-full object-cover" />
                <button className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/70 grid place-items-center" onClick={() => removeImage(im.id)} aria-label={t('UI-APP-LOESCHEN')}>
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>
            ))}
            {pending.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative aspect-[3/2] rounded-lg overflow-hidden bg-flaeche2">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover opacity-80" />
                <button className="absolute top-1 right-1 w-8 h-8 rounded-full bg-black/70 grid place-items-center" onClick={() => setPending(pending.filter((_, j) => j !== i))} aria-label={t('UI-APP-LOESCHEN')}>
                  <Icon name="close" className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length + pending.length < maxImages && (
              <button className="aspect-[3/2] rounded-lg border border-dashed border-linie grid place-items-center muted hover:bg-flaeche2" onClick={() => fileRef.current?.click()}>
                <Icon name="plus" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])].slice(0, maxImages - images.length - pending.length);
              setPending([...pending, ...files]);
              e.target.value = '';
            }}
          />
          <p className="text-xs muted mt-1">{t('UI-VA-F-BILDER-ERKL')}</p>
        </Section>

        <Section title={t('UI-VA-F-GAESTE')}>
          <div className="flex flex-col gap-3">
            <Field label={t('UI-VA-F-PLAETZE')} hint={t('UI-VA-F-PLAETZE-ERKL')} type="number" min={1} inputMode="numeric" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value.replace(/\D/g, '') })} />
            <Toggle checked={f.approvalRequired} onChange={(v) => setF({ ...f, approvalRequired: v })} label={t('UI-VA-F-ANNAHME')} hint={t('UI-VA-F-ANNAHME-ERKL')} />
            <label>
              <span className="label">{t('UI-VA-F-FRIST')}</span>
              <select className="input" value={f.cancelUntilHours} onChange={(e) => setF({ ...f, cancelUntilHours: Number(e.target.value) })}>
                {FRISTEN.map((h) => (
                  <option key={h} value={h}>
                    {h === 0 ? t('UI-VA-F-FRIST-KEINE') : h < 48 ? t('UI-VA-F-FRIST-STD', { std: h }) : t('UI-VA-F-FRIST-TAGE', { tage: h / 24 })}
                  </option>
                ))}
              </select>
              <span className="block text-xs muted mt-1">{t('UI-VA-F-FRIST-ERKL')}</span>
            </label>
          </div>
        </Section>

        <Section title={t('UI-VA-F-MEHR')}>
          <div className="flex flex-col gap-3">
            <Field label={t('UI-VA-F-PREIS')} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} maxLength={60} placeholder={t('UI-VA-F-PREIS-BSP')} />
            <Field label={t('UI-VA-F-DRESSCODE')} value={f.dressCode} onChange={(e) => setF({ ...f, dressCode: e.target.value })} maxLength={120} />
            <label>
              <span className="label">{t('UI-VA-F-EINSTUFUNG')}</span>
              <select className="input" value={f.ampel} onChange={(e) => setF({ ...f, ampel: e.target.value as 'gruen' | 'gelb' | 'rot' })}>
                <option value="gruen">{t('UI-VA-F-EINSTUFUNG-GRUEN')}</option>
                <option value="gelb">{t('UI-VA-F-EINSTUFUNG-GELB')}</option>
                <option value="rot">{t('UI-VA-F-EINSTUFUNG-ROT')}</option>
              </select>
            </label>
          </div>
        </Section>
        <p className="text-xs muted">{t('UI-VA-HAFTUNG-VERANSTALTER')}</p>
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!valid || busy} onClick={save}>
          {busy ? t('UI-APP-LAEDT') : editing ? t('UI-APP-SPEICHERN') : org?.verified ? t('UI-VA-VEROEFFENTLICHEN') : t('UI-VA-EINREICHEN')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── Verwalten: Gästeliste ───────────────────────────

export function VeranstaltungVerwalten() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, reload, error } = useAsync(() => api.get(`/api/host/events/${id}/guests`), [id]);
  const [tab, setTab] = useState<'angefragt' | 'angenommen' | 'abgesagt'>('angenommen');
  const [cancel, setCancel] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (data && data.counts.angefragt > 0 && tab === 'angenommen' && data.counts.angenommen === 0) setTab('angefragt');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.counts.angefragt]);
  useEffect(() => on('veranstaltung_chat', () => reload()), [reload]);

  const decide = async (guest: string, decision: 'annehmen' | 'ablehnen') => {
    try {
      await api.post(`/api/host/events/${id}/guests/${guest}`, { decision });
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  const doCancel = async () => {
    try {
      await api.post(`/api/host/events/${id}/cancel`, { note: note.trim() || undefined });
      setCancel(false);
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  const remove = async () => {
    try {
      await api.del(`/api/host/events/${id}`);
      nav('/veranstalter', { replace: true });
    } catch (e) {
      toast(errText(e));
    }
  };

  if (error) return <div className="min-h-screen"><Header title="" back /><Page><Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner></Page></div>;
  if (!data) return <div className="min-h-screen"><Header title="" back /><Page><Skeleton className="h-48" /></Page></div>;
  const e = data.event;
  const c = data.counts;
  const list = data.guests.filter((g: any) => (tab === 'abgesagt' ? g.status === 'abgesagt' || g.status === 'abgelehnt' : g.status === tab));
  const over = new Date(e.startsAt) < new Date();
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={e.title} back="/veranstalter" />
      <Page className="flex-1">
        <div className="card p-4 mb-4">
          <p className="text-sm muted">{fmtDate(e.startsAt, true)}</p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div>
              <p className="text-2xl font-bold">{c.belegt}</p>
              <p className="text-xs muted">{e.capacity ? t('UI-VA-VON-PLAETZEN', { zahl: e.capacity }) : t('UI-VA-DABEI')}</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${c.angefragt ? 'text-warn' : ''}`}>{c.angefragt}</p>
              <p className="text-xs muted">{t('UI-VA-ANGEFRAGT')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{c.abgesagt}</p>
              <p className="text-xs muted">{t('UI-VA-ABGESAGT-N')}</p>
            </div>
          </div>
          {e.capacity && (
            <div className="h-2 rounded-full bg-flaeche2 mt-3 overflow-hidden" aria-hidden="true">
              <div className="h-full bg-akzent" style={{ width: `${Math.min(100, (c.belegt / e.capacity) * 100)}%` }} />
            </div>
          )}
          {c.testGaeste > 0 && <p className="text-xs muted mt-2">{t('UI-VA-TESTGAESTE', { zahl: c.testGaeste })}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn-secondary flex-1" onClick={() => nav(`/ereignisse/${id}`)}>
              <Icon name="eye" /> {t('UI-VA-ANSEHEN')}
            </button>
            {e.status !== 'cancelled' && !over && (
              <button className="btn-secondary flex-1" onClick={() => nav(`/veranstalter/veranstaltungen/${id}/bearbeiten`)}>
                <Icon name="edit" /> {t('UI-VA-BEARBEITEN')}
              </button>
            )}
          </div>
          {e.status === 'pending' && <p className="text-sm text-warn mt-3">{t('UI-VA-IN-PRUEFUNG')}</p>}
          {e.status === 'cancelled' && <p className="text-sm text-gefahr mt-3">{t('UI-VA-STATUS-ABGESAGT')}</p>}
        </div>

        <div className="flex gap-2 mb-3" role="tablist">
          {(['angenommen', 'angefragt', 'abgesagt'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`chip min-h-tap ${tab === k ? 'border-akzent text-akzent' : ''}`} onClick={() => setTab(k)}>
              {t(k === 'angenommen' ? 'UI-VA-DABEI' : k === 'angefragt' ? 'UI-VA-ANGEFRAGT' : 'UI-VA-ABGESAGT-N')} ({k === 'abgesagt' ? c.abgesagt + c.abgelehnt : c[k]})
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty text={t('UI-VA-GAESTE-LEER')} />
        ) : (
          <ul className="card overflow-hidden">
            {list.map((g: any) => (
              <li key={g.id} className="flex items-center gap-3 px-3 py-3 border-b border-linie last:border-b-0">
                <button onClick={() => nav(`/profil/${g.id}`)} aria-label={g.name}>
                  <Avatar name={g.name} initial={g.initial} color={g.color} photo={g.photo} size={44} />
                </button>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{g.name}</span>
                  {g.note && <span className="block text-sm muted">„{g.note}“</span>}
                  <span className="block text-xs muted">{fmtDate(g.at, true)}{g.status === 'abgelehnt' ? ` · ${t('UI-VA-ABGELEHNT-KURZ')}` : ''}</span>
                </span>
                {g.status === 'angefragt' && (
                  <span className="flex gap-1">
                    <button className="btn-ghost px-2 text-gefahr" onClick={() => decide(g.id, 'ablehnen')} aria-label={t('UI-VA-ABLEHNEN')}>
                      <Icon name="close" />
                    </button>
                    <button className="btn-primary px-3" onClick={() => decide(g.id, 'annehmen')}>
                      {t('UI-VA-ANNEHMEN')}
                    </button>
                  </span>
                )}
                {g.status === 'angenommen' && (
                  <button className="btn-ghost px-2 relative" onClick={() => nav(`/veranstaltungen/${id}/chat/${g.id}`)} aria-label={t('UI-VA-SCHREIBEN')}>
                    <Icon name="chat" />
                    {g.unread && <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gefahr" />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {e.status === 'approved' && !over && (
          <button className="btn-danger w-full mt-8" onClick={() => setCancel(true)}>
            {t('UI-VA-ABSAGEN-VERANSTALTUNG')}
          </button>
        )}
        {(e.status === 'pending' || e.status === 'rejected') && (
          <button className="btn-danger w-full mt-8" onClick={remove}>
            {t('UI-VA-LOESCHEN')}
          </button>
        )}
      </Page>
      <Sheet open={cancel} onClose={() => setCancel(false)} title={t('UI-VA-ABSAGEN-VERANSTALTUNG')}>
        <p className="text-sm mb-3">{t('UI-VA-ABSAGEN-VERANSTALTUNG-ERKL')}</p>
        <Field label={t('UI-VA-ABSAGE-NOTIZ')} value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={300} />
        <button className="btn-danger w-full mt-3" onClick={doCancel}>
          {t('UI-VA-ABSAGEN-VERANSTALTUNG')}
        </button>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── Chat Veranstalter ↔ Gast ───────────────────────────

export function VeranstaltungChat() {
  const { id, guestId } = useParams();
  const nav = useNavigate();
  const { toast, refreshCounts } = useApp();
  const { data, reload, error } = useAsync(() => api.get(`/api/events/${id}/chat/${guestId}`), [id, guestId]);
  const [text, setText] = useState('');
  const [report, setReport] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => on('veranstaltung_chat', (d: any) => d?.eventId === id && d?.guestId === guestId && reload()), [id, guestId, reload]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
    if (data) refreshCounts();
  }, [data, refreshCounts]);
  const send = async () => {
    if (!text.trim()) return;
    try {
      await api.post(`/api/events/${id}/chat/${guestId}`, { text });
      setText('');
      reload();
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'alterspruefung_noetig' || e.code === 'vertrag_noetig')) nav(`/pruefung?weiter=/veranstaltungen/${id}/chat/${guestId}`);
      else toast(errText(e));
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-grund/95 border-b border-linie flex items-center gap-2 px-2 min-h-[56px] safe-top">
        <button className="btn-ghost px-2" onClick={() => nav(-1)} aria-label={t('UI-APP-ZURUECK')}>
          <Icon name="back" />
        </button>
        {data && <Avatar name={data.other.name} initial={data.other.initial} color={data.other.color} size={36} />}
        <button className="flex-1 min-w-0 text-left" onClick={() => nav(`/ereignisse/${id}`)}>
          <span className="block font-semibold truncate">{data?.other.name}</span>
          <span className="block text-xs muted truncate">🎟️ {data?.event.title}</span>
        </button>
        <button className="btn-ghost" onClick={() => setReport(true)}>
          {t('ST-MEL-01')}
        </button>
      </header>
      <div className="flex-1 max-w-2xl w-full mx-auto px-3 py-3 flex flex-col gap-2">
        {error && <Banner>{t('UI-NICHT-VERFUEGBAR')}</Banner>}
        {data && <p className="text-xs muted text-center mb-2">{t(data.role === 'veranstalter' ? 'UI-VA-CHAT-ERKL-VERANSTALTER' : 'UI-VA-CHAT-ERKL-GAST')}</p>}
        {data?.messages.map((m: any) => (
          <div key={m.id} className={`max-w-[80%] ${m.mine ? 'self-end' : 'self-start'}`}>
            <div className={`rounded-2xl px-3 py-2 whitespace-pre-wrap ${m.mine ? 'bg-gradient-to-br from-[#3d86dd] to-akzentdunkel text-white rounded-br-md' : 'bg-flaeche2 border border-white/[0.05] rounded-bl-md'}`}>{m.text}</div>
            <p className={`text-[11px] muted ${m.mine ? 'text-right' : ''}`}>{fmtTime(m.createdAt)}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      {data?.writable ? (
        <div className="sticky bottom-0 bg-grund/95 border-t border-linie px-3 py-2 safe-bottom flex gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={t('UI-CHAT-NACHRICHT')} aria-label={t('UI-CHAT-NACHRICHT')} />
          <button className="btn-primary px-3" onClick={send} aria-label={t('UI-CHAT-SENDEN')}>
            <Icon name="send" />
          </button>
        </div>
      ) : data ? (
        <p className="text-center text-sm muted py-3 border-t border-linie">{t('UI-VA-CHAT-ZU')}</p>
      ) : null}
      <ReportSheet
        open={report}
        onClose={() => setReport(false)}
        context="veranstaltung_chat"
        targetId={data?.other.id}
        items={(data?.messages ?? []).filter((m: any) => !m.mine).map((m: any) => ({ kind: 'event_chat_message' as const, id: m.id, label: m.text }))}
      />
    </div>
  );
}

/** Liste der Chats mit Veranstaltern bzw. Gästen — eigener Reiter in „Chats“. */
export function VeranstaltungsChats() {
  const nav = useNavigate();
  const { data } = useAsync(() => api.get('/api/event-chats'), []);
  if (!data) return <Skeleton className="h-16" />;
  if (!data.chats.length) return <Empty text={t('UI-VA-CHATS-LEER')} />;
  return (
    <ul className="card overflow-hidden">
      {data.chats.map((c: any) => (
        <li key={`${c.eventId}-${c.guestId}`} className={`border-b border-linie last:border-b-0 ${c.unread ? 'bg-akzent/5' : ''}`}>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-flaeche2" onClick={() => nav(`/veranstaltungen/${c.eventId}/chat/${c.guestId}`)}>
            <span className="relative shrink-0">
              {c.cover ? <img src={c.cover} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <Avatar name={c.other.name} initial={c.other.initial} color={c.other.color} size={48} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block truncate ${c.unread ? 'font-semibold' : ''}`}>{c.other.name}</span>
              <span className="block text-sm muted truncate">
                🎟️ {c.title} · {c.role === 'veranstalter' ? t('UI-VA-ROLLE-GAST') : t('UI-VA-ROLLE-VERANSTALTER')}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1 shrink-0">
              <span className={`text-xs ${c.unread ? 'text-gefahr font-semibold' : 'muted'}`}>{fmtDate(c.lastAt)}</span>
              {c.unread && <span className="w-2.5 h-2.5 rounded-full bg-gefahr" />}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

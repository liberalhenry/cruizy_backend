/** S20 Profil fremd · S21 Profil eigen · S22 Editor · S23 Foto hinzufügen. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Header, Icon, Page, Sheet, Skeleton, TextArea, Toggle, useAsync } from '../components/ui';
import { intentionLabel } from '../components/tile';
import { ReportSheet, useBlock } from '../components/report';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { ACTIVITY_TEXT, fmtDate, fmtKm, t } from '../lib/texts';
import { IntentionPicker } from './einstieg';
import { CompletenessCard, OwnResponseCard, ResponseBadge, ResponseInfo } from './extras';
import { isIosSafariNotInstalled } from '../lib/push';

function traitNames(ids: number[], traits: { items: { id: number; name: string }[] }[] | undefined) {
  const map = new Map<number, string>();
  for (const g of traits ?? []) for (const i of g.items) map.set(i.id, i.name);
  return ids.map((id) => map.get(id)).filter(Boolean) as string[];
}

function genderLabel(g: { category: string | null; text: string | null } | null, genders: any[] | undefined) {
  if (!g) return null;
  if (g.text) return g.text;
  return genders?.find((x) => x.key === g.category)?.label ?? null;
}

/** Fotobereich mit Seitenzahl als Text („2 von 5“). */
function Photos({ photos, fallback }: { photos: { url: string; blurred: boolean }[]; fallback: ReactNode }) {
  const [i, setI] = useState(0);
  if (!photos.length) return <div className="aspect-[3/4] max-h-[60vh] w-full rounded-3xl overflow-hidden">{fallback}</div>;
  const p = photos[Math.min(i, photos.length - 1)];
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-flaeche2 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)]">
        <img key={p.url} src={p.url} alt="" className="w-full max-h-[60vh] object-cover animate-einblenden" />
        {photos.length > 1 && (
          <>
            {/* Fortschritt oben wie bei Geschichten; die Knöpfe unten bleiben für Tastatur und Vorlesen */}
            <div className="absolute top-2.5 inset-x-3 flex gap-1" aria-hidden="true">
              {photos.map((_, k) => (
                <span key={k} className={`h-[3px] flex-1 rounded-full transition ${k === i ? 'bg-white' : k < i ? 'bg-white/60' : 'bg-white/25'}`} />
              ))}
            </div>
            <button className="absolute inset-y-0 left-0 w-1/3" tabIndex={-1} aria-hidden="true" onClick={() => setI(Math.max(0, i - 1))} />
            <button className="absolute inset-y-0 right-0 w-1/3" tabIndex={-1} aria-hidden="true" onClick={() => setI(Math.min(photos.length - 1, i + 1))} />
          </>
        )}
        {p.blurred && <p className="absolute bottom-3 left-3 right-3 text-xs bg-black/65 backdrop-blur rounded-xl px-3 py-2">{t('ST-VER-23')}</p>}
      </div>
      {photos.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)} aria-label={t('UI-PROFIL-FOTO-ZURUECK')}>
            ‹
          </button>
          <span className="zahl text-sm muted">{t('UI-PROFIL-FOTO-VON', { n: i + 1, von: photos.length })}</span>
          <button className="btn-ghost" disabled={i >= photos.length - 1} onClick={() => setI(i + 1)} aria-label={t('UI-PROFIL-FOTO-WEITER')}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}

/** Kurzangaben (Issue #13): Größe, Gewicht, Position, Körpertyp. */
function facts(p: any, config: any): string[] {
  const out: string[] = [];
  if (p.heightCm) out.push(`${p.heightCm} cm`);
  if (p.weightKg) out.push(`${p.weightKg} kg`);
  const pos = config?.positions?.find((x: any) => x.key === p.position)?.label;
  if (pos) out.push(pos);
  for (const b of p.bodyTypes ?? []) {
    const l = config?.bodyTypes?.find((x: any) => x.key === b)?.label;
    if (l) out.push(l);
  }
  return out;
}

function kinkNames(keys: string[], config: any): string[] {
  const all = (config?.kinks ?? []).flatMap((g: any) => g.items);
  return keys.map((k) => all.find((x: any) => x.key === k)?.name).filter(Boolean);
}

function ProfileBody({ p, own }: { p: any; own?: boolean }) {
  const { config } = useApp();
  const [info, setInfo] = useState<null | 'quote' | 'verified' | 'approx'>(null);
  const traits = traitNames(p.traits ?? [], config?.traits);
  const gender = genderLabel(p.gender, config?.genders);
  const fx = facts(p, config);
  const kinks = kinkNames(p.kinks ?? [], config);
  return (
    <>
      <Photos
        photos={p.photos ?? []}
        fallback={
          <div className="w-full h-full grid place-items-center text-7xl font-semibold text-white" style={{ background: p.color }}>
            {p.initial}
          </div>
        }
      />
      <div className="mt-4 flex items-start gap-2">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {p.name}
            {p.age ? <span className="font-light text-leise">, {p.age}</span> : null}
          </h2>
          <p className="muted text-sm">
            {p.km !== null && p.km !== undefined ? fmtKm(p.km) : own ? t('UI-PROFIL-DU') : ''}
            {p.approx && (
              <button className="ml-1 underline" onClick={() => setInfo('approx')}>
                · {t('ST-STO-41')}
              </button>
            )}
            {p.activity ? ` · ${t('ST-PRO-20', { band: t(ACTIVITY_TEXT[p.activity]) })}` : ''}
          </p>
        </div>
        {p.verified && (
          <button className="chip min-h-tap text-akzent border-akzent" onClick={() => setInfo('verified')}>
            ✓ {t('UI-APP-GEPRUEFT')}
          </button>
        )}
      </div>
      {fx.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm" aria-label={t('UI-PROFIL-UEBER-MICH')}>
          {fx.map((f, i) => (
            <li key={i} className="flex items-center gap-3">
              {i > 0 && <span className="muted" aria-hidden="true">·</span>}
              {f}
            </li>
          ))}
        </ul>
      )}
      {p.travel && (
        <p className="mt-2 text-sm text-warn flex items-center gap-1">
          {p.travel.mode === 'flug' ? '✈' : '🚗'} {p.travelPlace ? t('UI-TRAVEL-STOEBERT', { ort: p.travelPlace }) : t(p.travel.mode === 'flug' ? 'UI-TRAVEL-ZEICHEN-FLUG' : 'UI-TRAVEL-ZEICHEN-AUTO')}
        </p>
      )}
      {p.trips?.length > 0 && (
        <ul className="mt-2 text-sm flex flex-col gap-1" aria-label={t('UI-PROFIL-REISEN')}>
          {p.trips.map((tr: any, i: number) => (
            <li key={i} className="flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4 text-akzent" />
              {t('UI-REISE-ZEILE', {
                ort: tr.place,
                von: new Date(`${tr.from}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }),
                bis: new Date(`${tr.to}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric' }),
              })}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3">{intentionLabel(p.intention)}</p>
      <ResponseBadge stage={p.response} onInfo={() => setInfo('quote')} />
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {traits.map((x) => (
            <span key={x} className="chip">
              {x}
            </span>
          ))}
        </div>
      )}
      {p.freeText && <p className="mt-4 whitespace-pre-wrap break-words">{p.freeText}</p>}
      {kinks.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm muted mb-1">{t('UI-PROFIL-KINKS')}</h3>
          <div className="flex flex-wrap gap-2">
            {kinks.map((x) => (
              <span key={x} className="chip">
                {x}
              </span>
            ))}
          </div>
        </section>
      )}
      {gender && <p className="mt-4 text-sm muted">{gender}</p>}
      <ResponseInfo open={info === 'quote'} onClose={() => setInfo(null)} />
      <Sheet open={info === 'verified' || info === 'approx'} onClose={() => setInfo(null)} title={info === 'verified' ? t('UI-APP-GEPRUEFT') : t('ST-STO-41')}>
        <p>{info === 'verified' ? t('ST-VER-22') : t('ST-STO-42')}</p>
      </Sheet>
    </>
  );
}

// ─────────────────────────── S20 · Profil fremd ───────────────────────────

export function ProfilFremd() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useApp();
  const { data, error, loading, reload } = useAsync(() => api.get(`/api/profiles/${id}`), [id]);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const { block, sheet } = useBlock();
  const p = data?.profile;

  const bookmark = async () => {
    try {
      if (p.bookmarked) await api.del(`/api/bookmarks/${id}`);
      else {
        await api.post(`/api/bookmarks/${id}`);
        toast(t('ST-PRO-51'));
      }
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={p?.name ?? ''}
        back
        right={
          p && (
            <button className="btn-ghost px-2" onClick={() => setMenu(true)} aria-label={t('UI-APP-MENUE')}>
              <Icon name="more" />
            </button>
          )
        }
      />
      <Page className="flex-1">
        {loading ? (
          <Skeleton className="aspect-[3/4] w-full" />
        ) : error || !p ? (
          <Banner>{t('UI-PROFIL-WEG')}</Banner>
        ) : (
          <ProfileBody p={p} />
        )}
      </Page>
      {p && (
        <BottomBar>
          <button className="btn-primary" onClick={() => nav(`/chats/neu?an=${id}`)}>
            {t('UI-PROFIL-SCHREIBEN')}
          </button>
          {/* Issue #19: nur, wenn beide Date-Mitglieder sind (vom Server entschieden) */}
          {p.dateProfile && (
            <button className="btn-secondary !border-rose-400/60 !text-rose-200" onClick={() => nav(`/date/u/${id}`)}>
              ♥ {t('UI-DATE-PROFIL-ANSEHEN')}
            </button>
          )}
          <button className="btn-ghost" onClick={bookmark}>
            {p.bookmarked ? t('UI-PROFIL-NICHT-MERKEN') : t('ST-PRO-50')}
          </button>
        </BottomBar>
      )}
      <Sheet open={menu} onClose={() => setMenu(false)} title={p?.name ?? ''}>
        <div className="flex flex-col gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setMenu(false);
              setReport(true);
            }}
          >
            {t('ST-MEL-01')}
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              setMenu(false);
              block(id!, p?.name ?? null, () => nav('/naehe'));
            }}
          >
            {t('ST-BLO-01')}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setMenu(false);
              bookmark();
            }}
          >
            {p?.bookmarked ? t('UI-PROFIL-NICHT-MERKEN') : t('ST-PRO-50')}
          </button>
        </div>
      </Sheet>
      <ReportSheet open={report} onClose={() => setReport(false)} targetId={id} targetName={p?.name} context="profil" onBlocked={() => nav('/naehe')} />
      {sheet}
    </div>
  );
}

// ─────────────────────────── S21 · Profil eigen ───────────────────────────

export function ProfilEigen() {
  const nav = useNavigate();
  const { me } = useApp();
  if (!me) return null;
  const pr = me.profile;
  const preview = {
    ...pr,
    initial: [...(pr.name ?? '?')][0]?.toUpperCase(),
    km: null,
    response: pr.responseRate.enabled ? pr.responseRate.band : null,
    verified: pr.verified.photos,
    photos: pr.photoMode === 'photo' ? me.photos.filter((x: any) => x.status === 'approved').map((x: any) => ({ url: x.url, blurred: false })) : [],
    gender: pr.gender.visible ? pr.gender : null,
  };
  const pending = me.photos.filter((x: any) => x.status === 'queued' || x.status === 'checking');
  const rejected = me.photos.filter((x: any) => x.status === 'rejected');
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-PROFIL-SO-SEHEN-DICH')}
        back="/ich"
        right={
          <button className="btn-ghost px-2" onClick={() => nav('/ich/profil/bearbeiten')} aria-label={t('UI-PROFIL-BEARBEITEN')}>
            <Icon name="edit" />
          </button>
        }
      />
      <Page className="flex-1">
        {pending.length > 0 && (
          <div className="mb-3">
            <Banner>{t('ST-FEH-16', { stunden: 24 })}</Banner>
          </div>
        )}
        {rejected.length > 0 && (
          <div className="mb-3">
            <Banner kind="warn" action={<button className="btn-secondary" onClick={() => nav('/ich/profil/bearbeiten')}>{t('UI-PROFIL-ANSEHEN')}</button>}>
              {t('ST-FEH-12', { grund: t(rejected[0].rejection?.reason ?? 'ST-FEH-13') })}
            </Banner>
          </div>
        )}
        <CompletenessCard />
        <ProfileBody p={preview} own />
        <OwnResponseCard />
        <section className="card mt-6 overflow-hidden">
          <button className="row" onClick={() => nav('/pruefung')}>
            <span className="flex-1 py-3">{t('UI-PROFIL-ALTERSPRUEFUNG')}</span>
            <span className={pr.verified.age ? 'text-gut' : 'muted'}>{pr.verified.age ? t('UI-APP-ERLEDIGT') : t('UI-APP-OFFEN')}</span>
          </button>
          <button className="row" onClick={() => nav('/pruefung?art=face')}>
            <span className="flex-1 py-3">
              <span className="block">{t('ST-VER-20')}</span>
              <span className="block text-sm muted">{t('ST-VER-21')}</span>
            </span>
            <span className={pr.verified.photos ? 'text-gut' : 'muted'}>{pr.verified.photos ? t('UI-APP-ERLEDIGT') : t('UI-APP-OFFEN')}</span>
          </button>
        </section>
      </Page>
      <BottomBar>
        <button className="btn-primary" onClick={() => nav('/ich/profil/bearbeiten')}>
          {t('UI-PROFIL-BEARBEITEN')}
        </button>
      </BottomBar>
    </div>
  );
}

// ─────────────────────────── S22 · Editor ───────────────────────────

export function ProfilEditor() {
  const nav = useNavigate();
  const { me, config, refreshMe, toast } = useApp();
  const pr = me?.profile;
  const [name, setName] = useState(pr?.name ?? '');
  const [age, setAge] = useState<string>(pr?.age ? String(pr.age) : '');
  const [height, setHeight] = useState<string>(pr?.heightCm ? String(pr.heightCm) : '');
  const [weight, setWeight] = useState<string>(pr?.weightKg ? String(pr.weightKg) : '');
  const [position, setPosition] = useState<string | null>(pr?.position ?? null);
  const [bodyTypes, setBodyTypes] = useState<string[]>(pr?.bodyTypes ?? []);
  const [kinks, setKinks] = useState<string[]>(pr?.kinks ?? []);
  const [kinksOpen, setKinksOpen] = useState<boolean>((pr?.kinks ?? []).length > 0);
  const [traits, setTraits] = useState<number[]>(pr?.traits ?? []);
  const [freeText, setFreeText] = useState(pr?.freeText ?? '');
  const [gender, setGender] = useState(pr?.gender ?? { category: null, text: null, visible: false });
  const [seeGroups, setSeeGroups] = useState<string[]>(pr?.seeGroups ?? []);
  const [responseRate, setResponseRate] = useState<boolean>(pr?.responseRate?.enabled ?? true);
  const [confirmRR, setConfirmRR] = useState(false);
  const [intention, setIntention] = useState<{ key: string | null; duration: string | null }>({
    key: pr?.intention?.key ?? null,
    duration: pr?.intention?.duration ?? null,
  });
  const [intentionBusy, setIntentionBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoMenu, setPhotoMenu] = useState<any | null>(null);
  const photos = me?.photos ?? [];
  const max = config?.params.traitsMax ?? 10;
  const photosMax = config?.params.photosMax ?? 20;
  const textMax = config?.params.freeTextMax ?? 2000;
  const bodyMax = config?.params.bodyTypesMax ?? 3;
  const kinksMax = config?.params.kinksMax ?? 12;

  // Sprungmarken aus den Tipps zur Vollständigkeit (Issue #29): /ich/profil/bearbeiten#fotos
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, []);

  if (!pr) return null;
  const num = (v: string) => (v ? Number(v) : null);
  const dirty =
    name !== pr.name ||
    age !== (pr.age ? String(pr.age) : '') ||
    height !== (pr.heightCm ? String(pr.heightCm) : '') ||
    weight !== (pr.weightKg ? String(pr.weightKg) : '') ||
    position !== (pr.position ?? null) ||
    JSON.stringify(bodyTypes) !== JSON.stringify(pr.bodyTypes ?? []) ||
    JSON.stringify(kinks) !== JSON.stringify(pr.kinks ?? []) ||
    JSON.stringify(traits) !== JSON.stringify(pr.traits) ||
    freeText !== pr.freeText ||
    JSON.stringify(gender) !== JSON.stringify(pr.gender) ||
    JSON.stringify(seeGroups) !== JSON.stringify(pr.seeGroups) ||
    responseRate !== pr.responseRate.enabled;

  const heightBad = !!height && (Number(height) < 120 || Number(height) > 230);
  const weightBad = !!weight && (Number(weight) < 35 || Number(weight) > 250);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.patch('/api/profile', {
        name,
        age: age ? Number(age) : null,
        heightCm: num(height),
        weightKg: num(weight),
        position,
        bodyTypes,
        kinks,
        traits,
        freeText,
        gender,
        seeGroups,
        responseRate,
      });
      setHint(r.hint ?? null);
      await refreshMe();
      if (!r.hint) nav('/ich/profil');
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  // Absicht und Dauer werden sofort gespeichert. Die Auswahl zeigt lokal den gewählten Wert —
  // vorher stand dort immer der Standardwert, das Antippen einer Dauer schien wirkungslos (Issue #4).
  const saveIntention = async (key: string | null, duration: string | null) => {
    const before = intention;
    setIntention({ key, duration });
    setIntentionBusy(true);
    try {
      const r = await api.put('/api/profile/intention', { key, duration: duration ?? undefined });
      await refreshMe();
      if (key && r.expiresAt) toast(t('UI-DAUER-GESPEICHERT', { zeit: fmtDate(r.expiresAt, true) }));
    } catch (e) {
      setIntention(before);
      toast(errText(e));
    } finally {
      setIntentionBusy(false);
    }
  };

  const photoAction = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await refreshMe();
    } catch (e) {
      toast(errText(e));
    }
  };
  const move = (i: number, d: number) => {
    const ids = photos.map((x: any) => x.id);
    const [x] = ids.splice(i, 1);
    ids.splice(i + d, 0, x);
    photoAction(() => api.put('/api/photos/order', { ids }));
  };
  const toggleIn = <T,>(list: T[], v: T, limit: number) => (list.includes(v) ? list.filter((x) => x !== v) : list.length >= limit ? list : [...list, v]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-PROFIL-BEARBEITEN')}
        back
        right={
          <button className="btn-ghost px-2" onClick={() => nav('/ich/profil')} aria-label={t('UI-PROFIL-VORSCHAU')}>
            <Icon name="eye" />
            <span className="text-xs hidden sm:inline">{t('UI-PROFIL-VORSCHAU')}</span>
          </button>
        }
      />
      <Page className="flex-1">
        <section id="fotos" className="mb-6 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-semibold">{t('UI-PROFIL-FOTOS')}</h2>
            <span className="text-sm muted">{t('UI-FOTOS-ANZAHL', { zahl: photos.length, max: photosMax })}</span>
          </div>
          <p className="text-sm muted mb-3">{t('ST-PRO-60')}</p>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((ph: any, i: number) => (
              <li key={ph.id} className="relative">
                <button className="block w-full aspect-[3/4] rounded-xl overflow-hidden bg-flaeche2 border border-linie" onClick={() => setPhotoMenu({ ...ph, index: i })} aria-label={t('UI-APP-MENUE')}>
                  {ph.url && <img src={ph.url} alt="" className={`w-full h-full object-cover ${ph.blurred ? 'blur-md scale-110' : ''}`} />}
                </button>
                {i === 0 && <span className="absolute top-1 left-1 rounded-full bg-akzent text-grund text-[10px] px-1.5 py-0.5 font-semibold">1</span>}
                <span
                  className={`absolute bottom-1 left-1 right-1 rounded-md text-[10px] px-1 py-0.5 text-center ${
                    ph.status === 'approved' ? 'bg-black/60' : ph.status === 'rejected' ? 'bg-gefahr/90 text-white' : 'bg-warn/90 text-grund'
                  }`}
                >
                  {ph.status === 'approved' ? (ph.blurred ? t('ST-KON-43') : t('UI-FOTO-SICHTBAR')) : ph.status === 'rejected' ? t('UI-ALBUM-STATUS-DECLINED') : t('UI-FOTO-IN-PRUEFUNG')}
                </span>
              </li>
            ))}
            {photos.length < photosMax && (
              <li>
                <button className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-linie grid place-items-center text-leise hover:border-akzent hover:text-akzent" onClick={() => nav('/ich/fotos')} aria-label={t('UI-FOTO-HINZU')}>
                  <Icon name="plus" className="w-8 h-8" />
                </button>
              </li>
            )}
          </ul>
          {photos.some((x: any) => x.status === 'approved') && (
            <Toggle
              checked={pr.photoMode === 'photo'}
              onChange={(v) => photoAction(() => api.put('/api/profile/photo-mode', { mode: v ? 'photo' : 'initial' }))}
              label={t('UI-FOTO-ZEIGEN')}
              hint={t('ST-KON-44')}
            />
          )}
        </section>

        <label className="label" htmlFor="name">
          {t('UI-PROFIL-NAME')}
        </label>
        <input id="name" className="input mb-1" value={name} maxLength={config?.params.nameMax ?? 20} onChange={(e) => setName(e.target.value)} />
        <p className="text-sm muted mb-4">{t('ST-KON-47')}</p>

        <section id="ueber" className="mb-6 scroll-mt-20">
          <h2 className="font-semibold mb-2">{t('UI-PROFIL-UEBER-MICH')}</h2>
          <div className="grid grid-cols-3 gap-3">
            <label>
              <span className="label">{t('UI-PROFIL-ALTER')}</span>
              <input className="input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </label>
            <label>
              <span className="label">{t('UI-PROFIL-GROESSE')}</span>
              <input className="input" inputMode="numeric" aria-invalid={heightBad} value={height} onChange={(e) => setHeight(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </label>
            <label>
              <span className="label">{t('UI-PROFIL-GEWICHT')}</span>
              <input className="input" inputMode="numeric" aria-invalid={weightBad} value={weight} onChange={(e) => setWeight(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </label>
          </div>
          <p className="text-sm muted mt-1 mb-4">{t('UI-PROFIL-ALTER-ERKL')}</p>
          {(heightBad || weightBad) && <p className="text-sm text-gefahr -mt-3 mb-3">{t('UI-EINGABE-PRUEFEN')}</p>}

          <fieldset className="mb-4">
            <legend className="label">{t('UI-PROFIL-POSITION')}</legend>
            <div className="flex flex-wrap gap-2">
              {[{ key: null, label: t('UI-PROFIL-KEINE-ANGABE') }, ...(config?.positions ?? [])].map((o: any) => (
                <button key={o.key ?? 'keine'} className={`chip min-h-tap ${position === o.key ? 'border-akzent text-akzent' : ''}`} aria-pressed={position === o.key} onClick={() => setPosition(o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-2">
            <legend className="label">
              {t('UI-PROFIL-KOERPERTYP')} · {t('UI-KOERPERTYP-MAX', { max: bodyMax })}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(config?.bodyTypes ?? []).map((b) => {
                const on = bodyTypes.includes(b.key);
                return (
                  <button
                    key={b.key}
                    title={b.hint || undefined}
                    className={`chip min-h-tap ${on ? 'border-akzent text-akzent' : ''}`}
                    aria-pressed={on}
                    disabled={!on && bodyTypes.length >= bodyMax}
                    onClick={() => setBodyTypes(toggleIn(bodyTypes, b.key, bodyMax))}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section id="absicht" className="mb-6 scroll-mt-20">
          <h2 className="font-semibold mb-2">{t('ST-KON-48')}</h2>
          <IntentionPicker value={intention.key} duration={intention.duration} disabled={intentionBusy} onChange={saveIntention} />
          <p className="text-sm muted mt-2">{t('ST-KON-49')}</p>
        </section>

        <section id="text" className="mb-6 scroll-mt-20">
          <TextArea
            label={t('UI-PROFIL-FREITEXT')}
            value={freeText}
            rows={6}
            onChange={(e) => setFreeText(e.target.value)}
            hint={t('UI-PROFIL-FREITEXT-ZAEHLER', { zahl: [...freeText].length, max: textMax })}
            error={[...freeText].length > textMax ? t('ST-FEH-64', { zahl: [...freeText].length, max: textMax }) : null}
          />
          {pr.freeTextFlagged && !hint && <Banner kind="warn">{t('ST-FEH-62')}</Banner>}
        </section>

        <section id="interessen" className="mb-6 scroll-mt-20">
          <h2 className="font-semibold mb-1">{t('UI-PROFIL-INTERESSEN')}</h2>
          <p className="text-sm muted mb-2">{t('UI-MERKMALE-MAX', { max })}</p>
          {config?.traits.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="text-sm muted mb-1">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map((it) => {
                  const on = traits.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      className={`chip min-h-tap ${on ? 'border-akzent text-akzent' : ''}`}
                      aria-pressed={on}
                      disabled={!on && traits.length >= max}
                      onClick={() => setTraits(on ? traits.filter((x) => x !== it.id) : [...traits, it.id])}
                    >
                      {it.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <section id="kinks" className="mb-6 card p-4 scroll-mt-20">
          <button className="w-full flex items-center justify-between text-left" onClick={() => setKinksOpen(!kinksOpen)} aria-expanded={kinksOpen}>
            <span>
              <span className="block font-semibold">{t('UI-PROFIL-KINKS')}</span>
              <span className="block text-sm muted">{t('UI-PROFIL-KINKS-ERKL')}</span>
            </span>
            <span className="muted text-xl">{kinksOpen ? '−' : '+'}</span>
          </button>
          {kinksOpen && (
            <div className="mt-3">
              <p className="text-xs muted mb-2">{t('UI-KINKS-MAX', { max: kinksMax })}</p>
              {(config?.kinks ?? []).map((g) => (
                <div key={g.group} className="mb-3">
                  <p className="text-sm muted mb-1">{g.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((it) => {
                      const on = kinks.includes(it.key);
                      return (
                        <button
                          key={it.key}
                          className={`chip min-h-tap ${on ? 'border-akzent text-akzent' : ''}`}
                          aria-pressed={on}
                          disabled={!on && kinks.length >= kinksMax}
                          onClick={() => setKinks(toggleIn(kinks, it.key, kinksMax))}
                        >
                          {it.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="my-6">
          <h2 className="font-semibold mb-1">{t('ST-PRO-40')}</h2>
          <p className="text-sm muted mb-2">{t('ST-PRO-61')}</p>
          <select className="input mb-2" value={gender.category ?? ''} onChange={(e) => setGender({ ...gender, category: e.target.value || null })}>
            <option value="">—</option>
            {config?.genders.map((g: any) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
          {gender.category === 'andere' && (
            <input className="input mb-2" maxLength={80} value={gender.text ?? ''} onChange={(e) => setGender({ ...gender, text: e.target.value })} aria-label={t('UI-PROFIL-EIGENE-BESCHREIBUNG')} />
          )}
          <Toggle checked={gender.visible} onChange={(v) => setGender({ ...gender, visible: v })} label={t('ST-PRO-41')} />
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-1">{t('ST-PRO-30')}</h2>
          <p className="text-sm muted mb-2">{t('ST-PRO-31')}</p>
          <div className="flex flex-wrap gap-2">
            {config?.genders.map((g: any) => {
              const on = seeGroups.includes(g.key);
              return (
                <button key={g.key} className={`chip min-h-tap ${on ? 'border-akzent text-akzent' : ''}`} aria-pressed={on} onClick={() => setSeeGroups(on ? seeGroups.filter((x) => x !== g.key) : [...seeGroups, g.key])}>
                  {g.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs muted mt-1">{t('UI-PROFIL-ALLE-WENN-LEER')}</p>
        </section>

        <section className="mb-6">
          <Toggle checked={responseRate} onChange={(v) => (v ? setResponseRate(true) : setConfirmRR(true))} label={t('UI-PROFIL-ANTWORTQUOTE')} hint={t('ST-PRO-13')} />
        </section>
        {hint && <Banner kind="warn">{t(hint)}</Banner>}
        {err && <Banner kind="error">{err}</Banner>}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!dirty || busy || heightBad || weightBad || [...freeText].length > textMax} onClick={save}>
          {t('UI-APP-SPEICHERN')}
        </button>
      </BottomBar>
      <Sheet open={!!photoMenu} onClose={() => setPhotoMenu(null)} title={t('UI-PROFIL-FOTOS')}>
        {photoMenu && (
          <div className="flex flex-col gap-3">
            {photoMenu.url && <img src={photoMenu.url} alt="" className="w-40 aspect-[3/4] object-cover rounded-xl self-center" />}
            <p className="text-sm">
              {photoMenu.status === 'approved'
                ? t('UI-FOTO-SICHTBAR')
                : photoMenu.status === 'rejected'
                  ? t('ST-FEH-12', { grund: t(photoMenu.rejection?.reason ?? 'ST-FEH-13') })
                  : t('ST-FEH-16', { stunden: 24 })}
            </p>
            {photoMenu.status !== 'rejected' && (
              <Toggle
                checked={photoMenu.blurred}
                onChange={(v) => {
                  setPhotoMenu({ ...photoMenu, blurred: v });
                  photoAction(() => api.patch(`/api/photos/${photoMenu.id}`, { blurred: v }));
                }}
                label={t('ST-KON-43')}
              />
            )}
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" disabled={photoMenu.index === 0} onClick={() => (move(photoMenu.index, -1), setPhotoMenu(null))}>
                ← {t('UI-FOTO-NACH-VORNE')}
              </button>
              <button className="btn-secondary flex-1" disabled={photoMenu.index >= photos.length - 1} onClick={() => (move(photoMenu.index, 1), setPhotoMenu(null))}>
                {t('UI-FOTO-NACH-HINTEN')} →
              </button>
            </div>
            {photoMenu.index > 0 && (
              <button
                className="btn-secondary"
                onClick={() => {
                  const ids = photos.map((x: any) => x.id).filter((x: string) => x !== photoMenu.id);
                  photoAction(() => api.put('/api/photos/order', { ids: [photoMenu.id, ...ids] }));
                  setPhotoMenu(null);
                }}
              >
                {t('UI-FOTO-ALS-ERSTES')}
              </button>
            )}
            {photoMenu.status === 'rejected' && (
              <button
                className="btn-ghost"
                onClick={async () => {
                  const text = prompt(t('UI-FOTO-EINSPRUCH-TEXT')) ?? '';
                  if (text.trim()) photoAction(() => api.post(`/api/photos/${photoMenu.id}/appeal`, { text }));
                  setPhotoMenu(null);
                }}
              >
                {t('UI-FOTO-EINSPRUCH')}
              </button>
            )}
            <button
              className="btn-danger"
              onClick={() => {
                photoAction(() => api.del(`/api/photos/${photoMenu.id}`));
                setPhotoMenu(null);
              }}
            >
              {t('UI-APP-LOESCHEN')}
            </button>
          </div>
        )}
      </Sheet>
      <Sheet open={confirmRR} onClose={() => setConfirmRR(false)} title={t('UI-PROFIL-ANTWORTQUOTE')}>
        <p className="mb-4">{t('ST-PRO-14')}</p>
        <div className="flex flex-col gap-2">
          <button
            className="btn-secondary"
            onClick={() => {
              setResponseRate(false);
              setConfirmRR(false);
            }}
          >
            {t('ST-VER-33')}
          </button>
          <button className="btn-ghost" onClick={() => setConfirmRR(false)}>
            {t('ST-VER-34')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

// ─────────────────────────── S23 · Foto hinzufügen ───────────────────────────

/** Zuschnitt auf Hochformat 3:4 im Browser — mit Knöpfen statt Gesten (Barrierefreiheit). */
async function cropToBlob(file: File, zoom: number, offX: number, offY: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('bild'));
      i.src = url;
    });
    const targetRatio = 3 / 4;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w / h > targetRatio) w = h * targetRatio;
    else h = w / targetRatio;
    w /= zoom;
    h /= zoom;
    const x = Math.min(Math.max(0, (img.naturalWidth - w) / 2 + offX * (img.naturalWidth - w) / 2), img.naturalWidth - w);
    const y = Math.min(Math.max(0, (img.naturalHeight - h) / 2 + offY * (img.naturalHeight - h) / 2), img.naturalHeight - h);
    const outW = Math.min(1200, Math.round(w));
    const outH = Math.round(outW / targetRatio);
    const c = document.createElement('canvas');
    c.width = outW;
    c.height = outH;
    c.getContext('2d')!.drawImage(img, x, y, w, h, 0, 0, outW, outH);
    // Neu kodiert als JPEG — so kommt auch ein HEIC-Foto an, sofern der Browser es lesen kann.
    return await new Promise((resolve) => c.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function FotoHinzufuegen() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { refreshMe, config } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [blurred, setBlurred] = useState(params.get('unkenntlich') === '1');
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [status, setStatus] = useState<null | string>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [camHint, setCamHint] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const start = params.get('start') === '1';

  useEffect(() => {
    if (!file) return;
    let alive = true;
    cropToBlob(file, zoom, off.x, off.y)
      .then((b) => alive && setPreview(URL.createObjectURL(b)))
      .catch(() => alive && setErr(t('ST-FEH-11', { formate: 'JPEG, PNG, WebP' })));
    return () => {
      alive = false;
    };
  }, [file, zoom, off]);

  const pick = (f: File | undefined) => {
    setErr(null);
    setStatus(null);
    if (!f) return;
    if (f.size > (config?.params.imageMaxMb ?? 20) * 1024 * 1024) {
      setErr(t('ST-FEH-10', { mb: config?.params.imageMaxMb ?? 20 }));
      return;
    }
    setFile(f);
    setZoom(1);
    setOff({ x: 0, y: 0 });
  };

  const uploadNow = async () => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await cropToBlob(file, zoom, off.x, off.y);
      const r = await api.upload('/api/photos', blob, { blurred: blurred ? 'true' : 'false' });
      setStatus(r.status);
      await refreshMe();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const next = () => (start ? nav(isIosSafariNotInstalled() ? '/home-bildschirm' : '/naehe') : nav('/ich/profil/bearbeiten'));

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-FOTO-HINZU')} back={start ? undefined : true} />
      <Page className="flex-1">
        <input ref={camRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={galRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {!file && (
          <div className="flex flex-col gap-2">
            <button className="btn-secondary" onClick={() => (localStorage.getItem('kamera-erklaert') ? camRef.current?.click() : setCamHint(true))}>
              {t('ST-REC-20')}
            </button>
            <button className="btn-secondary" onClick={() => galRef.current?.click()}>
              {t('ST-REC-23')}
            </button>
          </div>
        )}
        {preview && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-60 aspect-[3/4] rounded-xl overflow-hidden bg-flaeche2">
              <img src={preview} alt="" className={`w-full h-full object-cover ${blurred ? 'blur-xl scale-110' : ''}`} />
            </div>
            <div className="flex gap-2 flex-wrap justify-center" aria-label={t('UI-FOTO-ZUSCHNITT')}>
              <button className="btn-secondary" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
                +
              </button>
              <button className="btn-secondary" onClick={() => setZoom(Math.max(1, zoom - 0.25))}>
                −
              </button>
              <button className="btn-secondary" onClick={() => setOff({ ...off, x: Math.max(-1, off.x - 0.25) })} aria-label={t('UI-FOTO-LINKS')}>
                ←
              </button>
              <button className="btn-secondary" onClick={() => setOff({ ...off, x: Math.min(1, off.x + 0.25) })} aria-label={t('UI-FOTO-RECHTS')}>
                →
              </button>
              <button className="btn-secondary" onClick={() => setOff({ ...off, y: Math.max(-1, off.y - 0.25) })} aria-label={t('UI-FOTO-HOCH')}>
                ↑
              </button>
              <button className="btn-secondary" onClick={() => setOff({ ...off, y: Math.min(1, off.y + 0.25) })} aria-label={t('UI-FOTO-RUNTER')}>
                ↓
              </button>
            </div>
          </div>
        )}
        <div className="mt-4">
          <Toggle checked={blurred} onChange={setBlurred} label={t('ST-KON-43')} hint={t('ST-KON-45')} />
        </div>
        <p className="text-sm muted mt-2">{t('ST-REC-21')}</p>
        {status && (
          <div className="mt-4">
            <Banner kind={status === 'approved' ? 'ok' : status === 'rejected' ? 'warn' : 'info'}>
              {status === 'approved' ? t('ST-PUSH-13') : status === 'rejected' ? t('ST-FEH-12', { grund: t('ST-FEH-13') }) : t('ST-FEH-16', { stunden: 24 })}
            </Banner>
          </div>
        )}
        {err && (
          <div className="mt-4">
            <Banner kind="error">{err}</Banner>
          </div>
        )}
      </Page>
      <BottomBar>
        {!status ? (
          <button className="btn-primary" disabled={!file || busy} onClick={uploadNow}>
            {t('UI-FOTO-HOCHLADEN')}
          </button>
        ) : (
          <>
            <button className="btn-primary" onClick={next}>
              {t('ST-KON-12')}
            </button>
            {status === 'rejected' && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setStatus(null);
                }}
              >
                {t('UI-FOTO-ANDERES')}
              </button>
            )}
          </>
        )}
        {start && !status && (
          <button className="btn-ghost" onClick={next}>
            {t('UI-APP-SPAETER')}
          </button>
        )}
      </BottomBar>
      <Sheet open={camHint} onClose={() => setCamHint(false)} title={t('ST-REC-20')}>
        <p className="mb-4">{t('ST-REC-21')}</p>
        <div className="flex flex-col gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              localStorage.setItem('kamera-erklaert', '1');
              setCamHint(false);
              camRef.current?.click();
            }}
          >
            {t('ST-REC-22')}
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setCamHint(false);
              galRef.current?.click();
            }}
          >
            {t('ST-REC-23')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

export { Avatar };

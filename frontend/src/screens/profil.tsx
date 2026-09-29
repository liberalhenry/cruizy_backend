/** S20 Profil fremd · S21 Profil eigen · S22 Editor · S23 Foto hinzufügen. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Banner, BottomBar, Header, Icon, Page, Sheet, Skeleton, TextArea, Toggle, useAsync } from '../components/ui';
import { intentionLabel } from '../components/tile';
import { ReportSheet, useBlock } from '../components/report';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { ACTIVITY_TEXT, BAND_TEXT, RESPONSE_TEXT, t } from '../lib/texts';
import { IntentionPicker } from './einstieg';
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
  if (!photos.length) return <div className="aspect-[3/4] max-h-[60vh] w-full rounded-xl overflow-hidden">{fallback}</div>;
  const p = photos[Math.min(i, photos.length - 1)];
  return (
    <div className="relative">
      <img src={p.url} alt="" className="w-full max-h-[60vh] object-cover rounded-xl bg-flaeche2" />
      {p.blurred && <p className="absolute bottom-2 left-2 right-2 text-xs bg-black/60 rounded-lg px-2 py-1">{t('ST-VER-23')}</p>}
      {photos.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)} aria-label={t('UI-PROFIL-FOTO-ZURUECK')}>
            ‹
          </button>
          <span className="text-sm muted">{t('UI-PROFIL-FOTO-VON', { n: i + 1, von: photos.length })}</span>
          <button className="btn-ghost" disabled={i >= photos.length - 1} onClick={() => setI(i + 1)} aria-label={t('UI-PROFIL-FOTO-WEITER')}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileBody({ p, own }: { p: any; own?: boolean }) {
  const { config } = useApp();
  const [info, setInfo] = useState<null | 'quote' | 'verified' | 'approx'>(null);
  const traits = traitNames(p.traits ?? [], config?.traits);
  const gender = genderLabel(p.gender, config?.genders);
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
          <h2 className="text-2xl font-semibold">
            {p.name}
            {p.age ? <span className="font-normal">, {p.age}</span> : null}
          </h2>
          <p className="muted text-sm">
            {p.band ? t(BAND_TEXT[p.band]) : own ? t('UI-PROFIL-DU') : ''}
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
      <p className="mt-3">{intentionLabel(p.intention)}</p>
      {p.response && (
        <button className="mt-1 text-sm muted underline" onClick={() => setInfo('quote')}>
          {t(RESPONSE_TEXT[p.response])}
        </button>
      )}
      {traits.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {traits.map((x) => (
            <span key={x} className="chip">
              {x}
            </span>
          ))}
        </div>
      )}
      {p.freeText && <p className="mt-4 whitespace-pre-wrap">{p.freeText}</p>}
      {gender && <p className="mt-4 text-sm muted">{gender}</p>}
      <Sheet open={!!info} onClose={() => setInfo(null)} title={info === 'quote' ? t(RESPONSE_TEXT[p.response ?? 1]) : info === 'verified' ? t('UI-APP-GEPRUEFT') : t('ST-STO-41')}>
        <p>{info === 'quote' ? t('ST-PRO-13') : info === 'verified' ? t('ST-VER-22') : t('ST-STO-42')}</p>
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
    band: null,
    response: pr.responseRate.enabled ? pr.responseRate.band : null,
    verified: pr.verified.photos,
    photos: pr.photoMode === 'photo' ? me.photos.filter((x: any) => x.status === 'approved').map((x: any) => ({ url: x.url, blurred: false })) : [],
    gender: pr.gender.visible ? pr.gender : null,
  };
  const pending = me.photos.filter((x: any) => x.status === 'queued' || x.status === 'checking');
  const rejected = me.photos.filter((x: any) => x.status === 'rejected');
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-PROFIL-SO-SEHEN-DICH')} back="/ich" />
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
        <ProfileBody p={preview} own />
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
  const [traits, setTraits] = useState<number[]>(pr?.traits ?? []);
  const [freeText, setFreeText] = useState(pr?.freeText ?? '');
  const [gender, setGender] = useState(pr?.gender ?? { category: null, text: null, visible: false });
  const [seeGroups, setSeeGroups] = useState<string[]>(pr?.seeGroups ?? []);
  const [responseRate, setResponseRate] = useState<boolean>(pr?.responseRate?.enabled ?? true);
  const [confirmRR, setConfirmRR] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const photos = me?.photos ?? [];
  const max = config?.params.traitsMax ?? 10;

  if (!pr) return null;
  const dirty =
    name !== pr.name ||
    age !== (pr.age ? String(pr.age) : '') ||
    JSON.stringify(traits) !== JSON.stringify(pr.traits) ||
    freeText !== pr.freeText ||
    JSON.stringify(gender) !== JSON.stringify(pr.gender) ||
    JSON.stringify(seeGroups) !== JSON.stringify(pr.seeGroups) ||
    responseRate !== pr.responseRate.enabled;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.patch('/api/profile', {
        name,
        age: age ? Number(age) : null,
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('UI-PROFIL-BEARBEITEN')}
        back
      />
      <Page className="flex-1">
        <section className="mb-6">
          <h2 className="font-semibold mb-1">{t('UI-PROFIL-FOTOS')}</h2>
          <p className="text-sm muted mb-3">{t('ST-PRO-60')}</p>
          <ul className="flex flex-col gap-2">
            {photos.map((ph: any, i: number) => (
              <li key={ph.id} className="card p-2 flex items-center gap-3">
                {ph.url ? <img src={ph.url} alt="" className="w-16 h-20 object-cover rounded-lg" /> : <div className="w-16 h-20 rounded-lg bg-flaeche2" />}
                <div className="flex-1 text-sm">
                  <p>
                    {ph.status === 'approved'
                      ? t('UI-FOTO-SICHTBAR')
                      : ph.status === 'rejected'
                        ? t('ST-FEH-12', { grund: t(ph.rejection?.reason ?? 'ST-FEH-13') })
                        : t('ST-FEH-16', { stunden: 24 })}
                  </p>
                  {ph.status !== 'rejected' && (
                    <Toggle checked={ph.blurred} onChange={(v) => photoAction(() => api.patch(`/api/photos/${ph.id}`, { blurred: v }))} label={t('ST-KON-43')} />
                  )}
                  {ph.status === 'rejected' && (
                    <button
                      className="btn-ghost px-0"
                      onClick={async () => {
                        const text = prompt(t('UI-FOTO-EINSPRUCH-TEXT')) ?? '';
                        if (text.trim()) photoAction(() => api.post(`/api/photos/${ph.id}/appeal`, { text }));
                      }}
                    >
                      {t('UI-FOTO-EINSPRUCH')}
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  <button className="btn-ghost px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('UI-FOTO-NACH-VORNE')}>
                    ↑
                  </button>
                  <button className="btn-ghost px-2" disabled={i === photos.length - 1} onClick={() => move(i, 1)} aria-label={t('UI-FOTO-NACH-HINTEN')}>
                    ↓
                  </button>
                </div>
                <button className="btn-ghost px-2" onClick={() => photoAction(() => api.del(`/api/photos/${ph.id}`))} aria-label={t('UI-APP-LOESCHEN')}>
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
          {photos.length < 8 && (
            <button className="btn-secondary w-full mt-2" onClick={() => nav('/ich/fotos')}>
              {t('UI-FOTO-HINZU')}
            </button>
          )}
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

        <label className="label" htmlFor="alter">
          {t('UI-PROFIL-ALTER')}
        </label>
        <input id="alter" className="input mb-1" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        <p className="text-sm muted mb-4">{t('UI-PROFIL-ALTER-ERKL')}</p>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">{t('ST-KON-48')}</h2>
          <IntentionPicker
            value={pr.intention?.key ?? null}
            duration={null}
            onChange={(k, d) => photoAction(() => api.put('/api/profile/intention', { key: k, duration: d ?? undefined }))}
          />
          <p className="text-sm muted mt-2">{t('ST-KON-49')}</p>
        </section>

        <section className="mb-6">
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

        <TextArea label={t('UI-PROFIL-FREITEXT')} value={freeText} onChange={(e) => setFreeText(e.target.value)} hint={`${[...freeText].length}/400`} error={[...freeText].length > 400 ? t('ST-FEH-64', { zahl: [...freeText].length }) : null} />
        {pr.freeTextFlagged && !hint && <Banner kind="warn">{t('ST-FEH-62')}</Banner>}

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
          <Toggle
            checked={responseRate}
            onChange={(v) => (v ? setResponseRate(true) : setConfirmRR(true))}
            label={t('UI-PROFIL-ANTWORTQUOTE')}
            hint={t('ST-PRO-13')}
          />
        </section>
        {hint && <Banner kind="warn">{t(hint)}</Banner>}
        {err && <Banner kind="error">{err}</Banner>}
      </Page>
      <BottomBar>
        <button className="btn-primary" disabled={!dirty || busy} onClick={save}>
          {t('UI-APP-SPEICHERN')}
        </button>
      </BottomBar>
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

/** Öffentliche Seiten ohne Konto: Meldeformular (Art. 16 DSA), Ort beanspruchen (FV-47/48),
 * Rechtliches, Moderationszeiten (M-05). */
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Banner, Choice, Field, Header, ListCard, Page, RowLink, TextArea } from '../components/ui';
import { REPORT_REASONS } from '../components/report';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { t } from '../lib/texts';

export function MeldenOhneKonto() {
  const [reason, setReason] = useState<string | null>(null);
  const [where, setWhere] = useState('');
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goodFaith, setGoodFaith] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const csam = reason === 'missbrauchsdarstellung';
  const send = async () => {
    setErr(null);
    try {
      const r = await api.post('/api/public/report', { reason, where, description: desc || undefined, name: name || undefined, email: email || undefined, goodFaith });
      setDone(r.number);
    } catch (e) {
      setErr(errText(e));
    }
  };
  return (
    <div className="min-h-screen">
      <Header title={t('UI-OEFF-MELDEN-TITEL')} back="/" />
      <Page>
        {done ? (
          <Banner kind="ok">{t('UI-OEFF-MELDEN-DANKE', { fallnummer: done })}</Banner>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="muted">{t('UI-OEFF-MELDEN-TEXT')}</p>
            <Banner kind="warn">{t('ST-MEL-11')}</Banner>
            <fieldset>
              <legend className="font-semibold mb-2">{t('ST-MEL-02')}</legend>
              {[...REPORT_REASONS, { key: 'missbrauchsdarstellung', textId: 'UI-MEL-CSAM' }].map((r) => (
                <label key={r.key} className="flex items-center gap-3 min-h-tap">
                  <input type="radio" name="grund" className="accent-akzent w-5 h-5" checked={reason === r.key} onChange={() => setReason(r.key)} />
                  {t(r.textId)}
                </label>
              ))}
            </fieldset>
            <Field label={t('UI-OEFF-MELDEN-WO')} hint={t('UI-OEFF-MELDEN-WO-ERKL')} value={where} onChange={(e) => setWhere(e.target.value)} />
            <TextArea label={t('UI-OEFF-MELDEN-WARUM')} value={desc} maxLength={3000} onChange={(e) => setDesc(e.target.value)} />
            <Field label={t('UI-OEFF-MELDEN-NAME')} value={name} onChange={(e) => setName(e.target.value)} hint={csam ? t('UI-OEFF-MELDEN-CSAM-ANONYM') : undefined} />
            <Field label={t('UI-KONTO-EMAIL')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-akzent" checked={goodFaith} onChange={(e) => setGoodFaith(e.target.checked)} />
              <span className="text-sm">{t('UI-OEFF-MELDEN-GUTER-GLAUBE')}</span>
            </label>
            {err && <Banner kind="error">{err}</Banner>}
            <button className="btn-primary" disabled={!reason || where.trim().length < 2 || !goodFaith || (!csam && (!name || !email))} onClick={send}>
              {t('ST-MEL-15')}
            </button>
          </div>
        )}
      </Page>
    </div>
  );
}

export function OrtBeanspruchen() {
  const { id } = useParams();
  const [place, setPlace] = useState<any | null>(null);
  const [kind, setKind] = useState<'claim' | 'removal'>('claim');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api
      .get(`/api/public/places/${id}`)
      .then((r) => setPlace(r.place))
      .catch((e) => setErr(errText(e)));
  }, [id]);
  return (
    <div className="min-h-screen">
      <Header title={t('UI-ORT-DEIN-ORT')} back />
      <Page>
        {place && (
          <p className="mb-4">
            <strong>{place.name}</strong> · {place.district} {place.address ? `· ${place.address}` : ''}
          </p>
        )}
        {done ? (
          <Banner kind="ok">{t('UI-ORT-ANFRAGE-GESENDET', { nummer: done })}</Banner>
        ) : (
          <div className="flex flex-col gap-3">
            <Choice
              name="art"
              value={kind}
              onChange={setKind}
              options={[
                { value: 'claim', label: t('UI-ORT-BEANSPRUCHEN'), hint: t('UI-ORT-BEANSPRUCHEN-ERKL') },
                { value: 'removal', label: t('UI-ORT-ENTFERNEN'), hint: t('UI-ORT-ENTFERNEN-ERKL') },
              ]}
            />
            <Field label={t('UI-OEFF-MELDEN-NAME')} value={name} onChange={(e) => setName(e.target.value)} />
            <Field label={t('UI-ORT-ROLLE')} value={role} onChange={(e) => setRole(e.target.value)} />
            <Field label={t('UI-KONTO-EMAIL')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} hint={t('UI-ORT-EMAIL-ERKL')} />
            <TextArea label={t('UI-ORT-NACHWEIS')} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
            {err && <Banner kind="error">{err}</Banner>}
            <button
              className="btn-primary"
              disabled={!name || !email}
              onClick={async () => {
                setErr(null);
                try {
                  const r = await api.post(`/api/public/places/${id}/claim`, { kind, name, role: role || undefined, email, note: note || undefined });
                  setDone(r.number);
                } catch (e) {
                  setErr(errText(e));
                }
              }}
            >
              {t('UI-APP-SENDEN')}
            </button>
          </div>
        )}
      </Page>
    </div>
  );
}

export function OrtBestaetigen() {
  const [params] = useSearchParams();
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    api
      .post('/api/public/claims/verify', { token: params.get('token') ?? '' })
      .then((r) => setRes({ ok: true, text: t('UI-ORT-BESTAETIGT-MAIL', { nummer: r.number, stunden: r.hours }) }))
      .catch((e) => setRes({ ok: false, text: errText(e) }));
  }, [params]);
  return (
    <Page>
      {res ? <Banner kind={res.ok ? 'ok' : 'error'}>{res.text}</Banner> : <p className="muted">…</p>}
    </Page>
  );
}

const PAGES: Record<string, { title: string; body: string }> = {
  impressum: { title: 'UI-RECHT-IMPRESSUM', body: 'UI-RECHT-IMPRESSUM-TEXT' },
  bedingungen: { title: 'UI-RECHT-BEDINGUNGEN', body: 'UI-RECHT-BEDINGUNGEN-TEXT' },
  datenschutz: { title: 'UI-RECHT-DATENSCHUTZ', body: 'UI-RECHT-DATENSCHUTZ-TEXT' },
  kontaktstellen: { title: 'UI-RECHT-KONTAKTSTELLEN', body: 'UI-RECHT-KONTAKTSTELLEN-TEXT' },
};

export function Rechtliches() {
  const { seite } = useParams();
  const { phase } = useApp();
  if (seite === 'uebersicht' || !seite || !PAGES[seite]) {
    return (
      <div className="min-h-screen">
        <Header title={t('UI-ICH-RECHTLICHES')} back />
        <Page>
          <ListCard>
            {Object.entries(PAGES).map(([k, v]) => (
              <RowLink key={k} to={`/rechtliches/${k}`} label={t(v.title)} />
            ))}
            <RowLink to="/moderationszeiten" label={t('UI-OEFF-MODZEITEN-TITEL')} />
            <RowLink to={phase === 'mitglied' ? '/ich/hilfe' : '/hilfe'} label={t('ST-HLF-01')} />
          </ListCard>
        </Page>
      </div>
    );
  }
  const p = PAGES[seite];
  return (
    <div className="min-h-screen">
      <Header title={t(p.title)} back />
      <Page>
        <Banner kind="warn">{t('UI-RECHT-ENTWURF')}</Banner>
        <p className="mt-4 whitespace-pre-wrap">{t(p.body)}</p>
        {seite === 'kontaktstellen' && (
          <p className="mt-4">
            <Link className="text-akzent underline" to={phase === 'mitglied' ? '/ich/hilfe' : '/hilfe'}>
              {t('ST-HLF-01')}
            </Link>
          </p>
        )}
      </Page>
    </div>
  );
}

export function Moderationszeiten() {
  const [d, setD] = useState<any | null>(null);
  useEffect(() => {
    api.get('/api/public/moderation-times').then(setD).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen">
      <Header title={t('UI-OEFF-MODZEITEN-TITEL')} back />
      <Page>
        {d && (
          <ul className="card p-4 flex flex-col gap-2">
            <li>{t('UI-MODZEIT-KETTE', { sekunden: Math.round(d.pruefkette_ms / 1000) })}</li>
            <li>{t('UI-MODZEIT-GRAU', { tag: d.graubereich_tagsueber_std, gesamt: d.graubereich_gesamt_std, von: d.tagsueber.von, bis: d.tagsueber.bis })}</li>
            <li>{t('UI-MODZEIT-MELDUNG', { stunden: d.meldung_entscheidung_std })}</li>
            <li>{t('UI-MODZEIT-EINSPRUCH', { stunden: d.einspruch_bild_std })}</li>
            <li>{t('UI-MODZEIT-WIDERSPRUCH', { stunden: d.widerspruch_std })}</li>
            <li>{d.hash_abgleich_aktiv ? t('UI-MODZEIT-HASH-AN') : t('UI-MODZEIT-HASH-AUS')}</li>
          </ul>
        )}
      </Page>
    </div>
  );
}

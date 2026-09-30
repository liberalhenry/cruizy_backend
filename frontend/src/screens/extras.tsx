/**
 * Antwortquote (Issue #24), Profil-Vollständigkeit (Issue #29), Profilbesucher (Issue #27),
 * Gesundheit & Tests (Issue #25).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Empty, Header, Icon, Page, Sheet, Skeleton, Toggle, useAsync } from '../components/ui';
import { Tile, type TileData } from '../components/tile';
import { api, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { RESPONSE_TEXT, fmtDate, t } from '../lib/texts';

// ─────────────────────────── Antwortquote ───────────────────────────

/** Info-Fenster beim Tippen auf das Abzeichen. */
export function ResponseInfo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { config } = useApp();
  const tage = config?.params.responseDays ?? 30;
  return (
    <Sheet open={open} onClose={onClose} title={t('UI-AQ-INFO-TITEL')}>
      <div className="flex flex-col gap-3">
        <p>{t('UI-AQ-INFO-1')}</p>
        <div>
          <p className="font-semibold">{t('UI-AQ-INFO-2-TITEL')}</p>
          <p>{t('UI-AQ-INFO-2', { tage })}</p>
        </div>
        <div>
          <p className="font-semibold">{t('UI-AQ-INFO-3-TITEL')}</p>
          <p>{t('UI-AQ-INFO-3')}</p>
        </div>
      </div>
    </Sheet>
  );
}

/** Abzeichen unter dem Namen (nur die drei positiven Stufen). */
export function ResponseBadge({ stage, onInfo }: { stage: 1 | 2 | 3 | null | undefined; onInfo: () => void }) {
  if (!stage) return null;
  const color = stage === 1 ? 'text-gut border-gut/50' : 'text-akzent border-akzent/50';
  return (
    <button className={`chip mt-1 ${color}`} onClick={onInfo}>
      <span aria-hidden="true">↩</span>
      {t(RESPONSE_TEXT[stage])}
      <Icon name="info" className="w-4 h-4" />
    </button>
  );
}

/** Eigene Antwortquote — mit Prozentwert und Tipp, nur für die Person selbst. */
export function OwnResponseCard() {
  const { me } = useApp();
  const [info, setInfo] = useState(false);
  const rr = me?.profile?.responseRate;
  if (!rr?.enabled) return null;
  return (
    <section className="card p-4 mt-4">
      {rr.pct === null ? (
        <>
          <p className="font-semibold">{t('UI-AQ-NOCH-KEINE')}</p>
          <div className="h-2 rounded-full bg-flaeche2 mt-3 overflow-hidden" aria-hidden="true">
            <div className="h-2 bg-akzent" style={{ width: `${Math.min(100, (rr.counted / rr.min) * 100)}%` }} />
          </div>
          <p className="text-xs muted mt-1">{t('UI-AQ-FORTSCHRITT', { zahl: rr.counted, min: rr.min })}</p>
        </>
      ) : (
        <>
          <p className="font-semibold">{rr.band ? t('UI-AQ-EIGEN', { prozent: rr.pct, stufe: t(RESPONSE_TEXT[rr.band]) }) : t('UI-AQ-EIGEN-OHNE-STUFE', { prozent: rr.pct })}</p>
          <p className="text-sm muted mt-1">{t('UI-AQ-EIGEN-ERKL', { tage: rr.days })}</p>
        </>
      )}
      <p className="text-sm mt-3">{t('UI-AQ-TIPP')}</p>
      <button className="btn-ghost px-0 mt-1" onClick={() => setInfo(true)}>
        {t('UI-AQ-INFO-TITEL')}
      </button>
      <ResponseInfo open={info} onClose={() => setInfo(false)} />
    </section>
  );
}

// ─────────────────────────── Vollständigkeit ───────────────────────────

const TIP_TEXT: Record<string, string> = {
  profilbild: 'UI-VOLL-TIPP-PROFILBILD',
  drei_fotos: 'UI-VOLL-TIPP-DREI-FOTOS',
  bio: 'UI-VOLL-TIPP-BIO',
  basis: 'UI-VOLL-TIPP-BASIS',
  foto_echt: 'UI-VOLL-TIPP-FOTO-ECHT',
  interessen: 'UI-VOLL-TIPP-INTERESSEN',
  absicht: 'UI-VOLL-TIPP-ABSICHT',
};

function tipLink(tip: { key: string; anchor: string }) {
  if (tip.key === 'foto_echt') return '/pruefung?art=face';
  if (tip.key === 'profilbild' || tip.key === 'drei_fotos') return '/ich/fotos';
  return `/ich/profil/bearbeiten#${tip.anchor}`;
}

function tipText(tip: { key: string; count?: number }) {
  if (tip.key === 'drei_fotos') return tip.count === 1 ? t('UI-VOLL-TIPP-DREI-FOTOS-1') : t('UI-VOLL-TIPP-DREI-FOTOS', { zahl: tip.count ?? 2 });
  return t(TIP_TEXT[tip.key] ?? tip.key);
}

/**
 * „Dein Profil ist zu X % fertig“ mit den nächsten Tipps. Bei 100 % einmal ein Glückwunsch,
 * danach ausgeblendet, bis wieder etwas fehlt.
 */
export function CompletenessCard() {
  const nav = useNavigate();
  const { me } = useApp();
  const c = me?.profile?.completeness;
  const [congrats] = useState(() => {
    try {
      return localStorage.getItem('profil-komplett') !== '1';
    } catch {
      return true;
    }
  });
  if (!c) return null;
  if (c.pct >= 100) {
    if (!congrats) return null;
    try {
      localStorage.setItem('profil-komplett', '1');
    } catch {
      /* egal */
    }
    return (
      <div className="mb-4">
        <Banner kind="ok">✓ {t('UI-VOLL-FERTIG')}</Banner>
      </div>
    );
  }
  try {
    localStorage.removeItem('profil-komplett');
  } catch {
    /* egal */
  }
  return (
    <section className="card p-4 mb-4" aria-label={t('UI-VOLL-TITEL', { prozent: c.pct })}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">{t('UI-VOLL-TITEL', { prozent: c.pct })}</p>
        <span className="text-akzent font-semibold">{c.pct} %</span>
      </div>
      <div className="h-2 rounded-full bg-flaeche2 mt-2 overflow-hidden" role="progressbar" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 bg-akzent transition-all" style={{ width: `${c.pct}%` }} />
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {c.tips.map((tip: any) => (
          <li key={tip.key}>
            <button className="w-full text-left text-sm flex items-center gap-2 py-1.5 hover:text-akzent" onClick={() => nav(tipLink(tip))}>
              <span className="text-akzent text-xs font-semibold shrink-0 w-10">+{tip.points}</span>
              <span className="flex-1">{tipText(tip)}</span>
              <span className="muted">›</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Einmaliger dezenter Hinweis nach der Registrierung, wenn das Profil unter 50 % liegt. */
export function CompletenessHint() {
  const nav = useNavigate();
  const { me, refreshMe } = useApp();
  const c = me?.profile?.completeness;
  if (!c || c.hintShown || c.pct >= 50) return null;
  const dismiss = async () => {
    await api.post('/api/profile/completeness-hint').catch(() => {});
    refreshMe();
  };
  return (
    <div className="mb-3">
      <Banner
        action={
          <div className="flex gap-2">
            <button
              className="btn-primary"
              onClick={async () => {
                await dismiss();
                nav('/ich/profil/bearbeiten');
              }}
            >
              {t('UI-VOLL-JETZT')}
            </button>
            <button className="btn-ghost" onClick={dismiss}>
              {t('UI-APP-NICHT-JETZT')}
            </button>
          </div>
        }
      >
        {t('UI-VOLL-HINWEIS', { prozent: c.pct })}
      </Banner>
    </div>
  );
}

// ─────────────────────────── Profilbesucher ───────────────────────────

const WHEN_TEXT: Record<string, string> = { heute: 'UI-BESUCHER-HEUTE', gestern: 'UI-BESUCHER-GESTERN', woche: 'UI-BESUCHER-WOCHE', frueher: 'UI-BESUCHER-FRUEHER' };

export function Besucher() {
  const nav = useNavigate();
  const { me, refreshCounts, refreshMe, toast } = useApp();
  const { data, loading, reload } = useAsync(async () => {
    const r = await api.get('/api/visitors');
    refreshCounts();
    return r;
  }, []);
  const invisible = !!me?.profile?.settings?.invisibleBrowsing;
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-BESUCHER')} back />
      <Page>
        {loading && !data ? (
          <Skeleton className="h-40" />
        ) : !data ? null : (
          <>
            <p className="font-semibold mb-1">{t('UI-BESUCHER-ANZAHL', { zahl: data.count, tage: data.days })}</p>
            {data.fresh > 0 && <p className="text-sm text-gefahr mb-3">{t('UI-BESUCHER-NEU', { zahl: data.fresh })}</p>}
            {data.count === 0 ? (
              <Empty text={t('UI-BESUCHER-KEINE', { tage: data.days })} />
            ) : data.premium ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {data.visitors.map((x: TileData & { when: string }) => (
                  <div key={x.id}>
                    <Tile x={x} compact onClick={() => nav(`/profil/${x.id}`)} />
                    <p className="text-xs muted mt-1 text-center">{t(WHEN_TEXT[x.when])}</p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mt-2" aria-hidden="true">
                  {data.previews.map((p: { color: string; image: string | null }, i: number) => (
                    <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden" style={{ background: p.color }}>
                      {p.image && <img src={p.image} alt="" className="w-full h-full object-cover blur-md scale-110" />}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Banner action={<button className="btn-primary" onClick={() => nav('/ich/abo')}>{t('UI-BESUCHER-PREMIUM-KNOPF')}</button>}>{t('UI-BESUCHER-PREMIUM')}</Banner>
                </div>
              </>
            )}
            <section className="card p-4 mt-6">
              <Toggle
                checked={invisible}
                disabled={!data.premium && !invisible}
                onChange={async (v) => {
                  try {
                    await api.put('/api/visitors/invisible', { on: v });
                    await refreshMe();
                    reload();
                  } catch (e) {
                    toast(errText(e));
                  }
                }}
                label={t('UI-BESUCHER-UNSICHTBAR')}
                hint={`${t('UI-BESUCHER-UNSICHTBAR-ERKL')}${data.premium ? '' : ` ${t('UI-BESUCHER-UNSICHTBAR-PLUS')}`}`}
              />
            </section>
          </>
        )}
      </Page>
    </div>
  );
}

/** PLUS im Testbetrieb ausprobieren (Abo-Seite). */
export function PremiumTest() {
  const { toast, refreshMe } = useApp();
  const { data, reload } = useAsync(() => api.get('/api/premium'), []);
  if (!data?.test) return null;
  return (
    <div className="card p-4 mt-4">
      {data.plus ? (
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm">{t('UI-ABO-TEST-AKTIV', { datum: fmtDate(data.until) })}</p>
          {data.source === 'testbetrieb' && (
            <button
              className="btn-secondary"
              onClick={async () => {
                await api.del('/api/premium/test');
                reload();
                refreshMe();
              }}
            >
              {t('UI-ABO-TEST-BEENDEN')}
            </button>
          )}
        </div>
      ) : (
        <button
          className="btn-primary w-full"
          onClick={async () => {
            try {
              await api.post('/api/premium/test');
              reload();
              refreshMe();
            } catch (e) {
              toast(errText(e));
            }
          }}
        >
          {t('UI-ABO-TEST')}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────── Gesundheit & Tests ───────────────────────────

export function Gesundheit() {
  const { toast } = useApp();
  const { data, loading, reload } = useAsync(() => api.get('/api/health/reminder'), []);
  const [interval, setInterval] = useState<1 | 3 | 6>(3);
  const [consent, setConsent] = useState(false);
  const [push, setPush] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [setup, setSetup] = useState(false);
  const run = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      if (msg) toast(msg);
      reload();
    } catch (e) {
      toast(errText(e));
    }
  };
  const Interval = ({ value, onChange }: { value: number; onChange: (v: 1 | 3 | 6) => void }) => (
    <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={t('UI-TEST-INTERVALL')}>
      {([1, 3, 6] as const).map((m) => (
        <button key={m} role="radio" aria-checked={value === m} className={`chip min-h-tap ${value === m ? 'border-akzent text-akzent' : ''}`} onClick={() => onChange(m)}>
          {t(`UI-TEST-MONATE-${m}`)}
        </button>
      ))}
    </div>
  );
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('UI-TEST-BEREICH')} back />
      <Page>
        {loading && !data ? (
          <Skeleton className="h-40" />
        ) : !data ? null : data.active ? (
          <div className="flex flex-col gap-4">
            {data.due && (
              <section className="card p-4 border-akzent">
                <p className="font-semibold text-lg">{t('UI-TEST-TITEL')}</p>
                <p className="mt-1">{t('UI-TEST-TEXT')}</p>
                <a className="btn-secondary mt-3 w-full" href={data.link.url} target="_blank" rel="noopener noreferrer">
                  {t('UI-TEST-TESTSTELLEN')} ↗
                </a>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button className="btn-primary" onClick={() => run(() => api.post('/api/health/reminder/done'))}>
                    {t('UI-TEST-ERLEDIGT')}
                  </button>
                  <button className="btn-secondary" onClick={() => run(() => api.post('/api/health/reminder/snooze'))}>
                    {t('UI-TEST-WOCHE')}
                  </button>
                </div>
              </section>
            )}
            <section className="card p-4">
              <p className="font-semibold">{t('UI-TEST-NAECHSTE', { datum: fmtDate(data.nextAt) })}</p>
              <div className="mt-3">
                <p className="label">{t('UI-TEST-INTERVALL')}</p>
                <Interval value={data.intervalMonths} onChange={(m) => run(() => api.put('/api/health/reminder', { intervalMonths: m, consent: true, push: data.push, inApp: data.inApp }))} />
              </div>
              <Toggle checked={data.push} onChange={(v) => run(() => api.put('/api/health/reminder', { intervalMonths: data.intervalMonths, consent: true, push: v, inApp: data.inApp }))} label={t('UI-TEST-KANAL-PUSH')} hint={t('UI-TEST-PUSH')} />
              <Toggle checked={data.inApp} onChange={(v) => run(() => api.put('/api/health/reminder', { intervalMonths: data.intervalMonths, consent: true, push: data.push, inApp: v }))} label={t('UI-TEST-KANAL-APP')} />
              {!data.due && (
                <button className="btn-secondary w-full mt-3" onClick={() => run(() => api.post('/api/health/reminder/done'))}>
                  {t('UI-TEST-GERADE')}
                </button>
              )}
              <a className="btn-ghost w-full mt-1" href={data.link.url} target="_blank" rel="noopener noreferrer">
                {t('UI-TEST-TESTSTELLEN')} ↗
              </a>
            </section>
            <p className="text-xs muted">{t('UI-TEST-DATEN')}</p>
            <button className="btn-danger" onClick={() => run(() => api.del('/api/health/reminder'), t('UI-TEST-AUS-FERTIG'))}>
              {t('UI-TEST-AUS')}
            </button>
          </div>
        ) : (
          <section className="card p-4">
            <Toggle checked={setup} onChange={setSetup} label={t('UI-TEST-SCHALTER')} hint={t('UI-TEST-SCHALTER-ERKL')} />
            {setup && (
              <div className="flex flex-col gap-3 mt-3">
                <div>
                  <p className="label">{t('UI-TEST-INTERVALL')}</p>
                  <Interval value={interval} onChange={setInterval} />
                </div>
                <Toggle checked={push} onChange={setPush} label={t('UI-TEST-KANAL-PUSH')} hint={t('UI-TEST-PUSH')} />
                <Toggle checked={inApp} onChange={setInApp} label={t('UI-TEST-KANAL-APP')} />
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 accent-akzent w-5 h-5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>{t('UI-TEST-EINWILLIGUNG')}</span>
                </label>
                <button
                  className="btn-primary"
                  disabled={!consent || (!push && !inApp)}
                  onClick={() => run(() => api.put('/api/health/reminder', { intervalMonths: interval, consent: true, push, inApp }))}
                >
                  {t('UI-TEST-AKTIVIEREN')}
                </button>
              </div>
            )}
          </section>
        )}
      </Page>
    </div>
  );
}

/** Wegweiser der App: Einstieg, vier Reiter, Unterseiten, öffentliche Seiten. */
import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Icon } from './components/ui';
import { useApp } from './lib/app';
import { installAppLock, installHideTriggers, isHidden, onHideChange } from './lib/hide';
import { Disguise } from './components/disguise';
import { t } from './lib/texts';
import { api } from './lib/api';
import { Einwilligung, Gast, HomeBildschirm, Konto, PasswortNeu, ProfilAnlegen, Willkommen, Wiederherstellung, WiederherstellungAbbrechen } from './screens/einstieg';
import { Naehe, Suche } from './screens/naehe';
import { Besucher, Gesundheit } from './screens/extras';
import { Reisen } from './screens/reisen';
import { DateEinstellungen, DateHome, DateOnboarding, DateProfil, DateUser } from './screens/date';
import { Veranstalter, VeranstalterVerifizieren, VeranstaltungBearbeiten, VeranstaltungChat, VeranstaltungVerwalten } from './screens/veranstalter';
import { FotoHinzufuegen, ProfilEditor, ProfilEigen, ProfilFremd } from './screens/profil';
import { AlbumAnsicht, AlbumBearbeiten, Alben, Chat, Chats } from './screens/chats';
import { Pruefung, PruefungAusweis, PruefungFertig } from './screens/pruefung';
import { Ereignis, Heute, Ort } from './screens/heute';
import { Abo, Blockiert, CheckIn, Daten, Einstellungen, Hilfe, Ich, KontoSichern, Meldungen, Merkliste, Mitteilungen, Sicherheit, Treffpunkt, Verstecken } from './screens/ich';
import { MeldenOhneKonto, Moderationszeiten, OrtBeanspruchen, OrtBestaetigen, Rechtliches } from './screens/oeffentlich';

/** Kleines eigenes Profilbild im Reiter „Ich“ (Issue #13). Ohne Foto die Initiale. */
function MeIcon({ active }: { active: boolean }) {
  const { me } = useApp();
  const [broken, setBroken] = useState(false);
  const pr = me?.profile;
  const url = pr?.photoMode === 'photo' ? me?.photos?.find((x: any) => x.status === 'approved')?.url : null;
  useEffect(() => setBroken(false), [url]);
  const ring = active ? 'ring-2 ring-akzent' : 'ring-1 ring-linie';
  if (url && !broken) return <img src={url} alt="" onError={() => setBroken(true)} className={`w-6 h-6 rounded-full object-cover ${ring}`} />;
  if (!pr) return <Icon name="me" className="w-6 h-6" />;
  return (
    <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold text-white ${ring}`} style={{ background: pr.color }} aria-hidden="true">
      {[...(pr.name ?? '?')][0]?.toUpperCase()}
    </span>
  );
}

function TabBar() {
  const { convBadge, unread, dot, date } = useApp();
  const tabs = [
    { to: '/naehe', label: t('UI-TAB-NAEHE'), icon: 'grid' },
    { to: '/heute', label: t('ST-HEU-01'), icon: 'today' },
    // Issue #19: fester Reiter „Date“ für alle — ausblendbar in den Einstellungen
    ...(date.enabled && !date.hidden ? [{ to: '/date', label: t('UI-TAB-DATE'), icon: 'heart', dot: date.dot }] : []),
    { to: '/chats', label: t('UI-TAB-CHATS'), icon: 'chat', badge: convBadge, dot: dot.chats },
    { to: '/ich', label: t('UI-TAB-ICH'), icon: 'me', badge: unread, dot: dot.ich },
  ] as { to: string; label: string; icon: string; badge?: number; dot?: boolean }[];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 px-3 pb-2 safe-bottom pointer-events-none" aria-label={t('UI-APP-HAUPTNAVIGATION')}>
      <div
        className={`pointer-events-auto max-w-md mx-auto grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} rounded-[22px] border border-white/[0.07] bg-[#161a22]/95 backdrop-blur-xl p-1`}
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px -12px rgba(0,0,0,0.85)' }}
      >
        {tabs.map((x) => (
          <NavLink
            key={x.to}
            to={x.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 min-h-[54px] rounded-[18px] text-[11px] font-medium tracking-wide transition ${isActive ? 'text-akzent bg-akzent/10' : 'text-leise hover:text-text'}`
            }
          >
            {({ isActive }) => (
              <>
                {x.to === '/ich' ? <MeIcon active={isActive} /> : <Icon name={x.icon} className={`w-6 h-6 transition ${isActive ? '-translate-y-px' : ''}`} />}
                <span>{x.label}</span>
                {!!x.badge && (
                  <span className="absolute top-1 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-gefahr text-white text-[11px] font-semibold grid place-items-center ring-2 ring-[#161a22]" aria-label={t('UI-APP-NEU', { zahl: x.badge })}>
                    {x.badge > 99 ? '99+' : x.badge}
                  </span>
                )}
                {!x.badge && x.dot && <span className="absolute top-1.5 left-1/2 ml-3 w-2.5 h-2.5 rounded-full bg-gefahr ring-2 ring-[#161a22]" aria-label={t('UI-APP-NEUES')} />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/** Rahmen der vier Reiter (S00): Inhalt plus Reiterleiste; Löschbanner auf allen Bildschirmen (S60). */
function Shell({ children }: { children: ReactNode }) {
  const { me } = useApp();
  const nav = useLocation();
  const due = me?.profile?.account?.deletionDueAt;
  return (
    <div className="min-h-screen pb-[92px]">
      {due && !nav.pathname.startsWith('/ich/daten') && (
        <div className="bg-warn/15 border-b border-warn/40 text-sm px-4 py-2 flex items-center gap-3">
          <span className="flex-1">{t('ST-DAT-13', { datum: new Date(due).toLocaleDateString('de-DE') })}</span>
          <NavLink to="/ich/daten" className="btn-ghost">
            {t('ST-DAT-14')}
          </NavLink>
        </div>
      )}
      {children}
      <TabBar />
    </div>
  );
}

/** Harmlose Ansicht nach dem Schnell-Verstecken (S54.03) — passend zum gewählten Symbol (Issue #11). */
function Versteckt() {
  const { config, logout } = useApp();
  return (
    <Disguise
      pinLength={config?.params.pinLength ?? 4}
      pinTries={config?.params.pinTries ?? 5}
      message={t('UI-PIN-FALSCH')}
      windowMs={config?.params.hideMs ?? 1000}
      onLocked={async () => {
        await logout();
        localStorage.clear();
        location.reload();
      }}
    />
  );
}

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-10 h-10 rounded-full border-2 border-akzent border-t-transparent animate-spin" aria-label={t('UI-APP-LAEDT')} />
    </div>
  );
}

function Gesperrt() {
  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col gap-4 justify-center">
      <p>{t('ST-VER-13')}</p>
      <p className="muted">{t('ST-VER-14')}</p>
      <NavLink to="/pruefung" className="btn-primary">
        {t('ST-VER-08')}
      </NavLink>
    </div>
  );
}

export default function App() {
  const { phase, config } = useApp();
  const [hidden, setHidden] = useState(isHidden());
  const loc = useLocation();

  useEffect(() => onHideChange(setHidden), []);
  // Gestaltung der App nur, solange sie sichtbar ist — die Tarnansicht sieht aus wie eine fremde App
  useEffect(() => {
    document.documentElement.classList.toggle('app-look', !hidden);
  }, [hidden]);
  // Issue #11: App-Sperre — beim Start und nach der Zeit im Hintergrund verdeckt
  useEffect(() => installAppLock(), []);
  useEffect(() => installHideTriggers(config?.params.hideMs ?? 1000), [config]);
  useEffect(() => {
    // Der Titel verrät nichts (Tarnung, F59)
    document.title = localStorage.getItem('tarn-name') || 'Notizen';
  }, [loc.pathname]);

  if (hidden) return <Versteckt />;

  const publicRoutes = (
    <>
      <Route path="/hilfe" element={<Hilfe publicMode />} />
      <Route path="/melden-ohne-konto" element={<MeldenOhneKonto />} />
      <Route path="/orte/beanspruchen/:id" element={<OrtBeanspruchen />} />
      <Route path="/orte/bestaetigen" element={<OrtBestaetigen />} />
      <Route path="/rechtliches/:seite" element={<Rechtliches />} />
      <Route path="/moderationszeiten" element={<Moderationszeiten />} />
      <Route path="/passwort" element={<PasswortNeu />} />
      <Route path="/wiederherstellung" element={<Wiederherstellung />} />
      <Route path="/wiederherstellung-abbrechen" element={<WiederherstellungAbbrechen />} />
      <Route path="/pruefung/fertig" element={<PruefungFertig />} />
      <Route path="/pruefung/ausweis" element={<PruefungAusweis />} />
    </>
  );

  if (phase === 'laden') return <Loading />;

  if (phase === 'gast') {
    return (
      <Routes>
        {publicRoutes}
        <Route path="/" element={<Gast />} />
        <Route path="/willkommen" element={<Willkommen />} />
        <Route path="/konto" element={<Konto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }
  if (phase === 'einwilligung') {
    return (
      <Routes>
        {publicRoutes}
        <Route path="*" element={<Einwilligung />} />
      </Routes>
    );
  }
  if (phase === 'profil') {
    return (
      <Routes>
        {publicRoutes}
        <Route path="/ich/fotos" element={<FotoHinzufuegen />} />
        <Route path="*" element={<ProfilAnlegen />} />
      </Routes>
    );
  }
  if (phase === 'gesperrt_minderjaehrig') {
    return (
      <Routes>
        {publicRoutes}
        <Route path="/pruefung" element={<Pruefung />} />
        <Route path="*" element={<Gesperrt />} />
      </Routes>
    );
  }
  if (phase === 'alterspruefung' || phase === 'pruefung_vor_eintritt') {
    return (
      <Routes>
        {publicRoutes}
        <Route path="*" element={<Pruefung gate />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {publicRoutes}
      <Route path="/home-bildschirm" element={<HomeBildschirm />} />
      <Route path="/" element={<Navigate to="/naehe" replace />} />
      <Route path="/naehe" element={<Shell><Naehe /></Shell>} />
      <Route path="/heute" element={<Shell><Heute /></Shell>} />
      <Route path="/chats" element={<Shell><Chats /></Shell>} />
      <Route path="/date" element={<Shell><DateHome /></Shell>} />
      <Route path="/date/likes" element={<Shell><DateHome /></Shell>} />
      <Route path="/date/onboarding" element={<DateOnboarding />} />
      <Route path="/date/profil" element={<DateProfil />} />
      <Route path="/date/einstellungen" element={<DateEinstellungen />} />
      <Route path="/date/u/:id" element={<DateUser />} />
      <Route path="/ich" element={<Shell><Ich /></Shell>} />
      <Route path="/suche" element={<Suche />} />
      <Route path="/profil/:id" element={<ProfilFremd />} />
      <Route path="/chats/:id" element={<Chat />} />
      <Route path="/album" element={<Navigate to="/alben" replace />} />
      <Route path="/alben" element={<Alben />} />
      <Route path="/alben/:albumId" element={<AlbumBearbeiten />} />
      <Route path="/album/:shareId" element={<AlbumAnsicht />} />
      <Route path="/pruefung" element={<Pruefung />} />
      <Route path="/orte/:id" element={<Ort />} />
      <Route path="/ereignisse/:id" element={<Ereignis />} />
      <Route path="/veranstalter" element={<Veranstalter />} />
      <Route path="/veranstalter/verifizieren" element={<VeranstalterVerifizieren />} />
      <Route path="/veranstalter/neu" element={<VeranstaltungBearbeiten />} />
      <Route path="/veranstalter/veranstaltungen/:id" element={<VeranstaltungVerwalten />} />
      <Route path="/veranstalter/veranstaltungen/:id/bearbeiten" element={<VeranstaltungBearbeiten />} />
      <Route path="/veranstaltungen/:id/chat/:guestId" element={<VeranstaltungChat />} />
      <Route path="/ich/profil" element={<ProfilEigen />} />
      <Route path="/ich/profil/bearbeiten" element={<ProfilEditor />} />
      <Route path="/ich/fotos" element={<FotoHinzufuegen />} />
      <Route path="/ich/sicherheit" element={<Sicherheit />} />
      <Route path="/ich/check-in" element={<CheckIn />} />
      <Route path="/sicherheit/check-in" element={<CheckIn />} />
      <Route path="/ich/treffpunkt" element={<Treffpunkt />} />
      <Route path="/ich/verstecken" element={<Verstecken />} />
      <Route path="/ich/mitteilungen" element={<Mitteilungen />} />
      <Route path="/ich/meldungen" element={<Meldungen />} />
      <Route path="/ich/daten" element={<Daten />} />
      <Route path="/ich/abo" element={<Abo />} />
      <Route path="/ich/einstellungen" element={<Einstellungen />} />
      <Route path="/ich/blockiert" element={<Blockiert />} />
      <Route path="/ich/merkliste" element={<Merkliste />} />
      <Route path="/ich/besucher" element={<Besucher />} />
      <Route path="/ich/reisen" element={<Reisen />} />
      <Route path="/ich/gesundheit" element={<Gesundheit />} />
      <Route path="/ich/hilfe" element={<Hilfe />} />
      <Route path="/ich/konto-sichern" element={<KontoSichern />} />
      <Route path="*" element={<Navigate to="/naehe" replace />} />
    </Routes>
  );
}

// kleine Hilfe für Bildschirme, die Standort melden
export async function reportPosition(): Promise<{ ok: boolean; reason?: string }> {
  if (!('geolocation' in navigator)) return { ok: false, reason: 'nicht_moeglich' };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.put('/api/location', { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          resolve({ ok: true });
        } catch {
          resolve({ ok: false, reason: 'server' });
        }
      },
      (err) => resolve({ ok: false, reason: err.code === err.PERMISSION_DENIED ? 'abgelehnt' : 'nicht_gefunden' }),
      // Nie mehr Genauigkeit als nötig: die Zelle ist ohnehin 500 m bis 2 km groß
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 15_000 },
    );
  });
}

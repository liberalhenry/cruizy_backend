/** Rasterkachel (S10.04): Foto / unkenntlich / Initiale · Name · Entfernung · Absicht · Abzeichen · Prüfzeichen. */
import { INTENTION_TEXT, fmtKm, t } from '../lib/texts';

export interface TileData {
  id: string;
  name: string | null;
  photo: string | null;
  blurred: boolean;
  initial: string;
  color: string;
  /** gerundete Kilometer, 0 = unter 1 km (Issue #12) */
  km: number | null;
  approx: boolean;
  isNew?: boolean;
  intention: { key: string; hours: number } | null;
  response: 1 | 2 | 3 | null;
  verified: boolean;
  travel?: { mode: 'auto' | 'flug'; km: number | null } | null;
  soon?: { from: string; to: string; place: string } | null;
  /** Issue #19: Date-Mitglied — nur für andere Date-Mitglieder gesetzt */
  date?: boolean;
}

export function intentionLabel(i: TileData['intention']) {
  if (!i) return t('ST-PRO-06');
  const name = t(INTENTION_TEXT[i.key] ?? 'ST-PRO-06');
  return i.hours ? `${name} · ${t('ST-PRO-07', { stunden: i.hours })}` : name;
}

/** Vollständiger Vorlesetext je Kachel (Barrierefreiheit). */
export function tileLabel(x: TileData) {
  return [
    x.name ?? t('UI-APP-PROFIL'),
    x.km !== null ? fmtKm(x.km) : null,
    x.approx ? t('ST-STO-41') : null,
    x.isNew ? t('UI-RASTER-NEU') : null,
    x.date ? t('UI-DATE-KACHEL') : null,
    intentionLabel(x.intention),
    x.response === 1 ? t('ST-PRO-10') : null,
    x.verified ? t('UI-APP-GEPRUEFT') : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function Tile({ x, onClick, compact }: { x: TileData; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="kachel group block w-full text-left rounded-2xl overflow-hidden bg-flaeche border border-white/[0.06] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.9)] focus:border-akzent hover:border-akzent/50 hover:-translate-y-0.5 transition"
      aria-label={tileLabel(x)}
    >
      <div className="relative aspect-[3/4] bg-flaeche2">
        {x.photo ? (
          <img src={x.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-display text-5xl font-bold text-white/90" style={{ background: x.color }}>
            {x.initial}
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex gap-1">
          {x.isNew && <span className="rounded-full bg-akzent text-grund text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider shadow-[0_0_12px_-2px_rgba(90,169,255,0.8)]">{t('UI-RASTER-NEU')}</span>}
          {x.date && (
            <span className="rounded-full bg-rose-400 text-grund text-[10px] font-semibold px-1.5 py-0.5" title={t('UI-DATE-KACHEL')}>
              ♥ {t('UI-DATE')}
            </span>
          )}
          {x.travel && (
            <span className="rounded-full bg-warn text-grund text-[11px] px-1.5 py-0.5" aria-hidden="true">
              {x.travel.mode === 'flug' ? '✈' : '🚗'}
            </span>
          )}
        </div>
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {x.response === 1 && (
            <span className="w-6 h-6 rounded-full bg-gut text-grund grid place-items-center text-[11px]" aria-hidden="true" title={t('ST-PRO-10')}>
              ↩
            </span>
          )}
          {x.verified && (
            <span className="w-6 h-6 rounded-full bg-akzent text-grund grid place-items-center text-xs font-bold ring-2 ring-black/30" aria-hidden="true">
              ✓
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2 pt-10 pb-1.5">
          {x.name && <div className="font-display text-[15px] font-bold leading-tight tracking-tight truncate">{x.name}</div>}
          <div className="zahl text-xs text-white/80 truncate">
            {x.km !== null ? fmtKm(x.km) : ''}
            {x.approx ? ` · ${t('ST-STO-41')}` : ''}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="px-2 py-1.5 text-xs leading-tight text-leise">
          <div className="truncate">{x.soon ? t('UI-TRAVEL-BALD-KURZ', { ort: x.soon.place }) : intentionLabel(x.intention)}</div>
        </div>
      )}
    </button>
  );
}

export function TileSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl bg-gradient-to-b from-flaeche2 to-flaeche animate-pulse" />
      ))}
    </div>
  );
}

/** Rasterkachel (S10.04): Foto / unkenntlich / Initiale · Name · Entfernungsband · Absicht · Antwortquote · Prüfzeichen. */
import { BAND_TEXT, INTENTION_TEXT, RESPONSE_TEXT, t } from '../lib/texts';

export interface TileData {
  id: string;
  name: string | null;
  photo: string | null;
  blurred: boolean;
  initial: string;
  color: string;
  band: 1 | 2 | 3 | 4 | null;
  approx: boolean;
  intention: { key: string; hours: number } | null;
  response: 1 | 2 | 3 | null;
  verified: boolean;
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
    x.band ? t(BAND_TEXT[x.band]) : null,
    x.approx ? t('ST-STO-41') : null,
    intentionLabel(x.intention),
    x.response ? t(RESPONSE_TEXT[x.response]) : null,
    x.verified ? t('UI-APP-GEPRUEFT') : null,
  ]
    .filter(Boolean)
    .join(', ');
}

export function Tile({ x, onClick }: { x: TileData; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-xl overflow-hidden bg-flaeche border border-linie focus:border-akzent" aria-label={tileLabel(x)}>
      <div className="relative aspect-[3/4] bg-flaeche2">
        {x.photo ? (
          <img src={x.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-4xl font-semibold text-white" style={{ background: x.color }}>
            {x.initial}
          </div>
        )}
        {x.verified && (
          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-akzent text-grund grid place-items-center text-xs" aria-hidden="true">
            ✓
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-1.5">
          {x.name && <div className="text-sm font-semibold truncate">{x.name}</div>}
          <div className="text-xs text-white/85 truncate">
            {x.band ? t(BAND_TEXT[x.band]) : ''}
            {x.approx ? ` · ${t('ST-STO-41')}` : ''}
          </div>
        </div>
      </div>
      <div className="px-2 py-1.5 text-xs leading-tight">
        <div className="truncate">{intentionLabel(x.intention)}</div>
        {x.response && <div className="truncate muted">{t(RESPONSE_TEXT[x.response])}</div>}
      </div>
    </button>
  );
}

export function TileSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-2" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-flaeche2 animate-pulse" />
      ))}
    </div>
  );
}

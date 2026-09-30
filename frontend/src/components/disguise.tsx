/**
 * Tarnansichten nach dem Schnell-Verstecken und bei der App-Sperre (F58, Issue #11).
 *
 * Jede Ansicht ist eine funktionierende, unauffällige kleine App — passend zum gewählten
 * Symbol auf dem Home-Bildschirm: Notizen, Rechner, Wetter, Kalender. Zurück geht es nur
 * mit der PIN, über eine versteckte Geste:
 *   Notizen   — Überschrift „Notizen“ lange drücken, dann PIN
 *   Rechner   — PIN eintippen und „=“ drücken
 *   Wetter    — Temperatur lange drücken, dann PIN
 *   Kalender  — Monatsnamen lange drücken, dann PIN
 * Nichts davon verlässt das Gerät; Notizen liegen nur lokal im Browser. Keine Wetterdaten
 * von Dritten — die Werte sind erfunden und bleiben einen Tag lang gleich.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { checkPin, currentDisguise, hasPin, unlock } from '../lib/hide';

type Unlock = (pin: string) => Promise<void>;

function useLongPress(fn: () => void, ms = 800) {
  const timer = useRef<number | undefined>(undefined);
  const start = () => {
    timer.current = window.setTimeout(fn, ms);
  };
  const stop = () => clearTimeout(timer.current);
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault() };
}

function PinPrompt({ onSubmit, light, len }: { onSubmit: Unlock; light?: boolean; len: number }) {
  const [pin, setPin] = useState('');
  const submit = async () => {
    const p = pin;
    setPin('');
    await onSubmit(p);
  };
  return (
    <div className="flex gap-2 mt-3 max-w-[14rem]">
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        maxLength={len}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className={`w-full rounded-lg px-3 py-2 border ${light ? 'bg-white border-[#ccc] text-[#222]' : 'bg-[#1c1c1e] border-[#333] text-white'}`}
        aria-label="Code"
      />
      <button className={`px-3 rounded-lg ${light ? 'bg-[#222] text-white' : 'bg-white text-black'}`} onClick={submit}>
        OK
      </button>
    </div>
  );
}

// ─────────────── Notizen ───────────────

interface Note {
  id: string;
  text: string;
  at: number;
}
const NOTES_KEY = 'tarn-notizen';
const DEFAULT_NOTES: Note[] = [
  { id: '1', text: 'Geschenkideen\n– Buch für Mama\n– Kerze\n– Gutschein Kino', at: Date.now() - 3 * 86400_000 },
  { id: '2', text: 'Rezept Linsensuppe\n200 g rote Linsen, 1 Zwiebel, 2 Karotten, Kreuzkümmel, 1 l Brühe', at: Date.now() - 9 * 86400_000 },
  { id: '3', text: 'Zahnarzt anrufen', at: Date.now() - 20 * 86400_000 },
];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_NOTES;
  } catch {
    return DEFAULT_NOTES;
  }
}

function Notizen({ onUnlock, len }: { onUnlock: Unlock; len: number }) {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [open, setOpen] = useState<Note | null>(null);
  const [asking, setAsking] = useState(false);
  const lp = useLongPress(() => (hasPin() ? setAsking(true) : onUnlock('')));
  const save = (list: Note[]) => {
    setNotes(list);
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(list));
    } catch {
      /* egal */
    }
  };
  if (open) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] text-[#1d1d1f] p-4">
        <button className="text-[#c69214] mb-3" onClick={() => (save(notes.map((n) => (n.id === open.id ? open : n)).filter((n) => n.text.trim())), setOpen(null))}>
          ‹ Notizen
        </button>
        <textarea
          autoFocus
          className="w-full min-h-[70vh] bg-transparent outline-none text-lg leading-relaxed"
          value={open.text}
          onChange={(e) => setOpen({ ...open, text: e.target.value, at: Date.now() })}
        />
      </div>
    );
  }
  const sorted = [...notes].sort((a, b) => b.at - a.at);
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1d1d1f] p-4 select-none">
      <h1 className="text-3xl font-bold mb-3" {...lp}>
        Notizen
      </h1>
      {asking && <PinPrompt light len={len} onSubmit={onUnlock} />}
      <ul className="mt-3 rounded-xl bg-white divide-y divide-[#eee] border border-[#eee]">
        {sorted.map((n) => (
          <li key={n.id}>
            <button className="w-full text-left px-4 py-3" onClick={() => setOpen(n)}>
              <span className="block font-semibold truncate">{n.text.split('\n')[0] || 'Neue Notiz'}</span>
              <span className="block text-sm text-[#888] truncate">
                {new Date(n.at).toLocaleDateString('de-DE')} · {n.text.split('\n')[1] ?? ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-[#999] mt-3">{notes.length} Notizen</p>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#c69214] text-white text-3xl shadow-lg"
        aria-label="Neue Notiz"
        onClick={() => {
          const n = { id: String(Date.now()), text: '', at: Date.now() };
          save([n, ...notes]);
          setOpen(n);
        }}
      >
        +
      </button>
    </div>
  );
}

// ─────────────── Rechner ───────────────

function Rechner({ onUnlock, len }: { onUnlock: Unlock; len: number }) {
  const [display, setDisplay] = useState('0');
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [typed, setTyped] = useState('');
  const num = (d: string) => {
    setTyped((x) => (x + d).slice(-12));
    if (fresh || display === '0') {
      setDisplay(d === ',' ? '0,' : d);
      setFresh(false);
    } else if (display.length < 12) setDisplay(display + d);
  };
  const val = () => Number(display.replace(',', '.'));
  const calc = (a: number, b: number, o: string) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b);
  const fmt = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1e10) / 1e10).replace('.', ',') : 'Fehler');
  const operator = (o: string) => {
    setTyped('');
    if (acc !== null && op && !fresh) {
      const r = calc(acc, val(), op);
      setAcc(r);
      setDisplay(fmt(r));
    } else setAcc(val());
    setOp(o);
    setFresh(true);
  };
  const equals = async () => {
    // PIN + „=“ öffnet die App — nur reine Ziffernfolgen in PIN-Länge zählen als Versuch
    if (op === null && /^\d+$/.test(typed) && typed.length === len && hasPin()) {
      const t = typed;
      setTyped('');
      if (await checkPin(t)) return onUnlock(t);
      await onUnlock(t); // zählt als Fehlversuch
      return;
    }
    if (!hasPin() && typed === '' && display === '0') return onUnlock('');
    setTyped('');
    if (acc === null || !op) return;
    const r = calc(acc, val(), op);
    setDisplay(fmt(r));
    setAcc(null);
    setOp(null);
    setFresh(true);
  };
  const key = (label: string, onClick: () => void, cls = 'bg-[#333] text-white') => (
    <button key={label} className={`h-[18vw] max-h-20 rounded-full text-3xl ${cls} active:opacity-70`} onClick={onClick}>
      {label}
    </button>
  );
  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col justify-end select-none">
      <div className="text-right text-6xl font-light mb-4 px-2 truncate" aria-live="polite">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-3 max-w-md w-full mx-auto">
        {key('AC', () => (setDisplay('0'), setAcc(null), setOp(null), setTyped(''), setFresh(true)), 'bg-[#a5a5a5] text-black')}
        {key('±', () => setDisplay(fmt(-val())), 'bg-[#a5a5a5] text-black')}
        {key('%', () => setDisplay(fmt(val() / 100)), 'bg-[#a5a5a5] text-black')}
        {key('÷', () => operator('÷'), 'bg-[#ff9f0a]')}
        {['7', '8', '9'].map((d) => key(d, () => num(d)))}
        {key('×', () => operator('×'), 'bg-[#ff9f0a]')}
        {['4', '5', '6'].map((d) => key(d, () => num(d)))}
        {key('−', () => operator('−'), 'bg-[#ff9f0a]')}
        {['1', '2', '3'].map((d) => key(d, () => num(d)))}
        {key('+', () => operator('+'), 'bg-[#ff9f0a]')}
        <button className="col-span-2 h-[18vw] max-h-20 rounded-full text-3xl bg-[#333] text-left pl-8" onClick={() => num('0')}>
          0
        </button>
        {key(',', () => num(','))}
        {key('=', equals, 'bg-[#ff9f0a]')}
      </div>
    </div>
  );
}

// ─────────────── Wetter ───────────────

function seeded(seed: number) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function Wetter({ onUnlock, len }: { onUnlock: Unlock; len: number }) {
  const [city, setCity] = useState(() => localStorage.getItem('tarn-stadt') || 'Köln');
  const [asking, setAsking] = useState(false);
  const lp = useLongPress(() => (hasPin() ? setAsking(true) : onUnlock('')));
  const day = Math.floor(Date.now() / 86400_000);
  const month = new Date().getMonth();
  const base = [3, 4, 8, 12, 16, 20, 22, 22, 18, 13, 8, 4][month];
  const rnd = seeded(day * 31 + city.length * 7);
  const icons = ['☀️', '🌤️', '⛅', '🌥️', '🌧️', '🌦️'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const t = Math.round(base + rnd() * 8 - 3);
    return { day: new Date(Date.now() + i * 86400_000).toLocaleDateString('de-DE', { weekday: 'short' }), hi: t + 3, lo: t - 4, icon: icons[Math.floor(rnd() * icons.length)] };
  });
  const hours = Array.from({ length: 8 }, (_, i) => ({ h: (new Date().getHours() + i) % 24, t: Math.round(base + rnd() * 5 - 1), icon: icons[Math.floor(rnd() * 4)] }));
  // heute: Hoch und Tief umfassen die Stundenwerte
  days[0].hi = Math.max(days[0].hi, ...hours.map((h) => h.t));
  days[0].lo = Math.min(days[0].lo, ...hours.map((h) => h.t));
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3b82c4] to-[#7fb2e5] text-white p-5 select-none">
      <div className="text-center mt-8">
        <input
          className="bg-transparent text-center text-3xl outline-none w-full"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            localStorage.setItem('tarn-stadt', e.target.value);
          }}
          aria-label="Ort"
        />
        <div className="text-8xl font-thin mt-1" {...lp}>
          {hours[0].t}°
        </div>
        <p className="text-lg">{days[0].icon} Überwiegend bewölkt</p>
        <p className="text-sm opacity-80">
          H: {days[0].hi}° T: {days[0].lo}°
        </p>
        {asking && (
          <div className="flex justify-center">
            <PinPrompt len={len} onSubmit={onUnlock} />
          </div>
        )}
      </div>
      <div className="mt-8 rounded-2xl bg-white/15 p-3 flex justify-between overflow-x-auto gap-4">
        {hours.map((h, i) => (
          <div key={i} className="flex flex-col items-center text-sm gap-1 shrink-0">
            <span>{i === 0 ? 'Jetzt' : `${h.h}`}</span>
            <span className="text-xl">{h.icon}</span>
            <span>{h.t}°</span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/15 p-3">
        <p className="text-xs uppercase opacity-80 mb-2">7-Tage-Vorhersage</p>
        {days.map((d, i) => (
          <div key={i} className="flex items-center py-2 border-t border-white/20 first:border-0">
            <span className="w-12">{i === 0 ? 'Heute' : d.day}</span>
            <span className="w-10 text-xl">{d.icon}</span>
            <span className="flex-1 text-right opacity-80">{d.lo}°</span>
            <span className="w-24 mx-3 h-1 rounded-full bg-gradient-to-r from-[#9fd3ff] to-[#ffcf5a]" />
            <span>{d.hi}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Kalender ───────────────

function Kalender({ onUnlock, len }: { onUnlock: Unlock; len: number }) {
  const [offset, setOffset] = useState(0);
  const [asking, setAsking] = useState(false);
  const lp = useLongPress(() => (hasPin() ? setAsking(true) : onUnlock('')));
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const isToday = (d: number | null) => d && offset === 0 && d === now.getDate();
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] p-4 select-none">
      <div className="flex items-center justify-between mt-4">
        <button className="text-[#e5484d] text-2xl px-2" onClick={() => setOffset(offset - 1)} aria-label="Vorheriger Monat">
          ‹
        </button>
        <h1 className="text-2xl font-bold" {...lp}>
          {first.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h1>
        <button className="text-[#e5484d] text-2xl px-2" onClick={() => setOffset(offset + 1)} aria-label="Nächster Monat">
          ›
        </button>
      </div>
      {asking && (
        <div className="flex justify-center">
          <PinPrompt light len={len} onSubmit={onUnlock} />
        </div>
      )}
      <div className="grid grid-cols-7 text-center text-xs text-[#888] mt-6">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center mt-2 gap-y-3">
        {cells.map((d, i) => (
          <span key={i} className={`mx-auto w-9 h-9 grid place-items-center rounded-full ${isToday(d) ? 'bg-[#e5484d] text-white font-semibold' : ''}`}>
            {d ?? ''}
          </span>
        ))}
      </div>
      <p className="text-sm text-[#888] mt-8">Keine Termine</p>
    </div>
  );
}

/** Die Tarnansicht passend zum gewählten Symbol. */
export function Disguise({ pinLength, pinTries, onLocked, message }: { pinLength: number; pinTries: number; onLocked: () => void; message?: ReactNode }) {
  const [kind] = useState(currentDisguise());
  const [err, setErr] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setErr(false), 2500);
    return () => clearTimeout(id);
  }, [err]);
  const tryUnlock: Unlock = async (pin) => {
    const r = await unlock(pin, pinTries);
    if (r === 'gesperrt') onLocked();
    else if (!r) setErr(true);
  };
  const View = { a: Notizen, b: Rechner, c: Wetter, d: Kalender }[kind];
  return (
    <>
      <View onUnlock={tryUnlock} len={pinLength} />
      {err && <div className="fixed top-3 inset-x-0 text-center text-sm text-[#a33]">{message ?? '—'}</div>}
    </>
  );
}

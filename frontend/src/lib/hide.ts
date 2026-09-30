/**
 * Schnell verstecken (F58) in der Web-App: dreimal schnell auf den Titel tippen
 * oder zweimal Escape (ST-SIC-31). Danach erscheint eine harmlose Ansicht;
 * zurück nur mit der PIN. Die PIN liegt nur als Prüfwert auf diesem Gerät.
 */
const KEY_PIN = 'pin';
const KEY_HIDDEN = 'versteckt';
const KEY_TRIES = 'pin-versuche';

type Listener = (hidden: boolean) => void;
const listeners = new Set<Listener>();

export function onHideChange(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function isHidden() {
  try {
    return localStorage.getItem(KEY_HIDDEN) === '1';
  } catch {
    return false;
  }
}

export function hideNow() {
  try {
    localStorage.setItem(KEY_HIDDEN, '1');
  } catch {
    /* ohne Speicher trotzdem umschalten */
  }
  try {
    document.title = localStorage.getItem('tarn-name') || 'Notizen';
  } catch {
    document.title = 'Notizen';
  }
  listeners.forEach((fn) => fn(true));
}

async function hash(pin: string, salt: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hasPin() {
  try {
    return !!localStorage.getItem(KEY_PIN);
  } catch {
    return false;
  }
}

export async function setPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint32Array(2)).join('-');
  localStorage.setItem(KEY_PIN, JSON.stringify({ salt, h: await hash(pin, salt) }));
}

export function removePin() {
  localStorage.removeItem(KEY_PIN);
}

/** Gibt true zurück, wenn entsperrt; 'gesperrt', wenn zu viele Versuche. */
export async function unlock(pin: string, maxTries: number): Promise<true | false | 'gesperrt'> {
  const raw = localStorage.getItem(KEY_PIN);
  if (!raw) {
    localStorage.removeItem(KEY_HIDDEN);
    listeners.forEach((fn) => fn(false));
    return true;
  }
  const { salt, h } = JSON.parse(raw);
  if ((await hash(pin, salt)) === h) {
    localStorage.removeItem(KEY_HIDDEN);
    localStorage.removeItem(KEY_TRIES);
    listeners.forEach((fn) => fn(false));
    return true;
  }
  const tries = Number(localStorage.getItem(KEY_TRIES) ?? 0) + 1;
  localStorage.setItem(KEY_TRIES, String(tries));
  if (tries >= maxTries) return 'gesperrt';
  return false;
}

export function resetHideState() {
  localStorage.removeItem(KEY_HIDDEN);
  localStorage.removeItem(KEY_TRIES);
}

/** Auslöser: dreimal Tippen innerhalb der Zeit, zweimal Escape. */
export function installHideTriggers(windowMs: number) {
  let escAt = 0;
  const onKey = (e: KeyboardEvent) => {
    // versteckt: zweimal Escape führt zurück (Issue #38, in der Tarnansicht) — nicht erneut verstecken
    if (e.key !== 'Escape' || isHidden()) return;
    const now = Date.now();
    if (now - escAt < windowMs) hideNow();
    escAt = now;
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

export function tripleTap(windowMs: number) {
  let taps: number[] = [];
  return () => {
    const now = Date.now();
    taps = taps.filter((x) => now - x < windowMs).concat(now);
    if (taps.length >= 3) {
      taps = [];
      hideNow();
    }
  };
}

// ───────────── App-Sperre (Issue #11) ─────────────
// Ist sie an (und eine PIN gesetzt), startet die App verdeckt — hinter der gewählten Tarnung —
// und verdeckt sich wieder, wenn sie länger als die gewählte Zeit im Hintergrund war.

const KEY_LOCK = 'app-sperre';
const KEY_LOCK_MIN = 'app-sperre-min';
const KEY_BG = 'app-hintergrund';

export function lockSettings(): { on: boolean; minutes: number } {
  try {
    return { on: localStorage.getItem(KEY_LOCK) === '1' && hasPin(), minutes: Number(localStorage.getItem(KEY_LOCK_MIN) ?? 0) };
  } catch {
    return { on: false, minutes: 0 };
  }
}

export function setLock(on: boolean, minutes: number) {
  localStorage.setItem(KEY_LOCK, on ? '1' : '0');
  localStorage.setItem(KEY_LOCK_MIN, String(minutes));
}

/** Beim Start: gesperrt → verdeckt. Rückgabe: Aufräumfunktion für den Hintergrund-Wächter. */
export function installAppLock() {
  const l = lockSettings();
  if (l.on && !isHidden()) {
    // frischer Start → immer verdeckt
    const bg = Number(sessionStorage.getItem(KEY_BG) ?? 0);
    if (!bg || Date.now() - bg >= l.minutes * 60_000) hideNow();
  }
  const onVis = () => {
    const s = lockSettings();
    if (!s.on) return;
    if (document.visibilityState === 'hidden') sessionStorage.setItem(KEY_BG, String(Date.now()));
    else {
      const at = Number(sessionStorage.getItem(KEY_BG) ?? 0);
      if (at && Date.now() - at >= s.minutes * 60_000) hideNow();
    }
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}

/** Gewählte Tarnung (Symbol, Name und Ansicht nach dem Verstecken). */
export type Disguise = 'a' | 'b' | 'c' | 'd';
export function currentDisguise(): Disguise {
  try {
    const k = localStorage.getItem('tarn-symbol');
    return (['a', 'b', 'c', 'd'].includes(k ?? '') ? k : 'a') as Disguise;
  } catch {
    return 'a';
  }
}

/** PIN prüfen, ohne den Zustand zu ändern (für die Tarnansichten). */
export async function checkPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(KEY_PIN);
  if (!raw) return false;
  const { salt, h } = JSON.parse(raw);
  return (await hash(pin, salt)) === h;
}

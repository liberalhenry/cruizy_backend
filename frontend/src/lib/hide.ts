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
  document.title = 'Notizen';
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
    if (e.key !== 'Escape') return;
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

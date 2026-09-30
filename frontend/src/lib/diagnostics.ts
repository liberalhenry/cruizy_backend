/**
 * Diagnosedaten für das Support-Team (Issue #37). Gesammelt wird erst, wenn die Person eine Anfrage des
 * Teams freigibt — vorher verlässt nichts davon das Gerät. Keine Inhalte, keine Standortdaten, keine
 * Kennungen: nur Technik (Browser, Bildschirm, Sprache, Mitteilungs- und Speicherstatus) und die letzten
 * Fehlermeldungen der App (ohne Adressen mit Kennungen).
 */
const KEY = 'diagnose-fehler';
const MAX = 10;

function remember(message: string, where?: string) {
  try {
    const list: { at: string; message: string; where?: string }[] = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    list.push({ at: new Date().toISOString(), message: message.slice(0, 300), ...(where ? { where: where.replace(/[0-9a-f-]{36}/gi, '…').slice(0, 200) } : {}) });
    sessionStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* ohne Speicher keine Fehlerliste */
  }
}

/** Beim Start: Fehler der App mitschreiben (nur auf diesem Gerät, nur für diese Sitzung). */
export function installErrorCapture() {
  window.addEventListener('error', (e) => remember(String(e.message || 'Fehler'), e.filename ? `${e.filename.split('/').pop()}:${e.lineno}` : undefined));
  window.addEventListener('unhandledrejection', (e) => remember(String((e.reason as Error)?.message ?? e.reason ?? 'Fehler')));
}

export async function collectDiagnostics(): Promise<Record<string, unknown>> {
  let storage: { usedMb: number; quotaMb: number } | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) storage = { usedMb: Math.round((est.usage ?? 0) / 1e5) / 10, quotaMb: Math.round((est.quota ?? 0) / 1e6) };
  } catch {
    /* nicht verfügbar */
  }
  let errors: unknown[] = [];
  try {
    errors = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
  } catch {
    /* leer */
  }
  return {
    userAgent: navigator.userAgent,
    platform: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}@${window.devicePixelRatio}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    installed: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
    online: navigator.onLine,
    cookies: navigator.cookieEnabled,
    notifications: typeof Notification === 'undefined' ? 'nicht unterstützt' : Notification.permission,
    serviceWorker: 'serviceWorker' in navigator ? (navigator.serviceWorker.controller ? 'aktiv' : 'nicht aktiv') : 'nicht unterstützt',
    storage,
    errors,
  };
}

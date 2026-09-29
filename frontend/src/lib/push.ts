/** Web-Push (Q-06): erst nach der eigenen Erklärung (S14) anfragen, nie auf Vorrat. */
import { api } from './api';

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const s = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIosSafariNotInstalled() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  return ios && !standalone;
}

export async function enablePush(vapidKey: string): Promise<'ok' | 'abgelehnt' | 'blockiert' | 'nicht_moeglich'> {
  if (!pushSupported() || !vapidKey) return 'nicht_moeglich';
  if (Notification.permission === 'denied') return 'blockiert';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'abgelehnt';
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapidKey) }));
  const json = sub.toJSON();
  await api.post('/api/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
  return 'ok';
}

export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await api.post('/api/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  }
}

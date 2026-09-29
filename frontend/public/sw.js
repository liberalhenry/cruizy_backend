/*
 * Service Worker: Offline-Grundgerüst, Web-Push, Weiterreichen beim Check-in.
 * Antworten der API werden nie zwischengespeichert — der Offline-Stand liegt
 * ausschließlich in IndexedDB der App.
 */
const SHELL = 'rahmen-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.webmanifest'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/mod-api/')) return;
  if (e.request.mode === 'navigate') {
    // Netz zuerst, sonst der gespeicherte Rahmen
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(SHELL).then((c) => c.put('/', copy));
          return r;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((r) => {
            const copy = r.clone();
            caches.open(SHELL).then((c) => c.put(e.request, copy));
            return r;
          }),
      ),
    );
  }
});

/** IndexedDB der App lesen (Vertrauenspersonen liegen nur auf dem Gerät, ST-CHK-08). */
function idbGet(key) {
  return new Promise((resolve) => {
    const r = indexedDB.open('ablage', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => resolve(undefined);
    r.onsuccess = () => {
      try {
        const g = r.result.transaction('kv').objectStore('kv').get(key);
        g.onsuccess = () => resolve(g.result);
        g.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    };
  });
}

async function relay(checkinId) {
  const v = await idbGet('vertrauen');
  if (!v || !v.recipients || !v.recipients.length) return;
  await fetch(`/api/checkins/${checkinId}/relay`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', 'x-cruizy': '1' },
    body: JSON.stringify({ recipients: v.recipients, text: v.text }),
  }).catch(() => {});
}

self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: 'Neue Mitteilung' };
  }
  const tasks = [];
  // Durchreichen (Nr. 83 a): zur fälligen Zeit, solange das Telefon an ist und Netz hat
  if (typeof data.tag === 'string' && data.tag.startsWith('relay:')) tasks.push(relay(data.tag.slice(6)));
  tasks.push(
    self.registration.showNotification(data.title || 'Neue Mitteilung', {
      body: data.body || undefined,
      tag: data.tag || undefined,
      icon: '/icons/symbol-a-180.png',
      data: { url: data.url || '/' },
      requireInteraction: data.kind === 'checkin',
    }),
  );
  e.waitUntil(Promise.all(tasks));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

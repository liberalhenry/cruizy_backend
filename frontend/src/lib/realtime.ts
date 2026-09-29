/**
 * Echtzeit-Verbindung. Meldet nur „aktiv“, solange die App sichtbar ist (FV-35) —
 * nie Lesen oder Tippen.
 */
type Handler = (data: any) => void;
const handlers = new Map<string, Set<Handler>>();
let ws: WebSocket | null = null;
let retry = 0;
let wanted = false;
let activeTimer: number | undefined;

export function on(event: string, fn: Handler) {
  let set = handlers.get(event);
  if (!set) handlers.set(event, (set = new Set()));
  set.add(fn);
  return () => {
    set!.delete(fn);
  };
}

function dispatch(event: string, data: unknown) {
  handlers.get(event)?.forEach((fn) => fn(data));
  handlers.get('*')?.forEach((fn) => fn({ event, data }));
}

function connect() {
  if (!wanted || ws) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/api/ws`);
  ws.onopen = () => {
    retry = 0;
    sendActive();
  };
  ws.onmessage = (m) => {
    try {
      const msg = JSON.parse(m.data);
      dispatch(msg.e, msg.d);
    } catch {
      /* ignorieren */
    }
  };
  ws.onclose = (ev) => {
    ws = null;
    if (ev.code === 4001) return; // abgemeldet
    if (wanted) setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
  };
}

function sendActive() {
  if (ws?.readyState === 1 && document.visibilityState === 'visible') ws.send(JSON.stringify({ e: 'aktiv' }));
}

export function startRealtime() {
  wanted = true;
  connect();
  clearInterval(activeTimer);
  activeTimer = window.setInterval(sendActive, 60_000);
  document.addEventListener('visibilitychange', sendActive);
}

export function stopRealtime() {
  wanted = false;
  clearInterval(activeTimer);
  ws?.close();
  ws = null;
}

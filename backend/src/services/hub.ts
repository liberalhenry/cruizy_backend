/**
 * Echtzeit-Verteiler: offene WebSocket-Verbindungen je Konto (ein Prozess).
 * Übertragen werden nur Ereignisse für das jeweilige Konto — nie Standortwerte
 * und nie Lese- oder Tippsignale (F52).
 */
import type { WebSocket } from 'ws';

const sockets = new Map<string, Set<WebSocket>>();

export function addSocket(accountId: string, ws: WebSocket) {
  let set = sockets.get(accountId);
  if (!set) sockets.set(accountId, (set = new Set()));
  set.add(ws);
}

export function removeSocket(accountId: string, ws: WebSocket) {
  const set = sockets.get(accountId);
  if (!set) return;
  set.delete(ws);
  if (!set.size) sockets.delete(accountId);
}

export function isConnected(accountId: string) {
  return (sockets.get(accountId)?.size ?? 0) > 0;
}

export function emit(accountId: string, event: string, data: unknown = {}) {
  const set = sockets.get(accountId);
  if (!set) return;
  const msg = JSON.stringify({ e: event, d: data });
  for (const ws of set) {
    try {
      if (ws.readyState === 1) ws.send(msg);
    } catch {
      /* Verbindung ist weg — wird beim close entfernt */
    }
  }
}

export function closeAllFor(accountId: string) {
  const set = sockets.get(accountId);
  if (!set) return;
  for (const ws of set) ws.close(4001, 'abgemeldet');
  sockets.delete(accountId);
}

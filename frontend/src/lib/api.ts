/**
 * Aufrufe an den Server. Schreibende Aufrufe tragen den Kopf „x-cruizy“ (Schutz vor
 * fremd ausgelösten Anfragen). Fehler kommen als Text-ID zurück und werden hier übersetzt.
 */
import { t } from './texts';

export class ApiError extends Error {
  constructor(
    public status: number,
    public textId: string,
    public code: string | null,
    public vars: Record<string, string | number> = {},
  ) {
    super(t(textId, vars));
  }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(method: string, url: string, body?: unknown, opts: { raw?: boolean; prefix?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { 'x-cruizy': '1' };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'ST-FEH-01', 'offline');
  }
  if (opts.raw) {
    if (!res.ok) throw new ApiError(res.status, 'ST-FEH-02', 'server');
    return res as unknown as T;
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 401 && data?.fehler === 'ST-FEH-04') onUnauthorized?.();
    throw new ApiError(res.status, data?.fehler ?? 'ST-FEH-02', data?.code ?? null, data?.vars ?? {});
  }
  return data as T;
}

export const api = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, body: unknown = {}) => request<T>('POST', url, body),
  put: <T = any>(url: string, body: unknown = {}) => request<T>('PUT', url, body),
  patch: <T = any>(url: string, body: unknown = {}) => request<T>('PATCH', url, body),
  del: <T = any>(url: string, body?: unknown) => request<T>('DELETE', url, body),
  upload: <T = any>(url: string, file: Blob, fields: Record<string, string> = {}) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    fd.append('file', file, 'bild.jpg');
    return request<T>('POST', url, fd);
  },
  raw: (url: string) => request<Response>('GET', url, undefined, { raw: true }),
};

export function errText(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return t('ST-FEH-02');
}

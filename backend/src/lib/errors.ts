/**
 * Fehler mit Text-ID. Fehlermeldungen kommen immer aus ST-FEH-* (AK-Q06-15);
 * der Client zeigt den Text zur ID, nie „Ein Fehler ist aufgetreten“.
 */
export class AppError extends Error {
  constructor(
    public status: number,
    public textId: string,
    public vars: Record<string, string | number> = {},
    public code?: string,
  ) {
    super(code ?? textId);
  }
}

export const bad = (textId: string, vars: Record<string, string | number> = {}, code?: string) =>
  new AppError(400, textId, vars, code);
export const forbidden = (textId = 'ST-FEH-02', code = 'verboten') => new AppError(403, textId, {}, code);
export const notFound = (code = 'nicht_gefunden') => new AppError(404, 'UI-NICHT-VERFUEGBAR', {}, code);
export const conflict = (textId: string, code?: string) => new AppError(409, textId, {}, code);
export const tooMany = (textId = 'UI-ZU-VIELE', code = 'zu_viele') => new AppError(429, textId, {}, code);
export const unauthorized = () => new AppError(401, 'ST-FEH-04', {}, 'nicht_angemeldet');

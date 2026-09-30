/** Issue #32: Codes an Telefonnummern kommen per Telegram — Hinweis mit Knopf zum Bot. */
import { useApp } from '../lib/app';
import { t } from '../lib/texts';

export function TelegramHint({ url }: { url?: string | null }) {
  const { config } = useApp();
  const link = url ?? config?.telegramBot ?? null;
  return (
    <div className="card p-3 flex flex-col gap-2 text-sm">
      <p>{t('UI-TG-CODE-KOMMT')}</p>
      {link && (
        <a className="btn-secondary self-start" href={link} target="_blank" rel="noopener noreferrer">
          {t('UI-TG-OEFFNEN')} ↗
        </a>
      )}
    </div>
  );
}

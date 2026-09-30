/** S70 Melden (ein Ablauf für alle Orte) und S71 Blockieren. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Sheet, TextArea, Toggle } from './ui';
import { api, ApiError, errText } from '../lib/api';
import { useApp } from '../lib/app';
import { t } from '../lib/texts';

export const REPORT_REASONS: { key: string; textId: string }[] = [
  { key: 'belaestigung', textId: 'ST-MEL-03' },
  { key: 'nacktbilder', textId: 'ST-MEL-04' },
  { key: 'intim_ohne_einwilligung', textId: 'UI-MEL-INTIM' },
  { key: 'fake', textId: 'ST-MEL-05' },
  { key: 'minderjaehrig', textId: 'ST-MEL-06' },
  { key: 'hass', textId: 'ST-MEL-07' },
  { key: 'sexgeld', textId: 'ST-MEL-08' },
  { key: 'gefahr', textId: 'ST-MEL-09' },
  { key: 'anderes', textId: 'ST-MEL-10' },
];

export interface ReportItem {
  kind: 'message' | 'album_image' | 'group_message' | 'event_chat_message';
  id: string;
  label: string;
  image?: boolean;
}

export function ReportSheet({
  open,
  onClose,
  targetId,
  targetName,
  context,
  contextId,
  items = [],
  onBlocked,
  dateChat,
}: {
  open: boolean;
  onClose: () => void;
  targetId?: string | null;
  targetName?: string | null;
  context: 'profil' | 'gespraech' | 'album' | 'gruppe' | 'ort' | 'ereignis' | 'veranstaltung_chat' | 'date';
  contextId?: string;
  items?: ReportItem[];
  onBlocked?: () => void;
  dateChat?: boolean;
}) {
  const nav = useNavigate();
  const [reason, setReason] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pickedItems = items.filter((i) => picked.has(i.id));
  const withImage = pickedItems.some((i) => i.image) || context === 'album';

  const close = () => {
    setReason(null);
    setDesc('');
    setPicked(new Set());
    setAlsoBlock(false);
    setDone(null);
    setErr(null);
    onClose();
  };

  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post('/api/reports', {
        reason,
        description: desc || undefined,
        targetId: targetId ?? undefined,
        context,
        contextId,
        items: pickedItems.map((i) => ({ kind: i.kind, id: i.id })),
        alsoBlock,
      });
      setDone(r.number);
      if (alsoBlock) onBlocked?.();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title={t('ST-MEL-01')}>
      {done ? (
        <div className="flex flex-col gap-3">
          <p>{t('ST-MEL-16', { fallnummer: done })}</p>
          <p className="text-sm muted">{t('ST-MEL-17', { name: targetName ?? t('UI-DIE-PERSON') })}</p>
          <button
            className="btn-secondary"
            onClick={() => {
              close();
              nav('/ich/meldungen');
            }}
          >
            {t('UI-MELDUNGEN-TITEL')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className={`rounded-xl border px-4 py-3 text-sm ${reason === 'gefahr' ? 'border-gefahr bg-gefahr/15' : 'border-linie bg-flaeche2'}`}>
            {t('ST-MEL-11')}{' '}
            <a href="tel:112" className="underline text-akzent">
              112
            </a>
          </div>
          <fieldset>
            <legend className="font-semibold mb-2">{t('ST-MEL-02')}</legend>
            <div className="flex flex-col gap-1">
              {/* Issue #19: in Date und in Date-Chats zusätzlich „passt nicht zu Date“ */}
              {(context === 'date' || dateChat ? [{ key: 'passt_nicht_zu_date', textId: 'UI-MEL-DATE' }, ...REPORT_REASONS] : REPORT_REASONS).map((r) => (
                <label key={r.key} className="flex items-center gap-3 min-h-tap">
                  <input type="radio" name="grund" className="accent-akzent w-5 h-5" checked={reason === r.key} onChange={() => setReason(r.key)} />
                  {t(r.textId)}
                </label>
              ))}
            </div>
          </fieldset>
          {items.length > 0 && (
            <fieldset>
              <legend className="font-semibold mb-2">{t('UI-MELDEN-AUSWAHL')}</legend>
              <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                {items.map((i) => (
                  <label key={i.id} className="flex items-start gap-3 py-1">
                    <input
                      type="checkbox"
                      className="mt-1 accent-akzent w-5 h-5"
                      checked={picked.has(i.id)}
                      onChange={(e) => {
                        const s = new Set(picked);
                        e.target.checked ? s.add(i.id) : s.delete(i.id);
                        setPicked(s);
                      }}
                    />
                    <span className="text-sm">{i.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <TextArea label={t('ST-MEL-12')} value={desc} maxLength={3000} onChange={(e) => setDesc(e.target.value)} />
          {withImage && <Banner kind="warn">{t('ST-MEL-13')}</Banner>}
          {targetId && <Toggle checked={alsoBlock} onChange={setAlsoBlock} label={t('ST-MEL-14')} />}
          {err && <Banner kind="error">{err}</Banner>}
          <button className="btn-primary" disabled={!reason || busy} onClick={send}>
            {t('ST-MEL-15')}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** S71: sofort, ohne Rückfrage; Leiste mit „Rückgängig“; die zweite Sperre ist endgültig und fragt nach. */
export function useBlock() {
  const { toast, config } = useApp();
  const [confirm, setConfirm] = useState<null | { id: string; name: string | null; after?: () => void }>(null);

  const doBlock = async (targetId: string, name: string | null, confirmFinal: boolean, after?: () => void) => {
    try {
      const r = await api.post('/api/blocks', { targetId, confirmFinal });
      const until = r.revocableUntil ? new Date(r.revocableUntil) : null;
      const text = [t('ST-BLO-02', { name: name ?? t('UI-DIE-PERSON') }), until ? t('ST-BLO-03', { datum: until.toLocaleDateString('de-DE'), uhrzeit: until.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }) : '', t('ST-BLO-05', { name: name ?? t('UI-DIE-PERSON') })].filter(Boolean).join(' ');
      toast(
        text,
        until
          ? {
              label: t('ST-BLO-04'),
              run: () => {
                api.del(`/api/blocks/${r.id}`).catch((e) => toast(errText(e)));
              },
            }
          : undefined,
        (config?.params.blockBarS ?? 10) * 1000,
      );
      after?.();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'zweite_sperre') setConfirm({ id: targetId, name, after });
      else toast(errText(e));
    }
  };

  const sheet = (
    <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={t('ST-BLO-01')}>
      <p className="mb-4">{t('ST-BLO-06', { name: confirm?.name ?? t('UI-DIE-PERSON') })}</p>
      <div className="flex flex-col gap-2">
        <button
          className="btn-danger"
          onClick={() => {
            const c = confirm!;
            setConfirm(null);
            doBlock(c.id, c.name, true, c.after);
          }}
        >
          {t('ST-BLO-07')}
        </button>
        <button className="btn-ghost" onClick={() => setConfirm(null)}>
          {t('ST-BLO-08')}
        </button>
      </div>
    </Sheet>
  );

  return { block: (id: string, name: string | null, after?: () => void) => doBlock(id, name, false, after), sheet };
}

/**
 * Issue #36: Mitteilungen führen per Knopf dorthin, wo es weitergeht — kein Download als Textdatei mehr.
 * Issue #35: Mitteilungen auf Wunsch per E-Mail oder Telegram; Inhalt nur auf Wunsch, Sicherheitsmitteilungen nie.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { resetEnvCache } from '../src/config/env.js';
import { sentMails } from '../src/providers/mail.js';
import { sentTelegram } from '../src/providers/telegram.js';
import { flushForwards } from '../src/services/notice-forward.js';
import { createNotice } from '../src/services/notify.js';
import { handleUpdate } from '../src/services/telegram.js';
import { member } from './helpers.js';

afterEach(() => {
  delete process.env.TELEGRAM_BOT_NAME;
  resetEnvCache();
});

describe('Mitteilungen (Issues #35, #36)', () => {
  it('Knopf „Dorthin“ statt Textdatei', async () => {
    const m = await member({ name: 'Liest' });
    await createNotice(m.id, 'export_bereit', 'Kopie', 'Deine Kopie liegt bereit.');
    await createNotice(m.id, 'veranstaltung', 'Abgesagt', 'Die Party fällt aus.', 'veranstaltung:00000000-0000-0000-0000-000000000001');
    await createNotice(m.id, 'date', 'Match', 'Ihr habt ein Match.', null, undefined, { url: '/chats?reiter=date' });
    await createNotice(m.id, 'rueckmeldung_antwort', 'Antwort', 'Danke!');
    const list = (await m.c.get('/api/notices')).body.notices;
    const by = (title: string) => list.find((n: { title: string }) => n.title === title);
    expect(by('Kopie').target).toBe('/ich/daten');
    expect(by('Abgesagt').target).toBe('/ereignisse/00000000-0000-0000-0000-000000000001');
    expect(by('Match').target).toBe('/chats?reiter=date');
    expect(by('Antwort').target).toBeNull();
    // der Download ist entfallen
    expect((await m.c.get(`/api/notices/${by('Kopie').id}/file`)).status).toBe(404);
  });

  it('Weiterleitung per E-Mail: aus, ohne Inhalt, mit Inhalt — Sicherheitsmitteilungen nie mit Inhalt', async () => {
    const m = await member({ name: 'Mail' });
    const mails = () => sentMails.filter((x) => x.to === m.email);
    await createNotice(m.id, 'export_bereit', 'Kopie fertig', 'Geheimer Inhalt eins');
    await flushForwards();
    expect(mails().length).toBe(1); // nur die Bestätigungsmail der Registrierung

    expect((await m.c.patch('/api/profile', { settings: { notifyEmail: true } })).status).toBe(200);
    await createNotice(m.id, 'export_bereit', 'Kopie fertig', 'Geheimer Inhalt zwei');
    await flushForwards();
    let last = mails().at(-1)!;
    expect(last.subject).toBe('Neue Mitteilung');
    expect(last.text).not.toContain('Geheimer Inhalt');
    expect(last.text).toContain('/ich/daten');

    await m.c.patch('/api/profile', { settings: { notifyContent: true } });
    await createNotice(m.id, 'export_bereit', 'Kopie fertig', 'Geheimer Inhalt drei [Bereich]');
    await flushForwards();
    last = mails().at(-1)!;
    expect(last.text).toContain('Geheimer Inhalt drei');
    expect(last.text).not.toContain('[Bereich]');
    expect(last.subject).toBe('Neue Mitteilung');

    await createNotice(m.id, 'sperre', 'Gesperrt', 'Begründung der Sperre');
    await flushForwards();
    last = mails().at(-1)!;
    expect(last.text).not.toContain('Begründung');

    const me = (await m.c.get('/api/profile/me')).body;
    expect(me.profile.settings).toMatchObject({ notifyEmail: true, notifyTelegram: false, notifyContent: true });
  });

  it('Weiterleitung per Telegram nur mit verbundenem Chat', async () => {
    const m = await member({ name: 'Telegram' });
    expect((await m.c.patch('/api/profile', { settings: { notifyTelegram: true } })).body.code).toBe('telegram_fehlt');
    process.env.TELEGRAM_BOT_NAME = 'hinweis_bot';
    resetEnvCache();
    const start = new URL((await m.c.post('/api/telegram/link')).body.url).searchParams.get('start')!;
    await handleUpdate({ update_id: 1, message: { chat: { id: 811, type: 'private' }, from: { id: 811 }, text: `/start ${start}` } });
    // das Öffnen des Links schaltet die Weiterleitung ein
    await createNotice(m.id, 'hilfe_antwort', 'Antwort vom Team', 'Hallo!', 'H-2026-000001');
    await flushForwards();
    const msg = [...sentTelegram].reverse().find((x) => x.chatId === '811')!;
    expect(msg.text).toContain('/ich/hilfe?vorgang=H-2026-000001');
    expect(msg.text).not.toContain('Hallo!');
    await m.c.del('/api/telegram/link');
    const before = sentTelegram.filter((x) => x.chatId === '811').length;
    await createNotice(m.id, 'hilfe_antwort', 'Noch eine', 'Hallo!', 'H-2026-000001');
    await flushForwards();
    // nur der Hinweis „getrennt“ vom Trennen selbst
    expect(sentTelegram.filter((x) => x.chatId === '811').length).toBe(before);
  });
});

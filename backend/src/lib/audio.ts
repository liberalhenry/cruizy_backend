/**
 * Sprachaufnahmen (Issue #28, gemeinsam mit Cruizy Date, Issue #19).
 *
 * PRÜFUNG ERFORDERLICH — wie bei Bildern gilt „Information zerstören, nicht verdecken“:
 *  * Jede Aufnahme wird mit ffmpeg neu kodiert: AAC in MP4 (.m4a), mono, 48 kHz, 64 kbit/s —
 *    das spielen Chrome, Firefox und Safari (auch iOS) gleichermaßen ab.
 *  * Alle Metadaten werden verworfen (-map_metadata -1, keine Kapitel, keine Hüllen).
 *  * Länge und Größe sind begrenzt; lässt sich eine Datei nicht sicher dekodieren, wird sie abgewiesen.
 *  * Die Rohdatei liegt nur für die Dauer der Umwandlung in einem temporären Verzeichnis
 *    (tmpfs im Container) und wird danach sofort gelöscht.
 */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bad } from './errors.js';

function run(cmd: string, args: string[], timeoutMs = 60_000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    p.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

export interface PreparedAudio {
  data: Buffer;
  durationMs: number;
  mime: 'audio/mp4';
}

let available: boolean | null = null;
/** Ist ffmpeg vorhanden? (Im Container immer; lokal ggf. nachinstallieren.) */
export async function audioAvailable(): Promise<boolean> {
  if (available !== null) return available;
  try {
    const r = await run('ffmpeg', ['-hide_banner', '-version'], 5000);
    available = r.code === 0;
  } catch {
    available = false;
  }
  return available;
}

async function probeDuration(file: string): Promise<number | null> {
  const r = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], 20_000);
  const v = Number(r.stdout.trim());
  return r.code === 0 && Number.isFinite(v) ? v : null;
}

/** Wandelt eine Aufnahme (WebM/Opus, MP4/AAC, Ogg, WAV …) in AAC/MP4 ohne Metadaten. */
export async function prepareAudio(input: Buffer, opts: { maxSeconds: number; maxMb: number }): Promise<PreparedAudio> {
  if (input.length > opts.maxMb * 1024 * 1024) throw bad('UI-SPRACHE-ZU-GROSS', { mb: opts.maxMb }, 'audio_zu_gross');
  if (input.length < 200) throw bad('UI-SPRACHE-LEER', {}, 'audio_leer');
  if (!(await audioAvailable())) throw bad('UI-SPRACHE-NICHT-MOEGLICH', {}, 'audio_nicht_moeglich');
  const dir = await mkdtemp(join(tmpdir(), 'cruizy-audio-'));
  const src = join(dir, `${randomUUID()}.in`);
  const out = join(dir, `${randomUUID()}.m4a`);
  try {
    await writeFile(src, input, { mode: 0o600 });
    const inDur = await probeDuration(src);
    // Browser schreiben bei WebM oft keine Dauer in den Kopf — dann entscheidet die Ausgabe
    if (inDur !== null && inDur > opts.maxSeconds + 1.5) throw bad('UI-SPRACHE-ZU-LANG', { sekunden: opts.maxSeconds }, 'audio_zu_lang');
    const r = await run('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-nostdin',
      '-i',
      src,
      '-map',
      '0:a:0',
      '-map_metadata',
      '-1',
      '-map_chapters',
      '-1',
      '-vn',
      '-sn',
      '-dn',
      '-ac',
      '1',
      '-ar',
      '48000',
      '-c:a',
      'aac',
      '-b:a',
      '64k',
      '-t',
      String(opts.maxSeconds + 1),
      '-movflags',
      '+faststart',
      '-fflags',
      '+bitexact',
      '-flags:a',
      '+bitexact',
      '-f',
      'mp4',
      '-y',
      out,
    ]);
    if (r.code !== 0) throw bad('UI-SPRACHE-FORMAT', {}, 'audio_format');
    const dur = await probeDuration(out);
    if (dur === null || dur < 0.3) throw bad('UI-SPRACHE-LEER', {}, 'audio_leer');
    if (dur > opts.maxSeconds + 1.5) throw bad('UI-SPRACHE-ZU-LANG', { sekunden: opts.maxSeconds }, 'audio_zu_lang');
    return { data: await readFile(out), durationMs: Math.round(Math.min(dur, opts.maxSeconds) * 1000), mime: 'audio/mp4' };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

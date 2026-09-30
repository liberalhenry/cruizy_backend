/**
 * Sprachaufnahme und Wiedergabe — gemeinsam für Chat (Issue #28) und Cruizy Date (Issue #19).
 *
 * Aufnahme mit MediaRecorder: Chrome/Firefox liefern WebM/Opus, Safari (auch iOS) MP4/AAC —
 * der Server wandelt beides in dasselbe Format um. Gedrückt halten nimmt auf, Loslassen hält an;
 * ein kurzer Tipp startet eine Aufnahme, die man mit „Stopp“ beendet (Desktop). Wischen nach
 * links bricht ab. Vor dem Senden: anhören, löschen oder senden.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Icon } from './ui';
import { t } from '../lib/texts';

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return list.find((m) => MediaRecorder.isTypeSupported?.(m));
}

export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Fehlertext für getUserMedia/MediaRecorder. */
export function micError(e: unknown): string {
  if (!window.isSecureContext) return t('UI-SPRACHE-HTTPS');
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return t('UI-SPRACHE-BROWSER');
  const name = (e as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return t('UI-SPRACHE-MIKRO-ABGELEHNT');
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return t('UI-SPRACHE-MIKRO-FEHLT');
  return t('UI-SPRACHE-BROWSER');
}

type Phase = 'idle' | 'holding' | 'recording' | 'preview';

export interface Recorded {
  blob: Blob;
  durationMs: number;
  mime: string;
}

/**
 * Aufnahmeleiste. `disabledReason` ausgegraut mit Hinweis (z. B. vor der ersten Antwort).
 * `onSend` bekommt die Aufnahme; `compact` zeigt nur den Mikrofon-Knopf, bis aufgenommen wird.
 */
export function VoiceRecorder({
  maxSeconds,
  disabledReason,
  onSend,
  onError,
  onActive,
  sendLabel,
}: {
  maxSeconds: number;
  disabledReason?: string | null;
  onSend: (r: Recorded) => Promise<void> | void;
  onError: (msg: string) => void;
  onActive?: (active: boolean) => void;
  sendLabel?: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [rec, setRec] = useState<Recorded | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragX, setDragX] = useState(0);
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const startedAt = useRef(0);
  const downAt = useRef(0);
  const startX = useRef(0);
  const cancelled = useRef(false);
  const pressed = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => onActive?.(phase !== 'idle'), [phase, onActive]);
  useEffect(
    () => () => {
      clearInterval(timer.current);
      stream.current?.getTracks().forEach((x) => x.stop());
    },
    [],
  );

  const cleanup = () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach((x) => x.stop());
    stream.current = null;
  };

  const start = async (mode: 'holding' | 'recording') => {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('nicht_moeglich');
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
      chunks.current = [];
      cancelled.current = false;
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        const durationMs = Date.now() - startedAt.current;
        cleanup();
        if (cancelled.current || durationMs < 400) {
          setPhase('idle');
          setRec(null);
          return;
        }
        const type = r.mimeType || mime || 'audio/webm';
        setRec({ blob: new Blob(chunks.current, { type }), durationMs: Math.min(durationMs, maxSeconds * 1000), mime: type });
        setPhase('preview');
      };
      mr.current = r;
      r.start(250);
      startedAt.current = Date.now();
      setElapsed(0);
      // schon losgelassen, während der Browser nach dem Mikrofon gefragt hat → wie ein Tipp
      setPhase(mode === 'holding' && !pressed.current ? 'recording' : mode);
      timer.current = window.setInterval(() => {
        const ms = Date.now() - startedAt.current;
        setElapsed(ms);
        if (ms >= maxSeconds * 1000) stop();
      }, 200);
    } catch (e) {
      cleanup();
      setPhase('idle');
      onError(micError(e));
    }
  };

  const stop = () => {
    if (mr.current && mr.current.state !== 'inactive') mr.current.stop();
  };
  const cancel = () => {
    cancelled.current = true;
    stop();
    setDragX(0);
  };

  const onDown = (e: RPointerEvent) => {
    if (disabledReason || phase === 'preview') return;
    if (phase === 'recording') return stop();
    e.preventDefault();
    downAt.current = Date.now();
    startX.current = e.clientX;
    pressed.current = true;
    window.addEventListener('pointerup', () => (pressed.current = false), { once: true });
    start('holding');
  };

  // Während des Haltens folgen Bewegung und Loslassen dem ganzen Fenster —
  // der Knopf wechselt beim Start seine Form, der Finger bleibt, wo er ist.
  useEffect(() => {
    if (phase !== 'holding') return;
    const move = (e: PointerEvent) => {
      const dx = Math.min(0, e.clientX - startX.current);
      setDragX(dx);
      if (dx < -90) cancel();
    };
    const up = () => {
      setDragX(0);
      // kurzer Tipp → weiter aufnehmen, bis „Stopp“ (Desktop); gehalten → jetzt anhalten
      if (Date.now() - downAt.current < 450) setPhase('recording');
      else stop();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const send = async () => {
    if (!rec) return;
    setBusy(true);
    try {
      await onSend(rec);
      setRec(null);
      setPhase('idle');
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'preview' && rec) {
    return (
      <div className="flex items-center gap-2 w-full">
        <button className="btn-ghost px-2" onClick={() => (setRec(null), setPhase('idle'))} aria-label={t('UI-SPRACHE-LOESCHEN')}>
          <Icon name="trash" />
        </button>
        <div className="flex-1 min-w-0">
          <BlobPlayer blob={rec.blob} durationMs={rec.durationMs} />
        </div>
        <button className="btn-primary px-3" disabled={busy} onClick={send} aria-label={sendLabel ?? t('UI-SPRACHE-SENDEN')}>
          <Icon name="send" />
        </button>
      </div>
    );
  }

  if (phase === 'holding' || phase === 'recording') {
    return (
      <div className="flex items-center gap-3 w-full select-none" style={{ transform: `translateX(${dragX / 3}px)` }}>
        <span className="w-3 h-3 rounded-full bg-gefahr animate-pulse" aria-hidden="true" />
        <span className="flex-1 text-sm" aria-live="polite">
          {t('UI-SPRACHE-NIMMT-AUF', { zeit: `${fmtDuration(elapsed)} / ${fmtDuration(maxSeconds * 1000)}` })}
          {phase === 'holding' && <span className="block text-xs muted">{t('UI-SPRACHE-WISCHEN')}</span>}
        </span>
        {phase === 'recording' && (
          <>
            <button className="btn-ghost" onClick={cancel}>
              {t('UI-SPRACHE-ABBRECHEN')}
            </button>
            <button className="btn-primary" onClick={stop}>
              {t('UI-SPRACHE-STOPP')}
            </button>
          </>
        )}
        {phase === 'holding' && (
          <span className="btn-primary px-3" aria-hidden="true">
            <Icon name="mic" />
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      className="btn-ghost px-2 touch-none"
      aria-disabled={!!disabledReason}
      title={disabledReason ?? t('UI-SPRACHE-HALTEN')}
      aria-label={disabledReason ?? t('UI-SPRACHE')}
      onPointerDown={onDown}
      onClick={() => disabledReason && onError(disabledReason)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Icon name="mic" className={`w-5 h-5 ${disabledReason ? 'opacity-40' : ''}`} />
    </button>
  );
}

function BlobPlayer({ blob, durationMs }: { blob: Blob; durationMs: number }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <AudioPlayer src={url} durationMs={durationMs} own />;
}

const SPEEDS = [1, 1.5, 2];

/** Wiedergabe mit Play/Pause, Fortschritt, Dauer und Tempo 1× / 1,5× / 2×. */
export function AudioPlayer({ src, durationMs, own }: { src: string; durationMs: number; own?: boolean }) {
  const el = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(durationMs / 1000);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    const a = el.current;
    if (!a) return;
    const onTime = () => setPos(a.currentTime);
    const onMeta = () => Number.isFinite(a.duration) && a.duration > 0 && setDur(a.duration);
    const onEnd = () => {
      setPlaying(false);
      setPos(0);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('pause', () => setPlaying(false));
    a.addEventListener('play', () => setPlaying(true));
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, [src]);
  useEffect(() => {
    if (el.current) el.current.playbackRate = speed;
  }, [speed]);
  const toggle = () => {
    const a = el.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };
  const pct = dur ? Math.min(100, (pos / dur) * 100) : 0;
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 ${own ? 'bg-akzentdunkel text-white' : 'bg-flaeche2'}`}>
      <audio ref={el} src={src} preload="metadata" />
      <button className="w-9 h-9 rounded-full bg-white/15 grid place-items-center shrink-0" onClick={toggle} aria-label={playing ? 'Pause' : t('UI-SPRACHE-ANHOEREN')}>
        <Icon name={playing ? 'pause' : 'play'} className="w-4 h-4" />
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(dur, 0.1)}
        step={0.1}
        value={pos}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (el.current) el.current.currentTime = v;
          setPos(v);
        }}
        className="flex-1 min-w-[80px] accent-akzent"
        style={{ background: `linear-gradient(to right, currentColor ${pct}%, transparent ${pct}%)` }}
        aria-label={t('UI-SPRACHE')}
      />
      <span className="text-xs tabular-nums shrink-0">{fmtDuration((playing || pos ? pos : dur) * 1000)}</span>
      <button className="text-xs px-1.5 py-0.5 rounded-full bg-white/15 shrink-0" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label={t('UI-SPRACHE-TEMPO', { tempo: `${speed}×` })}>
        {String(speed).replace('.', ',')}×
      </button>
    </div>
  );
}

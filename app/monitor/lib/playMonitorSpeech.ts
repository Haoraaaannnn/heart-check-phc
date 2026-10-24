/** @fileoverview Monitor-only speech playback with one synthesis request and abortable repeats. */

/**
 * Plays cached server speech on a monitor and reliably settles on errors or navigation.
 * @param text - Server-generated public ticket announcement.
 * @param repeats - Number of repetitions on this monitor.
 * @param signal - Monitor lifecycle cancellation signal.
 * @returns Resolves after playback; rejects synthesis or media failures.
 */
export async function playMonitorSpeech(text: string, repeats: number, signal: AbortSignal): Promise<void> {
  const response = await fetch('/api/tts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal,
  });
  if (!response.ok) throw new Error('Monitor speech unavailable.');
  const url = URL.createObjectURL(await response.blob());
  const audio = new Audio(url);
  try {
    for (let index = 0; index < repeats && !signal.aborted; index++) {
      await new Promise<void>((resolve, reject) => {
        /** Releases listeners before resolving or rejecting this playback attempt. */
        const finish = (error?: Error) => {
          signal.removeEventListener('abort', abort);
          audio.onended = null; audio.onerror = null;
          if (error) reject(error); else resolve();
        };
        /** Stops playback immediately when this monitor is closed or rerouted. */
        const abort = () => { audio.pause(); finish(new Error('Monitor stopped.')); };
        audio.onended = () => finish();
        audio.onerror = () => finish(new Error('Monitor audio playback failed.'));
        signal.addEventListener('abort', abort, { once: true });
        audio.currentTime = 0;
        if (signal.aborted) abort();
        else void audio.play().catch(error => finish(error));
      });
    }
  } finally { audio.pause(); audio.src = ''; URL.revokeObjectURL(url); }
}

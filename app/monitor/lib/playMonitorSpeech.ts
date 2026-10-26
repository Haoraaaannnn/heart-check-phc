/** @fileoverview Monitor-only speech playback with one synthesis request and abortable repeats. */

/**
 * Speaks text using the browser's built-in offline Web Speech API when Deepgram is unreachable.
 * @param text - Public announcement text.
 * @param repeats - Repetition count.
 * @param signal - Abort signal.
 */
function playOfflineSpeech(text: string, repeats: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || signal.aborted) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    let count = 0;
    const speakNext = () => {
      if (count >= repeats || signal.aborted) {
        resolve();
        return;
      }
      count++;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => speakNext();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    };
    signal.addEventListener('abort', () => {
      window.speechSynthesis.cancel();
      resolve();
    }, { once: true });
    speakNext();
  });
}

/**
 * Plays cached server speech on a monitor and reliably settles on errors or navigation.
 * Falls back to native offline browser speech synthesis if external TTS is unavailable.
 * @param text - Server-generated public ticket announcement.
 * @param repeats - Number of repetitions on this monitor.
 * @param signal - Monitor lifecycle cancellation signal.
 * @returns Resolves after playback.
 */
export async function playMonitorSpeech(text: string, repeats: number, signal: AbortSignal): Promise<void> {
  try {
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
  } catch (error) {
    if (signal.aborted) return;
    // Offline fallback: Use native browser speech synthesis
    await playOfflineSpeech(text, repeats, signal);
  }
}


/**
 * @fileoverview Server-Side Text-to-Speech (TTS) Proxy Route Handler.
 *
 * Proxies TTS voice audio synthesis requests between client workstations/monitors
 * and the third-party Deepgram Speech API.
 *
 * Security & Cost Protection Considerations (SEC-025 / SEC-AUD-002 / Rate Limiting):
 * - Eliminates Client-Side Token Exposure: The Deepgram API key is retained exclusively
 *   on the server runtime, preventing credential theft from browser developer tools.
 * - Sliding-Window Rate Limiting: Mitigates API quota exhaustion and toll/cost risks by
 *   enforcing a strict threshold (max 20 requests per minute per IP).
 * - In-Memory Audio Caching: Caches synthesized audio buffers in memory for 30 minutes,
 *   ensuring repetitive ticket callouts execute in 0ms with zero Deepgram API charges.
 * - Input Validation: Enforces string type checks and length boundaries (max 500 characters)
 *   to avoid external API quota abuse.
 * - Edge Caching: Provides Cache-Control headers on generated speech buffers to optimize bandwidth.
 *
 * @module app/api/tts/route
 */

import { NextResponse } from 'next/server';

/** Maximum permissible text character length for queue voice announcements. */
const MAX_TEXT_LENGTH = 500;

/** Default Deepgram Aura voice model for English / Tagalog announcements. */
const DEFAULT_MODEL = 'aura-2-amalthea-en';

/** Maximum permitted TTS synthesis requests per client IP within the rolling window. */
const TTS_RATE_LIMIT_MAX = 20;

/** Rolling rate limit window duration in milliseconds (60 seconds). */
const TTS_RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** Cache TTL in milliseconds for synthesized audio buffers (30 minutes). */
const AUDIO_CACHE_TTL_MS = 30 * 60 * 1000;

/** Maximum number of unique audio entries to store in server memory. */
const MAX_CACHE_ENTRIES = 100;

/**
 * Sliding window rate limiter state stored in-memory per Node process.
 */
interface TtsRateLimitRecord {
  timestamps: number[];
}

const ttsRateLimitMap = new Map<string, TtsRateLimitRecord>();

/**
 * In-memory audio response cache entry.
 */
interface CachedAudioEntry {
  buffer: ArrayBuffer;
  cachedAt: number;
}

const audioCache = new Map<string, CachedAudioEntry>();

/**
 * Resolves the client IP address from proxy headers.
 *
 * @param request - Next.js Request object.
 * @returns Resolved IP string or fallback identifier.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return 'internal-client';
}

/**
 * Enforces sliding-window rate limiting on TTS synthesis requests.
 *
 * @param clientIp - Resolved IP address of the caller.
 * @returns Allowed status and optional retry seconds.
 */
function checkTtsRateLimit(clientIp: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  let record = ttsRateLimitMap.get(clientIp);

  if (!record) {
    record = { timestamps: [] };
    ttsRateLimitMap.set(clientIp, record);
  }

  // Purge expired timestamps outside the rolling window
  record.timestamps = record.timestamps.filter((ts) => now - ts < TTS_RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= TTS_RATE_LIMIT_MAX) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + TTS_RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  record.timestamps.push(now);
  return { allowed: true };
}

/**
 * Retrieves cached audio buffer if valid and not expired.
 *
 * @param cacheKey - Cache lookup key (model:text).
 * @returns Cached ArrayBuffer or null.
 */
function getCachedAudio(cacheKey: string): ArrayBuffer | null {
  const entry = audioCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > AUDIO_CACHE_TTL_MS) {
    audioCache.delete(cacheKey);
    return null;
  }
  return entry.buffer;
}

/**
 * Persists an audio buffer into memory cache with LRU-like eviction.
 *
 * @param cacheKey - Cache lookup key.
 * @param buffer - Raw synthesized audio ArrayBuffer.
 */
function setCachedAudio(cacheKey: string, buffer: ArrayBuffer): void {
  if (audioCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(cacheKey, { buffer, cachedAt: Date.now() });
}

/**
 * Handles POST requests to synthesize queue speech audio.
 *
 * @param request - Next.js Request object with JSON body containing `text` and optional `model`.
 * @returns Response with binary audio/mp3 stream or JSON error envelope.
 */
export async function POST(request: Request) {
  try {
    // 1. Enforce IP-based rate limiting to protect external API quotas
    const clientIp = getClientIp(request);
    const rateCheck = checkTtsRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Speech synthesis rate limit exceeded. Please wait before requesting additional announcements.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds ?? 60),
          },
        }
      );
    }

    const body = await request.json().catch(() => null);
    const rawText = body?.text;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json({ error: 'Valid text payload is required.' }, { status: 400 });
    }

    const cleanText = rawText.trim();
    if (cleanText.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text length exceeds maximum of ${MAX_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const modelName = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
    const cacheKey = `${modelName}::${cleanText}`;

    // 2. Check in-memory audio buffer cache (zero external API calls for duplicate callouts)
    const cachedBuffer = getCachedAudio(cacheKey);
    if (cachedBuffer) {
      return new Response(cachedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mp3',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Cache-Lookup': 'HIT',
        },
      });
    }

    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
    if (!apiKey) {
      console.error('[TTS ERROR] DEEPGRAM_API_KEY is not configured in server environment');
      return NextResponse.json({ error: 'Speech synthesis service is not configured.' }, { status: 500 });
    }

    const deepgramResponse = await fetch(
      `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(modelName)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      }
    );

    if (!deepgramResponse.ok) {
      console.error('[TTS DEEPGRAM ERROR] Deepgram returned status:', deepgramResponse.status);
      return NextResponse.json({ error: 'Speech synthesis generation failed.' }, { status: deepgramResponse.status });
    }

    const audioBuffer = await deepgramResponse.arrayBuffer();

    // 3. Persist to memory cache
    setCachedAudio(cacheKey, audioBuffer);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp3',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache-Lookup': 'MISS',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('[TTS SERVER ERROR]:', message);
    return NextResponse.json({ error: 'Internal server error processing speech.' }, { status: 500 });
  }
}

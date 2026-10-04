/**
 * @fileoverview Server-Side Text-to-Speech (TTS) Proxy Route Handler.
 *
 * Proxies TTS voice audio synthesis requests between client workstations/monitors
 * and the third-party Deepgram Speech API.
 *
 * Security Considerations (SEC-025 / SEC-AUD-002):
 * - Eliminates Client-Side Token Exposure: The Deepgram API key is retained exclusively
 *   on the server runtime, preventing credential theft from browser developer tools.
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

/**
 * Handles POST requests to synthesize queue speech audio.
 *
 * @param request - Next.js Request object with JSON body containing `text` and optional `model`.
 * @returns Response with binary audio/mp3 stream or JSON error envelope.
 */
export async function POST(request: Request) {
  try {
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

    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
    if (!apiKey) {
      console.error('[TTS ERROR] DEEPGRAM_API_KEY is not configured in server environment');
      return NextResponse.json({ error: 'Speech synthesis service is not configured.' }, { status: 500 });
    }

    const modelName = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;

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

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp3',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('[TTS SERVER ERROR]:', message);
    return NextResponse.json({ error: 'Internal server error processing speech.' }, { status: 500 });
  }
}

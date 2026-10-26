/** @fileoverview Bounded requests and in-flight-only read deduplication without response caching. */
const REQUEST_TIMEOUT_MS = 30_000;
const pendingReads = new Map<string, Promise<Response>>();

/**
 * Aborts stalled requests while preserving caller cancellation and normal HTTP errors.
 * @param input - Requested resource.
 * @param init - Fetch options; writes are never retried automatically.
 * @returns A response or a retryable transport error after at most thirty seconds.
 */
export async function fetchWithDeadline(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const sourceSignal = init?.signal ?? (input instanceof Request ? input.signal : null);
  const abort = () => controller.abort(sourceSignal?.reason);
  if (sourceSignal?.aborted) abort();
  else sourceSignal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('The connection took too long. Please retry.', 'TimeoutError')), REQUEST_TIMEOUT_MS);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); sourceSignal?.removeEventListener('abort', abort); }
}

/**
 * Shares identical concurrent GETs only; each reader receives its own response body.
 * @param input - Resource requested by the shared browser SDK.
 * @param init - Complete request options, including the caller's authorization headers.
 * @returns An independently readable response, never a cached completed response.
 * @remarks Authorization participates in the in-memory key; different sessions never share reads.
 */
export async function requestFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
  if (method !== 'GET' || init?.signal || request) return fetchWithDeadline(input, init);
  const headers = [...new Headers(init?.headers).entries()].sort(([left], [right]) => left.localeCompare(right));
  const key = JSON.stringify([String(input), headers, init?.credentials, init?.cache]);
  let pending = pendingReads.get(key);
  if (!pending) {
    pending = fetchWithDeadline(input, init).finally(() => { if (pendingReads.get(key) === pending) pendingReads.delete(key); });
    pendingReads.set(key, pending);
  }
  return (await pending).clone();
}

/**
 * Bounds work waiting on SDK initialization as well as HTTP requests.
 * @param operation - Work that must settle or be retried by its caller.
 * @returns The original result or a timeout rejection; no authorization is inferred on timeout.
 */
export async function withRequestDeadline<Result>(operation: Promise<Result>): Promise<Result> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('The connection took too long. Please retry.')), REQUEST_TIMEOUT_MS);
  });
  try { return await Promise.race([operation, deadline]); }
  finally { clearTimeout(timer); }
}

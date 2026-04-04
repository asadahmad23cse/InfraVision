const DEFAULT_BACKEND_BASE = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 15000;

export interface BackendOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, string | number | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
}

interface BackendResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function backendBase() {
  const configured =
    process.env.SUSTAINABILITY_API_URL ||
    process.env.NEXT_PUBLIC_SUSTAINABILITY_API ||
    DEFAULT_BACKEND_BASE;
  return configured.replace(/\/+$/, '');
}

function buildBackendUrl(path: string, query?: Record<string, string | number | null | undefined>) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${backendBase()}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export async function fetchBackendJson<T>(path: string, options: BackendOptions = {}): Promise<BackendResult<T>> {
  const { query, body, timeoutMs = REQUEST_TIMEOUT_MS, headers, ...init } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestHeaders = new Headers(headers);
    let payload: BodyInit | undefined;
    if (body !== undefined) {
      payload = JSON.stringify(body);
      if (!requestHeaders.has('Content-Type')) {
        requestHeaders.set('Content-Type', 'application/json');
      }
    }

    const response = await fetch(buildBackendUrl(path, query), {
      ...init,
      headers: requestHeaders,
      body: payload,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await response.text();
    let parsed: T | undefined;
    if (text) {
      try {
        parsed = JSON.parse(text) as T;
      } catch {
        parsed = undefined;
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: (parsed as { detail?: string } | undefined)?.detail || text || `Backend request failed (${response.status})`,
      };
    }

    return { ok: true, status: response.status, data: parsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown backend error';
    return { ok: false, status: 502, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

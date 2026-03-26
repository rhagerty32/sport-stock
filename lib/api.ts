import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { ensureFreshIdToken } from '@/lib/ensure-auth-token';
import { useAuthStore } from '@/stores/authStore';

export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const token = useAuthStore.getState().getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const user = useAuthStore.getState().user;
    if (user?.id) {
        headers['X-User-Id'] = user.id;
    }
    return headers;
}

const LOG_API = true;

function logApi(method: string, url: string, body?: unknown, status?: number, response?: unknown) {
    if (!LOG_API) return;
    const payload: Record<string, unknown> = { method, url };
    if (body !== undefined) payload.requestBody = body;
    if (status !== undefined) payload.status = status;
    if (response !== undefined) payload.response = response;
    // console.log('[API]', JSON.stringify(payload, null, 2));
}

/** Parse API error response (JSON with error.message or plain text). */
export function parseApiErrorResponse(text: string): string {
    try {
        const json = JSON.parse(text) as { error?: { message?: string; code?: string }; message?: string };
        const msg = json?.error?.message ?? json?.message ?? text;
        return typeof msg === 'string' ? msg : text;
    } catch {
        return text;
    }
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = `${API_BASE_URL}${path}`;
    if (!params) return url;
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            search.set(key, String(value));
        }
    }
    const qs = search.toString();
    return qs ? `${url}?${qs}` : url;
}

async function authHeadersOrPublic(auth?: boolean): Promise<Record<string, string>> {
    if (auth === false) {
        return { 'Content-Type': 'application/json' };
    }
    await ensureFreshIdToken();
    return getAuthHeaders();
}

/** Lambda/API Gateway sometimes returns this transiently; retry with backoff. */
const SERVICE_UNAVAILABLE_MAX_ATTEMPTS = 4;
const SERVICE_UNAVAILABLE_BASE_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function responseIndicatesServiceUnavailable(res: Response): Promise<boolean> {
    if (res.status === 503) {
        return true;
    }
    const clone = res.clone();
    const text = await clone.text();
    if (!text.trim()) {
        return false;
    }
    try {
        const json = JSON.parse(text) as { message?: unknown };
        return json?.message === 'Service Unavailable';
    } catch {
        return false;
    }
}

/** GET/DELETE with optional 401 retry after forced token refresh (expired JWT in store). */
async function fetchWithAuthRetry(
    url: string,
    initBase: { method: string; body?: string },
    auth?: boolean
): Promise<Response> {
    const run = async () => {
        const headers = await authHeadersOrPublic(auth);
        return fetch(url, { ...initBase, headers });
    };

    for (let attempt = 0; attempt < SERVICE_UNAVAILABLE_MAX_ATTEMPTS; attempt++) {
        let res = await run();
        if (auth !== false && res.status === 401) {
            await ensureFreshIdToken({ force: true });
            res = await run();
        }

        const transientUnavailable = await responseIndicatesServiceUnavailable(res);
        if (!transientUnavailable) {
            return res;
        }
        const isLastAttempt = attempt === SERVICE_UNAVAILABLE_MAX_ATTEMPTS - 1;
        if (isLastAttempt) {
            return res;
        }
        await delay(SERVICE_UNAVAILABLE_BASE_DELAY_MS * 2 ** attempt);
    }

    throw new Error('fetchWithAuthRetry: exhausted attempts without returning');
}

export async function apiGet<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    options?: { auth?: boolean }
): Promise<T> {
    const url = buildUrl(path, params);
    const res = await fetchWithAuthRetry(url, { method: 'GET' }, options?.auth);
    const text = await res.text();
    // console.log('apiGet', url);
    if (!res.ok) {
        logApi('GET', url, undefined, res.status, text);
        throw new Error(parseApiErrorResponse(text) || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || text === '') {
        logApi('GET', url, undefined, res.status, undefined);
        return undefined as T;
    }
    const data = JSON.parse(text) as T;
    logApi('GET', url, undefined, res.status, data);
    return data;
}

export async function apiPost<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    // Debug logging for POST requests
    // eslint-disable-next-line no-console
    console.log('apiPost', url, body);
    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
    const res = await fetchWithAuthRetry(url, { method: 'POST', body: bodyStr }, options?.auth);
    const text = await res.text();
    console.log(JSON.stringify(text, null, 2))
    if (!res.ok) {
        logApi('POST', url, body, res.status, text);
        throw new Error(parseApiErrorResponse(text) || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || text === '') {
        logApi('POST', url, body, res.status, undefined);
        return undefined as T;
    }
    const data = JSON.parse(text) as T;
    logApi('POST', url, body, res.status, data);
    return data;
}

export async function apiPatch<T>(path: string, body: unknown, options?: { auth?: boolean }): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetchWithAuthRetry(
        url,
        { method: 'PATCH', body: JSON.stringify(body) },
        options?.auth
    );
    const text = await res.text();
    if (!res.ok) {
        logApi('PATCH', url, body, res.status, text);
        throw new Error(parseApiErrorResponse(text) || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || text === '') {
        logApi('PATCH', url, body, res.status, undefined);
        return undefined as T;
    }
    const data = JSON.parse(text) as T;
    logApi('PATCH', url, body, res.status, data);
    return data;
}

export async function apiPut<T>(path: string, body: unknown, options?: { auth?: boolean }): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetchWithAuthRetry(
        url,
        { method: 'PUT', body: JSON.stringify(body) },
        options?.auth
    );
    const text = await res.text();
    if (!res.ok) {
        logApi('PUT', url, body, res.status, text);
        throw new Error(parseApiErrorResponse(text) || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || text === '') {
        logApi('PUT', url, body, res.status, undefined);
        return undefined as T;
    }
    const data = JSON.parse(text) as T;
    logApi('PUT', url, body, res.status, data);
    return data;
}

export async function apiDelete<T>(path: string, options?: { auth?: boolean }): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetchWithAuthRetry(url, { method: 'DELETE' }, options?.auth);
    const text = await res.text();
    if (!res.ok) {
        logApi('DELETE', url, undefined, res.status, text);
        throw new Error(parseApiErrorResponse(text) || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || text === '') {
        logApi('DELETE', url, undefined, res.status, undefined);
        return undefined as T;
    }
    const data = JSON.parse(text) as T;
    logApi('DELETE', url, undefined, res.status, data);
    return data;
}

export { API_ENDPOINTS };

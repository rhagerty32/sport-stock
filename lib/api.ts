import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
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

export async function apiGet<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    options?: { auth?: boolean }
): Promise<T> {
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = buildUrl(path, params);
    const res = await fetch(url, { method: 'GET', headers });
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
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    // Debug logging for POST requests
    // eslint-disable-next-line no-console
    console.log('apiPost', url, body);
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
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
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
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

export async function apiDelete<T>(path: string, options?: { auth?: boolean }): Promise<T> {
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers,
    });
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

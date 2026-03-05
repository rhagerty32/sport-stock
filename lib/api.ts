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
    console.log('url', url);
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
        const text = await res.text();
        console.log('res', text);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, options?: { auth?: boolean }): Promise<T> {
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string, options?: { auth?: boolean }): Promise<T> {
    const headers = options?.auth === false ? { 'Content-Type': 'application/json' } : getAuthHeaders();
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

export { API_ENDPOINTS };

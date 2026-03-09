import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import type { AuthUser } from '@/stores/authStore';
import { useMutation } from '@tanstack/react-query';

export type ApiMeResponse = {
    user_id: string;
    name: string;
    phone_number: string;
    email: string;
    balance: number;
    created_at: string;
    updated_at: string;
};

export function mapApiMeToAuthUser(me: ApiMeResponse): AuthUser {
    const parts = (me.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || '';
    return {
        id: me.user_id,
        email: me.email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
    };
}

/**
 * Fetch current user from GET /api/users/me. Use after login/signup when you have idToken but have not yet updated the auth store.
 */
export async function fetchCurrentUser(idToken: string): Promise<AuthUser> {
    const label = '[Auth] fetchCurrentUser (GET /api/users/me)';
    console.time(label);
    const token = idToken?.trim();
    if (!token) {
        throw new Error('No auth token available. Please try logging in again.');
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS_ME}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    let response: Response;
    try {
        response = await fetch(url, { method: 'GET', headers });
    } catch (err: any) {
        console.timeEnd(label);
        const msg = err?.message || String(err);
        if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
            throw new Error(
                'Could not reach server. Check that EXPO_PUBLIC_API_BASE_URL is set correctly and the API is reachable from this device.'
            );
        }
        throw err;
    }

    if (!response.ok) {
        console.timeEnd(label);
        const text = await response.text();
        throw new Error(text || `Failed to load user: ${response.status}`);
    }
    const data = (await response.json()) as ApiMeResponse;
    console.timeEnd(label);
    return mapApiMeToAuthUser(data);
}

export type RegisterUserBody = {
    user_id: string;
    name: string;
    phone_number: string;
    email: string;
};

export async function registerUser(idToken: string, body: RegisterUserBody): Promise<unknown> {
    const token = idToken?.trim();
    if (!token) {
        throw new Error('No auth token available. Please try logging in again.');
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.USERS_REGISTER}`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed')) {
            throw new Error(
                'Could not reach server. Check that EXPO_PUBLIC_API_BASE_URL is set correctly and the API is reachable from this device.'
            );
        }
        throw err;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Register failed: ${response.status}`);
    }
    return response.json();
}

export function useRegisterUser() {
    return useMutation({
        mutationFn: ({ idToken, body }: { idToken: string; body: RegisterUserBody }) =>
            registerUser(idToken, body),
    });
}

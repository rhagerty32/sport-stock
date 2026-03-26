import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api-config';
import { apiPatch } from '@/lib/api';
import { isCognitoFederatedUsername, isLikelyUserEmail } from '@/lib/user-display';
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
    const rawName = (me.name || '').trim();
    const nameIsPlaceholder =
        !rawName || rawName === 'User' || isCognitoFederatedUsername(rawName);
    const parts = nameIsPlaceholder ? [] : rawName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || '';
    const emailRaw = (me.email || '').trim();
    let email = isLikelyUserEmail(emailRaw) ? emailRaw : undefined;
    if (email && isPlaceholderRegistrationEmail(email)) email = undefined;
    const phoneRaw = (me.phone_number || '').trim();
    const phoneNumber =
        phoneRaw && phoneRaw.toUpperCase() !== 'N/A' ? phoneRaw : undefined;
    return {
        id: me.user_id,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber,
    };
}

/**
 * API_DOCS.json: PATCH /api/users/me — UserUpdate (snake_case: name, phone_number, email).
 * The deployed API does not expose PUT /api/users/{userId}; using /me avoids 404.
 */
export type UpdateUserProfileInput = {
    firstName: string;
    lastName: string;
    phoneNumber: string;
};

export async function updateUserProfile(input: UpdateUserProfileInput): Promise<void> {
    const name = [input.firstName.trim(), input.lastName.trim()].filter(Boolean).join(' ');
    const phone = input.phoneNumber.trim();
    await apiPatch(API_ENDPOINTS.USERS_ME, {
        name: name.length > 0 ? name : null,
        phone_number: phone.length > 0 ? phone : null,
    });
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

/**
 * POST /api/users/ requires `email` with JSON Schema `format: email`. Apple (and sometimes Google)
 * may not return an address — an empty string fails validation and the user is never created.
 * Use a stable synthetic address (example.com is reserved; not for delivery).
 */
export function oauthRegistrationEmail(cognitoSub: string, jwtEmail?: string): string {
    const t = jwtEmail?.trim();
    if (t && t.includes('@')) return t;
    const tag = cognitoSub.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80) || 'user';
    return `sportstock-oauth+${tag}@example.com`;
}

/** Backend stores a placeholder so POST /api/users/ validates; hide it in the client profile UI. */
export function isPlaceholderRegistrationEmail(email: string | undefined): boolean {
    const t = email?.trim().toLowerCase() ?? '';
    return t.endsWith('@example.com') && t.startsWith('sportstock-oauth+');
}

export function buildHostedUIRegisterBody(session: {
    sub: string;
    email?: string;
    name?: string;
}): RegisterUserBody {
    const email = oauthRegistrationEmail(session.sub, session.email);
    const name =
        session.name?.trim() ||
        (session.email?.includes('@') ? session.email.trim().split('@')[0] ?? '' : '').trim() ||
        'User';
    return {
        user_id: session.sub,
        name: name.length >= 1 ? name : 'User',
        phone_number: 'N/A',
        email,
    };
}

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

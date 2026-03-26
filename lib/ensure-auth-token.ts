import { getCurrentSession } from '@/lib/cognito';
import {
    decodeJwtPayload,
    getHostedUIRefreshToken,
    refreshHostedUIToken,
    saveHostedUIRefreshToken,
} from '@/lib/cognito-hosted-ui';
import { useAuthStore } from '@/stores/authStore';

const LOG_PREFIX = '[Auth] ensureFreshIdToken';
/** Refresh this long before JWT exp so requests near the boundary still succeed. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

let refreshInFlight: Promise<void> | null = null;

function tokenNeedsRefresh(idToken: string, force: boolean): boolean {
    if (force) return true;
    try {
        const payload = decodeJwtPayload(idToken);
        const exp = payload.exp;
        if (typeof exp !== 'number') return true;
        return Date.now() >= exp * 1000 - REFRESH_SKEW_MS;
    } catch {
        return true;
    }
}

async function performRefresh(): Promise<void> {
    const { updateIdToken } = useAuthStore.getState();

    const session = await getCurrentSession();
    if (session?.idToken) {
        updateIdToken(session.idToken);
        return;
    }

    const refreshToken = await getHostedUIRefreshToken();
    if (!refreshToken) {
        console.warn(LOG_PREFIX, 'no Cognito session and no Hosted UI refresh token');
        return;
    }

    try {
        const tokens = await refreshHostedUIToken(refreshToken);
        if (tokens.refresh_token) {
            await saveHostedUIRefreshToken(tokens.refresh_token);
        }
        updateIdToken(tokens.id_token);
    } catch (e) {
        console.warn(LOG_PREFIX, 'Hosted UI refresh failed', e);
    }
}

/**
 * If the persisted id token is missing or near expiry, refresh via Cognito SDK or Hosted UI
 * refresh_token, then update the auth store. Safe to call before every authenticated API request.
 */
export async function ensureFreshIdToken(options?: { force?: boolean }): Promise<void> {
    const { isAuthenticated, idToken } = useAuthStore.getState();
    if (!isAuthenticated || !idToken) return;
    if (!options?.force && !tokenNeedsRefresh(idToken, false)) return;

    if (!refreshInFlight) {
        refreshInFlight = performRefresh().finally(() => {
            refreshInFlight = null;
        });
    }
    await refreshInFlight;
}

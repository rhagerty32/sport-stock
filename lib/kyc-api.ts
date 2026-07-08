import { API_ENDPOINTS } from '@/constants/api-config';
import { fetchCurrentUser } from '@/lib/auth-api';
import { apiPost } from '@/lib/api';
import type { KycStatusLiteral } from '@/lib/kyc-utils';

export type KycSessionCreateResponse = {
    session_id: string;
    session_token: string;
    url: string;
    status: KycStatusLiteral | string;
};

export type KycSessionCreateInput = {
    language?: string;
};

export async function createKycSession(
    input?: KycSessionCreateInput
): Promise<KycSessionCreateResponse> {
    return apiPost<KycSessionCreateResponse>(API_ENDPOINTS.KYC_SESSION, input ?? {});
}

/** Hydrate KYC fields from GET /api/users/me until a dedicated status route exists. */
export async function fetchKycStatusFromMe(idToken: string) {
    const user = await fetchCurrentUser(idToken);
    return {
        kyc_status: user.kycStatus ?? null,
        kyc_verified_at: user.kycVerifiedAt ?? null,
        didit_session_id: user.diditSessionId ?? null,
    };
}

export const kycKeys = {
    all: ['kyc'] as const,
    session: () => [...kycKeys.all, 'session'] as const,
};

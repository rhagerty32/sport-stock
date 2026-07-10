import { fetchCurrentUser } from '@/lib/auth-api';
import { isKycApproved, needsKycPrompt } from '@/lib/kyc-utils';
import { useAuthStore } from '@/stores/authStore';
import { useStockStore } from '@/stores/stockStore';
import { useCallback } from 'react';

export function useKycGate() {
    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setUser = useAuthStore((s) => s.setUser);
    const getToken = useAuthStore((s) => s.getToken);
    const setKycBottomSheetOpen = useStockStore((s) => s.setKycBottomSheetOpen);

    const kycStatus = user?.kycStatus;
    const isApproved = isKycApproved(kycStatus);
    const needsKyc = isAuthenticated && needsKycPrompt(kycStatus);

    const refreshKycStatus = useCallback(async () => {
        const token = getToken();
        if (!token) return null;
        const me = await fetchCurrentUser(token);
        setUser(me);
        return me;
    }, [getToken, setUser]);

    /**
     * Opens the KYC sheet when verification is unfinished.
     * Call before buy/sell (and similar gated actions). Returns true if the
     * sheet was opened so the caller should abort the original action.
     */
    const openKycIfNeeded = useCallback(
        (force = false) => {
            if (!isAuthenticated) return false;
            if (force || needsKycPrompt(user?.kycStatus)) {
                setKycBottomSheetOpen(true);
                return true;
            }
            return false;
        },
        [isAuthenticated, setKycBottomSheetOpen, user?.kycStatus]
    );

    const openKyc = useCallback(() => {
        setKycBottomSheetOpen(true);
    }, [setKycBottomSheetOpen]);

    const closeKyc = useCallback(() => {
        setKycBottomSheetOpen(false);
    }, [setKycBottomSheetOpen]);

    return {
        kycStatus,
        isApproved,
        needsKyc,
        refreshKycStatus,
        openKycIfNeeded,
        openKyc,
        closeKyc,
    };
}

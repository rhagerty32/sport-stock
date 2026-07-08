/** Didit session status strings — compare case-sensitively. */
export const KYC_STATUS = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    AWAITING_USER: 'Awaiting User',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    DECLINED: 'Declined',
    RESUBMITTED: 'Resubmitted',
    ABANDONED: 'Abandoned',
    EXPIRED: 'Expired',
    KYC_EXPIRED: 'Kyc Expired',
} as const;

export type KycStatusLiteral = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

export function isKycApproved(status?: string | null): boolean {
    return status === KYC_STATUS.APPROVED;
}

export function needsKycPrompt(status?: string | null): boolean {
    if (!status) return true;
    return !isKycApproved(status);
}

export function isKycPendingReview(status?: string | null): boolean {
    return status === KYC_STATUS.IN_REVIEW || status === KYC_STATUS.AWAITING_USER;
}

export function isKycInProgress(status?: string | null): boolean {
    return (
        status === KYC_STATUS.IN_PROGRESS ||
        status === KYC_STATUS.NOT_STARTED ||
        status === KYC_STATUS.RESUBMITTED
    );
}

export function canRetryKyc(status?: string | null): boolean {
    if (!status) return true;
    return (
        status === KYC_STATUS.DECLINED ||
        status === KYC_STATUS.EXPIRED ||
        status === KYC_STATUS.ABANDONED ||
        status === KYC_STATUS.KYC_EXPIRED ||
        status === KYC_STATUS.RESUBMITTED
    );
}

export function kycStatusLabel(status?: string | null): string {
    switch (status) {
        case KYC_STATUS.APPROVED:
            return 'Verified';
        case KYC_STATUS.IN_REVIEW:
            return 'Under review';
        case KYC_STATUS.AWAITING_USER:
            return 'Awaiting your action';
        case KYC_STATUS.IN_PROGRESS:
            return 'In progress';
        case KYC_STATUS.DECLINED:
            return 'Verification declined';
        case KYC_STATUS.RESUBMITTED:
            return 'Resubmission required';
        case KYC_STATUS.EXPIRED:
        case KYC_STATUS.KYC_EXPIRED:
            return 'Verification expired';
        case KYC_STATUS.ABANDONED:
            return 'Verification incomplete';
        case KYC_STATUS.NOT_STARTED:
        default:
            return 'Identity verification required';
    }
}

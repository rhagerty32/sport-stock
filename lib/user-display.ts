import type { AuthUser } from '@/stores/authStore';

/** Normal user@domain; excludes Cognito federated usernames mistaken for email. */
export function isLikelyUserEmail(value: string | undefined | null): value is string {
    if (!value?.trim()) return false;
    const v = value.trim();
    return v.includes('@') && !v.includes(' ');
}

/** Cognito username for Google / Apple / etc. — not for display as email or name. */
export function isCognitoFederatedUsername(value: string | undefined | null): boolean {
    if (!value?.trim()) return false;
    const v = value.trim().toLowerCase();
    return (
        v.startsWith('signinwithapple_') ||
        v.startsWith('google_') ||
        v.startsWith('facebook_') ||
        v.startsWith('apple_')
    );
}

function federatedSubtitle(emailOrUsername: string | undefined): string | null {
    if (!emailOrUsername?.trim()) return 'Signed in with Apple or Google';
    const v = emailOrUsername.trim().toLowerCase();
    if (v.startsWith('signinwithapple_') || v.startsWith('apple_')) return 'Signed in with Apple';
    if (v.startsWith('google_')) return 'Signed in with Google';
    if (v.startsWith('facebook_')) return 'Signed in with Facebook';
    return 'Signed in with your account';
}

export type ProfileHeaderDisplay = {
    /** Main headline (never a Cognito internal id). */
    title: string;
    /** Second line: real email, provider hint, or null to omit. */
    subtitle: string | null;
    /** Up to two characters for the avatar circle. */
    avatarInitials: string;
};

/**
 * Profile tab header: avoid showing federated Cognito usernames as "email" or as the display name.
 */
export function getProfileHeaderDisplay(user: AuthUser | null | undefined): ProfileHeaderDisplay {
    const first = user?.firstName?.trim();
    const last = user?.lastName?.trim();
    const hasRealName = Boolean(first && last);
    const email = user?.email;

    if (hasRealName) {
        const title = `${first} ${last}`;
        const subtitle = isLikelyUserEmail(email) ? email! : null;
        return {
            title,
            subtitle,
            avatarInitials: `${first![0]!}${last![0]!}`.toUpperCase(),
        };
    }

    if (isLikelyUserEmail(email)) {
        const local = (email!.split('@')[0] ?? '').replace(/[^a-zA-Z0-9]/g, '');
        const avatarInitials =
            local.length >= 2
                ? `${local[0]!}${local[1]!}`.toUpperCase()
                : local.length === 1
                  ? local[0]!.toUpperCase()
                  : '?';
        return {
            title: 'Welcome',
            subtitle: email!,
            avatarInitials,
        };
    }

    if (email && isCognitoFederatedUsername(email)) {
        return {
            title: 'Welcome',
            subtitle: federatedSubtitle(email),
            avatarInitials: '?',
        };
    }

    return {
        title: 'Welcome',
        subtitle: 'Add your name in Profile settings',
        avatarInitials: '?',
    };
}

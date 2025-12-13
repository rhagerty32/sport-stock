/**
 * List of states where the app is not permitted to operate
 */
export const BLOCKED_STATES = [
    'Arizona',
    'Connecticut',
    'Delaware',
    'Idaho',
    'Kentucky',
    'Louisiana',
    'Maryland',
    'Michigan',
    'Montana',
    'Nevada',
    'New Jersey',
    'New York',
    'Pennsylvania',
    'Rhode Island',
    'Vermont',
    'Washington',
    'West Virginia',
] as const;

/**
 * Check if a state is blocked
 * @param state - The state name to check (case-insensitive)
 * @returns true if the state is blocked, false otherwise
 */
export function isStateBlocked(state: string | null | undefined): boolean {
    if (!state) return false;

    // Normalize the state name (trim and case-insensitive comparison)
    const normalizedState = state.trim();

    return BLOCKED_STATES.some(
        blockedState => blockedState.toLowerCase() === normalizedState.toLowerCase()
    );
}

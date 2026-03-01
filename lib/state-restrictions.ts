/**
 * State-by-state availability and legal minimum age for SportStock.
 * Single source of truth for location-based blocking.
 */

export const LEGAL_MIN_AGE = 21;

export type StateAvailability = {
    available: boolean;
    minAge: number | null;
};

/** Full state name -> availability and minimum age (null minAge = not available) */
const STATE_AVAILABILITY: Record<string, StateAvailability> = {
    Alabama: { available: true, minAge: 21 },
    Alaska: { available: true, minAge: 21 },
    Arizona: { available: false, minAge: null },
    Arkansas: { available: true, minAge: 21 },
    California: { available: true, minAge: 21 },
    Colorado: { available: true, minAge: 21 },
    Connecticut: { available: false, minAge: null },
    Delaware: { available: false, minAge: null },
    Florida: { available: true, minAge: 21 },
    Georgia: { available: true, minAge: 21 },
    Hawaii: { available: true, minAge: 21 },
    Idaho: { available: false, minAge: null },
    Illinois: { available: true, minAge: 21 },
    Indiana: { available: true, minAge: 21 },
    Iowa: { available: true, minAge: 21 },
    Kansas: { available: true, minAge: 21 },
    Kentucky: { available: false, minAge: null },
    Louisiana: { available: false, minAge: null },
    Maine: { available: true, minAge: 21 },
    Maryland: { available: false, minAge: null },
    Massachusetts: { available: true, minAge: 21 },
    Michigan: { available: false, minAge: null },
    Minnesota: { available: true, minAge: 21 },
    Mississippi: { available: true, minAge: 21 },
    Missouri: { available: true, minAge: 21 },
    Montana: { available: false, minAge: null },
    Nebraska: { available: true, minAge: 21 },
    Nevada: { available: false, minAge: null },
    'New Hampshire': { available: true, minAge: 21 },
    'New Jersey': { available: false, minAge: null },
    'New Mexico': { available: true, minAge: 21 },
    'New York': { available: false, minAge: null },
    'North Carolina': { available: true, minAge: 21 },
    'North Dakota': { available: true, minAge: 21 },
    Ohio: { available: true, minAge: 21 },
    Oklahoma: { available: true, minAge: 21 },
    Oregon: { available: true, minAge: 21 },
    Pennsylvania: { available: false, minAge: null },
    'Rhode Island': { available: false, minAge: null },
    'South Carolina': { available: true, minAge: 21 },
    'South Dakota': { available: true, minAge: 21 },
    Tennessee: { available: true, minAge: 21 },
    Texas: { available: true, minAge: 21 },
    Utah: { available: true, minAge: 21 },
    Vermont: { available: false, minAge: null },
    Virginia: { available: true, minAge: 21 },
    Washington: { available: false, minAge: null },
    'West Virginia': { available: false, minAge: null },
    Wisconsin: { available: true, minAge: 21 },
    Wyoming: { available: true, minAge: 21 },
};

/** US state abbreviation -> full name (for normalizing API responses that return "CA", "NY", etc.) */
const STATE_ABBREV_TO_FULL: Record<string, string> = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
};

/** States where the app is not permitted to operate (derived from STATE_AVAILABILITY) */
export const BLOCKED_STATES = (Object.entries(STATE_AVAILABILITY)
    .filter(([, v]) => !v.available)
    .map(([name]) => name)) as readonly string[];

/** States where the app is available (for UI, e.g. blocked screen map copy) */
export const AVAILABLE_STATES = (Object.entries(STATE_AVAILABILITY)
    .filter(([, v]) => v.available)
    .map(([name]) => name)) as readonly string[];

/**
 * Normalize state input to full name (handles full name or 2-letter abbreviation, case-insensitive).
 */
function normalizeStateName(state: string): string | null {
    if (!state || typeof state !== 'string') return null;
    const trimmed = state.trim();
    if (!trimmed) return null;

    const upper = trimmed.toUpperCase();
    if (trimmed.length === 2 && STATE_ABBREV_TO_FULL[upper]) {
        return STATE_ABBREV_TO_FULL[upper];
    }

    const fullName = Object.keys(STATE_AVAILABILITY).find(
        name => name.toLowerCase() === trimmed.toLowerCase()
    );
    return fullName ?? null;
}

/**
 * Check if a state is blocked (not permitted to operate).
 * @param state - State name or 2-letter abbreviation (case-insensitive)
 */
export function isStateBlocked(state: string | null | undefined): boolean {
    const fullName = normalizeStateName(state ?? '');
    if (!fullName) return false;
    const info = STATE_AVAILABILITY[fullName];
    return info ? !info.available : false;
}

/**
 * Get availability and minimum age for a state.
 * @param state - State name or 2-letter abbreviation (case-insensitive)
 */
export function getStateAvailability(state: string | null | undefined): StateAvailability | null {
    const fullName = normalizeStateName(state ?? '');
    if (!fullName) return null;
    return STATE_AVAILABILITY[fullName] ?? null;
}

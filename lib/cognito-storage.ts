/**
 * Sync storage adapter for amazon-cognito-identity-js that persists to AsyncStorage.
 * Uses an in-memory cache; call hydrate() at app startup before any Cognito calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const COGNITO_STORAGE_KEY = '@sportstock_cognito_storage';

let cache: Record<string, string> = {};

function persist() {
    AsyncStorage.setItem(COGNITO_STORAGE_KEY, JSON.stringify(cache)).catch(() => {});
}

export const cognitoStorage = {
    setItem(key: string, value: string) {
        cache[key] = value;
        persist();
    },
    getItem(key: string): string | null {
        return cache[key] ?? null;
    },
    removeItem(key: string) {
        delete cache[key];
        persist();
    },
    clear() {
        cache = {};
        persist();
    },
};

export async function hydrateCognitoStorage(): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(COGNITO_STORAGE_KEY);
        if (raw) {
            cache = JSON.parse(raw);
        } else {
            cache = {};
        }
    } catch {
        cache = {};
    }
}

/**
 * Cognito Hosted UI OAuth2 (PKCE) for Sign in with Apple and Google.
 * Requires Cognito User Pool domain and Apple/Google configured as identity providers.
 * Set EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN (e.g. https://your-domain.auth.us-east-1.amazonaws.com).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import type { SessionResult } from './cognito';

const HOSTED_UI_REFRESH_TOKEN_KEY = '@sportstock_hosted_ui_refresh_token';

export type HostedUISessionResult = SessionResult & { name?: string; refreshToken?: string };

/** Persist refresh token for use when the app restarts after id_token has expired. */
export async function saveHostedUIRefreshToken(refreshToken: string): Promise<void> {
    await AsyncStorage.setItem(HOSTED_UI_REFRESH_TOKEN_KEY, refreshToken);
}

export async function getHostedUIRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(HOSTED_UI_REFRESH_TOKEN_KEY);
}

/** Clear Hosted UI refresh token (call on sign out). */
export async function clearHostedUISession(): Promise<void> {
    await AsyncStorage.removeItem(HOSTED_UI_REFRESH_TOKEN_KEY);
}

const ClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';
const OAuthDomain = process.env.EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN || '';

export type CognitoHostedUIProvider = 'Google' | 'SignInWithApple';

function getRedirectUri(): string {
    return AuthSession.makeRedirectUri({
        scheme: 'sportstock',
        path: 'callback',
    });
}

/**
 * Generate a cryptographically random code_verifier (43–128 chars) and S256 code_challenge.
 */
async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
    const bytes = Crypto.getRandomBytes(32);
    const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
    const codeVerifier = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const codeChallengeBase64 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    const codeChallenge = codeChallengeBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return { codeVerifier, codeChallenge };
}

/** Safe base64 decoder that tolerates missing atob in some environments. */
function base64Decode(input: string): string {
    if (typeof atob === 'function') {
        return atob(input);
    }
    // Minimal polyfill using global Buffer if available (e.g. in Node/testing)
    // React Native / Expo generally provide atob; this is a fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGlobal = globalThis as any;
    if (anyGlobal?.Buffer?.from) {
        return anyGlobal.Buffer.from(input, 'base64').toString('binary');
    }
    throw new Error('Base64 decode is not available in this environment.');
}

/** Decode JWT payload (middle segment) without verification (Cognito already validated). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT');
        const payload = parts[1];
        const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = base64Decode(padded);
        return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
        return {};
    }
}

/**
 * Build the Cognito Hosted UI authorize URL for the given identity provider.
 */
function buildAuthorizeUrl(
    provider: CognitoHostedUIProvider,
    redirectUri: string,
    codeChallenge: string
): string {
    const params = new URLSearchParams({
        client_id: ClientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        identity_provider: provider,
    });
    const base = OAuthDomain.replace(/\/$/, '');
    return `${base}/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange the authorization code for Cognito id_token, access_token, refresh_token.
 */
async function exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    codeVerifier: string
): Promise<{ id_token: string; access_token: string; refresh_token?: string }> {
    const tokenUrl = `${OAuthDomain.replace(/\/$/, '')}/oauth2/token`;
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ClientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
    });
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Token exchange failed: ${res.status}`);
    }
    const data = (await res.json()) as {
        id_token?: string;
        access_token?: string;
        refresh_token?: string;
        error?: string;
    };
    if (data.error) throw new Error(data.error);
    if (!data.id_token) throw new Error('No id_token in response');
    return {
        id_token: data.id_token,
        access_token: data.access_token || '',
        refresh_token: data.refresh_token,
    };
}

/**
 * Use the refresh_token to obtain new id_token and access_token.
 * Call this when the app loads and the id_token is expired but we have a stored refresh_token.
 */
export async function refreshHostedUIToken(
    refreshToken: string
): Promise<{ id_token: string; refresh_token?: string }> {
    const tokenUrl = `${OAuthDomain.replace(/\/$/, '')}/oauth2/token`;
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ClientId,
        refresh_token: refreshToken,
    });
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Token refresh failed: ${res.status}`);
    }
    const data = (await res.json()) as {
        id_token?: string;
        refresh_token?: string;
        error?: string;
    };
    if (data.error) throw new Error(data.error);
    if (!data.id_token) throw new Error('No id_token in refresh response');
    return {
        id_token: data.id_token,
        refresh_token: data.refresh_token,
    };
}

/**
 * Run the Hosted UI flow for Apple or Google. Opens the browser; on redirect back,
 * exchanges the code for tokens and returns a SessionResult compatible with the rest of the app.
 */
export async function signInWithCognitoHostedUI(
    provider: CognitoHostedUIProvider
): Promise<HostedUISessionResult> {
    if (!ClientId || !OAuthDomain) {
        throw new Error(
            'Missing EXPO_PUBLIC_COGNITO_CLIENT_ID or EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN. Configure Cognito Hosted UI and add the OAuth domain.'
        );
    }

    const redirectUri = getRedirectUri();
    const { codeVerifier, codeChallenge } = await generatePKCE();
    const authUrl = buildAuthorizeUrl(provider, redirectUri, codeChallenge);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        preferEphemeralSession: true,
    });

    if (result.type !== 'success' || !result.url) {
        if (result.type === 'cancel' || result.type === 'dismiss') {
            throw new Error('Sign-in was cancelled');
        }
        throw new Error('Sign-in failed');
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    if (error) {
        const desc = url.searchParams.get('error_description') || error;
        throw new Error(desc);
    }
    if (!code) throw new Error('No authorization code in redirect');

    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);
    const payload = decodeJwtPayload(tokens.id_token);
    const sub = (payload.sub as string) || '';
    const email = (payload.email as string) || (payload['cognito:username'] as string) || undefined;
    const givenName = payload.given_name as string | undefined;
    const familyName = payload.family_name as string | undefined;
    const nameClaim = payload.name as string | undefined;
    const name = nameClaim || [givenName, familyName].filter(Boolean).join(' ') || undefined;

    return {
        idToken: tokens.id_token,
        sub,
        email,
        name,
        refreshToken: tokens.refresh_token,
    };
}

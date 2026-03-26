/**
 * Cognito Hosted UI OAuth2 (PKCE) for Sign in with Apple and Google.
 * Requires Cognito User Pool domain and Apple/Google configured as identity providers.
 * Set EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN to your Hosted UI domain, e.g.
 * https://your-prefix.auth.us-east-2.amazoncognito.com (amazoncognito.com, not amazonaws.com).
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

const LOG_PREFIX = '[Cognito:HostedUI]';

const ClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';
const OAuthDomain = process.env.EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN || '';

/**
 * OAuth scopes sent to /oauth2/authorize. Must be a subset of "Allowed OAuth scopes"
 * on the Cognito app client or Cognito returns invalid_scope.
 * Default is `openid` only; add email/profile via env when those scopes are enabled in AWS.
 */
function getOAuthScope(): string {
    const raw = process.env.EXPO_PUBLIC_COGNITO_OAUTH_SCOPES?.trim();
    if (raw) return raw.replace(/\s+/g, ' ');
    return 'openid';
}

function oauthHostForLog(domain: string): string {
    try {
        const normalized = domain.startsWith('http') ? domain : `https://${domain}`;
        return new URL(normalized).hostname;
    } catch {
        return '(invalid EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN)';
    }
}

export type CognitoHostedUIProvider = 'Google' | 'SignInWithApple';

/** Must match Cognito app client "Callback URL(s)" exactly (character-for-character). */
const NATIVE_OAUTH_REDIRECT_URI = 'sportstock://callback';

function getRedirectUri(): string {
    // Bare / standalone: force stable URI. Linking.createURL can embed Metro host (IP:port) or
    // differ in slash count, which breaks Cognito matching and prevents the auth session from closing.
    return AuthSession.makeRedirectUri({
        scheme: 'sportstock',
        path: 'callback',
        native: NATIVE_OAUTH_REDIRECT_URI,
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
    const scope = getOAuthScope();
    const params = new URLSearchParams({
        client_id: ClientId,
        response_type: 'code',
        scope,
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
    console.log(LOG_PREFIX, 'token exchange POST', tokenUrl);
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const responseText = await res.text();
    if (!res.ok) {
        console.warn(LOG_PREFIX, 'token exchange failed', { status: res.status, body: responseText });
        throw new Error(responseText || `Token exchange failed: ${res.status}`);
    }
    let data: {
        id_token?: string;
        access_token?: string;
        refresh_token?: string;
        error?: string;
        error_description?: string;
    };
    try {
        data = JSON.parse(responseText) as typeof data;
    } catch {
        console.warn(LOG_PREFIX, 'token exchange: non-JSON body', responseText.slice(0, 200));
        throw new Error(responseText || 'Invalid token response');
    }
    if (data.error) {
        const msg = data.error_description || data.error;
        console.warn(LOG_PREFIX, 'token response error', data);
        throw new Error(msg);
    }
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
    console.log(LOG_PREFIX, 'refresh token POST', tokenUrl);
    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const refreshText = await res.text();
    if (!res.ok) {
        console.warn(LOG_PREFIX, 'token refresh failed', { status: res.status, body: refreshText });
        throw new Error(refreshText || `Token refresh failed: ${res.status}`);
    }
    let data: {
        id_token?: string;
        refresh_token?: string;
        error?: string;
        error_description?: string;
    };
    try {
        data = JSON.parse(refreshText) as typeof data;
    } catch {
        console.warn(LOG_PREFIX, 'refresh: non-JSON body', refreshText.slice(0, 200));
        throw new Error(refreshText || 'Invalid refresh response');
    }
    if (data.error) {
        const msg = data.error_description || data.error;
        console.warn(LOG_PREFIX, 'refresh response error', data);
        throw new Error(msg);
    }
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
    const scope = getOAuthScope();
    console.log(LOG_PREFIX, 'starting sign-in', {
        provider,
        redirectUri,
        scope,
        oauthHost: oauthHostForLog(OAuthDomain),
        clientIdPrefix: `${ClientId.slice(0, 6)}…`,
    });

    const { codeVerifier, codeChallenge } = await generatePKCE();
    const authUrl = buildAuthorizeUrl(provider, redirectUri, codeChallenge);
    console.log(LOG_PREFIX, 'opening authorize URL', authUrl);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, {
        preferEphemeralSession: true,
    });

    console.log(LOG_PREFIX, 'auth session result', { type: result.type, hasUrl: 'url' in result && !!result.url });

    if (result.type !== 'success' || !result.url) {
        if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log(LOG_PREFIX, 'user cancelled or dismissed');
            throw new Error('Sign-in was cancelled');
        }
        console.warn(LOG_PREFIX, 'unexpected session result', result);
        throw new Error('Sign-in failed');
    }

    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    let errorDescription = url.searchParams.get('error_description');
    if (errorDescription) {
        try {
            errorDescription = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        } catch {
            /* keep raw */
        }
    }
    if (error) {
        console.warn(LOG_PREFIX, 'redirect error params', {
            error,
            error_description: errorDescription,
            fullRedirect: result.url.split('?')[0],
        });
        const desc = errorDescription || error;
        if (error === 'invalid_scope') {
            console.warn(
                LOG_PREFIX,
                'invalid_scope: enable the same scopes on your Cognito app client (App integration → App client → Hosted UI), or set EXPO_PUBLIC_COGNITO_OAUTH_SCOPES to a subset (e.g. openid).'
            );
        }
        throw new Error(desc);
    }
    if (!code) {
        console.warn(LOG_PREFIX, 'redirect missing code', result.url.slice(0, 120));
        throw new Error('No authorization code in redirect');
    }

    console.log(LOG_PREFIX, 'exchanging code for tokens');
    const tokens = await exchangeCodeForTokens(code, redirectUri, codeVerifier);
    const payload = decodeJwtPayload(tokens.id_token);
    const sub = (payload.sub as string) || '';
    const jwtEmail = typeof payload.email === 'string' ? payload.email.trim() : '';
    // Do not use cognito:username as email — for Apple/Google it is an opaque id (e.g. signinwithapple_…).
    const email = jwtEmail.includes('@') ? jwtEmail : undefined;
    const givenName = payload.given_name as string | undefined;
    const familyName = payload.family_name as string | undefined;
    const nameClaim = payload.name as string | undefined;
    const name = nameClaim || [givenName, familyName].filter(Boolean).join(' ') || undefined;

    console.log(LOG_PREFIX, 'sign-in success', {
        sub: sub ? `${sub.slice(0, 8)}…` : '(empty)',
        hasEmail: !!email,
        hasOpaqueUsername: !!(payload['cognito:username'] && !email),
        hasName: !!name,
        hasRefreshToken: !!tokens.refresh_token,
    });

    return {
        idToken: tokens.id_token,
        sub,
        email,
        name,
        refreshToken: tokens.refresh_token,
    };
}

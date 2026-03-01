import {
    AuthenticationDetails,
    CognitoUser,
    CognitoUserAttribute,
    CognitoUserPool,
    CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { cognitoStorage } from './cognito-storage';

const UserPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '';
const ClientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';

let pool: CognitoUserPool | null = null;

export function getCognitoUserPool(): CognitoUserPool {
    if (!pool) {
        if (!UserPoolId || !ClientId) {
            throw new Error('Missing EXPO_PUBLIC_COGNITO_USER_POOL_ID or EXPO_PUBLIC_COGNITO_CLIENT_ID');
        }
        pool = new CognitoUserPool({
            UserPoolId,
            ClientId,
            Storage: cognitoStorage,
        });
    }
    return pool;
}

export function getCurrentCognitoUser(): CognitoUser | null {
    return getCognitoUserPool().getCurrentUser();
}

export type SessionResult = {
    idToken: string;
    sub: string;
    email?: string;
};

export function getCurrentSession(): Promise<SessionResult | null> {
    return new Promise((resolve) => {
        if (!UserPoolId || !ClientId) {
            resolve(null);
            return;
        }
        try {
            const user = getCurrentCognitoUser();
        if (!user) {
            resolve(null);
            return;
        }
        user.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session?.isValid()) {
                resolve(null);
                return;
            }
            const idToken = session.getIdToken();
            const payload = idToken.decodePayload ? idToken.decodePayload() : (idToken as { payload: Record<string, unknown> }).payload;
            resolve({
                idToken: idToken.getJwtToken(),
                sub: payload.sub || '',
                email: payload.email || payload['cognito:username'],
            });
        });
        } catch {
            resolve(null);
        }
    });
}

export function signIn(email: string, password: string): Promise<SessionResult> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const cognitoUser = new CognitoUser({
            Username: email.trim(),
            Pool: userPool,
            Storage: cognitoStorage,
        });
        const authDetails = new AuthenticationDetails({
            Username: email.trim(),
            Password: password,
        });
        cognitoUser.authenticateUser(authDetails, {
            onSuccess: (session: CognitoUserSession) => {
                const idToken = session.getIdToken();
                const payload = idToken.decodePayload();
                resolve({
                    idToken: idToken.getJwtToken(),
                    sub: payload.sub || '',
                    email: payload.email || payload['cognito:username'] || email,
                });
            },
            onFailure: (err) => reject(err),
        });
    });
}

export type SignUpResult = { userSub: string; userConfirmed: boolean; codeDeliveryDetails?: { Destination?: string } };

export function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
): Promise<SignUpResult> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const attributes: CognitoUserAttribute[] = [
            new CognitoUserAttribute({ Name: 'email', Value: email.trim() }),
            new CognitoUserAttribute({ Name: 'given_name', Value: firstName.trim() }),
            new CognitoUserAttribute({ Name: 'family_name', Value: lastName.trim() }),
        ];
        userPool.signUp(
            email.trim(),
            password,
            attributes,
            [],
            (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!result) {
                    reject(new Error('SignUp returned no result'));
                    return;
                }
                resolve({
                    userSub: result.userSub,
                    userConfirmed: result.userConfirmed,
                    codeDeliveryDetails: result.codeDeliveryDetails as SignUpResult['codeDeliveryDetails'],
                });
            }
        );
    });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const cognitoUser = new CognitoUser({
            Username: email.trim(),
            Pool: userPool,
            Storage: cognitoStorage,
        });
        cognitoUser.confirmRegistration(code, false, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export function resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const cognitoUser = new CognitoUser({
            Username: email.trim(),
            Pool: userPool,
            Storage: cognitoStorage,
        });
        cognitoUser.resendConfirmationCode((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export function forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const cognitoUser = new CognitoUser({
            Username: email.trim(),
            Pool: userPool,
            Storage: cognitoStorage,
        });
        cognitoUser.forgotPassword({
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
        });
    });
}

export function confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const userPool = getCognitoUserPool();
        const cognitoUser = new CognitoUser({
            Username: email.trim(),
            Pool: userPool,
            Storage: cognitoStorage,
        });
        cognitoUser.confirmPassword(code, newPassword, {
            onSuccess: () => resolve(),
            onFailure: (err) => reject(err),
        });
    });
}

export function signOut(): void {
    const user = getCurrentCognitoUser();
    if (user) {
        user.signOut();
    }
}

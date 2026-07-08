import {
    startVerification,
    VerificationStatus,
    type VerificationResult,
} from '@didit-protocol/sdk-react-native';

export { VerificationStatus, type VerificationResult };

/** Launch Didit native verification UI with a server-issued session token. */
export function launchDiditVerification(sessionToken: string): Promise<VerificationResult> {
    return startVerification(sessionToken);
}

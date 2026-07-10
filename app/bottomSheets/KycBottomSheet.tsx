import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useKycGate } from '@/hooks/useKycGate';
import { createKycSession } from '@/lib/kyc-api';
import { launchDiditVerification, VerificationStatus } from '@/lib/didit-sdk';
import {
    canRetryKyc,
    isKycApproved,
    isKycInProgress,
    isKycPendingReview,
    kycStatusLabel,
} from '@/lib/kyc-utils';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FullWindowOverlay } from 'react-native-screens';

type KycStep = 'consent' | 'loading' | 'status';

type KycBottomSheetProps = {
    /** Kept for layout compatibility; KYC sheet is index-controlled. */
    kycBottomSheetRef: React.RefObject<BottomSheetModal>;
    onApproved?: () => void;
};

const KYC_SNAP_POINTS = ['85%'];

function SheetHost({ children, visible }: { children: React.ReactNode; visible: boolean }) {
    if (!visible) return null;
    if (Platform.OS === 'ios') {
        return (
            <FullWindowOverlay>
                <GestureHandlerRootView style={StyleSheet.absoluteFill}>{children}</GestureHandlerRootView>
            </FullWindowOverlay>
        );
    }
    return <View style={StyleSheet.absoluteFill} pointerEvents="box-none">{children}</View>;
}

function initialStepForStatus(status?: string | null): KycStep {
    if (isKycApproved(status) || isKycPendingReview(status)) return 'status';
    // Incomplete / mid-flow (cancelled, abandoned, in progress) → show continue CTA
    return 'consent';
}

export default function KycBottomSheet({
    kycBottomSheetRef: _kycBottomSheetRef,
    onApproved,
}: KycBottomSheetProps) {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact, success } = useHaptics();
    const { kycStatus, refreshKycStatus } = useKycGate();
    const kycBottomSheetOpen = useStockStore((s) => s.kycBottomSheetOpen);
    const setKycBottomSheetOpen = useStockStore((s) => s.setKycBottomSheetOpen);

    const [step, setStep] = useState<KycStep>('consent');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [localStatus, setLocalStatus] = useState<string | null>(null);

    const displayStatus = localStatus ?? kycStatus ?? null;
    const approved = isKycApproved(displayStatus);

    const resetState = useCallback(() => {
        setStep(initialStepForStatus(kycStatus));
        setError(null);
        setBusy(false);
        setLocalStatus(null);
    }, [kycStatus]);

    useEffect(() => {
        if (approved) {
            setStep('status');
        }
    }, [approved]);

    // On open: sync GET /api/users/me and route to the right step so cancelled
    // mid-flow users always get a Continue CTA (creates a new Didit session).
    useEffect(() => {
        if (!kycBottomSheetOpen) return;
        let cancelled = false;
        (async () => {
            try {
                const me = await refreshKycStatus();
                if (cancelled) return;
                const next = me?.kycStatus ?? kycStatus;
                setLocalStatus(null);
                setError(null);
                setStep(initialStepForStatus(next));
            } catch {
                if (!cancelled) {
                    setStep(initialStepForStatus(kycStatus));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
        // Only re-run when the sheet opens, not on every status tick
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kycBottomSheetOpen]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.4}
            />
        ),
        []
    );

    const closeModal = useCallback(() => {
        setKycBottomSheetOpen(false);
    }, [setKycBottomSheetOpen]);

    const handleApproved = useCallback(async () => {
        success();
        await refreshKycStatus();
        setStep('status');
        onApproved?.();
        closeModal();
    }, [closeModal, onApproved, refreshKycStatus, success]);

    const startVerificationFlow = useCallback(async () => {
        setError(null);
        setBusy(true);
        setStep('loading');
        lightImpact();
        try {
            const session = await createKycSession({ language: 'en' });
            setLocalStatus(session.status);
            const result = await launchDiditVerification(session.session_token);

            if (result.type === 'completed') {
                const status = result.session.status;
                if (status === VerificationStatus.Approved) {
                    setLocalStatus('Approved');
                    await handleApproved();
                    return;
                }
                if (status === VerificationStatus.Declined) {
                    setLocalStatus('Declined');
                    setStep('status');
                    await refreshKycStatus();
                    return;
                }
                setLocalStatus('In Review');
                setStep('status');
                await refreshKycStatus();
                return;
            }

            if (result.type === 'cancelled') {
                // User closed Didit mid-flow — refresh /me and keep Continue available
                // so they can create a new session (backend handles incomplete sessions).
                const me = await refreshKycStatus();
                setLocalStatus(null);
                setStep(initialStepForStatus(me?.kycStatus));
                return;
            }

            setError(result.error.message || 'Verification failed. Please try again.');
            setStep('consent');
        } catch (err: any) {
            const msg = err?.message || 'Could not start verification. Please try again.';
            setError(msg);
            setStep('consent');
        } finally {
            setBusy(false);
        }
    }, [handleApproved, lightImpact, refreshKycStatus]);

    const handleDismiss = useCallback(() => {
        setKycBottomSheetOpen(false);
        resetState();
    }, [resetState, setKycBottomSheetOpen]);

    const titleStyle = [styles.title, { color: Color.baseText }];
    const bodyStyle = [styles.body, { color: Color.subText }];
    const primaryBtnStyle = [
        styles.primaryButton,
        { backgroundColor: isDark ? '#FFFFFF' : '#111827' },
        busy && styles.buttonDisabled,
    ];
    const primaryTextStyle = { color: isDark ? '#111827' : '#FFFFFF' };

    return (
        <SheetHost visible={kycBottomSheetOpen}>
            <BottomSheet
                index={0}
                onChange={(index) => {
                    if (index < 0) handleDismiss();
                }}
                enableDynamicSizing={false}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                snapPoints={KYC_SNAP_POINTS}
                backgroundStyle={{
                    borderRadius: 20,
                    backgroundColor: isDark ? '#1A1D21' : '#FFFFFF',
                }}
            >
                <BottomSheetScrollView contentContainerStyle={styles.container}>
                <View style={styles.iconRow}>
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                        <Ionicons
                            name={approved ? 'shield-checkmark' : 'shield-outline'}
                            size={28}
                            color={approved ? '#22C55E' : Color.baseText}
                        />
                    </View>
                </View>

                <Text style={titleStyle}>
                    {approved ? 'Identity verified' : 'Verify your identity'}
                </Text>

                {step === 'consent' && !approved && (
                    <>
                        <Text style={bodyStyle}>
                            SportStock is required to verify your identity before you can trade. You will scan a
                            government-issued ID and take a selfie. Didit processes your biometric data to confirm
                            your identity.
                        </Text>
                        {isKycInProgress(displayStatus) && (
                            <Text style={bodyStyle}>
                                Your previous verification was not finished. Continue to start a new secure session.
                            </Text>
                        )}
                        <Text style={[bodyStyle, styles.consentNote]}>
                            By continuing, you consent to identity verification and agree that your information will
                            be processed according to our Privacy Policy.
                        </Text>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        <TouchableOpacity
                            style={primaryBtnStyle}
                            onPress={startVerificationFlow}
                            disabled={busy}
                            activeOpacity={0.85}
                        >
                            {busy ? (
                                <ActivityIndicator color={primaryTextStyle.color} />
                            ) : (
                                <Text style={[styles.primaryButtonText, primaryTextStyle]}>
                                    {isKycInProgress(displayStatus)
                                        ? 'Continue verification'
                                        : 'Continue to verification'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}

                {step === 'loading' && (
                    <View style={styles.centerBlock}>
                        <ActivityIndicator size="large" color={Color.baseText} />
                        <Text style={[bodyStyle, styles.loadingText]}>Opening secure verification…</Text>
                    </View>
                )}

                {step === 'status' && (
                    <>
                        <Text style={bodyStyle}>{kycStatusLabel(displayStatus)}</Text>
                        {isKycPendingReview(displayStatus) && (
                            <Text style={bodyStyle}>
                                We will notify you when your verification is complete. You can check back here for
                                updates.
                            </Text>
                        )}
                        {isKycInProgress(displayStatus) && !approved && (
                            <Text style={bodyStyle}>
                                Your verification is still in progress. Tap below to continue where you left off.
                            </Text>
                        )}
                        {displayStatus === 'Declined' && (
                            <Text style={bodyStyle}>
                                We could not verify your identity. Please try again with a valid government-issued ID.
                            </Text>
                        )}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {!approved && canRetryKyc(displayStatus) && (
                            <TouchableOpacity
                                style={primaryBtnStyle}
                                onPress={startVerificationFlow}
                                disabled={busy}
                                activeOpacity={0.85}
                            >
                                {busy ? (
                                    <ActivityIndicator color={primaryTextStyle.color} />
                                ) : (
                                    <Text style={[styles.primaryButtonText, primaryTextStyle]}>
                                        {isKycInProgress(displayStatus)
                                            ? 'Continue verification'
                                            : displayStatus
                                              ? 'Try again'
                                              : 'Start verification'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {approved && (
                            <TouchableOpacity
                                style={primaryBtnStyle}
                                onPress={closeModal}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.primaryButtonText, primaryTextStyle]}>Continue</Text>
                            </TouchableOpacity>
                        )}

                        {!approved && isKycPendingReview(displayStatus) && (
                            <TouchableOpacity style={styles.secondaryButton} onPress={closeModal} activeOpacity={0.85}>
                                <Text style={[styles.secondaryButtonText, { color: Color.subText }]}>Close</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </BottomSheetScrollView>
            </BottomSheet>
        </SheetHost>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 40,
    },
    iconRow: {
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 12,
    },
    consentNote: {
        fontSize: 13,
        marginBottom: 20,
    },
    primaryButton: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    centerBlock: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    loadingText: {
        marginTop: 8,
    },
});

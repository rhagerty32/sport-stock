import { useTheme } from '@/hooks/use-theme';
import { useLocation } from '@/hooks/useLocation';
import { isStateBlocked } from '@/lib/state-restrictions';
import { fetchCurrentUser } from '@/lib/auth-api';
import { canRetryKyc, isKycApproved, needsKycPrompt } from '@/lib/kyc-utils';
import {
    decodeJwtPayload,
    getHostedUIRefreshToken,
    refreshHostedUIToken,
    saveHostedUIRefreshToken,
} from '@/lib/cognito-hosted-ui';
import { hydrateCognitoStorage } from '@/lib/cognito-storage';
import { getCurrentSession } from '@/lib/cognito';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PORTFOLIO_STALE_MS, fetchPortfolio, portfolioKeys } from '@/lib/portfolio-api';
import { prefetchStockSheetPriceHistory } from '@/lib/stocks-api';
import { fetchWallet, walletKeys } from '@/lib/wallet-api';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import StockBottomSheet from './bottomSheets/StockSheet/StockBottomSheet';
import BlockedStateScreen from './BlockedStateScreen';
import BuySellBottomSheet from './bottomSheets/BuySellBottomSheet';
import LightDarkBottomSheet from './bottomSheets/LightDarkBottomSheet';
import LoginBottomSheet from './bottomSheets/LoginBottomSheet';
import KycBottomSheet from './bottomSheets/KycBottomSheet';
import OnboardingBottomSheet from './bottomSheets/OnboardingBottomSheet';
import PositionDetailBottomSheet from './bottomSheets/PositionDetailBottomSheet';
import ProfileBottomSheet from './bottomSheets/ProfileBottomSheet';
import PurchaseFanCoinsBottomSheet from './bottomSheets/PurchaseFanCoinsBottomSheet';
import TransactionDetailBottomSheet from './bottomSheets/TransactionDetailBottomSheet';
import WalletSystemBottomSheet from './bottomSheets/WalletSystemBottomSheet';

// Create a QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export default function RootLayout() {
    const { isDark } = useTheme();
    const stockBottomSheetRef = useRef<BottomSheetModal>(null);
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null);
    const profileBottomSheetRef = useRef<BottomSheetModal>(null);
    const lightDarkBottomSheetRef = useRef<BottomSheetModal>(null);
    const purchaseFanCoinsBottomSheetRef = useRef<BottomSheetModal>(null);
    const walletSystemBottomSheetRef = useRef<BottomSheetModal>(null);
    const onboardingBottomSheetRef = useRef<BottomSheetModal>(null);
    const transactionDetailBottomSheetRef = useRef<BottomSheetModal>(null);
    const positionDetailBottomSheetRef = useRef<BottomSheetModal>(null);
    const loginBottomSheetRef = useRef<BottomSheetModal>(null);
    const kycBottomSheetRef = useRef<BottomSheetModal>(null);
    const {
        activeStockId,
        activeUserId,
        buySellBottomSheetOpen,
        profileBottomSheetOpen,
        lightDarkBottomSheetOpen,
        purchaseFanCoinsBottomSheetOpen,
        walletSystemBottomSheetOpen,
        transactionDetailBottomSheetOpen,
        positionDetailBottomSheetOpen,
        loginBottomSheetOpen,
        kycBottomSheetOpen,
        setActiveStockId,
        setProfileBottomSheetOpen,
        setLightDarkBottomSheetOpen,
        setPurchaseFanCoinsBottomSheetOpen,
        setWalletSystemBottomSheetOpen,
        setTransactionDetailBottomSheetOpen,
        setPositionDetailBottomSheetOpen,
        setLoginBottomSheetOpen,
        setKycBottomSheetOpen,
    } = useStockStore();
    const { onboardingCompleted, checkOnboardingStatus } = useSettingsStore();
    const authUserId = useAuthStore((s) => s.user?.id);
    const authKycStatus = useAuthStore((s) => s.user?.kycStatus);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const authSetUser = useAuthStore((s) => s.setUser);

    useEffect(() => {
        if (!isAuthenticated || !authUserId) return;
        void queryClient.prefetchQuery({
            queryKey: portfolioKeys.root(authUserId),
            queryFn: fetchPortfolio,
            staleTime: PORTFOLIO_STALE_MS,
        });
        void queryClient.prefetchQuery({
            queryKey: walletKeys.detail(authUserId),
            queryFn: () => fetchWallet(authUserId),
        });
    }, [isAuthenticated, authUserId]);

    // Enable React Query refetchOnWindowFocus in React Native (AppState instead of window)
    useEffect(() => {
        const onAppStateChange = (status: AppStateStatus) => {
            if (Platform.OS !== 'web') {
                focusManager.setFocused(status === 'active');
            }
        };
        const sub = AppState.addEventListener('change', onAppStateChange);
        return () => sub.remove();
    }, []);

    // Reset all sheet-open state on app load so no sheet is stuck visible from persistence or a previous run
    const hasResetSheetsOnMount = useRef(false);
    useEffect(() => {
        if (hasResetSheetsOnMount.current) return;
        hasResetSheetsOnMount.current = true;
        setActiveStockId(null);
        setProfileBottomSheetOpen(false);
        setLightDarkBottomSheetOpen(false);
        setPurchaseFanCoinsBottomSheetOpen(false);
        setWalletSystemBottomSheetOpen(false);
        setTransactionDetailBottomSheetOpen(false);
        setPositionDetailBottomSheetOpen(false);
        setLoginBottomSheetOpen(false);
        setKycBottomSheetOpen(false);
    }, [
        setActiveStockId,
        setProfileBottomSheetOpen,
        setLightDarkBottomSheetOpen,
        setPurchaseFanCoinsBottomSheetOpen,
        setWalletSystemBottomSheetOpen,
        setTransactionDetailBottomSheetOpen,
        setPositionDetailBottomSheetOpen,
        setLoginBottomSheetOpen,
        setKycBottomSheetOpen,
    ]);

    // Safety: force-dismiss all sheets shortly after mount in case a backdrop is stuck (e.g. ref was set after state was restored)
    useEffect(() => {
        const t = setTimeout(() => {
            if (!useStockStore.getState().buySellBottomSheetOpen) {
                buySellBottomSheetRef.current?.dismiss();
            }
            profileBottomSheetRef.current?.dismiss();
            lightDarkBottomSheetRef.current?.dismiss();
            purchaseFanCoinsBottomSheetRef.current?.dismiss();
            walletSystemBottomSheetRef.current?.dismiss();
            onboardingBottomSheetRef.current?.dismiss();
            transactionDetailBottomSheetRef.current?.dismiss();
            positionDetailBottomSheetRef.current?.dismiss();
        }, 400);
        return () => clearTimeout(t);
    }, []);

    // Check user location for state restrictions
    const { locationInfo, loading: locationLoading } = useLocation();
    // Only block if we successfully determined the state AND it's blocked
    // If location check fails, allow app to continue (fail open)
    const isBlocked = locationInfo?.state && !locationInfo.error ? isStateBlocked(locationInfo.state) : false;

    // Keep splash screen visible until location check is complete
    useEffect(() => {
        // Prevent auto-hiding the splash screen
        SplashScreen.preventAutoHideAsync();

        // Only hide splash screen once location check is complete AND we know what to show
        if (!locationLoading) {
            // Small delay for smooth transition
            const timer = setTimeout(() => {
                SplashScreen.hideAsync();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [locationLoading]);

    // Stock sheet is a controlled BottomSheet (index) inside FullWindowOverlay —
    // NativeTabs portals BottomSheetModal behind the tab window, so present() is a no-op visually.
    useEffect(() => {
        if (activeStockId) {
            void prefetchStockSheetPriceHistory(queryClient, activeStockId);
        }
    }, [activeStockId]);

    useEffect(() => {
        if (activeUserId) {
            setActiveStockId(null);
        }
    }, [activeUserId, setActiveStockId]);

    useEffect(() => {
        if (buySellBottomSheetOpen) {
            buySellBottomSheetRef.current?.present();
        } else {
            buySellBottomSheetRef.current?.dismiss();
        }
    }, [buySellBottomSheetOpen]);

    useEffect(() => {
        if (profileBottomSheetOpen) {
            profileBottomSheetRef.current?.present();
            lightDarkBottomSheetRef.current?.dismiss();
        } else {
            profileBottomSheetRef.current?.dismiss();
        }
    }, [profileBottomSheetOpen]);

    useEffect(() => {
        if (lightDarkBottomSheetOpen) {
            lightDarkBottomSheetRef.current?.present();
            profileBottomSheetRef.current?.dismiss();
        } else {
            lightDarkBottomSheetRef.current?.dismiss();
        }
    }, [lightDarkBottomSheetOpen]);

    useEffect(() => {
        if (purchaseFanCoinsBottomSheetOpen) {
            purchaseFanCoinsBottomSheetRef.current?.present();
        } else {
            purchaseFanCoinsBottomSheetRef.current?.dismiss();
        }
    }, [purchaseFanCoinsBottomSheetOpen]);

    useEffect(() => {
        if (walletSystemBottomSheetOpen) {
            walletSystemBottomSheetRef.current?.present();
        } else {
            walletSystemBottomSheetRef.current?.dismiss();
        }
    }, [walletSystemBottomSheetOpen]);

    useEffect(() => {
        if (transactionDetailBottomSheetOpen) {
            transactionDetailBottomSheetRef.current?.present();
        } else {
            transactionDetailBottomSheetRef.current?.dismiss();
        }
    }, [transactionDetailBottomSheetOpen]);

    useEffect(() => {
        if (positionDetailBottomSheetOpen) {
            positionDetailBottomSheetRef.current?.present();
        } else {
            positionDetailBottomSheetRef.current?.dismiss();
        }
    }, [positionDetailBottomSheetOpen]);

    // Stock / Login / KYC sheets are index-controlled inside FullWindowOverlay
    // (NativeTabs puts BottomSheetModal portals behind the tab window).

    const showOnboardingIfEligible = useRef(async () => {
        try {
            const completed = await checkOnboardingStatus();
            if (completed) return;
            const { isAuthenticated: authed, user } = useAuthStore.getState();
            if (authed && !isKycApproved(user?.kycStatus)) return;
            setTimeout(() => {
                onboardingBottomSheetRef.current?.present();
            }, 400);
        } catch {
            const { isAuthenticated: authed, user } = useAuthStore.getState();
            if (!authed || isKycApproved(user?.kycStatus)) {
                setTimeout(() => {
                    onboardingBottomSheetRef.current?.present();
                }, 400);
            }
        }
    });

    // Re-check KYC from GET /api/users/me when returning to foreground so users who
    // closed the app mid-Didit get re-prompted and can create a new session.
    useEffect(() => {
        const onAppStateChange = (status: AppStateStatus) => {
            if (status !== 'active') return;

            const { isAuthenticated: authed, getToken, setUser, user } = useAuthStore.getState();
            if (!authed) return;

            void (async () => {
                try {
                    const token = getToken();
                    if (!token) return;
                    const me = await fetchCurrentUser(token);
                    setUser(me);
                    if (canRetryKyc(me.kycStatus)) {
                        // Incomplete / cancelled mid-flow — re-open so they can create a new session
                        setKycBottomSheetOpen(true);
                    } else if (isKycApproved(me.kycStatus) && needsKycPrompt(user?.kycStatus)) {
                        setKycBottomSheetOpen(false);
                        void showOnboardingIfEligible.current();
                    }
                } catch {
                    // Keep last-known status; trade gates still enforce KYC
                }
            })();
        };
        const sub = AppState.addEventListener('change', onAppStateChange);
        return () => sub.remove();
    }, [setKycBottomSheetOpen]);

    const handleKycDeepLink = useRef(async (url: string) => {
        const parsed = Linking.parse(url);
        const path = parsed.path ?? '';
        if (!path.includes('kyc/callback')) return;

        const token = useAuthStore.getState().getToken();
        if (!token) return;

        try {
            const user = await fetchCurrentUser(token);
            authSetUser(user);
            if (isKycApproved(user.kycStatus)) {
                setKycBottomSheetOpen(false);
                void showOnboardingIfEligible.current();
            } else {
                setKycBottomSheetOpen(true);
            }
        } catch {
            // ignore — user can retry from KYC sheet
        }
    });

    useEffect(() => {
        const onUrl = ({ url }: { url: string }) => {
            void handleKycDeepLink.current(url);
        };
        const sub = Linking.addEventListener('url', onUrl);
        void Linking.getInitialURL().then((url) => {
            if (url) void handleKycDeepLink.current(url);
        });
        return () => sub.remove();
    }, [authSetUser, setKycBottomSheetOpen]);

    // Restore Cognito session on app load (supports both Cognito SDK and Hosted UI)
    // Wait for auth store to rehydrate from persistence before running restore
    useEffect(() => {
        let cancelled = false;
        const runRestore = () => {
            (async () => {
                try {
                    await hydrateCognitoStorage();
                    let session = await getCurrentSession();

                // If no Cognito SDK session, try Hosted UI refresh (Apple/Google users)
                if (!session?.idToken) {
                    const refreshToken = await getHostedUIRefreshToken();
                    if (refreshToken && !cancelled) {
                        try {
                            const tokens = await refreshHostedUIToken(refreshToken);
                            if (tokens.refresh_token) {
                                await saveHostedUIRefreshToken(tokens.refresh_token);
                            }
                            const payload = decodeJwtPayload(tokens.id_token);
                            const jwtEmail = typeof payload.email === 'string' ? payload.email.trim() : '';
                            session = {
                                idToken: tokens.id_token,
                                sub: (payload.sub as string) || '',
                                email: jwtEmail.includes('@') ? jwtEmail : undefined,
                            };
                        } catch {
                            useAuthStore.getState().signOut();
                            return;
                        }
                    } else {
                        // No valid session and no refresh token - clear any stale persisted auth
                        useAuthStore.getState().signOut();
                        return;
                    }
                }

                if (cancelled || !session?.idToken) return;
                const user = await fetchCurrentUser(session.idToken);
                if (cancelled) return;
                useAuthStore.getState().signIn({
                    user,
                    idToken: session.idToken,
                });
                if (needsKycPrompt(user.kycStatus)) {
                    setKycBottomSheetOpen(true);
                }
            } catch {
                // Cognito not configured or no session
            }
        })();
        };
        if (useAuthStore.persist.hasHydrated()) {
            runRestore();
        } else {
            const unsub = useAuthStore.persist.onFinishHydration(runRestore);
            return () => {
                cancelled = true;
                unsub();
            };
        }
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        // Load Ionicons font
        const loadIonicons = async () => {
            try {
                await Font.loadAsync({
                    ...Ionicons.font,
                });
            } catch (error) {
                console.error('Failed to load Ionicons font:', error);
            }
        };

        loadIonicons();

        // Check onboarding status — skip for authenticated users until KYC is approved
        const checkAndShowOnboarding = async () => {
            try {
                const completed = await checkOnboardingStatus();
                if (!completed) {
                    if (useAuthStore.getState().isAuthenticated) {
                        const status = useAuthStore.getState().user?.kycStatus;
                        if (!isKycApproved(status)) return;
                    }
                    setTimeout(() => {
                        onboardingBottomSheetRef.current?.present();
                    }, 500);
                }
            } catch (error) {
                console.error('Failed to check onboarding status:', error);
                if (!useAuthStore.getState().isAuthenticated) {
                    setTimeout(() => {
                        onboardingBottomSheetRef.current?.present();
                    }, 500);
                }
            }
        };

        checkAndShowOnboarding();
    }, [checkOnboardingStatus]);

    // Watch for onboarding reset and show onboarding immediately (but not on initial mount)
    const hasMounted = useRef(false);
    useEffect(() => {
        if (hasMounted.current && !onboardingCompleted) {
            if (isAuthenticated && !isKycApproved(authKycStatus)) return;
            const timer = setTimeout(() => {
                onboardingBottomSheetRef.current?.present();
            }, 300);
            return () => clearTimeout(timer);
        }
        hasMounted.current = true;
    }, [onboardingCompleted, isAuthenticated, authKycStatus]);

    useEffect(() => {
        // Suppress specific warnings and errors that are common in Expo development
        LogBox.ignoreLogs([
            'Unable to save asset to directory',
            'Warning: Failed to save asset',
        ]);

        // Also suppress console errors for asset saving
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const message = args[0];
            if (typeof message === 'string' &&
                (message.includes('Unable to save asset to directory') ||
                    message.includes('Failed to save asset'))) {
                // Ignore asset saving errors
                return;
            }
            // Log other errors normally
            originalConsoleError.apply(console, args);
        };

        return () => {
            // Restore original console.error
            console.error = originalConsoleError;
        };
    }, [checkOnboardingStatus]);

    const customDarkTheme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            background: '#0B0F13',
            card: '#1A1D21',
            text: '#F5F5F5',
            border: '#2C2C2C',
            notification: '#217C0A',
        },
    };

    // While location is loading, don't render anything (splash screen stays visible)
    if (locationLoading) {
        return (
            <ThemeProvider value={isDark ? customDarkTheme : DefaultTheme}>
                <StatusBar style="auto" />
            </ThemeProvider>
        );
    }

    // Show blocked screen if user is in a restricted state
    if (isBlocked) {
        return (
            <ThemeProvider value={isDark ? customDarkTheme : DefaultTheme}>
                <BlockedStateScreen detectedState={locationInfo?.state || null} />
                <StatusBar style="auto" />
            </ThemeProvider>
        );
    }

    // Location check complete and user is allowed - show the app
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={isDark ? customDarkTheme : DefaultTheme}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <BottomSheetModalProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="league/[id]"
                                options={{ headerShown: false, presentation: 'card' }}
                            />
                            <Stack.Screen
                                name="stock/[id]"
                                options={{ headerShown: false, presentation: 'transparentModal' }}
                            />
                        </Stack>

                        {/* Bottom Sheets */}
                        <OnboardingBottomSheet onboardingBottomSheetRef={onboardingBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <StockBottomSheet stockBottomSheetRef={stockBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <BuySellBottomSheet buySellBottomSheetRef={buySellBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <ProfileBottomSheet profileBottomSheetRef={profileBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <LightDarkBottomSheet lightDarkBottomSheetRef={lightDarkBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <PurchaseFanCoinsBottomSheet purchaseFanCoinsBottomSheetRef={purchaseFanCoinsBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <WalletSystemBottomSheet walletSystemBottomSheetRef={walletSystemBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <TransactionDetailBottomSheet transactionDetailBottomSheetRef={transactionDetailBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <PositionDetailBottomSheet positionDetailBottomSheetRef={positionDetailBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <LoginBottomSheet loginBottomSheetRef={loginBottomSheetRef as React.RefObject<BottomSheetModal>} />
                        <KycBottomSheet
                            kycBottomSheetRef={kycBottomSheetRef as React.RefObject<BottomSheetModal>}
                            onApproved={() => {
                                void showOnboardingIfEligible.current();
                            }}
                        />

                        <StatusBar style="auto" />
                    </BottomSheetModalProvider>
                </GestureHandlerRootView>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

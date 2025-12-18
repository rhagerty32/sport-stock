import { useTheme } from '@/hooks/use-theme';
import { useLocation } from '@/hooks/useLocation';
import { isStateBlocked } from '@/lib/state-restrictions';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import BlockedStateScreen from './BlockedStateScreen';
import BuySellBottomSheet from './bottomSheets/BuySellBottomSheet';
import LightDarkBottomSheet from './bottomSheets/LightDarkBottomSheet';
import OnboardingBottomSheet from './bottomSheets/OnboardingBottomSheet';
import PositionDetailBottomSheet from './bottomSheets/PositionDetailBottomSheet';
import ProfileBottomSheet from './bottomSheets/ProfileBottomSheet';
import PurchaseFanCoinsBottomSheet from './bottomSheets/PurchaseFanCoinsBottomSheet';
import StockBottomSheet from './bottomSheets/StockBottomSheet';
import TransactionDetailBottomSheet from './bottomSheets/TransactionDetailBottomSheet';
import WalletSystemBottomSheet from './bottomSheets/WalletSystemBottomSheet';

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
    const { activeStockId, activeUserId, profileBottomSheetOpen, lightDarkBottomSheetOpen, purchaseFanCoinsBottomSheetOpen, walletSystemBottomSheetOpen, transactionDetailBottomSheetOpen, positionDetailBottomSheetOpen } = useStockStore();
    const { onboardingCompleted, checkOnboardingStatus } = useSettingsStore();

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

    useEffect(() => {
        if (activeStockId) {
            stockBottomSheetRef.current?.present();
        } else {
            stockBottomSheetRef.current?.dismiss();
        }
    }, [activeStockId]);

    useEffect(() => {
        if (activeUserId) {
            stockBottomSheetRef.current?.dismiss(); // Close stock sheet when opening user sheet
        }
    }, [activeUserId]);

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

        // Check onboarding status and show onboarding if not completed
        const checkAndShowOnboarding = async () => {
            try {
                const completed = await checkOnboardingStatus();
                if (!completed) {
                    // Small delay to ensure the app is fully loaded
                    setTimeout(() => {
                        onboardingBottomSheetRef.current?.present();
                    }, 500);
                }
            } catch (error) {
                console.error('Failed to check onboarding status:', error);
                // Show onboarding by default if check fails
                setTimeout(() => {
                    onboardingBottomSheetRef.current?.present();
                }, 500);
            }
        };

        checkAndShowOnboarding();
    }, [checkOnboardingStatus]);

    // Watch for onboarding reset and show onboarding immediately (but not on initial mount)
    const hasMounted = useRef(false);
    useEffect(() => {
        if (hasMounted.current && !onboardingCompleted) {
            // Small delay to ensure smooth transition
            const timer = setTimeout(() => {
                onboardingBottomSheetRef.current?.present();
            }, 300);
            return () => clearTimeout(timer);
        }
        hasMounted.current = true;
    }, [onboardingCompleted]);

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

                    <StatusBar style="auto" />
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}

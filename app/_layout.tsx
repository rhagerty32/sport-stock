import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { DynamicColorIOS, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { useLocation } from '@/hooks/useLocation';
import { isStateBlocked } from '@/lib/state-restrictions';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BlockedStateScreen from './BlockedStateScreen';
import BuySellBottomSheet from './bottomSheets/BuySellBottomSheet';
import LightDarkBottomSheet from './bottomSheets/LightDarkBottomSheet';
import OnboardingBottomSheet from './bottomSheets/OnboardingBottomSheet';
import ProfileBottomSheet from './bottomSheets/ProfileBottomSheet';
import PurchaseFanCoinsBottomSheet from './bottomSheets/PurchaseFanCoinsBottomSheet';
import StockBottomSheet from './bottomSheets/StockBottomSheet';
import TransactionDetailBottomSheet from './bottomSheets/TransactionDetailBottomSheet';
import UserBottomSheet from './bottomSheets/UserBottomSheet';
import WalletSystemBottomSheet from './bottomSheets/WalletSystemBottomSheet';

export default function RootLayout() {
    const { theme, isDark } = useTheme();
    const stockBottomSheetRef = useRef<BottomSheetModal>(null);
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null);
    const profileBottomSheetRef = useRef<BottomSheetModal>(null);
    const lightDarkBottomSheetRef = useRef<BottomSheetModal>(null);
    const userBottomSheetRef = useRef<BottomSheetModal>(null);
    const purchaseFanCoinsBottomSheetRef = useRef<BottomSheetModal>(null);
    const walletSystemBottomSheetRef = useRef<BottomSheetModal>(null);
    const onboardingBottomSheetRef = useRef<BottomSheetModal>(null);
    const transactionDetailBottomSheetRef = useRef<BottomSheetModal>(null);
    const { activeStockId, activeUserId, profileBottomSheetOpen, lightDarkBottomSheetOpen, purchaseFanCoinsBottomSheetOpen, walletSystemBottomSheetOpen, transactionDetailBottomSheetOpen } = useStockStore();
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
            userBottomSheetRef.current?.dismiss(); // Close user sheet when opening stock sheet
        } else {
            stockBottomSheetRef.current?.dismiss();
        }
    }, [activeStockId]);

    useEffect(() => {
        if (activeUserId) {
            userBottomSheetRef.current?.present();
            stockBottomSheetRef.current?.dismiss(); // Close stock sheet when opening user sheet
        } else {
            userBottomSheetRef.current?.dismiss();
        }
    }, [activeUserId]);

    console.log(profileBottomSheetOpen)

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
                    <NativeTabs
                        tintColor={DynamicColorIOS({ dark: '#00C853', light: '#00C853' })}
                        labelStyle={{
                            color: DynamicColorIOS({ dark: isDark ? '#ccc' : 'black', light: isDark ? '#ccc' : 'black' }),
                        }}
                    >
                        <NativeTabs.Trigger name="index">
                            <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
                            <Label>Home</Label>
                        </NativeTabs.Trigger>

                        <NativeTabs.Trigger name="profile">
                            <Icon sf={{ default: 'person', selected: 'person.fill' }} />
                            <Label>Profile</Label>
                        </NativeTabs.Trigger>

                        <NativeTabs.Trigger role='search' name="search">
                            <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
                            <Label>Search</Label>
                        </NativeTabs.Trigger>
                    </NativeTabs>

                    {/* Bottom Sheets */}
                    <OnboardingBottomSheet onboardingBottomSheetRef={onboardingBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <StockBottomSheet stockBottomSheetRef={stockBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <UserBottomSheet userBottomSheetRef={userBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <BuySellBottomSheet buySellBottomSheetRef={buySellBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <ProfileBottomSheet profileBottomSheetRef={profileBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <LightDarkBottomSheet lightDarkBottomSheetRef={lightDarkBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <PurchaseFanCoinsBottomSheet purchaseFanCoinsBottomSheetRef={purchaseFanCoinsBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <WalletSystemBottomSheet walletSystemBottomSheetRef={walletSystemBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <TransactionDetailBottomSheet transactionDetailBottomSheetRef={transactionDetailBottomSheetRef as React.RefObject<BottomSheetModal>} />

                    <StatusBar style="auto" />
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}

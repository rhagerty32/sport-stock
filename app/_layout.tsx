import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { DynamicColorIOS, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import BuySellBottomSheet from './bottomSheets/BuySellBottomSheet';
import LightDarkBottomSheet from './bottomSheets/LightDarkBottomSheet';
import ProfileBottomSheet from './bottomSheets/ProfileBottomSheet';
import StockBottomSheet from './bottomSheets/StockBottomSheet';
import UserBottomSheet from './bottomSheets/UserBottomSheet';

export default function RootLayout() {
    const { theme, isDark } = useTheme();
    const stockBottomSheetRef = useRef<BottomSheetModal>(null);
    const buySellBottomSheetRef = useRef<BottomSheetModal>(null);
    const profileBottomSheetRef = useRef<BottomSheetModal>(null);
    const lightDarkBottomSheetRef = useRef<BottomSheetModal>(null);
    const userBottomSheetRef = useRef<BottomSheetModal>(null);
    const { activeStockId, activeUserId, profileBottomSheetOpen, lightDarkBottomSheetOpen } = useStockStore();

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
    }, []);

    return (
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <NativeTabs
                        tintColor={DynamicColorIOS({ dark: '#217C0A', light: '#217C0A' })}
                        labelStyle={{
                            color: DynamicColorIOS({ dark: 'white', light: 'black' }),
                        }}
                    >
                        <NativeTabs.Trigger name="index">
                            <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
                            <Label>Home</Label>
                        </NativeTabs.Trigger>

                        <NativeTabs.Trigger name="investing">
                            <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
                            <Label>Investing</Label>
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
                    <StockBottomSheet stockBottomSheetRef={stockBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <UserBottomSheet userBottomSheetRef={userBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <BuySellBottomSheet buySellBottomSheetRef={buySellBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <ProfileBottomSheet profileBottomSheetRef={profileBottomSheetRef as React.RefObject<BottomSheetModal>} />
                    <LightDarkBottomSheet lightDarkBottomSheetRef={lightDarkBottomSheetRef as React.RefObject<BottomSheetModal>} />

                    <StatusBar style="auto" />
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}

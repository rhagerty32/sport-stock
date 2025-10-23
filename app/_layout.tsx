import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { DynamicColorIOS, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import StockBottomSheet from './StockBottomSheet';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const stockBottomSheetRef = useRef<BottomSheetModal>(null);
    const { activeStockId, setActiveStockId } = useStockStore();

    console.log('activeStockId', activeStockId);

    useEffect(() => {
        if (activeStockId) {
            stockBottomSheetRef.current?.present();
        } else {
            stockBottomSheetRef.current?.dismiss();
        }
    }, [activeStockId]);

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
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
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

                    <StockBottomSheet stockBottomSheetRef={stockBottomSheetRef as React.RefObject<BottomSheetModal>} />

                    <StatusBar style="auto" />
                </BottomSheetModalProvider>
            </GestureHandlerRootView>
        </ThemeProvider>
    );
}

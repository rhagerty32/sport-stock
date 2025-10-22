import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <NativeTabs>
                <NativeTabs.Trigger name="index">
                    <Icon sf="house.fill" />
                    <Label>Home</Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="explore">
                    <Icon sf="paperplane.fill" />
                    <Label>Explore</Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="profile">
                    <Icon sf="person.fill" />
                    <Label>Profile</Label>
                </NativeTabs.Trigger>
            </NativeTabs>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}

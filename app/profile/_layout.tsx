import { useTheme } from '@/hooks/use-theme';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
    const { isDark } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: isDark ? '#0B0F13' : '#FFFFFF',
                },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="trade-history" />
        </Stack>
    );
}

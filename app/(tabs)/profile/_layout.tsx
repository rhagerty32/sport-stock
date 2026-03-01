import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/stores/authStore';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileLayout() {
    const Color = useColors();
    const { isDark } = useTheme();
    const router = useRouter();
    const segments = useSegments();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // When logged out, redirect trade-history and my-stash to profile index
    useEffect(() => {
        const lastSegment = segments[segments.length - 1];
        const isProtectedRoute = lastSegment === 'trade-history' || lastSegment === 'my-stash';
        if (isProtectedRoute && !isAuthenticated) {
            router.replace('/(tabs)/profile');
        }
    }, [segments, isAuthenticated, router]);

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: isDark ? '#0B0F13' : Color.white,
                },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="trade-history" />
            <Stack.Screen name="my-stash" />
        </Stack>
    );
}

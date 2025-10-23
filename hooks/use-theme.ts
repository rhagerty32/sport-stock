import { useSettingsStore } from '@/stores/settingsStore';
import { useColorScheme } from 'react-native';

export function useTheme() {
    const systemColorScheme = useColorScheme();
    const { theme } = useSettingsStore();

    // Determine the actual theme to use based on user preference
    const getActualTheme = () => {
        switch (theme) {
            case 'light':
                return 'light';
            case 'dark':
                return 'dark';
            case 'system':
            default:
                return systemColorScheme || 'light';
        }
    };

    const actualTheme = getActualTheme();
    const isDark = actualTheme === 'dark';

    return {
        theme: actualTheme,
        isDark,
        userTheme: theme,
        systemTheme: systemColorScheme,
    };
}

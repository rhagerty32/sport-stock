import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: ThemeOption;
    setTheme: (theme: ThemeOption) => void;
    isPublicAccount: boolean;
    setIsPublicAccount: (isPublic: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme) => set({ theme }),
            isPublicAccount: true,
            setIsPublicAccount: (isPublic) => set({ isPublicAccount: isPublic }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

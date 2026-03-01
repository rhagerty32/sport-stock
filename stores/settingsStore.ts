import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeOption = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: ThemeOption;
    setTheme: (theme: ThemeOption) => void;
    isPublicAccount: boolean;
    setIsPublicAccount: (isPublic: boolean) => void;
    onboardingCompleted: boolean;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
    checkOnboardingStatus: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            theme: 'system',
            setTheme: (theme) => set({ theme }),
            isPublicAccount: true,
            setIsPublicAccount: (isPublic) => set({ isPublicAccount: isPublic }),
            onboardingCompleted: false,
            completeOnboarding: async () => {
                set({ onboardingCompleted: true });
            },
            resetOnboarding: async () => {
                set({ onboardingCompleted: false });
            },
            checkOnboardingStatus: async () => {
                return get().onboardingCompleted;
            },
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

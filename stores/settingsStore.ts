import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { USE_LIVE_API } from '@/constants/api-config';

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
                // When USE_LIVE_API is true, this will sync with the backend API
                // For now, it just stores locally
                if (USE_LIVE_API) {
                    try {
                        // TODO: Call API endpoint to mark onboarding as complete
                        // await api.post('/user/onboarding/complete');
                    } catch (error) {
                        console.error('Failed to sync onboarding status with API:', error);
                        // Fall back to local storage if API fails
                    }
                }
                set({ onboardingCompleted: true });
            },
            resetOnboarding: async () => {
                // Reset onboarding status (useful for development/testing)
                if (USE_LIVE_API) {
                    try {
                        // TODO: Call API endpoint to reset onboarding status
                        // await api.post('/user/onboarding/reset');
                    } catch (error) {
                        console.error('Failed to reset onboarding status with API:', error);
                        // Fall back to local storage if API fails
                    }
                }
                set({ onboardingCompleted: false });
            },
            checkOnboardingStatus: async () => {
                // When USE_LIVE_API is true, check with the backend API
                if (USE_LIVE_API) {
                    try {
                        // TODO: Call API endpoint to check onboarding status
                        // const response = await api.get('/user/onboarding/status');
                        // return response.data.completed;
                    } catch (error) {
                        console.error('Failed to fetch onboarding status from API:', error);
                        // Fall back to local storage if API fails
                    }
                }
                return get().onboardingCompleted;
            },
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

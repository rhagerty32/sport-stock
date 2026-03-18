import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { signOut as cognitoSignOut } from '@/lib/cognito';
import { clearHostedUISession } from '@/lib/cognito-hosted-ui';

export type AuthUser = {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
};

type AuthState = {
    isAuthenticated: boolean;
    user: AuthUser | null;
    idToken: string | null;
    signIn: (payload: { user: AuthUser; idToken: string }) => void;
    setUser: (user: AuthUser) => void;
    signOut: () => void;
    requireAuth: (onSuccess?: () => void) => boolean;
    getToken: () => string | null;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            idToken: null,

            signIn: (payload) => {
                set({
                    isAuthenticated: true,
                    user: payload.user,
                    idToken: payload.idToken,
                });
            },

            setUser: (user) => {
                set({ user });
            },

            signOut: () => {
                cognitoSignOut();
                clearHostedUISession();
                set({ isAuthenticated: false, user: null, idToken: null });
            },

            requireAuth: (onSuccess) => {
                const { isAuthenticated } = get();
                if (isAuthenticated) {
                    onSuccess?.();
                    return true;
                }
                return false;
            },

            getToken: () => get().idToken,
        }),
        {
            name: 'sportstock-auth',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                idToken: state.idToken,
            }),
        }
    )
);

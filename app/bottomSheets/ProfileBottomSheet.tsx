import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { fetchCurrentUser, updateUserProfile } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/authStore';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ProfileBottomSheetProps = {
    profileBottomSheetRef: React.RefObject<BottomSheetModal | null>;
};

function applyUserToForm(
    setFirstName: (v: string) => void,
    setLastName: (v: string) => void,
    setEmail: (v: string) => void,
    setPhone: (v: string) => void,
    user: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string } | null
) {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phoneNumber ?? '');
}

export default function ProfileBottomSheet({ profileBottomSheetRef }: ProfileBottomSheetProps) {
    const Color = useColors();
    const { setProfileBottomSheetOpen } = useStockStore();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setUser = useAuthStore((s) => s.setUser);
    const getToken = useAuthStore((s) => s.getToken);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const loadSeq = useRef(0);
    /** onChange fires repeatedly while open (dynamic sizing, keyboard, etc.); only hydrate once per open. */
    const hydratedThisOpen = useRef(false);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.4}
            />
        ),
        []
    );
    const { isDark } = useTheme();
    const { lightImpact, mediumImpact } = useHaptics();

    const hydrateFormFromServer = useCallback(async () => {
        setSaveError(null);
        const seq = ++loadSeq.current;
        const token = getToken();
        const local = useAuthStore.getState().user;
        applyUserToForm(setFirstName, setLastName, setEmail, setPhone, local);
        if (!token) {
            return;
        }
        setLoadingProfile(true);
        try {
            const fresh = await fetchCurrentUser(token);
            if (seq !== loadSeq.current) return;
            setUser(fresh);
            applyUserToForm(setFirstName, setLastName, setEmail, setPhone, fresh);
        } catch {
            if (seq !== loadSeq.current) return;
            applyUserToForm(setFirstName, setLastName, setEmail, setPhone, local);
        } finally {
            if (seq === loadSeq.current) setLoadingProfile(false);
        }
    }, [getToken, setUser]);

    const handleSheetChange = useCallback(
        (index: number) => {
            if (index < 0) {
                hydratedThisOpen.current = false;
                return;
            }
            if (hydratedThisOpen.current) {
                return;
            }
            hydratedThisOpen.current = true;
            void hydrateFormFromServer();
        },
        [hydrateFormFromServer]
    );

    const closeModal = () => {
        hydratedThisOpen.current = false;
        setProfileBottomSheetOpen(false);
    };

    const handleSave = async () => {
        setSaveError(null);
        const token = getToken();
        if (!isAuthenticated || !token) {
            setSaveError('Sign in to update your profile.');
            return;
        }
        setSaving(true);
        try {
            await updateUserProfile({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phone.trim(),
            });
            const fresh = await fetchCurrentUser(token);
            setUser(fresh);
            applyUserToForm(setFirstName, setLastName, setEmail, setPhone, fresh);
            mediumImpact();
            closeModal();
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Could not save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BottomSheetModal
            ref={profileBottomSheetRef}
            onDismiss={closeModal}
            onChange={handleSheetChange}
            stackBehavior="push"
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: Color.baseText }]}>Profile</Text>
                    <Text style={[styles.subtitle, { color: Color.subText }]}>Update your info</Text>
                </View>

                {loadingProfile ? (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator color={Color.green} />
                        <Text style={[styles.loadingText, { color: Color.subText, marginLeft: 10 }]}>
                            Loading profile…
                        </Text>
                    </View>
                ) : null}

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Color.baseText }]}>First name</Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#242428' : '#F3F4F6',
                                    color: Color.baseText,
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                },
                            ]}
                            placeholder="First name"
                            placeholderTextColor={Color.subText}
                            value={firstName}
                            onChangeText={setFirstName}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Color.baseText }]}>Last name</Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#242428' : '#F3F4F6',
                                    color: Color.baseText,
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                },
                            ]}
                            placeholder="Last name"
                            placeholderTextColor={Color.subText}
                            value={lastName}
                            onChangeText={setLastName}
                            editable={!saving}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Color.baseText }]}>Email</Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#1E1E22' : '#ECEFF3',
                                    color: Color.subText,
                                    borderColor: isDark ? '#3D3D44' : '#D1D5DB',
                                },
                            ]}
                            placeholder="Not on file"
                            placeholderTextColor={Color.subText}
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false}
                            selectTextOnFocus={false}
                        />
                        <Text style={[styles.fieldHint, { color: Color.subText }]}>
                            Email is tied to how you signed in and can{"'"}t be changed here.
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: Color.baseText }]}>Phone number</Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#242428' : '#F3F4F6',
                                    color: Color.baseText,
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                },
                            ]}
                            placeholder="Phone number"
                            placeholderTextColor={Color.subText}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            editable={!saving}
                        />
                    </View>
                </View>

                {saveError ? (
                    <Text style={[styles.errorText, { color: Color.red }]}>{saveError}</Text>
                ) : null}

                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: Color.green },
                            (saving || !isAuthenticated) && styles.saveButtonDisabled,
                        ]}
                        onPress={() => {
                            lightImpact();
                            void handleSave();
                        }}
                        disabled={saving || !isAuthenticated}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save changes</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 14,
    },
    formContainer: {
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    fieldHint: {
        fontSize: 13,
        marginTop: 6,
        lineHeight: 18,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 12,
        textAlign: 'center',
    },
    saveButtonContainer: {
        marginBottom: 20,
    },
    saveButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 30,
    },
});

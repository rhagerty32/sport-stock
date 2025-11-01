import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

type ProfileBottomSheetProps = {
    profileBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function ProfileBottomSheet({ profileBottomSheetRef }: ProfileBottomSheetProps) {
    const { setProfileBottomSheetOpen } = useStockStore();
    const { isPublicAccount, setIsPublicAccount } = useSettingsStore();
    const [firstName, setFirstName] = useState('John');
    const [lastName, setLastName] = useState('Doe');
    const [email, setEmail] = useState('john.doe@example.com');
    const [phone, setPhone] = useState('(555) 123-4567');

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
    const { lightImpact } = useHaptics();

    const handlePublicToggle = (value: boolean) => {
        setIsPublicAccount(value);
        lightImpact();
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving profile:', { firstName, lastName, email, phone });
        lightImpact();
        closeModal();
    };

    const closeModal = () => {
        setProfileBottomSheetOpen(false);
    };

    return (
        <BottomSheetModal
            ref={profileBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior='push'
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}
        >
            <BottomSheetView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Personal Information
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                        Update your profile details
                    </Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            First Name
                        </Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="Enter first name"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Last Name
                        </Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="Enter last name"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Email
                        </Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="Enter email address"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                            Phone Number
                        </Text>
                        <BottomSheetTextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: isDark ? '#FFFFFF' : '#000000',
                                    borderColor: isDark ? '#4B5563' : '#D1D5DB',
                                }
                            ]}
                            placeholder="Enter phone number"
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Public Account Toggle */}
                    <View style={styles.inputGroup}>
                        <View style={styles.switchContainer}>
                            <View style={styles.switchLabelContainer}>
                                <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Public Account
                                </Text>
                                <Text style={[styles.switchDescription, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    Allow others to view your profile and portfolio
                                </Text>
                            </View>
                            <Switch
                                value={isPublicAccount}
                                onValueChange={handlePublicToggle}
                                {...(Platform.OS === 'ios' ? {
                                    trackColor: { false: isDark ? '#3A3A3C' : '#E5E7EB', true: '#217C0A' },
                                    thumbColor: '#FFFFFF',
                                } : {
                                    trackColor: { false: '#767577', true: '#217C0A' },
                                    thumbColor: isPublicAccount ? '#FFFFFF' : '#f4f3f4',
                                })}
                            />
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: '#10B981' }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Spacing */}
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
    formContainer: {
        marginBottom: 30,
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
    saveButtonContainer: {
        marginBottom: 20,
    },
    saveButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 30,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchLabelContainer: {
        flex: 1,
        marginRight: 12,
    },
    switchDescription: {
        fontSize: 13,
        fontWeight: '400',
        marginTop: 4,
        lineHeight: 18,
    },
});
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type LightDarkBottomSheetProps = {
    lightDarkBottomSheetRef: React.RefObject<BottomSheetModal>;
};

type ThemeOption = 'light' | 'dark' | 'system';

export default function LightDarkBottomSheet({ lightDarkBottomSheetRef }: LightDarkBottomSheetProps) {
    const { setLightDarkBottomSheetOpen } = useStockStore();
    const { theme, setTheme } = useSettingsStore();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();

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

    const themeOptions: { value: ThemeOption; label: string; icon: string; description: string }[] = [
        {
            value: 'light',
            label: 'Light',
            icon: 'sunny',
            description: 'Always use light mode'
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: 'moon',
            description: 'Always use dark mode'
        },
        {
            value: 'system',
            label: 'System',
            icon: 'phone-portrait',
            description: 'Follow device settings'
        }
    ];

    const handleThemeSelect = (selectedTheme: ThemeOption) => {
        setTheme(selectedTheme);
        lightImpact();
    };

    const closeModal = () => {
        setLightDarkBottomSheetOpen(false);
    };

    return (
        <BottomSheetModal
            ref={lightDarkBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior='push'
            enableDynamicSizing={true}
            enablePanDownToClose={true}
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag={true}
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
        >
            <BottomSheetView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        Appearance
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        Choose your preferred theme
                    </Text>
                </View>

                {/* Tab List */}
                <View style={[styles.tabsList, { backgroundColor: isDark ? '#242428' : '#F3F4F6' }]}>
                    {themeOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.tabTrigger,
                                theme === option.value && {
                                    backgroundColor: isDark ? '#1A1D21' : '#FFFFFF',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 2,
                                    elevation: 2,
                                }
                            ]}
                            onPress={() => handleThemeSelect(option.value)}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={20}
                                color={theme === option.value
                                    ? (isDark ? '#FFFFFF' : '#000000')
                                    : (isDark ? '#9CA3AF' : '#6B7280')
                                }
                            />
                            <Text style={[
                                styles.tabTriggerText,
                                {
                                    color: theme === option.value
                                        ? (isDark ? '#FFFFFF' : '#000000')
                                        : (isDark ? '#9CA3AF' : '#6B7280')
                                }
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {theme === 'light' && (
                        <View style={[styles.contentCard, { backgroundColor: isDark ? '#242428' : '#F9FAFB' }]}>
                            <View style={styles.contentHeader}>
                                <Ionicons name="sunny" size={24} color="#F59E0B" />
                                <Text style={[styles.contentTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Light Mode
                                </Text>
                            </View>
                            <Text style={[styles.contentDescription, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                                Always use light mode regardless of your device settings. Perfect for bright environments or personal preference.
                            </Text>
                            <View style={styles.previewContainer}>
                                <View style={[styles.previewCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                                    <View style={styles.previewHeader}>
                                        <View style={[styles.previewDot, { backgroundColor: '#EF4444' }]} />
                                        <View style={[styles.previewDot, { backgroundColor: '#F59E0B' }]} />
                                        <View style={[styles.previewDot, { backgroundColor: '#10B981' }]} />
                                    </View>
                                    <View style={styles.previewContent}>
                                        <View style={[styles.previewLine, { backgroundColor: '#F3F4F6', width: '80%' }]} />
                                        <View style={[styles.previewLine, { backgroundColor: '#F3F4F6', width: '60%' }]} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {theme === 'dark' && (
                        <View style={[styles.contentCard, { backgroundColor: isDark ? '#242428' : '#F9FAFB' }]}>
                            <View style={styles.contentHeader}>
                                <Ionicons name="moon" size={24} color="#8B5CF6" />
                                <Text style={[styles.contentTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    Dark Mode
                                </Text>
                            </View>
                            <Text style={[styles.contentDescription, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                                Always use dark mode regardless of your device settings. Great for low-light environments and reducing eye strain.
                            </Text>
                            <View style={styles.previewContainer}>
                                <View style={[styles.previewCard, { backgroundColor: '#1A1D21', borderColor: '#242428' }]}>
                                    <View style={styles.previewHeader}>
                                        <View style={[styles.previewDot, { backgroundColor: '#EF4444' }]} />
                                        <View style={[styles.previewDot, { backgroundColor: '#F59E0B' }]} />
                                        <View style={[styles.previewDot, { backgroundColor: '#10B981' }]} />
                                    </View>
                                    <View style={styles.previewContent}>
                                        <View style={[styles.previewLine, { backgroundColor: '#242428', width: '80%' }]} />
                                        <View style={[styles.previewLine, { backgroundColor: '#242428', width: '60%' }]} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {theme === 'system' && (
                        <View style={[styles.contentCard, { backgroundColor: isDark ? '#242428' : '#F9FAFB' }]}>
                            <View style={styles.contentHeader}>
                                <Ionicons name="phone-portrait" size={24} color="#6B7280" />
                                <Text style={[styles.contentTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                                    System
                                </Text>
                            </View>
                            <Text style={[styles.contentDescription, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                                Automatically switch between light and dark mode based on your device settings. Changes with your system theme.
                            </Text>
                            <View style={styles.previewContainer}>
                                <View style={styles.systemPreview}>
                                    <View style={[styles.previewCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
                                        <View style={styles.previewHeader}>
                                            <View style={[styles.previewDot, { backgroundColor: '#EF4444' }]} />
                                            <View style={[styles.previewDot, { backgroundColor: '#F59E0B' }]} />
                                            <View style={[styles.previewDot, { backgroundColor: '#10B981' }]} />
                                        </View>
                                        <View style={styles.previewContent}>
                                            <View style={[styles.previewLine, { backgroundColor: '#F3F4F6', width: '80%' }]} />
                                            <View style={[styles.previewLine, { backgroundColor: '#F3F4F6', width: '60%' }]} />
                                        </View>
                                    </View>
                                    <View style={[styles.previewCard, { backgroundColor: '#1A1D21', borderColor: '#242428' }]}>
                                        <View style={styles.previewHeader}>
                                            <View style={[styles.previewDot, { backgroundColor: '#EF4444' }]} />
                                            <View style={[styles.previewDot, { backgroundColor: '#F59E0B' }]} />
                                            <View style={[styles.previewDot, { backgroundColor: '#10B981' }]} />
                                        </View>
                                        <View style={styles.previewContent}>
                                            <View style={[styles.previewLine, { backgroundColor: '#242428', width: '80%' }]} />
                                            <View style={[styles.previewLine, { backgroundColor: '#242428', width: '60%' }]} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
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
    tabsList: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    tabTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    tabTriggerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabContent: {
        marginBottom: 20,
    },
    contentCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    contentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    contentTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    contentDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    previewContainer: {
        alignItems: 'center',
    },
    systemPreview: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    previewCard: {
        width: 120,
        height: 80,
        borderRadius: 8,
        borderWidth: 1,
        padding: 8,
    },
    previewHeader: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
    },
    previewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    previewContent: {
        gap: 4,
    },
    previewLine: {
        height: 4,
        borderRadius: 2,
    },
    bottomSpacing: {
        height: 30,
    },
});
import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabsLayout() {
    const Color = useColors();
    const { isDark } = useTheme();

    const tintColor = Platform.select({
        ios: DynamicColorIOS({ dark: Color.green, light: Color.green }),
        default: Color.green,
    });
    const labelColor = Platform.select({
        ios: DynamicColorIOS({ dark: '#ccc', light: Color.black }),
        default: isDark ? '#ccc' : Color.black,
    });

    return (
        <NativeTabs
            tintColor={tintColor}
            labelStyle={{ color: labelColor }}
        >
            <NativeTabs.Trigger name="index">
                <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }}
                    md="candlestick_chart"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="search">
                <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
                    md="search"
                />
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
                <NativeTabs.Trigger.Icon
                    sf={{ default: 'person', selected: 'person.fill' }}
                    md="person"
                />
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}

import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS } from 'react-native';

export default function TabsLayout() {
    const Color = useColors();
    const { isDark } = useTheme();

    return (
        <NativeTabs
            tintColor={DynamicColorIOS({ dark: Color.green, light: Color.green })}
            labelStyle={{
                color: DynamicColorIOS({ dark: isDark ? '#ccc' : Color.black, light: isDark ? '#ccc' : Color.black }),
            }}
        >
            <NativeTabs.Trigger name="index">
                <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
                <Label>Home</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="search">
                <Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} />
                <Label>Search</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Icon sf={{ default: 'person', selected: 'person.fill' }} />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}

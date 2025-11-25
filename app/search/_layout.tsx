import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { useTheme } from '@/hooks/use-theme';
import { Stack } from 'expo-router';
import { Text } from 'react-native';

function SearchLayoutContent() {
    const { setSearchQuery } = useSearch();
    const { isDark } = useTheme();

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Search',
                    headerShown: true,
                    headerStyle: { backgroundColor: isDark ? '#0B0F13' : '#FFFFFF' },
                    // Instead of relying on headerTitleAlign (not always respected on all platforms), 
                    // make the title left-aligned manually by using a custom headerTitle component
                    headerTitle: () => (
                        <Text style={{
                            fontSize: 28,
                            fontWeight: 'bold',
                            textAlign: 'left',
                            width: '100%',
                            alignSelf: 'flex-start',
                            color: isDark ? '#FFFFFF' : '#000000'
                        }}
                        >
                            Search
                        </Text>
                    ),
                    headerSearchBarOptions: {
                        placement: 'automatic',
                        placeholder: 'Search teams...',
                        onChangeText: (event) => {
                            setSearchQuery(event.nativeEvent.text);
                        },
                    },
                }}
            />
        </Stack>
    );
}

export default function SearchLayout() {
    return (
        <SearchProvider>
            <SearchLayoutContent />
        </SearchProvider>
    );
}

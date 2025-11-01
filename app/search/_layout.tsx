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
                    headerStyle: { backgroundColor: 'transparent' },
                    // Instead of relying on headerTitleAlign (not always respected on all platforms), 
                    // make the title left-aligned manually by using a custom headerTitle component
                    headerTitle: () => (
                        <Text style={{
                            fontSize: 28,
                            fontWeight: 'bold',
                            textAlign: 'left',
                            width: '100%',
                            alignSelf: 'flex-start'
                        }}
                        >
                            Search
                        </Text>
                    ),
                    headerSearchBarOptions: {
                        placement: 'automatic',
                        placeholder: 'Search teams, leagues, users...',
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

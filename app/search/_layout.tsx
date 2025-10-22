import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { Stack } from 'expo-router';

function SearchLayoutContent() {
    const { setSearchQuery } = useSearch();

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Search',
                    headerShown: false,
                    headerSearchBarOptions: {
                        placement: 'automatic',
                        placeholder: 'Search teams, leagues...',
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

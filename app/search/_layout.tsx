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
                    // Show the header to display the search bar
                    headerShown: true,
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

import { SearchProvider } from '@/contexts/SearchContext';
import { Slot } from 'expo-router';

/**
 * Same flat hierarchy as home (index) - just SearchProvider + Slot.
 * No nested Stack, so search is in the same view hierarchy as home/profile.
 */
export default function SearchLayout() {
    return (
        <SearchProvider>
            <Slot />
        </SearchProvider>
    );
}

import { Stack } from 'expo-router';

export default function StockLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Stock Details',
                    headerShown: false, // We'll handle our own header with team theming
                    presentation: 'modal', // Present as modal for better UX
                }}
            />
        </Stack>
    );
}

import { getLocationInfo, LocationInfo } from '@/lib/location-service';
import { useEffect, useState } from 'react';

export function useLocation() {
    const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchLocation() {
            try {
                setLoading(true);
                setError(null);
                const info = await getLocationInfo();

                if (mounted) {
                    setLocationInfo(info);
                    if (info.error) {
                        setError(info.error);
                    }
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to get location');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchLocation();

        return () => {
            mounted = false;
        };
    }, []);

    return { locationInfo, loading, error };
}

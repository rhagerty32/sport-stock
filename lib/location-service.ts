// Location Service using Expo Location and Mapbox Geocoding API
// This service handles getting user location and reverse geocoding to get state information

import * as Location from 'expo-location';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export interface LocationInfo {
    ipAddress: string | null;
    coordinates: {
        longitude: number;
        latitude: number;
    } | null;
    state: string | null;
    city: string | null;
    country: string | null;
    error?: string;
}

/**
 * Get device location using Expo Location (GPS)
 * Falls back to IP geolocation if permissions are denied
 */
async function getDeviceLocation(): Promise<{ longitude: number; latitude: number } | null> {
    try {
        // Check if location services are enabled
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) return null;

        // Request foreground location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') return null;

        // Get current position with balanced accuracy (good balance of speed and accuracy)
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        if (__DEV__) console.error('Error getting device location:', error);
        return null;
    }
}

/**
 * Get approximate location from IP address as fallback
 * Only used if device location is unavailable
 */
async function getIPAddress(): Promise<string | null> {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || null;
    } catch (error) {
        if (__DEV__) console.error('Error fetching IP address:', error);
        return null;
    }
}

/**
 * Get location from IP as fallback (simplified - only tries ip-api.com)
 */
async function getLocationFromIP(ip: string): Promise<{ longitude: number; latitude: number } | null> {
    try {
        // Try ip-api.com without IP parameter (uses requester's IP)
        const response = await fetch('https://ip-api.com/json/?fields=status,lat,lon', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (data.status === 'success' && data.lat && data.lon) {
            if (__DEV__) console.log('IP geolocation successful (fallback)');
            return { latitude: data.lat, longitude: data.lon };
        }
    } catch (error) {
        if (__DEV__) console.log('IP geolocation fallback failed:', error);
    }

    return null;
}

/**
 * Use Mapbox Reverse Geocoding API to get state and location details from coordinates
 */
async function reverseGeocode(
    longitude: number,
    latitude: number
): Promise<{ state: string | null; city: string | null; country: string | null }> {
    if (!MAPBOX_ACCESS_TOKEN) {
        console.warn('Mapbox access token not configured. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env file');
        return { state: null, city: null, country: null };
    }

    try {
        // For reverse geocoding, we can't use limit with multiple types
        // The API returns one feature per type by default, which is what we want
        const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&types=region,place,country&access_token=${MAPBOX_ACCESS_TOKEN}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Mapbox API error ${response.status}:`, errorText);
            throw new Error(`Mapbox API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            return { state: null, city: null, country: null };
        }

        let state: string | null = null;
        let city: string | null = null;
        let country: string | null = null;

        // Extract state, city, and country from features
        for (const feature of data.features) {
            const featureType = feature.properties?.feature_type;

            if (featureType === 'region' && !state) {
                state = feature.properties?.name || null;
            } else if (featureType === 'place' && !city) {
                city = feature.properties?.name || null;
            } else if (featureType === 'country' && !country) {
                country = feature.properties?.name || null;
            }
        }

        // If we didn't find state in features, check context
        if (!state && data.features[0]?.properties?.context) {
            const context = data.features[0].properties.context;
            state = context.region?.name || null;
            city = context.place?.name || city || null;
            country = context.country?.name || country || null;
        }

        return { state, city, country };
    } catch (error) {
        console.error('Error reverse geocoding with Mapbox:', error);
        return { state: null, city: null, country: null };
    }
}

/**
 * Get complete location information using device GPS (with IP fallback)
 */
export async function getLocationInfo(): Promise<LocationInfo> {
    try {
        // Step 1: Try to get device location (GPS) - most accurate
        let coordinates = await getDeviceLocation();
        let ipAddress: string | null = null;

        // Step 2: If device location fails, fall back to IP geolocation
        if (!coordinates) {
            if (__DEV__) {
                console.log('Device location unavailable, falling back to IP geolocation');
            }

            ipAddress = await getIPAddress();

            if (ipAddress) {
                coordinates = await getLocationFromIP(ipAddress);
            }
        }

        if (!coordinates) {
            return {
                ipAddress: ipAddress || null,
                coordinates: null,
                state: null,
                city: null,
                country: null,
                error: 'Could not determine location. Please enable location services or check your connection.',
            };
        }

        // Step 3: Use Mapbox to reverse geocode and get state
        const { state, city, country } = await reverseGeocode(
            coordinates.longitude,
            coordinates.latitude
        );

        return {
            ipAddress: ipAddress || null,
            coordinates,
            state,
            city,
            country,
        };
    } catch (error) {
        console.error('Error getting location info:', error);
        return {
            ipAddress: null,
            coordinates: null,
            state: null,
            city: null,
            country: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

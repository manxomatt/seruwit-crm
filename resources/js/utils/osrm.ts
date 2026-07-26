import type { LatLng } from '@/utils/geo';

/**
 * Ask our Laravel OSRM proxy for a driving geometry through the waypoints.
 * Returns an empty array on failure so callers can fall back to a straight line.
 */
export async function fetchDrivingRoute(waypoints: LatLng[], directionsUrl: string): Promise<LatLng[]> {
    if (waypoints.length < 2 || !directionsUrl) {
        return [];
    }

    const points = waypoints.map(([lat, lng]) => `${lat},${lng}`).join('|');
    const url = `${directionsUrl}?points=${encodeURIComponent(points)}`;

    const response = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        return [];
    }

    const payload = (await response.json()) as {
        coordinates?: LatLng[];
        following_roads?: boolean;
    };

    if (!payload.coordinates || payload.coordinates.length < 2) {
        return [];
    }

    return payload.coordinates;
}

export function waypointsKey(waypoints: LatLng[]): string {
    return waypoints.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|');
}

/**
 * Formatting for GPS values. Lives here beside the money helper for the same
 * reason: Tracking (Foundation), Fleet (Foundation) and Transportation
 * (Vertical) all render these, and a Vertical reaching sideways into a
 * Foundation module's helper — or keeping its own copy — is worse than either
 * owning it in core.
 */

export type LatLng = [number, number];

/** Decimal columns arrive from Laravel as strings, so values are coerced. */
export function toLatLng(lat: string | number | null, lng: string | number | null): LatLng | null {
    if (lat === null || lng === null) {
        return null;
    }

    const parsed: LatLng = [Number(lat), Number(lng)];

    return Number.isFinite(parsed[0]) && Number.isFinite(parsed[1]) ? parsed : null;
}

export function formatDistanceKm(km: string | number | null | undefined): string {
    const value = Number(km ?? 0);

    return `${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`;
}

export function formatSpeedKph(kph: string | number | null | undefined): string {
    const value = Number(kph ?? 0);

    return `${value.toLocaleString('id-ID', { maximumFractionDigits: 0 })} km/jam`;
}

export function formatCoordinate(lat: string | number, lng: string | number): string {
    return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

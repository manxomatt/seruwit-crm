import L from 'leaflet';
import { Marker, useMapEvents } from 'react-leaflet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LeafletMap from '@/Components/Map/LeafletMap';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import type { LatLng } from '@/utils/geo';
import { toLatLng } from '@/utils/geo';

interface Props {
    latitude: string;
    longitude: string;
    onChange: (next: { latitude: string; longitude: string; address?: string }) => void;
    height?: string;
    /** When true, reverse-geocode fills the address field after each pick. */
    resolveAddress?: boolean;
}

function formatCoord(value: number): string {
    return value.toFixed(7);
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }): null {
    useMapEvents({
        click(event) {
            onPick(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

/**
 * Click/drag a Leaflet pin to set coordinates. Optionally reverse-geocodes
 * the pin through the global Nominatim proxy and returns an address.
 */
export default function LocationMapPicker({
    latitude,
    longitude,
    onChange,
    height = '320px',
    resolveAddress = true,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);
    const didAskGeo = useRef(false);

    const position = useMemo(() => toLatLng(latitude || null, longitude || null), [latitude, longitude]);
    const center: LatLng = position ?? [-5.3971, 105.2668];

    const reverseGeocode = useCallback(
        async (lat: number, lng: number) => {
            if (!resolveAddress) {
                onChange({ latitude: formatCoord(lat), longitude: formatCoord(lng) });
                return;
            }

            const id = ++requestId.current;
            setResolving(true);
            setError(null);
            onChange({ latitude: formatCoord(lat), longitude: formatCoord(lng) });

            try {
                const url = `${prefixedRoute('geocode.reverse')}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
                const response = await fetch(url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                const payload = await response.json();

                if (id !== requestId.current) {
                    return;
                }

                if (!response.ok) {
                    setError(payload.message || t('common.geocode.failed'));
                    return;
                }

                onChange({
                    latitude: formatCoord(lat),
                    longitude: formatCoord(lng),
                    address: payload.address as string,
                });
            } catch {
                if (id === requestId.current) {
                    setError(t('common.geocode.failed'));
                }
            } finally {
                if (id === requestId.current) {
                    setResolving(false);
                }
            }
        },
        [onChange, prefixedRoute, resolveAddress, t],
    );

    const pick = useCallback(
        (lat: number, lng: number) => {
            void reverseGeocode(lat, lng);
        },
        [reverseGeocode],
    );

    useEffect(() => {
        if (didAskGeo.current || position !== null || !navigator.geolocation) {
            return;
        }

        didAskGeo.current = true;
        navigator.geolocation.getCurrentPosition(
            (geo) => {
                pick(geo.coords.latitude, geo.coords.longitude);
            },
            () => {
                // Keep the default center; user can click the map.
            },
            { enableHighAccuracy: false, timeout: 5000 },
        );
    }, [pick, position]);

    return (
        <div className="space-y-2">
            <LeafletMap center={center} zoom={position ? 16 : 12} height={height} bounds={position ? [position] : undefined}>
                <MapClickHandler onPick={pick} />
                {position && (
                    <Marker
                        position={position}
                        draggable
                        eventHandlers={{
                            dragend: (event) => {
                                const marker = event.target as L.Marker;
                                const latLng = marker.getLatLng();
                                pick(latLng.lat, latLng.lng);
                            },
                        }}
                    />
                )}
            </LeafletMap>
            <p className="text-xs text-gray-500">
                {resolving ? t('common.geocode.map_resolving') : t('common.geocode.map_hint')}
            </p>
            {error && <p className="text-xs text-amber-700">{error}</p>}
        </div>
    );
}

import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import type { LatLng } from '@/utils/geo';
import { fetchDrivingRoute, waypointsKey } from '@/utils/osrm';

interface Stop {
    position: LatLng;
    label: string;
    sequence: number;
    /** pending | arrived | completed */
    status: string;
}

interface Props {
    trail: LatLng[];
    stops?: Stop[];
    colour?: string;
    plannedColour?: string;
}

const STOP_TONES: Record<string, string> = {
    pending: '#6b7280',
    arrived: '#2563eb',
    completed: '#16a34a',
};

function numberedIcon(sequence: number, status: string): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
        html: `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:${STOP_TONES[status] ?? STOP_TONES.pending};color:#fff;font-size:11px;font-weight:600;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)">${sequence}</span>`,
    });
}

/**
 * Planned stop sequence (road-following via server-side OSRM proxy) + GPS trail.
 */
export default function RouteTrail({
    trail,
    stops = [],
    colour = '#4f46e5',
    plannedColour = '#4f46e5',
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const directionsUrl = prefixedRoute('transportation.directions');

    const orderedStops = useMemo(
        () => [...stops].sort((a, b) => a.sequence - b.sequence),
        [stops],
    );

    const waypoints = useMemo(
        () => orderedStops.map((stop) => stop.position),
        [orderedStops],
    );

    const [roadPath, setRoadPath] = useState<LatLng[]>(waypoints);
    const [followingRoads, setFollowingRoads] = useState(false);

    useEffect(() => {
        if (waypoints.length < 2) {
            setRoadPath([]);
            setFollowingRoads(false);

            return;
        }

        setRoadPath(waypoints);
        setFollowingRoads(false);

        let cancelled = false;
        const key = waypointsKey(waypoints);

        void fetchDrivingRoute(waypoints, directionsUrl).then((path) => {
            if (cancelled || waypointsKey(waypoints) !== key) {
                return;
            }

            if (path.length > 1) {
                setRoadPath(path);
                setFollowingRoads(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [waypoints, directionsUrl]);

    const endpoints = useMemo(
        () => (trail.length > 1 ? { start: trail[0], end: trail[trail.length - 1] } : null),
        [trail],
    );

    return (
        <>
            {roadPath.length > 1 && (
                <Polyline
                    positions={roadPath}
                    pathOptions={{
                        color: plannedColour,
                        weight: 5,
                        opacity: 0.85,
                        dashArray: followingRoads ? undefined : '10 8',
                    }}
                />
            )}

            {trail.length > 1 && (
                <Polyline positions={trail} pathOptions={{ color: colour, weight: 4, opacity: 0.8 }} />
            )}

            {endpoints && (
                <>
                    <Marker position={endpoints.start}>
                        <Tooltip>Awal jejak</Tooltip>
                    </Marker>
                    <Marker position={endpoints.end}>
                        <Tooltip>Posisi terakhir</Tooltip>
                    </Marker>
                </>
            )}

            {orderedStops.map((stop) => (
                <Marker
                    key={`${stop.sequence}-${stop.label}`}
                    position={stop.position}
                    icon={numberedIcon(stop.sequence, stop.status)}
                >
                    <Popup>
                        <span className="font-medium">{stop.label}</span>
                        <br />
                        <span className="capitalize">{stop.status}</span>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}

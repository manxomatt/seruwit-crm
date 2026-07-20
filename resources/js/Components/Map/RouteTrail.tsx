import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import type { LatLng } from '@/utils/geo';

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
 * The path a trip actually took, drawn from its GPS checkpoints, with its
 * planned stops on top.
 */
export default function RouteTrail({ trail, stops = [], colour = '#4f46e5' }: Props): JSX.Element {
    const endpoints = useMemo(
        () => (trail.length > 1 ? { start: trail[0], end: trail[trail.length - 1] } : null),
        [trail],
    );

    return (
        <>
            {trail.length > 1 && <Polyline positions={trail} pathOptions={{ color: colour, weight: 4, opacity: 0.75 }} />}

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

            {stops.map((stop) => (
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

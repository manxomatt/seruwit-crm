import L from 'leaflet';
import { ReactNode, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { LatLng } from '@/utils/geo';

interface Props {
    position: LatLng;
    label: string;
    /** Drives the marker colour: green moving, amber idle, grey stale. */
    tone?: 'moving' | 'idle' | 'stale';
    children?: ReactNode;
}

const TONES: Record<string, string> = {
    moving: '#16a34a',
    idle: '#d97706',
    stale: '#6b7280',
};

/**
 * A vehicle's current position. A divIcon rather than an image so the state is
 * readable at a glance without shipping three more PNGs.
 */
export default function VehicleMarker({ position, label, tone = 'idle', children }: Props): JSX.Element {
    const icon = useMemo(
        () =>
            L.divIcon({
                className: '',
                iconSize: [18, 18],
                iconAnchor: [9, 9],
                popupAnchor: [0, -12],
                html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${TONES[tone]};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
            }),
        [tone],
    );

    return (
        <Marker position={position} icon={icon}>
            <Popup>
                <span className="font-medium">{label}</span>
                {children}
            </Popup>
        </Marker>
    );
}

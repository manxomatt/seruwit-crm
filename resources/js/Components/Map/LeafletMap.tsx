import L from 'leaflet';
import { ReactNode, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { LatLng } from '@/utils/geo';

// Leaflet resolves its default marker images relative to its own stylesheet.
// Vite fingerprints and relocates assets, so those requests 404 and every
// marker renders invisible — the map looks fine, the pins are simply gone.
// Importing the images lets Vite rewrite them to hashed URLs.
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// OpenStreetMap's own tiles, which need no key. The template is kept in this
// one place so it can be pointed at a self-hosted tile server later — the OSM
// Foundation's usage policy discourages heavy commercial use.
const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface Props {
    center?: LatLng;
    zoom?: number;
    /** Points the view should frame; overrides center/zoom when given. */
    bounds?: LatLng[];
    height?: string;
    tileUrl?: string;
    children?: ReactNode;
}

/**
 * Keeps the viewport framed on the given points. A child component because
 * useMap() only works inside MapContainer.
 */
function FitBounds({ bounds }: { bounds?: LatLng[] }): null {
    const map = useMap();

    useEffect(() => {
        if (!bounds || bounds.length === 0) {
            return;
        }

        if (bounds.length === 1) {
            map.setView(bounds[0], Math.max(map.getZoom(), 15));
            return;
        }

        map.fitBounds(L.latLngBounds(bounds), { padding: [32, 32] });
    }, [map, bounds]);

    return null;
}

export default function LeafletMap({
    center = [-6.2, 106.816],
    zoom = 11,
    bounds,
    height = '420px',
    tileUrl = OSM_TILES,
    children,
}: Props): JSX.Element {
    return (
        <div style={{ height }} className="overflow-hidden rounded-lg">
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url={tileUrl} attribution={OSM_ATTRIBUTION} maxZoom={18} />
                <FitBounds bounds={bounds} />
                {children}
            </MapContainer>
        </div>
    );
}

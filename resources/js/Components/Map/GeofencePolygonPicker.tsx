import L from 'leaflet';
import { useCallback, useMemo } from 'react';
import { Marker, Polygon, Polyline, useMapEvents } from 'react-leaflet';
import LeafletMap from '@/Components/Map/LeafletMap';

interface Props {
    coordinates: [number, number][];
    onChange: (coords: [number, number][]) => void;
    height?: string;
    center?: [number, number];
    disabled?: boolean;
}

function MapClickHandler({ onAddPoint, disabled }: { onAddPoint: (lat: number, lng: number) => void; disabled?: boolean }): null {
    useMapEvents({
        click(event) {
            if (disabled) return;
            onAddPoint(Number(event.latlng.lat.toFixed(7)), Number(event.latlng.lng.toFixed(7)));
        },
    });

    return null;
}

const createPointIcon = (index: number) => {
    return L.divIcon({
        className: 'geofence-point-marker',
        html: `<div style="background-color: #0d9488; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
    });
};

export default function GeofencePolygonPicker({
    coordinates,
    onChange,
    height = '424px',
    center = [-6.2, 106.816],
    disabled = false,
}: Props): JSX.Element {
    const handleAddPoint = useCallback(
        (lat: number, lng: number) => {
            onChange([...coordinates, [lat, lng]]);
        },
        [coordinates, onChange],
    );

    const handleUndo = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (coordinates.length > 0) {
            onChange(coordinates.slice(0, -1));
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange([]);
    };

    const handleDragPoint = (index: number, newLat: number, newLng: number) => {
        const next = [...coordinates];
        next[index] = [Number(newLat.toFixed(7)), Number(newLng.toFixed(7))];
        onChange(next);
    };

    const bounds = useMemo(() => {
        if (coordinates.length === 0) return undefined;
        return coordinates;
    }, [coordinates]);

    const initialCenter = coordinates.length > 0 ? coordinates[0] : center;

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold ${
                        coordinates.length >= 3
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                    }`}>
                        <span className={`h-2 w-2 rounded-full ${coordinates.length >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {coordinates.length} Titik Sudut
                        {coordinates.length >= 3 ? ' (Poligon Terbentuk)' : ' (Min. 3 titik)'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={coordinates.length === 0 || disabled}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                    >
                        ↩ Hapus Titik Terakhir
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={coordinates.length === 0 || disabled}
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 transition"
                    >
                        🗑 Reset Poligon
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <LeafletMap center={initialCenter} zoom={13} height={height} bounds={bounds}>
                <MapClickHandler onAddPoint={handleAddPoint} disabled={disabled} />

                {/* Render Polygon if 3 or more points */}
                {coordinates.length >= 3 && (
                    <Polygon
                        positions={coordinates}
                        pathOptions={{
                            color: '#0d9488',
                            fillColor: '#14b8a6',
                            fillOpacity: 0.35,
                            weight: 3,
                        }}
                    />
                )}

                {/* Render Line if 2 points */}
                {coordinates.length === 2 && (
                    <Polyline
                        positions={coordinates}
                        pathOptions={{
                            color: '#0d9488',
                            dashArray: '6, 6',
                            weight: 3,
                        }}
                    />
                )}

                {/* Draggable Markers for each point */}
                {coordinates.map((point, index) => (
                    <Marker
                        key={`${index}-${point[0]}-${point[1]}`}
                        position={point}
                        icon={createPointIcon(index)}
                        draggable={!disabled}
                        eventHandlers={{
                            dragend: (e) => {
                                const latLng = e.target.getLatLng();
                                handleDragPoint(index, latLng.lat, latLng.lng);
                            },
                        }}
                    />
                ))}
            </LeafletMap>

            <p className="text-xs text-slate-500">
                💡 <strong>Cara Menggambar:</strong> Klik di peta untuk membuat titik sudut zona poligon. Titik dapat digeser (drag) untuk menyesuaikan batas area.
            </p>
        </div>
    );
}

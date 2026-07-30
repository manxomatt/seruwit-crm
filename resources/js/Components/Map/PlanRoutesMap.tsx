import L from 'leaflet';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import LeafletMap from '@/Components/Map/LeafletMap';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import type { LatLng } from '@/utils/geo';
import { toLatLng } from '@/utils/geo';
import { fetchDrivingRoute, waypointsKey } from '@/utils/osrm';

export interface PlanMapStop {
    id: number;
    sequence: number;
    address: string;
    lat: string | number;
    lng: string | number;
    label?: string;
}

export interface PlanMapRoute {
    id: number;
    sequence: number;
    vehicleLabel?: string;
    stops: PlanMapStop[];
}

interface Props {
    depot: { lat: string | number; lng: string | number; address?: string | null };
    routes: PlanMapRoute[];
    height?: string;
    /** Override OSRM proxy URL (default: routing.directions). */
    directionsUrl?: string;
}

const ROUTE_COLOURS = ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c8', '#7c3aed'];

function depotIcon(): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:#111827;color:#fff;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)">D</span>`,
    });
}

function stopIcon(sequence: number, colour: string): L.DivIcon {
    return L.divIcon({
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:9999px;background:${colour};color:#fff;font-size:11px;font-weight:600;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)">${sequence}</span>`,
    });
}

function RoadRoute({
    waypoints,
    colour,
    directionsUrl,
}: {
    waypoints: LatLng[];
    colour: string;
    directionsUrl: string;
}): JSX.Element | null {
    const [path, setPath] = useState<LatLng[]>(waypoints);
    const [followingRoads, setFollowingRoads] = useState(false);

    useEffect(() => {
        if (waypoints.length < 2) {
            setPath([]);
            setFollowingRoads(false);

            return;
        }

        setPath(waypoints);
        setFollowingRoads(false);

        let cancelled = false;
        const key = waypointsKey(waypoints);

        void fetchDrivingRoute(waypoints, directionsUrl).then((road) => {
            if (cancelled || waypointsKey(waypoints) !== key) {
                return;
            }

            if (road.length > 1) {
                setPath(road);
                setFollowingRoads(true);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [waypoints, directionsUrl]);

    if (path.length < 2) {
        return null;
    }

    return (
        <Polyline
            positions={path}
            pathOptions={{
                color: colour,
                weight: 5,
                opacity: 0.85,
                dashArray: followingRoads ? undefined : '10 8',
            }}
        />
    );
}

/**
 * Multi-route map for a routing plan: depot + one road polyline per route.
 */
export default function PlanRoutesMap({ depot, routes, height = '480px', directionsUrl: directionsUrlProp }: Props): JSX.Element | null {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const directionsUrl = directionsUrlProp ?? prefixedRoute('routing.directions');

    const depotPosition = useMemo(() => toLatLng(depot.lat, depot.lng), [depot.lat, depot.lng]);

    const mappedRoutes = useMemo(() => {
        return routes
            .map((route, index) => {
                const stops = [...route.stops]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((stop) => {
                        const position = toLatLng(stop.lat, stop.lng);

                        if (!position) {
                            return null;
                        }

                        return {
                            position,
                            sequence: stop.sequence,
                            address: stop.address,
                            label: stop.label ?? stop.address,
                        };
                    })
                    .filter((stop): stop is NonNullable<typeof stop> => stop !== null);

                const waypoints: LatLng[] = [
                    ...(depotPosition ? [depotPosition] : []),
                    ...stops.map((stop) => stop.position),
                ];

                return {
                    id: route.id,
                    sequence: route.sequence,
                    vehicleLabel: route.vehicleLabel,
                    colour: ROUTE_COLOURS[index % ROUTE_COLOURS.length],
                    stops,
                    waypoints,
                };
            })
            .filter((route) => route.waypoints.length >= 2);
    }, [routes, depotPosition]);

    const bounds = useMemo(() => {
        const points: LatLng[] = [];

        if (depotPosition) {
            points.push(depotPosition);
        }

        mappedRoutes.forEach((route) => {
            route.waypoints.forEach((point) => points.push(point));
        });

        return points;
    }, [depotPosition, mappedRoutes]);

    if (bounds.length === 0) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">{t('routing.pages.show.map_title')}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {mappedRoutes.map((route) => (
                        <span key={route.id} className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: route.colour }} />
                            {t('routing.pages.show.map_route_legend', {
                                sequence: route.sequence,
                                vehicle: route.vehicleLabel || '—',
                            })}
                        </span>
                    ))}
                </div>
            </div>
            <div className="p-3">
                <LeafletMap bounds={bounds} height={height}>
                    {depotPosition && (
                        <Marker position={depotPosition} icon={depotIcon()}>
                            <Tooltip>{t('routing.pages.show.map_depot')}</Tooltip>
                            <Popup>{depot.address || t('routing.pages.show.map_depot')}</Popup>
                        </Marker>
                    )}

                    {mappedRoutes.map((route) => (
                        <Fragment key={route.id}>
                            <RoadRoute
                                waypoints={route.waypoints}
                                colour={route.colour}
                                directionsUrl={directionsUrl}
                            />
                            {route.stops.map((stop) => (
                                <Marker
                                    key={`${route.id}-${stop.sequence}`}
                                    position={stop.position}
                                    icon={stopIcon(stop.sequence, route.colour)}
                                >
                                    <Popup>
                                        <span className="font-medium">
                                            {t('routing.pages.show.map_stop_popup', {
                                                sequence: route.sequence,
                                                stop: stop.sequence,
                                            })}
                                        </span>
                                        <br />
                                        {stop.label}
                                    </Popup>
                                </Marker>
                            ))}
                        </Fragment>
                    ))}
                </LeafletMap>
            </div>
        </div>
    );
}

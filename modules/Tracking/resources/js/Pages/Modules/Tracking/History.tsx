import DynamicLayout from '@/Layouts/DynamicLayout';
import LeafletMap from '@/Components/Map/LeafletMap';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateTimeDmYHi } from '@/utils/date';
import { formatSpeedKph, type LatLng } from '@/utils/geo';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { Polyline } from 'react-leaflet';
import TrackingNav from '../../../TrackingNav';
import PageHeader from '@/Components/PageHeader';

interface VehicleOption {
    id: number;
    name: string;
    plate_number: string;
}

interface TrailPoint {
    lat: number;
    lng: number;
    speed_kph: number | null;
    recorded_at: string | null;
}

interface Props {
    vehicles: VehicleOption[];
    filters: {
        vehicle_id: number | null;
        from: string;
        to: string;
    };
    trail: TrailPoint[];
    stats: {
        points: number;
        distance_km: number;
        max_speed_kph: number;
    };
}

function toDatetimeLocal(value: string): string {
    return value.replace(' ', 'T').slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
    return value.includes('T') ? value.replace('T', ' ') + ':00' : value;
}

export default function History({ vehicles, filters, trail, stats }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [vehicleId, setVehicleId] = useState(filters.vehicle_id ? String(filters.vehicle_id) : '');
    const [from, setFrom] = useState(toDatetimeLocal(filters.from));
    const [to, setTo] = useState(toDatetimeLocal(filters.to));
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);

    const positions: LatLng[] = useMemo(
        () => trail.map((point) => [point.lat, point.lng] as LatLng),
        [trail],
    );

    const current = trail[index] ?? null;
    const currentPosition: LatLng | null = current ? [current.lat, current.lng] : null;

    useEffect(() => {
        setIndex(0);
        setPlaying(false);
    }, [trail]);

    useEffect(() => {
        if (!playing || trail.length < 2) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((currentIndex) => {
                if (currentIndex >= trail.length - 1) {
                    setPlaying(false);

                    return currentIndex;
                }

                return currentIndex + 1;
            });
        }, 400);

        return () => window.clearInterval(timer);
    }, [playing, trail.length]);

    const applyFilters: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('tracking.history'),
            {
                vehicle_id: vehicleId || undefined,
                from: fromDatetimeLocal(from),
                to: fromDatetimeLocal(to),
            },
            { preserveState: true },
        );
    };

    return (
        <DynamicLayout header={<PageHeader title={t('tracking.title')} />}>
            <Head title={t('tracking.pages.history.title')} />

            <TrackingNav />

            <form onSubmit={applyFilters} className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-4">
                <div>
                    <InputLabel value={t('tracking.fields.vehicle')} />
                    <Select
                        className="mt-1"
                        value={vehicleId}
                        onChange={setVehicleId}
                        options={[
                            { value: '', label: t('tracking.placeholders.select_vehicle') },
                            ...vehicles.map((vehicle) => ({
                                value: String(vehicle.id),
                                label: `${vehicle.name} (${vehicle.plate_number})`,
                            })),
                        ]}
                        searchable
                    />
                </div>
                <div>
                    <InputLabel htmlFor="history_from" value={t('tracking.fields.from')} />
                    <TextInput
                        id="history_from"
                        type="datetime-local"
                        className="mt-1 block w-full"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="history_to" value={t('tracking.fields.to')} />
                    <TextInput
                        id="history_to"
                        type="datetime-local"
                        className="mt-1 block w-full"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
                <div className="flex items-end">
                    <PrimaryButton type="submit" className="w-full justify-center sm:w-auto">
                        {t('tracking.actions.show_trail')}
                    </PrimaryButton>
                </div>
            </form>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('tracking.pages.history.points')}</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.points.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('tracking.pages.history.distance')}</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.distance_km.toLocaleString('id-ID')} km</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('tracking.pages.history.max_speed')}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatSpeedKph(stats.max_speed_kph)}</p>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b border-gray-100 p-4">
                    {trail.length < 2 ? (
                        <p className="text-sm text-gray-500">{t('tracking.pages.history.empty')}</p>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            <SecondaryButton type="button" onClick={() => setPlaying((value) => !value)}>
                                {playing ? t('tracking.actions.pause_playback') : t('tracking.actions.play_playback')}
                            </SecondaryButton>
                            <input
                                type="range"
                                min={0}
                                max={trail.length - 1}
                                value={index}
                                onChange={(e) => {
                                    setPlaying(false);
                                    setIndex(Number(e.target.value));
                                }}
                                className="min-w-[12rem] flex-1"
                            />
                            <p className="text-xs text-gray-500">
                                {current?.recorded_at ? formatDateTimeDmYHi(current.recorded_at) : '—'}
                                {current?.speed_kph != null ? ` · ${formatSpeedKph(current.speed_kph)}` : ''}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <LeafletMap bounds={positions} height="480px">
                        {positions.length > 1 && (
                            <Polyline positions={positions} pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.85 }} />
                        )}
                        {currentPosition && (
                            <VehicleMarker
                                position={currentPosition}
                                label={t('tracking.pages.history.playback_marker')}
                                tone={Number(current?.speed_kph ?? 0) > 3 ? 'moving' : 'idle'}
                            />
                        )}
                    </LeafletMap>
                </div>
            </div>
        </DynamicLayout>
    );
}

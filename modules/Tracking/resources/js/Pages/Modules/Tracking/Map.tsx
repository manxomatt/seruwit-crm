import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LeafletMap from '@/Components/Map/LeafletMap';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateTimeDmYHis } from '@/utils/date';
import { formatCoordinate, formatSpeedKph, toLatLng, type LatLng } from '@/utils/geo';
import { Head, useForm, usePoll } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import TrackingNav from '../../../TrackingNav';

interface Device {
    id: number;
    name: string;
    status: string | null;
    last_latitude: string | null;
    last_longitude: string | null;
    last_speed_kph: string | null;
    last_recorded_at: string | null;
    vehicle: { id: number; name: string; plate_number: string; status: string } | null;
}

interface PairableVehicle {
    id: number;
    name: string;
    plate_number: string;
    odometer_km: number;
}

interface Props {
    devices: Device[];
    pairableVehicles: PairableVehicle[];
    pollEnabled: boolean;
    lastPolledAt: string | null;
    lastPollError: string | null;
    can: { update: boolean };
}

type DeviceTone = 'moving' | 'idle' | 'stale';
type StatusFilter = 'all' | DeviceTone | 'unpaired';

interface PositionedDevice {
    device: Device;
    position: LatLng;
    tone: DeviceTone;
}

const PAGE_SIZE = 10;

const LinkIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
    </svg>
);

/** Moving, stopped, or silent for long enough that the fix is stale. */
function toneFor(device: Device): DeviceTone {
    if (!device.last_recorded_at) {
        return 'stale';
    }

    const ageMinutes = (Date.now() - new Date(device.last_recorded_at).getTime()) / 60000;

    if (ageMinutes > 15) {
        return 'stale';
    }

    return Number(device.last_speed_kph ?? 0) > 3 ? 'moving' : 'idle';
}

function deviceLabel(device: Device): string {
    if (device.vehicle) {
        return `${device.vehicle.name} (${device.vehicle.plate_number})`;
    }

    return device.name;
}

export default function Map({
    devices,
    pairableVehicles,
    pollEnabled,
    lastPolledAt,
    lastPollError,
    can,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [focused, setFocused] = useState<LatLng | null>(null);
    const [deviceId, setDeviceId] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [page, setPage] = useState(1);
    const [pairing, setPairing] = useState<Device | null>(null);
    const pairForm = useForm({ vehicle_id: '' });

    // The server only refreshes from the GPS provider once a minute, so polling
    // faster than this would just re-read the same rows.
    const { start, stop } = usePoll(
        15000,
        { only: ['devices', 'pairableVehicles', 'lastPolledAt', 'lastPollError'] },
        { autoStart: true },
    );
    const [live, setLive] = useState(true);

    const toggleLive = () => {
        if (live) {
            stop();
        } else {
            start();
        }
        setLive(!live);
    };

    const openPairing = (device: Device) => {
        setPairing(device);
        pairForm.reset();
        pairForm.clearErrors();
        if (live) {
            stop();
        }
    };

    const closePairing = () => {
        setPairing(null);
        pairForm.reset();
        pairForm.clearErrors();
        if (live) {
            start();
        }
    };

    const submitPair: FormEventHandler = (e) => {
        e.preventDefault();

        if (!pairing) {
            return;
        }

        pairForm.patch(prefixedRoute('tracking.devices.pair', pairing.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPairing(null);
                pairForm.reset();
                if (live) {
                    start();
                }
            },
        });
    };

    const positioned = useMemo(
        (): PositionedDevice[] =>
            devices
                .map((device) => {
                    const position = toLatLng(device.last_latitude, device.last_longitude);

                    if (position === null) {
                        return null;
                    }

                    return { device, position, tone: toneFor(device) };
                })
                .filter((entry): entry is PositionedDevice => entry !== null),
        [devices],
    );

    const vehicleOptions = useMemo(
        () => [
            { value: '', label: t('tracking.pages.map.filter_all_vehicles') },
            ...positioned.map(({ device }) => ({
                value: String(device.id),
                label: deviceLabel(device),
            })),
        ],
        [positioned, t],
    );

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: t('tracking.pages.map.filter_all') },
            { value: 'moving', label: t('tracking.pages.map.filter_moving') },
            { value: 'idle', label: t('tracking.pages.map.filter_idle') },
            { value: 'stale', label: t('tracking.pages.map.filter_stale') },
            { value: 'unpaired', label: t('tracking.status.unpaired') },
        ],
        [t],
    );

    const filtered = useMemo(() => {
        return positioned.filter(({ device, tone }) => {
            if (deviceId !== '' && String(device.id) !== deviceId) {
                return false;
            }

            if (statusFilter === 'all') {
                return true;
            }

            if (statusFilter === 'unpaired') {
                return device.vehicle === null;
            }

            return tone === statusFilter;
        });
    }, [positioned, deviceId, statusFilter]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [deviceId, statusFilter]);

    useEffect(() => {
        if (page > lastPage) {
            setPage(lastPage);
        }
    }, [page, lastPage]);

    const pageItems = useMemo(() => {
        const startIndex = (page - 1) * PAGE_SIZE;

        return filtered.slice(startIndex, startIndex + PAGE_SIZE);
    }, [filtered, page]);

    const bounds = focused ? [focused] : filtered.map((entry) => entry.position);
    const hasActiveFilter = deviceId !== '' || statusFilter !== 'all';
    const pageFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const pageTo = Math.min(page * PAGE_SIZE, filtered.length);

    const clearFilters = () => {
        setDeviceId('');
        setStatusFilter('all');
        setFocused(null);
    };

    const selectDevice = (value: string) => {
        setDeviceId(value);

        if (value === '') {
            setFocused(null);

            return;
        }

        const match = positioned.find(({ device }) => String(device.id) === value);
        setFocused(match?.position ?? null);
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('tracking.title')}</h2>
                    <SecondaryButton onClick={toggleLive}>
                        {live ? t('tracking.actions.pause_live') : t('tracking.actions.resume_live')}
                    </SecondaryButton>
                </div>
            }
        >
            <Head title={t('tracking.pages.map.title')} />

            {/*
              Fill under the module chrome to the viewport bottom:
              top bar 4rem + page header ~5rem + main top padding 1.5rem = 10.5rem.
              -mb-6 cancels ModuleLayout main bottom padding so panels sit on the viewport edge.
            */}
            <div className="flex flex-col gap-4 lg:-mb-6 lg:h-[calc(100dvh-10.5rem)]">
                <div className="shrink-0 [&>div]:mb-0">
                    <TrackingNav />
                </div>

                {!pollEnabled && (
                    <div className="shrink-0 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                        {t('tracking.pages.map.polling_off')}
                    </div>
                )}

                {lastPollError && (
                    <div className="shrink-0 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {t('tracking.pages.map.last_poll_failed', { error: lastPollError })}
                    </div>
                )}

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="flex min-h-[28rem] flex-col overflow-hidden bg-white shadow-sm sm:rounded-lg lg:h-full lg:min-h-0">
                        <div className="shrink-0 space-y-3 border-b border-gray-100 p-4">
                            <div className="flex items-baseline justify-between gap-2">
                                <h3 className="text-lg font-medium text-gray-900">{t('tracking.pages.map.vehicles')}</h3>
                                <span className="text-xs text-gray-500">
                                    {t('tracking.pages.map.reporting', { count: filtered.length })}
                                    {hasActiveFilter ? ` / ${positioned.length}` : ''}
                                </span>
                            </div>

                            <Select
                                className="w-full"
                                value={deviceId}
                                onChange={selectDevice}
                                options={vehicleOptions}
                                placeholder={t('tracking.pages.map.filter_vehicle')}
                                searchPlaceholder={t('tracking.pages.map.search')}
                                maxVisibleOptions={PAGE_SIZE}
                                searchable
                            />

                            <div className="flex items-start gap-2">
                                <Select
                                    className="min-w-0 flex-1"
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                                    options={statusOptions}
                                    placeholder={t('tracking.pages.map.filter_status')}
                                    searchable={false}
                                />

                                {hasActiveFilter && (
                                    <SecondaryButton type="button" onClick={clearFilters} className="shrink-0">
                                        {t('common.clear_filters')}
                                    </SecondaryButton>
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4">
                            {positioned.length === 0 ? (
                                <p className="py-4 text-sm text-gray-500">{t('tracking.pages.map.empty')}</p>
                            ) : filtered.length === 0 ? (
                                <p className="py-4 text-sm text-gray-500">{t('tracking.pages.map.empty_filter')}</p>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {pageItems.map(({ device, position }) => (
                                        <li key={device.id} className="flex items-start gap-2 py-3">
                                            <button
                                                type="button"
                                                onClick={() => setFocused(position)}
                                                className="min-w-0 flex-1 text-left hover:bg-gray-50"
                                            >
                                                <p className="text-sm font-medium text-gray-900">
                                                    {device.vehicle?.name ?? device.name}
                                                    {device.vehicle ? (
                                                        <span className="ml-1 text-gray-500">({device.vehicle.plate_number})</span>
                                                    ) : (
                                                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                            {t('tracking.status.unpaired')}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatSpeedKph(device.last_speed_kph)} — {formatCoordinate(position[0], position[1])}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDateTimeDmYHis(device.last_recorded_at)}</p>
                                            </button>

                                            {can.update && !device.vehicle && (
                                                <button
                                                    type="button"
                                                    onClick={() => openPairing(device)}
                                                    className="shrink-0 rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900"
                                                    title={t('tracking.actions.pair')}
                                                    aria-label={t('tracking.actions.pair')}
                                                >
                                                    <LinkIcon />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="shrink-0 space-y-2 border-t border-gray-100 p-4">
                            {filtered.length > 0 && (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-gray-500">
                                        {t('common.showing_results', {
                                            from: pageFrom,
                                            to: pageTo,
                                            total: filtered.length,
                                        })}
                                    </p>
                                    {lastPage > 1 && (
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                disabled={page <= 1}
                                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                className="rounded border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                            >
                                                {t('tracking.pages.map.prev_page')}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={page >= lastPage}
                                                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                                                className="rounded border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                            >
                                                {t('tracking.pages.map.next_page')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {focused && (
                                <button
                                    type="button"
                                    onClick={() => setFocused(null)}
                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    {t('tracking.pages.map.show_all')}
                                </button>
                            )}

                            <p className="text-xs text-gray-400">
                                {t('tracking.pages.map.last_refreshed', {
                                    time: lastPolledAt
                                        ? formatDateTimeDmYHis(lastPolledAt)
                                        : t('tracking.pages.map.never'),
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-h-[28rem] flex-col overflow-hidden bg-white shadow-sm sm:rounded-lg lg:col-span-2 lg:h-full lg:min-h-0">
                        <div className="min-h-0 flex-1 p-4 sm:p-6">
                            <LeafletMap bounds={bounds} height="100%">
                                {filtered.map(({ device, position, tone }) => (
                                    <VehicleMarker
                                        key={device.id}
                                        position={position}
                                        label={device.vehicle?.name ?? device.name}
                                        tone={tone}
                                    >
                                        <>
                                            <br />
                                            {formatSpeedKph(device.last_speed_kph)}
                                            <br />
                                            <span className="text-gray-500">{formatDateTimeDmYHis(device.last_recorded_at)}</span>
                                        </>
                                    </VehicleMarker>
                                ))}
                            </LeafletMap>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={pairing !== null} onClose={closePairing} maxWidth="md">
                <form onSubmit={submitPair} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {t('tracking.actions.pair')} {pairing?.name}
                    </h3>

                    {pairableVehicles.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('tracking.pages.devices.all_paired')}</p>
                    ) : (
                        <div>
                            <InputLabel htmlFor="map_vehicle_id" value={t('tracking.fields.vehicle')} />
                            <Select
                                id="map_vehicle_id"
                                className="mt-1"
                                value={pairForm.data.vehicle_id}
                                onChange={(value) => pairForm.setData('vehicle_id', value)}
                                placeholder={t('tracking.placeholders.select_vehicle')}
                                options={pairableVehicles.map((vehicle) => ({
                                    value: String(vehicle.id),
                                    label: `${vehicle.name} (${vehicle.plate_number}) — ${vehicle.odometer_km.toLocaleString('id-ID')} km`,
                                }))}
                            />
                            <InputError message={pairForm.errors.vehicle_id} className="mt-2" />
                            <p className="mt-3 text-xs text-gray-500">{t('tracking.pages.devices.pair_odometer_hint')}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closePairing}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        {pairableVehicles.length > 0 && (
                            <PrimaryButton disabled={pairForm.processing}>{t('tracking.actions.pair')}</PrimaryButton>
                        )}
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}

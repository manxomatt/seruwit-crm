import DynamicLayout from '@/Layouts/DynamicLayout';
import LeafletMap from '@/Components/Map/LeafletMap';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatCoordinate, formatSpeedKph, toLatLng, type LatLng } from '@/utils/geo';
import { Head, usePoll } from '@inertiajs/react';
import { useMemo, useState } from 'react';
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

interface Props {
    devices: Device[];
    pollEnabled: boolean;
    lastPolledAt: string | null;
    lastPollError: string | null;
}

/** Moving, stopped, or silent for long enough that the fix is stale. */
function toneFor(device: Device): 'moving' | 'idle' | 'stale' {
    if (!device.last_recorded_at) {
        return 'stale';
    }

    const ageMinutes = (Date.now() - new Date(device.last_recorded_at).getTime()) / 60000;

    if (ageMinutes > 15) {
        return 'stale';
    }

    return Number(device.last_speed_kph ?? 0) > 3 ? 'moving' : 'idle';
}

export default function Map({ devices, pollEnabled, lastPolledAt, lastPollError }: Props): JSX.Element {
    const [focused, setFocused] = useState<LatLng | null>(null);

    // The server only refreshes from Traccar once a minute, so polling faster
    // than this would just re-read the same rows.
    const { start, stop } = usePoll(15000, { only: ['devices', 'lastPolledAt', 'lastPollError'] }, { autoStart: true });
    const [live, setLive] = useState(true);

    const toggleLive = () => {
        if (live) {
            stop();
        } else {
            start();
        }
        setLive(!live);
    };

    const positioned = useMemo(
        () =>
            devices
                .map((device) => ({ device, position: toLatLng(device.last_latitude, device.last_longitude) }))
                .filter((entry): entry is { device: Device; position: LatLng } => entry.position !== null),
        [devices],
    );

    const bounds = focused ? [focused] : positioned.map((entry) => entry.position);

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Tracking</h2>
                    <SecondaryButton onClick={toggleLive}>{live ? 'Pause live' : 'Resume live'}</SecondaryButton>
                </div>
            }
        >
            <Head title="Live Map" />

            <TrackingNav />

            {!pollEnabled && (
                <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                    Polling is switched off, so positions will not refresh. Enable it on the Settings tab.
                </div>
            )}

            {lastPollError && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    Last poll failed: {lastPollError}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-baseline justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Vehicles</h3>
                            <span className="text-xs text-gray-500">{positioned.length} reporting</span>
                        </div>

                        {positioned.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No vehicle has reported a position yet. Pair a device on the Devices tab.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {positioned.map(({ device, position }) => (
                                    <li key={device.id}>
                                        <button
                                            onClick={() => setFocused(position)}
                                            className="w-full py-3 text-left hover:bg-gray-50"
                                        >
                                            <p className="text-sm font-medium text-gray-900">
                                                {device.vehicle?.name ?? device.name}
                                                {device.vehicle && (
                                                    <span className="ml-1 text-gray-500">({device.vehicle.plate_number})</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatSpeedKph(device.last_speed_kph)} — {formatCoordinate(position[0], position[1])}
                                            </p>
                                            <p className="text-xs text-gray-400">{device.last_recorded_at ?? '—'}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {focused && (
                            <button onClick={() => setFocused(null)} className="mt-4 text-sm text-indigo-600 hover:text-indigo-900">
                                Show all vehicles
                            </button>
                        )}

                        <p className="mt-4 text-xs text-gray-400">Last refreshed from Traccar: {lastPolledAt ?? 'never'}</p>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg lg:col-span-2">
                    <div className="p-6">
                        <LeafletMap bounds={bounds} height="560px">
                            {positioned.map(({ device, position }) => (
                                <VehicleMarker
                                    key={device.id}
                                    position={position}
                                    label={device.vehicle?.name ?? device.name}
                                    tone={toneFor(device)}
                                >
                                    <>
                                        <br />
                                        {formatSpeedKph(device.last_speed_kph)}
                                        <br />
                                        <span className="text-gray-500">{device.last_recorded_at}</span>
                                    </>
                                </VehicleMarker>
                            ))}
                        </LeafletMap>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

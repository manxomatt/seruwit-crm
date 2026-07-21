import LeafletMap from '@/Components/Map/LeafletMap';
import VehicleMarker from '@/Components/Map/VehicleMarker';
import { formatSpeedKph, toLatLng } from '@/utils/geo';
import { Head, usePage } from '@inertiajs/react';

interface Order {
    code: string;
    status: string;
    order_date: string | null;
    confirmed_at: string | null;
    delivered_at: string | null;
    pickup_address: string;
    delivery_address: string;
    recipient_name: string | null;
}

interface LivePosition {
    latitude: string;
    longitude: string;
    speed_kph: string | null;
    recorded_at: string | null;
}

interface Props {
    order: Order;
    livePosition: LivePosition | null;
}

const STEPS: Array<{ key: string; label: string }> = [
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'assigned', label: 'Dijadwalkan' },
    { key: 'in_transit', label: 'Dalam perjalanan' },
    { key: 'delivered', label: 'Terkirim' },
];

const ORDER = ['confirmed', 'assigned', 'in_transit', 'delivered'];

export default function Show({ order, livePosition }: Props): JSX.Element {
    const settings = (usePage().props as any).settings as Record<string, string> | undefined;
    const siteName = settings?.['general.site_name'] ?? 'Lacak Kiriman';

    const currentIndex = ORDER.indexOf(order.status);
    const live = livePosition ? toLatLng(livePosition.latitude, livePosition.longitude) : null;

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <Head title={`Lacak ${order.code}`} />

            <div className="mx-auto max-w-2xl px-4">
                <div className="mb-6 text-center">
                    <h1 className="text-lg font-semibold text-gray-900">{siteName}</h1>
                    <p className="text-sm text-gray-500">Pelacakan kiriman</p>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-400">Nomor kiriman</p>
                                <p className="text-lg font-semibold text-gray-900">{order.code}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {STEPS.find((s) => s.key === order.status)?.label ?? order.status.replace('_', ' ')}
                            </span>
                        </div>
                    </div>

                    <div className="p-6">
                        <ol className="space-y-4">
                            {STEPS.map((step, index) => {
                                const done = index <= currentIndex;
                                return (
                                    <li key={step.key} className="flex items-start gap-3">
                                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${done ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {done ? '✓' : index + 1}
                                        </span>
                                        <div>
                                            <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                            {step.key === 'delivered' && order.delivered_at && (
                                                <>
                                                    <p className="text-xs text-gray-500">{order.delivered_at}</p>
                                                    {order.recipient_name && (
                                                        <p className="text-xs text-gray-500">Diterima oleh {order.recipient_name}</p>
                                                    )}
                                                </>
                                            )}
                                            {step.key === 'confirmed' && order.confirmed_at && (
                                                <p className="text-xs text-gray-500">{order.confirmed_at}</p>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-gray-400">Dari</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.pickup_address}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase tracking-wide text-gray-400">Tujuan</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.delivery_address}</dd>
                            </div>
                        </dl>
                    </div>

                    {live && (
                        <div className="border-t border-gray-100 p-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-medium text-gray-900">Posisi kendaraan</h2>
                                <span className="text-xs text-gray-500">{formatSpeedKph(livePosition?.speed_kph)} — {livePosition?.recorded_at}</span>
                            </div>
                            <LeafletMap bounds={[live]} height="320px">
                                <VehicleMarker position={live} label="Kendaraan" tone={Number(livePosition?.speed_kph ?? 0) > 3 ? 'moving' : 'idle'} />
                            </LeafletMap>
                        </div>
                    )}
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">Ditenagai oleh {siteName}</p>
            </div>
        </div>
    );
}

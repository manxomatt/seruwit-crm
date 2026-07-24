import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';

interface LogRow {
    id: number;
    filled_at: string;
    liters: string;
    cost: string;
    odometer_km: number | null;
    distance_since_last_km: number | null;
    km_per_liter: string | number | null;
    liters_per_100km: string | number | null;
    odometer_source: string | null;
    anomaly_flags: { code: string; message: string; severity: string }[] | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
    driver: { id: number; name: string } | null;
}

interface Props {
    logs: { data: LogRow[] };
    vehicles: { id: number; name: string; plate_number: string }[];
    filters: { vehicle_id?: number | null; anomalies_only?: boolean };
}

export default function Index({ logs, vehicles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">Fuel Management</h2>}>
            <Head title="Fuel Management" />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <FleetNav />
                    <p className="text-sm text-gray-600">
                        Fill history across the fleet — consumption per km, anomaly flags, GPS/vehicle odometer source.
                    </p>

                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs text-gray-500">Vehicle</label>
                            <Select
                                className="mt-0.5 min-w-[14rem]"
                                value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                                onChange={(value) =>
                                    router.get(prefixedRoute('fleet.fuel.index'), {
                                        vehicle_id: value || undefined,
                                        anomalies_only: filters.anomalies_only || undefined,
                                    })
                                }
                                placeholder="All vehicles"
                                options={vehicles.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name} (${v.plate_number})`,
                                }))}
                            />
                        </div>
                        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={Boolean(filters.anomalies_only)}
                                onChange={(e) =>
                                    router.get(prefixedRoute('fleet.fuel.index'), {
                                        vehicle_id: filters.vehicle_id || undefined,
                                        anomalies_only: e.target.checked || undefined,
                                    })
                                }
                            />
                            Anomalies only
                        </label>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Vehicle</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Liters</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Δ km</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">km/L</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Flags</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            No fuel logs yet.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className={log.anomaly_flags?.length ? 'bg-amber-50/50' : ''}>
                                            <td className="px-4 py-3">{log.filled_at}</td>
                                            <td className="px-4 py-3">
                                                {log.vehicle ? (
                                                    <Link
                                                        href={prefixedRoute('fleet.vehicles.show', log.vehicle.id)}
                                                        className="font-medium text-indigo-600 hover:underline"
                                                    >
                                                        {log.vehicle.name}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.liters} L · Rp {Number(log.cost).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">{log.distance_since_last_km ?? '—'} km</td>
                                            <td className="px-4 py-3">
                                                {log.km_per_liter ?? '—'}
                                                {log.odometer_source && (
                                                    <span className="ml-1 text-xs uppercase text-gray-400">{log.odometer_source}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-amber-800">
                                                {log.anomaly_flags?.map((f) => f.code.replaceAll('_', ' ')).join(', ') || '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

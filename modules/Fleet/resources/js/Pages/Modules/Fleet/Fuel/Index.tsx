import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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

interface PaginatedLogs {
    data: LogRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    logs: PaginatedLogs;
    vehicles: { id: number; name: string; plate_number: string }[];
    filters: { vehicle_id?: number | null; anomalies_only?: boolean };
}

export default function Index({ logs, vehicles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('fleet.title')}</h2>}
        >
            <Head title={t('fleet.fuel.title')} />

            <FleetNav />

            <p className="mb-6 text-sm text-gray-600">{t('fleet.fuel.subtitle')}</p>

            <div className="mb-6 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs text-gray-500">{t('fleet.fuel.vehicle')}</label>
                    <Select
                        className="mt-0.5 min-w-[14rem]"
                        value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                        onChange={(value) =>
                            router.get(prefixedRoute('fleet.fuel.index'), {
                                vehicle_id: value || undefined,
                                anomalies_only: filters.anomalies_only || undefined,
                            })
                        }
                        placeholder={t('fleet.fuel.all_vehicles')}
                        options={[
                            { value: '', label: t('fleet.fuel.all_vehicles') },
                            ...vehicles.map((v) => ({
                                value: String(v.id),
                                label: `${v.name} (${v.plate_number})`,
                            })),
                        ]}
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
                    {t('fleet.fuel.anomalies_only')}
                </label>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.date')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.vehicle')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.liters')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Δ km</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.km_l')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.flags')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            {t('fleet.fuel.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className={log.anomaly_flags?.length ? 'bg-amber-50/50' : 'hover:bg-gray-50'}>
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

                    {logs.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-gray-700">
                                {t('common.showing_results', {
                                    from: (logs.current_page - 1) * logs.per_page + 1,
                                    to: Math.min(logs.current_page * logs.per_page, logs.total),
                                    total: logs.total,
                                })}
                            </p>
                            <div className="flex gap-1">
                                {logs.links.map((link, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`rounded px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

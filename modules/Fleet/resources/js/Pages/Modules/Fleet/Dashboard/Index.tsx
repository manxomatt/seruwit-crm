import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import FleetNav from '../../../../FleetNav';

interface VehicleRow {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    status: string;
    odometer_km: number;
    last_fuel_at: string | null;
    last_fuel_odometer: number | null;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    stnk_status: string;
    kir_status: string;
}

interface Board {
    counts: { active: number; maintenance: number; inactive: number; total: number };
    drivers: { available: number; on_leave: number; inactive: number; total: number };
    expiring_docs: { expired: number; expiring_30: number; available: boolean };
    vehicles: VehicleRow[];
}

interface Props {
    board: Board;
}

const STATUS_STYLES: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-amber-100 text-amber-800',
    inactive: 'bg-gray-100 text-gray-600',
};

const EXPIRY_STYLES: Record<string, string> = {
    valid: 'text-green-700',
    expiring_soon: 'text-amber-700',
    expired: 'text-red-700',
    unknown: 'text-gray-400',
};

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }): JSX.Element {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-gray-900">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

export default function Index({ board }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, drivers, expiring_docs, vehicles } = board;

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('fleet.dashboard.title')}</h2>}>
            <Head title={t('fleet.dashboard.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <FleetNav />
                    <p className="text-sm text-gray-600">{t('fleet.dashboard.subtitle')}</p>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label={t('fleet.dashboard.active')}
                            value={counts.active}
                            hint={t('fleet.dashboard.of_vehicles', { total: counts.total })}
                        />
                        <StatCard label={t('fleet.dashboard.maintenance')} value={counts.maintenance} />
                        <StatCard label={t('fleet.dashboard.inactive')} value={counts.inactive} />
                        <StatCard
                            label={t('fleet.dashboard.drivers_available')}
                            value={drivers.available}
                            hint={t('fleet.dashboard.drivers_hint', {
                                leave: drivers.on_leave,
                                inactive: drivers.inactive,
                            })}
                        />
                    </div>

                    {expiring_docs.available && (expiring_docs.expired > 0 || expiring_docs.expiring_30 > 0) && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {t('fleet.dashboard.docs_alert', {
                                expired: expiring_docs.expired,
                                expiring: expiring_docs.expiring_30,
                            })}{' '}
                            <Link href={prefixedRoute('documents.index')} className="font-medium underline">
                                {t('fleet.dashboard.open_documents')}
                            </Link>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.vehicle')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.status')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.odometer')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.last_fuel')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.stnk')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.dashboard.kir')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {vehicles.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            {t('fleet.dashboard.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    vehicles.map((vehicle) => (
                                        <tr key={vehicle.id}>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {vehicle.name}
                                                </Link>
                                                <div className="text-xs text-gray-500">{vehicle.plate_number}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[vehicle.status] ?? STATUS_STYLES.inactive}`}>
                                                    {t(`fleet.status.${vehicle.status}`, undefined, vehicle.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {vehicle.odometer_km.toLocaleString('id-ID')} km
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {vehicle.last_fuel_at
                                                    ? new Date(vehicle.last_fuel_at).toLocaleDateString('id-ID')
                                                    : '—'}
                                                {vehicle.last_fuel_odometer !== null && (
                                                    <div className="text-xs text-gray-400">
                                                        @{vehicle.last_fuel_odometer.toLocaleString('id-ID')} km
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${EXPIRY_STYLES[vehicle.stnk_status]}`}>
                                                {vehicle.stnk_expires_at
                                                    ? new Date(vehicle.stnk_expires_at).toLocaleDateString('id-ID')
                                                    : '—'}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${EXPIRY_STYLES[vehicle.kir_status]}`}>
                                                {vehicle.kir_expires_at
                                                    ? new Date(vehicle.kir_expires_at).toLocaleDateString('id-ID')
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="text-sm">
                        <Link href={prefixedRoute('fleet.fuel.analytics')} className="font-medium text-indigo-600 hover:underline">
                            {t('fleet.dashboard.open_analytics')}
                        </Link>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

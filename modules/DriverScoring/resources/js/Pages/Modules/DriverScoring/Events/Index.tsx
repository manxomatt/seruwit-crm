import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { Head, router } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';

interface EventRow {
    id: number;
    type: string;
    severity: string;
    speed_kph: string | number | null;
    points_delta: number;
    recorded_at: string;
    driver: { id: number; name: string } | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
}

interface Props {
    events: { data: EventRow[] };
    drivers: { id: number; name: string }[];
    vehicles: { id: number; name: string; plate_number: string }[];
    filters: { driver_id?: number | null; vehicle_id?: number | null; type?: string | null };
}

const EVENT_TYPES = ['harsh_brake', 'harsh_accel', 'speeding', 'idle'] as const;

export default function Index({ events, drivers, vehicles, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const reload = (patch: Record<string, string | undefined>): void => {
        router.get(prefixedRoute('scoring.events.index'), {
            driver_id: filters.driver_id || undefined,
            vehicle_id: filters.vehicle_id || undefined,
            type: filters.type || undefined,
            ...patch,
        });
    };

    const eventTypeLabel = (type: string): string =>
        t(`scoring.types.${type}`, undefined, type.replaceAll('_', ' '));

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('scoring.pages.events.title')}</h2>}>
            <Head title={t('scoring.pages.events.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ScoringNav />
                    <div className="flex flex-wrap gap-3">
                        <Select
                            className="min-w-[12rem]"
                            value={filters.driver_id ? String(filters.driver_id) : ''}
                            onChange={(value) => reload({ driver_id: value || undefined })}
                            placeholder="All drivers"
                            options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
                        />
                        <Select
                            className="min-w-[12rem]"
                            value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                            onChange={(value) => reload({ vehicle_id: value || undefined })}
                            placeholder="All vehicles"
                            options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} (${v.plate_number})` }))}
                        />
                        <Select
                            className="min-w-[10rem]"
                            value={filters.type || ''}
                            onChange={(value) => reload({ type: value || undefined })}
                            placeholder="All types"
                            options={EVENT_TYPES.map((type) => ({
                                value: type,
                                label: eventTypeLabel(type),
                            }))}
                        />
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">When</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.fields.type')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.fields.driver')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Vehicle</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Speed</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {events.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">{t('scoring.pages.events.empty')}</td>
                                    </tr>
                                ) : (
                                    events.data.map((event) => (
                                        <tr key={event.id}>
                                            <td className="px-4 py-3">{event.recorded_at}</td>
                                            <td className="px-4 py-3 capitalize">{eventTypeLabel(event.type)}</td>
                                            <td className="px-4 py-3">{event.driver?.name ?? '—'}</td>
                                            <td className="px-4 py-3">{event.vehicle ? `${event.vehicle.name}` : '—'}</td>
                                            <td className="px-4 py-3">{event.speed_kph ?? '—'}</td>
                                            <td className="px-4 py-3 text-amber-700">{event.points_delta}</td>
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

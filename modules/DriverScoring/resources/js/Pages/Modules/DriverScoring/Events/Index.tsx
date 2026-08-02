import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatDateTimeDmYHi } from '@/utils/date';
import { Head, router } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';
import PageHeader from '@/Components/PageHeader';

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

interface PaginatedEvents {
    data: EventRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    events: PaginatedEvents;
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
        <DynamicLayout
            header={<PageHeader title={t('scoring.pages.events.title')} />}
        >
            <Head title={t('scoring.pages.events.title')} />

            <ScoringNav />

            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="min-w-[12rem]"
                    value={filters.driver_id ? String(filters.driver_id) : ''}
                    onChange={(value) => reload({ driver_id: value || undefined })}
                    placeholder={t('scoring.placeholders.all_drivers')}
                    searchPlaceholder={t('scoring.placeholders.search_drivers')}
                    searchable
                    options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
                />
                <Select
                    className="min-w-[12rem]"
                    value={filters.vehicle_id ? String(filters.vehicle_id) : ''}
                    onChange={(value) => reload({ vehicle_id: value || undefined })}
                    placeholder={t('scoring.placeholders.all_vehicles')}
                    options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} (${v.plate_number})` }))}
                />
                <Select
                    className="min-w-[10rem]"
                    value={filters.type || ''}
                    onChange={(value) => reload({ type: value || undefined })}
                    placeholder={t('scoring.placeholders.all_types')}
                    options={EVENT_TYPES.map((type) => ({
                        value: type,
                        label: eventTypeLabel(type),
                    }))}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
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
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    {t('scoring.pages.events.empty')}
                                </td>
                            </tr>
                        ) : (
                            events.data.map((event) => (
                                <tr key={event.id}>
                                    <td className="whitespace-nowrap px-4 py-3">{formatDateTimeDmYHi(event.recorded_at)}</td>
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

                {events.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (events.current_page - 1) * events.per_page + 1,
                                to: Math.min(events.current_page * events.per_page, events.total),
                                total: events.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {events.links.map((link, index) => (
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
        </DynamicLayout>
    );
}

import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';
import { ActionIconButton, EyeIcon, RouteIcon } from '../components/ActionIcons';
import ShuttlePagination, { type PaginatedMeta } from '../components/ShuttlePagination';

interface Departure {
    id: number;
    departure_number: string;
    depart_date: string;
    depart_time: string;
    status: string;
    seats_booked: number;
    seat_capacity: number;
    corridor?: { name: string } | null;
    vehicle?: { name: string; plate_number: string } | null;
}

interface Props {
    departures: PaginatedMeta & { data: Departure[] };
    filters: { status: string | null; date: string | null };
    can: { optimize: boolean; dispatch: boolean };
}

const STATUSES = ['open', 'locked', 'optimized', 'dispatched', 'in_transit', 'completed', 'cancelled'] as const;

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'open':
            return 'bg-sky-100 text-sky-800';
        case 'locked':
            return 'bg-amber-100 text-amber-800';
        case 'optimized':
            return 'bg-indigo-100 text-indigo-800';
        case 'dispatched':
        case 'in_transit':
            return 'bg-violet-100 text-violet-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ departures, filters, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [status, setStatus] = useState(filters.status ?? '');
    const [date, setDate] = useState(filters.date ?? '');

    const applyFilters = (overrides: { status?: string; date?: string } = {}): void => {
        router.get(
            prefixedRoute('shuttle.departures.index'),
            {
                status: (overrides.status !== undefined ? overrides.status : status) || undefined,
                date: (overrides.date !== undefined ? overrides.date : date) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const filter: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.departures.title')}</h2>}
        >
            <Head title={t('shuttle.departures.title')} />
            <ShuttleNav active="departures" />

            <form onSubmit={filter} className="mb-6 flex flex-wrap gap-3">
                <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Select
                    className="min-w-[12rem]"
                    value={status}
                    onChange={(value) => {
                        setStatus(value);
                        applyFilters({ status: value });
                    }}
                    options={[
                        { value: '', label: t('common.all', undefined, 'All statuses') },
                        ...STATUSES.map((s) => ({ value: s, label: t(`shuttle.status.${s}`) })),
                    ]}
                />
                <button type="submit" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {t('common.filter', undefined, 'Filter')}
                </button>
            </form>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.number')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.corridor')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.date')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.seats')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions', undefined, 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {departures.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    —
                                </td>
                            </tr>
                        ) : (
                            departures.data.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{d.departure_number}</td>
                                    <td className="px-4 py-3 text-gray-700">{d.corridor?.name}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                        {d.depart_date} {String(d.depart_time).slice(0, 5)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">
                                        {d.seats_booked}/{d.seat_capacity}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}`}>
                                            {t(`shuttle.status.${d.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <ActionIconButton
                                                title={t('common.view', undefined, 'View')}
                                                href={prefixedRoute('shuttle.departures.show', d.id)}
                                            >
                                                <EyeIcon />
                                            </ActionIconButton>
                                            {can.optimize && ['open', 'locked', 'optimized'].includes(d.status) && (
                                                <ActionIconButton
                                                    title={t('shuttle.departures.optimize')}
                                                    tone="sky"
                                                    onClick={() => router.post(prefixedRoute('shuttle.departures.optimize', d.id))}
                                                >
                                                    <RouteIcon />
                                                </ActionIconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <ShuttlePagination meta={departures} />
            </div>
        </DynamicLayout>
    );
}

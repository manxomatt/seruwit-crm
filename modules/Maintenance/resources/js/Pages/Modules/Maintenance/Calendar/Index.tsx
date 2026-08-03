import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import { getPriorityBadge, getStatusBadge } from '../../../../maintenanceUtils';

interface CalendarCard {
    id: number;
    reference_number: string;
    title: string;
    status: string;
    priority: string;
    vehicle: { id: number; name: string; plate_number: string } | null;
    mechanic: { id: number; name: string } | null;
}

interface Bay {
    id: number;
    code: string;
    name: string;
}

interface Props {
    bays: Bay[];
    dates: string[];
    cells: Record<number, Record<string, CalendarCard[]>>;
    filters: { start: string; days: number };
    can: { create: boolean };
}

export default function Index({ bays, dates, cells, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const shiftWeek = (delta: number) => {
        const start = new Date(`${filters.start}T00:00:00`);
        start.setDate(start.getDate() + delta * filters.days);
        const iso = start.toISOString().slice(0, 10);
        router.get(
            prefixedRoute('maintenance.calendar.index'),
            { start: iso, days: filters.days },
            { preserveState: true, replace: true },
        );
    };

    const goToday = () => {
        router.get(
            prefixedRoute('maintenance.calendar.index'),
            { days: filters.days },
            { preserveState: true, replace: true },
        );
    };

    const formatDay = (date: string) => {
        const d = new Date(`${date}T00:00:00`);
        return new Intl.DateTimeFormat(localeTag, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        }).format(d);
    };

    const isToday = (date: string) => date === new Date().toISOString().slice(0, 10);

    return (
        <DynamicLayout>
            <Head title={t('maintenance.calendar.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                    <MaintenanceNav />
                    <PageHeader
                        title={t('maintenance.calendar.head')}
                        description={t('maintenance.calendar.subtitle')}
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <SecondaryButton type="button" onClick={() => shiftWeek(-1)}>
                                    {t('maintenance.calendar.prev')}
                                </SecondaryButton>
                                <SecondaryButton type="button" onClick={goToday}>
                                    {t('maintenance.calendar.today')}
                                </SecondaryButton>
                                <SecondaryButton type="button" onClick={() => shiftWeek(1)}>
                                    {t('maintenance.calendar.next')}
                                </SecondaryButton>
                                {can.create && (
                                    <Link href={prefixedRoute('maintenance.work-orders.create')}>
                                        <SecondaryButton type="button">{t('maintenance.work_orders.new')}</SecondaryButton>
                                    </Link>
                                )}
                            </div>
                        }
                    />

                    {bays.length === 0 ? (
                        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                            {t('maintenance.calendar.no_bays')}
                        </div>
                    ) : (
                        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                            {t('maintenance.calendar.bay')}
                                        </th>
                                        {dates.map((date) => (
                                            <th
                                                key={date}
                                                className={`min-w-[160px] px-3 py-3 text-left text-xs font-medium uppercase ${
                                                    isToday(date) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'
                                                }`}
                                            >
                                                {formatDay(date)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {bays.map((bay) => (
                                        <tr key={bay.id}>
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-3 align-top">
                                                <div className="text-sm font-semibold text-gray-900">{bay.code}</div>
                                                <div className="text-xs text-gray-500">{bay.name}</div>
                                            </td>
                                            {dates.map((date) => {
                                                const cards = cells[bay.id]?.[date] ?? [];
                                                return (
                                                    <td
                                                        key={`${bay.id}-${date}`}
                                                        className={`px-2 py-2 align-top ${isToday(date) ? 'bg-indigo-50/40' : ''}`}
                                                    >
                                                        <div className="space-y-2">
                                                            {cards.length === 0 ? (
                                                                <p className="px-1 py-4 text-center text-[11px] text-gray-300">—</p>
                                                            ) : (
                                                                cards.map((card) => {
                                                                    const status = getStatusBadge(card.status as 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled', t);
                                                                    const priority = getPriorityBadge(card.priority as 'low' | 'normal' | 'high' | 'urgent', t);
                                                                    return (
                                                                        <Link
                                                                            key={card.id}
                                                                            href={prefixedRoute('maintenance.work-orders.show', card.id)}
                                                                            className="block rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:border-indigo-300"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-1">
                                                                                <span className="text-xs font-semibold text-indigo-700">{card.reference_number}</span>
                                                                                <span className={`rounded px-1 py-0.5 text-[10px] ${priority.classes}`}>{priority.label}</span>
                                                                            </div>
                                                                            <p className="mt-1 line-clamp-2 text-xs text-gray-900">{card.title}</p>
                                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                                {card.vehicle?.plate_number ?? '—'}
                                                                            </p>
                                                                            <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] ${status.classes}`}>
                                                                                {status.label}
                                                                            </span>
                                                                        </Link>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

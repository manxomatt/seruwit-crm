import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
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
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.title', undefined, 'Maintenance')}
                    subtitle="Workshop Bay Schedule & Reservation Calendar"
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <SecondaryButton type="button" onClick={() => shiftWeek(-1)} className="!rounded-2xl text-xs">
                                ◀ {t('maintenance.calendar.prev', undefined, 'Prev')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={goToday} className="!rounded-2xl text-xs">
                                📅 {t('maintenance.calendar.today', undefined, 'Today')}
                            </SecondaryButton>
                            <SecondaryButton type="button" onClick={() => shiftWeek(1)} className="!rounded-2xl text-xs">
                                {t('maintenance.calendar.next', undefined, 'Next')} ▶
                            </SecondaryButton>
                            {can.create && (
                                <Link href={prefixedRoute('maintenance.work-orders.create')}>
                                    <PrimaryButton type="button" className="!rounded-2xl text-xs shadow-sm">
                                        ➕ {t('maintenance.work_orders.new', undefined, 'New WO')}
                                    </PrimaryButton>
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={t('maintenance.calendar.head', undefined, 'Bay Calendar')} />
            <MaintenanceNav />

            {bays.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs font-semibold text-slate-400 shadow-sm">
                    {t('maintenance.calendar.no_bays', undefined, 'No workshop bays configured yet.')}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/50">
                            <tr>
                                <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-left font-extrabold uppercase tracking-wider text-slate-500">
                                    {t('maintenance.calendar.bay', undefined, 'Workshop Bay')}
                                </th>
                                {dates.map((date) => (
                                    <th
                                        key={date}
                                        className={`min-w-[160px] px-4 py-3.5 text-left font-extrabold uppercase tracking-wider ${
                                            isToday(date)
                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {formatDay(date)}
                                        {isToday(date) && <span className="ml-1 text-[9px] font-mono bg-indigo-600 text-white rounded-full px-1.5 py-0.5">TODAY</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                            {bays.map((bay) => (
                                <tr key={bay.id}>
                                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white dark:bg-slate-900 px-4 py-3.5 align-top border-r border-slate-100 dark:border-slate-800">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <span>🏗️</span> {bay.code}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{bay.name}</div>
                                    </td>
                                    {dates.map((date) => {
                                        const cards = cells[bay.id]?.[date] ?? [];
                                        return (
                                            <td
                                                key={`${bay.id}-${date}`}
                                                className={`px-3 py-3 align-top transition-colors ${isToday(date) ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}
                                            >
                                                {cards.length === 0 ? (
                                                    <span className="text-[10px] text-slate-300 dark:text-slate-700 font-mono">—</span>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {cards.map((card) => {
                                                            const statusBadge = getStatusBadge(card.status, t);
                                                            const priority = getPriorityBadge(card.priority as 'low' | 'normal' | 'high' | 'urgent', t);

                                                            return (
                                                                <Link
                                                                    key={card.id}
                                                                    href={prefixedRoute('maintenance.work-orders.show', card.id)}
                                                                    className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-2.5 shadow-xs hover:shadow-md transition-all"
                                                                >
                                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                                        <span className="font-mono text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                                                            {card.reference_number}
                                                                        </span>
                                                                        <span className={`rounded-md px-1.5 py-0.2 text-[8px] font-extrabold ${priority.classes}`}>
                                                                            {priority.label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-1">
                                                                        {card.title}
                                                                    </div>
                                                                    {card.vehicle && (
                                                                        <div className="text-[10px] font-medium text-slate-500 mt-1">
                                                                            🚗 {card.vehicle.plate_number}
                                                                        </div>
                                                                    )}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DynamicLayout>
    );
}

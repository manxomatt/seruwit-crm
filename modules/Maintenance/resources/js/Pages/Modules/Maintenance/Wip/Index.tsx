import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import { formatDate, getPriorityBadge } from '../../../../maintenanceUtils';

interface WipCard {
    id: number;
    reference_number: string;
    title: string;
    status: string;
    priority: string;
    waiting_parts: boolean;
    scheduled_date: string | null;
    estimated_hours: string | number | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
    category: { id: number; name: string; color: string } | null;
    bay: { id: number; code: string; name: string } | null;
    mechanic: { id: number; name: string } | null;
}

interface Props {
    columns: {
        pending: WipCard[];
        approved: WipCard[];
        in_progress: WipCard[];
        waiting_parts: WipCard[];
    };
    doneToday: WipCard[];
    bays: Array<{ id: number; code: string; name: string }>;
    filters: { bay_id: string | null; mechanic_user_id: string | null };
    can: { update: boolean; approve: boolean; assign: boolean };
}

const COLUMN_META: Array<{ key: keyof Props['columns']; labelKey: string; icon: string; headerBg: string; border: string }> = [
    { key: 'pending', labelKey: 'maintenance.wip.col_pending', icon: '⏳', headerBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-slate-900' },
    { key: 'approved', labelKey: 'maintenance.wip.col_approved', icon: '👍', headerBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-blue-200/80 dark:border-blue-900/60 bg-blue-50/20 dark:bg-slate-900' },
    { key: 'in_progress', labelKey: 'maintenance.wip.col_in_progress', icon: '🛠️', headerBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-slate-900' },
    { key: 'waiting_parts', labelKey: 'maintenance.wip.col_waiting_parts', icon: '📦', headerBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', border: 'border-orange-200/80 dark:border-orange-900/60 bg-orange-50/20 dark:bg-slate-900' },
];

export default function Index({ columns, doneToday, bays, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const runAction = (workOrderId: number, action: string, extra: Record<string, string | number | null> = {}) => {
        router.patch(
            prefixedRoute('maintenance.wip.update', workOrderId),
            { action, ...extra },
            { preserveScroll: true },
        );
    };

    const filterBay = (bayId: string) => {
        router.get(
            prefixedRoute('maintenance.wip.index'),
            { bay_id: bayId || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.title', undefined, 'Maintenance')}
                    subtitle="Shop Floor WIP Kanban Board — Drag, track, and assign work orders in real-time"
                    actions={
                        <div className="w-56">
                            <Select
                                className="w-full text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                                value={filters.bay_id ? String(filters.bay_id) : ''}
                                onChange={filterBay}
                                options={[
                                    { value: '', label: t('maintenance.wip.all_bays', undefined, 'All Workshop Bays') },
                                    ...bays.map((bay) => ({
                                        value: String(bay.id),
                                        label: `${bay.code} — ${bay.name}`,
                                    })),
                                ]}
                            />
                        </div>
                    }
                />
            }
        >
            <Head title={t('maintenance.wip.head', undefined, 'Shop Floor WIP Board')} />
            <MaintenanceNav />

            {/* Kanban Columns */}
            <div className="grid gap-4 lg:grid-cols-4">
                {COLUMN_META.map((col) => (
                    <div key={col.key} className={`rounded-3xl border ${col.border} p-4 shadow-sm flex flex-col justify-between`}>
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <div className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-black ${col.headerBg}`}>
                                    <span>{col.icon}</span>
                                    <span>{t(col.labelKey, undefined, col.key)}</span>
                                </div>
                                <span className="rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 shadow-sm">
                                    {columns[col.key].length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {columns[col.key].length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs font-semibold text-slate-400">
                                        {t('maintenance.wip.empty_column', undefined, 'No work orders in this stage.')}
                                    </div>
                                ) : (
                                    columns[col.key].map((card) => {
                                        const priority = getPriorityBadge(card.priority as 'low' | 'normal' | 'high' | 'urgent', t);
                                        return (
                                            <div
                                                key={card.id}
                                                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <Link
                                                        href={prefixedRoute('maintenance.work-orders.show', card.id)}
                                                        className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                    >
                                                        {card.reference_number}
                                                    </Link>
                                                    <span className={`rounded-lg px-2 py-0.5 text-[9px] font-extrabold border ${priority.classes}`}>
                                                        {priority.label}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{card.title}</p>

                                                <div className="mt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                    🚗 {card.vehicle ? `${card.vehicle.plate_number} · ${card.vehicle.name}` : '—'}
                                                </div>

                                                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-semibold text-slate-500">
                                                    {card.bay && (
                                                        <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5">
                                                            🏗️ {card.bay.code}
                                                        </span>
                                                    )}
                                                    {card.mechanic && (
                                                        <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5">
                                                            👨‍🔧 {card.mechanic.name}
                                                        </span>
                                                    )}
                                                    {card.scheduled_date && (
                                                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5">
                                                            📅 {formatDate(card.scheduled_date, localeTag)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                                                    {col.key === 'pending' && (can.approve || can.update) && (
                                                        <PrimaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl shadow-xs" onClick={() => runAction(card.id, 'approve')}>
                                                            ✓ {t('maintenance.work_orders.progress.approve', undefined, 'Approve')}
                                                        </PrimaryButton>
                                                    )}
                                                    {col.key === 'approved' && can.update && (
                                                        <PrimaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl shadow-xs" onClick={() => runAction(card.id, 'start')}>
                                                            ▶ {t('maintenance.work_orders.progress.start', undefined, 'Start Work')}
                                                        </PrimaryButton>
                                                    )}
                                                    {col.key === 'in_progress' && can.update && (
                                                        <>
                                                            <SecondaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl" onClick={() => runAction(card.id, 'waiting_parts')}>
                                                                📦 {t('maintenance.wip.waiting_parts', undefined, 'Waiting Parts')}
                                                            </SecondaryButton>
                                                            <PrimaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl shadow-xs" onClick={() => runAction(card.id, 'complete')}>
                                                                ✓ {t('maintenance.work_orders.progress.complete', undefined, 'Complete')}
                                                            </PrimaryButton>
                                                        </>
                                                    )}
                                                    {col.key === 'waiting_parts' && can.update && (
                                                        <>
                                                            <SecondaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl" onClick={() => runAction(card.id, 'resume')}>
                                                                ▶ {t('maintenance.wip.resume', undefined, 'Resume')}
                                                            </SecondaryButton>
                                                            <PrimaryButton className="!px-2.5 !py-1 text-[10px] !rounded-xl shadow-xs" onClick={() => runAction(card.id, 'complete')}>
                                                                ✓ {t('maintenance.work_orders.progress.complete', undefined, 'Complete')}
                                                            </PrimaryButton>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed Today Section */}
            {doneToday.length > 0 && (
                <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h3 className="mb-3 text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>✅</span> {t('maintenance.wip.done_today', undefined, 'Completed Today')}
                    </h3>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {doneToday.map((card) => (
                            <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs font-semibold">
                                <div className="flex items-center gap-3">
                                    <Link href={prefixedRoute('maintenance.work-orders.show', card.id)} className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                        {card.reference_number}
                                    </Link>
                                    <span className="text-slate-800 dark:text-slate-200">{card.title}</span>
                                </div>
                                <span className="font-mono text-slate-400">{card.vehicle?.plate_number}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </DynamicLayout>
    );
}

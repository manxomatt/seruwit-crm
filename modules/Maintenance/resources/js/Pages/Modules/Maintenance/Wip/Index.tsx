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

const COLUMN_META: Array<{ key: keyof Props['columns']; labelKey: string; tone: string }> = [
    { key: 'pending', labelKey: 'maintenance.wip.col_pending', tone: 'border-amber-300 bg-amber-50/40' },
    { key: 'approved', labelKey: 'maintenance.wip.col_approved', tone: 'border-blue-300 bg-blue-50/40' },
    { key: 'in_progress', labelKey: 'maintenance.wip.col_in_progress', tone: 'border-indigo-300 bg-indigo-50/40' },
    { key: 'waiting_parts', labelKey: 'maintenance.wip.col_waiting_parts', tone: 'border-orange-300 bg-orange-50/40' },
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
        <DynamicLayout>
            <Head title={t('maintenance.wip.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                    <MaintenanceNav />
                    <PageHeader
                        title={t('maintenance.wip.head')}
                        description={t('maintenance.wip.subtitle')}
                        actions={
                            <div className="w-48">
                                <Select
                                    className="w-full"
                                    value={filters.bay_id ? String(filters.bay_id) : ''}
                                    onChange={filterBay}
                                    options={[
                                        { value: '', label: t('maintenance.wip.all_bays') },
                                        ...bays.map((bay) => ({
                                            value: String(bay.id),
                                            label: `${bay.code} — ${bay.name}`,
                                        })),
                                    ]}
                                />
                            </div>
                        }
                    />

                    <div className="mt-6 grid gap-4 lg:grid-cols-4">
                        {COLUMN_META.map((col) => (
                            <div key={col.key} className={`rounded-xl border ${col.tone} p-3`}>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">{t(col.labelKey)}</h3>
                                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs tabular-nums text-gray-600">
                                        {columns[col.key].length}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {columns[col.key].length === 0 ? (
                                        <p className="px-1 py-6 text-center text-xs text-gray-400">{t('maintenance.wip.empty_column')}</p>
                                    ) : (
                                        columns[col.key].map((card) => {
                                            const priority = getPriorityBadge(card.priority as 'low' | 'normal' | 'high' | 'urgent', t);
                                            return (
                                                <div key={card.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <Link
                                                                href={prefixedRoute('maintenance.work-orders.show', card.id)}
                                                                className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                                                            >
                                                                {card.reference_number}
                                                            </Link>
                                                            <p className="mt-0.5 text-sm text-gray-900">{card.title}</p>
                                                        </div>
                                                        <span className={`rounded px-1.5 py-0.5 text-[10px] ${priority.classes}`}>{priority.label}</span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-gray-600">
                                                        {card.vehicle
                                                            ? `${card.vehicle.plate_number} · ${card.vehicle.name}`
                                                            : '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {[card.bay ? `${card.bay.code}` : null, card.mechanic?.name, formatDate(card.scheduled_date, localeTag)]
                                                            .filter(Boolean)
                                                            .join(' · ') || t('maintenance.wip.unassigned')}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {col.key === 'pending' && (can.approve || can.update) && (
                                                            <PrimaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'approve')}>
                                                                {t('maintenance.work_orders.progress.approve')}
                                                            </PrimaryButton>
                                                        )}
                                                        {col.key === 'approved' && can.update && (
                                                            <PrimaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'start')}>
                                                                {t('maintenance.work_orders.progress.start')}
                                                            </PrimaryButton>
                                                        )}
                                                        {col.key === 'in_progress' && can.update && (
                                                            <>
                                                                <SecondaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'waiting_parts')}>
                                                                    {t('maintenance.wip.waiting_parts')}
                                                                </SecondaryButton>
                                                                <PrimaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'complete')}>
                                                                    {t('maintenance.work_orders.progress.complete')}
                                                                </PrimaryButton>
                                                            </>
                                                        )}
                                                        {col.key === 'waiting_parts' && can.update && (
                                                            <>
                                                                <SecondaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'resume')}>
                                                                    {t('maintenance.wip.resume')}
                                                                </SecondaryButton>
                                                                <PrimaryButton className="!px-2 !py-1 text-xs" onClick={() => runAction(card.id, 'complete')}>
                                                                    {t('maintenance.work_orders.progress.complete')}
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
                        ))}
                    </div>

                    {doneToday.length > 0 && (
                        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('maintenance.wip.done_today')}</h3>
                            <ul className="divide-y divide-gray-100">
                                {doneToday.map((card) => (
                                    <li key={card.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                        <Link href={prefixedRoute('maintenance.work-orders.show', card.id)} className="font-medium text-indigo-700 hover:text-indigo-900">
                                            {card.reference_number}
                                        </Link>
                                        <span className="text-gray-700">{card.title}</span>
                                        <span className="text-gray-500">{card.vehicle?.plate_number}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

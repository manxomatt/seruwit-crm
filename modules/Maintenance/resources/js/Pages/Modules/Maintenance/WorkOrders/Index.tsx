import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    WorkOrder,
    WorkOrderVehicle,
    formatCurrency,
    formatDate,
    getPriorityBadge,
    getStatusBadge,
    getTypeBadge,
    priorityOptions,
    statusOptions,
} from '../../../../maintenanceUtils';

interface PaginatedWorkOrders {
    data: WorkOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
    priority: string | null;
    vehicle_id: string | null;
}

interface Props {
    workOrders: PaginatedWorkOrders;
    vehicles: WorkOrderVehicle[];
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean; approve: boolean };
}

const EyeIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function Index({ workOrders, vehicles, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deletingWo, setDeletingWo] = useState<WorkOrder | null>(null);
    const [processing, setProcessing] = useState(false);

    const kpiStats = useMemo(() => {
        const data = workOrders.data;
        let inProgressCount = 0;
        let pendingCount = 0;
        let totalEstCost = 0;

        data.forEach((wo) => {
            if (wo.status === 'in_progress') inProgressCount++;
            if (wo.status === 'draft' || wo.status === 'pending_approval') pendingCount++;
            totalEstCost += Number(wo.estimated_cost ?? 0);
        });

        return {
            total: workOrders.total,
            inProgress: inProgressCount,
            pending: pendingCount,
            totalEstimatedCost: totalEstCost,
        };
    }, [workOrders]);

    const applyFilters = (overrides: Partial<Filters> = {}): void => {
        const merged = { ...filters, search: search || undefined, ...overrides };
        router.get(prefixedRoute('maintenance.work-orders.index'), merged as Record<string, string>, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const clearFilters = (): void => {
        setSearch('');
        router.get(prefixedRoute('maintenance.work-orders.index'), {}, { preserveState: true, replace: true });
    };

    const confirmDelete = (): void => {
        if (!deletingWo) return;
        setProcessing(true);
        router.delete(prefixedRoute('maintenance.work-orders.destroy', deletingWo.id), {
            onSuccess: () => setDeletingWo(null),
            onFinish: () => setProcessing(false),
        });
    };

    const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority || filters.vehicle_id);

    const kpiCards = [
        { label: 'Total SPK Maintenance', value: kpiStats.total.toString(), icon: '📋', color: 'indigo' },
        { label: 'Sedang Dikerjakan', value: kpiStats.inProgress.toString(), icon: '⚙️', color: 'amber' },
        { label: 'Draft / Menunggu Approval', value: kpiStats.pending.toString(), icon: '⏳', color: 'sky' },
        { label: 'Total Estimasi Biaya', value: formatCurrency(kpiStats.totalEstimatedCost, localeTag), icon: '💰', color: 'emerald' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Surat Perintah Kerja (SPK) Maintenance"
                    subtitle="Kelola SPK perbaikan armada, estimasi biaya, alokasi mekanik & status pengerjaan."
                    actions={
                        can.create && (
                            <Link href={prefixedRoute('maintenance.work-orders.create')}>
                                <PrimaryButton className="rounded-2xl text-xs font-black shadow-md">
                                    ＋ Buat SPK Baru
                                </PrimaryButton>
                            </Link>
                        )
                    }
                />
            }
        >
            <Head title="Work Orders · Maintenance" />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {kpiCards.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white truncate">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Toolbar & Filters */}
                    <div className="border-b border-slate-100 p-5 dark:border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[280px]">
                                <div className="relative flex-1">
                                    <TextInput
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari nomor SPK, judul pekerjaan..."
                                        className="w-full !rounded-2xl !py-1.5 pl-9 text-xs shadow-2xs"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">
                                        🔍
                                    </span>
                                </div>
                                <PrimaryButton type="submit" className="rounded-2xl text-xs font-black shadow-2xs">
                                    Cari
                                </PrimaryButton>
                            </form>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    className="w-40 !py-1.5 text-xs"
                                    value={filters.status ?? ''}
                                    onChange={(val) => applyFilters({ status: val || undefined })}
                                    placeholder="Semua Status"
                                    options={[
                                        { value: '', label: 'Semua Status' },
                                        ...statusOptions(t),
                                    ]}
                                />

                                <Select
                                    className="w-36 !py-1.5 text-xs"
                                    value={filters.priority ?? ''}
                                    onChange={(val) => applyFilters({ priority: val || undefined })}
                                    placeholder="Semua Prioritas"
                                    options={[
                                        { value: '', label: 'Semua Prioritas' },
                                        ...priorityOptions(t),
                                    ]}
                                />

                                <Select
                                    className="w-56 !py-1.5 text-xs"
                                    value={filters.vehicle_id ?? ''}
                                    onChange={(val) => applyFilters({ vehicle_id: val || undefined })}
                                    searchable
                                    placeholder="Semua Kendaraan"
                                    options={[
                                        { value: '', label: 'Semua Kendaraan' },
                                        ...vehicles.map((v) => ({
                                            value: String(v.id),
                                            label: `${v.name} — ${v.plate_number}`,
                                        })),
                                    ]}
                                />

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        ✕ Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    {workOrders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="text-4xl">📋</span>
                            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Tidak Ada SPK Ditemukan</h3>
                            <p className="mt-1 text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter status pekerjaan.</p>
                            {can.create && (
                                <Link
                                    href={prefixedRoute('maintenance.work-orders.create')}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-indigo-700"
                                >
                                    ＋ Buat SPK Baru
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80 text-[10px] font-black uppercase text-slate-400">
                                        <th className="px-6 py-3 text-left">No. Referensi SPK</th>
                                        <th className="px-6 py-3 text-left">Kendaraan</th>
                                        <th className="px-6 py-3 text-left">Pekerjaan & Prioritas</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">Jadwal Servis</th>
                                        <th className="px-6 py-3 text-left">Estimasi Biaya</th>
                                        <th className="w-24 px-6 py-3 text-right"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {workOrders.data.map((wo) => {
                                        const statusBadge = getStatusBadge(wo.status, t);
                                        const priorityBadge = getPriorityBadge(wo.priority, t);
                                        const typeBadge = getTypeBadge(wo.type, t);

                                        return (
                                            <tr key={wo.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors">
                                                <td className="whitespace-nowrap px-6 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: wo.category?.color ?? '#6B7280' }}
                                                        />
                                                        <Link
                                                            href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                            className="font-mono font-black text-indigo-600 hover:underline dark:text-indigo-400"
                                                        >
                                                            {wo.reference_number}
                                                        </Link>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3.5">
                                                    {wo.vehicle ? (
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.show', wo.vehicle.id)}
                                                            className="font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                        >
                                                            {wo.vehicle.name}
                                                            <p className="font-mono text-[10px] text-slate-400">{wo.vehicle.plate_number}</p>
                                                        </Link>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>

                                                <td className="px-6 py-3.5 max-w-xs">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{wo.title}</p>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityBadge.classes}`}>
                                                            {priorityBadge.label}
                                                        </span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeBadge.classes}`}>
                                                            {typeBadge.label}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-3.5">
                                                    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-black ${statusBadge.classes}`}>
                                                        {statusBadge.label}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                                                    📅 {formatDate(wo.scheduled_date, localeTag)}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(wo.estimated_cost, localeTag)}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                                            title="Lihat Detail"
                                                        >
                                                            <EyeIcon />
                                                        </Link>
                                                        {can.update && (
                                                            <Link
                                                                href={prefixedRoute('maintenance.work-orders.edit', wo.id)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                                title="Edit SPK"
                                                            >
                                                                <PencilIcon />
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingWo(wo)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400"
                                                                title="Hapus SPK"
                                                            >
                                                                <TrashIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {workOrders.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                            <p className="text-xs text-slate-400">
                                Menampilkan {(workOrders.current_page - 1) * workOrders.per_page + 1}–{Math.min(workOrders.current_page * workOrders.per_page, workOrders.total)} dari {workOrders.total} SPK
                            </p>
                            <div className="flex gap-1">
                                {workOrders.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${link.active ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : link.url ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'cursor-not-allowed text-slate-300 dark:text-slate-600'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={!!deletingWo}
                title="Hapus Surat Perintah Kerja"
                message={`Apakah Anda yakin ingin menghapus SPK ${deletingWo?.reference_number ?? ''} - ${deletingWo?.title ?? ''}?`}
                processing={processing}
                onConfirm={confirmDelete}
                onClose={() => setDeletingWo(null)}
            />
        </DynamicLayout>
    );
}

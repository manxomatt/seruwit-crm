import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    ItemType,
    WorkOrder,
    WorkOrderChecklistItem,
    WorkOrderItem,
    formatCurrency,
    formatDate,
    formatDateTime,
    getPriorityBadge,
    getStatusBadge,
    getTypeBadge,
} from '../../../../maintenanceUtils';

interface Props {
    workOrder: WorkOrder & { actual_total_cost: number | null };
    can: { update: boolean; delete: boolean; approve: boolean; assign?: boolean };
}

type ProgressAction = {
    status: string;
    labelKey: string;
    needsApprove?: boolean;
    buttonClass?: string;
    icon?: string;
};

const NEXT_PROGRESS: Record<string, ProgressAction | null> = {
    draft: {
        status: 'pending',
        labelKey: 'submit',
        icon: '📤',
        buttonClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20',
    },
    pending: {
        status: 'approved',
        labelKey: 'approve',
        needsApprove: true,
        icon: '✅',
        buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
    },
    approved: {
        status: 'in_progress',
        labelKey: 'start',
        icon: '🚀',
        buttonClass: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20',
    },
    in_progress: {
        status: 'completed',
        labelKey: 'complete',
        icon: '🎉',
        buttonClass: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md shadow-emerald-500/20',
    },
    completed: null,
    cancelled: null,
};

const STATUS_STEPS = [
    { key: 'draft', label: 'Draft / Dibuat', icon: '📝' },
    { key: 'pending', label: 'Menunggu Persetujuan', icon: '⏳' },
    { key: 'approved', label: 'Disetujui', icon: '✅' },
    { key: 'in_progress', label: 'Dalam Pengerjaan', icon: '🔧' },
    { key: 'completed', label: 'Selesai', icon: '🏁' },
];

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PrinterIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const EditIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export default function Show({ workOrder: wo, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const checklistForm = useForm({ label: '' });

    const statusBadge = getStatusBadge(wo.status, t);
    const priorityBadge = getPriorityBadge(wo.priority, t);
    const typeBadge = getTypeBadge(wo.type, t);

    const nextProgress = NEXT_PROGRESS[wo.status] ?? null;
    const canAdvance =
        nextProgress !== null &&
        (nextProgress.needsApprove ? can.approve || can.update : can.update);
    const canCancel =
        can.update && !['completed', 'cancelled'].includes(wo.status);

    const confirmDelete = (): void => {
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.work-orders.destroy', wo.id), {
            onSuccess: () => setShowDeleteDialog(false),
            onFinish: () => setDeleting(false),
        });
    };

    const updateStatus = (status: string): void => {
        setUpdatingStatus(true);
        router.patch(
            prefixedRoute('maintenance.work-orders.update-status', wo.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingStatus(false),
            },
        );
    };

    const checklistItems = wo.checklist_items ?? [];
    const checklistDone = checklistItems.filter((item) => item.is_done).length;
    const checklistPercent = checklistItems.length > 0
        ? Math.round((checklistDone / checklistItems.length) * 100)
        : 0;

    const addChecklistItem: FormEventHandler = (e) => {
        e.preventDefault();
        checklistForm.post(prefixedRoute('maintenance.work-orders.checklist.store', wo.id), {
            preserveScroll: true,
            onSuccess: () => checklistForm.reset('label'),
        });
    };

    const toggleChecklistItem = (item: WorkOrderChecklistItem): void => {
        router.patch(
            prefixedRoute('maintenance.work-orders.checklist.update', [wo.id, item.id]),
            { is_done: !item.is_done },
            { preserveScroll: true },
        );
    };

    const deleteChecklistItem = (item: WorkOrderChecklistItem): void => {
        router.delete(prefixedRoute('maintenance.work-orders.checklist.destroy', [wo.id, item.id]), {
            preserveScroll: true,
        });
    };

    const partItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'part') ?? [];
    const laborItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'labor') ?? [];
    const otherItems = wo.items?.filter((i: WorkOrderItem) => i.item_type === 'other') ?? [];

    const totalParts = partItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalLabor = laborItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const totalOther = otherItems.reduce((s: number, i: WorkOrderItem) => s + Number(i.total_price), 0);
    const grandTotal = totalParts + totalLabor + totalOther;

    const itemGroups: { type: ItemType; label: string; icon: string; items: WorkOrderItem[]; total: number }[] = [
        { type: 'part', label: 'Sparepart & Suku Cadang', icon: '🔩', items: partItems, total: totalParts },
        { type: 'labor', label: 'Jasa & Ongkos Pengerjaan', icon: '👨‍🔧', items: laborItems, total: totalLabor },
        { type: 'other', label: 'Biaya Tambahan Lainnya', icon: '📦', items: otherItems, total: totalOther },
    ];

    // Status Stepper Index
    const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === wo.status);
    const isCancelled = wo.status === 'cancelled';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={wo.title}
                    subtitle={`No. SPK: ${wo.reference_number}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Advance Status Button */}
                            {canAdvance && nextProgress && (
                                <button
                                    type="button"
                                    disabled={updatingStatus}
                                    onClick={() => updateStatus(nextProgress.status)}
                                    className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black transition disabled:opacity-50 ${nextProgress.buttonClass ?? 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                    <span>{nextProgress.icon}</span>
                                    <span>
                                        {updatingStatus
                                            ? t('maintenance.actions.saving', undefined, 'Menyimpan...')
                                            : t(`maintenance.work_orders.progress.${nextProgress.labelKey}`, undefined, nextProgress.labelKey)}
                                    </span>
                                </button>
                            )}

                            {/* Print Job Card */}
                            <a
                                href={prefixedRoute('maintenance.work-orders.job-card', wo.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <PrinterIcon />
                                <span>Print Job Card</span>
                            </a>

                            {/* Edit */}
                            {can.update && (
                                <Link
                                    href={prefixedRoute('maintenance.work-orders.edit', wo.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    <EditIcon />
                                    <span>Edit SPK</span>
                                </Link>
                            )}

                            {/* Cancel */}
                            {canCancel && (
                                <button
                                    type="button"
                                    disabled={updatingStatus}
                                    onClick={() => updateStatus('cancelled')}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                                >
                                    <span>🚫 Batalkan</span>
                                </button>
                            )}

                            {/* Back */}
                            <Link
                                href={prefixedRoute('maintenance.work-orders.index')}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Kembali
                            </Link>

                            {/* Delete */}
                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                    <TrashIcon />
                                    <span>Hapus</span>
                                </button>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={`SPK ${wo.reference_number} — ${wo.title}`} />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">Fleet</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('maintenance.work-orders.index')} className="hover:text-slate-700 dark:hover:text-slate-200">Maintenance & Work Orders</Link>
                    <span>/</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{wo.reference_number}</span>
                </nav>

                {/* Hero Header & Workflow Stepper Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                    {/* Top Identity Row */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Reference Number Badge */}
                            <span className="rounded-xl bg-slate-900 px-3 py-1 font-mono text-xs font-black text-white dark:bg-slate-200 dark:text-slate-900">
                                {wo.reference_number}
                            </span>

                            {/* Category Badge */}
                            {wo.category && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white"
                                    style={{ backgroundColor: `${wo.category.color}25` }}
                                >
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: wo.category.color }} />
                                    {wo.category.name}
                                </span>
                            )}

                            {/* Priority Badge */}
                            <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${priorityBadge.classes}`}>
                                Priority: {priorityBadge.label}
                            </span>

                            {/* Type Badge */}
                            <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${typeBadge.classes}`}>
                                {typeBadge.label}
                            </span>

                            {/* Waiting Parts Badge */}
                            {wo.waiting_parts && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    <span>⏳</span>
                                    <span>Menunggu Sparepart</span>
                                </span>
                            )}
                        </div>

                        {/* Created & Scheduled date pill */}
                        <div className="text-right text-xs text-slate-400">
                            <span>Jadwal: </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {wo.scheduled_date ? formatDate(wo.scheduled_date, localeTag) : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{wo.title}</h1>
                        {wo.description && (
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
                                {wo.description}
                            </p>
                        )}
                    </div>

                    {/* Workflow Stepper Bar */}
                    <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                        {isCancelled ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🚫</span>
                                    <div>
                                        <p className="text-xs font-black text-rose-800 dark:text-rose-300">Surat Perintah Kerja Dibatalkan</p>
                                        <p className="text-[11px] text-rose-600 dark:text-rose-400">SPK ini dalam status dibatalkan dan tidak lagi diproses.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Status Pipeline Workflow</p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = currentStepIdx > idx || wo.status === 'completed';
                                        const isCurrent = currentStepIdx === idx && wo.status !== 'completed';

                                        return (
                                            <div
                                                key={step.key}
                                                className={`relative flex flex-col items-center rounded-2xl p-3 text-center transition ${
                                                    isCurrent
                                                        ? 'border-2 border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                        : isCompleted
                                                            ? 'border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                                            : 'border border-slate-200/60 bg-slate-50/40 opacity-60 dark:border-slate-800 dark:bg-slate-850'
                                                }`}
                                            >
                                                <span className="text-base mb-1">{step.icon}</span>
                                                <span className={`text-[11px] font-black ${
                                                    isCurrent
                                                        ? 'text-indigo-900 dark:text-indigo-200'
                                                        : isCompleted
                                                            ? 'text-emerald-900 dark:text-emerald-200'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                    {step.label}
                                                </span>
                                                {isCompleted && (
                                                    <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500 p-0.5 text-[9px] text-white">✓</span>
                                                )}
                                                {isCurrent && (
                                                    <span className="mt-1 animate-pulse rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold text-white">Aktif</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI Stat Cards Grid */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 lg:grid-cols-4 dark:border-slate-800">
                        {/* Vehicle */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kendaraan Terkait</p>
                            <p className="mt-1 font-mono text-base font-black text-indigo-600 dark:text-indigo-400">
                                {wo.vehicle?.plate_number ?? '—'}
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{wo.vehicle?.name ?? '—'}</p>
                        </div>

                        {/* Cost */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Biaya SPK</p>
                            <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                {formatCurrency(wo.actual_total_cost ?? grandTotal, localeTag)}
                            </p>
                            {wo.estimated_cost && (
                                <p className="text-[10px] text-slate-400">
                                    Est: {formatCurrency(wo.estimated_cost, localeTag)}
                                </p>
                            )}
                        </div>

                        {/* Hours */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Durasi Jam Kerja</p>
                            <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                {wo.actual_hours ? `${wo.actual_hours} Jam` : wo.estimated_hours ? `${wo.estimated_hours} Jam (Est)` : '—'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {wo.service_location === 'outsource' ? 'Outsource / Bengkel Luar' : 'In-House Bengkel Internal'}
                            </p>
                        </div>

                        {/* Checklist progress */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Checklist Inspeksi</p>
                            <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                {checklistDone} / {checklistItems.length} Selesai
                            </p>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${checklistPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2-Column Details Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column (8 cols): Checklist, Spareparts & Labor Items, Resolution */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Checklist Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">📋</span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">Checklist Tugas & Inspeksi Quality Control</h3>
                                        <p className="text-xs text-slate-400">Daftar item inspeksi dan pengerjaan teknis yang perlu diselesaikan.</p>
                                    </div>
                                </div>
                                <span className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {checklistDone} / {checklistItems.length} ({checklistPercent}%)
                                </span>
                            </div>

                            <div className="mt-4">
                                {checklistItems.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">Belum ada item checklist dibuat.</p>
                                ) : (
                                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {checklistItems.map((item) => (
                                            <li key={item.id} className="flex items-center justify-between py-3 gap-3">
                                                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.is_done}
                                                        disabled={!can.update}
                                                        onChange={() => toggleChecklistItem(item)}
                                                        className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 shadow-2xs focus:ring-indigo-500 disabled:opacity-50"
                                                    />
                                                    <span className={`text-xs font-bold transition ${item.is_done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                        {item.label}
                                                    </span>
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    {item.is_done && (
                                                        <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            ✓ Selesai
                                                        </span>
                                                    )}
                                                    {can.update && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteChecklistItem(item)}
                                                            className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Add Checklist Form */}
                                {can.update && (
                                    <form onSubmit={addChecklistItem} className="mt-4 flex gap-2">
                                        <TextInput
                                            className="block w-full !rounded-2xl !py-2 text-xs"
                                            value={checklistForm.data.label}
                                            placeholder="Tambah item checklist pekerjaan baru..."
                                            onChange={(e) => checklistForm.setData('label', e.target.value)}
                                        />
                                        <PrimaryButton
                                            disabled={checklistForm.processing || !checklistForm.data.label.trim()}
                                            className="rounded-2xl text-xs whitespace-nowrap"
                                        >
                                            Tambah
                                        </PrimaryButton>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Rincian Sparepart & Jasa */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🧰</span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">Rincian Sparepart, Jasa & Material</h3>
                                        <p className="text-xs text-slate-400">Daftar item biaya suku cadang, ongkos kerja mekanik, dan biaya pendukung SPK.</p>
                                    </div>
                                </div>
                            </div>

                            {wo.items && wo.items.length > 0 ? (
                                <div className="space-y-6">
                                    {itemGroups.filter((g) => g.items.length > 0).map((group) => (
                                        <div key={group.type} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/50">
                                            <div className="flex items-center justify-between border-b border-slate-200/60 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                                                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    <span>{group.icon}</span>
                                                    <span>{group.label}</span>
                                                </span>
                                                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Subtotal: {formatCurrency(group.total, localeTag)}
                                                </span>
                                            </div>
                                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                                <thead>
                                                    <tr className="text-[10px] font-black uppercase text-slate-400">
                                                        <th className="px-4 py-2.5 text-left">Deskripsi Item</th>
                                                        <th className="px-4 py-2.5 text-right">Qty</th>
                                                        <th className="px-4 py-2.5 text-right">Satuan</th>
                                                        <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                                                        <th className="px-4 py-2.5 text-right">Total Harga</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {group.items.map((item: WorkOrderItem) => (
                                                        <tr key={item.id} className="hover:bg-white/60 dark:hover:bg-slate-800/60">
                                                            <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                                                            <td className="px-4 py-2.5 text-right text-slate-400">{item.unit ?? '—'}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrency(item.unit_price, localeTag)}</td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(item.total_price, localeTag)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}

                                    {/* Grand Total Footer */}
                                    <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-4 text-white dark:bg-slate-800">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Akumulasi Biaya Item</p>
                                            <p className="text-xs text-slate-300">Rincian gabungan sparepart, jasa, dan biaya pendukung</p>
                                        </div>
                                        <p className="font-mono text-2xl font-black text-emerald-400">
                                            {formatCurrency(grandTotal, localeTag)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="py-8 text-center text-xs text-slate-400">Belum ada item rincian sparepart atau jasa ditambahkan ke SPK ini.</p>
                            )}
                        </div>

                        {/* Resolution Notes Card */}
                        {wo.resolution_notes && (
                            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">✅</span>
                                    <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">Catatan Penyelesaian & Hasil Pengerjaan</h3>
                                </div>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 whitespace-pre-line leading-relaxed">
                                    {wo.resolution_notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column (4 cols): Vehicle Info, Workshop/Bengkel, Timeline, Cost Summary, Notes */}
                    <div className="space-y-6 lg:col-span-4">
                        {/* Vehicle Details Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🚘</span>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Kendaraan Terkait</h3>
                                </div>
                                {wo.vehicle_id && (
                                    <Link
                                        href={prefixedRoute('fleet.vehicles.show', wo.vehicle_id)}
                                        className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        Profil →
                                    </Link>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                    <span className="rounded-lg bg-indigo-100 px-2 py-0.5 font-mono text-xs font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                        {wo.vehicle?.plate_number ?? '—'}
                                    </span>
                                    <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">{wo.vehicle?.name ?? '—'}</p>
                                </div>

                                {wo.odometer_at_service && (
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-850 text-xs">
                                        <span className="text-slate-400">Odometer Servis:</span>
                                        <span className="font-mono font-black text-slate-900 dark:text-white">
                                            {new Intl.NumberFormat(localeTag).format(wo.odometer_at_service)} km
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bengkel & Teknisi */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">🏭</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Lokasi & Teknisi SPK</h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Lokasi Servis:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${wo.service_location === 'outsource' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                                            {wo.service_location === 'outsource' ? 'Outsource / Bengkel Luar' : 'In-House Internal'}
                                        </span>
                                    </dd>
                                </div>

                                {(wo.vendor_partner || wo.vendor_name) && (
                                    <div className="flex items-center justify-between py-2.5">
                                        <dt className="text-slate-400">Vendor / Bengkel:</dt>
                                        <dd className="font-bold text-slate-800 dark:text-slate-200">
                                            {wo.vendor_partner?.name ?? wo.vendor_name}
                                        </dd>
                                    </div>
                                )}

                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Teknisi / Mekanik:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {wo.mechanic?.name ?? wo.mechanic_name ?? '—'}
                                    </dd>
                                </div>

                                {wo.bay && (
                                    <div className="flex items-center justify-between py-2.5">
                                        <dt className="text-slate-400">Bay / Stall Servis:</dt>
                                        <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {wo.bay.code} — {wo.bay.name}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Timeline & Riwayat */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">⏱️</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Timeline & Riwayat Progres</h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Jadwal Servis:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {wo.scheduled_date ? formatDate(wo.scheduled_date, localeTag) : '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Mulai Dikerjakan:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {wo.started_at ? formatDateTime(wo.started_at, localeTag) : '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Selesai Dikerjakan:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {wo.completed_at ? formatDateTime(wo.completed_at, localeTag) : '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Disetujui Oleh:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {wo.approver?.name ?? '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Dibuat Oleh:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {wo.creator?.name ?? '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Cost & Invoice Summary */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">💰</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Rincian Biaya & Faktur</h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                {wo.invoice_number && (
                                    <div className="flex items-center justify-between py-2.5">
                                        <dt className="text-slate-400">Nomor Invoice/Faktur:</dt>
                                        <dd className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{wo.invoice_number}</dd>
                                    </div>
                                )}
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Estimasi Biaya Awal:</dt>
                                    <dd className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(wo.estimated_cost, localeTag)}</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Aktual Biaya Jasa:</dt>
                                    <dd className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(wo.actual_labor_cost, localeTag)}</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-400">Aktual Biaya Sparepart:</dt>
                                    <dd className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(wo.actual_parts_cost, localeTag)}</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="font-black text-slate-900 dark:text-white">Total Biaya Akhir:</dt>
                                    <dd className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                        {formatCurrency(wo.actual_total_cost ?? grandTotal, localeTag)}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Notes */}
                        {wo.notes && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white mb-2">Catatan Tambahan</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">{wo.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                title={t('maintenance.work_orders.delete_title', undefined, 'Hapus Surat Perintah Kerja')}
                message={t('maintenance.work_orders.delete_confirm', {
                    ref: wo.reference_number,
                    title: wo.title,
                })}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setShowDeleteDialog(false)}
            />
        </DynamicLayout>
    );
}

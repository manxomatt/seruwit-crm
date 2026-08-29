import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AiDynamicPricingPanel from '../../../../Components/AiDynamicPricingPanel';
import type { Paginated, Rate, RateTier, Vehicle } from './shared';
import { tierSummaryLabel } from './shared';

interface Props {
    rates: Paginated<Rate>;
    vehicles: Vehicle[];
    rentalClasses: Array<{ value: string; label: string }>;
    aiPricingOptimizerEnabled?: boolean;
    aiPricingAnalyzeUrl?: string;
    aiPricingApplyUrl?: string;
}

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 20.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';
const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50';

export default function RatesIndex({
    rates,
    vehicles: _vehicles,
    rentalClasses: _rentalClasses,
    aiPricingOptimizerEnabled = true,
    aiPricingAnalyzeUrl,
    aiPricingApplyUrl,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [rateToDelete, setRateToDelete] = useState<Rate | null>(null);
    const [previewTierRate, setPreviewTierRate] = useState<Rate | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

    // Client-side quick filter & search
    const [searchQuery, setSearchQuery] = useState('');
    const [periodFilter, setPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filteredRates = useMemo(() => {
        return rates.data.filter((rate) => {
            // Search query
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                const matchName = rate.name.toLowerCase().includes(q);
                const matchVehicle = rate.vehicle?.name.toLowerCase().includes(q) || rate.vehicle?.plate_number.toLowerCase().includes(q);
                const matchClass = rate.rental_class?.toLowerCase().includes(q);
                if (!matchName && !matchVehicle && !matchClass) {
                    return false;
                }
            }

            // Period filter
            if (periodFilter !== 'all' && rate.period_type !== periodFilter) {
                return false;
            }

            // Status filter
            if (statusFilter === 'active' && !rate.is_active) {
                return false;
            }
            if (statusFilter === 'inactive' && rate.is_active) {
                return false;
            }

            return true;
        });
    }, [rates.data, searchQuery, periodFilter, statusFilter]);

    const pageIds = useMemo(() => filteredRates.map((rate) => rate.id), [filteredRates]);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const somePageSelected = pageIds.some((id) => selected.includes(id));

    // Stats KPIs
    const totalCount = rates.total;
    const activeCount = rates.data.filter((r) => r.is_active).length;
    const tieredCount = rates.data.filter((r) => (r.tiers ?? []).length > 0).length;
    const hasAiPanel = Boolean(aiPricingOptimizerEnabled && aiPricingAnalyzeUrl && aiPricingApplyUrl);

    const openDeleteDialog = (rate: Rate): void => {
        setRateToDelete(rate);
    };

    const closeDeleteDialog = (): void => {
        if (deleting) return;
        setRateToDelete(null);
    };

    const confirmDelete = (): void => {
        if (!rateToDelete) return;
        setDeleting(true);
        router.delete(prefixedRoute('rental.rates.destroy', rateToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setRateToDelete(null);
            },
        });
    };

    const toggleRow = (id: number): void => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
    };

    const toggleAllOnPage = (): void => {
        setSelected((prev) => {
            if (allPageSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }
            return Array.from(new Set([...prev, ...pageIds]));
        });
    };

    const clearSelection = (): void => {
        setSelected([]);
    };

    const activateSelected = (): void => {
        if (selected.length === 0) return;
        setProcessing(true);
        router.patch(
            prefixedRoute('rental.rates.batch-status'),
            { ids: selected, is_active: true },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const deactivateSelected = (): void => {
        if (selected.length === 0) return;
        setProcessing(true);
        router.patch(
            prefixedRoute('rental.rates.batch-status'),
            { ids: selected, is_active: false },
            {
                preserveScroll: true,
                onSuccess: () => clearSelection(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    const toggleSingleStatus = (rate: Rate): void => {
        setProcessing(true);
        router.patch(
            prefixedRoute('rental.rates.batch-status'),
            { ids: [rate.id], is_active: !rate.is_active },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const confirmBatchDelete = (): void => {
        if (selected.length === 0) return;
        setProcessing(true);
        router.post(
            prefixedRoute('rental.rates.batch-destroy'),
            { ids: selected },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowBatchDeleteDialog(false);
                    clearSelection();
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
            {/* KPI Stats & Header */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Skema Tarif</p>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                        🏷️
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tarif Aktif</p>
                        <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                        ✓
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Dengan Diskon Bertingkat</p>
                        <p className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">{tieredCount}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-xl font-bold text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                        ⭐
                    </div>
                </div>
            </div>

            {/* Filter Toolbar & Actions */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search & Filters */}
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama tarif, kendaraan, kelas..."
                                className="w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Period Filter Tabs */}
                        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                            {[
                                { key: 'all', label: 'Semua Periode' },
                                { key: 'daily', label: '📅 Harian' },
                                { key: 'weekly', label: '📆 Mingguan' },
                                { key: 'monthly', label: '🗓️ Bulanan' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setPeriodFilter(tab.key as any)}
                                    className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                                        periodFilter === tab.key
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                            {[
                                { key: 'all', label: 'Semua' },
                                { key: 'active', label: 'Aktif' },
                                { key: 'inactive', label: 'Non Aktif' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.key as any)}
                                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                                        statusFilter === tab.key
                                            ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Rate CTA */}
                    <div className="flex items-center gap-2">
                        <Link
                            href={prefixedRoute('rental.rates.create')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
                            <span>{t('rental.actions.new_rate', undefined, 'Buat Tarif Baru')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Floating Selection Bar */}
            {selected.length > 0 && (
                <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-600/95 backdrop-blur-md px-5 py-3 text-white shadow-xl ring-1 ring-indigo-500/50">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-xs font-black">
                            {selected.length}
                        </span>
                        <span>Tarif dipilih</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={activateSelected}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-600 disabled:opacity-50"
                        >
                            ✓ Aktifkan
                        </button>
                        <button
                            type="button"
                            onClick={deactivateSelected}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            ⏸ Nonaktifkan
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBatchDeleteDialog(true)}
                            disabled={processing}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-rose-600 disabled:opacity-50"
                        >
                            <TrashIcon />
                            <span>Hapus ({selected.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={clearSelection}
                            disabled={processing}
                            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                        >
                            ✕ Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Main 2-Column Grid Body: Left Rates Table (8 cols) & Right Sticky AI Optimizer Panel (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left Column: Rates Table */}
                <div className={`${hasAiPanel ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
                    {/* Main Table Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        {filteredRates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <span className="text-4xl mb-3">🏷️</span>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {rates.data.length === 0 ? 'Belum Ada Skema Tarif Rental' : 'Tidak Ditemukan Tarif yang Cocok'}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 max-w-md">
                                    {rates.data.length === 0
                                        ? 'Buat konfigurasi tarif dasar sewa untuk armada harian, mingguan, atau bulanan dengan diskon bertingkat.'
                                        : 'Coba ubah kata kunci pencarian atau sesuaikan filter periode dan status di atas.'}
                                </p>
                                {rates.data.length === 0 && (
                                    <Link
                                        href={prefixedRoute('rental.rates.create')}
                                        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-indigo-700"
                                    >
                                        Buat Tarif Pertama
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                                        <thead>
                                            <tr className="bg-slate-50/80 dark:bg-slate-850/80">
                                                <th className="w-10 px-4 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={allPageSelected}
                                                        ref={(input) => {
                                                            if (input) {
                                                                input.indeterminate = somePageSelected && !allPageSelected;
                                                            }
                                                        }}
                                                        onChange={toggleAllOnPage}
                                                        aria-label={t('common.select_all')}
                                                    />
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Nama Tarif & Diskon
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Cakupan Kendaraan
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Periode
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Harga Sewa
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Jarak & Denda
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Deposit
                                                </th>
                                                <th className="px-4 py-3.5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Status
                                                </th>
                                                <th className="w-24 px-4 py-3.5 text-right font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            {filteredRates.map((rate) => {
                                                const tiers = rate.tiers ?? [];
                                                const activeTiers = tiers.filter((t) => t.is_active);
                                                const periodTiersCount = activeTiers.filter((t) => t.tier_type === 'period_volume').length;
                                                const loyaltyTiersCount = activeTiers.filter((t) => t.tier_type === 'loyalty_count').length;

                                                return (
                                                    <tr
                                                        key={rate.id}
                                                        className={`group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-850/50 ${
                                                            selected.includes(rate.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                                        }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="w-10 px-4 py-3.5">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={selected.includes(rate.id)}
                                                                onChange={() => toggleRow(rate.id)}
                                                                aria-label={t('common.select')}
                                                            />
                                                        </td>

                                                        {/* Nama Tarif & Tier Diskon */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Link
                                                                        href={prefixedRoute('rental.rates.edit', { rate: rate.id })}
                                                                        className="font-black text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                                                    >
                                                                        {rate.name}
                                                                    </Link>
                                                                    {Number(rate.priority) > 0 && (
                                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300" title="Prioritas Overlap">
                                                                            P:{rate.priority}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Tier Badges */}
                                                                {tiers.length > 0 ? (
                                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                                        {periodTiersCount > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPreviewTierRate(rate)}
                                                                                className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200/60 hover:bg-sky-100 transition dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800"
                                                                                title="Lihat rincian Tier Periode Sewa"
                                                                            >
                                                                                <span>📅</span>
                                                                                <span>{periodTiersCount} Tier Durasi</span>
                                                                            </button>
                                                                        )}
                                                                        {loyaltyTiersCount > 0 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setPreviewTierRate(rate)}
                                                                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200/60 hover:bg-amber-100 transition dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800"
                                                                                title="Lihat rincian Tier Pelanggan Loyal"
                                                                            >
                                                                                <span>⭐</span>
                                                                                <span>{loyaltyTiersCount} Tier Loyalty</span>
                                                                            </button>
                                                                        )}
                                                                        {activeTiers.length === 0 && (
                                                                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                                                                                {tiers.length} tier nonaktif
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400">Tarif Flat (Tanpa Diskon Bertingkat)</p>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Cakupan Kendaraan */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            {rate.vehicle ? (
                                                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                    <span>🚗</span>
                                                                    <span>{rate.vehicle.name}</span>
                                                                    <span className="font-mono text-[10px] opacity-75">({rate.vehicle.plate_number})</span>
                                                                </div>
                                                            ) : rate.rental_class ? (
                                                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/60 px-2.5 py-1 text-xs font-bold text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                                                                    <span>🏷️</span>
                                                                    <span>Kelas {rate.rental_class}</span>
                                                                </div>
                                                            ) : rate.vehicle_type ? (
                                                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50/60 px-2.5 py-1 text-xs font-bold text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
                                                                    <span>🚙</span>
                                                                    <span>Tipe {rate.vehicle_type}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                    <span>🌐</span>
                                                                    <span>Semua Armada (Global)</span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Periode */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ${
                                                                    rate.period_type === 'daily'
                                                                        ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300'
                                                                        : rate.period_type === 'weekly'
                                                                            ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300'
                                                                            : 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300'
                                                                }`}
                                                            >
                                                                {rate.period_type === 'daily' ? '📅 Harian' : rate.period_type === 'weekly' ? '📆 Mingguan' : '🗓️ Bulanan'}
                                                            </span>
                                                        </td>

                                                        {/* Harga Sewa */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                                                {formatMoney(rate.rate_per_period)}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">
                                                                per {rate.period_type === 'daily' ? 'hari' : rate.period_type === 'weekly' ? 'minggu' : 'bulan'}
                                                            </span>
                                                        </td>

                                                        {/* Jarak & Denda */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                                {rate.km_limit_per_period ? `${rate.km_limit_per_period} KM / periode` : 'Unlimited KM'}
                                                            </div>
                                                            {Number(rate.excess_km_rate) > 0 && (
                                                                <div className="text-[10px] text-slate-400">
                                                                    Kelebihan: {formatMoney(rate.excess_km_rate)}/KM
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Deposit */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            {Number(rate.deposit_amount) > 0 ? (
                                                                <span className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-2.5 py-1 font-mono text-xs font-black text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300">
                                                                    🛡️ {formatMoney(rate.deposit_amount)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">
                                                                    Tanpa Deposit
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Status Toggle */}
                                                        <td className="whitespace-nowrap px-4 py-3.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSingleStatus(rate)}
                                                                disabled={processing}
                                                                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-black transition ${
                                                                    rate.is_active
                                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                                                }`}
                                                                title="Klik untuk mengubah status aktif"
                                                            >
                                                                <span className={`h-2 w-2 rounded-full ${rate.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                                <span>{rate.is_active ? 'Aktif' : 'Non Aktif'}</span>
                                                            </button>
                                                        </td>

                                                        {/* Aksi */}
                                                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={prefixedRoute('rental.rates.edit', { rate: rate.id })}
                                                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                                    title="Edit Tarif"
                                                                >
                                                                    <PencilIcon />
                                                                    <span>Edit</span>
                                                                </Link>

                                                                <Menu as="div" className="relative inline-block text-left">
                                                                    <MenuButton
                                                                        className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                                        title="Menu Aksi Lainnya"
                                                                    >
                                                                        <EllipsisVerticalIcon />
                                                                    </MenuButton>

                                                                    <MenuItems
                                                                        anchor="bottom end"
                                                                        className="z-30 w-44 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                                                    >
                                                                        {tiers.length > 0 && (
                                                                            <MenuItem>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setPreviewTierRate(rate)}
                                                                                    className={menuItemClassName}
                                                                                >
                                                                                    <span>⭐</span>
                                                                                    <span>Rincian Tier Diskon</span>
                                                                                </button>
                                                                            </MenuItem>
                                                                        )}
                                                                        <MenuItem>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleSingleStatus(rate)}
                                                                                className={menuItemClassName}
                                                                            >
                                                                                <span>{rate.is_active ? '⏸ Nonaktifkan' : '✓ Aktifkan'}</span>
                                                                            </button>
                                                                        </MenuItem>
                                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                        <MenuItem>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openDeleteDialog(rate)}
                                                                                className={menuItemDangerClassName}
                                                                            >
                                                                                <TrashIcon />
                                                                                <span>{t('common.delete', undefined, 'Hapus Tarif')}</span>
                                                                            </button>
                                                                        </MenuItem>
                                                                    </MenuItems>
                                                                </Menu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {rates.last_page > 1 && (
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {t('common.showing_results', {
                                                from: (rates.current_page - 1) * rates.per_page + 1,
                                                to: Math.min(rates.current_page * rates.per_page, rates.total),
                                                total: rates.total,
                                            })}
                                        </p>
                                        <div className="flex gap-1.5">
                                            {rates.links.map((link, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                    disabled={!link.url}
                                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                                        link.active
                                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                                            : link.url
                                                                ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                : 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: AI Smart Dynamic Pricing & Fleet Optimizer Panel */}
                {hasAiPanel && (
                    <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
                        <AiDynamicPricingPanel
                            analyzeUrl={aiPricingAnalyzeUrl!}
                            applyUrl={aiPricingApplyUrl!}
                            canUpdate={true}
                        />
                    </div>
                )}
            </div>

            {/* Modal Preview Tier Pricing */}
            <Dialog
                open={!!previewTierRate}
                onClose={() => setPreviewTierRate(null)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
                                    ⭐ Rincian Tier Diskon & Loyalty
                                </DialogTitle>
                                <p className="text-xs text-slate-500">
                                    {previewTierRate?.name} (Pokok: {previewTierRate ? formatMoney(previewTierRate.rate_per_period) : ''})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewTierRate(null)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {(previewTierRate?.tiers ?? []).map((tier: RateTier, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-850"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {tier.tier_type === 'period_volume' ? '📅 Tier Durasi Sewa' : '⭐ Tier Customer Loyalty'}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Batas:{' '}
                                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    {tier.min_threshold}{tier.max_threshold ? ` - ${tier.max_threshold}` : '+'} {tier.tier_type === 'period_volume' ? 'periode' : 'rental selesai'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="rounded-xl bg-indigo-50 px-2.5 py-1 font-mono text-xs font-black text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                            {tierSummaryLabel(tier)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Link
                                href={previewTierRate ? prefixedRoute('rental.rates.edit', { rate: previewTierRate.id }) : '#'}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-indigo-700"
                            >
                                <PencilIcon />
                                <span>Edit Skema Ini</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setPreviewTierRate(null)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                Tutup
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            <ConfirmDeleteDialog
                show={!!rateToDelete}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={deleting}
                title={t('rental.pages.rates.delete_title', undefined, 'Hapus Tarif Rental')}
                message={
                    rateToDelete
                        ? t('rental.pages.rates.delete_confirm', { name: rateToDelete.name }, `Apakah Anda yakin ingin menghapus tarif "${rateToDelete.name}"?`)
                        : undefined
                }
            />

            <ConfirmDeleteDialog
                show={showBatchDeleteDialog}
                onClose={() => !processing && setShowBatchDeleteDialog(false)}
                onConfirm={confirmBatchDelete}
                processing={processing}
                title={t('rental.pages.rates.batch_delete_title', undefined, 'Hapus Banyak Tarif Sekaligus')}
                message={
                    selected.length > 0
                        ? t('rental.pages.rates.batch_delete_confirm', { count: selected.length }, `Anda akan menghapus ${selected.length} tarif sekaligus. Data yang sudah dipakai oleh transaksi aktif tidak akan terhapus.`)
                        : undefined
                }
            />
        </div>
    );
}

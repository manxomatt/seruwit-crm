import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import Select, { type SelectOption } from '@/Components/Select';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
}

interface SettlementRow {
    settlement_id: number | null;
    code: string;
    status: 'unsettled' | 'draft' | 'approved' | 'paid';
    period_month: string;
    vehicle: {
        id: number;
        name: string;
        plate_number: string;
        type: string | null;
        brand: string | null;
        model_year: number | null;
        ownership_type: string;
        contract_number: string | null;
        settlement_scheme: string | null;
        revenue_share_owner_pct: number;
        revenue_share_tenant_pct: number;
        fixed_fee_amount: number;
        maintenance_payer: string;
        home_base: { id: number; code: string; name: string } | null;
    };
    partner: {
        id: number;
        code: string;
        name: string;
        phone: string | null;
        email: string | null;
        bank_accounts: BankAccount[];
    } | null;
    summary: {
        total_orders: number;
        total_rental_days: number;
        total_revenue: number;
        scheme_label: string;
        owner_gross_share: number;
        tenant_gross_share: number;
        total_maintenance_cost: number;
        maintenance_deduction: number;
        other_adjustment: number;
        adjustment_notes: string | null;
        net_payout: number;
    };
    payment: {
        payment_method: string | null;
        bank_name: string | null;
        bank_account_number: string | null;
        bank_account_holder: string | null;
        payment_reference: string | null;
        approved_at: string | null;
        paid_at: string | null;
        notes: string | null;
    } | null;
}

interface Metrics {
    total_units: number;
    total_orders: number;
    total_rental_days: number;
    total_gross_revenue: number;
    total_tenant_share: number;
    total_maintenance_deduction: number;
    total_net_payout: number;
    paid_amount: number;
    pending_amount: number;
    paid_count: number;
    approved_count: number;
    pending_count: number;
}

interface Props {
    rows: SettlementRow[];
    metrics: Metrics;
    monthOptions: Array<{ value: string; label: string }>;
    partners: Array<{ id: number; code: string; name: string }>;
    filters: {
        month: string;
        month_label: string;
        ownership_type: string;
        partner_id: string;
        status: string;
        search: string;
    };
}

export default function SettlementsIndex({
    rows,
    metrics,
    monthOptions,
    partners,
    filters,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const localeTag = useLocaleTag();
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    const [search, setSearch] = useState(filters.search || '');
    const [activeRow, setActiveRow] = useState<SettlementRow | null>(null);
    const [generating, setGenerating] = useState(false);

    const payoutForm = useForm({
        vehicle_id: 0,
        period_month: filters.month,
        status: 'approved' as 'draft' | 'approved' | 'paid',
        other_adjustment: '0',
        adjustment_notes: '',
        payment_method: 'bank_transfer',
        bank_name: '',
        bank_account_number: '',
        bank_account_holder: '',
        payment_reference: '',
        notes: '',
    });

    const applyFilters = (overrides: Partial<typeof filters>) => {
        router.get(
            prefixedRoute('fleet.settlements.index'),
            {
                month: overrides.month !== undefined ? overrides.month : filters.month,
                ownership_type: overrides.ownership_type !== undefined ? overrides.ownership_type : filters.ownership_type,
                partner_id: overrides.partner_id !== undefined ? overrides.partner_id || undefined : filters.partner_id || undefined,
                status: overrides.status !== undefined ? overrides.status : filters.status,
                search: overrides.search !== undefined ? overrides.search || undefined : search || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const resetFilters = () => {
        setSearch('');
        router.get(
            prefixedRoute('fleet.settlements.index'),
            { month: filters.month },
            { preserveState: true, replace: true }
        );
    };

    const handleGenerateAll = () => {
        setGenerating(true);
        router.post(
            prefixedRoute('fleet.settlements.generate'),
            { month: filters.month },
            {
                preserveScroll: true,
                onFinish: () => setGenerating(false),
            }
        );
    };

    const openPayoutModal = (row: SettlementRow) => {
        const defaultBank = row.partner?.bank_accounts?.[0];
        setActiveRow(row);
        payoutForm.setData({
            vehicle_id: row.vehicle.id,
            period_month: row.period_month,
            status: row.status === 'paid' ? 'paid' : row.status === 'approved' ? 'paid' : 'approved',
            other_adjustment: String(row.summary.other_adjustment || 0),
            adjustment_notes: row.summary.adjustment_notes || '',
            payment_method: row.payment?.payment_method || 'bank_transfer',
            bank_name: row.payment?.bank_name || defaultBank?.bank_name || '',
            bank_account_number: row.payment?.bank_account_number || defaultBank?.account_number || '',
            bank_account_holder: row.payment?.bank_account_holder || defaultBank?.account_holder_name || row.partner?.name || '',
            payment_reference: row.payment?.payment_reference || '',
            notes: row.payment?.notes || '',
        });
    };

    const submitPayout: FormEventHandler = (e) => {
        e.preventDefault();
        payoutForm.post(prefixedRoute('fleet.settlements.payout'), {
            preserveScroll: true,
            onSuccess: () => {
                setActiveRow(null);
            },
        });
    };

    const previewNetPayout = useMemo(() => {
        if (!activeRow) return 0;
        const adj = parseFloat(payoutForm.data.other_adjustment || '0') || 0;
        return Math.max(0, activeRow.summary.owner_gross_share - activeRow.summary.maintenance_deduction + adj);
    }, [activeRow, payoutForm.data.other_adjustment]);

    const partnerOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Mitra / Investor' },
        ...partners.map((p) => ({
            value: String(p.id),
            label: `${p.name} (${p.code})`,
        })),
    ], [partners]);

    const ownershipOptions: SelectOption[] = [
        { value: 'external', label: 'Semua Mitra (Investor & Rekanan)' },
        { value: 'investor', label: 'Titipan Investor (Bagi Hasil / Kontrak)' },
        { value: 'partner_loan', label: 'Pinjaman Rekanan (Sub-Rental)' },
        { value: 'all', label: 'Semua Unit (Termasuk Milik Sendiri)' },
    ];

    const quickStatusChips = [
        { value: 'all', label: 'Semua Status' },
        { value: 'unsettled', label: 'Belum Terbit' },
        { value: 'draft', label: 'Draft Statement' },
        { value: 'approved', label: 'Disetujui (Siap Transfer)' },
        { value: 'paid', label: 'Lunas Ditransfer' },
    ];

    const getStatusBadge = (status: SettlementRow['status']) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'Lunas Ditransfer ✓',
                    cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300',
                };
            case 'approved':
                return {
                    label: 'Disetujui · Siap Bayar',
                    cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-300',
                };
            case 'draft':
                return {
                    label: 'Draft Statement',
                    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300',
                };
            default:
                return {
                    label: 'Belum Diterbitkan',
                    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                };
        }
    };

    const formatDateTime = (iso: string | null | undefined) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString(localeTag, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return iso;
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Rekapitulasi & Bagi Hasil Investor"
                    subtitle="Kelola perhitungan bagi hasil bulanan unit titipan investor, potongan perawatan, dan pencairan dana mitra."
                    actions={
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher compact />
                            <PrimaryButton
                                type="button"
                                onClick={handleGenerateAll}
                                disabled={generating}
                                className="rounded-xl shadow-sm"
                            >
                                {generating ? 'Mengkalkulasi...' : '🔄 Terbitkan Statement Bulan Ini'}
                            </PrimaryButton>
                        </div>
                    }
                />
            }
        >
            <Head title={`Bagi Hasil Investor (${filters.month_label}) - Armada`} />

            <FleetNav />

            {flash?.success && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs">
                    ✓ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs">
                    ⚠️ {flash.error}
                </div>
            )}

            <div className="space-y-4">
                {/* 1. Executive Summary KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Units & Rental Days */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🤝</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {filters.month_label}
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                {metrics.total_units} <span className="text-sm font-bold text-slate-400">Unit</span>
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                {metrics.total_orders} transaksi · {metrics.total_rental_days} hari sewa aktif
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Total Gross Revenue & Tenant Margin */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">📈</span>
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                Omset Kotor
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="font-mono text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                {formatMoney(metrics.total_gross_revenue)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Bagian Rental: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(metrics.total_tenant_share)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Total Net Payout to Investors */}
                    <div className="overflow-hidden rounded-3xl border border-blue-200/80 bg-blue-50/40 p-5 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">💸</span>
                            <span className="rounded-full bg-blue-200/70 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                Hak Bersih Mitra
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="font-mono text-2xl font-black tracking-tight text-blue-700 dark:text-blue-400">
                                {formatMoney(metrics.total_net_payout)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-blue-600/90 dark:text-blue-400/80">
                                Potongan Servis: {formatMoney(metrics.total_maintenance_deduction)}
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Paid vs Pending Settlement */}
                    <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">🏦</span>
                            <span className="rounded-full bg-emerald-200/70 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                {metrics.paid_count}/{metrics.total_units} Lunas
                            </span>
                        </div>
                        <div className="mt-3">
                            <p className="font-mono text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                                {formatMoney(metrics.paid_amount)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                                Belum Cair: <span className="font-bold">{formatMoney(metrics.pending_amount)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Filter & Search Bar */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                            <div className="w-48">
                                <Select
                                    value={filters.month}
                                    onChange={(val) => applyFilters({ month: String(val || filters.month) })}
                                    options={monthOptions}
                                />
                            </div>
                            <div className="w-60">
                                <Select
                                    value={filters.ownership_type}
                                    onChange={(val) => applyFilters({ ownership_type: String(val || 'external') })}
                                    options={ownershipOptions}
                                />
                            </div>
                            <div className="w-60">
                                <Select
                                    value={filters.partner_id}
                                    onChange={(val) => applyFilters({ partner_id: String(val || '') })}
                                    options={partnerOptions}
                                />
                            </div>
                            <div className="relative min-w-[220px] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari plat nomor, unit, atau nama investor..."
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900"
                            >
                                Cari
                            </button>
                            {(filters.search || filters.partner_id || filters.status !== 'all' || filters.ownership_type !== 'external') && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    ✕ Reset
                                </button>
                            )}
                        </form>

                        {/* Status Quick Filter Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                            <span className="mr-1 text-[11px] font-bold text-slate-400">Status Pencairan:</span>
                            {quickStatusChips.map((chip) => {
                                const isActive = filters.status === chip.value;
                                return (
                                    <button
                                        key={chip.value}
                                        type="button"
                                        onClick={() => applyFilters({ status: chip.value })}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {chip.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Main Settlement Table */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {rows.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 dark:bg-slate-800">
                                🤝
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Tidak ada data unit mitra / investor pada filter ini
                            </h3>
                            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                                Pastikan unit armada telah diatur status kepemilikannya sebagai &ldquo;Titipan Investor&rdquo; atau &ldquo;Pinjaman Rekanan&rdquo; pada halaman Edit Kendaraan.
                            </p>
                            <div className="mt-4">
                                <Link
                                    href={prefixedRoute('fleet.vehicles.index')}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300"
                                >
                                    🚗 Kelola Kepemilikan Kendaraan →
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
                                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3.5 text-left">No. Statement & Unit</th>
                                        <th className="px-4 py-3.5 text-left">Investor / Mitra Pemilik</th>
                                        <th className="px-4 py-3.5 text-left">Skema & Kinerja Sewa</th>
                                        <th className="px-4 py-3.5 text-right">Omset Kotor</th>
                                        <th className="px-4 py-3.5 text-right">Hak Kotor & Potongan</th>
                                        <th className="px-4 py-3.5 text-right">Net Payout (Bersih)</th>
                                        <th className="px-4 py-3.5 text-center">Status Pencairan</th>
                                        <th className="px-4 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rows.map((row) => {
                                        const badge = getStatusBadge(row.status);
                                        const primaryBank = row.partner?.bank_accounts?.[0];

                                        return (
                                            <tr
                                                key={row.vehicle.id}
                                                className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                            >
                                                {/* Column 1: Statement Code & Vehicle */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-base text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                            🚗
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] font-black text-white dark:bg-slate-700">
                                                                    {row.vehicle.plate_number}
                                                                </span>
                                                                <span className="font-mono text-[10px] text-slate-400">
                                                                    {row.code}
                                                                </span>
                                                            </div>
                                                            <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
                                                                {row.vehicle.name}
                                                            </p>
                                                            {row.vehicle.home_base && (
                                                                <p className="text-[10px] text-slate-400">
                                                                    📍 {row.vehicle.home_base.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 2: Investor / Partner */}
                                                <td className="px-4 py-3.5">
                                                    {row.partner ? (
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">
                                                                {row.partner.name}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500">
                                                                {row.vehicle.ownership_type === 'investor'
                                                                    ? '🤝 Titipan Investor'
                                                                    : '🔄 Rekanan Sub-Rental'}
                                                                {row.vehicle.contract_number ? ` · ${row.vehicle.contract_number}` : ''}
                                                            </p>
                                                            {(row.payment?.bank_name || primaryBank) && (
                                                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                                                    🏦 {row.payment?.bank_name || primaryBank?.bank_name}{' '}
                                                                    {row.payment?.bank_account_number || primaryBank?.account_number}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="italic text-slate-400">
                                                            {row.vehicle.ownership_type === 'owned'
                                                                ? '🏢 Milik Sendiri (Internal)'
                                                                : 'Belum dihubungkan ke Mitra'}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Column 3: Scheme & Rental Activity */}
                                                <td className="px-4 py-3.5">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {row.summary.scheme_label}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {row.summary.total_orders} Order
                                                        </span>
                                                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                            {row.summary.total_rental_days} Hari Sewa
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Column 4: Gross Revenue */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatMoney(row.summary.total_revenue)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Bagian Rental: {formatMoney(row.summary.tenant_gross_share)}
                                                    </p>
                                                </td>

                                                {/* Column 5: Owner Gross & Maintenance Deduction */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                        Hak Kotor: {formatMoney(row.summary.owner_gross_share)}
                                                    </p>
                                                    {row.summary.maintenance_deduction > 0 && (
                                                        <p className="font-mono text-[11px] text-rose-600 dark:text-rose-400">
                                                            Servis: -{formatMoney(row.summary.maintenance_deduction)}
                                                        </p>
                                                    )}
                                                    {row.summary.other_adjustment !== 0 && (
                                                        <p
                                                            className={`font-mono text-[11px] ${
                                                                row.summary.other_adjustment > 0
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-rose-600 dark:text-rose-400'
                                                            }`}
                                                        >
                                                            Adj: {row.summary.other_adjustment > 0 ? '+' : ''}
                                                            {formatMoney(row.summary.other_adjustment)}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Column 6: Net Payout */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <span className="font-mono text-sm font-black text-blue-700 dark:text-blue-400">
                                                        {formatMoney(row.summary.net_payout)}
                                                    </span>
                                                </td>

                                                {/* Column 7: Status */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                    {row.payment?.paid_at && (
                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {formatDateTime(row.payment.paid_at)}
                                                            {row.payment.payment_reference ? ` · #${row.payment.payment_reference}` : ''}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Column 8: Actions */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={prefixedRoute('fleet.vehicles.settlement', {
                                                                vehicle: row.vehicle.id,
                                                                month: row.period_month,
                                                            })}
                                                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                        >
                                                            📄 Rincian & Cetak
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => openPayoutModal(row)}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-2xs transition hover:bg-indigo-700"
                                                        >
                                                            💸 {row.status === 'paid' ? 'Detail Bayar' : 'Cairkan'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Payout & Adjustment Modal */}
            {activeRow && (
                <Modal show onClose={() => setActiveRow(null)} maxWidth="lg">
                    <form onSubmit={submitPayout} className="p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    💸
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        Pencairan Bagi Hasil & Settlement
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {activeRow.vehicle.plate_number} — {activeRow.vehicle.name} · Periode {filters.month_label}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveRow(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Calculation Summary Box */}
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-800/50">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Mitra / Investor:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {activeRow.partner?.name || 'Belum diatur'}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Total Omset Sewa ({activeRow.summary.total_orders} order / {activeRow.summary.total_rental_days} hari):</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {formatMoney(activeRow.summary.total_revenue)}
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Hak Kotor Investor ({activeRow.summary.scheme_label}):</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {formatMoney(activeRow.summary.owner_gross_share)}
                                </span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                <span>Potongan Biaya Servis / Maintenance:</span>
                                <span className="font-mono font-bold">
                                    -{formatMoney(activeRow.summary.maintenance_deduction)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-blue-700 dark:border-slate-700 dark:text-blue-400">
                                <span>Estimasi Net Payout (Hak Bersih):</span>
                                <span className="font-mono">{formatMoney(previewNetPayout)}</span>
                            </div>
                        </div>

                        {/* Adjustment Inputs */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Penyesuaian Tambahan / Potongan (Rp)" />
                                <TextInput
                                    type="number"
                                    step="any"
                                    value={payoutForm.data.other_adjustment}
                                    onChange={(e) => payoutForm.setData('other_adjustment', e.target.value)}
                                    className="mt-1 w-full font-mono text-xs"
                                    placeholder="Contoh: -50000 atau 100000"
                                />
                                <p className="mt-1 text-[10px] text-slate-400">
                                    Isi minus (-) untuk potongan admin/pajak, positif (+) untuk reimburse.
                                </p>
                                <InputError message={payoutForm.errors.other_adjustment} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Keterangan Penyesuaian" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.adjustment_notes}
                                    onChange={(e) => payoutForm.setData('adjustment_notes', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    placeholder="Misal: Potongan PPh / Cuci Salon"
                                />
                            </div>
                        </div>

                        {/* Status Selector */}
                        <div>
                            <InputLabel value="Status Statement & Pencairan" />
                            <div className="mt-1.5 grid grid-cols-3 gap-2">
                                {[
                                    { value: 'draft', label: '📝 Draft' },
                                    { value: 'approved', label: '✅ Disetujui' },
                                    { value: 'paid', label: '🏦 Lunas Ditransfer' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => payoutForm.setData('status', opt.value as 'draft' | 'approved' | 'paid')}
                                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                            payoutForm.data.status === opt.value
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Partner Saved Bank Accounts Quick Picker */}
                        {activeRow.partner && activeRow.partner.bank_accounts.length > 0 && (
                            <div>
                                <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                                    Pilih Cepat Rekening Mitra ({activeRow.partner.name}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeRow.partner.bank_accounts.map((acc) => (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => {
                                                payoutForm.setData((prev) => ({
                                                    ...prev,
                                                    bank_name: acc.bank_name,
                                                    bank_account_number: acc.account_number,
                                                    bank_account_holder: acc.account_holder_name,
                                                }));
                                            }}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-[11px] transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800"
                                        >
                                            <span className="font-bold text-slate-900 dark:text-white">{acc.bank_name}</span>{' '}
                                            <span className="font-mono text-slate-600 dark:text-slate-300">{acc.account_number}</span>{' '}
                                            <span className="text-slate-400">a.n {acc.account_holder_name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bank Transfer Details */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <InputLabel value="Nama Bank" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.bank_name}
                                    onChange={(e) => payoutForm.setData('bank_name', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    placeholder="BCA / Mandiri / BRI"
                                />
                            </div>
                            <div>
                                <InputLabel value="Nomor Rekening" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.bank_account_number}
                                    onChange={(e) => payoutForm.setData('bank_account_number', e.target.value)}
                                    className="mt-1 w-full font-mono text-xs"
                                    placeholder="Nomor rekening tujuan"
                                />
                            </div>
                            <div>
                                <InputLabel value="Atas Nama Rekening" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.bank_account_holder}
                                    onChange={(e) => payoutForm.setData('bank_account_holder', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    placeholder="Nama pemilik rekening"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="No. Referensi Bukti Transfer" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.payment_reference}
                                    onChange={(e) => payoutForm.setData('payment_reference', e.target.value)}
                                    className="mt-1 w-full font-mono text-xs"
                                    placeholder="No. referensi mutasi bank"
                                />
                            </div>
                            <div>
                                <InputLabel value="Catatan Pencairan" />
                                <TextInput
                                    type="text"
                                    value={payoutForm.data.notes}
                                    onChange={(e) => payoutForm.setData('notes', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    placeholder="Catatan opsional"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <SecondaryButton type="button" onClick={() => setActiveRow(null)}>
                                Batal
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={payoutForm.processing}>
                                {payoutForm.processing ? 'Menyimpan...' : 'Simpan Pencairan'}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}
        </DynamicLayout>
    );
}

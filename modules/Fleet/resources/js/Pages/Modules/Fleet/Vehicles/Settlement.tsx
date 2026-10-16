import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Select, { type SelectOption } from '@/Components/Select';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface SettlementData {
    vehicle: {
        id: number;
        name: string;
        plate_number: string;
        type: string;
        brand: string | null;
        model_year: number | null;
        color: string | null;
        ownership_type: string;
        contract_number: string | null;
        contract_start_date: string | null;
        contract_end_date: string | null;
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
        bank_accounts: Array<{
            id: number;
            bank_name: string;
            account_number: string;
            account_holder_name: string;
        }>;
    } | null;
    period: {
        start_date: string;
        end_date: string;
        month_label: string;
        days_count: number;
    };
    summary: {
        total_revenue: number;
        total_rental_days: number;
        total_orders: number;
        scheme_label: string;
        owner_gross_share: number;
        tenant_gross_share: number;
        total_maintenance_cost: number;
        maintenance_deduction: number;
        maintenance_payer_label: string;
        net_payout: number;
    };
    rentals: Array<{
        id: number;
        code: string;
        customer_name: string;
        start_date: string;
        end_date: string;
        status: string;
        days: number;
        total_amount: number;
    }>;
    maintenance_logs: Array<{
        id: number;
        source: string;
        reference: string;
        date: string;
        title: string;
        status: string;
        cost: number;
    }>;
}

interface SavedSettlementInfo {
    id: number;
    code: string;
    status: string;
    other_adjustment: number;
    adjustment_notes: string | null;
    net_payout: number;
    paid_at: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    bank_name: string | null;
    account_number: string | null;
    account_holder_name: string | null;
}

interface Props {
    settlement: SettlementData;
    savedSettlement?: SavedSettlementInfo | null;
    monthOptions: Array<{ value: string; label: string }>;
    currentFilter: {
        month: string;
        start_date: string;
        end_date: string;
    };
    company: {
        name: string;
        subdomain: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
    };
}

export default function Settlement({
    settlement,
    savedSettlement = null,
    monthOptions,
    currentFilter,
    company,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [selectedMonth, setSelectedMonth] = useState(currentFilter.month);
    const [startDate, setStartDate] = useState(currentFilter.start_date);
    const [endDate, setEndDate] = useState(currentFilter.end_date);
    const [useCustomRange, setUseCustomRange] = useState(false);

    const handleMonthChange = (month: string) => {
        setSelectedMonth(month);
        router.get(
            prefixedRoute('fleet.vehicles.settlement', settlement.vehicle.id),
            { month },
            { preserveState: true }
        );
    };

    const handleCustomFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            prefixedRoute('fleet.vehicles.settlement', settlement.vehicle.id),
            { start_date: startDate, end_date: endDate },
            { preserveState: true }
        );
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(localeTag, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString(localeTag, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="print:hidden">
                    <PageHeader
                        title={`Laporan Kinerja & Rekap Bagi Hasil: ${settlement.vehicle.name} (${settlement.vehicle.plate_number})`}
                        subtitle={`Periode: ${settlement.period.month_label} (${formatDate(settlement.period.start_date)} s/d ${formatDate(settlement.period.end_date)})`}
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={prefixedRoute('fleet.settlements.index', { month: currentFilter.month })}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    🤝 Papan Bagi Hasil
                                </Link>

                                <Link
                                    href={prefixedRoute('fleet.vehicles.show', settlement.vehicle.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    ← {t('fleet.vehicles.show_back_to_unit', undefined, 'Kembali ke Detail Armada')}
                                </Link>

                                {settlement.partner && (
                                    <Link
                                        href={prefixedRoute('partners.settlement', settlement.partner.id)}
                                        className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-2xs transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                                    >
                                        <span>🏢</span>
                                        <span>Rekap Semua Armada Mitra</span>
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    <span>🖨️</span>
                                    <span>Cetak Statement (PDF)</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            }
        >
            <Head title={`Owner Statement · ${settlement.vehicle.plate_number} · ${settlement.period.month_label}`} />

            <div className="print:hidden">
                <FleetNav />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 pb-24 print:p-0 print:max-w-none print:m-0">
                {/* Filter Control Bar (Hidden on print) */}
                <div className="print:hidden flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Pilih Periode Bulan:</label>
                        <div className="w-56">
                            <Select
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                options={monthOptions.map((opt) => ({
                                    value: opt.value,
                                    label: opt.label,
                                    description: `Bulan ${opt.value}`,
                                }))}
                                placeholder="Pilih periode..."
                                searchable={false}
                                className="w-full text-xs"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setUseCustomRange(!useCustomRange)}
                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            {useCustomRange ? 'Tutup Rentang Kustom' : 'Atur Rentang Tanggal Kustom'}
                        </button>
                    </div>

                    {useCustomRange && (
                        <form onSubmit={handleCustomFilter} className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-xl border-slate-300 py-1.5 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <span className="text-xs text-slate-400">s/d</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-xl border-slate-300 py-1.5 px-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                required
                            />
                            <button
                                type="submit"
                                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                            >
                                Terapkan
                            </button>
                        </form>
                    )}
                </div>

                {/* Saved Settlement Status Banner */}
                {savedSettlement && (
                    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 text-xs ${
                        savedSettlement.status === 'paid'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200'
                            : savedSettlement.status === 'approved'
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-200'
                              : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200'
                    }`}>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2 font-black">
                                <span>
                                    {savedSettlement.status === 'paid'
                                        ? '✅ LUNAS DIBAYAR KE INVESTOR'
                                        : savedSettlement.status === 'approved'
                                          ? '✔️ STATEMENT DISETUJUI (SIAP TRANSFER)'
                                          : '📝 DRAFT STATEMENT TERSIMPAN'}
                                </span>
                                <span className="font-mono text-[11px] opacity-80">({savedSettlement.code})</span>
                            </div>
                            {savedSettlement.status === 'paid' && (
                                <p className="text-[11px] opacity-90">
                                    Dibayarkan pada {formatDate(savedSettlement.paid_at)} via {savedSettlement.payment_method || 'Transfer Bank'}
                                    {savedSettlement.bank_name ? ` (${savedSettlement.bank_name} ${savedSettlement.account_number || ''})` : ''}
                                    {savedSettlement.payment_reference ? ` · Ref: ${savedSettlement.payment_reference}` : ''}
                                </p>
                            )}
                            {savedSettlement.other_adjustment !== 0 && (
                                <p className="text-[11px] opacity-90">
                                    Penyesuaian Lainnya: <strong className="font-mono">{formatCurrency(savedSettlement.other_adjustment)}</strong>
                                    {savedSettlement.adjustment_notes ? ` (${savedSettlement.adjustment_notes})` : ''}
                                    {' · '}Total Net Payout Final: <strong className="font-mono">{formatCurrency(savedSettlement.net_payout)}</strong>
                                </p>
                            )}
                        </div>
                        <Link
                            href={prefixedRoute('fleet.settlements.index', { month: currentFilter.month })}
                            className="print:hidden rounded-xl bg-white/90 px-3 py-1.5 text-[11px] font-bold text-slate-800 shadow-2xs hover:bg-white dark:bg-slate-800 dark:text-slate-100"
                        >
                            Kelola Pencairan →
                        </Link>
                    </div>
                )}

                {/* Printable Statement Container */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:p-0 space-y-8">
                    {/* Header Formal Statement */}
                    <div className="border-b-2 border-slate-900 pb-6 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-2">
                                <span className="text-2xl">🏢</span>
                                <span className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                    {company.name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                                {company.address || 'Sistem Manajemen Armada & Rental Terpadu'}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-slate-400">
                                {company.phone && <span>Telp: {company.phone}</span>}
                                {company.email && <span>Email: {company.email}</span>}
                            </div>
                        </div>

                        <div className="text-left md:text-right">
                            <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 uppercase tracking-widest">
                                Owner Settlement Statement
                            </span>
                            <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                                REKAP BAGI HASIL & KINERJA ARMADA
                            </h2>
                            <p className="mt-1 font-mono text-xs text-slate-500">
                                Ref: {savedSettlement?.code || `STMT/${settlement.vehicle.plate_number.replace(/\s+/g, '')}/${settlement.period.start_date.replace(/-/g, '')}`}
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                                Periode: {formatDate(settlement.period.start_date)} — {formatDate(settlement.period.end_date)} ({settlement.period.days_count} Hari)
                            </p>
                        </div>
                    </div>

                    {/* Metadata Box: Owner & Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50/70 border border-slate-100 dark:bg-slate-850/60 dark:border-slate-800">
                        {/* Partner / Investor Info */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Informasi Pemilik / Investor Unit
                            </p>
                            {settlement.partner ? (
                                <div className="text-xs space-y-1">
                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                        {settlement.partner.name}
                                    </p>
                                    <p className="text-slate-500">Kode Mitra: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{settlement.partner.code}</span></p>
                                    {settlement.partner.phone && <p className="text-slate-500">Kontak: {settlement.partner.phone}</p>}
                                    {settlement.partner.email && <p className="text-slate-500">Email: {settlement.partner.email}</p>}
                                    
                                    {/* Bank Account */}
                                    <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Rekening Tujuan Pembayaran:</p>
                                        {settlement.partner.bank_accounts && settlement.partner.bank_accounts.length > 0 ? (
                                            settlement.partner.bank_accounts.map((b) => (
                                                <p key={b.id} className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    🏦 {b.bank_name} — {b.account_number} (A.N {b.account_holder_name})
                                                </p>
                                            ))
                                        ) : (
                                            <p className="text-slate-400 italic">Belum ada nomor rekening terdaftar di profil mitra.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">Kendaraan Milik Sendiri (Internal Fleet / Tidak memiliki relasi mitra luar).</p>
                            )}
                        </div>

                        {/* Vehicle & Contract Info */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Data Kendaraan & Perjanjian Kerjasama
                            </p>
                            <div className="text-xs space-y-1">
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    {settlement.vehicle.name}
                                    <span className="ml-2 font-mono text-sm font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        {settlement.vehicle.plate_number}
                                    </span>
                                </p>
                                <p className="text-slate-500">
                                    Tipe / Merk: <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">{settlement.vehicle.type} · {settlement.vehicle.brand || '—'} {settlement.vehicle.model_year ? `(${settlement.vehicle.model_year})` : ''}</span>
                                </p>
                                <p className="text-slate-500">
                                    Home Base: <span className="font-semibold text-slate-700 dark:text-slate-300">{settlement.vehicle.home_base ? `${settlement.vehicle.home_base.code} — ${settlement.vehicle.home_base.name}` : '—'}</span>
                                </p>
                                <p className="text-slate-500">
                                    Nomor Kontrak/PKS: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{settlement.vehicle.contract_number || '—'}</span>
                                </p>
                                <p className="text-slate-500">
                                    Skema Kerjasama: <span className="font-bold text-indigo-600 dark:text-indigo-400">{settlement.summary.scheme_label}</span>
                                </p>
                                <p className="text-slate-500">
                                    Beban Servis: <span className="font-medium text-slate-700 dark:text-slate-300">{settlement.summary.maintenance_payer_label}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4 KPI Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Omset Rental</p>
                            <p className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">
                                {formatCurrency(settlement.summary.total_revenue)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Dari {settlement.summary.total_orders} Order ({settlement.summary.total_rental_days} Hari Sewa)
                            </p>
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Hak Pemilik (Gross)</p>
                            <p className="mt-1 font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(settlement.summary.owner_gross_share)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Sesuai kesepakatan PKS
                            </p>
                        </div>

                        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Potongan Servis</p>
                            <p className="mt-1 font-mono text-xl font-black text-rose-600 dark:text-rose-400">
                                - {formatCurrency(settlement.summary.maintenance_deduction)}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Total Servis: {formatCurrency(settlement.summary.total_maintenance_cost)}
                            </p>
                        </div>

                        <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/70 p-4 dark:border-emerald-500/50 dark:bg-emerald-950/30">
                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Hak Bersih Diterima</p>
                            <p className="mt-1 font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(settlement.summary.net_payout)}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Siap Ditransfer ke Pemilik
                            </p>
                        </div>
                    </div>

                    {/* Section 1: Rincian Transaksi Rental */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>📋</span>
                                <span>Rincian Transaksi Sewa Unit (Rental Orders)</span>
                            </h3>
                            <span className="text-xs text-slate-400">{settlement.rentals.length} Transaksi Selesai/Aktif</span>
                        </div>

                        {settlement.rentals.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl dark:bg-slate-850">
                                Tidak ada transaksi rental yang tercatat untuk armada ini pada periode terpilih.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                            <th className="px-3 py-2.5 font-bold">Kode Order</th>
                                            <th className="px-3 py-2.5 font-bold">Pelanggan</th>
                                            <th className="px-3 py-2.5 font-bold">Periode Sewa</th>
                                            <th className="px-3 py-2.5 font-bold text-center">Durasi</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Nilai Sewa (Omset)</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Porsi Pemilik</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                        {settlement.rentals.map((r) => {
                                            const ownerPortion = settlement.vehicle.settlement_scheme === 'revenue_share'
                                                ? (r.total_amount * (settlement.vehicle.revenue_share_owner_pct / 100))
                                                : (settlement.vehicle.settlement_scheme === 'daily_rental'
                                                    ? (settlement.vehicle.fixed_fee_amount * r.days)
                                                    : 0);

                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                                        {r.code}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                                        {r.customer_name}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                                        {formatDate(r.start_date)} — {formatDate(r.end_date)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center font-mono font-bold">
                                                        {r.days} Hari
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(r.total_amount)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                        {settlement.vehicle.settlement_scheme === 'fixed_monthly' ? '— (Flat Bulanan)' : formatCurrency(ownerPortion)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/80 font-black text-slate-900 dark:bg-slate-850 dark:text-white border-t border-slate-200 dark:border-slate-700">
                                            <td colSpan={3} className="px-3 py-3 uppercase tracking-wider text-[11px]">Total Omset Rental Armada:</td>
                                            <td className="px-3 py-3 text-center font-mono">{settlement.summary.total_rental_days} Hari</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm">{formatCurrency(settlement.summary.total_revenue)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm text-indigo-600 dark:text-indigo-400">
                                                {formatCurrency(settlement.summary.owner_gross_share)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Rincian Biaya Servis & Pemeliharaan */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🛠️</span>
                                <span>Rincian Biaya Perawatan & Servis Armada</span>
                            </h3>
                            <span className="text-xs text-slate-400">{settlement.maintenance_logs.length} Log Pemeliharaan</span>
                        </div>

                        {settlement.maintenance_logs.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl dark:bg-slate-850">
                                Tidak ada catatan pengeluaran servis pada periode ini.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                            <th className="px-3 py-2.5 font-bold">No. Ref</th>
                                            <th className="px-3 py-2.5 font-bold">Tanggal</th>
                                            <th className="px-3 py-2.5 font-bold">Deskripsi Perbaikan / Servis</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Total Biaya Riil</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Potongan Pemilik</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                        {settlement.maintenance_logs.map((m) => {
                                            const ownerCut = settlement.vehicle.maintenance_payer === 'owner'
                                                ? m.cost
                                                : (settlement.vehicle.maintenance_payer === 'shared' ? (m.cost * 0.5) : 0);

                                            return (
                                                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                                        {m.reference}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                                                        {formatDate(m.date)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                                        {m.title}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(m.cost)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                        - {formatCurrency(ownerCut)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/80 font-black text-slate-900 dark:bg-slate-850 dark:text-white border-t border-slate-200 dark:border-slate-700">
                                            <td colSpan={3} className="px-3 py-3 uppercase tracking-wider text-[11px]">Total Pemeliharaan Periode Ini:</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm">{formatCurrency(settlement.summary.total_maintenance_cost)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm text-rose-600 dark:text-rose-400">
                                                - {formatCurrency(settlement.summary.maintenance_deduction)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Rekapitulasi & Lembar Pengesahan */}
                    <div className="border-t-2 border-slate-900 pt-6 dark:border-slate-700 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Calculation Breakdown */}
                            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850 space-y-2.5 text-xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ringkasan Kalkulasi Hak Pemilik</p>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-600 dark:text-slate-400">(+) Hak Sewa / Bagi Hasil Pemilik:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(settlement.summary.owner_gross_share)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                                    <span>(-) Potongan Beban Pemeliharaan:</span>
                                    <span className="font-mono font-bold">- {formatCurrency(settlement.summary.maintenance_deduction)}</span>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-black text-emerald-700 dark:text-emerald-400">
                                    <span>(=) TOTAL DITERIMA PEMILIK:</span>
                                    <span className="font-mono text-lg">{formatCurrency(settlement.summary.net_payout)}</span>
                                </div>
                            </div>

                            {/* Payment Instruction & Notes */}
                            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850 text-xs space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Catatan & Pelaksanaan Transfer</p>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Statement ini diterbitkan secara resmi oleh pihak pengelola sebagai bukti perhitungan kinerja operasional armada titipan/rekanan. Dana bagi hasil akan dicairkan ke rekening pemilik yang tercantum di atas sesuai kesepakatan PKS.
                                </p>
                            </div>
                        </div>

                        {/* Signature Columns for Formal Acceptance */}
                        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                            <div className="space-y-16">
                                <p className="text-slate-500 font-bold">Disiapkan & Divalidasi Oleh,</p>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white underline">{company.name}</p>
                                    <p className="text-[10px] text-slate-400">Pengelola Rental</p>
                                </div>
                            </div>

                            <div className="space-y-16">
                                <p className="text-slate-500 font-bold">Diterima & Disetujui Oleh,</p>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white underline">{settlement.partner?.name || 'Pemilik Unit'}</p>
                                    <p className="text-[10px] text-slate-400">Mitra / Investor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

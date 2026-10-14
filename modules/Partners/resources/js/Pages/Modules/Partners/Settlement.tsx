import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PartnersNav from '../../../PartnersNav';

interface VehicleReport {
    vehicle: {
        id: number;
        name: string;
        plate_number: string;
        type: string;
        ownership_type: string;
        settlement_scheme: string | null;
        home_base: { id: number; code: string; name: string } | null;
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
        net_payout: number;
    };
    rentals: Array<{
        id: number;
        code: string;
        customer_name: string;
        start_date: string;
        end_date: string;
        days: number;
        total_amount: number;
    }>;
    maintenance_logs: Array<{
        id: number;
        reference: string;
        date: string;
        title: string;
        cost: number;
    }>;
}

interface PartnerConsolidatedSettlement {
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
    };
    period: {
        start_date: string;
        end_date: string;
        month_label: string;
        days_count: number;
    };
    combined_summary?: {
        total_vehicles: number;
        total_revenue: number;
        total_rental_days: number;
        total_orders: number;
        owner_gross_share: number;
        maintenance_deduction: number;
        net_payout: number;
    };
    vehicle_reports?: VehicleReport[];
    // Single vehicle fields if single vehicle is selected
    vehicle?: VehicleReport['vehicle'];
    summary?: VehicleReport['summary'];
    rentals?: VehicleReport['rentals'];
    maintenance_logs?: VehicleReport['maintenance_logs'];
}

interface Props {
    settlement: PartnerConsolidatedSettlement;
    isConsolidated: boolean;
    partnerVehicles: Array<{
        id: number;
        name: string;
        plate_number: string;
        type: string;
    }>;
    monthOptions: Array<{ value: string; label: string }>;
    currentFilter: {
        month: string;
        vehicle_id: number | null;
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
    isConsolidated,
    partnerVehicles,
    monthOptions,
    currentFilter,
    company,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [selectedMonth, setSelectedMonth] = useState(currentFilter.month);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
        currentFilter.vehicle_id ? String(currentFilter.vehicle_id) : ''
    );

    const handleFilterChange = (month: string, vehicleId: string) => {
        setSelectedMonth(month);
        setSelectedVehicleId(vehicleId);

        const params: Record<string, string> = { month };
        if (vehicleId) {
            params.vehicle_id = vehicleId;
        }

        router.get(
            prefixedRoute('partners.settlement', settlement.partner.id),
            params,
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

    const combined = settlement.combined_summary;

    return (
        <DynamicLayout
            header={
                <div className="print:hidden">
                    <PageHeader
                        title={`Rekap Kinerja & Bagi Hasil: ${settlement.partner.name} (${settlement.partner.code})`}
                        subtitle={`Periode: ${settlement.period.month_label} (${formatDate(settlement.period.start_date)} s/d ${formatDate(settlement.period.end_date)})`}
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={prefixedRoute('partners.show', settlement.partner.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    ← {t('partners.show.back_to_partner', undefined, 'Kembali ke Profil Mitra')}
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    <span>🖨️</span>
                                    <span>Cetak Rekap Statement (PDF)</span>
                                </button>
                            </div>
                        }
                    />
                </div>
            }
        >
            <Head title={`Owner Statement · ${settlement.partner.name} · ${settlement.period.month_label}`} />

            <div className="print:hidden">
                <PartnersNav />
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 pb-24 print:p-0 print:max-w-none print:m-0">
                {/* Filter Controls (Hidden on print) */}
                <div className="print:hidden flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Periode:</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleFilterChange(e.target.value, selectedVehicleId)}
                                className="rounded-2xl border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                {monthOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500">Pilih Unit:</label>
                            <select
                                value={selectedVehicleId}
                                onChange={(e) => handleFilterChange(selectedMonth, e.target.value)}
                                className="rounded-2xl border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                <option value="">Semua Armada Terhubung ({partnerVehicles.length} Unit)</option>
                                {partnerVehicles.map((v) => (
                                    <option key={v.id} value={String(v.id)}>
                                        {v.plate_number} — {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Printable Document Container */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:p-0 space-y-8">
                    {/* Header Formal */}
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
                                Partner Consignment Statement
                            </span>
                            <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                                REKAPITULASI KINERJA & BAGI HASIL MITRA
                            </h2>
                            <p className="mt-1 font-mono text-xs text-slate-500">
                                Ref: STMT/{settlement.partner.code}/{settlement.period.start_date.replace(/-/g, '')}
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                                Periode: {formatDate(settlement.period.start_date)} — {formatDate(settlement.period.end_date)} ({settlement.period.days_count} Hari)
                            </p>
                        </div>
                    </div>

                    {/* Partner Metadata & Bank Accounts */}
                    <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-100 dark:bg-slate-850/60 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-1 text-xs">
                                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    Identitas Mitra Pemilik / Investor
                                </p>
                                <p className="text-base font-black text-slate-900 dark:text-white">
                                    {settlement.partner.name}
                                </p>
                                <p className="text-slate-500">Kode Mitra: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{settlement.partner.code}</span></p>
                                {settlement.partner.phone && <p className="text-slate-500">Telepon/WhatsApp: {settlement.partner.phone}</p>}
                                {settlement.partner.email && <p className="text-slate-500">Email: {settlement.partner.email}</p>}
                            </div>

                            <div className="space-y-1 text-xs md:text-right">
                                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    Rekening Bank Penerima Pembayaran
                                </p>
                                {settlement.partner.bank_accounts && settlement.partner.bank_accounts.length > 0 ? (
                                    settlement.partner.bank_accounts.map((b) => (
                                        <p key={b.id} className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                            🏦 {b.bank_name} : {b.account_number} (A.N {b.account_holder_name})
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-slate-400 italic">Belum ada nomor rekening bank terdaftar.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    {isConsolidated && combined ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Omset Gabungan</p>
                                <p className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">
                                    {formatCurrency(combined.total_revenue)}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {combined.total_vehicles} Unit ({combined.total_orders} Booking / {combined.total_rental_days} Hari)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Hak Pemilik (Gross)</p>
                                <p className="mt-1 font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(combined.owner_gross_share)}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Akumulasi sebelum potongan
                                </p>
                            </div>

                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-950 dark:bg-rose-950/20">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Potongan Servis</p>
                                <p className="mt-1 font-mono text-xl font-black text-rose-600 dark:text-rose-400">
                                    - {formatCurrency(combined.maintenance_deduction)}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Beban servis yang ditanggung
                                </p>
                            </div>

                            <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/70 p-4 dark:border-emerald-500/50 dark:bg-emerald-950/30">
                                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total Hak Bersih Pemilik</p>
                                <p className="mt-1 font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                    {formatCurrency(combined.net_payout)}
                                </p>
                                <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Net Transfer Bulan Ini
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {/* Consolidated Table of Vehicles */}
                    {isConsolidated && settlement.vehicle_reports ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                                <span>🚗</span>
                                <span>Rincian Performa & Bagi Hasil Per Unit Armada</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                    <thead>
                                        <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                            <th className="px-3 py-2.5 font-bold">Plat Nomor</th>
                                            <th className="px-3 py-2.5 font-bold">Kendaraan</th>
                                            <th className="px-3 py-2.5 font-bold">Skema</th>
                                            <th className="px-3 py-2.5 font-bold text-center">Hari Jalan</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Omset Bruto</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Hak Pemilik</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Pot. Servis</th>
                                            <th className="px-3 py-2.5 font-bold text-right">Hak Bersih</th>
                                            <th className="px-3 py-2.5 text-right print:hidden">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                        {settlement.vehicle_reports.map((vr) => (
                                            <tr key={vr.vehicle.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                                    {vr.vehicle.plate_number}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                                    <div>{vr.vehicle.name}</div>
                                                    <div className="text-[10px] text-slate-400 capitalize">{vr.vehicle.type}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">
                                                    {vr.summary.scheme_label}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono">
                                                    {vr.summary.total_rental_days} Hari ({vr.summary.total_orders} Booking)
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(vr.summary.total_revenue)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurrency(vr.summary.owner_gross_share)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                    - {formatCurrency(vr.summary.maintenance_deduction)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(vr.summary.net_payout)}
                                                </td>
                                                <td className="px-3 py-2.5 text-right print:hidden">
                                                    <Link
                                                        href={prefixedRoute('fleet.vehicles.settlement', vr.vehicle.id)}
                                                        className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                    >
                                                        Rincian Unit →
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/80 font-black text-slate-900 dark:bg-slate-850 dark:text-white border-t border-slate-200 dark:border-slate-700">
                                            <td colSpan={3} className="px-3 py-3 uppercase tracking-wider text-[11px]">TOTAL REKAP GABUNGAN:</td>
                                            <td className="px-3 py-3 text-center font-mono">{combined?.total_rental_days} Hari</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm">{formatCurrency(combined?.total_revenue ?? 0)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm text-indigo-600 dark:text-indigo-400">{formatCurrency(combined?.owner_gross_share ?? 0)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-sm text-rose-600 dark:text-rose-400">- {formatCurrency(combined?.maintenance_deduction ?? 0)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">{formatCurrency(combined?.net_payout ?? 0)}</td>
                                            <td className="print:hidden"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {/* Lembar Otorisasi & Tanda Tangan */}
                    <div className="border-t-2 border-slate-900 pt-8 dark:border-slate-700 space-y-6">
                        <div className="grid grid-cols-2 gap-8 text-center text-xs">
                            <div className="space-y-16">
                                <p className="text-slate-500 font-bold">Disiapkan & Divalidasi Oleh,</p>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white underline">{company.name}</p>
                                    <p className="text-[10px] text-slate-400">Pengelola Operasional Rental</p>
                                </div>
                            </div>

                            <div className="space-y-16">
                                <p className="text-slate-500 font-bold">Diterima & Disetujui Oleh,</p>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white underline">{settlement.partner.name}</p>
                                    <p className="text-[10px] text-slate-400">Mitra Pemilik / Investor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

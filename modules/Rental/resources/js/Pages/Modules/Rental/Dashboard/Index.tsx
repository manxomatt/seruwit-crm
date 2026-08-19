import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import RentalNav from '../../../../RentalNav';

interface RentalRow {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    is_overdue: boolean;
    total_amount: number;
    vehicle: { id: number; name: string; plate_number: string } | null;
    partner: { id: number; name: string; code: string } | null;
}

interface Board {
    counts: {
        draft: number;
        pending?: number;
        pending_reserved?: number;
        confirmed: number;
        active: number;
        returned: number;
        completed: number;
        cancelled?: number;
        no_show?: number;
        overdue: number;
        ending_soon: number;
        unsettled_deposits: number;
    };
    utilisation: {
        percent: number;
        on_rent: number;
        fleet_active: number;
        idle: number;
    };
    kpis?: {
        adr: number;
        revpac: number;
        overdue_rate: number;
        damage_rate: number;
        rental_days_mtd: number;
        closed_mtd: number;
        damaged_mtd: number;
    };
    revenue: {
        mtd: number;
        by_type: Array<{ type: string; total: number; count: number }>;
        by_partner: Array<{ partner_id: number; name: string; total: number; count: number }>;
        by_vehicle: Array<{ vehicle_id: number; name: string; plate_number: string; total: number; count: number }>;
    };
    overdue: RentalRow[];
    ending_soon: RentalRow[];
    idle_vehicles: Array<{ id: number; name: string; plate_number: string; type: string | null }>;
    compliance: {
        documents: { available: boolean; expired: number; expiring_30: number };
        maintenance: { available: boolean; overdue_work_orders: number; due_schedules: number };
        invoicing: { available: boolean; unsettled_deposits: number };
    };
}

interface Props {
    board: Board;
    exportUrl: string;
}

export default function Index({ board, exportUrl }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, utilisation, revenue, overdue, ending_soon, idle_vehicles, compliance, kpis } = board;

    const [revenueTab, setRevenueTab] = useState<'vehicle' | 'partner' | 'type'>('vehicle');

    const exportHref = (type: string) => `${exportUrl}?type=${encodeURIComponent(type)}`;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.dashboard.title', undefined, 'Cockpit Operasional Rental')}
                    subtitle="Monitor utilisasi armada, transaksi berjalan, pendapatan MTD, dan tindak lanjut operasional unit."
                    actions={
                        <div className="flex items-center gap-2">
                            <Link
                                href={prefixedRoute('rental.create')}
                                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                            >
                                <span>🚗</span>
                                <span>Buat Sewa Baru</span>
                            </Link>

                            {/* Export CSV Dropdown */}
                            <Menu as="div" className="relative inline-block text-left">
                                <MenuButton className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                    <span>📥</span>
                                    <span>Export CSV</span>
                                    <span className="text-[10px] text-slate-400">▼</span>
                                </MenuButton>

                                <MenuItems
                                    anchor="bottom end"
                                    className="z-30 mt-1 w-52 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <MenuItem>
                                        <a
                                            href={exportHref('overdue')}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <span>⚠️</span>
                                            <span>Export Unit Terlambat</span>
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href={exportHref('ending_soon')}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <span>⏳</span>
                                            <span>Export Segera Berakhir</span>
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href={exportHref('revenue_mtd')}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <span>💰</span>
                                            <span>Export Pendapatan MTD</span>
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href={exportHref('idle')}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <span>🅿️</span>
                                            <span>Export Unit Idle (Tersedia)</span>
                                        </a>
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
                        </div>
                    }
                />
            }
        >
            <Head title={t('rental.dashboard.title', undefined, 'Dashboard Rental')} />
            <RentalNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
                {/* 1. Main Executive KPI Cards (Top 4) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Active Rentals */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unit Sedang Disewa</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-base font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                🚗
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-mono text-3xl font-black text-slate-900 dark:text-white">
                                {counts.active}
                            </span>
                            <span className="text-xs font-bold text-slate-500">Unit Berjalan</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                {counts.confirmed} Dikonfirmasi
                            </span>
                            <span>siap serah terima</span>
                        </div>
                    </div>

                    {/* Fleet Utilisation */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Utilisasi Armada</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-base font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                                📈
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="font-mono text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {utilisation.percent}%
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                                ({utilisation.on_rent}/{utilisation.fleet_active} Unit)
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: `${Math.min(100, utilisation.percent)}%` }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">{utilisation.idle} unit siap disewakan</p>
                        </div>
                    </div>

                    {/* Revenue MTD */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendapatan Bulan Ini</span>
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-base font-bold text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                                💰
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                                {formatMoney(revenue.mtd)}
                            </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
                            <span>ADR (Rata-rata/Hari):</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                                {kpis ? formatMoney(kpis.adr) : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Overdue Alert Card */}
                    <div
                        className={`relative overflow-hidden rounded-3xl border p-5 shadow-xs transition hover:shadow-md ${
                            counts.overdue > 0
                                ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/30'
                                : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className={`text-xs font-bold uppercase tracking-wider ${
                                    counts.overdue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'
                                }`}
                            >
                                Unit Terlambat (Overdue)
                            </span>
                            <span
                                className={`flex h-9 w-9 items-center justify-center rounded-2xl text-base font-bold ${
                                    counts.overdue > 0
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                }`}
                            >
                                {counts.overdue > 0 ? '⚠️' : '✓'}
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span
                                className={`font-mono text-3xl font-black ${
                                    counts.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                                }`}
                            >
                                {counts.overdue}
                            </span>
                            <span className="text-xs font-bold text-slate-500">Unit Melewati Batas</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
                            <span>Segera berakhir (≤3 hari):</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                {counts.ending_soon} Unit
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Secondary Metrics Row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-bold text-slate-400">RevPAC (Per Mobil Aktif)</p>
                        <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                            {kpis ? formatMoney(kpis.revpac) : '—'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Efisiensi unit MTD</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-bold text-slate-400">Deposit Tertahan (Held)</p>
                        <p className="mt-1 font-mono text-base font-black text-amber-600 dark:text-amber-400">
                            {counts.unsettled_deposits} Transaksi
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Perlu pengembalian</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-bold text-slate-400">Tingkat Kerusakan</p>
                        <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                            {kpis ? `${kpis.damage_rate}%` : '0%'}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Rasio klaim kerusakan</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-[11px] font-bold text-slate-400">Selesai & Dikembalikan</p>
                        <p className="mt-1 font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                            {counts.returned + counts.completed} Unit
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">Total transaksi rampung</p>
                    </div>
                </div>

                {/* 3. Compliance & Maintenance Alerts */}
                {(compliance.documents.available && (compliance.documents.expired > 0 || compliance.documents.expiring_30 > 0)) && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center gap-2.5">
                            <span className="text-lg">📄</span>
                            <div>
                                <span className="font-bold">Peringatan Dokumen Armada: </span>
                                <span>
                                    {compliance.documents.expired} dokumen STNK/KIR kadaluwarsa, {compliance.documents.expiring_30} jatuh tempo dalam 30 hari.
                                </span>
                            </div>
                        </div>
                        <Link
                            href={prefixedRoute('documents.index')}
                            className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                        >
                            Buka Dokumen →
                        </Link>
                    </div>
                )}

                {compliance.maintenance.available &&
                    (compliance.maintenance.overdue_work_orders > 0 || compliance.maintenance.due_schedules > 0) && (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                            <div className="flex items-center gap-2.5">
                                <span className="text-lg">🛠️</span>
                                <div>
                                    <span className="font-bold">Jadwal Servis & Perawatan: </span>
                                    <span>
                                        {compliance.maintenance.overdue_work_orders} SPK terlambat, {compliance.maintenance.due_schedules} servis berkala jatuh tempo.
                                    </span>
                                </div>
                            </div>
                            <Link
                                href={prefixedRoute('maintenance.schedules.index')}
                                className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                            >
                                Buka Perawatan →
                            </Link>
                        </div>
                    )}

                {/* 4. Actionable Operations Grid (Overdue & Ending Soon) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Overdue Rentals List */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-xs font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    ⚠️
                                </span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Perlu Tindakan: Unit Terlambat ({overdue.length})
                                </h3>
                            </div>
                            <Link
                                href={prefixedRoute('rental.index')}
                                className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Lihat Semua
                            </Link>
                        </div>

                        {overdue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <span className="text-3xl mb-2">🎉</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Semua Unit Tepat Waktu</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">Tidak ada pengembalian yang melewati batas waktu.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {overdue.map((row) => (
                                    <div
                                        key={row.id}
                                        className="flex items-center justify-between p-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-850/50"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={prefixedRoute('rental.show', row.id)}
                                                    className="font-mono text-xs font-black text-indigo-600 hover:underline dark:text-indigo-400"
                                                >
                                                    {row.code}
                                                </Link>
                                                <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                                                    Terlambat
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-700 dark:text-slate-300">
                                                <span className="font-bold">{row.vehicle?.name ?? 'Unit'}</span>
                                                <span className="font-mono text-[11px] text-slate-400"> ({row.vehicle?.plate_number})</span>
                                                <span className="text-slate-400"> · {row.partner?.name ?? 'Pelanggan'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                                                Jatuh Tempo: {row.end_date}
                                            </div>
                                            <Link
                                                href={prefixedRoute('rental.show', row.id)}
                                                className="mt-1 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                            >
                                                Proses Return →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ending Soon List */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-xs font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    ⏳
                                </span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Berakhir Dalam 3 Hari ({ending_soon.length})
                                </h3>
                            </div>
                            <Link
                                href={prefixedRoute('rental.index')}
                                className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                            >
                                Lihat Semua
                            </Link>
                        </div>

                        {ending_soon.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                                <span className="text-3xl mb-2">📅</span>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak Ada Sewa Segera Berakhir</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">Tidak ada pengembalian unit dalam 3 hari ke depan.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {ending_soon.map((row) => (
                                    <div
                                        key={row.id}
                                        className="flex items-center justify-between p-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-850/50"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={prefixedRoute('rental.show', row.id)}
                                                    className="font-mono text-xs font-black text-indigo-600 hover:underline dark:text-indigo-400"
                                                >
                                                    {row.code}
                                                </Link>
                                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                                    Segera Kembali
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-700 dark:text-slate-300">
                                                <span className="font-bold">{row.vehicle?.name ?? 'Unit'}</span>
                                                <span className="font-mono text-[11px] text-slate-400"> ({row.vehicle?.plate_number})</span>
                                                <span className="text-slate-400"> · {row.partner?.name ?? 'Pelanggan'}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                Kembali: {row.end_date}
                                            </div>
                                            <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                                                {formatMoney(row.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Revenue Breakdown & Top Contributors (Analytics) */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                📊
                            </span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Analitik Pendapatan Sewa (MTD)
                                </h3>
                                <p className="text-xs text-slate-400">Rincian pendapatan berdasarkan unit armada, partner, dan jenis sewa.</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-850">
                            {[
                                { key: 'vehicle', label: '🚗 Per Armada' },
                                { key: 'partner', label: '👥 Per Pelanggan' },
                                { key: 'type', label: '⏱️ Jenis Sewa' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setRevenueTab(tab.key as any)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        revenueTab === tab.key
                                            ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-800 dark:text-indigo-300'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5">
                        {revenueTab === 'vehicle' && (
                            <div className="space-y-3">
                                {revenue.by_vehicle.length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400">Belum ada data pendapatan per armada bulan ini.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {revenue.by_vehicle.map((row) => (
                                            <div
                                                key={row.vehicle_id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-850"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-slate-900 dark:text-white">{row.name}</p>
                                                    <p className="font-mono text-[11px] text-slate-400">{row.plate_number} · ×{row.count} sewa</p>
                                                </div>
                                                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(row.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {revenueTab === 'partner' && (
                            <div className="space-y-3">
                                {revenue.by_partner.length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400">Belum ada data pendapatan per partner bulan ini.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {revenue.by_partner.map((row) => (
                                            <div
                                                key={row.partner_id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-850"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-slate-900 dark:text-white">{row.name}</p>
                                                    <p className="text-[11px] text-slate-400">×{row.count} transaksi</p>
                                                </div>
                                                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(row.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {revenueTab === 'type' && (
                            <div className="space-y-3">
                                {revenue.by_type.length === 0 ? (
                                    <p className="py-8 text-center text-xs text-slate-400">Belum ada data pendapatan per jenis sewa bulan ini.</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {revenue.by_type.map((row) => (
                                            <div
                                                key={row.type}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-850"
                                            >
                                                <div>
                                                    <p className="font-bold uppercase tracking-wider text-slate-900 dark:text-white">{row.type}</p>
                                                    <p className="text-[11px] text-slate-400">×{row.count} penyewaan</p>
                                                </div>
                                                <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                    {formatMoney(row.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Idle / Available Fleet Ready for Booking */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                🅿️
                            </span>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Armada Tersedia / Siap Disewakan ({idle_vehicles.length})
                                </h3>
                                <p className="text-xs text-slate-400">Unit dalam kondisi aktif yang siap diambil untuk sewa baru.</p>
                            </div>
                        </div>
                        <Link
                            href={prefixedRoute('rental.availability.index')}
                            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            Cek Kalender Ketersediaan →
                        </Link>
                    </div>

                    <div className="p-5">
                        {idle_vehicles.length === 0 ? (
                            <p className="py-8 text-center text-xs text-slate-400">Seluruh armada sedang dalam masa sewa (utilisasi 100%).</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {idle_vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs shadow-2xs transition hover:border-indigo-200 hover:bg-indigo-50/20 dark:border-slate-800 dark:bg-slate-850"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-slate-500">{vehicle.plate_number}</span>
                                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    Tersedia
                                                </span>
                                            </div>
                                            <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">{vehicle.name}</p>
                                            {vehicle.type && (
                                                <p className="text-[11px] text-slate-400">{vehicle.type}</p>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                                            <Link
                                                href={prefixedRoute('rental.create', { vehicle_id: vehicle.id })}
                                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-indigo-700"
                                            >
                                                <span>Sewa Sekarang</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

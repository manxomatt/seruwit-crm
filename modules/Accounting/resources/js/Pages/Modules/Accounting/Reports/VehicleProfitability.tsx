import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatMoney } from '@/utils/money';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface VehicleKpi {
    total_revenue: number;
    total_expense: number;
    net_profit: number;
    average_margin_pct: number;
    total_vehicles: number;
    profitable_count: number;
    unprofitable_count: number;
}

interface FleetRow {
    vehicle_id: number;
    plate_number: string;
    name: string;
    type: string;
    home_base_name: string;
    partner_name: string;
    ownership_type: string;
    revenue: number;
    expense: number;
    net_profit: number;
    margin_pct: number;
    fuel_cost: number;
    maintenance_cost: number;
    doc_cost: number;
    driver_cost: number;
}

interface VehicleDetail {
    vehicle: {
        id: number;
        name: string;
        plate_number: string;
        type: string;
        ownership_type: string;
        partner_name?: string | null;
        home_base_name?: string | null;
    };
    date_range: { from: string; to: string };
    revenues: { rental: number; shuttle: number; other: number; total: number };
    expenses: {
        fuel: number;
        toll_parking: number;
        maintenance: number;
        vehicle_doc: number;
        driver_allowance: number;
        depreciation: number;
        partner_settlement: number;
        other: number;
        total: number;
    };
    net_profit: number;
    margin_pct: number;
    transactions: Array<{
        date: string;
        entry_number: string;
        memo: string;
        account_code: string;
        account_name: string;
        category: string;
        debit: number;
        credit: number;
        amount: number;
    }>;
}

interface Props {
    filters: {
        from: string;
        to: string;
        vehicle_id?: number | null;
        fleet_base_id?: number | null;
    };
    kpi: VehicleKpi;
    rows: FleetRow[];
    selectedVehicle?: VehicleDetail | null;
    vehicles: Array<{ id: number; plate_number: string; name: string }>;
    bases: Array<{ id: number; code: string; name: string }>;
}

export default function VehicleProfitability({
    filters,
    kpi,
    rows,
    selectedVehicle,
    vehicles,
    bases,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [vehicleId, setVehicleId] = useState(filters.vehicle_id ? String(filters.vehicle_id) : '');
    const [fleetBaseId, setFleetBaseId] = useState(filters.fleet_base_id ? String(filters.fleet_base_id) : '');

    const applyFilter = (vId = vehicleId, bId = fleetBaseId, f = from, t = to) => {
        router.get(
            prefixedRoute('accounting.reports.vehicle-profitability'),
            {
                from: f,
                to: t,
                vehicle_id: vId || undefined,
                fleet_base_id: bId || undefined,
            },
            { preserveState: true }
        );
    };

    return (
        <AccountingShell active="vehicle_profitability" title="Laporan Profitabilitas & Laba Rugi per Kendaraan">
            {/* Filters */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Dari Tanggal</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => {
                                setFrom(e.target.value);
                                applyFilter(vehicleId, fleetBaseId, e.target.value, to);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => {
                                setTo(e.target.value);
                                applyFilter(vehicleId, fleetBaseId, from, e.target.value);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Pool / Cabang</label>
                        <select
                            value={fleetBaseId}
                            onChange={(e) => {
                                setFleetBaseId(e.target.value);
                                applyFilter(vehicleId, e.target.value, from, to);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Cabang / Pool</option>
                            {bases.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} ({b.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Pilih Unit Kendaraan</label>
                        <select
                            value={vehicleId}
                            onChange={(e) => {
                                setVehicleId(e.target.value);
                                applyFilter(e.target.value, fleetBaseId, from, to);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">Semua Unit (Ikhtisar Armada)</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.plate_number} — {v.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Pendapatan Armada</span>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatMoney(kpi.total_revenue)}</p>
                    <span className="mt-1 block text-xs text-slate-400">{kpi.total_vehicles} unit termonitor</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Biaya Operasional</span>
                    <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{formatMoney(kpi.total_expense)}</p>
                    <span className="mt-1 block text-xs text-slate-400">BBM, Servis, Pajak & SPPD</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Laba Bersih Armada</span>
                    <p className={`mt-2 text-2xl font-black ${kpi.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatMoney(kpi.net_profit)}
                    </p>
                    <span className="mt-1 block text-xs text-slate-400">Margin Rata-rata: {kpi.average_margin_pct}%</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Rasio Profitabilitas</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-600">{kpi.profitable_count}</span>
                        <span className="text-sm font-semibold text-slate-500">Untung /</span>
                        <span className="text-2xl font-black text-rose-600">{kpi.unprofitable_count}</span>
                        <span className="text-sm font-semibold text-slate-500">Rugi</span>
                    </div>
                    <span className="mt-1 block text-xs text-slate-400">Unit dengan laba positif</span>
                </div>
            </div>

            {/* Selected Vehicle Drilldown Detail Card */}
            {selectedVehicle && (
                <div className="mb-6 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-white p-6 shadow-sm dark:border-indigo-900/40 dark:bg-slate-900">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4 dark:border-indigo-900/50">
                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 font-mono text-xs font-bold text-white shadow-sm">
                                🚗 {selectedVehicle.vehicle.plate_number}
                            </span>
                            <h3 className="mt-1.5 text-lg font-black text-slate-900 dark:text-white">
                                {selectedVehicle.vehicle.name} ({selectedVehicle.vehicle.type})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Pool: {selectedVehicle.vehicle.home_base_name ?? 'Pusat'} • Kepemilikan:{' '}
                                {selectedVehicle.vehicle.ownership_type === 'partner' ? `Mitra (${selectedVehicle.vehicle.partner_name})` : 'Milik Sendiri'}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Net Laba Unit</span>
                            <p className={`text-2xl font-black ${selectedVehicle.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatMoney(selectedVehicle.net_profit)}
                            </p>
                            <span className="text-xs font-bold text-slate-500">Margin: {selectedVehicle.margin_pct}%</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Revenues */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <h4 className="mb-3 text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">
                                📈 Rincian Pendapatan Unit
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Pendapatan Sewa Rental</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.revenues.rental)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Pendapatan Tiket Shuttle / Travel</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.revenues.shuttle)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Pendapatan Operasional Lainnya</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.revenues.other)}</span>
                                </div>
                                <div className="flex justify-between pt-2 font-bold text-slate-900 dark:text-white">
                                    <span>Total Pendapatan</span>
                                    <span className="text-emerald-600">{formatMoney(selectedVehicle.revenues.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                            <h4 className="mb-3 text-xs font-bold text-rose-700 uppercase dark:text-rose-400">
                                📉 Rincian Beban & Pengeluaran Langsung
                            </h4>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">BBM & Bahan Bakar (COA 6110)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.fuel)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Tol, Parkir & Retribusi (COA 6120)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.toll_parking)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Servis & Suku Cadang (COA 6130)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.maintenance)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Pajak STNK, KIR & Asuransi (COA 6140)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.vehicle_doc)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Uang Makan / Dinas Supir (COA 6150)</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.driver_allowance)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Penyusutan Aset Kendaraan</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.depreciation)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Bagi Hasil Mitra / Settlement</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(selectedVehicle.expenses.partner_settlement)}</span>
                                </div>
                                <div className="flex justify-between pt-1.5 font-bold text-sm text-slate-900 dark:text-white">
                                    <span>Total Beban Operasional</span>
                                    <span className="text-rose-600">{formatMoney(selectedVehicle.expenses.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Audit Log */}
                    {selectedVehicle.transactions.length > 0 && (
                        <div className="mt-6">
                            <h4 className="mb-3 text-xs font-bold text-slate-500 uppercase">
                                📑 Riwayat Jurnal Transaksi Unit ({selectedVehicle.transactions.length})
                            </h4>
                            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-900">
                                <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 border-b bg-slate-50 font-bold text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-3 py-2">Tanggal</th>
                                            <th className="px-3 py-2">No. Jurnal</th>
                                            <th className="px-3 py-2">Kategori</th>
                                            <th className="px-3 py-2">Keterangan / Memo</th>
                                            <th className="px-3 py-2 text-right">Debit</th>
                                            <th className="px-3 py-2 text-right">Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {selectedVehicle.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-3 py-2 font-mono whitespace-nowrap">{tx.date}</td>
                                                <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">{tx.entry_number}</td>
                                                <td className="px-3 py-2">
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium dark:bg-slate-800">
                                                        {tx.category}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{tx.memo}</td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-900 dark:text-white">
                                                    {tx.debit > 0 ? formatMoney(tx.debit) : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-900 dark:text-white">
                                                    {tx.credit > 0 ? formatMoney(tx.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fleet Ranking Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Peringkat Profitabilitas Unit Armada</h3>
                    <p className="text-xs text-slate-500">Urutan kendaraan berdasarkan performa margin laba bersih operasional.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3">Unit / Plat Nomor</th>
                                <th className="px-4 py-3">Pool & Kepemilikan</th>
                                <th className="px-4 py-3 text-right">Pendapatan</th>
                                <th className="px-4 py-3 text-right">BBM</th>
                                <th className="px-4 py-3 text-right">Servis</th>
                                <th className="px-4 py-3 text-right">Total Biaya</th>
                                <th className="px-4 py-3 text-right">Net Profit</th>
                                <th className="px-4 py-3 text-right">Margin %</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                        Tidak ada data transaksi kendaraan dalam periode ini.
                                    </td>
                                </tr>
                            )}
                            {rows.map((r, idx) => (
                                <tr key={r.vehicle_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                #{idx + 1}
                                            </span>
                                            <div>
                                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {r.plate_number}
                                                </span>
                                                <span className="block text-xs text-slate-400">{r.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                        <span className="font-medium text-slate-900 dark:text-white">{r.home_base_name}</span>
                                        <span className="block text-slate-400">{r.partner_name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                                        {formatMoney(r.revenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                                        {r.fuel_cost > 0 ? formatMoney(r.fuel_cost) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                                        {r.maintenance_cost > 0 ? formatMoney(r.maintenance_cost) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                                        {formatMoney(r.expense)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                        <span className={r.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {formatMoney(r.net_profit)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${r.margin_pct >= 20 ? 'bg-emerald-100 text-emerald-800' : r.margin_pct >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {r.margin_pct}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVehicleId(String(r.vehicle_id));
                                                applyFilter(String(r.vehicle_id), fleetBaseId, from, to);
                                            }}
                                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                            Rincian
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AccountingShell>
    );
}

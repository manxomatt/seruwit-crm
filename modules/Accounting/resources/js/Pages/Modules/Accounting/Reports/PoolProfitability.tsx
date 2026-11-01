import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface PoolRow {
    id: number;
    code: string;
    name: string;
    city?: string | null;
    vehicle_count: number;
    revenue: number;
    expense: number;
    net_profit: number;
    margin_pct: number;
}

interface Props {
    filters: {
        from: string;
        to: string;
    };
    totals: {
        total_revenue: number;
        total_expense: number;
        net_profit: number;
        margin_pct: number;
    };
    pools: PoolRow[];
}

export default function PoolProfitability({ filters, totals, pools }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const applyFilter = (f = from, t = to) => {
        router.get(
            prefixedRoute('accounting.reports.pool-profitability'),
            { from: f, to: t },
            { preserveState: true }
        );
    };

    return (
        <AccountingShell active="pool_profitability" title="Laporan Laba Rugi per Pool & Cabang Armada">
            {/* Filter Bar */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Dari Tanggal</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => {
                                setFrom(e.target.value);
                                applyFilter(e.target.value, to);
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => {
                                setTo(e.target.value);
                                applyFilter(from, e.target.value);
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Pendapatan Cabang</span>
                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatMoney(totals.total_revenue)}</p>
                    <span className="mt-1 block text-xs text-slate-400">{pools.length} pool terdaftar</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Beban Operasional</span>
                    <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">{formatMoney(totals.total_expense)}</p>
                    <span className="mt-1 block text-xs text-slate-400">Seluruh cabang armada</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Laba Bersih Konsolidasi</span>
                    <p className={`mt-2 text-2xl font-black ${totals.net_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatMoney(totals.net_profit)}
                    </p>
                    <span className="mt-1 block text-xs text-slate-400">Margin Bersih: {totals.margin_pct}%</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Efisiensi Rata-Rata</span>
                    <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">{totals.margin_pct}%</p>
                    <span className="mt-1 block text-xs text-slate-400">Rasio laba terhadap omset</span>
                </div>
            </div>

            {/* Pool Comparison Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white">Perbandingan Profitabilitas Antar Pool / Cabang</h3>
                    <p className="text-xs text-slate-500">Evaluasi pendapatan, pengeluaran, dan net profit tiap titik garasi operasional.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3">Kode & Nama Cabang</th>
                                <th className="px-4 py-3">Kota</th>
                                <th className="px-4 py-3 text-center">Jumlah Unit</th>
                                <th className="px-4 py-3 text-right">Pendapatan</th>
                                <th className="px-4 py-3 text-right">Biaya Operasional</th>
                                <th className="px-4 py-3 text-right">Net Profit</th>
                                <th className="px-4 py-3 text-right">Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pools.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        Belum ada data pool/cabang armada yang terdaftar.
                                    </td>
                                </tr>
                            )}
                            {pools.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            [{p.code}]
                                        </span>{' '}
                                        <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{p.city ?? '-'}</td>
                                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {p.vehicle_count}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                                        {formatMoney(p.revenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400">
                                        {formatMoney(p.expense)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                        <span className={p.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {formatMoney(p.net_profit)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${p.margin_pct >= 20 ? 'bg-emerald-100 text-emerald-800' : p.margin_pct >= 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {p.margin_pct}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {pools.length > 0 && (
                            <tfoot className="border-t bg-slate-50 font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-xs uppercase">
                                        Total Konsolidasi Seluruh Cabang
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                        {pools.reduce((acc, curr) => acc + curr.vehicle_count, 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{formatMoney(totals.total_revenue)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-rose-600">{formatMoney(totals.total_expense)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-600">{formatMoney(totals.net_profit)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{totals.margin_pct}%</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </AccountingShell>
    );
}

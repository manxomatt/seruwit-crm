import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';
import ExpensesShell from '../ExpensesShell';

interface Props {
    kpis: {
        posted_month_total: number;
        draft_claims_count: number;
        open_advances_amount: number;
        open_advances_count: number;
    };
    categoryBreakdown: Array<{
        category: string;
        amount: number;
        count: number;
    }>;
    recentClaims: Array<{
        id: number;
        code: string;
        expense_date: string;
        type: string;
        title: string;
        total_amount: number;
        status: string;
        payment_method: string;
        bank_account_name?: string | null;
        categories: string[];
    }>;
    activeAdvances: Array<{
        id: number;
        code: string;
        advance_date: string;
        purpose: string;
        recipient_name: string;
        amount: number;
        status: string;
    }>;
    can: {
        create: boolean;
        disburse: boolean;
    };
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function ExpensesDashboard({ kpis, categoryBreakdown, recentClaims, activeAdvances, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <ExpensesShell
            active="dashboard"
            title="Pengeluaran Operasional, Petty Cash & Kasbon"
            headerActions={
                <div className="flex items-center gap-2">
                    {can.create && (
                        <>
                            <Link
                                href={prefixedRoute('expenses.advances.create')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                            >
                                + Ajukan Kasbon / Uang Jalan
                            </Link>
                            <Link
                                href={prefixedRoute('expenses.claims.create')}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                            >
                                + Catat Pengeluaran Baru
                            </Link>
                        </>
                    )}
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pengeluaran Bulan Ini</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatIdr(kpis.posted_month_total)}</p>
                    <p className="mt-1 text-xs text-slate-500">Terposting ke Buku Besar & Buku Bank</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kasbon Belum LPJ</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{formatIdr(kpis.open_advances_amount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{kpis.open_advances_count} kasbon aktif menunggu penyelesaian</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft Voucher Biaya</p>
                    <p className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{kpis.draft_claims_count}</p>
                    <p className="mt-1 text-xs text-slate-500">Menunggu verifikasi & posting jurnal</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pos Kategori Aktif</p>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{categoryBreakdown.length}</p>
                    <p className="mt-1 text-xs text-slate-500">Kategori biaya terealisasi bulan ini</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Voucher Pengeluaran Terbaru</h3>
                        <Link href={prefixedRoute('expenses.claims.index')} className="text-xs font-bold text-indigo-600 hover:underline">
                            Lihat Semua
                        </Link>
                    </div>

                    {recentClaims.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-500">Belum ada voucher pengeluaran yang tercatat.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="text-left text-slate-500">
                                        <th className="py-2 pr-3">Kode</th>
                                        <th className="py-2 px-3">Tanggal</th>
                                        <th className="py-2 px-3">Keperluan</th>
                                        <th className="py-2 px-3 text-right">Nominal</th>
                                        <th className="py-2 pl-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentClaims.map((claim) => (
                                        <tr key={claim.id}>
                                            <td className="py-2.5 pr-3 font-bold">
                                                <Link href={prefixedRoute('expenses.claims.show', claim.id)} className="text-indigo-600 hover:underline">
                                                    {claim.code}
                                                </Link>
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{claim.expense_date}</td>
                                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{claim.title}</td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white">
                                                {formatIdr(claim.total_amount)}
                                            </td>
                                            <td className="py-2.5 pl-3 text-right">
                                                <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                                    {claim.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kasbon Aktif (Belum LPJ)</h3>
                        <Link href={prefixedRoute('expenses.advances.index')} className="text-xs font-bold text-indigo-600 hover:underline">
                            Semua Kasbon
                        </Link>
                    </div>

                    {activeAdvances.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-500">Tidak ada kasbon aktif yang menunggu LPJ.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeAdvances.map((adv) => (
                                <Link
                                    key={adv.id}
                                    href={prefixedRoute('expenses.advances.show', adv.id)}
                                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600">{adv.code}</p>
                                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{adv.purpose}</p>
                                        <p className="text-[11px] text-slate-500">{adv.recipient_name} • {adv.advance_date}</p>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{formatIdr(adv.amount)}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ExpensesShell>
    );
}

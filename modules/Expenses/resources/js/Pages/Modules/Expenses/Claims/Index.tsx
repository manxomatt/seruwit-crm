import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';
import ExpensesShell from '../ExpensesShell';

interface ClaimRow {
    id: number;
    code: string;
    expense_date: string;
    type: string;
    title: string;
    payment_method: string;
    total_amount: number;
    status: string;
    reference_number?: string | null;
    bank_account?: { id: number; name: string; kind: string } | null;
    partner_name?: string | null;
    lines_count: number;
    categories: string[];
}

interface Props {
    claims: {
        data: ClaimRow[];
    };
    can: {
        create: boolean;
        post: boolean;
    };
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function ExpenseClaimsIndex({ claims, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <ExpensesShell
            active="claims"
            title="Daftar Pengeluaran Operasional & Petty Cash"
            headerActions={
                can.create ? (
                    <Link
                        href={prefixedRoute('expenses.claims.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                        + Catat Pengeluaran Baru
                    </Link>
                ) : undefined
            }
        >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2.5 pr-3">No. Voucher</th>
                                <th className="py-2.5 px-3">Tanggal</th>
                                <th className="py-2.5 px-3">Tipe</th>
                                <th className="py-2.5 px-3">Keperluan</th>
                                <th className="py-2.5 px-3">Rekening / Metode</th>
                                <th className="py-2.5 px-3 text-right">Total Nominal</th>
                                <th className="py-2.5 pl-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {claims.data.map((claim) => (
                                <tr key={claim.id}>
                                    <td className="py-3 pr-3 font-bold">
                                        <Link href={prefixedRoute('expenses.claims.show', claim.id)} className="text-indigo-600 hover:underline">
                                            {claim.code}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{claim.expense_date}</td>
                                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{claim.type}</td>
                                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{claim.title}</td>
                                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                                        {claim.bank_account ? claim.bank_account.name : claim.payment_method}
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                                        {formatIdr(claim.total_amount)}
                                    </td>
                                    <td className="py-3 pl-3 text-right">
                                        <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                            {claim.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ExpensesShell>
    );
}

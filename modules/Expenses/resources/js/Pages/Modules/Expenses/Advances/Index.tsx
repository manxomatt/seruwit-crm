import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Link } from '@inertiajs/react';
import ExpensesShell from '../ExpensesShell';

interface AdvanceRow {
    id: number;
    code: string;
    advance_date: string;
    purpose: string;
    recipient_name?: string | null;
    payment_method: string;
    amount: number;
    spent_amount: number;
    returned_amount: number;
    reimbursed_amount: number;
    outstanding_balance: number;
    status: string;
}

interface Props {
    advances: {
        data: AdvanceRow[];
    };
    can: {
        create: boolean;
        disburse: boolean;
        settle: boolean;
    };
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

export default function CashAdvancesIndex({ advances, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <ExpensesShell
            active="advances"
            title="Kasbon & Uang Jalan Operasional"
            headerActions={
                can.create ? (
                    <Link
                        href={prefixedRoute('expenses.advances.create')}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                        + Ajukan Kasbon / Uang Jalan
                    </Link>
                ) : undefined
            }
        >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2.5 pr-3">Kode Kasbon</th>
                                <th className="py-2.5 px-3">Tanggal</th>
                                <th className="py-2.5 px-3">Penerima</th>
                                <th className="py-2.5 px-3">Keperluan</th>
                                <th className="py-2.5 px-3 text-right">Plafon Cair</th>
                                <th className="py-2.5 px-3 text-right">Realisasi LPJ</th>
                                <th className="py-2.5 pl-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {advances.data.map((adv) => (
                                <tr key={adv.id}>
                                    <td className="py-3 pr-3 font-bold">
                                        <Link href={prefixedRoute('expenses.advances.show', adv.id)} className="text-indigo-600 hover:underline">
                                            {adv.code}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{adv.advance_date}</td>
                                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{adv.recipient_name ?? '—'}</td>
                                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">{adv.purpose}</td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">{formatIdr(adv.amount)}</td>
                                    <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">{formatIdr(adv.spent_amount)}</td>
                                    <td className="py-3 pl-3 text-right">
                                        <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                            {adv.status}
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

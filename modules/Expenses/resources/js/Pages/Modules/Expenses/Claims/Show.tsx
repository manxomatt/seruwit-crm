import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { router } from '@inertiajs/react';
import ExpensesShell from '../ExpensesShell';

interface Props {
    claim: {
        id: number;
        code: string;
        expense_date: string;
        type: string;
        title: string;
        payment_method: string;
        total_amount: number;
        status: string;
        reference_number?: string | null;
        notes?: string | null;
        lines: Array<{
            id: number;
            description: string;
            amount: number;
            receipt_number?: string | null;
            category?: { id: number; code: string; name: string } | null;
            account?: { id: number; code: string; name: string } | null;
        }>;
    };
    journal?: {
        id: number;
        number: string;
        status: string;
        entry_date: string;
    } | null;
    can: {
        post: boolean;
        delete: boolean;
    };
}

export default function ExpenseClaimShow({ claim, journal, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <ExpensesShell
            active="claims"
            title={`Voucher Pengeluaran ${claim.code}`}
            headerActions={
                <div className="flex items-center gap-2">
                    {claim.status === 'draft' && can.post && (
                        <button
                            type="button"
                            onClick={() => router.post(prefixedRoute('expenses.claims.post', claim.id))}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                            Posting ke Jurnal & Buku Bank
                        </button>
                    )}
                    {claim.status !== 'voided' && can.delete && (
                        <button
                            type="button"
                            onClick={() => router.post(prefixedRoute('expenses.claims.void', claim.id))}
                            className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700"
                        >
                            Batalkan (Void)
                        </button>
                    )}
                </div>
            }
        >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{claim.title}</h3>
                        <p className="text-xs text-slate-500">
                            {claim.expense_date} • Metode: {claim.payment_method} • Status: {claim.status}
                        </p>
                    </div>
                    {journal && (
                        <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            Jurnal: {journal.number}
                        </span>
                    )}
                </div>
            </div>
        </ExpensesShell>
    );
}

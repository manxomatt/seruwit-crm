import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { router } from '@inertiajs/react';
import ExpensesShell from '../ExpensesShell';

interface Props {
    advance: {
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
    };
    can: {
        disburse: boolean;
        settle: boolean;
        delete: boolean;
    };
}

export default function CashAdvanceShow({ advance, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <ExpensesShell
            active="advances"
            title={`Kasbon ${advance.code}`}
            headerActions={
                <div className="flex items-center gap-2">
                    {advance.status === 'draft' && can.disburse && (
                        <button
                            type="button"
                            onClick={() => router.post(prefixedRoute('expenses.advances.disburse', advance.id))}
                            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                            Cairkan Kasbon
                        </button>
                    )}
                </div>
            }
        >
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{advance.purpose}</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Penerima: {advance.recipient_name ?? '—'} • Status: {advance.status}
                </p>
            </div>
        </ExpensesShell>
    );
}

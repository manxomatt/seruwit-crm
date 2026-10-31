import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import ExpensesShell from '../ExpensesShell';

interface Props {
    suggestedCode: string;
    types: string[];
    paymentMethods: string[];
    categories: Array<{ id: number; code: string; name: string; account_id: number | null }>;
    accounts: Array<{ id: number; code: string; name: string }>;
    bankAccounts: Array<{ id: number; name: string; kind: string }>;
}

export default function ExpenseClaimsCreate({ categories, accounts, bankAccounts, paymentMethods }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing } = useForm({
        expense_date: new Date().toISOString().slice(0, 10),
        type: 'direct_expense',
        title: '',
        payment_method: paymentMethods[0] ?? 'cash',
        company_bank_account_id: bankAccounts[0]?.id ?? '',
        reference_number: '',
        notes: '',
        post_immediately: true,
        lines: [
            {
                expense_category_id: categories[0]?.id ?? '',
                account_id: categories[0]?.account_id ?? accounts[0]?.id ?? '',
                description: '',
                amount: '',
                receipt_number: '',
            },
        ],
    });

    function handleSubmit(e: FormEvent): void {
        e.preventDefault();
        post(prefixedRoute('expenses.claims.store'));
    }

    return (
        <ExpensesShell active="claims" title="Catat Pengeluaran Operasional / Petty Cash">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={data.expense_date}
                            onChange={(e) => setData('expense_date', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Keperluan Pengeluaran</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                            placeholder="Contoh: Pembelian BBM & Tol Operasional Armada"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Simpan Pengeluaran
                    </button>
                </div>
            </form>
        </ExpensesShell>
    );
}

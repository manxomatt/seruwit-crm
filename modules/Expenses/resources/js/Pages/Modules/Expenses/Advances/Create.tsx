import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import ExpensesShell from '../ExpensesShell';

interface Props {
    suggestedCode: string;
    paymentMethods: string[];
    bankAccounts: Array<{ id: number; name: string; kind: string }>;
}

export default function CashAdvancesCreate({ paymentMethods, bankAccounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing } = useForm({
        advance_date: new Date().toISOString().slice(0, 10),
        purpose: '',
        recipient_name: '',
        payment_method: paymentMethods[0] ?? 'cash',
        company_bank_account_id: bankAccounts[0]?.id ?? '',
        amount: '',
        notes: '',
        disburse_immediately: true,
    });

    function handleSubmit(e: FormEvent): void {
        e.preventDefault();
        post(prefixedRoute('expenses.advances.store'));
    }

    return (
        <ExpensesShell active="advances" title="Ajukan Kasbon / Uang Jalan Baru">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kasbon</label>
                        <input
                            type="date"
                            value={data.advance_date}
                            onChange={(e) => setData('advance_date', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Penerima / Pengemudi</label>
                        <input
                            type="text"
                            value={data.recipient_name}
                            onChange={(e) => setData('recipient_name', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nominal Kasbon (IDR)</label>
                        <input
                            type="number"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Keperluan</label>
                    <input
                        type="text"
                        value={data.purpose}
                        onChange={(e) => setData('purpose', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Simpan Kasbon
                    </button>
                </div>
            </form>
        </ExpensesShell>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';

interface Expense {
    id: number;
    category: string;
    amount: string;
    note: string | null;
}

interface Allowance {
    id: number;
    advance_amount: string;
    status: string;
    issued_at: string;
    settled_at: string | null;
    notes: string | null;
    trip: {
        id: number;
        code: string;
        origin: string;
        destination: string;
        status: string;
        driver: { id: number; name: string } | null;
    };
    expenses: Expense[];
}

interface Props {
    allowance: Allowance;
    balance: number;
    categories: string[];
    can: { create: boolean; update: boolean; delete: boolean };
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isSettled = status === 'settled';

    const style = isSettled
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50';

    const dot = isSettled ? 'bg-emerald-500' : 'bg-sky-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`billing.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Show({ allowance, balance, categories, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showSettleModal, setShowSettleModal] = useState(false);

    const expenseForm = useForm({
        category: '',
        amount: '',
        note: '',
    });

    const isIssued = allowance.status === 'issued';
    const totalExpenses = allowance.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    const submitExpense: FormEventHandler = (e) => {
        e.preventDefault();
        expenseForm.post(prefixedRoute('billing.allowances.expenses.store', allowance.id), {
            preserveScroll: true,
            onSuccess: () => expenseForm.reset(),
        });
    };

    const deleteExpense = (id: number) => {
        router.delete(prefixedRoute('billing.allowances.expenses.destroy', [allowance.id, id]), { preserveScroll: true });
    };

    const confirmSettle = () => {
        router.post(prefixedRoute('billing.allowances.settle', allowance.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowSettleModal(false),
        });
    };

    const deleteAllowance = () => {
        router.delete(prefixedRoute('billing.allowances.destroy', allowance.id));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.allowances.show_title', { code: allowance.trip.code })}
                    description={<StatusBadge status={allowance.status} />}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            {can.update && isIssued && (
                                <PrimaryButton onClick={() => setShowSettleModal(true)} className="!rounded-xl text-xs shadow-sm">
                                    ✅ {t('billing.allowances.settle')}
                                </PrimaryButton>
                            )}
                            <Link href={prefixedRoute('billing.allowances.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">{t('billing.allowances.back_list')}</SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('billing.allowances.show_head', { code: allowance.trip.code })} />

            <BillingNav />

            <div className="space-y-6">
                {/* Information Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.trip')}</dt>
                            <dd className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                                <Link href={prefixedRoute('transportation.trips.show', allowance.trip.id)} className="font-mono text-indigo-600 dark:text-indigo-400 hover:underline">
                                    {allowance.trip.code}
                                </Link>{' '}
                                — {allowance.trip.origin} → {allowance.trip.destination}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.driver')}</dt>
                            <dd className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{allowance.trip.driver?.name || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.advance')}</dt>
                            <dd className="mt-1 font-mono text-sm font-extrabold text-slate-900 dark:text-white">{formatMoney(allowance.advance_amount)}</dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.issued_at')}</dt>
                            <dd className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{allowance.issued_at}</dd>
                        </div>
                        {allowance.settled_at && (
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.settled_at')}</dt>
                                <dd className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{allowance.settled_at}</dd>
                            </div>
                        )}
                        {allowance.notes && (
                            <div className="sm:col-span-3">
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('billing.allowances.notes')}</dt>
                                <dd className="mt-1 text-xs text-slate-600 dark:text-slate-300">{allowance.notes}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Balance Card */}
                <div className={`rounded-3xl p-6 shadow-sm border ${balance >= 0 ? 'border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200' : 'border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200'}`}>
                    <p className="text-xs font-bold">
                        {balance >= 0
                            ? t('billing.allowances.driver_returns', { amount: formatMoney(balance) })
                            : t('billing.allowances.company_reimburses', { amount: formatMoney(Math.abs(balance)) })}
                    </p>
                    <p className="mt-1 text-[11px] font-medium opacity-80">
                        {t('billing.allowances.balance_breakdown', {
                            advance: formatMoney(allowance.advance_amount),
                            expenses: formatMoney(totalExpenses),
                        })}
                    </p>
                </div>

                {/* Expenses Section */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">🧾 {t('billing.allowances.expenses_title')}</h3>

                    {allowance.expenses.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400">{t('billing.allowances.expenses_empty')}</p>
                    ) : (
                        <ul className="space-y-3">
                            {allowance.expenses.map((expense) => (
                                <li key={expense.id} className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50/40 dark:bg-slate-800/30">
                                    <div>
                                        <p className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                                            {t(`billing.categories.${expense.category}`, undefined, expense.category)}
                                        </p>
                                        <p className="text-xs text-slate-500 font-mono">
                                            {formatMoney(expense.amount)}
                                            {expense.note ? ` — ${expense.note}` : ''}
                                        </p>
                                    </div>
                                    {can.update && isIssued && (
                                        <button onClick={() => deleteExpense(expense.id)} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                                            {t('common.delete')}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {can.update && isIssued && (
                        <form onSubmit={submitExpense} className="mt-6 grid grid-cols-1 items-end gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-6 sm:grid-cols-4">
                            <div>
                                <InputLabel htmlFor="e_category" value={t('billing.allowances.category')} />
                                <Select
                                    id="e_category"
                                    className="mt-1"
                                    value={expenseForm.data.category}
                                    onChange={(value) => expenseForm.setData('category', value)}
                                    placeholder={t('billing.allowances.select_category')}
                                    options={categories.map((category) => ({
                                        value: category,
                                        label: t(`billing.categories.${category}`, undefined, category),
                                    }))}
                                />
                                <InputError message={expenseForm.errors.category} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="e_amount" value={t('billing.allowances.amount')} />
                                <TextInput id="e_amount" type="number" min="0.01" step="0.01" className="mt-1 block w-full !rounded-2xl text-xs font-mono" value={expenseForm.data.amount} onChange={(e) => expenseForm.setData('amount', e.target.value)} required />
                                <InputError message={expenseForm.errors.amount} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="e_note" value={t('billing.allowances.note_optional')} />
                                <TextInput id="e_note" className="mt-1 block w-full !rounded-2xl text-xs" value={expenseForm.data.note} onChange={(e) => expenseForm.setData('note', e.target.value)} />
                                <InputError message={expenseForm.errors.note} className="mt-2" />
                            </div>
                            <div>
                                <PrimaryButton disabled={expenseForm.processing} className="!rounded-xl text-xs shadow-sm">➕ {t('billing.allowances.add')}</PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>

                {can.delete && isIssued && (
                    <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-950/20 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-200">{t('billing.allowances.delete_title')}</h3>
                                <p className="text-xs text-rose-700/80 dark:text-rose-300/80">{t('billing.allowances.delete_hint')}</p>
                            </div>
                            <button onClick={deleteAllowance} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                                {t('billing.allowances.delete_action')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Settlement Modal */}
            <Modal show={showSettleModal} onClose={() => setShowSettleModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{t('billing.allowances.settle_title')}</h3>
                    <p className="text-xs text-slate-500">
                        {balance >= 0
                            ? t('billing.allowances.settle_confirm_return', { amount: formatMoney(balance) })
                            : t('billing.allowances.settle_confirm_reimburse', { amount: formatMoney(Math.abs(balance)) })}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowSettleModal(false)} className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmSettle} className="!rounded-xl text-xs">✅ {t('billing.allowances.settle')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

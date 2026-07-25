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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {t('billing.allowances.show_title', { code: allowance.trip.code })}
                        </h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${allowance.status === 'settled' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {t(`billing.status.${allowance.status}`, undefined, allowance.status)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {can.update && isIssued && (
                            <PrimaryButton onClick={() => setShowSettleModal(true)}>{t('billing.allowances.settle')}</PrimaryButton>
                        )}
                        <Link href={prefixedRoute('billing.allowances.index')}>
                            <SecondaryButton>{t('billing.allowances.back_list')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={t('billing.allowances.show_head', { code: allowance.trip.code })} />

            <BillingNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.trip')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('transportation.trips.show', allowance.trip.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {allowance.trip.code}
                                    </Link>{' '}
                                    — {allowance.trip.origin} → {allowance.trip.destination}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.driver')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{allowance.trip.driver?.name || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.advance')}</dt>
                                <dd className="mt-1 text-sm font-semibold text-gray-900">{formatMoney(allowance.advance_amount)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.issued_at')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{allowance.issued_at}</dd>
                            </div>
                            {allowance.settled_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.settled_at')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{allowance.settled_at}</dd>
                                </div>
                            )}
                            {allowance.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('billing.allowances.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{allowance.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className={`overflow-hidden p-6 shadow-sm sm:rounded-lg ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-medium ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {balance >= 0
                            ? t('billing.allowances.driver_returns', { amount: formatMoney(balance) })
                            : t('billing.allowances.company_reimburses', { amount: formatMoney(Math.abs(balance)) })}
                    </p>
                    <p className={`mt-1 text-xs ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {t('billing.allowances.balance_breakdown', {
                            advance: formatMoney(allowance.advance_amount),
                            expenses: formatMoney(totalExpenses),
                        })}
                    </p>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">{t('billing.allowances.expenses_title')}</h3>

                        {allowance.expenses.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('billing.allowances.expenses_empty')}</p>
                        ) : (
                            <ul className="space-y-3">
                                {allowance.expenses.map((expense) => (
                                    <li key={expense.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                        <div>
                                            <p className="text-sm font-medium capitalize text-gray-900">
                                                {t(`billing.categories.${expense.category}`, undefined, expense.category)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatMoney(expense.amount)}
                                                {expense.note ? ` — ${expense.note}` : ''}
                                            </p>
                                        </div>
                                        {can.update && isIssued && (
                                            <button onClick={() => deleteExpense(expense.id)} className="text-sm text-red-600 hover:text-red-900">
                                                {t('common.delete')}
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {can.update && isIssued && (
                            <form onSubmit={submitExpense} className="mt-6 grid grid-cols-1 items-end gap-4 border-t border-gray-200 pt-6 sm:grid-cols-4">
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
                                    <TextInput id="e_amount" type="number" min="0.01" step="0.01" className="mt-1 block w-full" value={expenseForm.data.amount} onChange={(e) => expenseForm.setData('amount', e.target.value)} required />
                                    <InputError message={expenseForm.errors.amount} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="e_note" value={t('billing.allowances.note_optional')} />
                                    <TextInput id="e_note" className="mt-1 block w-full" value={expenseForm.data.note} onChange={(e) => expenseForm.setData('note', e.target.value)} />
                                    <InputError message={expenseForm.errors.note} className="mt-2" />
                                </div>
                                <div>
                                    <PrimaryButton disabled={expenseForm.processing}>{t('billing.allowances.add')}</PrimaryButton>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {can.delete && isIssued && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('billing.allowances.delete_title')}</h3>
                                <p className="text-sm text-gray-500">{t('billing.allowances.delete_hint')}</p>
                            </div>
                            <button onClick={deleteAllowance} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('billing.allowances.delete_action')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showSettleModal} onClose={() => setShowSettleModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('billing.allowances.settle_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {balance >= 0
                            ? t('billing.allowances.settle_confirm_return', { amount: formatMoney(balance) })
                            : t('billing.allowances.settle_confirm_reimburse', { amount: formatMoney(Math.abs(balance)) })}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowSettleModal(false)}>{t('common.cancel')}</SecondaryButton>
                        <DangerButton onClick={confirmSettle}>{t('billing.allowances.settle')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

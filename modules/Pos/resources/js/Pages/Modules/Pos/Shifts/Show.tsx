import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Select from '@/Components/Select';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PosLayout from '../../../../PosLayout';

interface SaleRow {
    id: number;
    code: string;
    status: string;
    grand_total: string | number;
    sold_at: string;
    cashier: { id: number; name: string } | null;
    payments: Array<{ method: string; amount: string | number }>;
}

interface DepositAccountOption {
    id: number;
    name: string;
    kind: string;
    account_code: string | null;
    account_name: string | null;
}

interface Shift {
    id: number;
    status: string;
    opening_float: string | number;
    closing_cash_counted: string | number | null;
    expected_cash: string | number | null;
    cash_variance: string | number | null;
    deposit_to_company_bank_account_id?: number | null;
    deposit_amount?: string | number | null;
    opened_at: string;
    closed_at: string | null;
    notes: string | null;
    warehouse: { id: number; name: string };
    opener: { id: number; name: string };
    closer: { id: number; name: string } | null;
    sales: SaleRow[];
}

interface Props {
    shift: Shift;
    expectedCash: number;
    depositAccounts: DepositAccountOption[];
    depositAccount: { id: number; name: string; kind: string } | null;
    can: { open_shift: boolean; close_shift: boolean; sell: boolean };
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function Show({ shift, expectedCash, depositAccounts = [], depositAccount, can }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [closing, setClosing] = useState(false);

    const defaultDepositTo =
        depositAccounts.find((account) => account.kind === 'bank')?.id ??
        depositAccounts[0]?.id ??
        '';

    const form = useForm({
        closing_cash_counted: String(expectedCash),
        deposit_to_company_bank_account_id: defaultDepositTo ? String(defaultDepositTo) : '',
        deposit_amount: String(expectedCash),
        notes: '',
    });

    const submitClose = (event: FormEvent): void => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            closing_cash_counted: Number(data.closing_cash_counted),
            deposit_to_company_bank_account_id: data.deposit_to_company_bank_account_id
                ? Number(data.deposit_to_company_bank_account_id)
                : null,
            deposit_amount: data.deposit_to_company_bank_account_id
                ? Number(data.deposit_amount || data.closing_cash_counted)
                : null,
        }));
        form.post(prefixedRoute('pos.shifts.close', shift.id), {
            onSuccess: () => setClosing(false),
        });
    };

    const depositOptions = [
        { value: '', label: t('pos.shifts.show.deposit_skip') },
        ...depositAccounts.map((account) => ({
            value: String(account.id),
            label: `${account.name}${account.account_code ? ` (${account.account_code})` : ''}`,
        })),
    ];

    return (
        <PosLayout title={t('pos.shifts.show.title', { id: shift.id })}>
            <Head title={t('pos.shifts.show.title', { id: shift.id })} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--pos-muted)]">{shift.warehouse.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                        {t('pos.shift_status.' + shift.status)} · {shift.opener.name} ·{' '}
                        {new Date(shift.opened_at).toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {shift.status === 'open' && can.sell && (
                        <Link
                            href={prefixedRoute('pos.terminal')}
                            className="rounded-lg bg-[var(--pos-pay)] px-4 py-2 text-sm font-semibold text-white"
                        >
                            {t('pos.nav.terminal')}
                        </Link>
                    )}
                    {shift.status === 'open' && can.close_shift && (
                        <PrimaryButton type="button" onClick={() => setClosing(true)}>
                            {t('pos.actions.close_shift')}
                        </PrimaryButton>
                    )}
                </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-[var(--pos-muted)]">{t('pos.shifts.show.expected_cash')}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(Number(shift.expected_cash ?? expectedCash))}</p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-[var(--pos-muted)]">{t('pos.shifts.show.counted')}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                        {shift.closing_cash_counted != null ? formatMoney(Number(shift.closing_cash_counted)) : '—'}
                    </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-[var(--pos-muted)]">{t('pos.shifts.show.variance')}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">
                        {shift.cash_variance != null ? formatMoney(Number(shift.cash_variance)) : '—'}
                    </p>
                </div>
            </div>

            {shift.status === 'closed' && (depositAccount || shift.deposit_amount != null) && (
                <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs uppercase text-[var(--pos-muted)]">{t('pos.shifts.show.deposit')}</p>
                    <p className="mt-1 text-sm text-gray-800">
                        {depositAccount ? depositAccount.name : t('pos.shifts.show.deposit_skip')}
                        {shift.deposit_amount != null ? ` · ${formatMoney(Number(shift.deposit_amount))}` : ''}
                    </p>
                </div>
            )}

            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--pos-muted)]">
                {t('pos.shifts.show.sales')}
            </h3>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.code')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.cashier')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.total')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.status')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {shift.sales.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    {t('pos.shifts.show.no_sales')}
                                </td>
                            </tr>
                        ) : (
                            shift.sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={prefixedRoute('pos.sales.show', sale.id)}
                                            className="font-medium text-[var(--pos-accent)] hover:underline"
                                        >
                                            {sale.code}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">{sale.cashier?.name}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(sale.grand_total))}</td>
                                    <td className="px-4 py-3">{t(`pos.sale_status.${sale.status}`, undefined, sale.status)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {closing && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
                    <form onSubmit={submitClose} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold">{t('pos.shifts.show.close_title')}</h3>
                        <p className="mt-2 text-sm text-[var(--pos-muted)]">
                            {t('pos.shifts.show.expected_cash')}: {formatMoney(expectedCash)}
                        </p>
                        <div className="mt-4">
                            <InputLabel value={t('pos.shifts.show.counted')} />
                            <TextInput
                                type="number"
                                min="0"
                                step="1"
                                className="mt-1 block w-full"
                                value={form.data.closing_cash_counted}
                                onChange={(e) => {
                                    form.setData('closing_cash_counted', e.target.value);
                                    if (!form.data.deposit_amount || form.data.deposit_amount === form.data.closing_cash_counted) {
                                        form.setData('deposit_amount', e.target.value);
                                    }
                                }}
                            />
                            <InputError message={form.errors.closing_cash_counted} className="mt-1" />
                            <InputError message={form.errors.shift} className="mt-1" />
                        </div>

                        {depositAccounts.length > 0 && (
                            <>
                                <div className="mt-4">
                                    <InputLabel value={t('pos.shifts.show.deposit_to')} />
                                    <Select
                                        className="mt-1"
                                        options={depositOptions}
                                        value={form.data.deposit_to_company_bank_account_id}
                                        onChange={(value) => form.setData('deposit_to_company_bank_account_id', value)}
                                        searchable
                                    />
                                    <p className="mt-1 text-xs text-[var(--pos-muted)]">{t('pos.shifts.show.deposit_help')}</p>
                                    <InputError message={form.errors.deposit_to_company_bank_account_id} className="mt-1" />
                                </div>
                                {form.data.deposit_to_company_bank_account_id !== '' && (
                                    <div className="mt-4">
                                        <InputLabel value={t('pos.shifts.show.deposit_amount')} />
                                        <TextInput
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="mt-1 block w-full"
                                            value={form.data.deposit_amount}
                                            onChange={(e) => form.setData('deposit_amount', e.target.value)}
                                        />
                                        <InputError message={form.errors.deposit_amount} className="mt-1" />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="mt-4">
                            <InputLabel value={t('pos.shifts.open_form.notes')} />
                            <TextInput
                                className="mt-1 block w-full"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setClosing(false)}
                                className="rounded-lg px-4 py-2 text-sm text-gray-600"
                            >
                                {t('common.cancel')}
                            </button>
                            <PrimaryButton disabled={form.processing}>{t('pos.actions.close_shift')}</PrimaryButton>
                        </div>
                    </form>
                </div>
            )}
        </PosLayout>
    );
}

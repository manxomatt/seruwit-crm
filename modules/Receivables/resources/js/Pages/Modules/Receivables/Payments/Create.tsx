import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo } from 'react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface Partner {
    id: number;
    code: string;
    name: string;
    credit_limit: string | null;
}

interface OpenInvoice {
    id: number;
    code: string;
    status: string;
    issue_date: string;
    due_date: string | null;
    total: number;
    amount_paid: number;
    balance: number;
}

interface Props {
    partners: Partner[];
    selectedPartnerId: number | null;
    selectedInvoiceId: number | null;
    openInvoices: OpenInvoice[];
    types: string[];
    methods: string[];
    companyBankAccounts?: Array<{ id: number; name: string; kind: string; account_code: string | null }>;
}

function typeOptionKey(type: string): string {
    return type === 'down_payment' ? 'down_payment_full' : type;
}

export default function Create({
    partners,
    selectedPartnerId,
    selectedInvoiceId,
    openInvoices,
    types,
    methods,
    companyBankAccounts = [],
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const { data, setData, processing, errors, setError, clearErrors } = useForm({
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        type: 'installment',
        method: 'transfer',
        company_bank_account_id: '',
        reference_number: '',
        notes: '',
        allocations: [] as Array<{ invoice_id: number; amount: string }>,
    });

    useEffect(() => {
        if (!selectedPartnerId) {
            return;
        }

        const seed = openInvoices.map((inv) => ({
            invoice_id: inv.id,
            amount: selectedInvoiceId && inv.id === selectedInvoiceId ? String(inv.balance) : '',
        }));

        setData((current) => ({
            ...current,
            partner_id: String(selectedPartnerId),
            allocations: seed,
            amount: selectedInvoiceId
                ? String(openInvoices.find((i) => i.id === selectedInvoiceId)?.balance ?? '')
                : current.amount,
            type: selectedInvoiceId ? 'settlement' : current.type,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPartnerId, selectedInvoiceId, openInvoices]);

    const allocatedTotal = useMemo(
        () => data.allocations.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0),
        [data.allocations],
    );

    const changePartner = (partnerId: string) => {
        setData('partner_id', partnerId);
        router.get(
            prefixedRoute('receivables.payments.create'),
            { partner_id: partnerId || undefined },
            { preserveState: false },
        );
    };

    const setAllocation = (invoiceId: number, amount: string) => {
        setData(
            'allocations',
            data.allocations.map((row) => (row.invoice_id === invoiceId ? { ...row, amount } : row)),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        clearErrors();

        const allocations = data.allocations
            .filter((row) => parseFloat(row.amount) > 0)
            .map((row) => ({
                invoice_id: row.invoice_id,
                amount: Number(row.amount),
            }));

        if (allocations.length === 0) {
            setError('allocations', t('receivables.payments.create.client_allocations_required'));
            return;
        }

        router.post(prefixedRoute('receivables.payments.store'), {
            partner_id: Number(data.partner_id),
            payment_date: data.payment_date,
            amount: Number(data.amount || allocatedTotal),
            type: data.type,
            method: data.method,
            company_bank_account_id: data.company_bank_account_id ? Number(data.company_bank_account_id) : null,
            reference_number: data.reference_number || null,
            notes: data.notes || null,
            allocations,
        });
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('receivables.payments.create.title')}</h2>}
        >
            <Head title={t('receivables.payments.create.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    <form onSubmit={submit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value={`${t('receivables.fields.partner_customer')} *`} />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.partner_id}
                                    onChange={(e) => changePartner(e.target.value)}
                                >
                                    <option value="">{t('receivables.placeholders.select')}</option>
                                    {partners.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} — {p.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_date" value={`${t('receivables.fields.payment_date')} *`} />
                                <TextInput
                                    id="payment_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                />
                                <InputError message={errors.payment_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value={`${t('receivables.fields.type')} *`} />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                >
                                    {types.map((type) => (
                                        <option key={type} value={type}>
                                            {t(`receivables.types.${typeOptionKey(type)}`, undefined, type)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value={`${t('receivables.fields.method')} *`} />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.method}
                                    onChange={(e) => setData('method', e.target.value)}
                                >
                                    {methods.map((method) => (
                                        <option key={method} value={method}>
                                            {t(`receivables.methods.${method}`, undefined, method)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.method} className="mt-2" />
                            </div>
                            {companyBankAccounts.length > 0 && (
                                <div>
                                    <InputLabel value={t('accounting.bank.posts_to')} />
                                    <select
                                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.company_bank_account_id}
                                        onChange={(e) => setData('company_bank_account_id', e.target.value)}
                                    >
                                        <option value="">{t('accounting.bank.use_method_default')}</option>
                                        {companyBankAccounts
                                            .filter((account) =>
                                                data.method === 'cash' ? account.kind === 'cash' : account.kind === 'bank',
                                            )
                                            .map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.name}
                                                    {account.account_code ? ` (${account.account_code})` : ''}
                                                </option>
                                            ))}
                                    </select>
                                    <InputError message={errors.company_bank_account_id} className="mt-2" />
                                </div>
                            )}
                            <div>
                                <InputLabel htmlFor="amount" value={`${t('receivables.fields.payment_amount')} *`} />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('receivables.payments.create.allocation_hint', { amount: formatMoney(allocatedTotal) })}
                                    {allocatedTotal > 0 && (
                                        <button
                                            type="button"
                                            className="ml-2 text-indigo-600 hover:underline"
                                            onClick={() => setData('amount', allocatedTotal.toFixed(2))}
                                        >
                                            {t('receivables.actions.match_amount')}
                                        </button>
                                    )}
                                </p>
                                <InputError message={errors.amount} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="reference_number" value={t('receivables.fields.reference_number')} />
                                <TextInput
                                    id="reference_number"
                                    className="mt-1 block w-full"
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    placeholder={t('receivables.placeholders.reference')}
                                />
                                <InputError message={errors.reference_number} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value={t('receivables.fields.notes')} />
                            <textarea
                                id="notes"
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('receivables.payments.create.allocation_section')}</h3>
                            <InputError message={errors.allocations} className="mt-1" />
                            {!data.partner_id ? (
                                <p className="mt-2 text-sm text-gray-500">{t('receivables.payments.create.select_partner_hint')}</p>
                            ) : openInvoices.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">{t('receivables.payments.create.no_open_invoices')}</p>
                            ) : (
                                <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.invoice')}</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.due')}</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.balance')}</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.allocation')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {openInvoices.map((invoice) => {
                                                const row = data.allocations.find((a) => a.invoice_id === invoice.id);
                                                return (
                                                    <tr key={invoice.id}>
                                                        <td className="px-3 py-2 font-medium">{invoice.code}</td>
                                                        <td className="px-3 py-2 text-gray-600">
                                                            {invoice.due_date
                                                                ? new Date(invoice.due_date).toLocaleDateString(localeTag)
                                                                : '—'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {formatMoney(invoice.balance)}
                                                            <button
                                                                type="button"
                                                                className="ml-2 text-xs text-indigo-600 hover:underline"
                                                                onClick={() => setAllocation(invoice.id, String(invoice.balance))}
                                                            >
                                                                {t('receivables.actions.full')}
                                                            </button>
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <TextInput
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="ml-auto block w-36 text-right"
                                                                value={row?.amount ?? ''}
                                                                onChange={(e) => setAllocation(invoice.id, e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('receivables.payments.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>{t('receivables.payments.create.submit')}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

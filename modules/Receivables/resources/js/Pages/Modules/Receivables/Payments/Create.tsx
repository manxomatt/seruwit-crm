import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
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
            { preserveState: false, replace: true },
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

    const bankAccountOptions = companyBankAccounts
        .filter((account) => (data.method === 'cash' ? account.kind === 'cash' : account.kind === 'bank'))
        .map((account) => ({
            value: String(account.id),
            label: account.account_code ? `${account.name} (${account.account_code})` : account.name,
        }));

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('receivables.payments.create.title')}
                    </h2>
                    <Link href={prefixedRoute('receivables.payments.index')}>
                        <SecondaryButton type="button">{t('common.back')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('receivables.payments.create.title')} />

            <ReceivablesNav />

            <form onSubmit={submit} className="max-w-4xl space-y-6 overflow-visible rounded-lg bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="partner_id" value={`${t('receivables.fields.partner_customer')} *`} />
                        <Select
                            id="partner_id"
                            className="mt-1"
                            searchable
                            value={data.partner_id}
                            onChange={changePartner}
                            placeholder={t('receivables.placeholders.select')}
                            searchPlaceholder={t('common.search')}
                            emptyText={t('common.no_options')}
                            noResultsText={t('common.no_results')}
                            options={partners.map((partner) => ({
                                value: String(partner.id),
                                label: `${partner.code} — ${partner.name}`,
                            }))}
                        />
                        <InputError message={errors.partner_id} className="mt-1" />
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
                        <InputError message={errors.payment_date} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="type" value={`${t('receivables.fields.type')} *`} />
                        <Select
                            id="type"
                            className="mt-1"
                            value={data.type}
                            onChange={(value) => setData('type', value)}
                            options={types.map((type) => ({
                                value: type,
                                label: t(`receivables.types.${typeOptionKey(type)}`, undefined, type),
                            }))}
                        />
                        <InputError message={errors.type} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="method" value={`${t('receivables.fields.method')} *`} />
                        <Select
                            id="method"
                            className="mt-1"
                            value={data.method}
                            onChange={(value) => {
                                setData('method', value);
                                setData('company_bank_account_id', '');
                            }}
                            options={methods.map((method) => ({
                                value: method,
                                label: t(`receivables.methods.${method}`, undefined, method),
                            }))}
                        />
                        <InputError message={errors.method} className="mt-1" />
                    </div>

                    {companyBankAccounts.length > 0 && (
                        <div>
                            <InputLabel htmlFor="company_bank_account_id" value={t('accounting.bank.posts_to')} />
                            <Select
                                id="company_bank_account_id"
                                className="mt-1"
                                searchable
                                value={data.company_bank_account_id}
                                onChange={(value) => setData('company_bank_account_id', value)}
                                placeholder={t('accounting.bank.use_method_default')}
                                searchPlaceholder={t('common.search')}
                                emptyText={t('common.no_options')}
                                noResultsText={t('common.no_results')}
                                options={bankAccountOptions}
                            />
                            <InputError message={errors.company_bank_account_id} className="mt-1" />
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
                        <InputError message={errors.amount} className="mt-1" />
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
                        <InputError message={errors.reference_number} className="mt-1" />
                    </div>

                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="notes" value={t('receivables.fields.notes')} />
                        <textarea
                            id="notes"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        {t('receivables.payments.create.allocation_section')}
                    </h3>
                    <InputError message={errors.allocations} className="mt-1" />
                    {!data.partner_id ? (
                        <p className="mt-2 text-sm text-gray-500">
                            {t('receivables.payments.create.select_partner_hint')}
                        </p>
                    ) : openInvoices.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-500">
                            {t('receivables.payments.create.no_open_invoices')}
                        </p>
                    ) : (
                        <div className="mt-3 overflow-x-auto rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                            {t('receivables.fields.invoice')}
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                            {t('receivables.fields.due')}
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                            {t('receivables.fields.balance')}
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                            {t('receivables.fields.allocation')}
                                        </th>
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

                <div className="flex justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('receivables.payments.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>{t('receivables.payments.create.submit')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

interface OpenBill {
    id: number;
    code: string;
    total: number;
    amount_paid: number;
    balance: number;
}

interface Props {
    partners: Array<{ id: number; code: string; name: string }>;
    selectedPartnerId: number | null;
    selectedBillId: number | null;
    openBills: OpenBill[];
    methods: string[];
    companyBankAccounts?: Array<{ id: number; name: string; kind: string; account_code: string | null }>;
}

export default function Create({
    partners,
    selectedPartnerId,
    selectedBillId,
    openBills,
    methods,
    companyBankAccounts = [],
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const form = useForm({
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: selectedBillId
            ? String(openBills.find((b) => b.id === selectedBillId)?.balance ?? '')
            : '',
        method: 'transfer',
        company_bank_account_id: '',
        reference_number: '',
        notes: '',
        allocations: selectedBillId
            ? [
                  {
                      supplier_bill_id: String(selectedBillId),
                      amount: String(openBills.find((b) => b.id === selectedBillId)?.balance ?? ''),
                  },
              ]
            : ([] as Array<{ supplier_bill_id: string; amount: string }>),
    });

    useEffect(() => {
        if (!selectedPartnerId) {
            return;
        }

        const selected = selectedBillId
            ? openBills.find((bill) => bill.id === selectedBillId)
            : undefined;

        form.setData((current) => ({
            ...current,
            partner_id: String(selectedPartnerId),
            amount: selected ? String(selected.balance) : current.amount,
            allocations: selected
                ? [{ supplier_bill_id: String(selected.id), amount: String(selected.balance) }]
                : current.allocations,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPartnerId, selectedBillId, openBills]);

    const changePartner = (partnerId: string): void => {
        form.setData('partner_id', partnerId);
        router.get(
            prefixedRoute('payables.payments.create'),
            {
                partner_id: partnerId || undefined,
                bill_id: partnerId && selectedBillId ? selectedBillId : undefined,
            },
            { preserveState: false, replace: true },
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('payables.payments.store'));
    };

    const selectBill = (bill: OpenBill): void => {
        form.setData({
            ...form.data,
            amount: String(bill.balance),
            allocations: [{ supplier_bill_id: String(bill.id), amount: String(bill.balance) }],
        });
    };

    const selectedAllocationId = form.data.allocations[0]?.supplier_bill_id ?? '';

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('payables.payments.create')}
                    </h2>
                    <Link href={prefixedRoute('payables.payments.index')}>
                        <SecondaryButton type="button">{t('common.back')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('payables.payments.create')} />

            <form onSubmit={submit} className="max-w-2xl space-y-4 overflow-visible rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="partner_id" value={t('payables.fields.supplier')} />
                    <Select
                        id="partner_id"
                        className="mt-1"
                        searchable
                        value={form.data.partner_id}
                        onChange={changePartner}
                        placeholder={t('payables.placeholders.select_supplier')}
                        searchPlaceholder={t('payables.placeholders.search_supplier')}
                        emptyText={t('common.no_options')}
                        noResultsText={t('common.no_results')}
                        options={partners.map((partner) => ({
                            value: String(partner.id),
                            label: partner.code ? `${partner.code} — ${partner.name}` : partner.name,
                        }))}
                    />
                    <InputError message={form.errors.partner_id} className="mt-1" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="payment_date" value={t('payables.fields.payment_date')} />
                        <TextInput
                            id="payment_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={form.data.payment_date}
                            onChange={(e) => form.setData('payment_date', e.target.value)}
                        />
                        <InputError message={form.errors.payment_date} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="method" value={t('payables.fields.method')} />
                        <Select
                            id="method"
                            className="mt-1"
                            value={form.data.method}
                            onChange={(value) => form.setData('method', value)}
                            placeholder={t('payables.placeholders.select_method')}
                            options={methods.map((method) => ({
                                value: method,
                                label: t(`payables.methods.${method}`, undefined, method),
                            }))}
                        />
                        <InputError message={form.errors.method} className="mt-1" />
                    </div>
                    {companyBankAccounts.length > 0 && (
                        <div>
                            <InputLabel
                                htmlFor="company_bank_account_id"
                                value={t('accounting.bank.posts_to')}
                            />
                            <Select
                                id="company_bank_account_id"
                                className="mt-1"
                                value={form.data.company_bank_account_id}
                                onChange={(value) => form.setData('company_bank_account_id', value)}
                                placeholder={t('accounting.bank.use_method_default')}
                                options={[
                                    { value: '', label: t('accounting.bank.use_method_default') },
                                    ...companyBankAccounts
                                        .filter((account) =>
                                            form.data.method === 'cash'
                                                ? account.kind === 'cash'
                                                : account.kind === 'bank',
                                        )
                                        .map((account) => ({
                                            value: String(account.id),
                                            label: account.account_code
                                                ? `${account.name} (${account.account_code})`
                                                : account.name,
                                        })),
                                ]}
                            />
                            <InputError message={form.errors.company_bank_account_id} className="mt-1" />
                        </div>
                    )}
                </div>

                {form.data.partner_id && openBills.length === 0 && (
                    <p className="text-sm text-gray-500">{t('payables.payments.no_open_bills')}</p>
                )}

                {openBills.length > 0 && (
                    <div className="space-y-2">
                        <InputLabel value={t('payables.payments.open_bills')} />
                        {openBills.map((bill) => {
                            const selected = selectedAllocationId === String(bill.id);

                            return (
                                <button
                                    key={bill.id}
                                    type="button"
                                    onClick={() => selectBill(bill)}
                                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                                        selected
                                            ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="font-medium text-gray-900">{bill.code}</span>
                                    <span className="tabular-nums text-gray-700">
                                        {Number(bill.balance).toLocaleString()}
                                    </span>
                                </button>
                            );
                        })}
                        <InputError message={form.errors.allocations} className="mt-1" />
                    </div>
                )}

                <div>
                    <InputLabel htmlFor="amount" value={t('payables.fields.amount')} />
                    <TextInput
                        id="amount"
                        type="number"
                        step="0.01"
                        className="mt-1 block w-full"
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                    />
                    <InputError message={form.errors.amount} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="reference_number" value={t('payables.fields.reference')} />
                    <TextInput
                        id="reference_number"
                        className="mt-1 block w-full"
                        value={form.data.reference_number}
                        onChange={(e) => form.setData('reference_number', e.target.value)}
                    />
                    <InputError message={form.errors.reference_number} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="notes" value={t('payables.fields.notes')} />
                    <TextInput
                        id="notes"
                        className="mt-1 block w-full"
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                    />
                    <InputError message={form.errors.notes} className="mt-1" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('payables.payments.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={form.processing}>{t('payables.payments.create')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

import { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { formatMoney } from '@/utils/money';

export type DepositPaymentMethod = 'cash' | 'transfer' | 'giro' | 'card' | 'other';

export type CompanyBankAccountOption = {
    id: number;
    name: string;
    kind?: string | null;
};

interface InvoiceOption {
    id: number;
    code: string;
    due_date: string | null;
    balance: number;
}

interface Props {
    show: boolean;
    rentalCode: string;
    invoices: InvoiceOption[];
    partnerId: number;
    companyBankAccounts: CompanyBankAccountOption[];
    onClose: () => void;
    onSubmit: (data: {
        payment_date: string;
        amount: number;
        type: string;
        method: string;
        company_bank_account_id: number | null;
        reference_number: string | null;
        notes: string | null;
        allocations: Array<{ invoice_id: number; amount: number }>;
    }) => void;
    processing: boolean;
    errors?: Record<string, string>;
}

export default function PayInvoicesModal({
    show,
    rentalCode,
    invoices,
    partnerId,
    companyBankAccounts,
    onClose,
    onSubmit,
    processing,
    errors = {},
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [method, setMethod] = useState<DepositPaymentMethod>('transfer');
    const [type, setType] = useState('settlement');
    const [bankAccountId, setBankAccountId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [allocations, setAllocations] = useState<Record<number, string>>({});

    const openInvoices = useMemo(
        () => invoices.filter((inv) => inv.balance > 0.009),
        [invoices],
    );

    const totalAllocated = useMemo(
        () =>
            openInvoices.reduce(
                (sum, inv) => sum + (Number(allocations[inv.id]) || 0),
                0,
            ),
        [openInvoices, allocations],
    );

    const needsBank = method === 'transfer' || method === 'giro';
    const bankOptions = useMemo(
        () => [
            { value: '', label: t('rental.confirm_payment.select_bank') },
            ...companyBankAccounts.map((account) => ({
                value: String(account.id),
                label: account.name,
            })),
        ],
        [companyBankAccounts, t],
    );

    const handleAllocateChange = (invoiceId: number, value: string) => {
        setAllocations((prev) => ({
            ...prev,
            [invoiceId]: value,
        }));
    };

    const handleFull = (invoiceId: number, balance: number) => {
        setAllocations((prev) => ({
            ...prev,
            [invoiceId]: String(balance),
        }));
    };

    const handleMatchAmount = () => {
        const newAllocations: Record<number, string> = {};
        openInvoices.forEach((inv) => {
            newAllocations[inv.id] = String(inv.balance);
        });
        setAllocations(newAllocations);
        setAmount(String(totalAllocated));
    };

    const handleSubmit = () => {
        const allocationEntries = openInvoices
            .map((inv) => ({
                invoice_id: inv.id,
                amount: Math.max(0, Number(allocations[inv.id]) || 0),
            }))
            .filter((row) => row.amount > 0.009);

        if (allocationEntries.length === 0) {
            return;
        }

        onSubmit({
            payment_date: paymentDate,
            amount: Math.max(0.01, Number(amount) || totalAllocated || 0.01),
            type,
            method,
            company_bank_account_id: needsBank && bankAccountId !== '' ? Number(bankAccountId) : null,
            reference_number: referenceNumber || null,
            notes: notes || null,
            allocations: allocationEntries,
        });
    };

    const handleClose = () => {
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setMethod('transfer');
        setType('settlement');
        setBankAccountId('');
        setAmount('');
        setReferenceNumber('');
        setNotes('');
        setAllocations({});
        onClose();
    };

    return (
        <Modal show={show} maxWidth="2xl" onClose={handleClose}>
            <div className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {t('rental.actions.pay_invoices')} - {rentalCode}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {t('rental.post_confirm.payment_modal.subtitle', {
                                code: rentalCode,
                            })}
                        </p>
                    </div>
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing}>
                        {t('rental.nav.back')}
                    </SecondaryButton>
                </div>

                <div className="mt-4 space-y-4">
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('rental.invoices.code')}
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('rental.invoices.due_date')}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('rental.invoices.balance')}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        {t('rental.invoices.allocate')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {openInvoices.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {t('rental.invoices.no_open_invoices')}
                                        </td>
                                    </tr>
                                ) : (
                                    openInvoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                                                {inv.code}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                                {inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900 dark:text-white">
                                                {formatMoney(inv.balance)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={allocations[inv.id] ?? ''}
                                                        onChange={(e) => handleAllocateChange(inv.id, e.target.value)}
                                                        className="w-28 rounded-md border border-gray-300 px-2 py-1 text-right text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFull(inv.id, inv.balance)}
                                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    >
                                                        {t('rental.invoices.full')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {openInvoices.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {t('rental.invoices.total_allocated', { amount: formatMoney(totalAllocated) })}
                            </span>
                            <button
                                type="button"
                                onClick={handleMatchAmount}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                {t('rental.invoices.match_amount')}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="payment_date" value={t('rental.fields.payment_date')} />
                            <input
                                id="payment_date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            <InputError message={errors.payment_date} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="method" value={t('rental.confirm_payment.method')} />
                            <Select
                                id="method"
                                value={method}
                                onChange={(val) => setMethod(val as DepositPaymentMethod)}
                                options={[
                                    { value: 'cash', label: t('receivables.methods.cash', undefined, 'cash') },
                                    { value: 'transfer', label: t('receivables.methods.transfer', undefined, 'transfer') },
                                    { value: 'giro', label: t('receivables.methods.giro', undefined, 'giro') },
                                    { value: 'card', label: t('receivables.methods.card', undefined, 'card') },
                                    { value: 'other', label: t('receivables.methods.other', undefined, 'other') },
                                ]}
                            />
                            <InputError message={errors.method} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value={t('rental.invoices.payment_type')} />
                            <Select
                                id="type"
                                value={type}
                                onChange={(val) => setType(val)}
                                options={[
                                    { value: 'settlement', label: t('receivables.types.settlement', undefined, 'Settlement') },
                                    { value: 'installment', label: t('receivables.types.installment', undefined, 'Installment') },
                                    { value: 'down_payment', label: t('receivables.types.down_payment', undefined, 'Down Payment') },
                                    { value: 'other', label: t('receivables.types.other', undefined, 'Other') },
                                ]}
                            />
                            <InputError message={errors.type} className="mt-1" />
                        </div>

                        {needsBank && companyBankAccounts.length > 0 && (
                            <div>
                                <InputLabel htmlFor="bank_account" value={t('rental.confirm_payment.select_bank')} />
                                <Select
                                    id="bank_account"
                                    value={bankAccountId}
                                    onChange={(val) => setBankAccountId(val)}
                                    options={bankOptions}
                                />
                                <InputError message={errors.company_bank_account_id} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="amount" value={t('rental.fields.amount')} />
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            <InputError message={errors.amount} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reference_number" value={t('rental.invoices.reference_number')} />
                            <input
                                id="reference_number"
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                            <InputError message={errors.reference_number} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="notes" value={t('rental.invoices.notes')} />
                        <textarea
                            id="notes"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>

                    <InputError message={errors.allocations} className="mt-1" />
                    <InputError message={errors.amount} className="mt-1" />
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing}>
                        {t('rental.nav.back')}
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={handleSubmit} disabled={processing || totalAllocated <= 0.009}>
                        {processing ? t('rental.actions.confirming') : t('rental.actions.pay_invoices')}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}

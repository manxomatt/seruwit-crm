import { useState, useMemo } from 'react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { formatDateDmY } from '@/utils/date';

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
            { value: '', label: t('rental.confirm_payment.select_bank', undefined, '-- Pilih Rekening Bank Tujuan --') },
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
        setAllocations((prev) => {
            const next = { ...prev, [invoiceId]: String(balance) };
            const nextTotal = openInvoices.reduce(
                (sum, inv) => sum + (Number(next[inv.id]) || 0),
                0,
            );
            setAmount(String(nextTotal));
            return next;
        });
    };

    const handleMatchAmount = () => {
        const newAllocations: Record<number, string> = {};
        let total = 0;
        openInvoices.forEach((inv) => {
            newAllocations[inv.id] = String(inv.balance);
            total += inv.balance;
        });
        setAllocations(newAllocations);
        setAmount(String(total));
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
            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-xl shadow-2xs">
                            💳
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {t('rental.actions.pay_invoices', undefined, 'Pelunasan Tagihan Invoice')}
                                </h3>
                                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                    {rentalCode}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {t('rental.post_confirm.payment_modal.subtitle', { code: rentalCode }, 'Catat penerimaan pembayaran dan alokasikan ke invoice terkait.')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
                        title="Tutup"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Invoices Selection Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            📑 1. Pilih Tagihan & Alokasi Pembayaran
                        </h4>
                        {openInvoices.length > 0 && (
                            <button
                                type="button"
                                onClick={handleMatchAmount}
                                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-2xs hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 transition"
                            >
                                ⚡ {t('rental.invoices.match_amount', undefined, 'Alokasikan Semua (Lunas)')}
                            </button>
                        )}
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-700 dark:bg-slate-900">
                        <table className="min-w-full text-xs">
                            <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80">
                                <tr>
                                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('rental.invoices.code', undefined, 'No. Invoice')}
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('rental.invoices.due_date', undefined, 'Jatuh Tempo')}
                                    </th>
                                    <th className="px-3.5 py-2.5 text-right font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('rental.invoices.balance', undefined, 'Sisa Tagihan')}
                                    </th>
                                    <th className="px-3.5 py-2.5 text-right font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {t('rental.invoices.allocate', undefined, 'Nominal Dibayar (Rp)')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {openInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">
                                            {t('rental.invoices.no_open_invoices', undefined, 'Tidak ada invoice yang membutuhkan pembayaran.')}
                                        </td>
                                    </tr>
                                ) : (
                                    openInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                                            <td className="whitespace-nowrap px-3.5 py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                                                {inv.code}
                                            </td>
                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-500 dark:text-slate-400">
                                                {inv.due_date ? formatDateDmY(inv.due_date) : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                                {formatMoney(inv.balance)}
                                            </td>
                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={allocations[inv.id] ?? ''}
                                                            onChange={(e) => handleAllocateChange(inv.id, e.target.value)}
                                                            className="w-32 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-right font-mono text-xs font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFull(inv.id, inv.balance)}
                                                        className="rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                    >
                                                        Lunas
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
                        <div className="flex items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/40">
                            <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                                Total Alokasi Tagihan:
                            </span>
                            <span className="font-mono text-sm font-black text-indigo-700 dark:text-indigo-300">
                                {formatMoney(totalAllocated)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Payment Detail Form */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        💳 2. Informasi Transaksi Pembayaran
                    </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="payment_date" value={`${t('rental.fields.payment_date', undefined, 'Tanggal Pembayaran')} *`} />
                            <TextInput
                                id="payment_date"
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="mt-1 w-full !rounded-xl"
                                required
                            />
                            <InputError message={errors.payment_date} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="method" value={`${t('rental.confirm_payment.method', undefined, 'Metode Pembayaran')} *`} />
                            <Select
                                id="method"
                                value={method}
                                onChange={(val) => setMethod(val as DepositPaymentMethod)}
                                className="mt-1 w-full !rounded-xl"
                                options={[
                                    { value: 'transfer', label: '🏦 ' + t('receivables.methods.transfer', undefined, 'Transfer Bank') },
                                    { value: 'cash', label: '💵 ' + t('receivables.methods.cash', undefined, 'Tunai (Cash)') },
                                    { value: 'card', label: '💳 ' + t('receivables.methods.card', undefined, 'Kartu Debit / Kredit') },
                                    { value: 'giro', label: '📜 ' + t('receivables.methods.giro', undefined, 'Giro / Cek') },
                                    { value: 'other', label: '⚡ ' + t('receivables.methods.other', undefined, 'Lainnya') },
                                ]}
                            />
                            <InputError message={errors.method} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value={t('rental.invoices.payment_type', undefined, 'Jenis Pembayaran')} />
                            <Select
                                id="type"
                                value={type}
                                onChange={(val) => setType(val)}
                                className="mt-1 w-full !rounded-xl"
                                options={[
                                    { value: 'settlement', label: t('receivables.types.settlement', undefined, 'Pelunasan (Settlement)') },
                                    { value: 'installment', label: t('receivables.types.installment', undefined, 'Cicilan (Installment)') },
                                    { value: 'down_payment', label: t('receivables.types.down_payment', undefined, 'Uang Muka (Down Payment)') },
                                    { value: 'other', label: t('receivables.types.other', undefined, 'Lainnya') },
                                ]}
                            />
                            <InputError message={errors.type} className="mt-1" />
                        </div>

                        {needsBank && companyBankAccounts.length > 0 && (
                            <div>
                                <InputLabel htmlFor="bank_account" value={`${t('rental.confirm_payment.select_bank', undefined, 'Rekening Tujuan')} *`} />
                                <Select
                                    id="bank_account"
                                    value={bankAccountId}
                                    onChange={(val) => setBankAccountId(val)}
                                    options={bankOptions}
                                    className="mt-1 w-full !rounded-xl"
                                />
                                <InputError message={errors.company_bank_account_id} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="amount" value={`${t('rental.fields.amount', undefined, 'Total Nominal Diterima')} (Rp) *`} />
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-bold text-slate-400">
                                    Rp
                                </span>
                                <input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={totalAllocated > 0 ? String(totalAllocated) : '0'}
                                    className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <InputError message={errors.amount} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="reference_number" value={t('rental.invoices.reference_number', undefined, 'No. Referensi / Bukti Transfer')} />
                            <TextInput
                                id="reference_number"
                                type="text"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                placeholder="Contoh: TRF-20260819-001"
                                className="mt-1 w-full !rounded-xl"
                            />
                            <InputError message={errors.reference_number} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="notes" value={t('rental.invoices.notes', undefined, 'Catatan Pembayaran')} />
                        <textarea
                            id="notes"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Catatan tambahan pembayaran (opsional)..."
                            className="mt-1 block w-full rounded-xl border-slate-200 bg-white text-sm shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <InputError message={errors.notes} className="mt-1" />
                    </div>

                    <InputError message={errors.allocations} className="mt-1" />
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing} className="rounded-xl px-4 py-2">
                        {t('rental.nav.back', undefined, 'Kembali')}
                    </SecondaryButton>
                    <PrimaryButton
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing || totalAllocated <= 0.009}
                        className="rounded-xl px-5 py-2"
                    >
                        {processing ? 'Menyimpan Pembayaran...' : t('rental.actions.pay_invoices', undefined, 'Konfirmasi & Catat Pembayaran')}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
}

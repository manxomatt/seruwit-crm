import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
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
}

const typeLabel: Record<string, string> = {
    down_payment: 'DP (Down Payment)',
    installment: 'Cicilan',
    settlement: 'Pelunasan',
    other: 'Lainnya',
};

export default function Create({
    partners,
    selectedPartnerId,
    selectedInvoiceId,
    openInvoices,
    types,
    methods,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const { data, setData, processing, errors, setError, clearErrors } = useForm({
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        type: 'installment',
        method: 'transfer',
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
            setError('allocations', 'Allocate the payment to at least one invoice.');
            return;
        }

        router.post(prefixedRoute('receivables.payments.store'), {
            partner_id: Number(data.partner_id),
            payment_date: data.payment_date,
            amount: Number(data.amount || allocatedTotal),
            type: data.type,
            method: data.method,
            reference_number: data.reference_number || null,
            notes: data.notes || null,
            allocations,
        });
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Rekam Pembayaran</h2>}
        >
            <Head title="Rekam Pembayaran" />
            <div className="py-6">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    <form onSubmit={submit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Partner (Customer) *" />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.partner_id}
                                    onChange={(e) => changePartner(e.target.value)}
                                >
                                    <option value="">— pilih —</option>
                                    {partners.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} — {p.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.partner_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_date" value="Tanggal Bayar *" />
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
                                <InputLabel value="Jenis *" />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                >
                                    {types.map((t) => (
                                        <option key={t} value={t}>
                                            {typeLabel[t] ?? t}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Metode *" />
                                <select
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.method}
                                    onChange={(e) => setData('method', e.target.value)}
                                >
                                    {methods.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.method} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="amount" value="Jumlah Bayar *" />
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
                                    Alokasi: {formatMoney(allocatedTotal)}
                                    {allocatedTotal > 0 && (
                                        <button
                                            type="button"
                                            className="ml-2 text-indigo-600 hover:underline"
                                            onClick={() => setData('amount', allocatedTotal.toFixed(2))}
                                        >
                                            samakan
                                        </button>
                                    )}
                                </p>
                                <InputError message={errors.amount} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="reference_number" value="No. Referensi" />
                                <TextInput
                                    id="reference_number"
                                    className="mt-1 block w-full"
                                    value={data.reference_number}
                                    onChange={(e) => setData('reference_number', e.target.value)}
                                    placeholder="No. transfer / giro"
                                />
                                <InputError message={errors.reference_number} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan" />
                            <textarea
                                id="notes"
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Alokasi ke Invoice</h3>
                            <InputError message={errors.allocations} className="mt-1" />
                            {!data.partner_id ? (
                                <p className="mt-2 text-sm text-gray-500">Pilih partner untuk melihat invoice terbuka.</p>
                            ) : openInvoices.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">Tidak ada invoice terbuka untuk partner ini.</p>
                            ) : (
                                <div className="mt-3 overflow-hidden rounded-md border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Due</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Alokasi</th>
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
                                                                ? new Date(invoice.due_date).toLocaleDateString('id-ID')
                                                                : '—'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums">
                                                            {formatMoney(invoice.balance)}
                                                            <button
                                                                type="button"
                                                                className="ml-2 text-xs text-indigo-600 hover:underline"
                                                                onClick={() => setAllocation(invoice.id, String(invoice.balance))}
                                                            >
                                                                full
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
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>Simpan Pembayaran</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

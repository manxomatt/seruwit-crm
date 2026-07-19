import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import InvoicingNav from '../../../../InvoicingNav';
import { formatMoney } from '@/utils/money';

interface InvoiceLine {
    id: number;
    description: string;
    amount: string;
    source_type: string | null;
    source_id: number | null;
}

interface Invoice {
    id: number;
    code: string;
    status: string;
    issue_date: string;
    due_date: string | null;
    tax_enabled: boolean;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    paid_at: string | null;
    notes: string | null;
    customer: { id: number; code: string; name: string };
    lines: InvoiceLine[];
}

interface Props {
    invoice: Invoice;
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'issued':
            return 'bg-blue-100 text-blue-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

export default function Show({ invoice, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showLineModal, setShowLineModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);

    const lineForm = useForm({ description: '', amount: '' });

    const isDraft = invoice.status === 'draft';
    const isIssued = invoice.status === 'issued';
    const printable = isIssued || invoice.status === 'paid';
    const canEditLines = isDraft && can.update;

    const issue = () => {
        router.post(prefixedRoute('invoicing.invoices.issue', invoice.id), {}, { preserveScroll: true });
    };

    const pay = () => {
        router.post(prefixedRoute('invoicing.invoices.pay', invoice.id), {}, { preserveScroll: true });
    };

    const confirmVoid = () => {
        router.post(prefixedRoute('invoicing.invoices.void', invoice.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowVoidModal(false),
        });
    };

    const toggleTax = () => {
        router.patch(prefixedRoute('invoicing.invoices.update', invoice.id), { tax_enabled: !invoice.tax_enabled }, { preserveScroll: true });
    };

    const removeLine = (lineId: number) => {
        router.delete(prefixedRoute('invoicing.invoices.lines.destroy', [invoice.id, lineId]), { preserveScroll: true });
    };

    const submitLine: FormEventHandler = (e) => {
        e.preventDefault();
        lineForm.post(prefixedRoute('invoicing.invoices.lines.store', invoice.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowLineModal(false);
                lineForm.reset();
            },
        });
    };

    const deleteInvoice = () => {
        router.delete(prefixedRoute('invoicing.invoices.destroy', invoice.id));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{invoice.code}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                            {invoice.status}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {can.update && isDraft && <PrimaryButton onClick={issue}>Issue</PrimaryButton>}
                        {can.update && isIssued && <PrimaryButton onClick={pay}>Mark Paid</PrimaryButton>}
                        {printable && (
                            <a href={prefixedRoute('invoicing.invoices.pdf', invoice.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">Print PDF</SecondaryButton>
                            </a>
                        )}
                        {can.update && (isDraft || isIssued) && (
                            <DangerButton onClick={() => setShowVoidModal(true)}>Void</DangerButton>
                        )}
                        <Link href={prefixedRoute('invoicing.invoices.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={invoice.code} />

            <InvoicingNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.customer.name} ({invoice.customer.code})</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.issue_date}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">{invoice.due_date || '—'}</dd>
                            </div>
                            {invoice.paid_at && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Paid At</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{invoice.paid_at}</dd>
                                </div>
                            )}
                            {invoice.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{invoice.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Item</h3>
                            {canEditLines && (
                                <PrimaryButton onClick={() => setShowLineModal(true)}>Tambah Item</PrimaryButton>
                            )}
                        </div>
                        {invoice.lines.length === 0 ? (
                            <p className="text-sm text-gray-500">Belum ada item pada invoice ini.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">No</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Keterangan</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Jumlah</th>
                                            {canEditLines && <th className="px-4 py-3" />}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoice.lines.map((line, index) => (
                                            <tr key={line.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{line.description}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{formatMoney(line.amount)}</td>
                                                {canEditLines && (
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                        <button onClick={() => removeLine(line.id)} className="text-red-600 hover:text-red-900">Remove</button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <dl className="w-full max-w-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-500">Subtotal</dt>
                                    <dd className="text-sm text-gray-900">{formatMoney(invoice.subtotal)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-sm text-gray-500">
                                        {can.update && isDraft && (
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                checked={invoice.tax_enabled}
                                                onChange={toggleTax}
                                            />
                                        )}
                                        PPN ({Number(invoice.tax_rate)}%)
                                    </dt>
                                    <dd className="text-sm text-gray-900">{invoice.tax_enabled ? formatMoney(invoice.tax_amount) : '—'}</dd>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                                    <dt className="text-sm font-semibold text-gray-900">Total</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{formatMoney(invoice.total)}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

                {can.delete && isDraft && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this draft</h3>
                                <p className="text-sm text-gray-500">Draft invoice beserta itemnya akan dihapus.</p>
                            </div>
                            <button onClick={deleteInvoice} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Invoice
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {canEditLines && (
                <Modal show={showLineModal} onClose={() => setShowLineModal(false)} maxWidth="md">
                    <form onSubmit={submitLine} className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">Tambah Item</h3>
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="line_description" value="Keterangan" />
                                <TextInput
                                    id="line_description"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={lineForm.data.description}
                                    onChange={(e) => lineForm.setData('description', e.target.value)}
                                />
                                <InputError message={lineForm.errors.description} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="line_amount" value="Jumlah" />
                                <TextInput
                                    id="line_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={lineForm.data.amount}
                                    onChange={(e) => lineForm.setData('amount', e.target.value)}
                                />
                                <InputError message={lineForm.errors.amount} className="mt-2" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setShowLineModal(false)}>Cancel</SecondaryButton>
                            <PrimaryButton disabled={lineForm.processing}>Add</PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal show={showVoidModal} onClose={() => setShowVoidModal(false)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Void Invoice</h3>
                    <p className="text-sm text-gray-500">
                        Void {invoice.code}? Its orders become invoiceable again and the code will not be reused.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowVoidModal(false)}>Cancel</SecondaryButton>
                        <DangerButton onClick={confirmVoid}>Void</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

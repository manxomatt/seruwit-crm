import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
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
import { formatMoney } from '../../../../money';

interface Charge {
    id: number;
    amount: string;
    delivery_order: {
        id: number;
        code: string;
        pickup_address: string;
        delivery_address: string;
        delivered_at: string | null;
    } | null;
}

interface AttachableOrder {
    id: number;
    code: string;
    pickup_address: string;
    delivery_address: string;
    charge: { id: number; amount: string } | null;
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
    charges: Charge[];
}

interface Props {
    invoice: Invoice;
    attachableOrders: AttachableOrder[];
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

export default function Show({ invoice, attachableOrders, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);

    const attachForm = useForm({ order_id: '' });

    const isDraft = invoice.status === 'draft';
    const isIssued = invoice.status === 'issued';
    const printable = isIssued || invoice.status === 'paid';

    const issue = () => {
        router.post(prefixedRoute('billing.invoices.issue', invoice.id), {}, { preserveScroll: true });
    };

    const pay = () => {
        router.post(prefixedRoute('billing.invoices.pay', invoice.id), {}, { preserveScroll: true });
    };

    const confirmVoid = () => {
        router.post(prefixedRoute('billing.invoices.void', invoice.id), {}, {
            preserveScroll: true,
            onSuccess: () => setShowVoidModal(false),
        });
    };

    const toggleTax = () => {
        router.patch(prefixedRoute('billing.invoices.update', invoice.id), { tax_enabled: !invoice.tax_enabled }, { preserveScroll: true });
    };

    const detachCharge = (chargeId: number) => {
        router.delete(prefixedRoute('billing.invoices.charges.destroy', [invoice.id, chargeId]), { preserveScroll: true });
    };

    const submitAttach: FormEventHandler = (e) => {
        e.preventDefault();
        attachForm.transform((data) => ({ order_id: Number(data.order_id) }));
        attachForm.post(prefixedRoute('billing.invoices.charges.store', invoice.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAttachModal(false);
                attachForm.reset();
            },
        });
    };

    const deleteInvoice = () => {
        router.delete(prefixedRoute('billing.invoices.destroy', invoice.id));
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
                            <a href={prefixedRoute('billing.invoices.pdf', invoice.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">Print PDF</SecondaryButton>
                            </a>
                        )}
                        {can.update && (isDraft || isIssued) && (
                            <DangerButton onClick={() => setShowVoidModal(true)}>Void</DangerButton>
                        )}
                        <Link href={prefixedRoute('billing.invoices.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={invoice.code} />

            <BillingNav />

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
                            <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                            {can.update && isDraft && (
                                <PrimaryButton onClick={() => setShowAttachModal(true)}>Add Order</PrimaryButton>
                            )}
                        </div>
                        {invoice.charges.length === 0 ? (
                            <p className="text-sm text-gray-500">No orders on this invoice yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Route</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivered</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                                            {can.update && isDraft && <th className="px-4 py-3" />}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoice.charges.map((charge) => (
                                            <tr key={charge.id}>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                                    {charge.delivery_order ? (
                                                        <Link href={prefixedRoute('orders.show', charge.delivery_order.id)} className="text-indigo-600 hover:text-indigo-900">
                                                            {charge.delivery_order.code}
                                                        </Link>
                                                    ) : '—'}
                                                </td>
                                                <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-500">
                                                    {charge.delivery_order ? `${charge.delivery_order.pickup_address} → ${charge.delivery_order.delivery_address}` : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{charge.delivery_order?.delivered_at || '—'}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900">{formatMoney(charge.amount)}</td>
                                                {can.update && isDraft && (
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                        <button onClick={() => detachCharge(charge.id)} className="text-red-600 hover:text-red-900">Remove</button>
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
                                <p className="text-sm text-gray-500">Its orders become invoiceable again.</p>
                            </div>
                            <button onClick={deleteInvoice} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Invoice
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showAttachModal} onClose={() => setShowAttachModal(false)} maxWidth="md">
                <form onSubmit={submitAttach} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Add Order</h3>
                    {attachableOrders.length === 0 ? (
                        <p className="text-sm text-gray-500">Tidak ada order delivered yang belum tertagih untuk pelanggan ini.</p>
                    ) : (
                        <div>
                            <InputLabel htmlFor="a_order_id" value="Order" />
                            <Select
                                id="a_order_id"
                                className="mt-1"
                                value={attachForm.data.order_id}
                                onChange={(value) => attachForm.setData('order_id', value)}
                                placeholder="Select an order"
                                options={attachableOrders.map((order) => ({
                                    value: String(order.id),
                                    label: `${order.code} — ${order.pickup_address} → ${order.delivery_address}${order.charge ? ` (${formatMoney(order.charge.amount)})` : ''}`,
                                }))}
                            />
                            <InputError message={attachForm.errors.order_id} className="mt-2" />
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowAttachModal(false)}>Cancel</SecondaryButton>
                        {attachableOrders.length > 0 && <PrimaryButton disabled={attachForm.processing}>Add</PrimaryButton>}
                    </div>
                </form>
            </Modal>

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

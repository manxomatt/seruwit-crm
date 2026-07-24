import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import PurchasingNav from '../../../../PurchasingNav';
import { formatMoney } from '@/utils/money';

interface PoItem {
    id: number;
    quantity_ordered: string;
    quantity_received: string;
    unit_price: string;
    unit: string | null;
    product: { id: number; name: string; code: string | null };
}

interface GrnSummary {
    id: number;
    grn_number: string;
    status: string;
    received_at: string;
    items?: Array<{ quantity_received: string }>;
}

interface Order {
    id: number;
    po_number: string;
    status: string;
    ordered_at: string;
    expected_at: string | null;
    notes: string | null;
    total_amount: string;
    partner: { id: number; name: string; code: string };
    warehouse: { id: number; name: string };
    created_by: { id: number; name: string } | null;
    items: PoItem[];
    good_receipt_notes: GrnSummary[];
}

interface Props {
    order: Order;
    progress: { ordered: number; received: number; percent: number };
    can: { create: boolean; update: boolean; receive: boolean };
}

const statusBadge = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300';
        case 'submitted':
            return 'bg-blue-50 text-blue-700';
        case 'approved':
            return 'bg-sky-100 text-sky-800';
        case 'partial_received':
            return 'bg-amber-50 text-amber-700';
        case 'fully_received':
            return 'bg-emerald-50 text-emerald-700';
        case 'closed':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200';
        case 'cancelled':
            return 'bg-red-50 text-red-700';
        case 'confirmed':
            return 'bg-emerald-50 text-emerald-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
        partial_received: 'Partial',
        fully_received: 'Fully Received',
    };
    return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
};

export default function Show({ order, progress, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const postAction = (action: string) => {
        router.post(prefixedRoute(`purchasing.purchase-orders.${action}`, order.id), {}, { preserveScroll: true });
    };

    const remaining = (item: PoItem) => Math.max(0, Number(item.quantity_ordered) - Number(item.quantity_received));
    const canReceive = ['approved', 'partial_received'].includes(order.status);

    const grnQty = (grn: GrnSummary) =>
        (grn.items ?? []).reduce((sum, item) => sum + Number(item.quantity_received || 0), 0);

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{order.po_number}</h2>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>
                            {statusLabel(order.status)}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.update && order.status === 'draft' && (
                            <>
                                <Link href={prefixedRoute('purchasing.purchase-orders.edit', order.id)}>
                                    <SecondaryButton>Edit</SecondaryButton>
                                </Link>
                                <PrimaryButton onClick={() => postAction('submit')}>Submit ke Supplier</PrimaryButton>
                            </>
                        )}
                        {can.update && order.status === 'submitted' && (
                            <PrimaryButton onClick={() => postAction('approve')}>Approve</PrimaryButton>
                        )}
                        {can.create && canReceive && (
                            <Link href={prefixedRoute('purchasing.purchase-orders.grn.create', order.id)}>
                                <PrimaryButton>+ Buat GRN</PrimaryButton>
                            </Link>
                        )}
                        {can.update && order.status === 'fully_received' && (
                            <PrimaryButton onClick={() => postAction('close')}>Close</PrimaryButton>
                        )}
                        {can.update && ['draft', 'submitted', 'approved'].includes(order.status) && (
                            <DangerButton onClick={() => postAction('cancel')}>Cancel</DangerButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={order.po_number} />
            <PurchasingNav />

            <div className="mb-4">
                <Link href={prefixedRoute('purchasing.purchase-orders.index')} className="text-sm text-gray-500 hover:text-gray-700">
                    ← Kembali ke PO List
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Item Pesanan
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Produk</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Dipesan</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Diterima</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Sisa</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Harga</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{item.quantity_ordered}</td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-emerald-700">{item.quantity_received}</td>
                                            <td className={`px-4 py-3 text-right text-sm tabular-nums ${remaining(item) > 0 ? 'font-semibold text-amber-700' : 'text-gray-400'}`}>
                                                {remaining(item)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{formatMoney(item.unit_price)}</td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-900">
                                                {formatMoney(Number(item.quantity_ordered) * Number(item.unit_price))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end border-t border-gray-200 px-4 py-3">
                            <span className="text-sm font-bold tabular-nums text-gray-900">Total: {formatMoney(order.total_amount)}</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex justify-between text-xs text-gray-500">
                            <span>Penerimaan</span>
                            <span>
                                {progress.percent}% ({progress.received}/{progress.ordered} unit)
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-full rounded-full ${progress.percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Informasi PO
                        </div>
                        <div className="space-y-2 p-4 text-sm">
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">Supplier</span>
                                <span className="font-semibold text-gray-900">{order.partner.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">Gudang</span>
                                <span className="font-semibold text-gray-900">{order.warehouse.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">Tgl Order</span>
                                <span className="font-semibold text-gray-900">{new Date(order.ordered_at).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">Exp. Tiba</span>
                                <span className="font-semibold text-amber-700">
                                    {order.expected_at ? new Date(order.expected_at).toLocaleDateString('id-ID') : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">Dibuat oleh</span>
                                <span className="font-semibold text-gray-900">{order.created_by?.name ?? '—'}</span>
                            </div>
                            {order.notes && (
                                <p className="mt-2 text-xs text-gray-500">{order.notes}</p>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            Good Receipt Notes
                        </div>
                        <div className="space-y-3 p-4">
                            {order.good_receipt_notes.length === 0 ? (
                                <p className="text-sm text-gray-500">Belum ada GRN.</p>
                            ) : (
                                order.good_receipt_notes.map((grn) => (
                                    <Link
                                        key={grn.id}
                                        href={prefixedRoute('purchasing.grn.show', grn.id)}
                                        className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-indigo-600">{grn.grn_number}</div>
                                            <div className="text-xs text-gray-500">{new Date(grn.received_at).toLocaleDateString('id-ID')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm tabular-nums text-gray-700">{grnQty(grn)} unit</div>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(grn.status)}`}>
                                                {statusLabel(grn.status)}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                            {can.create && canReceive && (
                                <Link href={prefixedRoute('purchasing.purchase-orders.grn.create', order.id)}>
                                    <PrimaryButton className="mt-1 w-full justify-center">+ Buat GRN Berikutnya</PrimaryButton>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

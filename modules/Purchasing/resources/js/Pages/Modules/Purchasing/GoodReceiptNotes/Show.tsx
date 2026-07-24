import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import PurchasingNav from '../../../../PurchasingNav';

interface GrnItem {
    id: number;
    quantity_received: string;
    batch_number: string | null;
    expiry_date: string | null;
    notes: string | null;
    purchase_order_item: {
        id: number;
        product: { id: number; name: string; code: string | null; unit: string | null };
    };
    location: { id: number; name: string; code: string } | null;
}

interface Grn {
    id: number;
    grn_number: string;
    status: string;
    received_at: string;
    supplier_do_number: string | null;
    notes: string | null;
    purchase_order: {
        id: number;
        po_number: string;
        partner: { id: number; name: string; code: string };
    };
    warehouse: { id: number; name: string };
    received_by: { id: number; name: string } | null;
    items: GrnItem[];
}

interface Props {
    grn: Grn;
    can: { receive: boolean };
}

export default function Show({ grn, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const isDraft = grn.status === 'draft';

    const confirm = () => {
        router.post(prefixedRoute('purchasing.grn.confirm', grn.id), {}, { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{grn.grn_number}</h2>
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isDraft ? 'bg-gray-100 text-gray-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                        >
                            {isDraft ? 'Draft' : 'Confirmed'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('purchasing.purchase-orders.show', grn.purchase_order.id)}>
                            <SecondaryButton>Lihat PO</SecondaryButton>
                        </Link>
                        {can.receive && isDraft && <PrimaryButton onClick={confirm}>Konfirmasi Penerimaan</PrimaryButton>}
                    </div>
                </div>
            }
        >
            <Head title={grn.grn_number} />
            <PurchasingNav />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Purchase Order</p>
                    <p className="mt-1 font-semibold text-indigo-600">{grn.purchase_order.po_number}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Supplier</p>
                    <p className="mt-1 font-semibold text-gray-900">{grn.purchase_order.partner.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Gudang</p>
                    <p className="mt-1 font-semibold text-gray-900">{grn.warehouse.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">Tanggal Terima</p>
                    <p className="mt-1 font-semibold text-gray-900">{new Date(grn.received_at).toLocaleDateString('id-ID')}</p>
                </div>
            </div>

            {(grn.supplier_do_number || grn.notes) && (
                <div className="mb-6 rounded-lg bg-white p-4 text-sm shadow-sm">
                    {grn.supplier_do_number && (
                        <p>
                            <span className="text-gray-500">No. SJ Supplier:</span>{' '}
                            <span className="font-semibold">{grn.supplier_do_number}</span>
                        </p>
                    )}
                    {grn.notes && <p className="mt-1 text-gray-600">{grn.notes}</p>}
                    {grn.received_by && (
                        <p className="mt-1 text-xs text-gray-500">Diterima oleh {grn.received_by.name}</p>
                    )}
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Produk</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Lokasi</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Batch</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Expiry</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {grn.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {item.purchase_order_item.product.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {item.location ? `${item.location.code} — ${item.location.name}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{item.batch_number || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('id-ID') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                                        {item.quantity_received}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import SalesNav from '../../../../SalesNav';
import { formatMoney } from '@/utils/money';

interface SoItem {
    id: number;
    quantity_ordered: string;
    quantity_delivered: string;
    unit_price: string;
    unit: string | null;
    product: { id: number; name: string; code: string | null };
    packaging?: { id: number; name: string; qty: string } | null;
}

interface GinSummary {
    id: number;
    gin_number: string;
    status: string;
    issued_at: string;
    items?: Array<{ quantity_issued: string }>;
}

interface Order {
    id: number;
    so_number: string;
    status: string;
    ordered_at: string;
    promised_at: string | null;
    notes: string | null;
    total_amount: string;
    partner: { id: number; name: string; code: string };
    warehouse: { id: number; name: string };
    created_by: { id: number; name: string } | null;
    items: SoItem[];
    goods_issue_notes: GinSummary[];
}

interface Props {
    order: Order;
    progress: { ordered: number; delivered: number; percent: number };
    can: { create: boolean; update: boolean; issue: boolean; invoice: boolean };
}

const statusBadge = (status: string): string => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-300';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'partial_delivered':
            return 'bg-amber-50 text-amber-700';
        case 'fully_delivered':
            return 'bg-emerald-50 text-emerald-700';
        case 'closed':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200';
        case 'cancelled':
            return 'bg-red-50 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export default function Show({ order, progress, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const postAction = (action: string) => {
        router.post(prefixedRoute(`sales.sales-orders.${action}`, order.id), {}, { preserveScroll: true });
    };

    const remaining = (item: SoItem) => Math.max(0, Number(item.quantity_ordered) - Number(item.quantity_delivered));
    const canIssue = ['confirmed', 'partial_delivered'].includes(order.status);
    const canInvoice = can.invoice && ['confirmed', 'partial_delivered', 'fully_delivered'].includes(order.status);

    const ginQty = (gin: GinSummary) =>
        (gin.items ?? []).reduce((sum, item) => sum + Number(item.quantity_issued || 0), 0);

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{order.so_number}</h2>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>
                            {t(`sales.status.${order.status}`, undefined, order.status)}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {can.update && order.status === 'draft' && (
                            <>
                                <Link href={prefixedRoute('sales.sales-orders.edit', order.id)}>
                                    <SecondaryButton>{t('common.edit')}</SecondaryButton>
                                </Link>
                                <PrimaryButton onClick={() => postAction('confirm')}>{t('sales.sales_orders.show.confirm')}</PrimaryButton>
                            </>
                        )}
                        {can.issue && canIssue && (
                            <Link href={prefixedRoute('sales.sales-orders.gin.create', order.id)}>
                                <PrimaryButton>{t('sales.sales_orders.show.create_gin')}</PrimaryButton>
                            </Link>
                        )}
                        {canInvoice && (
                            <PrimaryButton onClick={() => postAction('invoice')}>{t('sales.sales_orders.show.create_invoice')}</PrimaryButton>
                        )}
                        {can.update && order.status === 'fully_delivered' && (
                            <PrimaryButton onClick={() => postAction('close')}>{t('sales.sales_orders.show.close')}</PrimaryButton>
                        )}
                        {can.update && ['draft', 'confirmed'].includes(order.status) && (
                            <DangerButton onClick={() => postAction('cancel')}>{t('common.cancel')}</DangerButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={order.so_number} />
            <SalesNav />

            <div className="mb-4">
                <Link href={prefixedRoute('sales.sales-orders.index')} className="text-sm text-gray-500 hover:text-gray-700">
                    {t('sales.sales_orders.show.back')}
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            {t('sales.sales_orders.show.items_section')}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('sales.fields.product')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.ordered')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.delivered')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.remaining')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.price')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.subtotal')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {item.product.name}
                                                {item.packaging && (
                                                    <div className="text-xs font-normal text-gray-500">
                                                        {item.packaging.name} (×{item.packaging.qty})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700">{item.quantity_ordered}</td>
                                            <td className="px-4 py-3 text-right text-sm tabular-nums text-emerald-700">{item.quantity_delivered}</td>
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
                            <span className="text-sm font-bold tabular-nums text-gray-900">
                                {t('sales.sales_orders.show.total', { amount: formatMoney(order.total_amount) })}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex justify-between text-xs text-gray-500">
                            <span>{t('sales.sales_orders.show.delivery')}</span>
                            <span>
                                {t('sales.sales_orders.show.delivery_progress', {
                                    percent: progress.percent,
                                    delivered: progress.delivered,
                                    ordered: progress.ordered,
                                })}
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
                            {t('sales.sales_orders.show.info_section')}
                        </div>
                        <div className="space-y-2 p-4 text-sm">
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">{t('sales.fields.customer')}</span>
                                <span className="font-semibold text-gray-900">{order.partner.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">{t('sales.fields.warehouse')}</span>
                                <span className="font-semibold text-gray-900">{order.warehouse.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">{t('sales.fields.ordered_at')}</span>
                                <span className="font-semibold text-gray-900">{new Date(order.ordered_at).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 py-1">
                                <span className="text-gray-500">{t('sales.fields.promised_at')}</span>
                                <span className="font-semibold text-amber-700">
                                    {order.promised_at ? new Date(order.promised_at).toLocaleDateString('id-ID') : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-500">{t('sales.fields.created_by')}</span>
                                <span className="font-semibold text-gray-900">{order.created_by?.name ?? '—'}</span>
                            </div>
                            {order.notes && (
                                <p className="mt-2 text-xs text-gray-500">{order.notes}</p>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                            {t('sales.sales_orders.show.gin_section')}
                        </div>
                        <div className="space-y-3 p-4">
                            {order.goods_issue_notes.length === 0 ? (
                                <p className="text-sm text-gray-500">{t('sales.sales_orders.show.gin_empty')}</p>
                            ) : (
                                order.goods_issue_notes.map((gin) => (
                                    <Link
                                        key={gin.id}
                                        href={prefixedRoute('sales.gin.show', gin.id)}
                                        className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-indigo-600">{gin.gin_number}</div>
                                            <div className="text-xs text-gray-500">{new Date(gin.issued_at).toLocaleDateString('id-ID')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm tabular-nums text-gray-700">
                                                {t('sales.sales_orders.show.gin_units', { qty: ginQty(gin) })}
                                            </div>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(gin.status)}`}>
                                                {t(`sales.status.${gin.status}`, undefined, gin.status)}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                            {can.issue && canIssue && (
                                <Link href={prefixedRoute('sales.sales-orders.gin.create', order.id)}>
                                    <PrimaryButton className="mt-1 w-full justify-center">{t('sales.sales_orders.show.create_next_gin')}</PrimaryButton>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

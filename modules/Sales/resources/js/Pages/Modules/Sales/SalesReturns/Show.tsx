import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import SalesNav from '../../../../SalesNav';

interface Props {
    salesReturn: {
        id: number;
        return_number: string;
        status: string;
        returned_at: string;
        notes: string | null;
        sales_order: { id: number; so_number: string; partner: { name: string } };
        goods_issue_note?: { id: number; gin_number: string } | null;
        warehouse: { name: string };
        items: Array<{
            id: number;
            quantity_returned: string;
            sales_order_item: { product: { name: string } | null };
            location: { name: string; code: string } | null;
        }>;
    };
    can: { issue: boolean; void: boolean };
}

export default function Show({ salesReturn, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const isDraft = salesReturn.status === 'draft';
    const isConfirmed = salesReturn.status === 'confirmed';

    const voidReturn = () => {
        if (!window.confirm(t('sales.returns.show.void_confirm'))) {
            return;
        }
        router.post(prefixedRoute('sales.returns.void', salesReturn.id), {}, { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{salesReturn.return_number}</h2>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('sales.sales-orders.show', salesReturn.sales_order.id)}>
                            <SecondaryButton>{t('sales.returns.show.view_so')}</SecondaryButton>
                        </Link>
                        {can.issue && isDraft && (
                            <PrimaryButton
                                onClick={() =>
                                    router.post(prefixedRoute('sales.returns.confirm', salesReturn.id), {}, { preserveScroll: true })
                                }
                            >
                                {t('sales.returns.show.confirm')}
                            </PrimaryButton>
                        )}
                        {can.void && isConfirmed && (
                            <SecondaryButton type="button" onClick={voidReturn}>
                                {t('sales.returns.show.void')}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={salesReturn.return_number} />
            <SalesNav />
            <div className="mb-4 text-sm text-gray-600">
                {t(`sales.status.${salesReturn.status}`, undefined, salesReturn.status)} · {salesReturn.warehouse.name}
                {salesReturn.goods_issue_note && <> · {salesReturn.goods_issue_note.gin_number}</>}
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('sales.fields.product')}</th>
                            <th className="px-4 py-3">{t('sales.fields.quantity')}</th>
                            <th className="px-4 py-3">{t('sales.fields.location')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesReturn.items.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="px-4 py-3">{item.sales_order_item?.product?.name}</td>
                                <td className="px-4 py-3">{item.quantity_returned}</td>
                                <td className="px-4 py-3">{item.location?.code ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}

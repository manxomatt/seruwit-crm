import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import PurchasingNav from '../../../../PurchasingNav';

interface Props {
    purchaseReturn: {
        id: number;
        return_number: string;
        status: string;
        returned_at: string;
        notes: string | null;
        purchase_order: { id: number; po_number: string; partner: { name: string } };
        good_receipt_note?: { id: number; grn_number: string } | null;
        warehouse: { name: string };
        items: Array<{
            id: number;
            quantity_returned: string;
            purchase_order_item: { product: { name: string } | null };
            location: { name: string; code: string } | null;
        }>;
    };
    can: { receive: boolean };
}

export default function Show({ purchaseReturn, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const isDraft = purchaseReturn.status === 'draft';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{purchaseReturn.return_number}</h2>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('purchasing.purchase-orders.show', purchaseReturn.purchase_order.id)}>
                            <SecondaryButton>{t('purchasing.returns.show.view_po')}</SecondaryButton>
                        </Link>
                        {can.receive && isDraft && (
                            <PrimaryButton
                                onClick={() =>
                                    router.post(
                                        prefixedRoute('purchasing.returns.confirm', purchaseReturn.id),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {t('purchasing.returns.show.confirm')}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={purchaseReturn.return_number} />
            <PurchasingNav />
            <div className="mb-4 text-sm text-gray-600">
                {t(`purchasing.status.${purchaseReturn.status}`, undefined, purchaseReturn.status)} · {purchaseReturn.warehouse.name}
                {purchaseReturn.good_receipt_note && <> · {purchaseReturn.good_receipt_note.grn_number}</>}
            </div>
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('purchasing.fields.product')}</th>
                            <th className="px-4 py-3">{t('purchasing.fields.quantity')}</th>
                            <th className="px-4 py-3">{t('purchasing.fields.location')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseReturn.items.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="px-4 py-3">{item.purchase_order_item?.product?.name}</td>
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

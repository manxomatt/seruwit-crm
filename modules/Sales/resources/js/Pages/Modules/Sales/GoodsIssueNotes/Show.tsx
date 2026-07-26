import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import SalesNav from '../../../../SalesNav';

interface GinItem {
    id: number;
    quantity_issued: string;
    batch_number: string | null;
    expiry_date: string | null;
    notes: string | null;
    sales_order_item: {
        id: number;
        product: { id: number; name: string; code: string | null; unit: string | null };
    };
    location: { id: number; name: string; code: string } | null;
}

interface Gin {
    id: number;
    gin_number: string;
    status: string;
    issued_at: string;
    delivery_note_number: string | null;
    notes: string | null;
    sales_order: {
        id: number;
        so_number: string;
        partner: { id: number; name: string; code: string };
    };
    warehouse: { id: number; name: string };
    issued_by: { id: number; name: string } | null;
    items: GinItem[];
}

interface Props {
    gin: Gin;
    can: { issue: boolean; void: boolean };
}

export default function Show({ gin, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const isDraft = gin.status === 'draft';
    const isConfirmed = gin.status === 'confirmed';

    const confirm = () => {
        router.post(prefixedRoute('sales.gin.confirm', gin.id), {}, { preserveScroll: true });
    };

    const voidGin = () => {
        if (!window.confirm(t('sales.gin.show.void_confirm'))) {
            return;
        }
        router.post(prefixedRoute('sales.gin.void', gin.id), {}, { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{gin.gin_number}</h2>
                        <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isDraft
                                    ? 'bg-gray-100 text-gray-700'
                                    : gin.status === 'voided'
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-emerald-50 text-emerald-700'
                            }`}
                        >
                            {t(`sales.status.${gin.status}`, undefined, gin.status)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('sales.sales-orders.show', gin.sales_order.id)}>
                            <SecondaryButton>{t('sales.gin.show.view_so')}</SecondaryButton>
                        </Link>
                        {can.issue && isDraft && (
                            <PrimaryButton onClick={confirm}>{t('sales.gin.show.confirm')}</PrimaryButton>
                        )}
                        {can.void && isConfirmed && (
                            <SecondaryButton type="button" onClick={voidGin}>
                                {t('sales.gin.show.void')}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={gin.gin_number} />
            <SalesNav />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('sales.fields.so_number')}</p>
                    <p className="mt-1 font-semibold text-indigo-600">{gin.sales_order.so_number}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('sales.fields.customer')}</p>
                    <p className="mt-1 font-semibold text-gray-900">{gin.sales_order.partner.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('sales.fields.warehouse')}</p>
                    <p className="mt-1 font-semibold text-gray-900">{gin.warehouse.name}</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500">{t('sales.fields.issued_at')}</p>
                    <p className="mt-1 font-semibold text-gray-900">{new Date(gin.issued_at).toLocaleDateString(localeTag)}</p>
                </div>
            </div>

            {(gin.delivery_note_number || gin.notes) && (
                <div className="mb-6 rounded-lg bg-white p-4 text-sm shadow-sm">
                    {gin.delivery_note_number && (
                        <p>
                            <span className="text-gray-500">{t('sales.gin.show.delivery_note')}</span>{' '}
                            <span className="font-semibold">{gin.delivery_note_number}</span>
                        </p>
                    )}
                    {gin.notes && <p className="mt-1 text-gray-600">{gin.notes}</p>}
                    {gin.issued_by && (
                        <p className="mt-1 text-xs text-gray-500">
                            {t('sales.gin.show.issued_by', { name: gin.issued_by.name })}
                        </p>
                    )}
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('sales.fields.product')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('sales.fields.location')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('sales.fields.batch')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('sales.fields.expiry')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('sales.fields.quantity')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {gin.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {item.sales_order_item.product.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {item.location ? `${item.location.code} — ${item.location.name}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{item.batch_number || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(localeTag) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                                        {item.quantity_issued}
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

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import SalesNav from '../../../../SalesNav';
import PageHeader from '@/Components/PageHeader';

interface Props {
    priceList: {
        id: number;
        name: string;
        code: string | null;
        is_active: boolean;
        notes: string | null;
        items: Array<{
            id: number;
            unit_price: string;
            product: { id: number; name: string; code: string | null } | null;
        }>;
    };
    products: Array<{ id: number; name: string; code: string | null; price: string | null }>;
    can: { update: boolean };
}

export default function Show({ priceList, products, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const meta = useForm({
        name: priceList.name,
        code: priceList.code ?? '',
        is_active: priceList.is_active,
        notes: priceList.notes ?? '',
    });

    const itemForm = useForm({
        product_id: '',
        unit_price: '',
    });

    const saveMeta: FormEventHandler = (e) => {
        e.preventDefault();
        meta.patch(prefixedRoute('sales.price-lists.update', priceList.id), { preserveScroll: true });
    };

    const saveItem: FormEventHandler = (e) => {
        e.preventDefault();
        itemForm.post(prefixedRoute('sales.price-lists.items.store', priceList.id), {
            preserveScroll: true,
            onSuccess: () => itemForm.reset('product_id', 'unit_price'),
        });
    };

    return (
        <DynamicLayout header={<PageHeader title={priceList.name} />}>
            <Head title={priceList.name} />
            <SalesNav />

            {can.update && (
                <form onSubmit={saveMeta} className="mb-6 grid gap-4 rounded-lg bg-white p-6 shadow-sm sm:grid-cols-2">
                    <div>
                        <InputLabel value={t('sales.fields.name')} />
                        <TextInput className="mt-1 block w-full" value={meta.data.name} onChange={(e) => meta.setData('name', e.target.value)} />
                        <InputError message={meta.errors.name} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel value={t('sales.fields.code')} />
                        <TextInput className="mt-1 block w-full" value={meta.data.code} onChange={(e) => meta.setData('code', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={meta.data.is_active}
                            onChange={(e) => meta.setData('is_active', e.target.checked)}
                        />
                        {t('sales.price_lists.active')}
                    </label>
                    <div className="sm:col-span-2">
                        <PrimaryButton disabled={meta.processing}>{t('sales.price_lists.save')}</PrimaryButton>
                    </div>
                </form>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b px-4 py-3 text-sm font-semibold text-gray-800">{t('sales.price_lists.items')}</div>
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('sales.fields.product')}</th>
                            <th className="px-4 py-3 text-right">{t('sales.fields.unit_price')}</th>
                            {can.update && <th className="px-4 py-3" />}
                        </tr>
                    </thead>
                    <tbody>
                        {priceList.items.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="px-4 py-3">{item.product?.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(item.unit_price))}</td>
                                {can.update && (
                                    <td className="px-4 py-3 text-right">
                                        <SecondaryButton
                                            type="button"
                                            onClick={() =>
                                                router.delete(
                                                    prefixedRoute('sales.price-lists.items.destroy', {
                                                        priceList: priceList.id,
                                                        item: item.id,
                                                    }),
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            {t('sales.actions.delete')}
                                        </SecondaryButton>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {can.update && (
                    <form onSubmit={saveItem} className="grid gap-3 border-t p-4 sm:grid-cols-3">
                        <div>
                            <Select
                                value={itemForm.data.product_id}
                                onChange={(value) => {
                                    const product = products.find((p) => String(p.id) === value);
                                    itemForm.setData({
                                        product_id: value,
                                        unit_price: product?.price ? String(product.price) : itemForm.data.unit_price,
                                    });
                                }}
                                placeholder={t('sales.placeholders.select_product')}
                                options={products.map((p) => ({
                                    value: String(p.id),
                                    label: p.code ? `${p.name} (${p.code})` : p.name,
                                }))}
                            />
                            <InputError message={itemForm.errors.product_id} className="mt-2" />
                        </div>
                        <div>
                            <TextInput
                                type="number"
                                min="0"
                                step="0.01"
                                className="block w-full"
                                value={itemForm.data.unit_price}
                                onChange={(e) => itemForm.setData('unit_price', e.target.value)}
                                placeholder={t('sales.fields.unit_price')}
                            />
                            <InputError message={itemForm.errors.unit_price} className="mt-2" />
                        </div>
                        <div>
                            <PrimaryButton disabled={itemForm.processing}>{t('sales.price_lists.add_item')}</PrimaryButton>
                        </div>
                    </form>
                )}
            </div>

            <div className="mt-4">
                <Link href={prefixedRoute('sales.price-lists.index')} className="text-sm text-gray-500 hover:text-gray-700">
                    ← {t('sales.price_lists.title')}
                </Link>
            </div>
        </DynamicLayout>
    );
}

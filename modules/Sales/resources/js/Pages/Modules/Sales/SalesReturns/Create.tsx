import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import SalesNav from '../../../../SalesNav';
import PageHeader from '@/Components/PageHeader';

interface ReturnableItem {
    gin_item_id: number;
    so_item_id: number;
    product: { id: number; name: string; code: string | null } | null;
    remaining: number;
    unit: string | null;
    location_id: number | null;
    batch_number: string | null;
    expiry_date: string | null;
}

interface Gin {
    id: number;
    gin_number: string;
    sales_order: { id: number; so_number: string; partner: { name: string } };
    warehouse: { id: number; name: string };
}

interface Props {
    gin: Gin;
    returnableItems: ReturnableItem[];
    can: { create: boolean; issue: boolean };
}

interface ReturnLine {
    gin_item_id: string;
    so_item_id: string;
    quantity_returned: string;
    location_id: string;
    batch_number: string;
    expiry_date: string;
    notes: string;
    included: boolean;
}

export default function Create({ gin, returnableItems, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const today = new Date().toISOString().slice(0, 10);

    const { data, setData, post, processing, errors, transform } = useForm({
        returned_at: today,
        notes: '',
        confirm: false as boolean,
        items: returnableItems.map((item) => ({
            gin_item_id: String(item.gin_item_id),
            so_item_id: String(item.so_item_id),
            quantity_returned: String(item.remaining),
            location_id: item.location_id ? String(item.location_id) : '',
            batch_number: item.batch_number ?? '',
            expiry_date: item.expiry_date ?? '',
            notes: '',
            included: true,
        })) as ReturnLine[],
    });

    const updateLine = (index: number, field: keyof ReturnLine, value: string | boolean) => {
        setData(
            'items',
            data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    };

    const save = (confirm: boolean) => {
        transform((form) => ({
            ...form,
            confirm,
            items: form.items
                .filter((item) => item.included && Number(item.quantity_returned) > 0)
                .map(({ included: _included, ...item }) => item),
        }));
        post(prefixedRoute('sales.gin.return.store', gin.id));
    };

    const submitDraft: FormEventHandler = (e) => {
        e.preventDefault();
        save(false);
    };

    return (
        <DynamicLayout header={<PageHeader title={t('sales.returns.create.title')} />}>
            <Head title={t('sales.returns.create.head', { gin_number: gin.gin_number })} />
            <SalesNav />
            <Link href={prefixedRoute('sales.gin.show', gin.id)} className="mb-4 inline-block text-sm text-indigo-600">
                {t('sales.returns.create.back', { gin_number: gin.gin_number })}
            </Link>
            <form onSubmit={submitDraft} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">
                    {t('sales.returns.create.gin')} <strong>{gin.gin_number}</strong> · {gin.sales_order.partner.name}
                </p>
                <div>
                    <InputLabel value={t('sales.fields.notes')} />
                    <TextInput
                        type="date"
                        className="mt-1 block w-full max-w-xs"
                        value={data.returned_at}
                        onChange={(e) => setData('returned_at', e.target.value)}
                    />
                    <InputError message={errors.returned_at} className="mt-1" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-3 py-2"></th>
                                <th className="px-3 py-2">{t('sales.fields.product')}</th>
                                <th className="px-3 py-2">{t('sales.fields.remaining')}</th>
                                <th className="px-3 py-2">{t('sales.fields.quantity')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnableItems.map((item, index) => (
                                <tr key={item.gin_item_id} className="border-b">
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={data.items[index]?.included}
                                            onChange={(e) => updateLine(index, 'included', e.target.checked)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">{item.product?.name}</td>
                                    <td className="px-3 py-2">
                                        {item.remaining} {item.unit}
                                    </td>
                                    <td className="px-3 py-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            className="w-28"
                                            value={data.items[index]?.quantity_returned ?? ''}
                                            onChange={(e) => updateLine(index, 'quantity_returned', e.target.value)}
                                        />
                                        <InputError message={errors[`items.${index}.quantity_returned`]} className="mt-1" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-2">
                    <SecondaryButton type="submit" disabled={processing}>
                        {t('sales.returns.create.save_draft')}
                    </SecondaryButton>
                    {can.issue && (
                        <PrimaryButton type="button" disabled={processing} onClick={() => save(true)}>
                            {t('sales.returns.create.confirm')}
                        </PrimaryButton>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ProductNav from '../../../../ProductNav';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface ParentOption {
    id: number;
    name: string;
}

interface ProductTypeData {
    id: number;
    name: string;
    parent_id: number | null;
    sort_order: number;
}

interface Props {
    productType: ProductTypeData;
    parentOptions: ParentOption[];
}

export default function Edit({ productType, parentOptions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: productType.name,
        parent_id: productType.parent_id ? String(productType.parent_id) : '',
        sort_order: String(productType.sort_order),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('products.product-types.update', productType.id));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('products.product_types.edit.title')}</h2>}>
            <Head title={`${t('products.product_types.edit.title')}: ${productType.name}`} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value={t('products.fields.name')} />
                            <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="parent_id" value={t('products.fields.parent')} />
                            <Select
                                id="parent_id"
                                className="mt-1"
                                value={data.parent_id}
                                onChange={(value) => setData('parent_id', value)}
                                placeholder={t('products.placeholders.select_parent')}
                                options={[
                                    { value: '', label: t('products.placeholders.optional') },
                                    ...parentOptions.map((p) => ({ value: String(p.id), label: p.name })),
                                ]}
                            />
                            <InputError message={errors.parent_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="sort_order" value={t('products.fields.sort_order')} />
                            <TextInput id="sort_order" type="number" min="0" className="mt-1 block w-full" value={data.sort_order} onChange={(e) => setData('sort_order', e.target.value)} />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.product_types.edit.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.product-types.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

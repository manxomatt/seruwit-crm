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
import { FormEventHandler, useMemo } from 'react';
import PageHeader from '@/Components/PageHeader';

interface OptionRow {
    name: string;
    color: string;
    extra_price: string;
    sort: string;
}

const ATTRIBUTE_TYPES = ['select', 'color', 'radio', 'checkbox'] as const;

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        type: string;
        sort: string;
        options: OptionRow[];
    }>({
        name: '',
        type: 'select',
        sort: '',
        options: [],
    });

    const typeOptions = useMemo(
        () => ATTRIBUTE_TYPES.map((type) => ({ value: type, label: t(`products.attribute_types.${type}`) })),
        [t],
    );

    const addOption = () => {
        setData('options', [...data.options, { name: '', color: '', extra_price: '', sort: String(data.options.length) }]);
    };

    const updateOption = (index: number, field: keyof OptionRow, value: string) => {
        const updated = [...data.options];
        updated[index] = { ...updated[index], [field]: value };
        setData('options', updated);
    };

    const removeOption = (index: number) => {
        setData('options', data.options.filter((_, i) => i !== index));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.attributes.store'));
    };

    return (
        <DynamicLayout header={<PageHeader title={t('products.attributes.create.title')} />}>
            <Head title={t('products.attributes.create.title')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-3xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value={t('products.fields.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="type" value={t('products.fields.type')} />
                                <Select id="type" className="mt-1" value={data.type} onChange={(value) => setData('type', value)} options={typeOptions} />
                                <InputError message={errors.type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="sort" value={t('products.fields.sort_order')} />
                                <TextInput id="sort" type="number" className="mt-1 block w-full" value={data.sort} onChange={(e) => setData('sort', e.target.value)} />
                                <InputError message={errors.sort} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <InputLabel value={t('products.fields.options')} />
                                <SecondaryButton type="button" onClick={addOption}>+ {t('products.attributes.create.add_option')}</SecondaryButton>
                            </div>

                            {data.options.length > 0 && (
                                <div className="space-y-3">
                                    {data.options.map((opt, i) => (
                                        <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex-1">
                                                <TextInput placeholder={t('products.fields.name')} className="w-full" value={opt.name} onChange={(e) => updateOption(i, 'name', e.target.value)} required />
                                                <InputError message={(errors as Record<string, string>)[`options.${i}.name`]} className="mt-1" />
                                            </div>
                                            {data.type === 'color' && (
                                                <div className="w-20">
                                                    <input type="color" className="h-10 w-full cursor-pointer rounded border border-gray-300" value={opt.color || '#000000'} onChange={(e) => updateOption(i, 'color', e.target.value)} />
                                                </div>
                                            )}
                                            <div className="w-32">
                                                <TextInput type="number" placeholder={t('products.fields.price')} className="w-full" value={opt.extra_price} onChange={(e) => updateOption(i, 'extra_price', e.target.value)} />
                                            </div>
                                            <div className="w-20">
                                                <TextInput type="number" placeholder={t('products.fields.sort_order')} className="w-full" value={opt.sort} onChange={(e) => updateOption(i, 'sort', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => removeOption(i)} className="mt-2 text-red-500 hover:text-red-700">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.attributes.create.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.attributes.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

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

const TAG_COLOR_VALUES = ['', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'gray'] as const;

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        color: '',
    });

    const colorOptions = useMemo(
        () => TAG_COLOR_VALUES.map((c) => ({ value: c, label: t(`products.tag_colors.${c || 'none'}`) })),
        [t],
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.tags.store'));
    };

    return (
        <DynamicLayout header={<PageHeader title={t('products.tags.create.title')} />}>
            <Head title={t('products.tags.create.title')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value={t('products.fields.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="color" value={t('products.fields.color')} />
                                <Select id="color" className="mt-1" value={data.color} onChange={(value) => setData('color', value)} options={colorOptions} />
                                <InputError message={errors.color} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.tags.create.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.tags.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

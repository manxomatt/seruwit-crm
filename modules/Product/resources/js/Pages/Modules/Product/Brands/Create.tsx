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

interface Principal {
    id: number;
    name: string;
}

interface Props {
    principals: Principal[];
}

export default function Create({ principals }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        principal_id: '',
        name: '',
        status: 'active',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.brands.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('products.brands.create.title')}</h2>}>
            <Head title={t('products.brands.create.title')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl space-y-6">
                        <div>
                            <InputLabel htmlFor="principal_id" value={t('products.fields.principal')} />
                            <Select
                                id="principal_id"
                                className="mt-1"
                                value={data.principal_id}
                                onChange={(value) => setData('principal_id', value)}
                                placeholder={t('products.placeholders.select_principal')}
                                options={principals.map((p) => ({ value: String(p.id), label: p.name }))}
                            />
                            <InputError message={errors.principal_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="name" value={t('products.fields.name')} />
                            <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value={t('products.fields.status')} />
                            <Select id="status" className="mt-1" value={data.status} onChange={(value) => setData('status', value)} options={[
                                { value: 'active', label: t('products.status.active') },
                                { value: 'inactive', label: t('products.status.inactive') },
                            ]} />
                            <InputError message={errors.status} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.brands.create.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.brands.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

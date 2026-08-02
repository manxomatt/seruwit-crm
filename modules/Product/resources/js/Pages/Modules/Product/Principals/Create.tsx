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
import PageHeader from '@/Components/PageHeader';

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('products.principals.store'));
    };

    return (
        <DynamicLayout header={<PageHeader title={t('products.principals.create.title')} />}>
            <Head title={t('products.principals.create.title')} />
            <ProductNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="name" value={t('products.fields.name')} />
                                <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required autoFocus />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="contact_person" value={t('products.fields.contact_name')} />
                                <TextInput id="contact_person" className="mt-1 block w-full" value={data.contact_person} onChange={(e) => setData('contact_person', e.target.value)} />
                                <InputError message={errors.contact_person} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="phone" value={t('products.fields.phone')} />
                                <TextInput id="phone" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value={t('products.fields.email')} />
                                <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="status" value={t('products.fields.status')} />
                                <Select id="status" className="mt-1" value={data.status} onChange={(value) => setData('status', value)} options={[
                                    { value: 'active', label: t('products.status.active') },
                                    { value: 'inactive', label: t('products.status.inactive') },
                                ]} />
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="address" value={t('products.fields.address')} />
                                <textarea id="address" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                <InputError message={errors.address} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('products.principals.create.submit')}</PrimaryButton>
                            <Link href={prefixedRoute('products.principals.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

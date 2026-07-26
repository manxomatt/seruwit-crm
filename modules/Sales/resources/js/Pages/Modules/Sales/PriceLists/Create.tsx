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

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        is_active: true,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('sales.price-lists.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('sales.price_lists.create')}</h2>}>
            <Head title={t('sales.price_lists.create')} />
            <SalesNav />
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel value={`${t('sales.fields.name')} *`} />
                    <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-2" />
                </div>
                <div>
                    <InputLabel value={t('sales.fields.code')} />
                    <TextInput className="mt-1 block w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} />
                    <InputError message={errors.code} className="mt-2" />
                </div>
                <div>
                    <InputLabel value={t('sales.fields.notes')} />
                    <TextInput className="mt-1 block w-full" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                    {t('sales.price_lists.active')}
                </label>
                <div className="flex gap-2">
                    <PrimaryButton disabled={processing}>{t('sales.price_lists.save')}</PrimaryButton>
                    <Link href={prefixedRoute('sales.price-lists.index')}>
                        <SecondaryButton type="button">{t('sales.actions.cancel')}</SecondaryButton>
                    </Link>
                </div>
            </form>
        </DynamicLayout>
    );
}

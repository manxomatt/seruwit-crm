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
import CanvassingNav from '../../../../CanvassingNav';
import PageHeader from '@/Components/PageHeader';

export default function CreateSalesperson(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        employee_code: '',
        phone: '',
        email: '',
        area: '',
        is_active: true,
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('canvassing.salespeople.store'));
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('canvassing.salespeople.add')} />}
        >
            <Head title={t('canvassing.salespeople.create_title')} />

            <CanvassingNav />

            <form onSubmit={submit} className="space-y-5 bg-white p-6 shadow-sm sm:rounded-lg">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="name" value={t('canvassing.salespeople.full_name')} />
                        <TextInput
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="employee_code" value={t('canvassing.salespeople.employee_code')} />
                        <TextInput
                            id="employee_code"
                            value={data.employee_code}
                            onChange={(e) => setData('employee_code', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={errors.employee_code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="area" value={t('canvassing.salespeople.area')} />
                        <TextInput
                            id="area"
                            value={data.area}
                            onChange={(e) => setData('area', e.target.value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="phone" value={t('canvassing.salespeople.phone')} />
                        <TextInput
                            id="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="mt-1 w-full"
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="email" value={t('canvassing.salespeople.email')} />
                        <TextInput
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="mt-1 w-full"
                        />
                        <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel htmlFor="notes" value={t('canvassing.salespeople.notes')} />
                        <textarea
                            id="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            {t('canvassing.salespeople.active_portal')}
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('canvassing.salespeople.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>{t('canvassing.salespeople.create')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { toDateInputValue } from '@/utils/date';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, type ReactNode } from 'react';
import FleetNav from '../../../../FleetNav';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string;
    email: string | null;
    status: string;
    photo_url: string | null;
    notes: string | null;
}

interface Props {
    driver: Driver;
}

const DRIVER_STATUSES = ['available', 'on_trip', 'off_duty', 'inactive'] as const;

function FormSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:px-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
        </section>
    );
}

export default function Edit({ driver }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: driver.name,
        license_number: driver.license_number,
        license_type: driver.license_type || '',
        license_expires_at: toDateInputValue(driver.license_expires_at),
        phone: driver.phone,
        email: driver.email || '',
        status: driver.status,
        photo_url: driver.photo_url || '',
        notes: driver.notes || '',
    });

    const displayName = data.name.trim() || t('fleet.drivers.preview_untitled');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('fleet.drivers.update', driver.id));
    };

    const textareaClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('fleet.drivers.title')}
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">
                            {t('fleet.drivers.edit')}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.drivers.show', driver.id)}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="fleet-driver-edit-form" disabled={processing}>
                            {processing ? t('fleet.drivers.saving') : t('fleet.drivers.save')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.drivers.edit')} />
            <FleetNav />

            <form id="fleet-driver-edit-form" onSubmit={submit} className="space-y-6">
                <div className="space-y-6">
                    <FormSection
                        title={t('fleet.drivers.sections.profile')}
                        subtitle={t('fleet.drivers.sections.profile_hint')}
                    >
                        <div>
                            <InputLabel htmlFor="name" value={t('fleet.drivers.name')} />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoFocus
                                placeholder="Budi Santoso"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value={t('fleet.drivers.status')} />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {DRIVER_STATUSES.map((status) => {
                                    const active = data.status === status;

                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setData('status', status)}
                                            className={`rounded-xl border px-4 py-3 text-left transition ${
                                                active
                                                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200 dark:border-sky-700 dark:bg-sky-950/40 dark:ring-sky-800'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            <p className={`text-sm font-semibold ${active ? 'text-sky-900 dark:text-sky-100' : 'text-gray-900 dark:text-white'}`}>
                                                {t(`fleet.status.${status}`)}
                                            </p>
                                            <p className={`mt-0.5 text-xs ${active ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {t(`fleet.drivers.status_hints.${status}`)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.status} className="mt-2" />
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.drivers.sections.contact')}
                        subtitle={t('fleet.drivers.sections.contact_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="phone" value={t('fleet.drivers.phone')} />
                                <TextInput
                                    id="phone"
                                    className="mt-1 block w-full"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    required
                                    placeholder="081234567890"
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value={t('fleet.drivers.email')} />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="driver@example.com"
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.drivers.sections.license')}
                        subtitle={t('fleet.drivers.sections.license_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="license_number" value={t('fleet.drivers.license_number')} />
                                <TextInput
                                    id="license_number"
                                    className="mt-1 block w-full font-mono uppercase"
                                    value={data.license_number}
                                    onChange={(e) => setData('license_number', e.target.value.toUpperCase())}
                                    required
                                    placeholder="SIM123456"
                                />
                                <InputError message={errors.license_number} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_type" value={t('fleet.drivers.license_type')} />
                                <TextInput
                                    id="license_type"
                                    className="mt-1 block w-full uppercase"
                                    value={data.license_type}
                                    onChange={(e) => setData('license_type', e.target.value.toUpperCase())}
                                    placeholder="B1"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.drivers.license_type_hint')}</p>
                                <InputError message={errors.license_type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="license_expires_at" value={t('fleet.drivers.license_expires')} />
                                <TextInput
                                    id="license_expires_at"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.license_expires_at}
                                    onChange={(e) => setData('license_expires_at', e.target.value)}
                                />
                                <InputError message={errors.license_expires_at} className="mt-2" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('fleet.drivers.sections.photo')}
                        subtitle={t('fleet.drivers.sections.photo_hint')}
                    >
                        <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} />
                        <InputError message={errors.photo_url} className="mt-2" />
                    </FormSection>

                    <FormSection
                        title={t('fleet.drivers.sections.notes')}
                        subtitle={t('fleet.drivers.sections.notes_hint')}
                    >
                        <div>
                            <InputLabel htmlFor="notes" value={t('fleet.drivers.notes')} />
                            <textarea
                                id="notes"
                                rows={3}
                                className={textareaClass}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>
                    </FormSection>
                </div>

                <div className="sticky bottom-4 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
                        <p className="min-w-0 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{displayName}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                            <span>{t(`fleet.status.${data.status}`, undefined, data.status)}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('fleet.drivers.show', driver.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? t('fleet.drivers.saving') : t('fleet.drivers.save')}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}

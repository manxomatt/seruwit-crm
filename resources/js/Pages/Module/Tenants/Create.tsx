import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Props {
    tenantBaseDomain: string;
}

const BuildingOfficeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const UserCircleIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const GlobeAltIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const LockClosedIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

function FieldGroup({ label, hint, error, children }: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        </div>
    );
}

const inputCls =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-400';

export default function Create({ tenantBaseDomain }: Props): JSX.Element {
    const { t } = useTrans();

    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.tenants.store'));
    };

    const subdomainPreview = data.subdomain
        ? `${data.subdomain}.${tenantBaseDomain}`
        : null;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tenants.pages.create.title')}
                    actions={
                        <Link href={route('module.tenants.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('tenants.pages.create.head')} />

            <form onSubmit={submit} className="mx-auto max-w-4xl">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* ── Workspace Info ── */}
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700">
                        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                <BuildingOfficeIcon />
                            </span>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {t('tenants.pages.create.workspace_section')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('tenants.pages.create.workspace_hint')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            <FieldGroup
                                label={t('tenants.fields.company_name')}
                                error={errors.company_name}
                            >
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    placeholder="PT Maju Bersama"
                                    autoFocus
                                    required
                                />
                            </FieldGroup>

                            <FieldGroup
                                label={t('tenants.fields.subdomain')}
                                error={errors.subdomain}
                            >
                                <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-gray-600 dark:focus-within:border-indigo-400">
                                    <input
                                        type="text"
                                        className="min-w-0 flex-1 border-0 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                                        value={data.subdomain}
                                        onChange={(e) =>
                                            setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                                        }
                                        placeholder="maju-bersama"
                                        required
                                    />
                                    <span className="flex items-center bg-gray-50 px-3 text-sm text-gray-400 dark:bg-gray-600 dark:text-gray-400">
                                        .{tenantBaseDomain}
                                    </span>
                                </div>

                                {subdomainPreview && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                                        <GlobeAltIcon />
                                        <span className="font-mono">{subdomainPreview}</span>
                                    </div>
                                )}
                            </FieldGroup>
                        </div>
                    </div>

                    {/* ── Owner Info ── */}
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700">
                        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                <UserCircleIcon />
                            </span>
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {t('tenants.pages.create.owner_section')}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('tenants.pages.create.owner_hint')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5 px-6 py-5">
                            <FieldGroup
                                label={t('tenants.fields.owner_name')}
                                error={errors.owner_name}
                            >
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={data.owner_name}
                                    onChange={(e) => setData('owner_name', e.target.value)}
                                    placeholder="Budi Santoso"
                                    required
                                />
                            </FieldGroup>

                            <FieldGroup
                                label={t('tenants.fields.owner_email')}
                                error={errors.owner_email}
                            >
                                <input
                                    type="email"
                                    className={inputCls}
                                    value={data.owner_email}
                                    onChange={(e) => setData('owner_email', e.target.value)}
                                    placeholder="budi@majubersama.com"
                                    required
                                />
                            </FieldGroup>

                            <FieldGroup
                                label={t('tenants.fields.owner_password')}
                                hint={t('tenants.fields.owner_password_hint')}
                                error={errors.owner_password}
                            >
                                <div className="relative">
                                    <input
                                        type="password"
                                        className={inputCls}
                                        value={data.owner_password}
                                        onChange={(e) => setData('owner_password', e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500">
                                        <LockClosedIcon />
                                    </span>
                                </div>
                            </FieldGroup>
                        </div>
                    </div>
                </div>

                {/* ── Submit Bar ── */}
                <div className="mt-6 flex items-center justify-end gap-3 rounded-xl bg-white px-6 py-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700">
                    <p className="mr-auto text-xs text-gray-400">
                        {t('tenants.pages.create.async_note')}
                    </p>
                    <Link href={route('module.tenants.index')}>
                        <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton type="submit" disabled={processing}>
                        {t('tenants.pages.create.submit')}
                    </PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

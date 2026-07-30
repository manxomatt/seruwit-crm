import DynamicLayout from '@/Layouts/DynamicLayout';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface TenantRow {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    members: number;
    created_at: string | null;
}

interface Props {
    tenants: TenantRow[];
}

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const BuildingIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const SuspendIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const ActivateIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function Index({ tenants }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('module.tenants.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    const toggleStatus = (tenant: TenantRow) => {
        router.patch(route('module.tenants.toggle-status', tenant.id));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('tenants.title')}</h1>
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PlusIcon />
                        <span className="ml-2">{showForm ? t('tenants.pages.index.close_form') : t('tenants.pages.index.new')}</span>
                    </button>
                </div>
            }
        >
            <Head title={t('tenants.title')} />

            {showForm && (
                <form onSubmit={submit} className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('tenants.pages.index.create_heading')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.company_name')}
                            <input className={inputClass} value={data.company_name} onChange={(e) => setData('company_name', e.target.value)} required />
                            {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.subdomain')}
                            <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                            {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.owner_name')}
                            <input className={inputClass} value={data.owner_name} onChange={(e) => setData('owner_name', e.target.value)} required />
                            {errors.owner_name && <p className="mt-1 text-xs text-red-500">{errors.owner_name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.owner_email')}
                            <input type="email" className={inputClass} value={data.owner_email} onChange={(e) => setData('owner_email', e.target.value)} required />
                            {errors.owner_email && <p className="mt-1 text-xs text-red-500">{errors.owner_email}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            {t('tenants.fields.owner_password')} <span className="font-normal text-gray-400">{t('tenants.fields.owner_password_hint')}</span>
                            <input type="password" className={inputClass} value={data.owner_password} onChange={(e) => setData('owner_password', e.target.value)} />
                            {errors.owner_password && <p className="mt-1 text-xs text-red-500">{errors.owner_password}</p>}
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-5 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {t('tenants.pages.index.submit')}
                    </button>
                </form>
            )}

            {tenants.length === 0 ? (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="py-16 text-center">
                        <div className="flex justify-center">
                            <BuildingIcon />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{t('tenants.pages.index.empty_title')}</h3>
                        <p className="mt-2 text-sm text-gray-500">{t('tenants.pages.index.empty_hint')}</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.name')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.domain')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.members')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.status')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.created_at')}</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.index.columns.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {tenants.map((tenant) => (
                                <tr key={tenant.id} className="transition-colors hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <Link
                                            href={route('module.tenants.show', tenant.id)}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                        >
                                            {tenant.name}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">{tenant.domain ?? '—'}</code>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{tenant.members}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                tenant.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {tenant.status === 'active' ? t('tenants.status.active') : t('tenants.status.suspended')}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(tenant.created_at)}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route('module.tenants.show', tenant.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title={t('tenants.actions.view_detail')}
                                            >
                                                <EyeIcon />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(tenant)}
                                                className={
                                                    tenant.status === 'active'
                                                        ? 'text-amber-600 hover:text-amber-800'
                                                        : 'text-emerald-600 hover:text-emerald-800'
                                                }
                                                title={
                                                    tenant.status === 'active'
                                                        ? t('tenants.actions.suspend')
                                                        : t('tenants.actions.activate')
                                                }
                                            >
                                                {tenant.status === 'active' ? <SuspendIcon /> : <ActivateIcon />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DynamicLayout>
    );
}

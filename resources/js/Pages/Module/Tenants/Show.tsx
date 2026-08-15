import DynamicLayout from '@/Layouts/DynamicLayout';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

interface Member {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

type ModuleState = 'installed' | 'available' | 'uninstalled' | 'locked' | 'locked_with_data' | 'disabled' | 'disabled_with_data';

interface ModuleEntry {
    key: string;
    label: string;
    description: string;
    requires: string[];
    entitled: boolean;
    installed: boolean;
    state: ModuleState;
    purges_at: string | null;
    plans_offering: string[];
}

interface Plan {
    key: string;
    label: string;
    description: string;
    modules: string[];
}

interface ActivityLogEntry {
    id: number;
    action: string;
    description: string;
    actor_name: string | null;
    created_at: string | null;
    meta: Record<string, unknown> | null;
}

const STATE_BADGE_CLASS: Record<ModuleState, string> = {
    installed: 'bg-green-100 text-green-800',
    available: 'bg-sky-100 text-sky-800',
    uninstalled: 'bg-amber-100 text-amber-800',
    locked: 'bg-gray-100 text-gray-600',
    locked_with_data: 'bg-gray-100 text-gray-600',
    disabled: 'bg-red-100 text-red-800',
    disabled_with_data: 'bg-red-100 text-red-800',
};

const ACTION_COLOR: Record<string, string> = {
    created: 'bg-indigo-100 text-indigo-600',
    updated: 'bg-blue-100 text-blue-600',
    status_changed: 'bg-amber-100 text-amber-600',
    module_installed: 'bg-green-100 text-green-600',
    module_uninstalled: 'bg-orange-100 text-orange-600',
    setup_retried: 'bg-purple-100 text-purple-600',
};

const isDisabled = (state: ModuleState): boolean => state === 'disabled' || state === 'disabled_with_data';

interface TenantDetail {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    subdomain: string | null;
    members: number;
    created_at: string | null;
    billing_email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
    notes: string | null;
    plan: string;
    can_install_demo_data: boolean;
}

interface Props {
    tenant: TenantDetail;
    members: Member[];
    modules: ModuleEntry[];
    plans: Plan[];
    graceDays: number;
    activityLogs: ActivityLogEntry[];
    canRetrySetup: boolean;
}

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const ActivityIcon = ({ action }: { action: string }) => {
    if (action === 'created') return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
    if (action === 'status_changed') return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
    );
    if (action === 'module_installed') return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    if (action === 'module_uninstalled') return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
    if (action === 'setup_retried') return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
    );
    return (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
        </svg>
    );
};

const formatActivityTime = (isoString: string | null): string => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function Show({ tenant, members, modules, plans, graceDays, activityLogs, canRetrySetup }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const { data, setData, patch, processing, errors } = useForm({
        name: tenant.name,
        subdomain: tenant.subdomain ?? '',
        status: tenant.status,
        plan: tenant.plan,
        can_install_demo_data: tenant.can_install_demo_data ?? false,
        billing_email: tenant.billing_email ?? '',
        phone: tenant.phone ?? '',
        address: tenant.address ?? '',
        tax_id: tenant.tax_id ?? '',
        notes: tenant.notes ?? '',
    });

    const deleteForm = useForm({ confirm_name: '' });

    const installModule = (key: string): void => {
        router.post(route('module.tenants.modules.install', [tenant.id, key]), {}, { preserveScroll: true });
    };

    const uninstallModule = (key: string): void => {
        router.delete(route('module.tenants.modules.uninstall', [tenant.id, key]), { preserveScroll: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('module.tenants.update', tenant.id), { preserveScroll: true });
    };

    const destroy = (e: React.FormEvent) => {
        e.preventDefault();
        deleteForm.delete(route('module.tenants.destroy', tenant.id));
    };

    const retrySetup = (): void => {
        router.post(route('module.tenants.retry-setup', tenant.id), {}, { preserveScroll: true });
    };

    const inputClass =
        'mt-1 block w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500';

    const canDelete = deleteForm.data.confirm_name === tenant.name;

    const statusLabel = (status: string): string =>
        status === 'active' ? t('tenants.status.active') : t('tenants.status.suspended');

    const enterWorkspaceUrl = tenant.domain
        ? route('central.workspaces.enter', { tenant: tenant.id })
        : null;

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href={route('module.tenants.index')} className="text-gray-400 hover:text-gray-600">
                            <ArrowLeftIcon />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
                            {tenant.domain && <p className="text-sm text-gray-500">{tenant.domain}</p>}
                        </div>
                    </div>

                    {enterWorkspaceUrl && (
                        <a
                            href={enterWorkspaceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <ExternalLinkIcon />
                            {t('tenants.actions.enter_workspace')}
                        </a>
                    )}
                </div>
            }
        >
            <Head title={t('tenants.pages.show.head_title', { name: tenant.name })} />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                        {flash.error}
                    </div>
                )}

                {/* Overview */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                        { label: t('tenants.fields.status'), value: statusLabel(tenant.status) },
                        { label: t('tenants.fields.members'), value: String(tenant.members) },
                        { label: t('tenants.fields.plan'), value: plans.find((p) => p.key === tenant.plan)?.label ?? tenant.plan },
                        { label: t('tenants.fields.subdomain'), value: tenant.subdomain ?? '—' },
                        { label: t('tenants.fields.created_at'), value: tenant.created_at ?? '—' },
                    ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{item.label}</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">{item.value}</p>
                        </div>
                    ))}
                </div>

                {/* Activity Log */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">{t('tenants.activity.title')}</h2>
                    </div>

                    {activityLogs.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-gray-400">{t('tenants.activity.empty')}</p>
                    ) : (
                        <ul className="divide-y divide-gray-50 px-6">
                            {activityLogs.map((log) => {
                                const colorClass = ACTION_COLOR[log.action] ?? 'bg-gray-100 text-gray-500';
                                const actionLabel = t(`tenants.activity.actions.${log.action}`, undefined, log.action);

                                return (
                                    <li key={log.id} className="flex items-start gap-4 py-4">
                                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                                            <ActivityIcon action={log.action} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900">{actionLabel}</p>
                                            <p className="mt-0.5 text-sm text-gray-500">{log.description}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {log.actor_name ?? 'System'} · {formatActivityTime(log.created_at)}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Members */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">{t('tenants.pages.show.members_heading')}</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.show.member_columns.name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.show.member_columns.email')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tenants.pages.show.member_columns.roles')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{member.email}</td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {member.roles.length > 0 ? (
                                                member.roles.map((role) => (
                                                    <span key={role} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                        {role}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">{t('tenants.pages.show.no_members')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Edit form */}
                <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('tenants.pages.show.edit_heading')}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.company_name')}
                            <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.subdomain')}
                            <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                            {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                        </label>
                        <div className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.status')}
                            <div className="mt-1 grid grid-cols-2 gap-2">
                                {[
                                    { value: 'active', label: t('tenants.status.active'), dot: 'bg-green-500', selected: 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500' },
                                    { value: 'suspended', label: t('tenants.status.suspended'), dot: 'bg-amber-500', selected: 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500' },
                                ].map((opt) => {
                                    const isSelected = data.status === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('status', opt.value)}
                                            aria-pressed={isSelected}
                                            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                                                isSelected ? opt.selected : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className={`h-2 w-2 rounded-full transition-colors ${isSelected ? opt.dot : 'bg-gray-300'}`} />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
                        </div>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            {t('tenants.fields.plan')}
                            <Select
                                className="mt-1 w-full"
                                value={data.plan}
                                onChange={(value) => setData('plan', value)}
                                options={plans.map((plan) => ({ value: plan.key, label: `${plan.label} — ${plan.description}` }))}
                            />
                            {errors.plan && <p className="mt-1 text-xs text-red-500">{errors.plan}</p>}
                            <p className="mt-1 text-xs text-gray-500">{t('tenants.fields.plan_hint')}</p>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:col-span-2">
                            <input
                                type="checkbox"
                                className="mt-0.5 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={data.can_install_demo_data}
                                onChange={(e) => setData('can_install_demo_data', e.target.checked)}
                            />
                            <span>
                                <span className="block text-sm font-medium text-gray-900">{t('tenants.fields.can_install_demo_data')}</span>
                                <span className="mt-0.5 block text-xs text-gray-500">{t('tenants.fields.can_install_demo_data_hint')}</span>
                            </span>
                        </label>
                    </div>
                    {data.subdomain !== (tenant.subdomain ?? '') && (
                        <p className="mt-3 text-xs text-amber-600">{t('tenants.pages.show.subdomain_warning')}</p>
                    )}

                    <h3 className="mb-4 mt-8 border-t border-gray-100 pt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
                        {t('tenants.pages.show.profile_heading')}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.billing_email')}
                            <input type="email" className={inputClass} value={data.billing_email} onChange={(e) => setData('billing_email', e.target.value)} placeholder="billing@perusahaan.com" />
                            {errors.billing_email && <p className="mt-1 text-xs text-red-500">{errors.billing_email}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.phone')}
                            <input className={inputClass} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+62 ..." />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.tax_id')}
                            <input className={inputClass} value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} />
                            {errors.tax_id && <p className="mt-1 text-xs text-red-500">{errors.tax_id}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            {t('tenants.fields.address')}
                            <input className={inputClass} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                        </label>
                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            {t('tenants.fields.notes')} <span className="font-normal text-gray-400">{t('tenants.fields.notes_hint')}</span>
                            <textarea className={inputClass} rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-5 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {t('tenants.actions.save_changes')}
                    </button>
                </form>

                {/* Modules */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900">{t('tenants.pages.show.modules_heading')}</h2>
                        <p className="mt-1 text-sm text-gray-600">{t('tenants.pages.show.modules_hint', { days: graceDays })}</p>
                    </div>

                    {modules.length === 0 ? (
                        <p className="p-6 text-sm text-gray-500">{t('tenants.pages.show.no_modules')}</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {modules.map((module) => {
                                const badgeLabel = t(`tenants.pages.show.module_states.${module.state}`);

                                return (
                                    <li key={module.key} className="flex flex-wrap items-center gap-4 p-6">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900">{module.label}</h4>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_BADGE_CLASS[module.state]}`}>
                                                    {badgeLabel}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">{module.description}</p>

                                            {module.state === 'uninstalled' && module.purges_at && (
                                                <p className="mt-2 text-xs text-amber-700">
                                                    {t('tenants.pages.show.purges_at', { date: module.purges_at })}
                                                </p>
                                            )}

                                            {isDisabled(module.state) && (
                                                <p className="mt-2 text-xs text-red-700">
                                                    {module.state === 'disabled_with_data'
                                                        ? t('tenants.pages.show.module_disabled_with_data_hint')
                                                        : t('tenants.pages.show.module_disabled_hint')}
                                                </p>
                                            )}

                                            {!isDisabled(module.state) && !module.entitled && module.plans_offering.length > 0 && (
                                                <p className="mt-2 text-xs text-gray-500">
                                                    {t('tenants.pages.show.plans_offering_hint', { plans: module.plans_offering.join(', ') })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="shrink-0">
                                            {isDisabled(module.state) ? (
                                                <span className="text-sm text-gray-400">{t('tenants.pages.show.module_states.disabled')}</span>
                                            ) : !module.entitled ? (
                                                <span className="text-sm text-gray-400">{t('tenants.pages.show.module_states.locked')}</span>
                                            ) : module.installed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => uninstallModule(module.key)}
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    {t('tenants.actions.uninstall')}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => installModule(module.key)}
                                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                                >
                                                    {t('tenants.actions.install')}
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Retry Setup */}
                {canRetrySetup && (
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{t('tenants.setup.title')}</h2>
                                <p className="mt-1 text-sm text-gray-600">{t('tenants.setup.hint')}</p>
                                <p className="mt-1 text-xs text-gray-400">{t('tenants.setup.retry_hint')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={retrySetup}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm transition-colors hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                {t('tenants.setup.retry_button')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Danger zone */}
                <form onSubmit={destroy} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-red-200">
                    <h2 className="text-lg font-semibold text-red-700">{t('tenants.pages.show.danger_zone')}</h2>
                    <p className="mt-1 text-sm text-gray-600">{t('tenants.pages.show.danger_zone_hint')}</p>
                    <label className="mt-4 block text-sm font-medium text-gray-700">
                        {t('tenants.fields.confirm_name', { name: tenant.name })}
                        <input
                            className={inputClass}
                            value={deleteForm.data.confirm_name}
                            onChange={(e) => deleteForm.setData('confirm_name', e.target.value)}
                            placeholder={tenant.name}
                        />
                        {deleteForm.errors.confirm_name && <p className="mt-1 text-xs text-red-500">{deleteForm.errors.confirm_name}</p>}
                    </label>
                    <button
                        type="submit"
                        disabled={!canDelete || deleteForm.processing}
                        className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {t('tenants.actions.delete_permanently')}
                    </button>
                </form>
            </div>
        </DynamicLayout>
    );
}

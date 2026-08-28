import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
    installed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    available: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    uninstalled: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    locked: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    locked_with_data: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    disabled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    disabled_with_data: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

const ACTION_COLOR: Record<string, string> = {
    created: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    updated: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    status_changed: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    module_installed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    module_uninstalled: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    setup_retried: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
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

const AVATAR_BG = [
    'from-indigo-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
];

const getAvatarBg = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_BG.length;
    return AVATAR_BG[index];
};

const ActivityIcon = ({ action }: { action: string }) => {
    if (action === 'created') return <span>✨</span>;
    if (action === 'status_changed') return <span>🔄</span>;
    if (action === 'module_installed') return <span>📦</span>;
    if (action === 'module_uninstalled') return <span>🗑️</span>;
    if (action === 'setup_retried') return <span>⚡</span>;
    return <span>✏️</span>;
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
    if (diffMins < 60) return `${diffMins}m lalu`;
    if (diffHours < 24) return `${diffHours}j lalu`;
    if (diffDays < 7) return `${diffDays}d lalu`;

    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

type TabType = 'overview' | 'modules' | 'members' | 'activity' | 'danger';

export default function Show({ tenant, members, modules, plans, graceDays, activityLogs, canRetrySetup }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [activeTab, setActiveTab] = useState<TabType>('overview');

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

    const planOptions = useMemo(() => {
        const list = plans.map((plan) => ({
            value: plan.key,
            label: plan.description ? `${plan.label} (${plan.key}) — ${plan.description}` : `${plan.label} (${plan.key})`,
        }));

        if (data.plan && !list.some((opt) => opt.value === data.plan)) {
            list.unshift({
                value: data.plan,
                label: `${data.plan} (Paket saat ini)`,
            });
        }

        return list;
    }, [plans, data.plan]);

    const selectedPlan = plans.find((p) => p.key === data.plan);

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
        'block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500';

    const canDelete = deleteForm.data.confirm_name === tenant.name;

    const statusLabel = (status: string): string =>
        status === 'active' ? t('tenants.status.active') : t('tenants.status.suspended');

    const enterWorkspaceUrl = tenant.domain
        ? route('central.workspaces.enter', { tenant: tenant.id })
        : null;

    const companyInitial = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'T';

    const tabs: Array<{ id: TabType; label: string; icon: string; badge?: number }> = [
        { id: 'overview', label: t('tenants.pages.show.tabs.overview'), icon: '⚙️' },
        { id: 'modules', label: t('tenants.pages.show.tabs.modules'), icon: '🧩', badge: modules.filter((m) => m.installed).length },
        { id: 'members', label: t('tenants.pages.show.tabs.members'), icon: '👥', badge: members.length },
        { id: 'activity', label: t('tenants.pages.show.tabs.activity'), icon: '📜', badge: activityLogs.length },
        { id: 'danger', label: t('tenants.pages.show.tabs.danger'), icon: '⚠️' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={tenant.name}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href={route('module.tenants.index')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">
                                    ← {t('common.cancel')}
                                </SecondaryButton>
                            </Link>

                            {canRetrySetup && (
                                <button
                                    type="button"
                                    onClick={retrySetup}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                                >
                                    ⚡ {t('tenants.setup.retry_button')}
                                </button>
                            )}

                            {enterWorkspaceUrl && (
                                <a
                                    href={enterWorkspaceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
                                >
                                    🌐 {t('tenants.actions.enter_workspace')} ↗
                                </a>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={t('tenants.pages.show.head_title', { name: tenant.name })} />

            <div className="space-y-6">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-700 dark:text-rose-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">!</span>
                            <span>{flash.error}</span>
                        </div>
                    </div>
                )}

                {/* Hero Profile Card Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${getAvatarBg(
                                    tenant.name,
                                )} text-white font-extrabold text-2xl shadow-md`}
                            >
                                {companyInitial}
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                        {tenant.name}
                                    </h1>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                            tenant.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                        }`}
                                    >
                                        {statusLabel(tenant.status)}
                                    </span>
                                </div>
                                {tenant.domain ? (
                                    <a
                                        href={`https://${tenant.domain}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        🌐 https://{tenant.domain} ↗
                                    </a>
                                ) : (
                                    <p className="mt-1 text-xs text-slate-400">Belum ada domain dikonfigurasi</p>
                                )}
                            </div>
                        </div>

                        {/* Top Stats Chips */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[100px]">
                                <div className="text-[10px] font-bold uppercase text-slate-400">Paket</div>
                                <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                    {plans.find((p) => p.key === tenant.plan)?.label ?? tenant.plan}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[100px]">
                                <div className="text-[10px] font-bold uppercase text-slate-400">Anggota</div>
                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {tenant.members}
                                </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 text-center min-w-[100px]">
                                <div className="text-[10px] font-bold uppercase text-slate-400">Dibuat</div>
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {tenant.created_at ?? '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                                    active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.badge !== undefined && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                                            active ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab 1: Overview & Settings */}
                {activeTab === 'overview' && (
                    <form onSubmit={submit} className="space-y-6">
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                ⚙️ {t('tenants.pages.show.edit_heading')}
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        {t('tenants.fields.company_name')}
                                    </label>
                                    <input className={inputClass} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                    {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        {t('tenants.fields.subdomain')}
                                    </label>
                                    <input className={inputClass} value={data.subdomain} onChange={(e) => setData('subdomain', e.target.value.toLowerCase())} required />
                                    {errors.subdomain && <p className="mt-1 text-xs text-rose-500">{errors.subdomain}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                        {t('tenants.fields.status')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: 'active', label: t('tenants.status.active'), selected: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' },
                                            { value: 'suspended', label: t('tenants.status.suspended'), selected: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold' },
                                        ].map((opt) => {
                                            const isSelected = data.status === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setData('status', opt.value)}
                                                    className={`rounded-xl border px-3 py-2 text-xs transition-all ${
                                                        isSelected ? opt.selected : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                        {t('tenants.fields.plan')}
                                    </label>
                                    <Select
                                        className="w-full"
                                        value={data.plan}
                                        onChange={(value) => setData('plan', value)}
                                        options={planOptions}
                                        placeholder={t('tenants.fields.select_plan', undefined, 'Pilih paket langganan...')}
                                    />
                                    {errors.plan && <p className="mt-1 text-xs text-rose-500">{errors.plan}</p>}
                                    {selectedPlan && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                            <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                                                {selectedPlan.modules.length} modul aktif
                                            </span>
                                            {selectedPlan.description && <span>{selectedPlan.description}</span>}
                                        </div>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={data.can_install_demo_data}
                                            onChange={(e) => setData('can_install_demo_data', e.target.checked)}
                                        />
                                        <div>
                                            <span className="block text-xs font-bold text-slate-900 dark:text-white">{t('tenants.fields.can_install_demo_data')}</span>
                                            <span className="mt-0.5 block text-xs text-slate-500">{t('tenants.fields.can_install_demo_data_hint')}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Contact Profile Section */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    {t('tenants.pages.show.profile_heading')}
                                </h3>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('tenants.fields.billing_email')}
                                        </label>
                                        <input type="email" className={inputClass} value={data.billing_email} onChange={(e) => setData('billing_email', e.target.value)} placeholder="billing@company.com" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('tenants.fields.phone')}
                                        </label>
                                        <input className={inputClass} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+62 812..." />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('tenants.fields.tax_id')}
                                        </label>
                                        <input className={inputClass} value={data.tax_id} onChange={(e) => setData('tax_id', e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('tenants.fields.address')}
                                        </label>
                                        <input className={inputClass} value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('tenants.fields.notes')} <span className="font-normal text-slate-400">{t('tenants.fields.notes_hint')}</span>
                                        </label>
                                        <textarea className={inputClass} rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <PrimaryButton type="submit" disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                    {t('tenants.actions.save_changes')}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                )}

                {/* Tab 2: Modules Management */}
                {activeTab === 'modules' && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                🧩 {t('tenants.pages.show.modules_heading')}
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {t('tenants.pages.show.modules_hint', { days: graceDays })}
                            </p>
                        </div>

                        {modules.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">{t('tenants.pages.show.no_modules')}</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {modules.map((module) => {
                                    const badgeLabel = t(`tenants.pages.show.module_states.${module.state}`);

                                    return (
                                        <div
                                            key={module.key}
                                            className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 space-y-4"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {module.label}
                                                    </h4>
                                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${STATE_BADGE_CLASS[module.state]}`}>
                                                        {badgeLabel}
                                                    </span>
                                                </div>
                                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {module.description}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                                                <span className="font-mono text-[10px] text-slate-400">{module.key}</span>

                                                <div>
                                                    {isDisabled(module.state) ? (
                                                        <span className="text-xs text-slate-400">{t('tenants.pages.show.module_states.disabled')}</span>
                                                    ) : !module.entitled ? (
                                                        <span className="text-xs text-slate-400">{t('tenants.pages.show.module_states.locked')}</span>
                                                    ) : module.installed ? (
                                                        <SecondaryButton
                                                            type="button"
                                                            onClick={() => uninstallModule(module.key)}
                                                            className="!rounded-xl text-xs text-rose-600 dark:text-rose-400"
                                                        >
                                                            {t('tenants.actions.uninstall')}
                                                        </SecondaryButton>
                                                    ) : (
                                                        <PrimaryButton
                                                            type="button"
                                                            onClick={() => installModule(module.key)}
                                                            className="!rounded-xl text-xs"
                                                        >
                                                            {t('tenants.actions.install')}
                                                        </PrimaryButton>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Members */}
                {activeTab === 'members' && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="border-b border-slate-100 dark:border-slate-800 p-6">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                👥 {t('tenants.pages.show.members_heading')}
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-50/60 dark:bg-slate-800/40 text-left font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="px-6 py-3">{t('tenants.pages.show.member_columns.name')}</th>
                                        <th className="px-6 py-3">{t('tenants.pages.show.member_columns.email')}</th>
                                        <th className="px-6 py-3">{t('tenants.pages.show.member_columns.roles')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{member.name}</td>
                                            <td className="px-6 py-4 font-mono text-slate-500">{member.email}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {member.roles.length > 0 ? (
                                                        member.roles.map((role) => (
                                                            <span key={role} className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                                                                {role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {members.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                                                {t('tenants.pages.show.no_members')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 4: Activity Log */}
                {activeTab === 'activity' && (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                📜 {t('tenants.activity.title')}
                            </h2>
                        </div>

                        {activityLogs.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-8">{t('tenants.activity.empty')}</p>
                        ) : (
                            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
                                {activityLogs.map((log) => {
                                    const colorClass = ACTION_COLOR[log.action] ?? 'bg-slate-100 text-slate-500';
                                    const actionLabel = t(`tenants.activity.actions.${log.action}`, undefined, log.action);

                                    return (
                                        <div key={log.id} className="relative pl-6">
                                            <span className={`absolute -left-3.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs shadow-sm ${colorClass}`}>
                                                <ActivityIcon action={log.action} />
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {actionLabel}
                                                </h4>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {log.description}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {log.actor_name ?? 'System'} · {formatActivityTime(log.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 5: Danger Zone */}
                {activeTab === 'danger' && (
                    <form onSubmit={destroy} className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-sm space-y-5">
                        <div>
                            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
                                ⚠️ {t('tenants.pages.show.danger_zone')}
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                {t('tenants.pages.show.danger_zone_hint')}
                            </p>
                        </div>

                        <div className="max-w-md space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                {t('tenants.fields.confirm_name', { name: tenant.name })}
                            </label>
                            <input
                                className={inputClass}
                                value={deleteForm.data.confirm_name}
                                onChange={(e) => deleteForm.setData('confirm_name', e.target.value)}
                                placeholder={tenant.name}
                            />
                            {deleteForm.errors.confirm_name && <p className="text-xs text-rose-500">{deleteForm.errors.confirm_name}</p>}
                        </div>

                        <PrimaryButton
                            type="submit"
                            disabled={!canDelete || deleteForm.processing}
                            className="!bg-rose-600 hover:!bg-rose-700 !rounded-xl text-xs"
                        >
                            {t('tenants.actions.delete_permanently')}
                        </PrimaryButton>
                    </form>
                )}
            </div>
        </DynamicLayout>
    );
}


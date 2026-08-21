import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ModuleTier = 'vertical' | 'foundation' | 'content';

interface PlanRow {
    id: number;
    key: string;
    name: string;
    description: string | null;
    badge?: string | null;
    is_popular?: boolean;
    is_active: boolean;
    modules: string[];
    limits?: {
        max_vehicles?: number | null;
        max_users?: number | null;
        max_branches?: number | null;
    } | null;
    features_list?: string[] | null;
    sort_order: number;
    is_default: boolean;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    annual_original_price: string | null;
    currency: string;
    trial_days?: number | null;
    tenants: number;
}

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    tier: ModuleTier;
    is_enabled: boolean;
    requires?: string[];
}

interface Props {
    plans: PlanRow[];
    availableModules: AvailableModule[];
}

const TIER_BADGES: Record<ModuleTier, { bg: string; text: string; label: string }> = {
    vertical: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', label: 'Vertical' },
    foundation: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400', label: 'Foundation' },
    content: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Content' },
};

const fmtPrice = (amount: string | null, currency: string): string => {
    if (!amount || Number(amount) === 0) return '—';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
        Number(amount),
    );
};

export default function Index({ plans, availableModules }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [deleting, setDeleting] = useState<PlanRow | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const deleteForm = useForm({});

    const totalTenantsEnrolled = useMemo(
        () => plans.reduce((acc, p) => acc + (p.tenants || 0), 0),
        [plans],
    );

    const defaultPlan = useMemo(() => plans.find((p) => p.is_default), [plans]);

    const destroy = (): void => {
        if (!deleting) return;

        deleteForm.delete(route('module.plans.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('plans.title')} />}>
            <Head title={t('plans.title')} />

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

                {/* Hero Overview Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 border border-indigo-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {t('plans.stats.available_plans')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {plans.length}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('plans.stats.available_plans_hint')}
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 border border-emerald-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {t('plans.stats.total_tenants')}
                        </div>
                        <div className="mt-2 text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {totalTenantsEnrolled}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('plans.stats.total_tenants_hint')}
                        </p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent p-5 border border-sky-500/15 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                            {t('plans.stats.default_fallback')}
                        </div>
                        <div className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                            {defaultPlan ? defaultPlan.name : t('plans.stats.none')}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t('plans.stats.default_fallback_hint')}
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            {t('plans.header.title')}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {t('plans.header.subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Grid / Table Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`rounded-lg px-2.5 py-1.5 transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                田 Grid
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`rounded-lg px-2.5 py-1.5 transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                ☰ Table
                            </button>
                        </div>
                        <Link href={route('module.plans.create')}>
                            <PrimaryButton className="!rounded-xl shadow-sm">
                                + {t('plans.pages.index.new')}
                            </PrimaryButton>
                        </Link>
                    </div>
                </div>

                {/* View Toggle - Grid or Table */}
                {viewMode === 'grid' ? (
                    /* Pricing Cards Grid */
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                        const hasMonthly = plan.price && Number(plan.price) > 0;
                        const hasAnnual = plan.annual_price && Number(plan.annual_price) > 0;
                        const savingsPercent =
                            hasMonthly && hasAnnual
                                ? Math.round((1 - Number(plan.annual_price) / (Number(plan.price) * 12)) * 100)
                                : 0;

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-200 ${
                                    !plan.is_active ? 'opacity-60 saturate-50' : ''
                                } ${
                                    plan.is_popular
                                        ? 'border-teal-500/50 bg-white dark:bg-slate-900 shadow-lg ring-2 ring-teal-500/20'
                                        : plan.is_default
                                          ? 'bg-gradient-to-b from-indigo-500/5 via-white to-white dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900 border-indigo-500/40 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-500/20'
                                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div>
                                    {/* Header & Badges */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {plan.name}
                                                </h3>
                                                <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {plan.key}
                                                </span>
                                                {plan.badge && (
                                                    <span className="rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 px-2 py-0.5 text-[10px] font-bold">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                    {plan.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {!plan.is_active && (
                                                <span className="rounded-full bg-slate-500 text-white px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                                                    Nonaktif
                                                </span>
                                            )}
                                            {plan.is_default && (
                                                <span className="rounded-full bg-indigo-500 text-white px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                                                    {t('plans.pages.index.default_badge')}
                                                </span>
                                            )}
                                            {plan.is_popular && (
                                                <span className="rounded-full bg-teal-600 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                    Populer
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Limits Bar */}
                                    {(plan.limits?.max_vehicles !== undefined || plan.limits?.max_users !== undefined) && (
                                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <span>
                                                🚗 {plan.limits?.max_vehicles ? `${plan.limits.max_vehicles} Armada` : 'Unlimited Armada'}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                👥 {plan.limits?.max_users ? `${plan.limits.max_users} Staf` : 'Unlimited Staf'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Pricing Banner */}
                                    <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800">
                                        {hasMonthly ? (
                                            <div>
                                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    {t('plans.billing.monthly')}
                                                </div>
                                                <div className="mt-0.5 flex items-baseline gap-2">
                                                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                                        {fmtPrice(plan.price, plan.currency)}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{t('plans.billing.per_month')}</span>
                                                    {plan.original_price && Number(plan.original_price) > 0 && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {fmtPrice(plan.original_price, plan.currency)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-medium">{t('plans.billing.monthly_not_set')}</span>
                                        )}

                                        {hasAnnual && (
                                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                        {t('plans.billing.annual')}
                                                    </span>
                                                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                        {fmtPrice(plan.annual_price, plan.currency)} <span className="text-[10px] font-normal text-slate-400">{t('plans.billing.per_year')}</span>
                                                    </div>
                                                </div>
                                                {savingsPercent > 0 && (
                                                    <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-bold">
                                                        {t('plans.billing.save_percent', { percent: savingsPercent })}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Included Modules Pill List */}
                                    <div className="mt-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {t('plans.billing.modules_covered', { count: plan.modules.length })}
                                            </span>
                                        </div>

                                        {plan.modules.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">{t('plans.billing.no_modules_allocated')}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                {plan.modules.map((key) => {
                                                    const module = availableModules.find((m) => m.key === key);
                                                    const disabled = module?.is_enabled === false;
                                                    const badgeTheme = module?.tier ? TIER_BADGES[module.tier] : { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Core' };

                                                    return (
                                                        <span
                                                            key={key}
                                                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border ${
                                                                disabled
                                                                    ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                                                    : `${badgeTheme.bg} ${badgeTheme.text} border-transparent`
                                                            }`}
                                                            title={disabled ? t('plans.pages.index.module_disabled_title') : module?.description}
                                                        >
                                                            {module?.label ?? key}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer & Action Buttons */}
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">
                                        👥 {t('plans.billing.tenants_enrolled', { count: plan.tenants })}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <Link href={route('module.plans.edit', plan.id)}>
                                            <SecondaryButton className="!rounded-xl text-xs">
                                                {t('common.edit')}
                                            </SecondaryButton>
                                        </Link>
                                        <SecondaryButton
                                            disabled={plan.tenants > 0 || plan.is_default}
                                            onClick={() => setDeleting(plan)}
                                            className="!rounded-xl text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
                                        >
                                            {t('common.delete')}
                                        </SecondaryButton>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        <th className="px-6 py-3 text-left">Name</th>
                                        <th className="px-6 py-3 text-left">Key</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Price</th>
                                        <th className="px-6 py-3 text-center">Tenants</th>
                                        <th className="px-6 py-3 text-center">Modules</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                    {plans.map((plan) => (
                                        <tr
                                            key={plan.id}
                                            className={`text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                                !plan.is_active ? 'opacity-60' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {plan.name}
                                                        </div>
                                                        {plan.description && (
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                                                {plan.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                    {plan.key}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    {plan.is_default && (
                                                        <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-xs font-bold border border-indigo-500/20">
                                                            Default
                                                        </span>
                                                    )}
                                                    {!plan.is_active && (
                                                        <span className="rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-xs font-bold border border-slate-500/20">
                                                            Inactive
                                                        </span>
                                                    )}
                                                    {plan.is_active && !plan.is_default && (
                                                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-xs font-bold border border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {fmtPrice(plan.price, plan.currency)}
                                                </div>
                                                {plan.original_price && Number(plan.original_price) > 0 && (
                                                    <div className="text-xs text-slate-400 line-through">
                                                        {fmtPrice(plan.original_price, plan.currency)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                                                    {plan.tenants}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                    {plan.modules.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={route('module.plans.edit', plan.id)}>
                                                        <SecondaryButton className="!rounded-lg text-xs px-3 py-1.5">
                                                            Edit
                                                        </SecondaryButton>
                                                    </Link>
                                                    <SecondaryButton
                                                        disabled={plan.tenants > 0 || plan.is_default}
                                                        onClick={() => setDeleting(plan)}
                                                        className="!rounded-lg text-xs px-3 py-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400"
                                                    >
                                                        Delete
                                                    </SecondaryButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDeleteDialog
                show={deleting !== null}
                title={t('plans.pages.index.delete_title', { name: deleting?.name ?? '' })}
                message={t('plans.pages.index.delete_message')}
                confirmText={t('plans.actions.delete_confirm')}
                processing={deleteForm.processing}
                onClose={() => setDeleting(null)}
                onConfirm={destroy}
            />
        </DynamicLayout>
    );
}


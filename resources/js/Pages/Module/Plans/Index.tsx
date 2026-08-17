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
    modules: string[];
    sort_order: number;
    is_default: boolean;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    annual_original_price: string | null;
    currency: string;
    tenants: number;
}

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    tier: ModuleTier;
    is_enabled: boolean;
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
                    <Link href={route('module.plans.create')}>
                        <PrimaryButton className="!rounded-xl shadow-sm">
                            + {t('plans.pages.index.new')}
                        </PrimaryButton>
                    </Link>
                </div>

                {/* Pricing Cards Grid */}
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
                                    plan.is_default
                                        ? 'bg-gradient-to-b from-indigo-500/5 via-white to-white dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900 border-indigo-500/40 dark:border-indigo-500/30 shadow-md ring-1 ring-indigo-500/20'
                                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div>
                                    {/* Header & Badges */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {plan.name}
                                                </h3>
                                                <span className="font-mono text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {plan.key}
                                                </span>
                                            </div>
                                            {plan.description && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                    {plan.description}
                                                </p>
                                            )}
                                        </div>

                                        {plan.is_default && (
                                            <span className="shrink-0 rounded-full bg-indigo-500 text-white px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                                                {t('plans.pages.index.default_badge')}
                                            </span>
                                        )}
                                    </div>

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


import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    interval: string;
    modules: string[];
}

interface Props {
    tenant: {
        id: string;
        name: string;
        status: string;
        trial_ends_at: string | null;
        is_on_trial: boolean;
    };
    plans: PlanOption[];
    subscription: { id: number; status: string } | null;
    trialEndsAt: string | null;
    isOnTrial: boolean;
    settings?: Record<string, string>;
}

export default function SubscriptionActivate({
    tenant,
    plans,
    subscription,
    trialEndsAt,
    isOnTrial,
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();
    const page = usePage().props as { settings?: Record<string, string> };

    const pageSettings = settings ?? page.settings;
    const siteName = pageSettings?.['general.site_name'] || DEFAULT_SITE_NAME;

    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
    });

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === Number(data.plan_id)),
        [plans, data.plan_id],
    );

    const trialDate = trialEndsAt ? new Date(trialEndsAt) : null;
    const daysLeft = trialDate
        ? Math.max(0, Math.ceil((trialDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    const submit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (!data.plan_id) return;
        post(route('central.subscription.activate', tenant.id));
    };

    const formatPrice = (price: string): string => {
        const num = Number(price);
        if (num === 0) return 'Free';
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
            <Head title={t('central.subscription.title')} />

            <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <a href={route('central.workspaces.index')} className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-sm shadow-teal-600/20">
                            <span className="material-symbols-outlined text-[20px]">hub</span>
                        </span>
                        <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900">
                            {siteName}
                        </span>
                    </a>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitcher
                            compact
                            className="bg-slate-100 [&_button]:text-slate-500 [&_button.bg-white]:text-teal-800"
                        />
                    </div>
                </div>
            </header>

            <main className="relative isolate flex-1 overflow-hidden bg-slate-50">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
                    <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                </div>

                <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mb-10">
                        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                            {siteName}
                        </p>
                        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            {t('central.subscription.headline')}
                        </h1>
                        <p className="mt-3 text-base text-slate-600">
                            {t('central.subscription.subtitle', { name: tenant.name })}
                        </p>
                    </div>

                    {(isOnTrial || (subscription && subscription.status === 'active')) && (
                        <div className="mb-8 rounded-2xl border border-cyan-200/80 bg-cyan-50/90 p-6 shadow-sm shadow-cyan-200/60 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                    <span className="material-symbols-outlined text-2xl">new_releases</span>
                                </span>
                                <div>
                                    <p className="font-semibold text-cyan-900">
                                        {isOnTrial
                                            ? t('central.subscription.trial_info', { days: String(daysLeft), date: trialDate?.toLocaleDateString() ?? '' })
                                            : t('central.subscription.current_plan')}
                                    </p>
                                    {isOnTrial && (
                                        <p className="mt-1 text-sm text-cyan-700">
                                            {t('central.trial.days_left', { days: String(daysLeft) })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isOnTrial && !subscription && (
                        <div className="mb-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm shadow-amber-200/60 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                    <span className="material-symbols-outlined text-2xl">warning</span>
                                </span>
                                <div>
                                    <p className="font-semibold text-amber-900">
                                        {t('central.subscription.trial_expired')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                {t('central.subscription.select_plan')}
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {plans.map((plan) => {
                                    const isSelected = data.plan_id === String(plan.id);
                                    const price = formatPrice(plan.price);
                                    const moduleCount = plan.modules?.length ?? 0;

                                    return (
                                        <label
                                            key={plan.id}
                                            className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                                                isSelected
                                                    ? 'border-teal-500 bg-teal-50/80 shadow-md shadow-teal-700/10'
                                                    : 'border-slate-200 bg-white/90 hover:border-teal-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="plan_id"
                                                value={plan.id}
                                                checked={isSelected}
                                                onChange={(e) => setData('plan_id', e.target.value)}
                                                className="sr-only"
                                            />

                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-display text-lg font-bold text-slate-900">
                                                        {plan.name}
                                                    </p>
                                                    <p className="mt-1 text-2xl font-extrabold text-teal-700">
                                                        {price}
                                                        <span className="text-sm font-semibold text-slate-500">
                                                            {t('central.subscription.month')}
                                                        </span>
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white">
                                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-[18px] text-teal-600">
                                                        widgets
                                                    </span>
                                                    {t('central.subscription.modules_included', { count: String(moduleCount) })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-[18px] text-teal-600">
                                                        support_agent
                                                    </span>
                                                    {t('central.subscription.support')}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.plan_id && (
                                <p className="mt-2 text-sm text-red-600">{errors.plan_id}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={processing || !data.plan_id}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {processing
                                    ? t('central.subscription.activating')
                                    : t('central.subscription.activate_button')}
                            </button>

                            <Link
                                href={route('central.workspaces.index')}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                            >
                                {t('central.subscription.back_workspaces')}
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

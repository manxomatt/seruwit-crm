import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface PlanOption {
    key: string;
    label: string;
    description: string;
    modules: string[];
    price: number;
}

interface Props {
    tenantBaseDomain: string;
    plans: PlanOption[];
    defaultPlan: string | null;
    isReseller: boolean;
}

const BuildingOfficeIcon = () => (
    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const UserCircleIcon = () => (
    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const SparklesIcon = () => (
    <svg className="h-5 w-5 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const GlobeAltIcon = () => (
    <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const LockClosedIcon = () => (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

function FieldGroup({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {label}
            </label>
            {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
        </div>
    );
}

const inputCls =
    'block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500';

const slugify = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
};

export default function Create({ tenantBaseDomain, plans, defaultPlan, isReseller }: Props): JSX.Element {
    const { t } = useTrans();
    const [subdomainTouched, setSubdomainTouched] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        company_name: '',
        subdomain: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
        plan: defaultPlan ?? plans[0]?.key ?? '',
    });

    const handleCompanyNameChange = (val: string) => {
        setData((prev) => ({
            ...prev,
            company_name: val,
            subdomain: subdomainTouched ? prev.subdomain : slugify(val),
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.tenants.store'));
    };

    const fullDomainPreview = data.subdomain
        ? `${data.subdomain}.${tenantBaseDomain}`
        : `subdomain.${tenantBaseDomain}`;

    const selectedPlan = plans.find((plan) => plan.key === data.plan);

    const companyInitial = data.company_name
        ? data.company_name.charAt(0).toUpperCase()
        : 'T';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tenants.pages.create.title')}
                    actions={
                        <Link href={route('module.tenants.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">
                                ← {t('common.cancel')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('tenants.pages.create.head')} />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-12">

                    {/* ── Left Column: Form Fields (7 cols) ── */}
                    <div className="space-y-6 lg:col-span-7">

                        {/* Workspace Info Card */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20">
                                    <BuildingOfficeIcon />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('tenants.pages.create.workspace_section')}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {t('tenants.pages.create.workspace_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-5">
                                <FieldGroup
                                    label={t('tenants.fields.company_name')}
                                    error={errors.company_name}
                                >
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={data.company_name}
                                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                                        placeholder="PT Maju Bersama Sejahtera"
                                        autoFocus
                                        required
                                    />
                                </FieldGroup>

                                <FieldGroup
                                    label={t('tenants.fields.subdomain')}
                                    error={errors.subdomain}
                                >
                                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                                        <input
                                            type="text"
                                            className="min-w-0 flex-1 border-0 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 dark:bg-slate-900 dark:text-white"
                                            value={data.subdomain}
                                            onChange={(e) => {
                                                setSubdomainTouched(true);
                                                setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                            }}
                                            placeholder="maju-bersama"
                                            required
                                        />
                                        <span className="flex items-center bg-slate-100 dark:bg-slate-800 px-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200/80 dark:border-slate-800">
                                            .{tenantBaseDomain}
                                        </span>
                                    </div>
                                </FieldGroup>
                            </div>
                        </div>

                        {/* Owner Credentials Card */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 dark:bg-purple-500/20">
                                    <UserCircleIcon />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('tenants.pages.create.owner_section')}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {t('tenants.pages.create.owner_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-5">
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
                                            placeholder="••••••••"
                                        />
                                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                                            <LockClosedIcon />
                                        </span>
                                    </div>
                                </FieldGroup>
                            </div>
                        </div>

                        {/* Subscription Plan Card */}
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 dark:bg-amber-500/20">
                                    <SparklesIcon />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('tenants.pages.create.plan_section')}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {t('tenants.pages.create.plan_hint')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {plans.map((plan) => {
                                    const isSelected = data.plan === plan.key;

                                    return (
                                        <label
                                            key={plan.key}
                                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                                                isSelected
                                                    ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                                                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="plan"
                                                className="mt-0.5 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                value={plan.key}
                                                checked={isSelected}
                                                onChange={() => setData('plan', plan.key)}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {plan.label}
                                                    </span>
                                                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                        {t('tenants.pages.create.plan_modules_count', { count: plan.modules.length })}
                                                    </span>
                                                    {plan.key === defaultPlan && (
                                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                            {t('tenants.pages.create.plan_default_badge')}
                                                        </span>
                                                    )}
                                                </span>
                                                {plan.description && (
                                                    <span className="mt-0.5 block text-xs text-slate-500">
                                                        {plan.description}
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            {errors.plan && (
                                <p className="mt-3 text-xs font-semibold text-rose-500">{errors.plan}</p>
                            )}

                            {isReseller && (selectedPlan?.price ?? 0) > 0 && (
                                <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                    {t('tenants.pages.create.reseller_paid_plan_notice', { plan: selectedPlan?.label ?? '' })}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Right Column: Live Workspace Preview Card (5 cols) ── */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    👁️ {t('tenants.pages.create.preview_title')}
                                </h3>
                                <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[10px] font-bold">
                                    {t('tenants.pages.create.preview_auto_provision')}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500">
                                {t('tenants.pages.create.preview_hint')}
                            </p>

                            {/* Card Graphic */}
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-indigo-500/5 via-white to-white dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900 p-5 shadow-inner space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xl shadow-md">
                                            {companyInitial}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                {data.company_name || t('tenants.pages.create.preview_placeholder_name')}
                                            </h4>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                                                <GlobeAltIcon />
                                                <span className="truncate">https://{fullDomainPreview}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                        {t('tenants.status.active')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800">
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        {t('tenants.fields.plan')}
                                    </div>
                                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        {selectedPlan?.label ?? t('tenants.pages.create.plan_none')}
                                    </span>
                                </div>

                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Administrator
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold">👤</span>
                                        <span className="truncate">{data.owner_name || 'Budi Santoso'}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 truncate pl-8">
                                        {data.owner_email || 'budi@majubersama.com'}
                                    </div>
                                </div>
                            </div>

                            {/* Submit & Cancel Actions */}
                            <div className="pt-2 flex items-center gap-3">
                                <Link href={route('module.tenants.index')} className="w-1/2">
                                    <SecondaryButton type="button" className="w-full justify-center !rounded-xl text-xs">
                                        {t('common.cancel')}
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton type="submit" disabled={processing} className="w-1/2 justify-center !rounded-xl text-xs shadow-sm">
                                    {processing ? '...' : t('tenants.pages.create.submit')}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </DynamicLayout>
    );
}


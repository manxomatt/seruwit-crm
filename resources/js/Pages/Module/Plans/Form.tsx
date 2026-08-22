import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select, { SelectOption } from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ModuleTier = 'vertical' | 'foundation' | 'content';

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    tier: ModuleTier;
    is_enabled: boolean;
    requires?: string[];
}

export interface PlanLimits {
    max_vehicles?: number | null;
    max_users?: number | null;
    max_branches?: number | null;
    [key: string]: any;
}

export interface PlanFormData {
    id?: number;
    key: string;
    name: string;
    description: string | null;
    badge?: string | null;
    is_popular?: boolean;
    is_active?: boolean;
    modules: string[];
    limits?: PlanLimits | null;
    features_list?: string[] | null;
    sort_order: number;
    is_default: boolean;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    annual_original_price: string | null;
    currency: string;
    trial_days: number | null;
    tenants?: number;
}

interface SubscriptionTier {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: number;
}

interface PlanFormProps {
    initialData: PlanFormData;
    availableModules: AvailableModule[];
    subscriptionTiers?: SubscriptionTier[];
    isEdit?: boolean;
}

const TIER_ORDER: ModuleTier[] = ['vertical', 'foundation', 'content'];

const TIER_BADGES: Record<ModuleTier, { bg: string; text: string }> = {
    vertical: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
    foundation: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
    content: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
};

const CURRENCY_OPTIONS: SelectOption[] = [
    { value: 'IDR', label: 'IDR — Rupiah' },
    { value: 'USD', label: 'USD — US Dollar' },
    { value: 'SGD', label: 'SGD — Singapore Dollar' },
    { value: 'MYR', label: 'MYR — Ringgit' },
];

const inputClass =
    'mt-1 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 dark:text-white';

const fmtPrice = (amount: string | null, currency: string): string => {
    if (!amount || Number(amount) === 0) return '—';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
        Number(amount),
    );
};

function PriceInput({
    label,
    hint,
    value,
    onChange,
    currency,
    error,
}: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    currency: string;
    error?: string;
}) {
    return (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {hint && <span className="ml-1 text-[11px] font-normal text-slate-400">({hint})</span>}
            <div className="mt-1.5 flex rounded-xl shadow-sm">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-3.5 text-xs font-medium text-slate-500">
                    {currency}
                </span>
                <input
                    type="number"
                    min="0"
                    step="1000"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-r-xl border border-slate-200 dark:border-slate-800 py-2 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
            </div>
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        </label>
    );
}

export default function PlanForm({ initialData, availableModules, subscriptionTiers = [], isEdit = false }: PlanFormProps): JSX.Element {
    const { t } = useTrans();
    const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'limits' | 'modules'>('info');
    const [moduleSearch, setModuleSearch] = useState('');
    const [newFeatureText, setNewFeatureText] = useState('');

    const form = useForm({
        key: initialData.key || '',
        name: initialData.name || '',
        description: initialData.description ?? '',
        badge: initialData.badge ?? '',
        is_popular: initialData.is_popular ?? false,
        is_active: initialData.is_active ?? true,
        modules: initialData.modules ?? [],
        limits: {
            max_vehicles: initialData.limits?.max_vehicles ?? null,
            max_users: initialData.limits?.max_users ?? null,
            max_branches: initialData.limits?.max_branches ?? null,
        },
        features_list: initialData.features_list ?? [],
        sort_order: initialData.sort_order ?? 0,
        is_default: initialData.is_default ?? false,
        price: initialData.price ? String(Number(initialData.price)) : '',
        original_price: initialData.original_price ? String(Number(initialData.original_price)) : '',
        annual_price: initialData.annual_price ? String(Number(initialData.annual_price)) : '',
        annual_original_price: initialData.annual_original_price ? String(Number(initialData.annual_original_price)) : '',
        currency: initialData.currency ?? 'IDR',
        trial_days: initialData.trial_days ?? 0,
        pricing_model: (initialData as any).pricing_model ?? 'fixed',
        subscription_tier_id: (initialData as any).subscription_tier_id ?? null,
        allow_payg_upgrade: (initialData as any).allow_payg_upgrade ?? true,
        include_trial: (initialData as any).include_trial ?? true,
        trial_duration_days: (initialData as any).trial_duration_days ?? 30,
    });

    const toggleModule = (key: string): void => {
        form.setData(
            'modules',
            form.data.modules.includes(key)
                ? form.data.modules.filter((m) => m !== key)
                : [...form.data.modules, key],
        );
    };

    const selectableKeys = useMemo(
        () => availableModules.filter((m) => m.is_enabled).map((m) => m.key),
        [availableModules],
    );

    const selectAll = (): void => {
        const merged = new Set([...form.data.modules, ...selectableKeys]);
        form.setData('modules', Array.from(merged));
    };

    const clearAll = (): void => {
        const locked = availableModules.filter((m) => !m.is_enabled).map((m) => m.key);
        form.setData(
            'modules',
            form.data.modules.filter((key) => locked.includes(key)),
        );
    };

    const addFeatureItem = (): void => {
        const trimmed = newFeatureText.trim();
        if (!trimmed) return;
        if (!form.data.features_list.includes(trimmed)) {
            form.setData('features_list', [...form.data.features_list, trimmed]);
        }
        setNewFeatureText('');
    };

    const removeFeatureItem = (index: number): void => {
        form.setData(
            'features_list',
            form.data.features_list.filter((_, i) => i !== index),
        );
    };

    const query = moduleSearch.trim().toLowerCase();

    const moduleLabelMap = useMemo(() => {
        const map = new Map<string, string>();
        availableModules.forEach((m) => map.set(m.key, m.label));
        return map;
    }, [availableModules]);

    const groupedModules = useMemo(() => {
        const matches = availableModules.filter(
            (module) =>
                query === '' ||
                module.label.toLowerCase().includes(query) ||
                module.key.toLowerCase().includes(query) ||
                module.description.toLowerCase().includes(query),
        );

        return TIER_ORDER.map((tier) => ({
            tier,
            modules: matches.filter((module) => module.tier === tier),
        })).filter((group) => group.modules.length > 0);
    }, [availableModules, query]);

    const submit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (isEdit && initialData.id) {
            form.patch(route('module.plans.update', initialData.id));
        } else {
            form.post(route('module.plans.store'));
        }
    };

    const hasMonthly = form.data.price && Number(form.data.price) > 0;
    const hasAnnual = form.data.annual_price && Number(form.data.annual_price) > 0;
    const savingsPercent =
        hasMonthly && hasAnnual
            ? Math.round((1 - Number(form.data.annual_price) / (Number(form.data.price) * 12)) * 100)
            : 0;

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Side: Main Form Card */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        {/* Tab Switcher Header */}
                        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-2 gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 min-w-[120px] rounded-2xl py-2.5 text-xs font-bold transition-all ${
                                    activeTab === 'info'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('plans.tabs.main_info')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('pricing')}
                                className={`flex-1 min-w-[120px] rounded-2xl py-2.5 text-xs font-bold transition-all ${
                                    activeTab === 'pricing'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('plans.tabs.pricing')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('limits')}
                                className={`flex-1 min-w-[120px] rounded-2xl py-2.5 text-xs font-bold transition-all ${
                                    activeTab === 'limits'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('plans.tabs.limits')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('modules')}
                                className={`flex-1 min-w-[120px] rounded-2xl py-2.5 text-xs font-bold transition-all ${
                                    activeTab === 'modules'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('plans.tabs.modules', { count: form.data.modules.length })}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Tab 1: Info Utama */}
                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                        {t('plans.tabs.main_info')}
                                    </h3>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t('plans.fields.name')}
                                            <input
                                                className={inputClass}
                                                value={form.data.name}
                                                onChange={(e) => form.setData('name', e.target.value)}
                                                required
                                                placeholder={t('plans.fields.name_placeholder')}
                                            />
                                            {form.errors.name && <p className="mt-1 text-xs text-rose-500">{form.errors.name}</p>}
                                        </label>

                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t('plans.fields.key')}
                                            <input
                                                className={`${inputClass} font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800`}
                                                value={form.data.key}
                                                onChange={(e) => form.setData('key', e.target.value.toLowerCase())}
                                                disabled={isEdit}
                                                placeholder="rental-starter"
                                                required
                                            />
                                            {form.errors.key && <p className="mt-1 text-xs text-rose-500">{form.errors.key}</p>}
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {isEdit ? t('plans.fields.key_hint_locked') : t('plans.fields.key_hint_new')}
                                            </p>
                                        </label>

                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t('plans.fields.badge')}
                                            <input
                                                className={inputClass}
                                                value={form.data.badge}
                                                onChange={(e) => form.setData('badge', e.target.value)}
                                                placeholder={t('plans.fields.badge_placeholder')}
                                            />
                                            {form.errors.badge && <p className="mt-1 text-xs text-rose-500">{form.errors.badge}</p>}
                                        </label>

                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t('plans.fields.sort_order')}
                                            <input
                                                type="number"
                                                min={0}
                                                className={inputClass}
                                                value={form.data.sort_order}
                                                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                            />
                                        </label>

                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
                                            {t('plans.fields.description')}
                                            <textarea
                                                rows={3}
                                                className={`${inputClass} resize-none`}
                                                value={form.data.description}
                                                onChange={(e) => form.setData('description', e.target.value)}
                                                placeholder={t('plans.fields.description_placeholder')}
                                            />
                                            {form.errors.description && (
                                                <p className="mt-1 text-xs text-rose-500">{form.errors.description}</p>
                                            )}
                                        </label>

                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {t('plans.fields.trial_days')}
                                            <span className="ml-1 text-[11px] font-normal text-slate-400">
                                                ({t('plans.fields.trial_days_hint')})
                                            </span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={365}
                                                className={inputClass}
                                                value={form.data.trial_days}
                                                onChange={(e) => form.setData('trial_days', Number(e.target.value))}
                                            />
                                            {form.errors.trial_days && (
                                                <p className="mt-1 text-xs text-rose-500">{form.errors.trial_days}</p>
                                            )}
                                        </label>

                                        <div className="space-y-3 pt-2">
                                            <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={form.data.is_popular}
                                                    onChange={(e) => form.setData('is_popular', e.target.checked)}
                                                />
                                                <span>
                                                    <span className="font-semibold block">{t('plans.fields.is_popular')}</span>
                                                    <span className="text-[11px] text-slate-400">{t('plans.fields.is_popular_hint')}</span>
                                                </span>
                                            </label>

                                            <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={form.data.is_default}
                                                    onChange={(e) => form.setData('is_default', e.target.checked)}
                                                />
                                                <span>
                                                    <span className="font-semibold block">{t('plans.fields.is_default')}</span>
                                                    <span className="text-[11px] text-slate-400">{t('plans.fields.is_default_hint')}</span>
                                                </span>
                                            </label>

                                            {/* Active / Inactive toggle */}
                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3">
                                                <span className="text-xs text-slate-700 dark:text-slate-300">
                                                    <span className="font-semibold block">Status Plan</span>
                                                    <span className="text-[11px] text-slate-400">
                                                        Plan non-aktif tidak akan ditampilkan ke tenant.
                                                    </span>
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={form.data.is_active}
                                                    onClick={() => form.setData('is_active', !form.data.is_active)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                                        form.data.is_active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                            form.data.is_active ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                            <p className={`text-[11px] font-semibold ${form.data.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                {form.data.is_active ? '✓ Plan Aktif' : '— Plan Tidak Aktif'}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Pricing */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-4">
                                    {/* Pricing Model Selection */}
                                    <div className="space-y-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pricing Model</h3>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pricing_model"
                                                    value="fixed"
                                                    checked={form.data.pricing_model === 'fixed'}
                                                    onChange={(e) => form.setData('pricing_model', e.target.value)}
                                                    className="rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Fixed Pricing</p>
                                                    <p className="text-[11px] text-slate-500">Monthly/Annual flat fee</p>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="pricing_model"
                                                    value="payg"
                                                    checked={form.data.pricing_model === 'payg'}
                                                    onChange={(e) => form.setData('pricing_model', e.target.value)}
                                                    className="rounded-full border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-slate-900 dark:text-white">PAYG (Vehicle-Based)</p>
                                                    <p className="text-[11px] text-slate-500">Price per vehicle using tiers</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('plans.form.currency_title')}</h3>
                                        <Select
                                            value={form.data.currency}
                                            onChange={(v) => form.setData('currency', v)}
                                            options={CURRENCY_OPTIONS}
                                            searchable={false}
                                            className="w-52"
                                        />
                                    </div>

                                    {form.data.pricing_model === 'fixed' ? (
                                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-5">
                                            {/* Monthly */}
                                            <div>
                                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                                    {t('plans.form.monthly_section')}
                                                </p>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <PriceInput
                                                        label={t('plans.form.monthly_normal')}
                                                        hint={t('plans.form.hint_paid')}
                                                        value={form.data.price}
                                                        onChange={(v) => form.setData('price', v)}
                                                        currency={form.data.currency}
                                                        error={form.errors.price}
                                                    />
                                                    <PriceInput
                                                        label={t('plans.form.monthly_original')}
                                                        hint={t('plans.form.hint_original')}
                                                        value={form.data.original_price}
                                                        onChange={(v) => form.setData('original_price', v)}
                                                        currency={form.data.currency}
                                                        error={form.errors.original_price}
                                                    />
                                                </div>
                                            </div>

                                            {/* Annual */}
                                            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                                    {t('plans.form.annual_section')}
                                                </p>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <PriceInput
                                                        label={t('plans.form.annual_normal')}
                                                        hint={t('plans.form.hint_annual_paid')}
                                                        value={form.data.annual_price}
                                                        onChange={(v) => form.setData('annual_price', v)}
                                                        currency={form.data.currency}
                                                        error={form.errors.annual_price}
                                                    />
                                                    <PriceInput
                                                        label={t('plans.form.annual_original')}
                                                        hint={t('plans.form.hint_original')}
                                                        value={form.data.annual_original_price}
                                                        onChange={(v) => form.setData('annual_original_price', v)}
                                                        currency={form.data.currency}
                                                        error={form.errors.annual_original_price}
                                                    />
                                                </div>
                                            </div>

                                            {/* Preview Diskon */}
                                            {savingsPercent > 0 && (
                                                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                                                    🎉 {t('plans.billing.annual_savings_note', { percent: savingsPercent })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-5">
                                            {/* PAYG Tier Reference (read-only volume ladder) */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        Subscription Tier Pricing
                                                    </label>
                                                    <a
                                                        href="/module/subscription-tiers"
                                                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                    >
                                                        Manage tiers →
                                                    </a>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                    Price is applied automatically based on the tenant's requested vehicle quota — no tier selection needed.
                                                </p>
                                                {subscriptionTiers.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {subscriptionTiers.map((tier) => (
                                                            <div key={tier.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                                                <div className="text-xs">
                                                                    <p className="font-semibold text-slate-900 dark:text-white">{tier.name}</p>
                                                                    <p className="text-slate-500 dark:text-slate-400">
                                                                        {tier.min_vehicles}-{tier.max_vehicles > 100000 ? '∞' : tier.max_vehicles} vehicles
                                                                    </p>
                                                                </div>
                                                                <span className="shrink-0 rounded-md bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                                                                    Rp {(tier.price_per_vehicle / 1000).toLocaleString('id-ID')}k
                                                                    <span className="font-normal text-slate-400 dark:text-slate-500"> /vehicle</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/20 p-4">
                                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                                            ⚠️ No subscription tiers available. <a href="/module/subscription-tiers/create" className="font-semibold underline">Create one first</a>.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* PAYG Features */}
                                            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3">
                                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">PAYG Features</h4>
                                                <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={form.data.allow_payg_upgrade}
                                                        onChange={(e) => form.setData('allow_payg_upgrade', e.target.checked)}
                                                    />
                                                    <span>
                                                        <span className="font-semibold block">Allow Mid-Period Upgrades</span>
                                                        <span className="text-[11px] text-slate-400">Tenants can upgrade vehicle quota anytime with pro-rated billing</span>
                                                    </span>
                                                </label>

                                                <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-300">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={form.data.include_trial}
                                                        onChange={(e) => form.setData('include_trial', e.target.checked)}
                                                    />
                                                    <span>
                                                        <span className="font-semibold block">Include Trial Period</span>
                                                        <span className="text-[11px] text-slate-400">Offer free trial with unlimited vehicles</span>
                                                    </span>
                                                </label>

                                                {form.data.include_trial && (
                                                    <div className="ml-6 pt-2">
                                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                            Trial Duration (days)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={365}
                                                            value={form.data.trial_duration_days}
                                                            onChange={(e) => form.setData('trial_duration_days', Number(e.target.value))}
                                                            className={inputClass}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-xs text-blue-700 dark:text-blue-400">
                                                💡 PAYG plans charge tenants based on the number of vehicles they register. The matching tier — and its per-vehicle price — is applied automatically from the quota.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab 3: Limits & Kuota */}
                            {activeTab === 'limits' && (
                                <div className="space-y-5">
                                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('plans.tabs.limits')}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Konfigurasikan batasan kuota kapasitas armada, pengguna, serta poin fitur marketing.</p>
                                    </div>

                                    {/* Resource Limits */}
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                            Batasan Kapasitas Sumber Daya (Resource Quotas)
                                        </p>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                🚗 {t('plans.fields.max_vehicles')}
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={inputClass}
                                                    value={form.data.limits.max_vehicles ?? ''}
                                                    onChange={(e) =>
                                                        form.setData('limits', {
                                                            ...form.data.limits,
                                                            max_vehicles: e.target.value === '' ? null : Number(e.target.value),
                                                        })
                                                    }
                                                    placeholder="0 (Unlimited)"
                                                />
                                                <span className="mt-1 block text-[11px] font-normal text-slate-400">
                                                    {t('plans.fields.max_vehicles_hint')}
                                                </span>
                                            </label>

                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                👥 {t('plans.fields.max_users')}
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={inputClass}
                                                    value={form.data.limits.max_users ?? ''}
                                                    onChange={(e) =>
                                                        form.setData('limits', {
                                                            ...form.data.limits,
                                                            max_users: e.target.value === '' ? null : Number(e.target.value),
                                                        })
                                                    }
                                                    placeholder="0 (Unlimited)"
                                                />
                                                <span className="mt-1 block text-[11px] font-normal text-slate-400">
                                                    {t('plans.fields.max_users_hint')}
                                                </span>
                                            </label>

                                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                🏢 {t('plans.fields.max_branches')}
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={inputClass}
                                                    value={form.data.limits.max_branches ?? ''}
                                                    onChange={(e) =>
                                                        form.setData('limits', {
                                                            ...form.data.limits,
                                                            max_branches: e.target.value === '' ? null : Number(e.target.value),
                                                        })
                                                    }
                                                    placeholder="0 (Unlimited)"
                                                />
                                                <span className="mt-1 block text-[11px] font-normal text-slate-400">
                                                    {t('plans.fields.max_branches_hint')}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Feature Highlights Checklist Builder */}
                                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 space-y-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                                                {t('plans.fields.features_list')}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {t('plans.fields.features_list_hint')}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newFeatureText}
                                                onChange={(e) => setNewFeatureText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addFeatureItem();
                                                    }
                                                }}
                                                placeholder={t('plans.fields.feature_placeholder')}
                                                className="block w-full rounded-xl border-slate-200 dark:border-slate-800 py-2 px-3.5 text-xs bg-white dark:bg-slate-900 focus:border-indigo-500 text-slate-900 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={addFeatureItem}
                                                className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-colors"
                                            >
                                                {t('plans.fields.add_feature')}
                                            </button>
                                        </div>

                                        {form.data.features_list.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">Belum ada poin fitur ditambahkan. Masukkan poin fitur di atas dan klik Tambah.</p>
                                        ) : (
                                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                                {form.data.features_list.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-200 shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                                                ✓
                                                            </span>
                                                            <span className="truncate">{item}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFeatureItem(idx)}
                                                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                                            title="Hapus"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab 4: Modul */}
                            {activeTab === 'modules' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('plans.form.modules_allocation_title')}</h3>
                                            <p className="text-xs text-slate-500">{t('plans.form.modules_allocation_subtitle')}</p>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <button
                                                type="button"
                                                onClick={selectAll}
                                                className="rounded-lg px-2.5 py-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                                            >
                                                {t('plans.actions.select_all')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearAll}
                                                className="rounded-lg px-2.5 py-1 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                {t('plans.actions.clear_all')}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={moduleSearch}
                                            onChange={(e) => setModuleSearch(e.target.value)}
                                            placeholder={t('plans.pages.index.search_placeholder')}
                                            className="block w-full rounded-xl border-slate-200 dark:border-slate-800 py-2 pl-9 pr-3 text-xs bg-white dark:bg-slate-900 focus:border-indigo-500"
                                        />
                                    </div>

                                    {groupedModules.length === 0 ? (
                                        <p className="mt-6 text-center text-xs text-slate-400">{t('plans.pages.index.no_modules_match')}</p>
                                    ) : (
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                            {groupedModules.map(({ tier, modules }) => (
                                                <div key={tier}>
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${TIER_BADGES[tier].bg}`} />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                            {t(`plans.tiers.${tier}.label`)}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">— {t(`plans.tiers.${tier}.hint`)}</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        {modules.map((module) => {
                                                            const checked = form.data.modules.includes(module.key);
                                                            const locked = !module.is_enabled;
                                                            const validRequires = (module.requires || []).filter((reqKey) => moduleLabelMap.has(reqKey));
                                                            const hasRequires = validRequires.length > 0;

                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={module.key}
                                                                    onClick={() => !locked && toggleModule(module.key)}
                                                                    disabled={locked}
                                                                    aria-pressed={checked}
                                                                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                                                                        locked
                                                                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 dark:bg-slate-800/30 opacity-60'
                                                                            : checked
                                                                              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                                                              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3 w-full">
                                                                        <span
                                                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                                                                checked && !locked
                                                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                                                            }`}
                                                                        >
                                                                            {checked && (
                                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </span>
                                                                        <span className="min-w-0 flex-1 text-xs">
                                                                            <span className="flex items-center justify-between gap-2">
                                                                                <span className={`font-bold ${locked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                                                {module.label}
                                                                            </span>
                                                                            {locked && (
                                                                                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                                    {t('plans.pages.index.module_disabled_badge')}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                                                            {module.description}
                                                                        </span>
                                                                    </span>
                                                                </div>

                                                                {/* Card Footer: Required Modules Information */}
                                                                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 w-full">
                                                                    {hasRequires ? (
                                                                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                                                <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                                </svg>
                                                                                <span>{t('plans.form.requires_modules')}:</span>
                                                                            </span>
                                                                            {validRequires.map((reqKey) => {
                                                                                const reqLabel = moduleLabelMap.get(reqKey) || reqKey;
                                                                                const isReqSelected = form.data.modules.includes(reqKey);
                                                                                return (
                                                                                    <span
                                                                                        key={reqKey}
                                                                                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                                                                                            isReqSelected
                                                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80'
                                                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80'
                                                                                        }`}
                                                                                    >
                                                                                        <span>{reqLabel}</span>
                                                                                        {isReqSelected ? (
                                                                                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold" title="Termasuk dalam paket">✓</span>
                                                                                        ) : (
                                                                                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold" title="Belum dipilih dalam paket">!</span>
                                                                                        )}
                                                                                    </span>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                                            <span className="text-emerald-500 font-bold">✓</span>
                                                                            <span>{t('plans.form.no_dependencies')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2">
                                {activeTab !== 'info' && (
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => {
                                            if (activeTab === 'modules') setActiveTab('limits');
                                            else if (activeTab === 'limits') setActiveTab('pricing');
                                            else setActiveTab('info');
                                        }}
                                        className="!rounded-xl text-xs"
                                    >
                                        {t('plans.actions.back')}
                                    </SecondaryButton>
                                )}
                                {activeTab !== 'modules' && (
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => {
                                            if (activeTab === 'info') setActiveTab('pricing');
                                            else if (activeTab === 'pricing') setActiveTab('limits');
                                            else setActiveTab('modules');
                                        }}
                                        className="!rounded-xl text-xs"
                                    >
                                        {t('plans.actions.next')}
                                    </SecondaryButton>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={route('module.plans.index')}>
                                    <SecondaryButton type="button" className="!rounded-xl text-xs">
                                        {t('common.cancel')}
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={form.processing} className="!rounded-xl text-xs shadow-sm">
                                    {form.processing ? t('plans.actions.saving') : t('common.save')}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Live Card Preview */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="sticky top-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white p-6 shadow-md">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2">
                            {t('plans.preview.live_preview')}
                        </div>

                        <div className={`relative rounded-2xl border p-5 backdrop-blur-sm transition-all ${
                            form.data.is_popular
                                ? 'border-teal-500/50 bg-teal-950/20 ring-2 ring-teal-500/30'
                                : 'border-white/10 bg-white/5'
                        }`}>
                            {form.data.badge && (
                                <div className="mb-2">
                                    <span className="inline-flex items-center rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/30">
                                        {form.data.badge}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold">
                                    {form.data.name || t('plans.preview.name_placeholder')}
                                </h4>
                                {form.data.is_default && (
                                    <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold">
                                        {t('plans.pages.index.default_badge')}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-white/60 line-clamp-2">
                                {form.data.description || t('plans.preview.desc_placeholder')}
                            </p>

                            <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="text-[10px] uppercase font-semibold text-white/50">{t('plans.billing.monthly')}</div>
                                <div className="text-xl font-bold">
                                    {form.data.price ? fmtPrice(form.data.price, form.data.currency) : '—'} <span className="text-xs font-normal text-white/50">{t('plans.billing.per_month')}</span>
                                </div>
                                {form.data.annual_price && (
                                    <div className="mt-2 text-xs font-semibold text-emerald-400">
                                        {t('plans.billing.annual')}: {fmtPrice(form.data.annual_price, form.data.currency)} {t('plans.billing.per_year')}
                                    </div>
                                )}
                            </div>

                            {/* Limits Summary in Preview */}
                            {(form.data.limits.max_vehicles || form.data.limits.max_users) && (
                                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/80 space-y-1">
                                    <div className="text-[10px] uppercase font-semibold text-white/50">Kapasitas Kuota</div>
                                    <div className="flex flex-wrap gap-2 text-[11px]">
                                        {form.data.limits.max_vehicles ? (
                                            <span className="rounded-md bg-white/10 px-2 py-0.5">🚗 {form.data.limits.max_vehicles} Armada</span>
                                        ) : (
                                            <span className="rounded-md bg-white/10 px-2 py-0.5">🚗 Unlimited Armada</span>
                                        )}
                                        {form.data.limits.max_users ? (
                                            <span className="rounded-md bg-white/10 px-2 py-0.5">👥 {form.data.limits.max_users} User</span>
                                        ) : (
                                            <span className="rounded-md bg-white/10 px-2 py-0.5">👥 Unlimited User</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Feature Highlights Checklist */}
                            {form.data.features_list.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-white/10">
                                    <div className="text-[10px] uppercase font-semibold text-white/50 mb-1.5">Poin Fitur Unggulan</div>
                                    <ul className="space-y-1 text-xs text-white/80">
                                        {form.data.features_list.slice(0, 4).map((f, i) => (
                                            <li key={i} className="flex items-center gap-1.5 text-[11px]">
                                                <span className="text-teal-400">✓</span> {f}
                                            </li>
                                        ))}
                                        {form.data.features_list.length > 4 && (
                                            <li className="text-[10px] text-white/40 italic">+{form.data.features_list.length - 4} fitur lainnya</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="text-[11px] font-semibold text-white/70 mb-1.5">
                                    {t('plans.billing.modules_covered', { count: form.data.modules.length })}
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                                    {form.data.modules.length === 0 ? (
                                        <span className="text-xs text-white/40 italic">{t('plans.preview.no_modules')}</span>
                                    ) : (
                                        form.data.modules.map((mKey) => (
                                            <span key={mKey} className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/90">
                                                {mKey}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

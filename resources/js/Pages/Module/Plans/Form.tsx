import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
}

export interface PlanFormData {
    id?: number;
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
    trial_days: number | null;
    tenants?: number;
}

interface PlanFormProps {
    initialData: PlanFormData;
    availableModules: AvailableModule[];
    isEdit?: boolean;
}

const TIER_ORDER: ModuleTier[] = ['vertical', 'foundation', 'content'];

const TIER_BADGES: Record<ModuleTier, { bg: string; text: string }> = {
    vertical: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
    foundation: { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
    content: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
};

const CURRENCIES = ['IDR', 'USD', 'SGD', 'MYR'];

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

export default function PlanForm({ initialData, availableModules, isEdit = false }: PlanFormProps): JSX.Element {
    const { t } = useTrans();
    const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'modules'>('info');
    const [moduleSearch, setModuleSearch] = useState('');

    const form = useForm({
        key: initialData.key,
        name: initialData.name,
        description: initialData.description ?? '',
        modules: initialData.modules ?? [],
        sort_order: initialData.sort_order ?? 0,
        is_default: initialData.is_default ?? false,
        price: initialData.price ? String(Number(initialData.price)) : '',
        original_price: initialData.original_price ? String(Number(initialData.original_price)) : '',
        annual_price: initialData.annual_price ? String(Number(initialData.annual_price)) : '',
        annual_original_price: initialData.annual_original_price ? String(Number(initialData.annual_original_price)) : '',
        currency: initialData.currency ?? 'IDR',
        trial_days: initialData.trial_days ?? 0,
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

    const query = moduleSearch.trim().toLowerCase();

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
                        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all ${
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
                                className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all ${
                                    activeTab === 'pricing'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                {t('plans.tabs.pricing')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('modules')}
                                className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition-all ${
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
                                                placeholder="enterprise"
                                                required
                                            />
                                            {form.errors.key && <p className="mt-1 text-xs text-rose-500">{form.errors.key}</p>}
                                            <p className="mt-1 text-[11px] text-slate-400">
                                                {isEdit ? t('plans.fields.key_hint_locked') : t('plans.fields.key_hint_new')}
                                            </p>
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
                                            {t('plans.fields.sort_order')}
                                            <input
                                                type="number"
                                                min={0}
                                                className={inputClass}
                                                value={form.data.sort_order}
                                                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                            />
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

                                        <label className="flex items-start gap-3 pt-6 text-xs text-slate-700 dark:text-slate-300">
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
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Pricing */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('plans.form.currency_title')}</h3>
                                        <select
                                            value={form.data.currency}
                                            onChange={(e) => form.setData('currency', e.target.value)}
                                            className="rounded-xl border-slate-200 dark:border-slate-800 py-1.5 px-3 text-xs bg-white dark:bg-slate-900 font-semibold focus:border-indigo-500"
                                        >
                                            {CURRENCIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

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
                                </div>
                            )}

                            {/* Tab 3: Modul */}
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
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={module.key}
                                                                    onClick={() => !locked && toggleModule(module.key)}
                                                                    disabled={locked}
                                                                    aria-pressed={checked}
                                                                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                                                                        locked
                                                                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 dark:bg-slate-800/30 opacity-60'
                                                                            : checked
                                                                              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                                                              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                                    }`}
                                                                >
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
                                                                    <span className="min-w-0 text-xs">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className={`font-bold ${locked ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                                                {module.label}
                                                                            </span>
                                                                            {locked && (
                                                                                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                                                    {t('plans.pages.index.module_disabled_badge')}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="mt-0.5 block text-[11px] text-slate-500 leading-tight">{module.description}</span>
                                                                    </span>
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
                                    <SecondaryButton type="button" onClick={() => setActiveTab(activeTab === 'modules' ? 'pricing' : 'info')} className="!rounded-xl text-xs">
                                        {t('plans.actions.back')}
                                    </SecondaryButton>
                                )}
                                {activeTab !== 'modules' && (
                                    <SecondaryButton type="button" onClick={() => setActiveTab(activeTab === 'info' ? 'pricing' : 'modules')} className="!rounded-xl text-xs">
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

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
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

                            <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="text-[11px] font-semibold text-white/70 mb-1.5">
                                    {t('plans.billing.modules_covered', { count: form.data.modules.length })}
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
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

import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import PageHeader from '@/Components/PageHeader';

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

const TIER_ORDER: ModuleTier[] = ['vertical', 'foundation', 'content'];

const TIER_ACCENT: Record<ModuleTier, string> = {
    vertical: 'bg-indigo-500',
    foundation: 'bg-sky-500',
    content: 'bg-emerald-500',
};

const CURRENCIES = ['IDR', 'USD', 'SGD', 'MYR'];

const inputClass =
    'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';

const fmtPrice = (amount: string | null, currency: string): string => {
    if (!amount || Number(amount) === 0) return '—';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
        Number(amount),
    );
};

function PricingDisplay({ plan }: { plan: PlanRow }) {
    const hasMonthly = plan.price && Number(plan.price) > 0;
    const hasAnnual = plan.annual_price && Number(plan.annual_price) > 0;

    if (!hasMonthly && !hasAnnual) {
        return <span className="text-xs text-gray-400">Harga belum diset</span>;
    }

    return (
        <div className="mt-2 flex flex-wrap items-start gap-3">
            {hasMonthly && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Bulanan</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-gray-800">
                            {fmtPrice(plan.price, plan.currency)}
                        </span>
                        {plan.original_price && Number(plan.original_price) > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                                {fmtPrice(plan.original_price, plan.currency)}
                            </span>
                        )}
                    </div>
                </div>
            )}
            {hasAnnual && (
                <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Tahunan</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-indigo-700">
                            {fmtPrice(plan.annual_price, plan.currency)}
                        </span>
                        {plan.annual_original_price && Number(plan.annual_original_price) > 0 && (
                            <span className="text-xs text-gray-400 line-through">
                                {fmtPrice(plan.annual_original_price, plan.currency)}
                            </span>
                        )}
                        {plan.price && plan.annual_price && Number(plan.price) > 0 && (
                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                hemat {Math.round((1 - Number(plan.annual_price) / (Number(plan.price) * 12)) * 100)}%
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

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
        <label className="block text-sm font-medium text-gray-700">
            {label}
            {hint && <span className="ml-1 text-xs font-normal text-gray-400">({hint})</span>}
            <div className="mt-1 flex rounded-lg shadow-sm">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-xs font-medium text-gray-500">
                    {currency}
                </span>
                <input
                    type="number"
                    min="0"
                    step="1000"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-r-lg border border-gray-300 py-2 pr-3 text-sm shadow-none focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </label>
    );
}

export default function Index({ plans, availableModules }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [editing, setEditing] = useState<PlanRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<PlanRow | null>(null);
    const [moduleSearch, setModuleSearch] = useState('');

    const form = useForm({
        key: '',
        name: '',
        description: '',
        modules: [] as string[],
        sort_order: 0,
        is_default: false,
        price: '',
        original_price: '',
        annual_price: '',
        annual_original_price: '',
        currency: 'IDR',
    });

    const deleteForm = useForm({});

    const openCreate = (): void => {
        form.setData({
            key: '',
            name: '',
            description: '',
            modules: [],
            sort_order: plans.length + 1,
            is_default: false,
            price: '',
            original_price: '',
            annual_price: '',
            annual_original_price: '',
            currency: 'IDR',
        });
        form.clearErrors();
        setModuleSearch('');
        setCreating(true);
    };

    const openEdit = (plan: PlanRow): void => {
        form.setData({
            key: plan.key,
            name: plan.name,
            description: plan.description ?? '',
            modules: plan.modules,
            sort_order: plan.sort_order,
            is_default: plan.is_default,
            price: plan.price ? String(Number(plan.price)) : '',
            original_price: plan.original_price ? String(Number(plan.original_price)) : '',
            annual_price: plan.annual_price ? String(Number(plan.annual_price)) : '',
            annual_original_price: plan.annual_original_price ? String(Number(plan.annual_original_price)) : '',
            currency: plan.currency ?? 'IDR',
        });
        form.clearErrors();
        setModuleSearch('');
        setEditing(plan);
    };

    const close = (): void => {
        setCreating(false);
        setEditing(null);
    };

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

        if (editing) {
            form.patch(route('module.plans.update', editing.id), {
                preserveScroll: true,
                onSuccess: close,
            });
            return;
        }

        form.post(route('module.plans.store'), { preserveScroll: true, onSuccess: close });
    };

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

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-2xl text-sm text-gray-600">{t('plans.pages.index.description')}</p>
                    <PrimaryButton onClick={openCreate}>{t('plans.pages.index.new')}</PrimaryButton>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <ul className="divide-y divide-gray-100">
                        {plans.map((plan) => (
                            <li key={plan.id} className="flex flex-wrap items-start gap-4 p-6">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                                            {plan.key}
                                        </span>
                                        {plan.is_default && (
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                                {t('plans.pages.index.default_badge')}
                                            </span>
                                        )}
                                    </div>

                                    {plan.description && (
                                        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                                    )}

                                    <PricingDisplay plan={plan} />

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {plan.modules.length === 0 ? (
                                            <span className="text-xs text-gray-400">{t('plans.pages.index.no_modules')}</span>
                                        ) : (
                                            plan.modules.map((key) => {
                                                const module = availableModules.find((m) => m.key === key);
                                                const disabled = module?.is_enabled === false;
                                                return (
                                                    <span
                                                        key={key}
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                                            disabled
                                                                ? 'bg-gray-50 text-gray-400 ring-gray-200 line-through'
                                                                : 'bg-sky-50 text-sky-700 ring-sky-200'
                                                        }`}
                                                        title={disabled ? t('plans.pages.index.module_disabled_title') : undefined}
                                                    >
                                                        {module?.label ?? key}
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>

                                    <p className="mt-2 text-xs text-gray-400">
                                        {t('plans.pages.index.tenant_count', { count: plan.tenants })}
                                        {plan.is_default && t('plans.pages.index.default_suffix')}
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    <SecondaryButton onClick={() => openEdit(plan)}>{t('common.edit')}</SecondaryButton>
                                    <SecondaryButton
                                        disabled={plan.tenants > 0 || plan.is_default}
                                        title={
                                            plan.is_default
                                                ? t('plans.pages.index.delete_disabled_default')
                                                : plan.tenants > 0
                                                  ? t('plans.pages.index.delete_disabled_in_use')
                                                  : undefined
                                        }
                                        onClick={() => setDeleting(plan)}
                                    >
                                        {t('common.delete')}
                                    </SecondaryButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal show={creating || editing !== null} onClose={close} maxWidth="2xl">
                <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editing ? t('plans.pages.index.modal_edit_title', { name: editing.name }) : t('plans.pages.index.modal_create_title')}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        {/* ── Info dasar ── */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {t('plans.fields.name')}
                                <input
                                    className={inputClass}
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                />
                                {form.errors.name && <p className="mt-1 text-xs text-red-500">{form.errors.name}</p>}
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                {t('plans.fields.key')}
                                <input
                                    className={`${inputClass} font-mono disabled:bg-gray-100 disabled:text-gray-500`}
                                    value={form.data.key}
                                    onChange={(e) => form.setData('key', e.target.value.toLowerCase())}
                                    disabled={editing !== null}
                                    placeholder="enterprise"
                                    required
                                />
                                {form.errors.key && <p className="mt-1 text-xs text-red-500">{form.errors.key}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    {editing ? t('plans.fields.key_hint_locked') : t('plans.fields.key_hint_new')}
                                </p>
                            </label>

                            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                                {t('plans.fields.description')}
                                <input
                                    className={inputClass}
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                />
                                {form.errors.description && (
                                    <p className="mt-1 text-xs text-red-500">{form.errors.description}</p>
                                )}
                            </label>

                            <label className="block text-sm font-medium text-gray-700">
                                {t('plans.fields.sort_order')}
                                <input
                                    type="number"
                                    min={0}
                                    className={inputClass}
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                />
                            </label>

                            <label className="flex items-start gap-2 pt-6 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={form.data.is_default}
                                    onChange={(e) => form.setData('is_default', e.target.checked)}
                                />
                                <span>
                                    {t('plans.fields.is_default')}
                                    <span className="block text-xs text-gray-500">{t('plans.fields.is_default_hint')}</span>
                                </span>
                            </label>
                        </div>

                        {/* ── Harga ── */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-700">Harga & Penagihan</h3>
                                <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                    Mata uang
                                    <select
                                        value={form.data.currency}
                                        onChange={(e) => form.setData('currency', e.target.value)}
                                        className="rounded-md border-gray-300 py-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                                {/* Bulanan */}
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Berlangganan Bulanan
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <PriceInput
                                        label="Harga Normal"
                                        hint="harga yang dibayar tenant"
                                        value={form.data.price}
                                        onChange={(v) => form.setData('price', v)}
                                        currency={form.data.currency}
                                        error={form.errors.price}
                                    />
                                    <PriceInput
                                        label="Harga Coret"
                                        hint="opsional, tampil dicoret"
                                        value={form.data.original_price}
                                        onChange={(v) => form.setData('original_price', v)}
                                        currency={form.data.currency}
                                        error={form.errors.original_price}
                                    />
                                </div>

                                {/* Tahunan */}
                                <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Berlangganan Tahunan
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <PriceInput
                                        label="Harga Tahunan"
                                        hint="total bayar per tahun"
                                        value={form.data.annual_price}
                                        onChange={(v) => form.setData('annual_price', v)}
                                        currency={form.data.currency}
                                        error={form.errors.annual_price}
                                    />
                                    <PriceInput
                                        label="Harga Tahunan Coret"
                                        hint="opsional, tampil dicoret"
                                        value={form.data.annual_original_price}
                                        onChange={(v) => form.setData('annual_original_price', v)}
                                        currency={form.data.currency}
                                        error={form.errors.annual_original_price}
                                    />
                                </div>

                                {/* Preview diskon */}
                                {form.data.price && form.data.annual_price && Number(form.data.price) > 0 && Number(form.data.annual_price) > 0 && (
                                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
                                        Hemat{' '}
                                        <strong>
                                            {Math.round(
                                                (1 - Number(form.data.annual_price) / (Number(form.data.price) * 12)) * 100,
                                            )}
                                            %
                                        </strong>{' '}
                                        dibanding bayar bulanan (
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: form.data.currency,
                                            maximumFractionDigits: 0,
                                        }).format(Number(form.data.price) * 12)}{' '}
                                        / tahun)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Modul ── */}
                        <div className="mt-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">{t('plans.pages.index.modules_section_title')}</span>
                                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                                        {t('plans.pages.index.modules_selected_count', { count: form.data.modules.length })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="rounded-md px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50"
                                    >
                                        {t('plans.actions.select_all')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="rounded-md px-2 py-1 font-medium text-gray-500 hover:bg-gray-100"
                                    >
                                        {t('plans.actions.clear_all')}
                                    </button>
                                </div>
                            </div>

                            {availableModules.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500">{t('plans.pages.index.no_modules_registered')}</p>
                            ) : (
                                <>
                                    <div className="relative mt-3">
                                        <svg
                                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
                                            className="block w-full rounded-lg border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>

                                    {groupedModules.length === 0 ? (
                                        <p className="mt-4 text-center text-sm text-gray-400">
                                            {t('plans.pages.index.no_modules_match', { query: moduleSearch })}
                                        </p>
                                    ) : (
                                        <div className="mt-4 space-y-5">
                                            {groupedModules.map(({ tier, modules }) => (
                                                <div key={tier}>
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${TIER_ACCENT[tier]}`} />
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                            {t(`plans.tiers.${tier}.label`)}
                                                        </span>
                                                        <span className="text-xs text-gray-400">— {t(`plans.tiers.${tier}.hint`)}</span>
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
                                                                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                                                                        locked
                                                                            ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                                                                            : checked
                                                                              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                                                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                                            checked && !locked
                                                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                : 'border-gray-300 bg-white'
                                                                        }`}
                                                                    >
                                                                        {checked && (
                                                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </span>
                                                                    <span className="min-w-0 text-sm">
                                                                        <span className="flex items-center gap-2">
                                                                            <span className={`font-medium ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                                {module.label}
                                                                            </span>
                                                                            {locked && (
                                                                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">
                                                                                    {t('plans.pages.index.module_disabled_badge')}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        <span className="mt-0.5 block text-xs text-gray-500">{module.description}</span>
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {form.errors.modules && <p className="mt-2 text-xs text-red-500">{form.errors.modules}</p>}
                        </div>

                        {editing && editing.tenants > 0 && (
                            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                                {t('plans.pages.index.tenants_warning', { count: editing.tenants })}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                        <SecondaryButton type="button" onClick={close}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>
                            {form.processing ? t('plans.actions.saving') : t('common.save')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

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

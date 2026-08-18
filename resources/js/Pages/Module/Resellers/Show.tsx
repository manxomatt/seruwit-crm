import CommissionTable from '@/Components/Reseller/CommissionTable';
import Pagination from '@/Components/Reseller/Pagination';
import StatCard from '@/Components/Reseller/StatCard';
import { CommissionRow, EarningsSummary, MonthlyPoint, Paginated } from '@/Components/Reseller/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Rule {
    id: number;
    plan_id: number | null;
    plan_name: string | null;
    applies_to: string;
    billing_interval: string | null;
    type: string;
    value: number;
    max_occurrences: number | null;
    starts_at: string | null;
    ends_at: string | null;
    priority: number;
    is_active: boolean;
}

interface TenantRow {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    attributed_at: string | null;
    attribution_ends_at: string | null;
}

interface Props {
    reseller: { global_id: string; name: string; email: string };
    profile: {
        id: number;
        company_name: string | null;
        status: string;
        referral_code: string;
        referral_url: string;
        default_commission_type: string | null;
        default_commission_value: number | null;
        renewal_commission_value: number | null;
        payout_bank_name: string | null;
        payout_account_number: string | null;
        payout_account_name: string | null;
        tax_id: string | null;
        minimum_payout: number;
        notes: string | null;
    };
    landing: { is_live: boolean; url: string };
    summary: EarningsSummary;
    series: MonthlyPoint[];
    commissions: Paginated<CommissionRow>;
    rules: Rule[];
    tenants: TenantRow[];
    plans: Array<{ id: number; name: string }>;
}

export default function Show({ reseller, profile, landing, summary, commissions, rules, tenants, plans }: Props): JSX.Element {
    const { t } = useTrans();
    const [addingRule, setAddingRule] = useState(false);

    const profileForm = useForm({
        company_name: profile.company_name ?? '',
        status: profile.status,
        referral_code: profile.referral_code,
        default_commission_type: profile.default_commission_type ?? '',
        default_commission_value: profile.default_commission_value?.toString() ?? '',
        renewal_commission_value: profile.renewal_commission_value?.toString() ?? '',
        payout_bank_name: profile.payout_bank_name ?? '',
        payout_account_number: profile.payout_account_number ?? '',
        payout_account_name: profile.payout_account_name ?? '',
        tax_id: profile.tax_id ?? '',
        minimum_payout: profile.minimum_payout.toString(),
        notes: profile.notes ?? '',
    });

    const ruleForm = useForm({
        reseller_global_id: reseller.global_id,
        plan_id: '',
        applies_to: 'all',
        billing_interval: '',
        type: 'percent',
        value: '',
        max_occurrences: '',
        priority: '0',
        is_active: true,
    });

    const submitProfile: FormEventHandler = (event) => {
        event.preventDefault();
        profileForm.patch(route('module.resellers.update', reseller.global_id), { preserveScroll: true });
    };

    const submitRule: FormEventHandler = (event) => {
        event.preventDefault();
        ruleForm.post(route('module.reseller-rules.store'), {
            preserveScroll: true,
            onSuccess: () => {
                ruleForm.reset('plan_id', 'billing_interval', 'value', 'max_occurrences');
                setAddingRule(false);
            },
        });
    };

    const deleteRule = (rule: Rule) => {
        if (!window.confirm(t('reseller.rules.delete_confirm'))) {
            return;
        }

        router.delete(route('module.reseller-rules.destroy', rule.id), { preserveScroll: true });
    };

    const toggleRule = (rule: Rule) => {
        router.patch(
            route('module.reseller-rules.update', rule.id),
            {
                applies_to: rule.applies_to,
                billing_interval: rule.billing_interval,
                type: rule.type,
                value: rule.value,
                max_occurrences: rule.max_occurrences,
                priority: rule.priority,
                is_active: !rule.is_active,
            },
            { preserveScroll: true },
        );
    };

    const ruleScope = (rule: Rule): string =>
        [
            rule.plan_name ?? t('reseller.rules.all_plans'),
            t(`reseller.applies_to.${rule.applies_to}`),
            rule.billing_interval ? t(`reseller.interval.${rule.billing_interval}`) : t('reseller.interval.all'),
        ].join(' · ');

    return (
        <DynamicLayout header={<PageHeader title={reseller.name} description={reseller.email} />}>
            <Head title={reseller.name} />

            <div className="space-y-6">
                <Link
                    href={route('module.resellers.index')}
                    className="inline-block text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400"
                >
                    ← {t('reseller.admin.back')}
                </Link>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label={t('reseller.stats.pending')} value={formatMoney(summary.pending)} tone="amber" />
                    <StatCard label={t('reseller.stats.approved')} value={formatMoney(summary.approved)} tone="sky" />
                    <StatCard label={t('reseller.stats.paid')} value={formatMoney(summary.paid)} tone="emerald" />
                    <StatCard
                        label={t('reseller.stats.tenants')}
                        value={`${summary.tenants}`}
                        hint={`${summary.paying_tenants} ${t('reseller.stats.paying_tenants')}`}
                        tone="indigo"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Profile */}
                    <form
                        onSubmit={submitProfile}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.profile.title')}</h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="company_name" value={t('reseller.profile.company_name')} />
                                <TextInput
                                    id="company_name"
                                    value={profileForm.data.company_name}
                                    onChange={(event) => profileForm.setData('company_name', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={profileForm.errors.company_name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value={t('reseller.profile.status')} />
                                <Select
                                    value={profileForm.data.status}
                                    onChange={(value) => profileForm.setData('status', value)}
                                    options={['active', 'suspended', 'terminated'].map((status) => ({
                                        value: status,
                                        label: t(`reseller.status.${status}`),
                                    }))}
                                />
                                <InputError message={profileForm.errors.status} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="referral_code" value={t('reseller.profile.referral_code')} />
                                <TextInput
                                    id="referral_code"
                                    value={profileForm.data.referral_code}
                                    onChange={(event) => profileForm.setData('referral_code', event.target.value.toUpperCase())}
                                    className="mt-1 block w-full font-mono"
                                />
                                <InputError message={profileForm.errors.referral_code} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value={t('reseller.profile.default_commission_type')} />
                                <Select
                                    value={profileForm.data.default_commission_type}
                                    onChange={(value) => profileForm.setData('default_commission_type', value)}
                                    options={[
                                        { value: '', label: t('reseller.profile.inherit') },
                                        { value: 'percent', label: t('reseller.rate_type.percent') },
                                        { value: 'flat', label: t('reseller.rate_type.flat') },
                                    ]}
                                />
                                <InputError message={profileForm.errors.default_commission_type} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="default_commission_value" value={t('reseller.profile.default_commission_value')} />
                                <TextInput
                                    id="default_commission_value"
                                    type="number"
                                    step="0.01"
                                    value={profileForm.data.default_commission_value}
                                    onChange={(event) => profileForm.setData('default_commission_value', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={profileForm.errors.default_commission_value} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="renewal_commission_value" value={t('reseller.profile.renewal_commission_value')} />
                                <TextInput
                                    id="renewal_commission_value"
                                    type="number"
                                    step="0.01"
                                    value={profileForm.data.renewal_commission_value}
                                    onChange={(event) => profileForm.setData('renewal_commission_value', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={profileForm.errors.renewal_commission_value} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="payout_bank_name" value={t('reseller.profile.payout_bank_name')} />
                                <TextInput
                                    id="payout_bank_name"
                                    value={profileForm.data.payout_bank_name}
                                    onChange={(event) => profileForm.setData('payout_bank_name', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="payout_account_number" value={t('reseller.profile.payout_account_number')} />
                                <TextInput
                                    id="payout_account_number"
                                    value={profileForm.data.payout_account_number}
                                    onChange={(event) => profileForm.setData('payout_account_number', event.target.value)}
                                    className="mt-1 block w-full font-mono"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="payout_account_name" value={t('reseller.profile.payout_account_name')} />
                                <TextInput
                                    id="payout_account_name"
                                    value={profileForm.data.payout_account_name}
                                    onChange={(event) => profileForm.setData('payout_account_name', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="tax_id" value={t('reseller.profile.tax_id')} />
                                <TextInput
                                    id="tax_id"
                                    value={profileForm.data.tax_id}
                                    onChange={(event) => profileForm.setData('tax_id', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="minimum_payout" value={t('reseller.profile.minimum_payout')} />
                                <TextInput
                                    id="minimum_payout"
                                    type="number"
                                    value={profileForm.data.minimum_payout}
                                    onChange={(event) => profileForm.setData('minimum_payout', event.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="notes" value={t('reseller.profile.notes')} />
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={profileForm.data.notes}
                                    onChange={(event) => profileForm.setData('notes', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <span className="block truncate font-mono text-xs text-slate-400" title={profile.referral_url}>
                                    {profile.referral_url}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {t('reseller.landing.title')}:{' '}
                                    {landing.is_live ? (
                                        <a
                                            href={landing.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            {t('reseller.landing.preview')}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400">{t('reseller.landing.disabled_hint')}</span>
                                    )}
                                </span>
                            </div>
                            <PrimaryButton disabled={profileForm.processing}>{t('reseller.profile.save')}</PrimaryButton>
                        </div>
                    </form>

                    {/* Rules */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.rules.title')}</h3>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('reseller.rules.hint')}</p>
                            </div>
                            <SecondaryButton type="button" onClick={() => setAddingRule((open) => !open)}>
                                {addingRule ? t('reseller.rules.cancel') : t('reseller.rules.add')}
                            </SecondaryButton>
                        </div>

                        {addingRule && (
                            <form onSubmit={submitRule} className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-800/50">
                                <div>
                                    <InputLabel value={t('reseller.rules.plan')} />
                                    <Select
                                        value={ruleForm.data.plan_id}
                                        onChange={(value) => ruleForm.setData('plan_id', value)}
                                        options={[
                                            { value: '', label: t('reseller.rules.all_plans') },
                                            ...plans.map((plan) => ({ value: String(plan.id), label: plan.name })),
                                        ]}
                                    />
                                </div>

                                <div>
                                    <InputLabel value={t('reseller.rules.applies_to')} />
                                    <Select
                                        value={ruleForm.data.applies_to}
                                        onChange={(value) => ruleForm.setData('applies_to', value)}
                                        options={['all', 'first', 'renewal'].map((scope) => ({
                                            value: scope,
                                            label: t(`reseller.applies_to.${scope}`),
                                        }))}
                                    />
                                </div>

                                <div>
                                    <InputLabel value={t('reseller.rules.interval')} />
                                    <Select
                                        value={ruleForm.data.billing_interval}
                                        onChange={(value) => ruleForm.setData('billing_interval', value)}
                                        options={[
                                            { value: '', label: t('reseller.interval.all') },
                                            { value: 'month', label: t('reseller.interval.month') },
                                            { value: 'annual', label: t('reseller.interval.annual') },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <InputLabel value={t('reseller.rules.type')} />
                                    <Select
                                        value={ruleForm.data.type}
                                        onChange={(value) => ruleForm.setData('type', value)}
                                        options={[
                                            { value: 'percent', label: t('reseller.rate_type.percent') },
                                            { value: 'flat', label: t('reseller.rate_type.flat') },
                                        ]}
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="rule_value" value={t('reseller.rules.value')} />
                                    <TextInput
                                        id="rule_value"
                                        type="number"
                                        step="0.01"
                                        value={ruleForm.data.value}
                                        onChange={(event) => ruleForm.setData('value', event.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={ruleForm.errors.value} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="rule_max" value={t('reseller.rules.max_occurrences')} />
                                    <TextInput
                                        id="rule_max"
                                        type="number"
                                        min="1"
                                        placeholder={t('reseller.rules.unlimited')}
                                        value={ruleForm.data.max_occurrences}
                                        onChange={(event) => ruleForm.setData('max_occurrences', event.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={ruleForm.errors.max_occurrences} className="mt-1" />
                                </div>

                                <div className="sm:col-span-2 flex justify-end">
                                    <PrimaryButton disabled={ruleForm.processing}>{t('reseller.rules.save')}</PrimaryButton>
                                </div>
                            </form>
                        )}

                        <div className="mt-4 space-y-2">
                            {rules.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700">
                                    {t('reseller.rules.empty')}
                                </p>
                            ) : (
                                rules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                                            rule.is_active
                                                ? 'border-slate-200 dark:border-slate-700'
                                                : 'border-dashed border-slate-200 opacity-60 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {rule.type === 'percent' ? `${rule.value}%` : formatMoney(rule.value)}
                                                {rule.max_occurrences && (
                                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                                        ×{rule.max_occurrences}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{ruleScope(rule)}</div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleRule(rule)}
                                                className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                                            >
                                                {rule.is_active ? t('reseller.rules.active') : t('reseller.status.void')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteRule(rule)}
                                                className="text-xs font-medium text-rose-600 hover:underline"
                                            >
                                                {t('reseller.rules.delete')}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Attributed tenants */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.admin.tenants_title')}</h3>

                    {tenants.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('reseller.admin.tenants_empty')}</p>
                    ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {tenants.map((tenant) => (
                                <div key={tenant.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                    <div className="font-medium text-slate-900 dark:text-white">{tenant.name}</div>
                                    <div className="text-xs text-slate-400">{tenant.domain ?? tenant.id}</div>
                                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        {t('reseller.admin.attributed_at')}: {tenant.attributed_at ?? '—'}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('reseller.admin.attribution_ends_at')}:{' '}
                                        {tenant.attribution_ends_at ?? t('reseller.admin.lifetime_attribution')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.commissions_title')}</h3>
                    <CommissionTable rows={commissions.data} />
                    <Pagination links={commissions.links} />
                </div>
            </div>
        </DynamicLayout>
    );
}

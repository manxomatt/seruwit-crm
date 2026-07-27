import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ScoringNav from '../../../../ScoringNav';

interface Rule {
    id: number;
    name: string;
    period: string;
    min_score: number;
    min_days: number;
    reward_amount: string | number;
    reward_label: string | null;
    is_active: boolean;
}

interface Award {
    id: number;
    average_score: string | number;
    scored_days: number;
    reward_amount: string | number;
    status: string;
    period_start: string;
    period_end: string;
    driver: { id: number; name: string } | null;
    rule: { id: number; name: string } | null;
}

interface Props {
    rules: Rule[];
    awards: Award[];
    can: { create: boolean; update: boolean; delete: boolean; award: boolean };
}

const AWARD_ACTIONS = [
    {
        status: 'approved',
        idle: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100',
        active: 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
        ),
    },
    {
        status: 'paid',
        idle: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100',
        active: 'border-sky-600 bg-sky-600 text-white shadow-sm ring-2 ring-sky-200',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
            </svg>
        ),
    },
    {
        status: 'rejected',
        idle: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100',
        active: 'border-rose-600 bg-rose-600 text-white shadow-sm ring-2 ring-rose-200',
        icon: (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
] as const;

function awardStatusBadgeClass(status: string): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
        case 'paid':
            return 'bg-sky-100 text-sky-800 ring-sky-600/20';
        case 'rejected':
            return 'bg-rose-100 text-rose-800 ring-rose-600/20';
        default:
            return 'bg-amber-100 text-amber-800 ring-amber-600/20';
    }
}

export default function Index({ rules, awards, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [deletingRule, setDeletingRule] = useState<Rule | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const form = useForm({
        name: '',
        period: 'weekly',
        min_score: '85',
        min_days: '5',
        reward_amount: '250000',
        reward_label: 'Bonus aman berkendara',
        is_active: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('scoring.incentives.store'), { onSuccess: () => form.reset('name') });
    };

    const periodLabel = (period: string): string =>
        t(`scoring.types.${period}`, undefined, period);

    const updateAwardStatus = (awardId: number, status: string): void => {
        router.post(prefixedRoute('scoring.awards.status', awardId), { status }, { preserveScroll: true });
    };

    const confirmDeleteRule = (): void => {
        if (!deletingRule) {
            return;
        }

        setProcessingDelete(true);
        router.delete(prefixedRoute('scoring.incentives.destroy', deletingRule.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingRule(null),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {t('scoring.pages.incentives.title')}
                </h2>
            }
        >
            <Head title={t('scoring.pages.incentives.title')} />

            <ScoringNav />

            <div className="mb-6 flex justify-end">
                {can.award && (
                    <PrimaryButton onClick={() => router.post(prefixedRoute('scoring.incentives.evaluate'))}>
                        {t('scoring.actions.evaluate_awards')}
                    </PrimaryButton>
                )}
            </div>

            {can.create && (
                <form onSubmit={submit} className="mb-6 space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h3 className="font-medium text-gray-900">New incentive rule</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel value={t('scoring.fields.name')} />
                            <TextInput className="mt-1 block w-full" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                            <InputError message={form.errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={t('scoring.fields.period')} />
                            <Select
                                className="mt-1"
                                value={form.data.period}
                                onChange={(value) => form.setData('period', value)}
                                options={[
                                    { value: 'weekly', label: t('scoring.types.weekly') },
                                    { value: 'monthly', label: t('scoring.types.monthly') },
                                ]}
                            />
                        </div>
                        <div>
                            <InputLabel value={t('scoring.fields.min_avg_score')} />
                            <TextInput type="number" className="mt-1 block w-full" value={form.data.min_score} onChange={(e) => form.setData('min_score', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value={t('scoring.fields.min_scored_days')} />
                            <TextInput type="number" className="mt-1 block w-full" value={form.data.min_days} onChange={(e) => form.setData('min_days', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value={t('scoring.fields.reward_amount')} />
                            <TextInput type="number" className="mt-1 block w-full" value={form.data.reward_amount} onChange={(e) => form.setData('reward_amount', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel value={t('scoring.fields.reward_label')} />
                            <TextInput className="mt-1 block w-full" value={form.data.reward_label} onChange={(e) => form.setData('reward_label', e.target.value)} />
                        </div>
                    </div>
                    <PrimaryButton disabled={form.processing}>{t('scoring.actions.create_rule')}</PrimaryButton>
                </form>
            )}

            <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b px-4 py-3 font-medium">Rules</div>
                <ul className="divide-y divide-gray-100 text-sm">
                    {rules.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500">{t('scoring.pages.incentives.empty_rules')}</li>
                    ) : (
                        rules.map((rule) => (
                            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                <div>
                                    <div className="font-medium">{rule.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {periodLabel(rule.period)} · min score {rule.min_score} · {rule.min_days} days · Rp{' '}
                                        {Number(rule.reward_amount).toLocaleString()}
                                        {!rule.is_active && ` · ${t('scoring.status.inactive')}`}
                                    </div>
                                </div>
                                {can.delete && (
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => setDeletingRule(rule)}
                                    >
                                        {t('common.delete')}
                                    </SecondaryButton>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b px-4 py-3 font-medium">Awards</div>
                <ul className="divide-y divide-gray-100 text-sm">
                    {awards.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-500">{t('scoring.pages.incentives.empty_awards')}</li>
                    ) : (
                        awards.map((award) => (
                            <li key={award.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-gray-900">
                                            {award.driver?.name ?? t('scoring.fields.driver')}
                                        </span>
                                        <span className="text-gray-300">·</span>
                                        <span className="truncate text-gray-600">{award.rule?.name}</span>
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${awardStatusBadgeClass(award.status)}`}
                                        >
                                            {t(`scoring.status.${award.status}`, undefined, award.status)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {award.period_start} → {award.period_end} · avg {award.average_score} · Rp{' '}
                                        {Number(award.reward_amount).toLocaleString()}
                                    </div>
                                </div>

                                {can.award && (
                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                        {AWARD_ACTIONS.map((action) => {
                                            const isActive = award.status === action.status;

                                            return (
                                                <button
                                                    key={action.status}
                                                    type="button"
                                                    disabled={isActive}
                                                    onClick={() => updateAwardStatus(award.id, action.status)}
                                                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-default ${
                                                        isActive ? action.active : action.idle
                                                    }`}
                                                >
                                                    {action.icon}
                                                    {t(`scoring.status.${action.status}`)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <ConfirmDeleteDialog
                show={!!deletingRule}
                onClose={() => !processingDelete && setDeletingRule(null)}
                onConfirm={confirmDeleteRule}
                processing={processingDelete}
                title={t('scoring.pages.incentives.delete_rule_title')}
                message={
                    deletingRule
                        ? t('scoring.pages.incentives.delete_rule_confirm', { name: deletingRule.name })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}

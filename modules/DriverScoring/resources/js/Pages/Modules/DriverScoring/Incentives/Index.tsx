import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
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

const AWARD_STATUSES = ['approved', 'paid', 'rejected'] as const;

export default function Index({ rules, awards, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
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

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('scoring.pages.incentives.title')}</h2>}>
            <Head title={t('scoring.pages.incentives.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ScoringNav />

                    <div className="flex justify-end">
                        {can.award && (
                            <PrimaryButton onClick={() => router.post(prefixedRoute('scoring.incentives.evaluate'))}>
                                {t('scoring.actions.evaluate_awards')}
                            </PrimaryButton>
                        )}
                    </div>

                    {can.create && (
                        <form onSubmit={submit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
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

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
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
                                                onClick={() => router.delete(prefixedRoute('scoring.incentives.destroy', rule.id))}
                                            >
                                                {t('common.delete')}
                                            </SecondaryButton>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b px-4 py-3 font-medium">Awards</div>
                        <ul className="divide-y divide-gray-100 text-sm">
                            {awards.length === 0 ? (
                                <li className="px-4 py-8 text-center text-gray-500">{t('scoring.pages.incentives.empty_awards')}</li>
                            ) : (
                                awards.map((award) => (
                                    <li key={award.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                        <div>
                                            <div className="font-medium">
                                                {award.driver?.name ?? t('scoring.fields.driver')} · {award.rule?.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {award.period_start} → {award.period_end} · avg {award.average_score} · Rp{' '}
                                                {Number(award.reward_amount).toLocaleString()} · {t(`scoring.status.${award.status}`, undefined, award.status)}
                                            </div>
                                        </div>
                                        {can.award && (
                                            <div className="flex gap-2">
                                                {AWARD_STATUSES.map((status) => (
                                                    <SecondaryButton
                                                        key={status}
                                                        type="button"
                                                        onClick={() =>
                                                            router.post(prefixedRoute('scoring.awards.status', award.id), {
                                                                status,
                                                            })
                                                        }
                                                    >
                                                        {t(`scoring.status.${status}`)}
                                                    </SecondaryButton>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

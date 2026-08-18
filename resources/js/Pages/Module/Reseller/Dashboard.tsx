import CommissionTable from '@/Components/Reseller/CommissionTable';
import ResellerLandingPageForm from '@/Components/Reseller/ResellerLandingPageForm';
import StatCard from '@/Components/Reseller/StatCard';
import { CommissionRow, EarningsSummary, MonthlyPoint, ResellerLandingPage } from '@/Components/Reseller/types';
import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    summary: EarningsSummary;
    series: MonthlyPoint[];
    recent: CommissionRow[];
    referral: { code: string; url: string };
    profile: {
        status: string;
        bank_name: string | null;
        account_number: string | null;
        account_name: string | null;
        minimum_payout: number;
    };
    landing: ResellerLandingPage;
}

export default function Dashboard({ summary, series, recent, referral, profile, landing }: Props): JSX.Element {
    const { t } = useTrans();
    const [copied, setCopied] = useState(false);

    const peak = Math.max(...series.map((point) => point.total), 1);
    const hasEarnings = series.some((point) => point.total > 0);

    const copyReferral = async () => {
        try {
            await navigator.clipboard.writeText(referral.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.portal_title')} description={t('reseller.portal_subtitle')} />}>
            <Head title={t('reseller.portal_title')} />

            <div className="space-y-6">
                {profile.status !== 'active' && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                        {t(`reseller.status.${profile.status}`)}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={t('reseller.stats.this_month')}
                        value={formatMoney(summary.this_month)}
                        hint={t('reseller.stats.this_month_hint')}
                        tone="indigo"
                    />
                    <StatCard
                        label={t('reseller.stats.pending')}
                        value={formatMoney(summary.pending)}
                        hint={t('reseller.stats.pending_hint')}
                        tone="amber"
                    />
                    <StatCard
                        label={t('reseller.stats.approved')}
                        value={formatMoney(summary.approved)}
                        hint={t('reseller.stats.approved_hint')}
                        tone="sky"
                    />
                    <StatCard
                        label={t('reseller.stats.paid')}
                        value={formatMoney(summary.paid)}
                        hint={t('reseller.stats.paid_hint')}
                        tone="emerald"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.chart.title')}</h3>

                        {hasEarnings ? (
                            <div className="mt-6 flex h-48 items-end gap-3">
                                {series.map((point) => (
                                    <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                                        <div className="w-full flex-1 flex items-end">
                                            <div
                                                className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-purple-500 transition-all"
                                                style={{ height: `${Math.max((point.total / peak) * 100, 2)}%` }}
                                                title={formatMoney(point.total)}
                                            />
                                        </div>
                                        <span className="text-[11px] text-slate-400">{point.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-8 text-center text-sm text-slate-400">{t('reseller.chart.empty')}</p>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-indigo-500/15 bg-gradient-to-br from-indigo-500/10 to-transparent p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.referral.title')}</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('reseller.referral.hint')}</p>

                            <div className="mt-4 rounded-xl bg-white/70 p-3 font-mono text-lg font-bold tracking-widest text-indigo-600 dark:bg-slate-900/60 dark:text-indigo-400">
                                {referral.code}
                            </div>

                            <button
                                type="button"
                                onClick={copyReferral}
                                className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                {copied ? t('reseller.referral.copied') : t('reseller.referral.copy')}
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {t('reseller.profile.payout_account')}
                            </h3>
                            {profile.account_number ? (
                                <dl className="mt-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_bank_name')}</dt>
                                        <dd className="font-medium text-slate-900 dark:text-white">{profile.bank_name ?? '—'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_account_number')}</dt>
                                        <dd className="font-mono text-slate-900 dark:text-white">{profile.account_number}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500 dark:text-slate-400">{t('reseller.profile.payout_account_name')}</dt>
                                        <dd className="font-medium text-slate-900 dark:text-white">{profile.account_name ?? '—'}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">{t('reseller.profile.payout_missing')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <ResellerLandingPageForm landing={landing} />

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.table.recent')}</h3>
                        <Link
                            href={route('module.reseller.commissions')}
                            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            {t('reseller.table.view_all')} →
                        </Link>
                    </div>
                    <CommissionTable rows={recent} />
                </div>
            </div>
        </DynamicLayout>
    );
}

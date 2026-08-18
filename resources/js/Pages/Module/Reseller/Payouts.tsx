import Pagination from '@/Components/Reseller/Pagination';
import PayoutStatusBadge from '@/Components/Reseller/PayoutStatusBadge';
import StatCard from '@/Components/Reseller/StatCard';
import { EarningsSummary, Paginated, PayoutRow } from '@/Components/Reseller/types';
import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head } from '@inertiajs/react';

interface Props {
    payouts: Paginated<PayoutRow>;
    summary: EarningsSummary;
}

export default function Payouts({ payouts, summary }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.payout.my_title')} />}>
            <Head title={t('reseller.payout.my_title')} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label={t('reseller.stats.approved')} value={formatMoney(summary.approved)} tone="sky" />
                    <StatCard label={t('reseller.stats.paid')} value={formatMoney(summary.paid)} tone="emerald" />
                    <StatCard label={t('reseller.stats.lifetime')} value={formatMoney(summary.lifetime)} tone="indigo" />
                </div>

                {payouts.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {t('reseller.payout.my_empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.reference')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.period')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.payout.gross')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.payout.net')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.status')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.paid_at')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.proof')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payouts.data.map((payout) => (
                                    <tr key={payout.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-white">{payout.reference}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {payout.period_start} → {payout.period_end}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                                            {formatMoney(payout.gross_amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                                            {formatMoney(payout.net_amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <PayoutStatusBadge status={payout.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {payout.paid_at ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {payout.proof_url ? (
                                                <a
                                                    href={payout.proof_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                                >
                                                    {t('reseller.payout.view_proof')}
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination links={payouts.links} />
            </div>
        </DynamicLayout>
    );
}

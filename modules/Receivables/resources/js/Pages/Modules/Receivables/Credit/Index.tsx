import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';
import { Head, Link } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface PartnerCredit {
    id: number;
    code: string;
    name: string;
    credit_limit: number;
    outstanding: number;
    available: number;
    utilization: number;
    is_over_limit: boolean;
}

interface Props {
    partners: PartnerCredit[];
    alerts: { over_limit_count: number };
}

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

const BanknotesIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
    </svg>
);

export default function Index({ partners, alerts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={<PageHeader title={t('receivables.credit.index.title')} />}
        >
            <Head title={t('receivables.credit.index.title')} />

            <ReceivablesNav />

            <div className="space-y-6">
                {alerts.over_limit_count > 0 && (
                    <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-900 dark:text-rose-200 shadow-sm">
                        ⚠️ {t('receivables.credit.index.over_limit_alert', { count: alerts.over_limit_count })}
                    </div>
                )}

                {/* Credit Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.partner')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.limit')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.outstanding')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.available')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.utilization')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {partners.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold">
                                            {t('receivables.credit.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    partners.map((partner) => (
                                        <tr
                                            key={partner.id}
                                            className={`group transition ${
                                                partner.is_over_limit
                                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/40'
                                                    : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                                            }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                                <span className="font-mono text-slate-400 font-normal">{partner.code} — </span>
                                                {partner.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(partner.credit_limit)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(partner.outstanding)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(partner.available)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-extrabold">
                                                <span
                                                    className={
                                                        partner.is_over_limit
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : partner.utilization >= 80
                                                              ? 'text-amber-600 dark:text-amber-400'
                                                              : 'text-slate-900 dark:text-white'
                                                    }
                                                >
                                                    {partner.utilization.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('partners.show', partner.id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                                        title={t('common.view')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                    {partner.outstanding > 0 && (
                                                        <Link
                                                            href={`${prefixedRoute('receivables.payments.create')}?partner_id=${partner.id}`}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                                                            title={t('receivables.actions.pay')}
                                                        >
                                                            <BanknotesIcon />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

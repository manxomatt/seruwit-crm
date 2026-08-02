import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';
import PageHeader from '@/Components/PageHeader';

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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                        {t('receivables.credit.index.over_limit_alert', { count: alerts.over_limit_count })}
                    </div>
                )}

                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.partner')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.limit')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.outstanding')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.available')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.utilization')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            {t('receivables.credit.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    partners.map((partner) => (
                                        <tr
                                            key={partner.id}
                                            className={partner.is_over_limit ? 'bg-red-50/50' : 'hover:bg-gray-50'}
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {partner.code} — {partner.name}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {formatMoney(partner.credit_limit)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {formatMoney(partner.outstanding)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {formatMoney(partner.available)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <span
                                                    className={`font-semibold tabular-nums ${
                                                        partner.is_over_limit
                                                            ? 'text-red-700'
                                                            : partner.utilization >= 80
                                                              ? 'text-amber-700'
                                                              : 'text-gray-800'
                                                    }`}
                                                >
                                                    {partner.utilization.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('partners.show', partner.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title={t('common.view')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                    {partner.outstanding > 0 && (
                                                        <Link
                                                            href={`${prefixedRoute('receivables.payments.create')}?partner_id=${partner.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900"
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

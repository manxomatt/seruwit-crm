import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
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

export default function Index({ partners, alerts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('receivables.credit.index.title')}</h2>}>
            <Head title={t('receivables.credit.index.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    {alerts.over_limit_count > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                            {t('receivables.credit.index.over_limit_alert', { count: alerts.over_limit_count })}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.partner')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.limit')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.outstanding')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.available')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.utilization')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {partners.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('receivables.credit.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    partners.map((p) => (
                                        <tr key={p.id} className={p.is_over_limit ? 'bg-red-50/50' : ''}>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('partners.show', p.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {p.code} — {p.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(p.credit_limit)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(p.outstanding)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(p.available)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`font-semibold tabular-nums ${
                                                        p.is_over_limit
                                                            ? 'text-red-700'
                                                            : p.utilization >= 80
                                                              ? 'text-amber-700'
                                                              : 'text-gray-800'
                                                    }`}
                                                >
                                                    {p.utilization.toFixed(1)}%
                                                </span>
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

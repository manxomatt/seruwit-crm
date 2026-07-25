import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';

interface AgingRow {
    invoice_id: number;
    code: string;
    partner: { id: number; code: string; name: string };
    issue_date: string | null;
    due_date: string | null;
    total: number;
    amount_paid: number;
    balance: number;
    days_past_due: number;
    bucket: string;
    is_overdue: boolean;
}

interface Props {
    buckets: Record<string, number>;
    overdue_count: number;
    overdue_amount: number;
    rows: AgingRow[];
}

export default function Index({ buckets, overdue_count, overdue_amount, rows }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('receivables.aging.index.title')}</h2>}>
            <Head title={t('receivables.aging.index.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ReceivablesNav />

                    {overdue_count > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                            {t('receivables.aging.index.alert', {
                                count: overdue_count,
                                amount: formatMoney(overdue_amount),
                            })}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-5">
                        {Object.entries(buckets).map(([key, value]) => (
                            <div key={key} className="rounded-lg border border-gray-200 bg-white p-4">
                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                    {t(`receivables.buckets.${key}`, undefined, key)}
                                </p>
                                <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(value)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.invoice')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.partner')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.due')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.balance')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('receivables.fields.days_past_due')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('receivables.fields.bucket')}</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            {t('receivables.aging.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.invoice_id} className={row.is_overdue ? 'bg-red-50/40' : ''}>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('invoicing.invoices.show', row.invoice_id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {row.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{row.partner.name}</td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {row.due_date ? new Date(row.due_date).toLocaleDateString(localeTag) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(row.balance)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{row.days_past_due}</td>
                                            <td className="px-4 py-3">
                                                {t(`receivables.buckets.${row.bucket}`, undefined, row.bucket)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`${prefixedRoute('receivables.payments.create')}?partner_id=${row.partner.id}&invoice_id=${row.invoice_id}`}
                                                >
                                                    <PrimaryButton type="button">{t('receivables.actions.pay')}</PrimaryButton>
                                                </Link>
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

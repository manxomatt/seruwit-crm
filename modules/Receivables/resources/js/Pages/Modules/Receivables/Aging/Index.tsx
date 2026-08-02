import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link } from '@inertiajs/react';
import ReceivablesNav from '../../../../ReceivablesNav';
import PageHeader from '@/Components/PageHeader';

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

export default function Index({ buckets, overdue_count, overdue_amount, rows }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    return (
        <DynamicLayout
            header={<PageHeader title={t('receivables.aging.index.title')} />}
        >
            <Head title={t('receivables.aging.index.title')} />

            <ReceivablesNav />

            <div className="space-y-6">
                {overdue_count > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                        {t('receivables.aging.index.alert', {
                            count: overdue_count,
                            amount: formatMoney(overdue_amount),
                        })}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {Object.entries(buckets).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                                {t(`receivables.buckets.${key}`, undefined, key)}
                            </p>
                            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                                {formatMoney(value)}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.invoice')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.partner')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.due')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.balance')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.days_past_due')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('receivables.fields.bucket')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('common.actions')}
                                    </th>
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
                                        <tr key={row.invoice_id} className={row.is_overdue ? 'bg-red-50/40' : 'hover:bg-gray-50'}>
                                            <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                {row.code}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{row.partner.name}</td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                {row.due_date
                                                    ? new Date(row.due_date).toLocaleDateString(localeTag)
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {formatMoney(row.balance)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                                                {row.days_past_due}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                {t(`receivables.buckets.${row.bucket}`, undefined, row.bucket)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('invoicing.invoices.show', row.invoice_id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title={t('common.view')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                    <Link
                                                        href={`${prefixedRoute('receivables.payments.create')}?partner_id=${row.partner.id}&invoice_id=${row.invoice_id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title={t('receivables.actions.pay')}
                                                    >
                                                        <BanknotesIcon />
                                                    </Link>
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

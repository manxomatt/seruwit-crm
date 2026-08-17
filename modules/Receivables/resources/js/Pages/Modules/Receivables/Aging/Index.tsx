import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';
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
                    <div className="rounded-3xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-900 dark:text-rose-200 shadow-sm">
                        ⚠️ {t('receivables.aging.index.alert', {
                            count: overdue_count,
                            amount: formatMoney(overdue_amount),
                        })}
                    </div>
                )}

                {/* Aging Buckets Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Object.entries(buckets).map(([key, value]) => (
                        <div key={key} className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {t(`receivables.buckets.${key}`, undefined, key)}
                            </p>
                            <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                                {formatMoney(value)}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Aging Rows Table */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.invoice')}
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.partner')}
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.due')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.balance')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.days_past_due')}
                                    </th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                        {t('receivables.fields.bucket')}
                                    </th>
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                        {t('common.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-bold">
                                            {t('receivables.aging.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.invoice_id} className={`group transition ${row.is_overdue ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/80 dark:hover:bg-rose-950/40' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                                                {row.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{row.partner.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                {row.due_date
                                                    ? new Date(row.due_date).toLocaleDateString(localeTag)
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {formatMoney(row.balance)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {row.days_past_due}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                                    {t(`receivables.buckets.${row.bucket}`, undefined, row.bucket)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={prefixedRoute('invoicing.invoices.show', row.invoice_id)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                                        title={t('common.view')}
                                                    >
                                                        <EyeIcon />
                                                    </Link>
                                                    <Link
                                                        href={`${prefixedRoute('receivables.payments.create')}?partner_id=${row.partner.id}&invoice_id=${row.invoice_id}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
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

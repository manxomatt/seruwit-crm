import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Row {
    entry_date: string;
    journal_number: string;
    event: string | null;
    memo: string | null;
    source_type: string | null;
    source_id: number | null;
    debit: number;
    credit: number;
    net: number;
}

interface Props {
    from: string;
    to: string;
    account: { id: number; code: string; name: string } | null;
    rows: Row[];
    totals: { debit: number; credit: number; net: number };
    by_event: Array<{ event: string; net: number; count: number }>;
}

export default function TravelRevenue({ from, to, account, rows, totals, by_event }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ from, to });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(prefixedRoute('accounting.reports.travel-revenue'), form.data, { preserveState: true });
    };

    return (
        <AccountingShell active="travel_revenue" title={t('accounting.travel_revenue.title')}>
            <p className="mb-4 text-sm text-gray-600">{t('accounting.travel_revenue.hint')}</p>

            {account ? (
                <p className="mb-4 text-sm text-gray-700">
                    {t('accounting.travel_revenue.account')}:{' '}
                    <span className="font-medium">
                        {account.code} — {account.name}
                    </span>
                </p>
            ) : (
                <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {t('accounting.travel_revenue.missing_account')}
                </p>
            )}

            <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel value={t('accounting.travel_revenue.from')} />
                    <TextInput type="date" className="mt-1" value={form.data.from} onChange={(e) => form.setData('from', e.target.value)} />
                </div>
                <div>
                    <InputLabel value={t('accounting.travel_revenue.to')} />
                    <TextInput type="date" className="mt-1" value={form.data.to} onChange={(e) => form.setData('to', e.target.value)} />
                </div>
                <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
            </form>

            {by_event.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    {by_event.map((bucket) => (
                        <div key={bucket.event} className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-xs font-medium uppercase text-gray-500">{bucket.event}</div>
                            <div className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(bucket.net)}</div>
                            <div className="text-xs text-gray-500">
                                {t('accounting.travel_revenue.entries', { count: bucket.count })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.travel_revenue.columns.date')}</th>
                            <th className="px-4 py-3">{t('accounting.travel_revenue.columns.journal')}</th>
                            <th className="px-4 py-3">{t('accounting.travel_revenue.columns.event')}</th>
                            <th className="px-4 py-3">{t('accounting.travel_revenue.columns.memo')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.travel_revenue.columns.debit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.travel_revenue.columns.credit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.travel_revenue.columns.net')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.travel_revenue.empty')}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={`${row.journal_number}-${row.entry_date}-${row.debit}-${row.credit}`} className="border-b">
                                    <td className="px-4 py-3 text-sm">{row.entry_date}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{row.journal_number}</td>
                                    <td className="px-4 py-3 text-sm">{row.event || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{row.memo || '—'}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.debit)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.credit)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">{formatMoney(row.net)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                            <td colSpan={4} className="px-4 py-3 text-sm">
                                {t('accounting.travel_revenue.totals')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.debit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.credit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.net)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </AccountingShell>
    );
}

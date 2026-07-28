import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';

interface Props {
    period: { id: number; name: string; starts_on: string; ends_on: string; status: string };
    periods: Array<{ id: number; name: string }>;
    rows: Array<{ account_id: number; code: string; name: string; type: string; debit: number; credit: number }>;
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
}

export default function TrialBalance({ period, periods, rows, total_debit, total_credit, is_balanced }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell active="trial_balance" title={t('accounting.trial_balance.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.trial_balance.period')}</span>
                    <Select
                        className="w-56"
                        searchable
                        value={String(period.id)}
                        onChange={(value) =>
                            router.get(
                                prefixedRoute('accounting.reports.trial-balance'),
                                { period_id: value },
                                { preserveState: true },
                            )
                        }
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.no_options')}
                        noResultsText={t('common.no_results')}
                        options={periods.map((p) => ({
                            value: String(p.id),
                            label: p.name,
                        }))}
                    />
                </div>
                <span className={`text-sm ${is_balanced ? 'text-green-700' : 'text-red-600'}`}>
                    {is_balanced ? t('accounting.trial_balance.balanced') : t('accounting.trial_balance.unbalanced')}
                </span>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.debit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.credit')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.trial_balance.empty')}
                                </td>
                            </tr>
                        )}
                        {rows.map((row) => (
                            <tr key={row.account_id} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                                <td className="px-4 py-3 text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">
                                    {row.debit > 0 ? formatMoney(row.debit) : ''}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">
                                    {row.credit > 0 ? formatMoney(row.credit) : ''}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm">
                                {t('accounting.journals.totals')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_debit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_credit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

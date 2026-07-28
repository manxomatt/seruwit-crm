import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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
                <label className="text-sm text-gray-600">
                    {t('accounting.trial_balance.period')}
                    <select
                        className="ml-2 rounded-md border-gray-300 text-sm shadow-sm"
                        value={period.id}
                        onChange={(e) =>
                            router.get(
                                prefixedRoute('accounting.reports.trial-balance'),
                                { period_id: e.target.value },
                                { preserveState: true },
                            )
                        }
                    >
                        {periods.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </label>
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

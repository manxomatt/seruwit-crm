import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';

interface Row {
    account_id: number;
    code: string;
    name: string;
    type: string;
    amount: number;
}

interface Props {
    period: { id: number; name: string; starts_on: string; ends_on: string; status: string };
    periods: Array<{ id: number; name: string }>;
    revenues: Row[];
    expenses: Row[];
    total_revenue: number;
    total_expense: number;
    net_income: number;
}

export default function ProfitAndLoss({
    period,
    periods,
    revenues,
    expenses,
    total_revenue,
    total_expense,
    net_income,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell active="profit_loss" title={t('accounting.profit_loss.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.profit_loss.period')}</span>
                    <Select
                        className="w-56"
                        searchable
                        value={String(period.id)}
                        onChange={(value) =>
                            router.get(
                                prefixedRoute('accounting.reports.profit-loss'),
                                { period_id: value },
                                { preserveState: true },
                            )
                        }
                        options={periods.map((p) => ({
                            value: String(p.id),
                            label: p.name,
                        }))}
                    />
                </div>
                <span className="text-sm text-gray-500">
                    {period.starts_on} → {period.ends_on}
                </span>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.profit_loss.amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-slate-50">
                            <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase text-gray-600">
                                {t('accounting.profit_loss.revenues')}
                            </td>
                        </tr>
                        {revenues.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">
                                    {t('accounting.profit_loss.empty_section')}
                                </td>
                            </tr>
                        )}
                        {revenues.map((row) => (
                            <tr key={`rev-${row.account_id}`} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                                <td className="px-4 py-3 text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.amount)}</td>
                            </tr>
                        ))}
                        <tr className="border-b bg-gray-50 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm">
                                {t('accounting.profit_loss.total_revenue')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_revenue)}</td>
                        </tr>

                        <tr className="bg-slate-50">
                            <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase text-gray-600">
                                {t('accounting.profit_loss.expenses')}
                            </td>
                        </tr>
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">
                                    {t('accounting.profit_loss.empty_section')}
                                </td>
                            </tr>
                        )}
                        {expenses.map((row) => (
                            <tr key={`exp-${row.account_id}`} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                                <td className="px-4 py-3 text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.amount)}</td>
                            </tr>
                        ))}
                        <tr className="border-b bg-gray-50 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm">
                                {t('accounting.profit_loss.total_expense')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_expense)}</td>
                        </tr>

                        <tr className="bg-indigo-50 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm">
                                {t('accounting.profit_loss.net_income')}
                            </td>
                            <td className={`px-4 py-3 text-right tabular-nums text-sm ${net_income < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                                {formatMoney(net_income)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

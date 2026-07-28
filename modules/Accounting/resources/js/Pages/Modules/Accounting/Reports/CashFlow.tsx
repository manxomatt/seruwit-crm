import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';

interface Adjustment {
    key: string;
    label: string;
    amount: number;
}

interface Props {
    period: { id: number; name: string; starts_on: string; ends_on: string; status: string };
    periods: Array<{ id: number; name: string }>;
    opening_cash: number;
    closing_cash: number;
    net_cash_change: number;
    net_income: number;
    adjustments: Adjustment[];
    cash_from_operations: number;
    investing_financing_other: number;
}

export default function CashFlow({
    period,
    periods,
    opening_cash,
    closing_cash,
    net_cash_change,
    net_income,
    adjustments,
    cash_from_operations,
    investing_financing_other,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell active="cash_flow" title={t('accounting.cash_flow.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.cash_flow.period')}</span>
                    <Select
                        className="w-56"
                        searchable
                        value={String(period.id)}
                        onChange={(value) =>
                            router.get(prefixedRoute('accounting.reports.cash-flow'), { period_id: value }, { preserveState: true })
                        }
                        options={periods.map((p) => ({ value: String(p.id), label: p.name }))}
                    />
                </div>
                <span className="text-sm text-gray-500">
                    {period.starts_on} → {period.ends_on}
                </span>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <tbody>
                        <tr className="border-b">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.opening_cash')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(opening_cash)}</td>
                        </tr>
                        <tr className="bg-slate-50">
                            <td colSpan={2} className="px-4 py-2 text-xs font-semibold uppercase text-gray-600">
                                {t('accounting.cash_flow.operating')}
                            </td>
                        </tr>
                        <tr className="border-b">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.net_income')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(net_income)}</td>
                        </tr>
                        {adjustments.map((row) => (
                            <tr key={row.key} className="border-b">
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {t(`accounting.cash_flow.adj.${row.label}`, undefined, row.label)}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.amount)}</td>
                            </tr>
                        ))}
                        <tr className="border-b bg-gray-50 font-semibold">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.cash_from_operations')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(cash_from_operations)}</td>
                        </tr>
                        <tr className="border-b">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.other')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(investing_financing_other)}</td>
                        </tr>
                        <tr className="border-b bg-indigo-50 font-semibold">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.net_change')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(net_cash_change)}</td>
                        </tr>
                        <tr className="font-semibold">
                            <td className="px-4 py-3 text-sm">{t('accounting.cash_flow.closing_cash')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(closing_cash)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

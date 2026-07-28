import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { Link, router } from '@inertiajs/react';

interface Row {
    account_id: number;
    code: string;
    name: string;
    type: string;
    budget: number;
    actual: number;
    variance: number;
}

interface Props {
    year: number;
    years: Array<{ id: number; year: number }>;
    period: { id: number; name: string };
    periods: Array<{ id: number; name: string; period_index: number }>;
    budgets: Array<{ id: number; name: string; is_active: boolean }>;
    budget_id: number | null;
    rows: Row[];
    total_budget: number;
    total_actual: number;
    total_variance: number;
    can: { manage: boolean };
}

export default function Index({
    year,
    years,
    period,
    periods,
    budgets,
    budget_id,
    rows,
    total_budget,
    total_actual,
    total_variance,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const reload = (params: Record<string, string | number>) => {
        router.get(prefixedRoute('accounting.budgets.index'), params, { preserveState: true });
    };

    return (
        <AccountingShell
            active="budgets"
            title={t('accounting.budget.title')}
            headerActions={
                can.manage ? (
                    <Link href={prefixedRoute('accounting.budgets.create')}>
                        <PrimaryButton type="button">{t('accounting.budget.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select
                    className="w-28"
                    value={String(year)}
                    onChange={(value) => reload({ year: value, period_id: period.id, budget_id: budget_id ?? '' })}
                    options={years.map((y) => ({ value: String(y.year), label: String(y.year) }))}
                />
                <Select
                    className="w-56"
                    value={String(period.id)}
                    onChange={(value) => reload({ year, period_id: value, budget_id: budget_id ?? '' })}
                    options={periods.map((p) => ({ value: String(p.id), label: p.name }))}
                />
                <Select
                    className="w-56"
                    value={budget_id ? String(budget_id) : ''}
                    onChange={(value) => reload({ year, period_id: period.id, budget_id: value })}
                    options={budgets.map((b) => ({ value: String(b.id), label: b.name }))}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.budget.budget')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.budget.actual')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.budget.variance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.account_id} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                                <td className="px-4 py-3 text-sm">{row.name}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.budget)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.actual)}</td>
                                <td className={`px-4 py-3 text-right tabular-nums text-sm ${row.variance < 0 ? 'text-red-700' : ''}`}>
                                    {formatMoney(row.variance)}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.budget.empty')}
                                </td>
                            </tr>
                        )}
                        {rows.length > 0 && (
                            <tr className="bg-gray-50 font-semibold">
                                <td colSpan={2} className="px-4 py-3 text-sm">
                                    {t('accounting.budget.totals')}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_budget)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_actual)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_variance)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

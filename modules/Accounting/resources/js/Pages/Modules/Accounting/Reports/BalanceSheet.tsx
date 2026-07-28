import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';

interface Row {
    account_id: number | null;
    code: string;
    name: string;
    type: string;
    amount: number;
    is_synthetic?: boolean;
}

interface Props {
    period: { id: number; name: string; starts_on: string; ends_on: string; status: string };
    periods: Array<{ id: number; name: string }>;
    assets: Row[];
    liabilities: Row[];
    equity: Row[];
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    net_income_ytd: number;
    is_balanced: boolean;
}

function Section({
    title,
    rows,
    totalLabel,
    total,
}: {
    title: string;
    rows: Row[];
    totalLabel: string;
    total: number;
}): JSX.Element {
    const { t } = useTrans();

    return (
        <>
            <tr className="bg-slate-50">
                <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase text-gray-600">
                    {title}
                </td>
            </tr>
            {rows.length === 0 && (
                <tr>
                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-500">
                        {t('accounting.balance_sheet.empty_section')}
                    </td>
                </tr>
            )}
            {rows.map((row, index) => (
                <tr key={`${row.code}-${row.account_id ?? 'syn'}-${index}`} className="border-b">
                    <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                    <td className={`px-4 py-3 text-sm ${row.is_synthetic ? 'italic text-gray-700' : ''}`}>{row.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.amount)}</td>
                </tr>
            ))}
            <tr className="border-b bg-gray-50 font-semibold">
                <td colSpan={2} className="px-4 py-3 text-sm">
                    {totalLabel}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total)}</td>
            </tr>
        </>
    );
}

export default function BalanceSheet({
    period,
    periods,
    assets,
    liabilities,
    equity,
    total_assets,
    total_liabilities,
    total_equity,
    is_balanced,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell active="balance_sheet" title={t('accounting.balance_sheet.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.balance_sheet.as_of')}</span>
                    <Select
                        className="w-56"
                        searchable
                        value={String(period.id)}
                        onChange={(value) =>
                            router.get(
                                prefixedRoute('accounting.reports.balance-sheet'),
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
                <span className="text-sm text-gray-500">{period.ends_on}</span>
                <span className={`text-sm ${is_balanced ? 'text-green-700' : 'text-red-600'}`}>
                    {is_balanced ? t('accounting.balance_sheet.balanced') : t('accounting.balance_sheet.unbalanced')}
                </span>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.balance_sheet.amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <Section
                            title={t('accounting.balance_sheet.assets')}
                            rows={assets}
                            totalLabel={t('accounting.balance_sheet.total_assets')}
                            total={total_assets}
                        />
                        <Section
                            title={t('accounting.balance_sheet.liabilities')}
                            rows={liabilities}
                            totalLabel={t('accounting.balance_sheet.total_liabilities')}
                            total={total_liabilities}
                        />
                        <Section
                            title={t('accounting.balance_sheet.equity')}
                            rows={equity}
                            totalLabel={t('accounting.balance_sheet.total_equity')}
                            total={total_equity}
                        />
                        <tr className="bg-indigo-50 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm">
                                {t('accounting.balance_sheet.total_liabilities_equity')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">
                                {formatMoney(total_liabilities + total_equity)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

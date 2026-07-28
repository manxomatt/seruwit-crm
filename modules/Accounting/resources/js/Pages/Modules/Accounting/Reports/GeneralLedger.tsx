import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { formatMoney } from '@/utils/money';
import { Link, router } from '@inertiajs/react';

interface Row {
    id: number;
    entry_date: string | null;
    journal_id: number;
    journal_number: string | null;
    memo: string | null;
    partner: { id: number; code: string; name: string } | null;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    period: { id: number; name: string; starts_on: string; ends_on: string; status: string };
    periods: Array<{ id: number; name: string }>;
    accounts: Array<{ id: number; code: string; name: string }>;
    account_id: number | null;
    account: { id: number; code: string; name: string; type: string } | null;
    opening_balance: number;
    rows: Row[];
    period_debit: number;
    period_credit: number;
    closing_balance: number;
}

export default function GeneralLedger({
    period,
    periods,
    accounts,
    account_id,
    account,
    opening_balance,
    rows,
    period_debit,
    period_credit,
    closing_balance,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const reload = (params: Record<string, string | number>) => {
        router.get(prefixedRoute('accounting.reports.general-ledger'), params, { preserveState: true });
    };

    return (
        <AccountingShell active="general_ledger" title={t('accounting.gl.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select
                    className="w-56"
                    searchable
                    value={String(period.id)}
                    onChange={(value) => reload({ period_id: value, account_id: account_id ?? '' })}
                    options={periods.map((p) => ({ value: String(p.id), label: p.name }))}
                />
                <Select
                    className="min-w-[16rem]"
                    searchable
                    value={account_id ? String(account_id) : ''}
                    onChange={(value) => reload({ period_id: period.id, account_id: value })}
                    options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }))}
                />
            </div>

            {account && (
                <p className="mb-3 text-sm text-gray-600">
                    {account.code} — {account.name}
                </p>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.journals.date')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.number')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.memo')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.debit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.credit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.gl.balance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b bg-slate-50">
                            <td colSpan={5} className="px-4 py-3 text-sm font-medium">
                                {t('accounting.gl.opening')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">{formatMoney(opening_balance)}</td>
                        </tr>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{row.entry_date}</td>
                                <td className="px-4 py-3 text-sm">
                                    <Link href={prefixedRoute('accounting.journals.show', row.journal_id)} className="text-indigo-600 hover:text-indigo-800">
                                        {row.journal_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{row.memo}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{row.debit ? formatMoney(row.debit) : ''}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{row.credit ? formatMoney(row.credit) : ''}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.balance)}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                            <td colSpan={3} className="px-4 py-3 text-sm">
                                {t('accounting.gl.closing')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(period_debit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(period_credit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(closing_balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

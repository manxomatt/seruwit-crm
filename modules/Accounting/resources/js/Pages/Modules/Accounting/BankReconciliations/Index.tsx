import AccountingShell from '../AccountingShell';
import { EyeIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface AccountOption {
    id: number;
    name: string;
    kind: string;
}

interface ReconciliationRow {
    id: number;
    status: string;
    period_start: string;
    period_end: string;
    statement_date: string;
    opening_balance: number;
    closing_balance: number;
    lines_count: number;
    csv_filename: string | null;
    completed_at: string | null;
    account: AccountOption | null;
}

interface Paginated<T> {
    data: T[];
}

interface Props {
    reconciliations: Paginated<ReconciliationRow>;
    accounts: AccountOption[];
    filters: { company_bank_account_id: number | null };
    can: { bank: boolean };
}

function formatAmount(amount: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(amount);
}

export default function Index({ reconciliations, accounts, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [accountId, setAccountId] = useState(filters.company_bank_account_id ? String(filters.company_bank_account_id) : '');

    const applyFilters = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            prefixedRoute('accounting.bank-reconciliations.index'),
            { company_bank_account_id: accountId || undefined },
            { preserveState: true, replace: true },
        );
    };

    const accountOptions = [
        { value: '', label: t('accounting.transactions.all_accounts') },
        ...accounts.map((account) => ({
            value: String(account.id),
            label: `${account.name} (${t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)})`,
        })),
    ];

    return (
        <AccountingShell
            active="bank"
            title={t('accounting.recon.title')}
            headerActions={
                can.bank ? (
                    <Link href={prefixedRoute('accounting.bank-reconciliations.create')}>
                        <PrimaryButton>{t('accounting.recon.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <Link href={prefixedRoute('accounting.bank-accounts.index')} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.bank.accounts')}
                </Link>
                <span className="text-gray-300">|</span>
                <Link href={prefixedRoute('accounting.bank-transactions.index')} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.transactions.title')}
                </Link>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-800">{t('accounting.recon.title')}</span>
            </div>

            <form onSubmit={applyFilters} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm">
                <div className="min-w-[220px] flex-1">
                    <Select options={accountOptions} value={accountId} onChange={setAccountId} searchable />
                </div>
                <PrimaryButton type="submit">{t('accounting.transactions.filter')}</PrimaryButton>
            </form>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.recon.account')}</th>
                            <th className="px-4 py-3">{t('accounting.recon.period')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.recon.closing_balance')}</th>
                            <th className="px-4 py-3">{t('accounting.recon.lines')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.status')}</th>
                            <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm text-gray-700">
                        {reconciliations.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    {t('accounting.recon.empty')}
                                </td>
                            </tr>
                        )}
                        {reconciliations.data.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-3">{row.account?.name ?? '—'}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {row.period_start} → {row.period_end}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{formatAmount(row.closing_balance)}</td>
                                <td className="px-4 py-3">{row.lines_count}</td>
                                <td className="px-4 py-3">
                                    {t(`accounting.recon.statuses.${row.status}`, undefined, row.status)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={prefixedRoute('accounting.bank-reconciliations.show', row.id)}
                                        className="inline-flex text-indigo-600 hover:text-indigo-800"
                                        title={t('common.view')}
                                    >
                                        <EyeIcon />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

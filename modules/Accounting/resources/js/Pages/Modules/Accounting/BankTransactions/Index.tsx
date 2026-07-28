import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface AccountOption {
    id: number;
    name: string;
    kind: string;
}

interface Transaction {
    id: number;
    type: string;
    direction: string;
    transacted_on: string;
    amount: number;
    reference: string | null;
    memo: string | null;
    is_cleared: boolean;
    cleared_on: string | null;
    account: AccountOption | null;
    counterparty: AccountOption | null;
}

interface Paginated<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    transactions: Paginated<Transaction>;
    accounts: AccountOption[];
    types: string[];
    filters: {
        company_bank_account_id: number | null;
        cleared: string | null;
        from: string | null;
        to: string | null;
    };
    can: { bank: boolean };
}

function formatAmount(amount: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(amount);
}

export default function Index({ transactions, accounts, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [selected, setSelected] = useState<number[]>([]);

    const filterForm = useForm({
        company_bank_account_id: filters.company_bank_account_id ? String(filters.company_bank_account_id) : '',
        cleared: filters.cleared ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });

    const applyFilters = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            prefixedRoute('accounting.bank-transactions.index'),
            {
                company_bank_account_id: filterForm.data.company_bank_account_id || undefined,
                cleared: filterForm.data.cleared || undefined,
                from: filterForm.data.from || undefined,
                to: filterForm.data.to || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const toggle = (id: number) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        const ids = transactions.data.map((row) => row.id);
        setSelected((prev) => (prev.length === ids.length ? [] : ids));
    };

    const clearSelected = () => {
        if (selected.length === 0) {
            return;
        }
        router.post(prefixedRoute('accounting.bank-transactions.clear'), { ids: selected }, {
            onSuccess: () => setSelected([]),
        });
    };

    const unclearSelected = () => {
        if (selected.length === 0) {
            return;
        }
        router.post(prefixedRoute('accounting.bank-transactions.unclear'), { ids: selected }, {
            onSuccess: () => setSelected([]),
        });
    };

    const accountOptions = [
        { value: '', label: t('accounting.transactions.all_accounts') },
        ...accounts.map((account) => ({
            value: String(account.id),
            label: `${account.name} (${t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)})`,
        })),
    ];

    const clearedOptions = [
        { value: '', label: t('accounting.transactions.all_status') },
        { value: '0', label: t('accounting.transactions.uncleared') },
        { value: '1', label: t('accounting.transactions.cleared') },
    ];

    return (
        <AccountingShell
            active="bank"
            title={t('accounting.transactions.title')}
            headerActions={
                can.bank ? (
                    <Link href={prefixedRoute('accounting.bank-transactions.create')}>
                        <PrimaryButton>{t('accounting.transactions.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <Link href={prefixedRoute('accounting.bank-accounts.index')} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.bank.accounts')}
                </Link>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-800">{t('accounting.transactions.title')}</span>
                <span className="text-gray-300">|</span>
                <Link href={prefixedRoute('accounting.bank-reconciliations.index')} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.recon.title')}
                </Link>
            </div>

            <form onSubmit={applyFilters} className="mb-4 grid gap-3 rounded-lg bg-white p-4 shadow-sm md:grid-cols-5">
                <div>
                    <Select
                        options={accountOptions}
                        value={filterForm.data.company_bank_account_id}
                        onChange={(value) => filterForm.setData('company_bank_account_id', value)}
                        searchable
                    />
                </div>
                <div>
                    <Select
                        options={clearedOptions}
                        value={filterForm.data.cleared}
                        onChange={(value) => filterForm.setData('cleared', value)}
                    />
                </div>
                <div>
                    <TextInput
                        type="date"
                        className="block w-full"
                        value={filterForm.data.from}
                        onChange={(e) => filterForm.setData('from', e.target.value)}
                    />
                </div>
                <div>
                    <TextInput
                        type="date"
                        className="block w-full"
                        value={filterForm.data.to}
                        onChange={(e) => filterForm.setData('to', e.target.value)}
                    />
                </div>
                <div>
                    <PrimaryButton type="submit">{t('accounting.transactions.filter')}</PrimaryButton>
                </div>
            </form>

            {can.bank && selected.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    <PrimaryButton type="button" onClick={clearSelected}>
                        {t('accounting.transactions.mark_cleared')} ({selected.length})
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={unclearSelected}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        {t('accounting.transactions.mark_uncleared')}
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            {can.bank && (
                                <th className="px-4 py-3">
                                    <input type="checkbox" checked={selected.length > 0 && selected.length === transactions.data.length} onChange={toggleAll} />
                                </th>
                            )}
                            <th className="px-4 py-3">{t('accounting.transactions.date')}</th>
                            <th className="px-4 py-3">{t('accounting.transactions.account')}</th>
                            <th className="px-4 py-3">{t('accounting.transactions.type')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.transactions.in')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.transactions.out')}</th>
                            <th className="px-4 py-3">{t('accounting.transactions.memo')}</th>
                            <th className="px-4 py-3">{t('accounting.transactions.recon')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm text-gray-700">
                        {transactions.data.length === 0 && (
                            <tr>
                                <td colSpan={can.bank ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                                    {t('accounting.transactions.empty')}
                                </td>
                            </tr>
                        )}
                        {transactions.data.map((txn) => (
                            <tr key={txn.id} className={txn.is_cleared ? 'bg-emerald-50/40' : undefined}>
                                {can.bank && (
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={selected.includes(txn.id)} onChange={() => toggle(txn.id)} />
                                    </td>
                                )}
                                <td className="px-4 py-3 whitespace-nowrap">{txn.transacted_on}</td>
                                <td className="px-4 py-3">{txn.account?.name ?? '—'}</td>
                                <td className="px-4 py-3">
                                    {t(`accounting.transactions.types.${txn.type}`, undefined, txn.type)}
                                    {txn.counterparty ? ` → ${txn.counterparty.name}` : ''}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {txn.direction === 'in' ? formatAmount(txn.amount) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">
                                    {txn.direction === 'out' ? formatAmount(txn.amount) : '—'}
                                </td>
                                <td className="px-4 py-3 max-w-xs truncate" title={txn.memo ?? undefined}>
                                    {txn.reference ? <span className="font-medium">{txn.reference}</span> : null}
                                    {txn.reference && txn.memo ? ' · ' : null}
                                    {txn.memo}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {txn.is_cleared
                                        ? t('accounting.transactions.cleared_on', { date: txn.cleared_on ?? '' })
                                        : t('accounting.transactions.uncleared')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {transactions.links.length > 3 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {transactions.links.map((link, index) => (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url ?? '#'}
                            className={
                                link.active
                                    ? 'rounded bg-indigo-600 px-3 py-1 text-sm text-white'
                                    : 'rounded bg-white px-3 py-1 text-sm text-gray-700 shadow-sm'
                            }
                            preserveState
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AccountingShell>
    );
}

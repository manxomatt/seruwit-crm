import AccountingShell from '../AccountingShell';
import { PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface AccountRow {
    id: number;
    code: string;
    name: string;
    type: string;
    parent: { id: number; code: string; name: string } | null;
    is_postable: boolean;
    is_active: boolean;
    normal_balance: string;
    system_role: string | null;
}

interface PaginatedAccounts {
    data: AccountRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    type: string | null;
    status: string | null;
    postable: string | null;
}

interface Props {
    accounts: PaginatedAccounts;
    filters: Filters;
    types: string[];
    can: { manage_coa: boolean };
}

export default function Index({ accounts, filters, types, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = (overrides: Partial<Filters> = {}) => {
        router.get(
            prefixedRoute('accounting.accounts.index'),
            {
                search: (overrides.search !== undefined ? overrides.search : search) || undefined,
                type: (overrides.type !== undefined ? overrides.type : filters.type) || undefined,
                status: (overrides.status !== undefined ? overrides.status : filters.status) || undefined,
                postable: (overrides.postable !== undefined ? overrides.postable : filters.postable) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    return (
        <AccountingShell
            active="accounts"
            title={t('accounting.accounts.title')}
            headerActions={
                can.manage_coa ? (
                    <Link href={prefixedRoute('accounting.accounts.create')}>
                        <PrimaryButton>{t('accounting.accounts.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-3">
                <div className="min-w-[220px] flex-1">
                    <TextInput
                        type="text"
                        className="w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('accounting.accounts.search_placeholder')}
                    />
                </div>
                <Select
                    className="w-44"
                    value={filters.type || ''}
                    onChange={(value) => applyFilters({ type: value || null })}
                    placeholder={t('accounting.accounts.all_types')}
                    options={[
                        { value: '', label: t('accounting.accounts.all_types') },
                        ...types.map((type) => ({
                            value: type,
                            label: t(`accounting.types.${type}`, undefined, type),
                        })),
                    ]}
                />
                <Select
                    className="w-40"
                    value={filters.status || ''}
                    onChange={(value) => applyFilters({ status: value || null })}
                    placeholder={t('accounting.accounts.all_statuses')}
                    options={[
                        { value: '', label: t('accounting.accounts.all_statuses') },
                        { value: 'active', label: t('accounting.accounts.active') },
                        { value: 'inactive', label: t('accounting.accounts.inactive') },
                    ]}
                />
                <Select
                    className="w-44"
                    value={filters.postable || ''}
                    onChange={(value) => applyFilters({ postable: value || null })}
                    placeholder={t('accounting.accounts.all_postable')}
                    options={[
                        { value: '', label: t('accounting.accounts.all_postable') },
                        { value: '1', label: t('accounting.accounts.postable') },
                        { value: '0', label: t('accounting.accounts.header') },
                    ]}
                />
                <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
            </form>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.type')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.normal_balance')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.status')}</th>
                            {can.manage_coa && (
                                <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.accounts.empty')}
                                </td>
                            </tr>
                        )}
                        {accounts.data.map((account) => (
                            <tr key={account.id} className="border-b">
                                <td className="px-4 py-3 font-mono text-sm">{account.code}</td>
                                <td className="px-4 py-3 text-sm">
                                    {account.name}
                                    {account.system_role && (
                                        <span className="ml-2 text-xs text-gray-400">{account.system_role}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">{t(`accounting.types.${account.type}`, undefined, account.type)}</td>
                                <td className="px-4 py-3 text-sm">{account.normal_balance}</td>
                                <td className="px-4 py-3 text-sm">
                                    {!account.is_active
                                        ? t('accounting.accounts.inactive')
                                        : account.is_postable
                                          ? t('accounting.accounts.postable')
                                          : t('accounting.accounts.header')}
                                </td>
                                {can.manage_coa && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={prefixedRoute('accounting.accounts.edit', account.id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title={t('common.edit')}
                                            >
                                                <PencilIcon />
                                            </Link>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {accounts.last_page > 1 && (
                <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-sm text-gray-600">
                        {t('common.showing_results', {
                            from: (accounts.current_page - 1) * accounts.per_page + 1,
                            to: Math.min(accounts.current_page * accounts.per_page, accounts.total),
                            total: accounts.total,
                        })}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {accounts.links.map((link, index) => (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                          ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AccountingShell>
    );
}

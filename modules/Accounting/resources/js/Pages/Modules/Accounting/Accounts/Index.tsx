import AccountingShell from '../AccountingShell';
import { PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
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
                        <PrimaryButton className="!rounded-xl text-xs shadow-sm">➕ {t('accounting.accounts.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <Head title={t('accounting.accounts.title')} />

            {/* Filter Bar */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                        <TextInput
                            type="text"
                            className="w-full !rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
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
                    <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('common.search')}</PrimaryButton>
                </form>
            </div>

            {/* Table Container */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.code')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.name')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.type')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.normal_balance')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.status')}</th>
                                {can.manage_coa && (
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {accounts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                                            📚
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{t('accounting.accounts.empty')}</p>
                                    </td>
                                </tr>
                            )}
                            {accounts.data.map((account) => (
                                <tr key={account.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">{account.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                        {account.name}
                                        {account.system_role && (
                                            <span className="ml-2 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">{account.system_role}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">{t(`accounting.types.${account.type}`, undefined, account.type)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap uppercase font-mono text-[11px] text-slate-500 dark:text-slate-400">{account.normal_balance}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {!account.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                {t('accounting.accounts.inactive')}
                                            </span>
                                        ) : account.is_postable ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {t('accounting.accounts.postable')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                {t('accounting.accounts.header')}
                                            </span>
                                        )}
                                    </td>
                                    {can.manage_coa && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={prefixedRoute('accounting.accounts.edit', account.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
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
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                        <p className="text-xs font-bold text-slate-400">
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
                                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : link.url
                                              ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                              : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AccountingShell>
    );
}

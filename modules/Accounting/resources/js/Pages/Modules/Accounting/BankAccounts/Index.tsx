import AccountingShell from '../AccountingShell';
import { PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Ledger {
    id: number;
    code: string;
    name: string;
}

interface BankAccount {
    id: number;
    name: string;
    kind: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    is_default: boolean;
    is_active: boolean;
    currency: string;
    ledger: Ledger | null;
}

interface MethodMap {
    payment_method: string;
    company_bank_account_id: number;
    company_bank_account: { id: number; name: string; kind: string } | null;
}

interface Props {
    accounts: BankAccount[];
    methods: string[];
    maps: MethodMap[];
    can: { bank: boolean };
}

export default function Index({ accounts, methods, maps, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const initialMaps = methods.map((method) => {
        const existing = maps.find((map) => map.payment_method === method);
        return {
            payment_method: method,
            company_bank_account_id: existing?.company_bank_account_id ?? accounts[0]?.id ?? 0,
        };
    });

    const { data, setData, put, processing } = useForm({ maps: initialMaps });

    const accountOptions = accounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)})`,
    }));

    const submitMaps = (e: FormEvent) => {
        e.preventDefault();
        put(prefixedRoute('accounting.payment-method-maps.update'));
    };

    const updateMap = (index: number, companyBankAccountId: number) => {
        const next = data.maps.map((row, i) =>
            i === index ? { ...row, company_bank_account_id: companyBankAccountId } : row,
        );
        setData('maps', next);
    };

    return (
        <AccountingShell
            active="bank"
            title={t('accounting.bank.title')}
            headerActions={
                can.bank ? (
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('accounting.bank-transactions.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                💳 {t('accounting.transactions.title')}
                            </SecondaryButton>
                        </Link>
                        <Link href={prefixedRoute('accounting.bank-reconciliations.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                🔄 {t('accounting.recon.title')}
                            </SecondaryButton>
                        </Link>
                        <Link href={prefixedRoute('accounting.bank-accounts.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('accounting.bank.create')}</PrimaryButton>
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-3 text-xs">
                        <Link href={prefixedRoute('accounting.bank-transactions.index')} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {t('accounting.transactions.title')}
                        </Link>
                        <Link href={prefixedRoute('accounting.bank-reconciliations.index')} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            {t('accounting.recon.title')}
                        </Link>
                    </div>
                )
            }
        >
            <Head title={t('accounting.bank.title')} />

            {/* Bank Accounts Table */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">🏦 {t('accounting.bank.accounts')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.name')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.kind')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.coa')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.details')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.accounts.status')}</th>
                                {can.bank && (
                                    <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                                            🏦
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{t('accounting.bank.empty')}</p>
                                    </td>
                                </tr>
                            )}
                            {accounts.map((account) => (
                                <tr key={account.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                        {account.name}
                                        {account.is_default && (
                                            <span className="ml-2 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                                ⭐ {t('accounting.bank.default')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                                        {t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                        {account.ledger ? `${account.ledger.code} — ${account.ledger.name}` : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                        {[account.bank_name, account.account_number].filter(Boolean).join(' · ') || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {account.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {t('accounting.accounts.active')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                {t('accounting.accounts.inactive')}
                                            </span>
                                        )}
                                    </td>
                                    {can.bank && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={prefixedRoute('accounting.bank-accounts.edit', account.id)}
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
            </div>

            {/* Payment Method Maps Form */}
            <form onSubmit={submitMaps} className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-800/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">🗺️ {t('accounting.bank.method_maps')}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{t('accounting.bank.method_maps_help')}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.method')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.bank.posts_to')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {data.maps.map((row, index) => (
                                <tr key={row.payment_method} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                                        {t(`accounting.bank.methods.${row.payment_method}`, undefined, row.payment_method)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Select
                                            className="max-w-md"
                                            searchable
                                            value={row.company_bank_account_id ? String(row.company_bank_account_id) : ''}
                                            disabled={!can.bank}
                                            onChange={(value) => updateMap(index, Number(value))}
                                            placeholder={t('accounting.bank.select_account')}
                                            searchPlaceholder={t('common.search')}
                                            emptyText={t('common.no_options')}
                                            noResultsText={t('common.no_results')}
                                            options={accountOptions}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {can.bank && (
                    <div className="border-t border-slate-100 dark:border-slate-800/60 px-6 py-4 flex justify-end">
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                            💾 {t('accounting.bank.save_maps')}
                        </PrimaryButton>
                    </div>
                )}
            </form>
        </AccountingShell>
    );
}

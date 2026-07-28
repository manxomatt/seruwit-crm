import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link, useForm } from '@inertiajs/react';
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
                    <Link href={prefixedRoute('accounting.bank-accounts.create')}>
                        <PrimaryButton>{t('accounting.bank.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">{t('accounting.bank.accounts')}</h3>
                </div>
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.bank.name')}</th>
                            <th className="px-4 py-3">{t('accounting.bank.kind')}</th>
                            <th className="px-4 py-3">{t('accounting.bank.coa')}</th>
                            <th className="px-4 py-3">{t('accounting.bank.details')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.status')}</th>
                            {can.bank && <th className="px-4 py-3" />}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.bank.empty')}
                                </td>
                            </tr>
                        )}
                        {accounts.map((account) => (
                            <tr key={account.id} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium">
                                    {account.name}
                                    {account.is_default && (
                                        <span className="ml-2 text-xs text-gray-400">{t('accounting.bank.default')}</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm">
                                    {account.ledger ? `${account.ledger.code} — ${account.ledger.name}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {[account.bank_name, account.account_number].filter(Boolean).join(' · ') || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {account.is_active ? t('accounting.accounts.active') : t('accounting.accounts.inactive')}
                                </td>
                                {can.bank && (
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link
                                            href={prefixedRoute('accounting.bank-accounts.edit', account.id)}
                                            className="text-indigo-600 hover:text-indigo-800"
                                        >
                                            {t('common.edit')}
                                        </Link>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={submitMaps} className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="border-b px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">{t('accounting.bank.method_maps')}</h3>
                    <p className="mt-1 text-xs text-gray-500">{t('accounting.bank.method_maps_help')}</p>
                </div>
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.bank.method')}</th>
                            <th className="px-4 py-3">{t('accounting.bank.posts_to')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.maps.map((row, index) => (
                            <tr key={row.payment_method} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium">{row.payment_method}</td>
                                <td className="px-4 py-3">
                                    <select
                                        className="w-full max-w-md rounded-md border-gray-300 text-sm shadow-sm"
                                        value={row.company_bank_account_id}
                                        disabled={!can.bank}
                                        onChange={(e) => updateMap(index, Number(e.target.value))}
                                    >
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name} ({account.kind})
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {can.bank && (
                    <div className="border-t px-4 py-3">
                        <PrimaryButton disabled={processing}>{t('accounting.bank.save_maps')}</PrimaryButton>
                    </div>
                )}
            </form>
        </AccountingShell>
    );
}

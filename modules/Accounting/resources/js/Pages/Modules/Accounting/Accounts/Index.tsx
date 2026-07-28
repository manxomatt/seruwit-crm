import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link } from '@inertiajs/react';

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

interface Props {
    accounts: AccountRow[];
    can: { manage_coa: boolean };
}

export default function Index({ accounts, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

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
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.name')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.type')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.normal_balance')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.status')}</th>
                            {can.manage_coa && <th className="px-4 py-3" />}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.accounts.empty')}
                                </td>
                            </tr>
                        )}
                        {accounts.map((account) => (
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
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link
                                            href={prefixedRoute('accounting.accounts.edit', account.id)}
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
        </AccountingShell>
    );
}

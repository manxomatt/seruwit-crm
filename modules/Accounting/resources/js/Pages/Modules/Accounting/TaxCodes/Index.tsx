import AccountingShell from '../AccountingShell';
import { PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import { Link } from '@inertiajs/react';

interface AccountRef {
    id: number;
    code: string;
    name: string;
}

interface TaxCodeRow {
    id: number;
    code: string;
    name: string;
    category: string;
    rate: number;
    calculation: string;
    direction: string;
    is_default: boolean;
    is_active: boolean;
    output_account: AccountRef | null;
    input_account: AccountRef | null;
    wht_account: AccountRef | null;
}

interface Props {
    codes: TaxCodeRow[];
    can: { manage: boolean };
}

export default function Index({ codes, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell
            active="tax_codes"
            title={t('accounting.tax.title')}
            headerActions={
                can.manage ? (
                    <Link href={prefixedRoute('accounting.tax-codes.create')}>
                        <PrimaryButton type="button">{t('accounting.tax.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.tax.code')}</th>
                            <th className="px-4 py-3">{t('accounting.tax.name')}</th>
                            <th className="px-4 py-3">{t('accounting.tax.category')}</th>
                            <th className="px-4 py-3">{t('accounting.tax.rate')}</th>
                            <th className="px-4 py-3">{t('accounting.tax.accounts')}</th>
                            <th className="px-4 py-3">{t('accounting.tax.status')}</th>
                            {can.manage && <th className="px-4 py-3 text-right">{t('common.actions')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {codes.map((code) => (
                            <tr key={code.id} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium">
                                    {code.code}
                                    {code.is_default && (
                                        <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
                                            {t('accounting.tax.default')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm">{code.name}</td>
                                <td className="px-4 py-3 text-sm">
                                    {t(`accounting.tax.categories.${code.category}`, undefined, code.category)}
                                </td>
                                <td className="px-4 py-3 text-sm">{code.rate}%</td>
                                <td className="px-4 py-3 text-xs text-gray-600">
                                    {code.category === 'wht'
                                        ? code.wht_account
                                            ? `${code.wht_account.code} — ${code.wht_account.name}`
                                            : '—'
                                        : [
                                              code.output_account ? `Out ${code.output_account.code}` : null,
                                              code.input_account ? `In ${code.input_account.code}` : null,
                                          ]
                                              .filter(Boolean)
                                              .join(' · ') || '—'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {code.is_active ? t('accounting.accounts.active') : t('accounting.accounts.inactive')}
                                </td>
                                {can.manage && (
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('accounting.tax-codes.edit', code.id)}
                                            className="inline-flex text-indigo-600 hover:text-indigo-800"
                                            title={t('common.edit')}
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Link>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {codes.length === 0 && (
                            <tr>
                                <td colSpan={can.manage ? 7 : 6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.tax.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

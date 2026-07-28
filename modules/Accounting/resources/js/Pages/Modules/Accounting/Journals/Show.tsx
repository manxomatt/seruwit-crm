import AccountingShell from '../AccountingShell';
import { PencilIcon, PostIcon, TrashIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Link } from '@inertiajs/react';

interface Props {
    journal: {
        id: number;
        number: string;
        entry_date: string;
        type: string;
        status: string;
        memo: string | null;
        posted_at: string | null;
        period: { id: number; name: string; status: string } | null;
        created_by: { id: number; name: string } | null;
        posted_by: { id: number; name: string } | null;
        total_debit: number;
        total_credit: number;
        lines: Array<{
            id: number;
            account: { id: number; code: string; name: string } | null;
            debit: number;
            credit: number;
            memo: string | null;
        }>;
    };
    can: { journal: boolean; post: boolean };
}

export default function Show({ journal, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell
            active="journals"
            title={journal.number}
            headerActions={
                journal.status === 'draft' ? (
                    <div className="flex items-center gap-2">
                        {can.journal && (
                            <Link
                                href={prefixedRoute('accounting.journals.edit', journal.id)}
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                                title={t('common.edit')}
                            >
                                <PencilIcon />
                            </Link>
                        )}
                        {can.post && (
                            <Link
                                href={prefixedRoute('accounting.journals.post', journal.id)}
                                method="post"
                                as="button"
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 p-2 text-white hover:bg-green-700"
                                title={t('accounting.journals.post')}
                            >
                                <PostIcon />
                            </Link>
                        )}
                        {can.journal && (
                            <Link
                                href={prefixedRoute('accounting.journals.destroy', journal.id)}
                                method="delete"
                                as="button"
                                className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 p-2 text-white hover:bg-red-700"
                                title={t('common.delete')}
                            >
                                <TrashIcon />
                            </Link>
                        )}
                    </div>
                ) : undefined
            }
        >
            <div className="mb-4 rounded-lg bg-white p-4 text-sm text-gray-700 shadow-sm">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs uppercase text-gray-500">{t('accounting.journals.date')}</p>
                        <p>{journal.entry_date}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500">{t('accounting.journals.status')}</p>
                        <p>{t(`accounting.status.${journal.status}`, undefined, journal.status)}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500">{t('accounting.journals.period')}</p>
                        <p>{journal.period?.name}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-gray-500">{t('accounting.journals.memo')}</p>
                        <p>{journal.memo || '—'}</p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.journals.account')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.debit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.credit')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.line_memo')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {journal.lines.map((line) => (
                            <tr key={line.id} className="border-b">
                                <td className="px-4 py-3 text-sm">
                                    <span className="font-mono">{line.account?.code}</span> {line.account?.name}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">
                                    {line.debit > 0 ? formatMoney(line.debit) : ''}
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">
                                    {line.credit > 0 ? formatMoney(line.credit) : ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{line.memo}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-3 text-sm">{t('accounting.journals.totals')}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(journal.total_debit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(journal.total_credit)}</td>
                            <td />
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

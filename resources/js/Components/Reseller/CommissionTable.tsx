import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { ReactNode } from 'react';
import CommissionStatusBadge from './CommissionStatusBadge';
import { CommissionRow } from './types';

interface Props {
    rows: CommissionRow[];
    showReseller?: boolean;
    renderActions?: (row: CommissionRow) => ReactNode;
}

const rateLabel = (row: CommissionRow): string =>
    row.rate_type === 'percent' ? `${row.rate_value}%` : formatMoney(row.rate_value);

export default function CommissionTable({ rows, showReseller = false, renderActions }: Props): JSX.Element {
    const { t } = useTrans();

    if (rows.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t('reseller.table.empty')}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.date')}</th>
                        {showReseller && (
                            <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.reseller')}</th>
                        )}
                        <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.tenant')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.plan')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.event')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.base')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.rate')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.commission')}</th>
                        <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.status')}</th>
                        {renderActions && <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.actions')}</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                                {row.created_at ?? '—'}
                            </td>
                            {showReseller && (
                                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                    {row.reseller_name ?? '—'}
                                </td>
                            )}
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {row.tenant_name ?? row.tenant_id}
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.plan_name ?? '—'}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                {t(`reseller.event.${row.event}`)}
                                <span className="ml-1 text-xs text-slate-400">#{row.occurrence}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                                {formatMoney(row.base_amount)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                                {rateLabel(row)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                                {formatMoney(row.commission_amount)}
                            </td>
                            <td className="px-4 py-3">
                                <CommissionStatusBadge status={row.status} />
                                {row.status === 'pending' && row.hold_until && (
                                    <div className="mt-1 text-xs text-slate-400">
                                        {t('reseller.table.hold_until')}: {row.hold_until}
                                    </div>
                                )}
                                {row.status === 'void' && row.void_reason && (
                                    <div className="mt-1 max-w-[16rem] truncate text-xs text-slate-400" title={row.void_reason}>
                                        {row.void_reason}
                                    </div>
                                )}
                            </td>
                            {renderActions && <td className="px-4 py-3 text-right">{renderActions(row)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

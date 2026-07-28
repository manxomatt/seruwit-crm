import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Row {
    date: string | null;
    document: string;
    partner_code: string | null;
    partner_name: string | null;
    npwp: string | null;
    wht_code: string | number | null;
    wht_rate: number;
    base: number;
    wht: number;
    paid_net: number;
    reference: string | null;
}

interface Props {
    from: string;
    to: string;
    rows: Row[];
    totals: { base: number; wht: number; paid_net: number };
}

export default function WhtPayable({ from, to, rows, totals }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ from, to });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(prefixedRoute('accounting.reports.wht-payable'), form.data, { preserveState: true });
    };

    return (
        <AccountingShell active="wht_payable" title={t('accounting.wht_payable.title')}>
            <p className="mb-4 text-sm text-gray-600">{t('accounting.wht_payable.hint')}</p>

            <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel value={t('accounting.wht_payable.from')} />
                    <TextInput type="date" className="mt-1" value={form.data.from} onChange={(e) => form.setData('from', e.target.value)} />
                </div>
                <div>
                    <InputLabel value={t('accounting.wht_payable.to')} />
                    <TextInput type="date" className="mt-1" value={form.data.to} onChange={(e) => form.setData('to', e.target.value)} />
                </div>
                <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
            </form>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.wht_payable.columns.date')}</th>
                            <th className="px-4 py-3">{t('accounting.wht_payable.columns.document')}</th>
                            <th className="px-4 py-3">{t('accounting.wht_payable.columns.partner')}</th>
                            <th className="px-4 py-3">{t('accounting.wht_payable.columns.npwp')}</th>
                            <th className="px-4 py-3">{t('accounting.wht_payable.columns.wht_code')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.wht_payable.columns.base')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.wht_payable.columns.wht')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.wht_payable.columns.paid_net')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.wht_payable.empty')}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={`${row.document}-${row.date}`} className="border-b">
                                    <td className="px-4 py-3 text-sm">{row.date}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.document}
                                        {row.reference ? <span className="ml-2 text-xs text-gray-400">{row.reference}</span> : null}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.partner_code ? `${row.partner_code} — ${row.partner_name}` : row.partner_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{row.npwp || '—'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.wht_code || '—'}
                                        {row.wht_rate > 0 ? ` (${row.wht_rate}%)` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.base)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.wht)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.paid_net)}</td>
                                </tr>
                            ))
                        )}
                        <tr className="bg-gray-50 font-semibold">
                            <td colSpan={5} className="px-4 py-3 text-sm">
                                {t('accounting.wht_payable.totals')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.base)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.wht)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.paid_net)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

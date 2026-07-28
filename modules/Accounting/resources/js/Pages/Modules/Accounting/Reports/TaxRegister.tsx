import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
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
    tax_code: string | null;
    tax_rate: number;
    dpp: number;
    tax: number;
    gross: number;
    kind: string;
}

interface Props {
    side: 'output' | 'input';
    from: string;
    to: string;
    rows: Row[];
    totals: { dpp: number; tax: number; gross: number };
    export_url: string;
}

export default function TaxRegister({ side, from, to, rows, totals, export_url }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({ side, from, to });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(prefixedRoute('accounting.reports.tax-register'), form.data, { preserveState: true });
    };

    return (
        <AccountingShell active="tax_register" title={t('accounting.tax_register.title')}>
            <p className="mb-4 text-sm text-gray-600">{t('accounting.tax_register.hint')}</p>

            <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel value={t('accounting.tax_register.side')} />
                    <Select
                        className="mt-1 min-w-[14rem]"
                        value={form.data.side}
                        onChange={(value) => form.setData('side', value as 'output' | 'input')}
                        options={[
                            { value: 'output', label: t('accounting.tax_register.sides.output') },
                            { value: 'input', label: t('accounting.tax_register.sides.input') },
                        ]}
                    />
                </div>
                <div>
                    <InputLabel value={t('accounting.tax_register.from')} />
                    <TextInput type="date" className="mt-1" value={form.data.from} onChange={(e) => form.setData('from', e.target.value)} />
                </div>
                <div>
                    <InputLabel value={t('accounting.tax_register.to')} />
                    <TextInput type="date" className="mt-1" value={form.data.to} onChange={(e) => form.setData('to', e.target.value)} />
                </div>
                <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                <SecondaryButton type="button" onClick={() => window.location.assign(export_url)}>
                    {t('accounting.tax_register.export_csv')}
                </SecondaryButton>
            </form>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.tax_register.columns.date')}</th>
                            <th className="px-4 py-3">{t('accounting.tax_register.columns.document')}</th>
                            <th className="px-4 py-3">{t('accounting.tax_register.columns.partner')}</th>
                            <th className="px-4 py-3">{t('accounting.tax_register.columns.npwp')}</th>
                            <th className="px-4 py-3">{t('accounting.tax_register.columns.tax_code')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.tax_register.columns.dpp')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.tax_register.columns.tax')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.tax_register.columns.gross')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.tax_register.empty')}
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={`${row.document}-${row.date}`} className="border-b">
                                    <td className="px-4 py-3 text-sm">{row.date}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.document}
                                        <span className="ml-2 text-xs text-gray-400">{row.kind}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.partner_code ? `${row.partner_code} — ${row.partner_name}` : row.partner_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm tabular-nums">{row.npwp || '—'}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {row.tax_code || '—'}
                                        {row.tax_rate > 0 ? ` (${row.tax_rate}%)` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.dpp)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.tax)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.gross)}</td>
                                </tr>
                            ))
                        )}
                        <tr className="bg-gray-50 font-semibold">
                            <td colSpan={5} className="px-4 py-3 text-sm">
                                {t('accounting.tax_register.totals')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.dpp)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.tax)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(totals.gross)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Row {
    id: number;
    entry_date: string | null;
    journal_id: number;
    journal_number: string | null;
    account: { id: number; code: string; name: string } | null;
    memo: string | null;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    from: string;
    to: string;
    partners: Array<{ id: number; code: string; name: string }>;
    partner_id: number | null;
    partner: { id: number; code: string; name: string } | null;
    opening_balance: number;
    rows: Row[];
    total_debit: number;
    total_credit: number;
    closing_balance: number;
}

export default function PartnerStatement({
    from,
    to,
    partners,
    partner_id,
    partner,
    opening_balance,
    rows,
    total_debit,
    total_credit,
    closing_balance,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const form = useForm({
        partner_id: partner_id ? String(partner_id) : '',
        from,
        to,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(prefixedRoute('accounting.reports.partner-statement'), form.data, { preserveState: true });
    };

    return (
        <AccountingShell active="partner_statement" title={t('accounting.partner_statement.title')}>
            <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel value={t('accounting.partner_statement.partner')} />
                    <Select
                        className="mt-1 min-w-[16rem]"
                        searchable
                        value={form.data.partner_id}
                        onChange={(value) => form.setData('partner_id', value)}
                        options={partners.map((p) => ({
                            value: String(p.id),
                            label: p.code ? `${p.code} — ${p.name}` : p.name,
                        }))}
                    />
                </div>
                <div>
                    <InputLabel value={t('accounting.partner_statement.from')} />
                    <TextInput type="date" className="mt-1" value={form.data.from} onChange={(e) => form.setData('from', e.target.value)} />
                </div>
                <div>
                    <InputLabel value={t('accounting.partner_statement.to')} />
                    <TextInput type="date" className="mt-1" value={form.data.to} onChange={(e) => form.setData('to', e.target.value)} />
                </div>
                <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
            </form>

            {partner && (
                <p className="mb-3 text-sm text-gray-600">
                    {partner.code} — {partner.name}
                </p>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.journals.date')}</th>
                            <th className="px-4 py-3">{t('accounting.journals.number')}</th>
                            <th className="px-4 py-3">{t('accounting.accounts.code')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.debit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.journals.credit')}</th>
                            <th className="px-4 py-3 text-right">{t('accounting.gl.balance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b bg-slate-50">
                            <td colSpan={5} className="px-4 py-3 text-sm font-medium">
                                {t('accounting.gl.opening')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">{formatMoney(opening_balance)}</td>
                        </tr>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{row.entry_date}</td>
                                <td className="px-4 py-3 text-sm">
                                    <Link href={prefixedRoute('accounting.journals.show', row.journal_id)} className="text-indigo-600 hover:text-indigo-800">
                                        {row.journal_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-sm">{row.account ? `${row.account.code}` : ''}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{row.debit ? formatMoney(row.debit) : ''}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{row.credit ? formatMoney(row.credit) : ''}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(row.balance)}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                            <td colSpan={3} className="px-4 py-3 text-sm">
                                {t('accounting.gl.closing')}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_debit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(total_credit)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">{formatMoney(closing_balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </AccountingShell>
    );
}

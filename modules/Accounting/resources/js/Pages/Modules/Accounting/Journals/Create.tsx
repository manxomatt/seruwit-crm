import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface AccountOption {
    id: number;
    code: string;
    name: string;
}

interface Line {
    account_id: string | number;
    debit: string;
    credit: string;
    memo: string;
}

interface Props {
    accounts: AccountOption[];
    defaults: { entry_date: string };
}

const emptyLine = (): Line => ({ account_id: '', debit: '', credit: '', memo: '' });

export default function Create({ accounts, defaults }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        entry_date: defaults.entry_date,
        memo: '',
        lines: [emptyLine(), emptyLine()] as Line[],
    });

    const updateLine = (index: number, field: keyof Line, value: string) => {
        const lines = data.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line));
        setData('lines', lines);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.journals.store'));
    };

    const totalDebit = data.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    return (
        <AccountingShell active="journals" title={t('accounting.journals.create')}>
            <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="entry_date" value={t('accounting.journals.date')} />
                        <TextInput
                            id="entry_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.entry_date}
                            onChange={(e) => setData('entry_date', e.target.value)}
                            required
                        />
                        <InputError message={errors.entry_date} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="memo" value={t('accounting.journals.memo')} />
                        <TextInput id="memo" className="mt-1 block w-full" value={data.memo} onChange={(e) => setData('memo', e.target.value)} />
                        <InputError message={errors.memo} className="mt-1" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                        <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-2 py-2">{t('accounting.journals.account')}</th>
                                <th className="px-2 py-2 text-right">{t('accounting.journals.debit')}</th>
                                <th className="px-2 py-2 text-right">{t('accounting.journals.credit')}</th>
                                <th className="px-2 py-2">{t('accounting.journals.line_memo')}</th>
                                <th className="px-2 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {data.lines.map((line, index) => (
                                <tr key={index} className="border-b">
                                    <td className="px-2 py-2">
                                        <select
                                            className="w-full rounded-md border-gray-300 text-sm shadow-sm"
                                            value={line.account_id}
                                            onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                                            required
                                        >
                                            <option value="">{t('accounting.journals.select_account')}</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>
                                                    {account.code} — {account.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={(errors as Record<string, string>)[`lines.${index}.account_id`]} className="mt-1" />
                                    </td>
                                    <td className="px-2 py-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="block w-full text-right"
                                            value={line.debit}
                                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="block w-full text-right"
                                            value={line.credit}
                                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <TextInput
                                            className="block w-full"
                                            value={line.memo}
                                            onChange={(e) => updateLine(index, 'memo', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                        {data.lines.length > 2 && (
                                            <button
                                                type="button"
                                                className="text-sm text-red-600"
                                                onClick={() => setData('lines', data.lines.filter((_, i) => i !== index))}
                                            >
                                                {t('common.delete')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <InputError message={errors.lines} className="mt-1" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        className="text-sm text-indigo-600"
                        onClick={() => setData('lines', [...data.lines, emptyLine()])}
                    >
                        {t('accounting.journals.add_line')}
                    </button>
                    <div className="text-sm tabular-nums text-gray-700">
                        {t('accounting.journals.totals')}: D {formatMoney(totalDebit)} / C {formatMoney(totalCredit)}
                        {Math.abs(totalDebit - totalCredit) >= 0.005 && (
                            <span className="ml-2 text-red-600">{t('accounting.journals.unbalanced')}</span>
                        )}
                    </div>
                    <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                </div>
            </form>
        </AccountingShell>
    );
}

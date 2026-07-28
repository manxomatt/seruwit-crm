import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatMoney } from '@/utils/money';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { TrashIcon } from '../icons';

interface AccountOption {
    id: number;
    code: string;
    name: string;
}

interface Line {
    account_id: string | number;
    debit: string | number;
    credit: string | number;
    memo: string;
}

interface Props {
    journal: {
        id: number;
        number: string;
        entry_date: string;
        memo: string | null;
        lines: Line[];
    };
    accounts: AccountOption[];
}

const emptyLine = (): Line => ({ account_id: '', debit: '', credit: '', memo: '' });

export default function Edit({ journal, accounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        entry_date: journal.entry_date,
        memo: journal.memo ?? '',
        lines: journal.lines.map((line) => ({
            account_id: line.account_id ? String(line.account_id) : '',
            debit: line.debit === 0 || line.debit === '0' ? '' : String(line.debit),
            credit: line.credit === 0 || line.credit === '0' ? '' : String(line.credit),
            memo: line.memo ?? '',
        })),
    });

    const accountOptions = accounts.map((account) => ({
        value: String(account.id),
        label: `${account.code} — ${account.name}`,
    }));

    const updateLine = (index: number, field: keyof Line, value: string) => {
        const lines = data.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line));
        setData('lines', lines);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(prefixedRoute('accounting.journals.update', journal.id));
    };

    const totalDebit = data.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    return (
        <AccountingShell active="journals" title={`${t('accounting.journals.edit')} ${journal.number}`}>
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
                                        <Select
                                            searchable
                                            className="min-w-[220px]"
                                            value={String(line.account_id)}
                                            onChange={(value) => updateLine(index, 'account_id', value)}
                                            placeholder={t('accounting.journals.select_account')}
                                            searchPlaceholder={t('common.search')}
                                            emptyText={t('common.no_options')}
                                            noResultsText={t('common.no_results')}
                                            options={accountOptions}
                                        />
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
                                                className="inline-flex text-red-600 hover:text-red-800"
                                                onClick={() => setData('lines', data.lines.filter((_, i) => i !== index))}
                                                title={t('common.delete')}
                                            >
                                                <TrashIcon />
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
                    </div>
                    <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                </div>
            </form>
        </AccountingShell>
    );
}

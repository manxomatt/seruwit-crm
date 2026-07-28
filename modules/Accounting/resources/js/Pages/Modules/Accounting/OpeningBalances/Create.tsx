import AccountingShell from '../AccountingShell';
import { TrashIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface AccountOption {
    id: number;
    code: string;
    name: string;
    type: string;
    normal_balance: string;
}

interface YearOption {
    id: number;
    year: number;
    is_closed: boolean;
}

interface Line {
    account_id: string;
    debit: string;
    credit: string;
}

interface Props {
    year: number;
    years: YearOption[];
    entry_date: string;
    accounts: AccountOption[];
    existing: { id: number; number: string; entry_date: string } | null;
    has_activity: boolean;
    year_closed: boolean;
    can: { period: boolean };
}

export default function Create({
    year,
    years,
    entry_date,
    accounts,
    existing,
    has_activity,
    year_closed,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, post, processing, errors } = useForm({
        year,
        entry_date,
        memo: '',
        lines: [
            { account_id: '', debit: '', credit: '' },
            { account_id: '', debit: '', credit: '' },
        ] as Line[],
    });

    const accountOptions = accounts.map((account) => ({
        value: String(account.id),
        label: `${account.code} — ${account.name}`,
    }));

    const updateLine = (index: number, patch: Partial<Line>) => {
        const next = data.lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
        setData('lines', next);
    };

    const addLine = () => {
        setData('lines', [...data.lines, { account_id: '', debit: '', credit: '' }]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 2) {
            return;
        }
        setData(
            'lines',
            data.lines.filter((_, i) => i !== index),
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.opening-balances.store'));
    };

    const locked = Boolean(existing) || has_activity || year_closed || !can.period;

    return (
        <AccountingShell active="opening" title={t('accounting.opening.title')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('accounting.periods.year')}</span>
                    <Select
                        className="w-32"
                        value={String(data.year)}
                        onChange={(value) =>
                            router.get(prefixedRoute('accounting.opening-balances.create'), { year: value }, { preserveState: true })
                        }
                        options={years.map((y) => ({
                            value: String(y.year),
                            label: String(y.year),
                        }))}
                    />
                </div>
                <Link href={`${prefixedRoute('accounting.periods.index')}?year=${year}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                    {t('accounting.nav.periods')}
                </Link>
            </div>

            {existing && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {t('accounting.opening.already_posted')}{' '}
                    <Link href={prefixedRoute('accounting.journals.show', existing.id)} className="font-semibold underline">
                        {existing.number}
                    </Link>
                </div>
            )}

            {has_activity && !existing && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {t('accounting.opening.has_activity')}
                </div>
            )}

            {year_closed && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    {t('accounting.periods.year_closed')}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-600">{t('accounting.opening.help')}</p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="entry_date" value={t('accounting.opening.entry_date')} />
                        <TextInput
                            id="entry_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.entry_date}
                            onChange={(e) => setData('entry_date', e.target.value)}
                            disabled={locked}
                            required
                        />
                        <InputError message={errors.entry_date} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="memo" value={t('accounting.journals.memo')} />
                        <TextInput
                            id="memo"
                            className="mt-1 block w-full"
                            value={data.memo}
                            onChange={(e) => setData('memo', e.target.value)}
                            disabled={locked}
                        />
                        <InputError message={errors.memo} className="mt-1" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-3 py-2">{t('accounting.accounts.code')}</th>
                                <th className="px-3 py-2 text-right">{t('accounting.journals.debit')}</th>
                                <th className="px-3 py-2 text-right">{t('accounting.journals.credit')}</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.lines.map((line, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2">
                                        <Select
                                            options={[{ value: '', label: t('accounting.opening.select_account') }, ...accountOptions]}
                                            value={line.account_id}
                                            onChange={(value) => updateLine(index, { account_id: value })}
                                            searchable
                                            disabled={locked}
                                        />
                                        <InputError message={(errors as Record<string, string>)[`lines.${index}.account_id`]} className="mt-1" />
                                    </td>
                                    <td className="px-3 py-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="block w-full text-right"
                                            value={line.debit}
                                            onChange={(e) => updateLine(index, { debit: e.target.value, credit: e.target.value ? '' : line.credit })}
                                            disabled={locked}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="block w-full text-right"
                                            value={line.credit}
                                            onChange={(e) => updateLine(index, { credit: e.target.value, debit: e.target.value ? '' : line.debit })}
                                            disabled={locked}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {!locked && (
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="text-red-600 hover:text-red-800"
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
                <InputError message={errors.lines} />
                <InputError message={errors.year} />

                {!locked && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={addLine}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            {t('accounting.opening.add_line')}
                        </button>
                        <PrimaryButton disabled={processing}>{t('accounting.opening.post')}</PrimaryButton>
                    </div>
                )}
            </form>
        </AccountingShell>
    );
}

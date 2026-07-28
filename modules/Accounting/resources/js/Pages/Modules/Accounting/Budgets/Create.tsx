import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Props {
    fiscal_year_id: number;
    year: number;
    periods: Array<{ id: number; name: string; period_index: number }>;
    accounts: Array<{ id: number; code: string; name: string; type: string }>;
}

export default function Create({ fiscal_year_id, year, periods, accounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const currentPeriod = periods.find((p) => p.period_index === new Date().getMonth() + 1) ?? periods[0];

    const { data, setData, post, processing, errors } = useForm({
        fiscal_year_id,
        name: `Budget ${year}`,
        is_active: true,
        lines: [
            {
                account_id: accounts[0] ? String(accounts[0].id) : '',
                fiscal_period_id: currentPeriod ? String(currentPeriod.id) : '',
                amount: '0',
            },
        ],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.budgets.store'));
    };

    const updateLine = (index: number, field: string, value: string) => {
        const next = data.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line));
        setData('lines', next);
    };

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                account_id: accounts[0] ? String(accounts[0].id) : '',
                fiscal_period_id: currentPeriod ? String(currentPeriod.id) : '',
                amount: '0',
            },
        ]);
    };

    return (
        <AccountingShell active="budgets" title={t('accounting.budget.create')}>
            <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel value={t('accounting.budget.name')} />
                    <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>

                <div className="space-y-3">
                    {data.lines.map((line, index) => (
                        <div key={index} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <Select
                                searchable
                                value={line.account_id}
                                onChange={(value) => updateLine(index, 'account_id', value)}
                                options={accounts.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` }))}
                            />
                            <Select
                                value={line.fiscal_period_id}
                                onChange={(value) => updateLine(index, 'fiscal_period_id', value)}
                                options={periods.map((p) => ({ value: String(p.id), label: p.name }))}
                            />
                            <TextInput
                                type="number"
                                step="0.01"
                                value={line.amount}
                                onChange={(e) => updateLine(index, 'amount', e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <button type="button" onClick={addLine} className="text-sm text-indigo-600 hover:text-indigo-800">
                    {t('accounting.budget.add_line')}
                </button>

                <div>
                    <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                </div>
            </form>
        </AccountingShell>
    );
}

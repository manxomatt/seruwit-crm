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

interface AccountOption {
    id: number;
    name: string;
    kind: string;
}

interface Props {
    accounts: AccountOption[];
}

export default function Create({ accounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 8)}01`;

    const { data, setData, post, processing, errors } = useForm({
        company_bank_account_id: accounts[0] ? String(accounts[0].id) : '',
        period_start: monthStart,
        period_end: today,
        statement_date: today,
        opening_balance: '0',
        closing_balance: '0',
        notes: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.bank-reconciliations.store'));
    };

    const accountOptions = accounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)})`,
    }));

    return (
        <AccountingShell active="bank" title={t('accounting.recon.create')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel value={t('accounting.recon.account')} />
                    <Select
                        className="mt-1"
                        options={accountOptions}
                        value={data.company_bank_account_id}
                        onChange={(value) => setData('company_bank_account_id', value)}
                        searchable
                    />
                    <InputError message={errors.company_bank_account_id} className="mt-1" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="period_start" value={t('accounting.recon.period_start')} />
                        <TextInput
                            id="period_start"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.period_start}
                            onChange={(e) => setData('period_start', e.target.value)}
                            required
                        />
                        <InputError message={errors.period_start} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="period_end" value={t('accounting.recon.period_end')} />
                        <TextInput
                            id="period_end"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.period_end}
                            onChange={(e) => setData('period_end', e.target.value)}
                            required
                        />
                        <InputError message={errors.period_end} className="mt-1" />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="statement_date" value={t('accounting.recon.statement_date')} />
                    <TextInput
                        id="statement_date"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.statement_date}
                        onChange={(e) => setData('statement_date', e.target.value)}
                    />
                    <InputError message={errors.statement_date} className="mt-1" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="opening_balance" value={t('accounting.recon.opening_balance')} />
                        <TextInput
                            id="opening_balance"
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full"
                            value={data.opening_balance}
                            onChange={(e) => setData('opening_balance', e.target.value)}
                        />
                        <InputError message={errors.opening_balance} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="closing_balance" value={t('accounting.recon.closing_balance')} />
                        <TextInput
                            id="closing_balance"
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full"
                            value={data.closing_balance}
                            onChange={(e) => setData('closing_balance', e.target.value)}
                        />
                        <InputError message={errors.closing_balance} className="mt-1" />
                    </div>
                </div>

                <div>
                    <InputLabel htmlFor="notes" value={t('accounting.recon.notes')} />
                    <TextInput
                        id="notes"
                        className="mt-1 block w-full"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                    <InputError message={errors.notes} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
            </form>
        </AccountingShell>
    );
}

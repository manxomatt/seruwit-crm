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
    types: string[];
}

export default function Create({ accounts, types }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        type: 'deposit',
        company_bank_account_id: accounts[0] ? String(accounts[0].id) : '',
        counterparty_account_id: '',
        transacted_on: new Date().toISOString().slice(0, 10),
        amount: '',
        reference: '',
        memo: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.bank-transactions.store'));
    };

    const accountOptions = accounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} (${t(`accounting.bank.kinds.${account.kind}`, undefined, account.kind)})`,
    }));

    const typeOptions = types.map((type) => ({
        value: type,
        label: t(`accounting.transactions.types.${type}`, undefined, type),
    }));

    return (
        <AccountingShell active="bank" title={t('accounting.transactions.create')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel value={t('accounting.transactions.type')} />
                    <Select
                        className="mt-1"
                        options={typeOptions}
                        value={data.type}
                        onChange={(value) => setData('type', value)}
                    />
                    <InputError message={errors.type} className="mt-1" />
                </div>

                <div>
                    <InputLabel value={t('accounting.transactions.account')} />
                    <Select
                        className="mt-1"
                        options={accountOptions}
                        value={data.company_bank_account_id}
                        onChange={(value) => setData('company_bank_account_id', value)}
                        searchable
                    />
                    <InputError message={errors.company_bank_account_id} className="mt-1" />
                </div>

                {data.type === 'transfer' && (
                    <div>
                        <InputLabel value={t('accounting.transactions.counterparty')} />
                        <Select
                            className="mt-1"
                            options={accountOptions}
                            value={data.counterparty_account_id}
                            onChange={(value) => setData('counterparty_account_id', value)}
                            searchable
                        />
                        <InputError message={errors.counterparty_account_id} className="mt-1" />
                    </div>
                )}

                <div>
                    <InputLabel htmlFor="transacted_on" value={t('accounting.transactions.date')} />
                    <TextInput
                        id="transacted_on"
                        type="date"
                        className="mt-1 block w-full"
                        value={data.transacted_on}
                        onChange={(e) => setData('transacted_on', e.target.value)}
                        required
                    />
                    <InputError message={errors.transacted_on} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="amount" value={t('accounting.transactions.amount')} />
                    <TextInput
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="mt-1 block w-full"
                        value={data.amount}
                        onChange={(e) => setData('amount', e.target.value)}
                        required
                    />
                    <InputError message={errors.amount} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="reference" value={t('accounting.transactions.reference')} />
                    <TextInput
                        id="reference"
                        className="mt-1 block w-full"
                        value={data.reference}
                        onChange={(e) => setData('reference', e.target.value)}
                    />
                    <InputError message={errors.reference} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="memo" value={t('accounting.transactions.memo')} />
                    <TextInput
                        id="memo"
                        className="mt-1 block w-full"
                        value={data.memo}
                        onChange={(e) => setData('memo', e.target.value)}
                    />
                    <InputError message={errors.memo} className="mt-1" />
                </div>

                <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
            </form>
        </AccountingShell>
    );
}

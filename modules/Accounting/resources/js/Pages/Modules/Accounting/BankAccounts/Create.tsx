import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface LedgerOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    kinds: string[];
    ledgerAccounts: LedgerOption[];
}

export default function Create({ kinds, ledgerAccounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        kind: 'bank',
        bank_name: '',
        account_number: '',
        account_holder: '',
        account_id: ledgerAccounts[0]?.id ?? '',
        is_default: false,
        is_active: true,
        currency: 'IDR',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.bank-accounts.store'));
    };

    return (
        <AccountingShell active="bank" title={t('accounting.bank.create')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="name" value={t('accounting.bank.name')} />
                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="kind" value={t('accounting.bank.kind')} />
                    <select
                        id="kind"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={data.kind}
                        onChange={(e) => setData('kind', e.target.value)}
                    >
                        {kinds.map((kind) => (
                            <option key={kind} value={kind}>
                                {t(`accounting.bank.kinds.${kind}`, undefined, kind)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <InputLabel htmlFor="account_id" value={t('accounting.bank.coa')} />
                    <select
                        id="account_id"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={data.account_id}
                        onChange={(e) => setData('account_id', Number(e.target.value))}
                        required
                    >
                        {ledgerAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                                {account.code} — {account.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.account_id} className="mt-1" />
                </div>
                {data.kind === 'bank' && (
                    <>
                        <div>
                            <InputLabel htmlFor="bank_name" value={t('accounting.bank.bank_name')} />
                            <TextInput id="bank_name" className="mt-1 block w-full" value={data.bank_name} onChange={(e) => setData('bank_name', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="account_number" value={t('accounting.bank.account_number')} />
                            <TextInput id="account_number" className="mt-1 block w-full" value={data.account_number} onChange={(e) => setData('account_number', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="account_holder" value={t('accounting.bank.account_holder')} />
                            <TextInput id="account_holder" className="mt-1 block w-full" value={data.account_holder} onChange={(e) => setData('account_holder', e.target.value)} />
                        </div>
                    </>
                )}
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} />
                        {t('accounting.bank.default')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        {t('accounting.accounts.active')}
                    </label>
                </div>
                <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
            </form>
        </AccountingShell>
    );
}

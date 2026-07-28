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

interface Account {
    id: number;
    name: string;
    kind: string;
    bank_name: string | null;
    account_number: string | null;
    account_holder: string | null;
    account_id: number;
    is_default: boolean;
    is_active: boolean;
    currency: string;
}

interface LedgerOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    account: Account;
    kinds: string[];
    ledgerAccounts: LedgerOption[];
}

export default function Edit({ account, kinds, ledgerAccounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: account.name,
        kind: account.kind,
        bank_name: account.bank_name ?? '',
        account_number: account.account_number ?? '',
        account_holder: account.account_holder ?? '',
        account_id: String(account.account_id),
        is_default: account.is_default,
        is_active: account.is_active,
        currency: account.currency,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(prefixedRoute('accounting.bank-accounts.update', account.id));
    };

    return (
        <AccountingShell active="bank" title={t('accounting.bank.edit')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="name" value={t('accounting.bank.name')} />
                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="kind" value={t('accounting.bank.kind')} />
                    <Select
                        id="kind"
                        className="mt-1"
                        value={data.kind}
                        onChange={(value) => setData('kind', value)}
                        options={kinds.map((kind) => ({
                            value: kind,
                            label: t(`accounting.bank.kinds.${kind}`, undefined, kind),
                        }))}
                    />
                </div>
                <div>
                    <InputLabel htmlFor="account_id" value={t('accounting.bank.coa')} />
                    <Select
                        id="account_id"
                        className="mt-1"
                        searchable
                        value={String(data.account_id)}
                        onChange={(value) => setData('account_id', value)}
                        placeholder={t('accounting.bank.select_coa')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.no_options')}
                        noResultsText={t('common.no_results')}
                        options={ledgerAccounts.map((ledger) => ({
                            value: String(ledger.id),
                            label: `${ledger.code} — ${ledger.name}`,
                        }))}
                    />
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

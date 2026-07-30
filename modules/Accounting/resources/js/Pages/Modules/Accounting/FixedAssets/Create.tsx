import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface AccountOption {
    id: number;
    code: string;
    name: string;
    type: string;
    system_role: string | null;
}

interface Props {
    accounts: AccountOption[];
}

export default function Create({ accounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const findByRole = (role: string): string => {
        const match = accounts.find((a) => a.system_role === role);
        return match ? String(match.id) : '';
    };

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        category: '',
        acquisition_date: new Date().toISOString().slice(0, 10),
        acquisition_cost: '',
        salvage_value: '0',
        useful_life_months: '36',
        method: 'straight_line',
        asset_account_id: findByRole('fixed_asset'),
        accum_depr_account_id: findByRole('accum_depreciation'),
        expense_account_id: findByRole('depreciation_expense'),
        funding_account_id: findByRole('cash'),
        post_acquisition: true,
        notes: '',
    });

    const accountOptions = accounts.map((a) => ({
        value: String(a.id),
        label: `${a.code} — ${a.name}`,
    }));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.fixed-assets.store'));
    };

    return (
        <AccountingShell active="fixed_assets" title={t('accounting.fa.create')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value={t('accounting.fa.code')} />
                        <TextInput className="mt-1 block w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                        <InputError message={errors.code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('accounting.fa.category')} />
                        <TextInput className="mt-1 block w-full" value={data.category} onChange={(e) => setData('category', e.target.value)} />
                    </div>
                </div>
                <div>
                    <InputLabel value={t('accounting.fa.name')} />
                    <TextInput className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value={t('accounting.fa.acquisition_date')} />
                        <TextInput type="date" className="mt-1 block w-full" value={data.acquisition_date} onChange={(e) => setData('acquisition_date', e.target.value)} />
                    </div>
                    <div>
                        <InputLabel value={t('accounting.fa.useful_life')} />
                        <TextInput type="number" className="mt-1 block w-full" value={data.useful_life_months} onChange={(e) => setData('useful_life_months', e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel value={t('accounting.fa.cost')} />
                        <MoneyInput
                            className="mt-1 block w-full"
                            value={data.acquisition_cost}
                            onChange={(value) => setData('acquisition_cost', value)}
                        />
                        <InputError message={errors.acquisition_cost} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('accounting.fa.salvage')} />
                        <MoneyInput
                            className="mt-1 block w-full"
                            value={data.salvage_value}
                            onChange={(value) => setData('salvage_value', value)}
                        />
                    </div>
                </div>
                <div>
                    <InputLabel value={t('accounting.fa.asset_account')} />
                    <Select className="mt-1" searchable value={data.asset_account_id} onChange={(v) => setData('asset_account_id', v)} options={accountOptions} />
                </div>
                <div>
                    <InputLabel value={t('accounting.fa.accum_account')} />
                    <Select className="mt-1" searchable value={data.accum_depr_account_id} onChange={(v) => setData('accum_depr_account_id', v)} options={accountOptions} />
                </div>
                <div>
                    <InputLabel value={t('accounting.fa.expense_account')} />
                    <Select className="mt-1" searchable value={data.expense_account_id} onChange={(v) => setData('expense_account_id', v)} options={accountOptions} />
                </div>
                <div>
                    <InputLabel value={t('accounting.fa.funding_account')} />
                    <Select className="mt-1" searchable value={data.funding_account_id} onChange={(v) => setData('funding_account_id', v)} options={accountOptions} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={data.post_acquisition} onChange={(e) => setData('post_acquisition', e.target.checked)} />
                    {t('accounting.fa.post_acquisition')}
                </label>
                <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
            </form>
        </AccountingShell>
    );
}

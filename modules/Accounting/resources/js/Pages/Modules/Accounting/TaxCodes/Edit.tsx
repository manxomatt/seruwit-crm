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
    code: string;
    name: string;
    type: string;
}

interface TaxCodeData {
    id: number;
    code: string;
    name: string;
    category: string;
    rate: number;
    calculation: string;
    direction: string;
    output_account_id: number | null;
    input_account_id: number | null;
    wht_account_id: number | null;
    is_default: boolean;
    is_active: boolean;
    notes: string | null;
}

interface Props {
    taxCode: TaxCodeData;
    categories: string[];
    calculations: string[];
    directions: string[];
    accounts: AccountOption[];
}

export default function Edit({ taxCode, categories, calculations, directions, accounts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        code: taxCode.code,
        name: taxCode.name,
        category: taxCode.category,
        rate: String(taxCode.rate),
        calculation: taxCode.calculation,
        direction: taxCode.direction,
        output_account_id: taxCode.output_account_id ? String(taxCode.output_account_id) : '',
        input_account_id: taxCode.input_account_id ? String(taxCode.input_account_id) : '',
        wht_account_id: taxCode.wht_account_id ? String(taxCode.wht_account_id) : '',
        is_default: taxCode.is_default,
        is_active: taxCode.is_active,
        notes: taxCode.notes ?? '',
    });

    const accountOptions = [
        { value: '', label: '—' },
        ...accounts.map((account) => ({
            value: String(account.id),
            label: `${account.code} — ${account.name}`,
        })),
    ];

    const submit = (e: FormEvent) => {
        e.preventDefault();
        patch(prefixedRoute('accounting.tax-codes.update', taxCode.id));
    };

    return (
        <AccountingShell active="tax_codes" title={t('accounting.tax.edit')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="code" value={t('accounting.tax.code')} />
                        <TextInput id="code" className="mt-1 block w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                        <InputError message={errors.code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="rate" value={t('accounting.tax.rate')} />
                        <TextInput id="rate" type="number" step="0.01" className="mt-1 block w-full" value={data.rate} onChange={(e) => setData('rate', e.target.value)} required />
                        <InputError message={errors.rate} className="mt-1" />
                    </div>
                </div>
                <div>
                    <InputLabel htmlFor="name" value={t('accounting.tax.name')} />
                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <InputLabel value={t('accounting.tax.category')} />
                        <Select
                            className="mt-1"
                            value={data.category}
                            onChange={(value) => setData('category', value)}
                            options={categories.map((c) => ({
                                value: c,
                                label: t(`accounting.tax.categories.${c}`, undefined, c),
                            }))}
                        />
                    </div>
                    <div>
                        <InputLabel value={t('accounting.tax.calculation')} />
                        <Select
                            className="mt-1"
                            value={data.calculation}
                            onChange={(value) => setData('calculation', value)}
                            options={calculations.map((c) => ({
                                value: c,
                                label: t(`accounting.tax.calculations.${c}`, undefined, c),
                            }))}
                        />
                    </div>
                    <div>
                        <InputLabel value={t('accounting.tax.direction')} />
                        <Select
                            className="mt-1"
                            value={data.direction}
                            onChange={(value) => setData('direction', value)}
                            options={directions.map((d) => ({
                                value: d,
                                label: t(`accounting.tax.directions.${d}`, undefined, d),
                            }))}
                        />
                    </div>
                </div>
                {data.category !== 'wht' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t('accounting.tax.output_account')} />
                            <Select className="mt-1" searchable value={String(data.output_account_id)} onChange={(v) => setData('output_account_id', v)} options={accountOptions} />
                        </div>
                        <div>
                            <InputLabel value={t('accounting.tax.input_account')} />
                            <Select className="mt-1" searchable value={String(data.input_account_id)} onChange={(v) => setData('input_account_id', v)} options={accountOptions} />
                        </div>
                    </div>
                )}
                {data.category === 'wht' && (
                    <div>
                        <InputLabel value={t('accounting.tax.wht_account')} />
                        <Select className="mt-1" searchable value={String(data.wht_account_id)} onChange={(v) => setData('wht_account_id', v)} options={accountOptions} />
                        <InputError message={errors.wht_account_id} className="mt-1" />
                    </div>
                )}
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} />
                        {t('accounting.tax.default')}
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

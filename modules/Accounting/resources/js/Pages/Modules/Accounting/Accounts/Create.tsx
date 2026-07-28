import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface ParentOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    types: string[];
    parents: ParentOption[];
}

export default function Create({ types, parents }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        type: types[0] ?? 'asset',
        parent_id: '' as string | number,
        is_postable: true,
        is_active: true,
        normal_balance: '',
        system_role: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('accounting.accounts.store'));
    };

    return (
        <AccountingShell active="accounts" title={t('accounting.accounts.create')}>
            <form onSubmit={submit} className="max-w-xl space-y-4 rounded-lg bg-white p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="code" value={t('accounting.accounts.code')} />
                    <TextInput id="code" className="mt-1 block w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} required />
                    <InputError message={errors.code} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="name" value={t('accounting.accounts.name')} />
                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                    <InputError message={errors.name} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="type" value={t('accounting.accounts.type')} />
                    <select
                        id="type"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                    >
                        {types.map((type) => (
                            <option key={type} value={type}>
                                {t(`accounting.types.${type}`, undefined, type)}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.type} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="parent_id" value={t('accounting.accounts.parent')} />
                    <select
                        id="parent_id"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        value={data.parent_id}
                        onChange={(e) => setData('parent_id', e.target.value)}
                    >
                        <option value="">{t('accounting.accounts.no_parent')}</option>
                        {parents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                                {parent.code} — {parent.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={data.is_postable} onChange={(e) => setData('is_postable', e.target.checked)} />
                        {t('accounting.accounts.postable')}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                        {t('accounting.accounts.active')}
                    </label>
                </div>
                <div>
                    <InputLabel htmlFor="system_role" value={t('accounting.accounts.system_role')} />
                    <TextInput id="system_role" className="mt-1 block w-full" value={data.system_role} onChange={(e) => setData('system_role', e.target.value)} />
                </div>
                <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
            </form>
        </AccountingShell>
    );
}

import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

interface TaxCodeOption {
    id: number;
    code: string;
    name: string;
    rate: number;
    calculation: string;
}

interface PolicyRow {
    channel: string;
    module: string | null;
    label: string;
    tax_code_id: number | null;
    uses_default: boolean;
}

interface WorkspaceDefault {
    tax_code_id: number | null;
    tax_code: string | null;
    rate: number;
    enabled: boolean;
}

interface Props {
    policies: PolicyRow[];
    taxCodes: TaxCodeOption[];
    workspaceDefault: WorkspaceDefault;
    can: { manage: boolean };
}

const USE_DEFAULT = '';

export default function Index({ policies, taxCodes, workspaceDefault, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, put, processing, errors, transform } = useForm({
        policies: policies.map((row) => ({
            channel: row.channel,
            tax_code_id: row.tax_code_id === null ? USE_DEFAULT : String(row.tax_code_id),
        })),
    });

    const options = [
        {
            value: USE_DEFAULT,
            label: t('accounting.tax_policies.use_default', {
                code: workspaceDefault.tax_code ?? '—',
                rate: workspaceDefault.rate,
            }),
        },
        ...taxCodes.map((code) => ({
            value: String(code.id),
            label: `${code.code} — ${code.name} (${code.rate}%)`,
        })),
    ];

    const setPolicyCode = (index: number, value: string): void => {
        const next = [...data.policies];
        next[index] = {
            ...next[index],
            tax_code_id: value,
        };
        setData('policies', next);
    };

    const submit = (e: FormEvent): void => {
        e.preventDefault();
        transform((form) => ({
            policies: form.policies.map((row) => ({
                channel: row.channel,
                tax_code_id: row.tax_code_id === USE_DEFAULT || row.tax_code_id === ''
                    ? null
                    : Number(row.tax_code_id),
            })),
        }));
        put(prefixedRoute('accounting.tax-policies.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AccountingShell active="tax_policies" title={t('accounting.tax_policies.title')}>
            <p className="mb-4 text-sm text-gray-600">{t('accounting.tax_policies.hint')}</p>

            <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <span className="font-medium">{t('accounting.tax_policies.workspace_default')}: </span>
                {workspaceDefault.enabled
                    ? `${workspaceDefault.tax_code ?? '—'} (${workspaceDefault.rate}%)`
                    : t('accounting.tax_policies.workspace_default_off')}
                {' · '}
                <Link
                    href={prefixedRoute('accounting.tax-codes.index')}
                    className="font-medium text-indigo-700 underline hover:text-indigo-900"
                >
                    {t('accounting.tax_policies.manage_codes')}
                </Link>
            </div>

            <form onSubmit={submit} className="overflow-hidden rounded-lg bg-white shadow-sm">
                <table className="w-full">
                    <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">{t('accounting.tax_policies.columns.channel')}</th>
                            <th className="px-4 py-3">{t('accounting.tax_policies.columns.treatment')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.policies.map((row, index) => (
                            <tr key={row.channel} className="border-b">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {policies[index]?.label ?? row.channel}
                                    <div className="mt-0.5 font-mono text-xs font-normal text-gray-400">{row.channel}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {can.manage ? (
                                        <div>
                                            <InputLabel
                                                htmlFor={`policy-${row.channel}`}
                                                value={t('accounting.tax_policies.columns.treatment')}
                                                className="sr-only"
                                            />
                                            <Select
                                                id={`policy-${row.channel}`}
                                                className="max-w-md"
                                                value={row.tax_code_id}
                                                onChange={(value) => setPolicyCode(index, value)}
                                                options={options}
                                                searchable
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-700">
                                            {row.tax_code_id === USE_DEFAULT
                                                ? t('accounting.tax_policies.use_default', {
                                                      code: workspaceDefault.tax_code ?? '—',
                                                      rate: workspaceDefault.rate,
                                                  })
                                                : options.find((opt) => opt.value === row.tax_code_id)?.label}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {data.policies.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500">
                                    {t('accounting.tax_policies.empty')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {errors.policies && (
                    <p className="border-t px-4 py-3 text-sm text-red-600">{errors.policies}</p>
                )}

                {can.manage && data.policies.length > 0 && (
                    <div className="flex justify-end border-t px-4 py-3">
                        <PrimaryButton type="submit" disabled={processing}>
                            {t('common.save')}
                        </PrimaryButton>
                    </div>
                )}
            </form>
        </AccountingShell>
    );
}

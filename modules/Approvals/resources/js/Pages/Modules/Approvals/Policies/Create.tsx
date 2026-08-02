import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import ApprovalsNav from '../../../../ApprovalsNav';
import PageHeader from '@/Components/PageHeader';

interface TriggerMeta {
    label: string;
    description: string;
    condition_fields: Array<{ key: string; label: string; type: string }>;
}

interface Level {
    level: number;
    name: string;
    approver_type: string;
    approver_value: string;
}

interface Props {
    triggers: Record<string, TriggerMeta>;
    roles: Array<{ id: number; name: string; slug: string }>;
    users: Array<{ id: number; name: string; email: string }>;
    policy?: {
        id: number;
        key: string;
        name: string;
        trigger_type: string;
        is_active: boolean;
        description: string | null;
        conditions: Record<string, unknown> | null;
        levels: Level[];
    };
}

export default function PolicyForm({ triggers, roles, users, policy }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const editing = Boolean(policy);

    const { data, setData, post, patch, processing, errors } = useForm({
        key: policy?.key ?? '',
        name: policy?.name ?? '',
        trigger_type: policy?.trigger_type ?? Object.keys(triggers)[0] ?? '',
        is_active: policy?.is_active ?? true,
        description: policy?.description ?? '',
        conditions: {
            min_amount: String(policy?.conditions?.min_amount ?? ''),
            requires_exceeded: Boolean(policy?.conditions?.requires_exceeded ?? true),
            min_discount_percent: String(policy?.conditions?.min_discount_percent ?? ''),
            max_lead_hours: String(policy?.conditions?.max_lead_hours ?? ''),
        },
        levels: policy?.levels?.length
            ? policy.levels.map((l) => ({
                  level: l.level,
                  name: l.name,
                  approver_type: l.approver_type,
                  approver_value: l.approver_value,
              }))
            : [
                  {
                      level: 1,
                      name: t('approvals.form.level_n', { n: 1 }),
                      approver_type: 'permission',
                      approver_value: 'approvals.decide',
                  },
              ],
    });

    const trigger = triggers[data.trigger_type];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing && policy) {
            patch(prefixedRoute('approvals.policies.update', policy.id));
        } else {
            post(prefixedRoute('approvals.policies.store'));
        }
    };

    const updateLevel = (index: number, field: keyof Level, value: string | number): void => {
        const levels = [...data.levels];
        levels[index] = { ...levels[index], [field]: value };
        setData('levels', levels);
    };

    const title = editing ? t('approvals.form.edit_title') : t('approvals.form.new_title');

    return (
        <DynamicLayout header={<PageHeader title={title} />}>
            <Head title={title} />

            <ApprovalsNav />

            <form onSubmit={submit} className="space-y-5 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value={t('approvals.form.key')} />
                        <TextInput
                            className="mt-1 block w-full"
                            value={data.key}
                            onChange={(e) => setData('key', e.target.value)}
                            placeholder="large-po"
                        />
                        <InputError message={errors.key} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('approvals.form.name')} />
                        <TextInput
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel value={t('approvals.form.trigger')} />
                        <Select
                            className="mt-1 w-full"
                            value={data.trigger_type}
                            onChange={(value) => setData('trigger_type', value)}
                            placeholder={t('approvals.form.trigger')}
                            options={Object.entries(triggers).map(([key, meta]) => ({
                                value: key,
                                label: meta.label,
                            }))}
                        />
                        {trigger && <p className="mt-1 text-xs text-gray-500">{trigger.description}</p>}
                        <InputError message={errors.trigger_type} className="mt-1" />
                    </div>

                    <div className="space-y-4">
                        {trigger?.condition_fields?.map((field) => (
                            <div key={field.key}>
                                <InputLabel value={field.label} />
                                {field.type === 'boolean' ? (
                                    <label className="mt-2 flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(
                                                data.conditions[field.key as keyof typeof data.conditions],
                                            )}
                                            onChange={(e) =>
                                                setData('conditions', {
                                                    ...data.conditions,
                                                    [field.key]: e.target.checked,
                                                })
                                            }
                                        />
                                        {t('approvals.form.yes')}
                                    </label>
                                ) : (
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={String(
                                            data.conditions[field.key as keyof typeof data.conditions] ?? '',
                                        )}
                                        onChange={(e) =>
                                            setData('conditions', {
                                                ...data.conditions,
                                                [field.key]: e.target.value,
                                            })
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                    {t('approvals.form.active')}
                </label>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <InputLabel value={t('approvals.form.levels')} />
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:underline"
                            onClick={() =>
                                setData('levels', [
                                    ...data.levels,
                                    {
                                        level: data.levels.length + 1,
                                        name: t('approvals.form.level_n', { n: data.levels.length + 1 }),
                                        approver_type: 'role',
                                        approver_value: roles[0]?.slug ?? 'admin',
                                    },
                                ])
                            }
                        >
                            {t('approvals.form.add_level')}
                        </button>
                    </div>
                    <div className="space-y-3">
                        {data.levels.map((level, index) => (
                            <div key={index} className="grid gap-2 border border-gray-200 p-3 sm:grid-cols-4 sm:rounded-md">
                                <TextInput
                                    type="number"
                                    value={level.level}
                                    onChange={(e) => updateLevel(index, 'level', Number(e.target.value))}
                                    placeholder={t('approvals.form.level_number')}
                                />
                                <TextInput
                                    value={level.name}
                                    onChange={(e) => updateLevel(index, 'name', e.target.value)}
                                    placeholder={t('approvals.form.level_name')}
                                />
                                <Select
                                    className="w-full"
                                    value={level.approver_type}
                                    onChange={(value) => {
                                        const nextValue =
                                            value === 'role'
                                                ? (roles[0]?.slug ?? 'admin')
                                                : value === 'user'
                                                  ? String(users[0]?.id ?? '')
                                                  : 'approvals.decide';
                                        const levels = [...data.levels];
                                        levels[index] = {
                                            ...levels[index],
                                            approver_type: value,
                                            approver_value: nextValue,
                                        };
                                        setData('levels', levels);
                                    }}
                                    searchable={false}
                                    options={[
                                        {
                                            value: 'permission',
                                            label: t('approvals.form.approver_types.permission'),
                                        },
                                        { value: 'role', label: t('approvals.form.approver_types.role') },
                                        { value: 'user', label: t('approvals.form.approver_types.user') },
                                    ]}
                                />
                                {level.approver_type === 'role' ? (
                                    <Select
                                        className="w-full"
                                        value={level.approver_value}
                                        onChange={(value) => updateLevel(index, 'approver_value', value)}
                                        options={roles.map((role) => ({
                                            value: role.slug,
                                            label: role.name,
                                        }))}
                                    />
                                ) : level.approver_type === 'user' ? (
                                    <Select
                                        className="w-full"
                                        value={String(level.approver_value)}
                                        onChange={(value) => updateLevel(index, 'approver_value', value)}
                                        options={users.map((user) => ({
                                            value: String(user.id),
                                            label: user.name,
                                        }))}
                                    />
                                ) : (
                                    <TextInput
                                        value={level.approver_value}
                                        onChange={(e) => updateLevel(index, 'approver_value', e.target.value)}
                                        placeholder="approvals.decide"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <InputError message={errors.levels} className="mt-1" />
                </div>

                <div className="flex justify-end gap-2">
                    <Link href={prefixedRoute('approvals.policies.index')}>
                        <SecondaryButton type="button">{t('approvals.form.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>
                        {editing ? t('approvals.form.update') : t('approvals.form.create')}
                    </PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

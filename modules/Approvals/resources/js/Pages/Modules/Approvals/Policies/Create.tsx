import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import ApprovalsNav from '../../../../ApprovalsNav';

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
            : [{ level: 1, name: 'Level 1', approver_type: 'permission', approver_value: 'approvals.decide' }],
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

    const updateLevel = (index: number, field: keyof Level, value: string | number) => {
        const levels = [...data.levels];
        levels[index] = { ...levels[index], [field]: value };
        setData('levels', levels);
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{editing ? 'Edit Policy' : 'New Policy'}</h2>}>
            <Head title={editing ? 'Edit Policy' : 'New Policy'} />
            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ApprovalsNav />

                    <form onSubmit={submit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value="Key *" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value)}
                                    placeholder="large-po"
                                />
                                <InputError message={errors.key} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value="Name *" />
                                <TextInput
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value="Trigger *" />
                            <select
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
                                value={data.trigger_type}
                                onChange={(e) => setData('trigger_type', e.target.value)}
                            >
                                {Object.entries(triggers).map(([key, meta]) => (
                                    <option key={key} value={key}>
                                        {meta.label}
                                    </option>
                                ))}
                            </select>
                            {trigger && <p className="mt-1 text-xs text-gray-500">{trigger.description}</p>}
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                            />
                            Active
                        </label>

                        {trigger?.condition_fields?.map((field) => (
                            <div key={field.key}>
                                <InputLabel value={field.label} />
                                {field.type === 'boolean' ? (
                                    <label className="mt-2 flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(data.conditions[field.key as keyof typeof data.conditions])}
                                            onChange={(e) =>
                                                setData('conditions', {
                                                    ...data.conditions,
                                                    [field.key]: e.target.checked,
                                                })
                                            }
                                        />
                                        Ya
                                    </label>
                                ) : (
                                    <TextInput
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={String(data.conditions[field.key as keyof typeof data.conditions] ?? '')}
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

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <InputLabel value="Levels *" />
                                <button
                                    type="button"
                                    className="text-sm text-indigo-600 hover:underline"
                                    onClick={() =>
                                        setData('levels', [
                                            ...data.levels,
                                            {
                                                level: data.levels.length + 1,
                                                name: `Level ${data.levels.length + 1}`,
                                                approver_type: 'role',
                                                approver_value: roles[0]?.slug ?? 'admin',
                                            },
                                        ])
                                    }
                                >
                                    + Level
                                </button>
                            </div>
                            <div className="space-y-3">
                                {data.levels.map((level, index) => (
                                    <div key={index} className="grid gap-2 rounded border border-gray-200 p-3 sm:grid-cols-4">
                                        <TextInput
                                            type="number"
                                            value={level.level}
                                            onChange={(e) => updateLevel(index, 'level', Number(e.target.value))}
                                            placeholder="Level #"
                                        />
                                        <TextInput
                                            value={level.name}
                                            onChange={(e) => updateLevel(index, 'name', e.target.value)}
                                            placeholder="Name"
                                        />
                                        <select
                                            className="rounded-md border-gray-300 text-sm"
                                            value={level.approver_type}
                                            onChange={(e) => updateLevel(index, 'approver_type', e.target.value)}
                                        >
                                            <option value="permission">permission</option>
                                            <option value="role">role</option>
                                            <option value="user">user</option>
                                        </select>
                                        {level.approver_type === 'role' ? (
                                            <select
                                                className="rounded-md border-gray-300 text-sm"
                                                value={level.approver_value}
                                                onChange={(e) => updateLevel(index, 'approver_value', e.target.value)}
                                            >
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.slug}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : level.approver_type === 'user' ? (
                                            <select
                                                className="rounded-md border-gray-300 text-sm"
                                                value={level.approver_value}
                                                onChange={(e) => updateLevel(index, 'approver_value', e.target.value)}
                                            >
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </select>
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
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>{editing ? 'Update' : 'Create'}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

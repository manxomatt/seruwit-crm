import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Setting {
    id: number;
    key: string;
    group: string;
    value: string | null;
    type: string;
    label: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
}

interface Props {
    settings: Setting[];
    groups: string[];
    currentGroup: string;
    canEditValues: boolean;
    canManageStructure: boolean;
}

const formatGroupLabel = (group: string): string => group.charAt(0).toUpperCase() + group.slice(1);

const formatDisplayValue = (setting: Setting): string => {
    if (setting.type === 'boolean') {
        return setting.value === '1' ? 'Yes' : 'No';
    }
    return setting.value || '—';
};

export default function Group({ settings, groups, currentGroup, canEditValues, canManageStructure }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        group: currentGroup,
        settings: settings.map((setting) => ({ id: setting.id, value: setting.value ?? '' })),
    });
    const fieldErrors = errors as Record<string, string>;

    const updateValue = (index: number, value: string) => {
        const next = [...data.settings];
        next[index] = { ...next[index], value };
        setData('settings', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('settings.bulk-update'), { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!settingToDelete) return;
        setDeleteProcessing(true);
        router.delete(prefixedRoute('settings.destroy', settingToDelete.id), {
            onSuccess: () => setSettingToDelete(null),
            onFinish: () => setDeleteProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Settings</h2>}
        >
            <Head title={`Settings — ${formatGroupLabel(currentGroup)}`} />

            <div className="mb-6 flex items-center justify-between border-b border-gray-200">
                <nav className="-mb-px flex flex-wrap gap-6">
                    {groups.map((g) => (
                        <Link
                            key={g}
                            href={prefixedRoute('settings.group', g)}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                                g === currentGroup
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {formatGroupLabel(g)}
                        </Link>
                    ))}
                </nav>
                {canManageStructure && (
                    <Link href={`${prefixedRoute('settings.create')}?new_group=1`} className="whitespace-nowrap pb-3 text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        + New Group
                    </Link>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{formatGroupLabel(currentGroup)}</h3>
                        {canManageStructure && (
                            <Link href={`${prefixedRoute('settings.create')}?group=${currentGroup}`}>
                                <PrimaryButton type="button">Add Setting</PrimaryButton>
                            </Link>
                        )}
                    </div>

                    {settings.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No settings in this group yet</h3>
                            {canManageStructure && <p className="mt-1 text-sm text-gray-500">Add one to get started.</p>}
                        </div>
                    ) : !canEditValues ? (
                        <div className="space-y-6">
                            {settings.map((setting) => (
                                <div key={setting.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                    <InputLabel value={setting.label} />
                                    {setting.description && (
                                        <p className="mt-0.5 text-sm text-gray-500">{setting.description}</p>
                                    )}
                                    <p className="mt-2 text-sm text-gray-900">{formatDisplayValue(setting)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            {settings.map((setting, index) => (
                                <div key={setting.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <InputLabel htmlFor={`value-${setting.id}`} value={setting.label} />
                                            {setting.description && (
                                                <p className="mt-0.5 text-sm text-gray-500">{setting.description}</p>
                                            )}

                                            <div className="mt-2 max-w-xl">
                                                {setting.type === 'textarea' || setting.type === 'json' ? (
                                                    <textarea
                                                        id={`value-${setting.id}`}
                                                        rows={4}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                ) : setting.type === 'boolean' ? (
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                            checked={data.settings[index].value === '1'}
                                                            onChange={(e) => updateValue(index, e.target.checked ? '1' : '0')}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-600">Enabled</span>
                                                    </label>
                                                ) : (
                                                    <TextInput
                                                        id={`value-${setting.id}`}
                                                        type={setting.type === 'number' ? 'number' : setting.type === 'email' ? 'email' : setting.type === 'url' ? 'url' : 'text'}
                                                        className="block w-full"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                            {fieldErrors[`settings.${index}.value`] && (
                                                <p className="mt-1 text-sm text-red-600">{fieldErrors[`settings.${index}.value`]}</p>
                                            )}
                                        </div>

                                        {canManageStructure && (
                                            <div className="flex shrink-0 items-center gap-3 pt-6 text-sm">
                                                <Link href={prefixedRoute('settings.edit', setting.id)} className="text-indigo-600 hover:text-indigo-900">
                                                    Edit
                                                </Link>
                                                <button type="button" onClick={() => setSettingToDelete(setting)} className="text-red-600 hover:text-red-900">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center gap-4 pt-2">
                                <PrimaryButton disabled={processing}>Save Changes</PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={settingToDelete !== null}
                onClose={() => setSettingToDelete(null)}
                onConfirm={confirmDelete}
                processing={deleteProcessing}
                title="Delete Setting"
                message={
                    settingToDelete
                        ? `Are you sure you want to delete "${settingToDelete.label}" (key: ${settingToDelete.key})? This action cannot be undone.`
                        : 'Are you sure you want to delete this setting?'
                }
            />
        </DynamicLayout>
    );
}

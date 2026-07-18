import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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
    created_at: string;
    updated_at: string;
}

interface Props {
    setting: Setting;
    groups: string[];
}

export default function Edit({ setting, groups }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors } = useForm({
        key: setting.key,
        group: setting.group,
        value: setting.value || '',
        type: setting.type,
        label: setting.label,
        description: setting.description || '',
        is_public: setting.is_public,
        sort_order: setting.sort_order,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('settings.update', setting.id));
    };

    const settingTypes = [
        { value: 'text', label: 'Text' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'number', label: 'Number' },
        { value: 'email', label: 'Email' },
        { value: 'url', label: 'URL' },
        { value: 'select', label: 'Select' },
        { value: 'json', label: 'JSON' },
        { value: 'color', label: 'Color' },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Setting
                    </h2>
                </div>
            }
        >
            <Head title={`Edit Setting - ${setting.label}`} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl">
                        <div className="mb-4">
                            <InputLabel htmlFor="key" value="Key" />
                            <TextInput
                                id="key"
                                type="text"
                                name="key"
                                value={data.key}
                                className="mt-1 block w-full font-mono"
                                placeholder="e.g., site.name or email.smtp_host"
                                isFocused={true}
                                onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Only lowercase letters, numbers, underscores, and dots allowed.
                            </p>
                            <InputError message={errors.key} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="label" value="Label" />
                            <TextInput
                                id="label"
                                type="text"
                                name="label"
                                value={data.label}
                                className="mt-1 block w-full"
                                placeholder="e.g., Site Name"
                                onChange={(e) => setData('label', e.target.value)}
                            />
                            <InputError message={errors.label} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="group" value="Group" />
                            <Select
                                id="group"
                                className="mt-1"
                                value={data.group}
                                onChange={(value) => setData('group', value)}
                                options={[
                                    { value: 'general', label: 'General' },
                                    { value: 'site', label: 'Site' },
                                    { value: 'email', label: 'Email' },
                                    { value: 'social', label: 'Social' },
                                    { value: 'seo', label: 'SEO' },
                                    ...groups
                                        .filter((g) => !['general', 'site', 'email', 'social', 'seo'].includes(g))
                                        .map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) })),
                                ]}
                            />
                            <InputError message={errors.group} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="type" value="Type" />
                            <Select
                                id="type"
                                className="mt-1"
                                value={data.type}
                                onChange={(value) => setData('type', value)}
                                options={settingTypes}
                            />
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="value" value="Value" />
                            {data.type === 'textarea' || data.type === 'json' ? (
                                <textarea
                                    id="value"
                                    name="value"
                                    value={data.value}
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    onChange={(e) => setData('value', e.target.value)}
                                />
                            ) : data.type === 'boolean' ? (
                                <Select
                                    id="value"
                                    className="mt-1"
                                    value={data.value}
                                    onChange={(value) => setData('value', value)}
                                    placeholder="Select..."
                                    options={[
                                        { value: '1', label: 'Yes / True' },
                                        { value: '0', label: 'No / False' },
                                    ]}
                                />
                            ) : data.type === 'color' ? (
                                <div className="mt-1 flex items-center gap-3">
                                    <input
                                        id="value"
                                        type="color"
                                        className="h-10 w-14 cursor-pointer rounded-md border border-gray-300 bg-white p-1 shadow-sm"
                                        value={data.value || '#000000'}
                                        onChange={(e) => setData('value', e.target.value)}
                                    />
                                    <TextInput
                                        className="w-32 font-mono uppercase"
                                        value={data.value}
                                        placeholder="#000000"
                                        onChange={(e) => setData('value', e.target.value)}
                                    />
                                </div>
                            ) : (
                                <TextInput
                                    id="value"
                                    type={data.type === 'number' ? 'number' : data.type === 'email' ? 'email' : data.type === 'url' ? 'url' : 'text'}
                                    name="value"
                                    value={data.value}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('value', e.target.value)}
                                />
                            )}
                            <InputError message={errors.value} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="description" value="Description (optional)" />
                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Brief description of what this setting does..."
                                onChange={(e) => setData('description', e.target.value)}
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="sort_order" value="Sort Order" />
                            <TextInput
                                id="sort_order"
                                type="number"
                                name="sort_order"
                                value={data.sort_order}
                                className="mt-1 block w-32"
                                min={0}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                            />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>

                        <div className="mb-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_public"
                                    checked={data.is_public}
                                    onChange={(e) => setData('is_public', e.target.checked)}
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Make this setting publicly accessible
                                </span>
                            </label>
                            <InputError message={errors.is_public} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                Update Setting
                            </PrimaryButton>
                            <Link href={prefixedRoute('settings.group', setting.group)}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

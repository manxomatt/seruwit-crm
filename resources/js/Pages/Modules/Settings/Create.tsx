import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import ImageUploader from '@/Components/ImageUploader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PageHeader from '@/Components/PageHeader';

interface Props {
    groups: string[];
    selectedGroup: string | null;
    isNewGroup: boolean;
}

export default function Create({ groups, selectedGroup, isNewGroup }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [newGroupMode, setNewGroupMode] = useState(isNewGroup || groups.length === 0);
    const { data, setData, post, processing, errors } = useForm({
        key: '',
        group: newGroupMode ? '' : selectedGroup || groups[0] || 'general',
        value: '',
        type: 'text',
        label: '',
        description: '',
        is_public: false,
        sort_order: 0,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('settings.store'));
    };

    const settingTypes = [
        { value: 'text', label: t('settings.types.text') },
        { value: 'textarea', label: t('settings.types.textarea') },
        { value: 'boolean', label: t('settings.types.boolean') },
        { value: 'number', label: t('settings.types.number') },
        { value: 'email', label: t('settings.types.email') },
        { value: 'url', label: t('settings.types.url') },
        { value: 'select', label: t('settings.types.select') },
        { value: 'json', label: t('settings.types.json') },
        { value: 'color', label: t('settings.types.color') },
        { value: 'image', label: t('settings.types.image') },
    ];

    return (
        <DynamicLayout
            header={<PageHeader title={t('settings.pages.create.head')} />}
        >
            <Head title={t('settings.pages.create.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-xl">
                        <div className="mb-4">
                            <InputLabel htmlFor="key" value={t('settings.fields.key')} />
                            <TextInput
                                id="key"
                                type="text"
                                name="key"
                                value={data.key}
                                className="mt-1 block w-full font-mono"
                                placeholder={t('settings.placeholders.key')}
                                isFocused={true}
                                onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                {t('settings.placeholders.key_hint')}
                            </p>
                            <InputError message={errors.key} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="label" value={t('settings.fields.label')} />
                            <TextInput
                                id="label"
                                type="text"
                                name="label"
                                value={data.label}
                                className="mt-1 block w-full"
                                placeholder={t('settings.placeholders.label')}
                                onChange={(e) => setData('label', e.target.value)}
                            />
                            <InputError message={errors.label} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="group" value={t('settings.fields.group')} />
                            <div className="mt-1">
                                {newGroupMode ? (
                                    <>
                                        <TextInput
                                            id="group"
                                            name="group"
                                            value={data.group}
                                            className="block w-full font-mono"
                                            placeholder={t('settings.placeholders.group')}
                                            onChange={(e) => setData('group', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            {t('settings.placeholders.group_hint')}
                                        </p>
                                    </>
                                ) : (
                                    <Select
                                        id="group"
                                        value={data.group}
                                        onChange={(value) => setData('group', value)}
                                        options={groups.map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) }))}
                                    />
                                )}
                            </div>
                            {groups.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewGroupMode(!newGroupMode);
                                        setData('group', newGroupMode ? groups[0] || 'general' : '');
                                    }}
                                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    {newGroupMode ? t('settings.pages.create.choose_existing_group') : t('settings.pages.create.create_new_group')}
                                </button>
                            )}
                            <InputError message={errors.group} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="type" value={t('settings.fields.type')} />
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
                            <InputLabel htmlFor="value" value={t('settings.fields.value')} />
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
                                    placeholder={t('settings.boolean_options.select_placeholder')}
                                    options={[
                                        { value: '1', label: t('settings.boolean_options.true') },
                                        { value: '0', label: t('settings.boolean_options.false') },
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
                            ) : data.type === 'image' ? (
                                <ImageUploader
                                    value={data.value}
                                    onChange={(value) => setData('value', value)}
                                    className="mt-1"
                                />
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
                            <InputLabel htmlFor="description" value={t('settings.fields.description')} />
                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder={t('settings.placeholders.description')}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div className="mb-4">
                            <InputLabel htmlFor="sort_order" value={t('settings.fields.sort_order')} />
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
                                    {t('settings.fields.is_public')}
                                </span>
                            </label>
                            <InputError message={errors.is_public} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                {t('settings.pages.create.submit')}
                            </PrimaryButton>
                            <Link href={prefixedRoute('settings.group', selectedGroup || groups[0] || 'general')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

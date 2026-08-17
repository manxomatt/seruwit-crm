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

            <div className="mx-auto max-w-3xl">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="key" value={t('settings.fields.key')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="key"
                                type="text"
                                name="key"
                                value={data.key}
                                className="mt-1 block w-full font-mono !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                placeholder={t('settings.placeholders.key')}
                                isFocused={true}
                                onChange={(e) => setData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                {t('settings.placeholders.key_hint')}
                            </p>
                            <InputError message={errors.key} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="label" value={t('settings.fields.label')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="label"
                                type="text"
                                name="label"
                                value={data.label}
                                className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                placeholder={t('settings.placeholders.label')}
                                onChange={(e) => setData('label', e.target.value)}
                            />
                            <InputError message={errors.label} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="group" value={t('settings.fields.group')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1">
                                {newGroupMode ? (
                                    <>
                                        <TextInput
                                            id="group"
                                            name="group"
                                            value={data.group}
                                            className="block w-full font-mono !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            placeholder={t('settings.placeholders.group')}
                                            onChange={(e) => setData('group', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        />
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {t('settings.placeholders.group_hint')}
                                        </p>
                                    </>
                                ) : (
                                    <Select
                                        id="group"
                                        className="w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                    className="mt-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    {newGroupMode ? t('settings.pages.create.choose_existing_group') : t('settings.pages.create.create_new_group')}
                                </button>
                            )}
                            <InputError message={errors.group} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value={t('settings.fields.type')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <Select
                                id="type"
                                className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={data.type}
                                onChange={(value) => setData('type', value)}
                                options={settingTypes}
                            />
                            <InputError message={errors.type} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="value" value={t('settings.fields.value')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            {data.type === 'textarea' || data.type === 'json' ? (
                                <textarea
                                    id="value"
                                    name="value"
                                    value={data.value}
                                    rows={4}
                                    className="mt-1 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    onChange={(e) => setData('value', e.target.value)}
                                />
                            ) : data.type === 'boolean' ? (
                                <Select
                                    id="value"
                                    className="mt-1 w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                        className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm"
                                        value={data.value || '#000000'}
                                        onChange={(e) => setData('value', e.target.value)}
                                    />
                                    <TextInput
                                        className="w-32 font-mono uppercase !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
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
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    onChange={(e) => setData('value', e.target.value)}
                                />
                            )}
                            <InputError message={errors.value} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value={t('settings.fields.description')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="description"
                                name="description"
                                value={data.description}
                                rows={2}
                                className="mt-1 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                placeholder={t('settings.placeholders.description')}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                            <InputError message={errors.description} className="mt-1.5" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="sort_order" value={t('settings.fields.sort_order')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="sort_order"
                                    type="number"
                                    name="sort_order"
                                    value={data.sort_order}
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    min={0}
                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                />
                                <InputError message={errors.sort_order} className="mt-1.5" />
                            </div>

                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2.5 cursor-pointer w-full">
                                    <input
                                        type="checkbox"
                                        name="is_public"
                                        checked={data.is_public}
                                        onChange={(e) => setData('is_public', e.target.checked)}
                                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {t('settings.fields.is_public')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('settings.group', selectedGroup || groups[0] || 'general')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                {t('settings.pages.create.submit')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}


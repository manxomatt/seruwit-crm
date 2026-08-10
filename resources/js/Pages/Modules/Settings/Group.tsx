import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import PageHeader from '@/Components/PageHeader';

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

interface MailConfig {
    is_enabled: boolean;
    host: string | null;
    port: number | null;
    encryption: string | null;
    username: string | null;
    has_password: boolean;
    is_configured: boolean;
}

interface Props {
    groupSettings: Setting[];
    groups: string[];
    currentGroup: string;
    canEditValues: boolean;
    canManageStructure: boolean;
    appearanceResetUrl?: string | null;
    mailConfig?: MailConfig | null;
    mailConfigUpdateUrl?: string | null;
}

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    'general.system_mode': [
        { value: 'development', label: 'Development' },
        { value: 'production', label: 'Production' },
    ],
};

const formatGroupLabel = (group: string, t: (key: string) => string): string => {
    const key = `settings.groups.${group}`;
    const translated = t(key);
    return translated === key ? group.charAt(0).toUpperCase() + group.slice(1) : translated;
};

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

function MailSmtpForm({
    mailConfig,
    updateUrl,
    canEdit,
}: {
    mailConfig: MailConfig;
    updateUrl: string | null;
    canEdit: boolean;
}): JSX.Element {
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        is_enabled: mailConfig.is_enabled,
        host: mailConfig.host ?? '',
        port: mailConfig.port ?? 587,
        encryption: mailConfig.encryption ?? 'tls',
        username: mailConfig.username ?? '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!updateUrl) {
            return;
        }
        patch(updateUrl, { preserveScroll: true });
    };

    return (
        <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="mb-4">
                <h4 className="text-base font-medium text-gray-900">{t('settings.mail.title')}</h4>
                <p className="mt-1 text-sm text-gray-500">{t('settings.mail.subtitle')}</p>
                {mailConfig.is_configured ? (
                    <p className="mt-2 text-xs font-medium text-green-700">{t('settings.mail.status_active')}</p>
                ) : (
                    <p className="mt-2 text-xs text-amber-700">{t('settings.mail.status_inactive')}</p>
                )}
            </div>

            {!canEdit || !updateUrl ? (
                <div className="space-y-3 text-sm text-gray-700">
                    <p>
                        <span className="font-medium">{t('settings.mail.enabled')}:</span>{' '}
                        {mailConfig.is_enabled ? t('settings.value_display.yes') : t('settings.value_display.no')}
                    </p>
                    <p>
                        <span className="font-medium">{t('settings.mail.host')}:</span> {mailConfig.host || '—'}
                    </p>
                    <p>
                        <span className="font-medium">{t('settings.mail.port')}:</span> {mailConfig.port ?? '—'}
                    </p>
                    <p>
                        <span className="font-medium">{t('settings.mail.username')}:</span> {mailConfig.username || '—'}
                    </p>
                </div>
            ) : (
                <form onSubmit={submit} className="max-w-xl space-y-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={data.is_enabled}
                            onChange={(e) => setData('is_enabled', e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        />
                        {t('settings.mail.enabled')}
                    </label>

                    <div>
                        <InputLabel htmlFor="smtp_host" value={t('settings.mail.host')} />
                        <TextInput
                            id="smtp_host"
                            value={data.host}
                            onChange={(e) => setData('host', e.target.value)}
                            className="mt-1 block w-full"
                            placeholder="smtp.gmail.com"
                            autoComplete="off"
                        />
                        <InputError message={errors.host} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="smtp_port" value={t('settings.mail.port')} />
                            <TextInput
                                id="smtp_port"
                                type="number"
                                value={String(data.port)}
                                onChange={(e) => setData('port', Number(e.target.value) || 0)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={errors.port} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="smtp_encryption" value={t('settings.mail.encryption')} />
                            <select
                                id="smtp_encryption"
                                value={data.encryption}
                                onChange={(e) => setData('encryption', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="tls">{t('settings.mail.encryption_tls')}</option>
                                <option value="ssl">{t('settings.mail.encryption_ssl')}</option>
                                <option value="">{t('settings.mail.encryption_none')}</option>
                            </select>
                            <InputError message={errors.encryption} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="smtp_username" value={t('settings.mail.username')} />
                        <TextInput
                            id="smtp_username"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="off"
                        />
                        <InputError message={errors.username} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="smtp_password" value={t('settings.mail.password')} />
                        <TextInput
                            id="smtp_password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full"
                            placeholder={mailConfig.has_password ? '••••••••' : ''}
                            autoComplete="new-password"
                        />
                        <p className="mt-1 text-xs text-gray-400">{t('settings.mail.password_hint')}</p>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="pt-2">
                        <PrimaryButton disabled={processing}>{t('settings.mail.save')}</PrimaryButton>
                    </div>
                </form>
            )}
        </div>
    );
}

export default function Group({
    groupSettings,
    groups,
    currentGroup,
    canEditValues,
    canManageStructure,
    appearanceResetUrl = null,
    mailConfig = null,
    mailConfigUpdateUrl = null,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const [showResetAppearance, setShowResetAppearance] = useState(false);
    const [resetProcessing, setResetProcessing] = useState(false);
    const isAppearanceGroup = currentGroup === 'appearance';

    const formatDisplayValue = (setting: Setting): string => {
        if (setting.type === 'boolean') {
            return setting.value === '1' ? t('settings.value_display.yes') : t('settings.value_display.no');
        }
        if (setting.type === 'select' && setting.key in SELECT_OPTIONS) {
            const option = SELECT_OPTIONS[setting.key].find((item) => item.value === setting.value);
            return option?.label ?? setting.value ?? t('settings.value_display.empty');
        }
        return setting.value || t('settings.value_display.empty');
    };

    const { data, setData, post, processing, errors } = useForm({
        group: currentGroup,
        settings: groupSettings.map((setting) => ({ id: setting.id, value: setting.value ?? '' })),
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

    const confirmResetAppearance = () => {
        if (!appearanceResetUrl) {
            return;
        }

        setResetProcessing(true);
        router.post(
            appearanceResetUrl,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setShowResetAppearance(false),
                onFinish: () => setResetProcessing(false),
            },
        );
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('settings.pages.index.head')} />}
        >
            <Head title={t('settings.pages.group.title', { group: formatGroupLabel(currentGroup, t) })} />

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
                            {formatGroupLabel(g, t)}
                        </Link>
                    ))}
                </nav>
                {canManageStructure && (
                    <Link href={`${prefixedRoute('settings.create')}?new_group=1`} className="whitespace-nowrap pb-3 text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        {t('settings.pages.group.new_group')}
                    </Link>
                )}
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{formatGroupLabel(currentGroup, t)}</h3>
                        {canManageStructure && (
                            <Link href={`${prefixedRoute('settings.create')}?group=${currentGroup}`}>
                                <PrimaryButton type="button">{t('settings.pages.group.add_setting')}</PrimaryButton>
                            </Link>
                        )}
                    </div>

                    {groupSettings.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('settings.pages.group.empty_title')}</h3>
                            {canManageStructure && <p className="mt-1 text-sm text-gray-500">{t('settings.pages.group.empty_hint')}</p>}
                        </div>
                    ) : !canEditValues ? (
                        <div className="space-y-6">
                            {groupSettings.map((setting) => (
                                <div key={setting.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                                    <InputLabel value={setting.label} />
                                    {setting.description && (
                                        <p className="mt-0.5 text-sm text-gray-500">{setting.description}</p>
                                    )}
                                    {setting.type === 'color' && setting.value ? (
                                        <p className="mt-2 flex items-center gap-2 text-sm text-gray-900">
                                            <span
                                                className="inline-block h-5 w-5 rounded border border-gray-300"
                                                style={{ backgroundColor: setting.value }}
                                            />
                                            <span className="font-mono uppercase">{setting.value}</span>
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-sm text-gray-900">{formatDisplayValue(setting)}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            {groupSettings.map((setting, index) => (
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
                                                        <span className="ml-2 text-sm text-gray-600">{t('settings.pages.group.enabled_label')}</span>
                                                    </label>
                                                ) : setting.type === 'select' && setting.key in SELECT_OPTIONS ? (
                                                    <Select
                                                        id={`value-${setting.id}`}
                                                        className="w-full"
                                                        value={data.settings[index].value}
                                                        onChange={(value) => updateValue(index, value)}
                                                        options={SELECT_OPTIONS[setting.key]}
                                                    />
                                                ) : setting.type === 'color' ? (
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id={`value-${setting.id}`}
                                                            type="color"
                                                            className="h-10 w-14 cursor-pointer rounded-md border border-gray-300 bg-white p-1 shadow-sm"
                                                            value={data.settings[index].value || '#000000'}
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                        <TextInput
                                                            className="w-32 font-mono uppercase"
                                                            value={data.settings[index].value}
                                                            placeholder="#000000"
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                    </div>
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
                                            <div className="flex shrink-0 items-center gap-2 pt-6">
                                                <Link
                                                    href={prefixedRoute('settings.edit', setting.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title={t('common.edit')}
                                                >
                                                    <PencilIcon />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettingToDelete(setting)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <PrimaryButton disabled={processing}>{t('settings.pages.group.save')}</PrimaryButton>
                                {isAppearanceGroup && appearanceResetUrl && (
                                    <SecondaryButton
                                        type="button"
                                        disabled={processing || resetProcessing}
                                        onClick={() => setShowResetAppearance(true)}
                                    >
                                        {t('settings.pages.group.reset_appearance')}
                                    </SecondaryButton>
                                )}
                            </div>
                        </form>
                    )}

                    {mailConfig && (
                        <MailSmtpForm
                            mailConfig={mailConfig}
                            updateUrl={mailConfigUpdateUrl}
                            canEdit={canEditValues}
                        />
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={settingToDelete !== null}
                onClose={() => setSettingToDelete(null)}
                onConfirm={confirmDelete}
                processing={deleteProcessing}
                title={t('settings.delete_confirm.title')}
                message={
                    settingToDelete
                        ? t('settings.delete_confirm.message', { label: settingToDelete.label, key: settingToDelete.key })
                        : t('settings.delete_confirm.message_generic')
                }
            />

            <ConfirmDeleteDialog
                show={showResetAppearance && Boolean(appearanceResetUrl)}
                onClose={() => setShowResetAppearance(false)}
                onConfirm={confirmResetAppearance}
                processing={resetProcessing}
                title={t('settings.reset_appearance_confirm.title')}
                message={t('settings.reset_appearance_confirm.message')}
                confirmText={t('settings.pages.group.reset_appearance')}
            />
        </DynamicLayout>
    );
}

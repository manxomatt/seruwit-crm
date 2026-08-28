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
import ImageUploader from '@/Components/ImageUploader';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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

const GROUP_ICONS: Record<string, string> = {
    general: '⚙️',
    site: '🌐',
    seo: '🔍',
    appearance: '🎨',
    email: '✉️',
    social: '💬',
    units: '📏',
    maintenance: '🛠️',
};

const SELECT_OPTIONS: Record<string, { value: string; label: string; badge?: string; description?: string }[]> = {
    'general.system_mode': [
        {
            value: 'development',
            label: 'Development',
            badge: 'DEV',
            description: 'Mode pengembangan (debug aktif, simulasi email & OTP)',
        },
        {
            value: 'production',
            label: 'Production',
            badge: 'LIVE',
            description: 'Mode produksi (email nyata & sistem keamanan penuh)',
        },
    ],
};

const formatGroupLabel = (group: string, t: (key: string) => string): string => {
    const key = `settings.groups.${group}`;
    const translated = t(key);
    return translated === key ? group.charAt(0).toUpperCase() + group.slice(1) : translated;
};

const PencilIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">✉️ {t('settings.mail.title')}</h4>
                    {mailConfig.is_configured ? (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                            {t('settings.mail.status_active')}
                        </span>
                    ) : (
                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                            {t('settings.mail.status_inactive')}
                        </span>
                    )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{t('settings.mail.subtitle')}</p>
            </div>

            {!canEdit || !updateUrl ? (
                <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                        <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('settings.mail.enabled')}</span>
                        <span className="text-sm font-semibold">{mailConfig.is_enabled ? t('settings.value_display.yes') : t('settings.value_display.no')}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                        <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('settings.mail.host')}</span>
                        <span className="text-sm font-semibold font-mono">{mailConfig.host || '—'}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                        <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('settings.mail.port')}</span>
                        <span className="text-sm font-semibold">{mailConfig.port ?? '—'}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                        <span className="font-bold text-slate-400 uppercase text-[10px] block">{t('settings.mail.username')}</span>
                        <span className="text-sm font-semibold font-mono">{mailConfig.username || '—'}</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4 max-w-2xl">
                    <label className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_enabled}
                            onChange={(e) => setData('is_enabled', e.target.checked)}
                            className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{t('settings.mail.enabled')}</span>
                    </label>

                    <div>
                        <InputLabel htmlFor="smtp_host" value={t('settings.mail.host')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="smtp_host"
                            value={data.host}
                            onChange={(e) => setData('host', e.target.value)}
                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            placeholder="smtp.gmail.com"
                            autoComplete="off"
                        />
                        <InputError message={errors.host} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="smtp_port" value={t('settings.mail.port')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="smtp_port"
                                type="number"
                                value={String(data.port)}
                                onChange={(e) => setData('port', Number(e.target.value) || 0)}
                                className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            />
                            <InputError message={errors.port} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="smtp_encryption" value={t('settings.mail.encryption')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <select
                                id="smtp_encryption"
                                value={data.encryption}
                                onChange={(e) => setData('encryption', e.target.value)}
                                className="mt-1 block w-full rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="tls">{t('settings.mail.encryption_tls')}</option>
                                <option value="ssl">{t('settings.mail.encryption_ssl')}</option>
                                <option value="">{t('settings.mail.encryption_none')}</option>
                            </select>
                            <InputError message={errors.encryption} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="smtp_username" value={t('settings.mail.username')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="smtp_username"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            autoComplete="off"
                        />
                        <InputError message={errors.username} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="smtp_password" value={t('settings.mail.password')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="smtp_password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            placeholder={mailConfig.has_password ? '••••••••' : ''}
                            autoComplete="new-password"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">{t('settings.mail.password_hint')}</p>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="pt-2">
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                            {t('settings.mail.save')}
                        </PrimaryButton>
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
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

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

    const groupIcon = GROUP_ICONS[currentGroup] ?? '⚙️';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('settings.pages.index.head')}
                    actions={
                        canManageStructure ? (
                            <Link href={`${prefixedRoute('settings.create')}?group=${currentGroup}`}>
                                <PrimaryButton type="button" className="!rounded-xl text-xs shadow-sm">
                                    {t('settings.pages.group.add_setting')}
                                </PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('settings.pages.group.title', { group: formatGroupLabel(currentGroup, t) })} />

            <div className="space-y-6">
                {/* Alert Notifications */}
                {flash?.success && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}

                {/* Group Pill Navigation Bar */}
                <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
                    <nav className="flex items-center gap-1.5 overflow-x-auto">
                        {groups.map((g) => {
                            const active = g === currentGroup;
                            const icon = GROUP_ICONS[g] ?? '⚙️';
                            return (
                                <Link
                                    key={g}
                                    href={prefixedRoute('settings.group', g)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                                        active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{icon}</span>
                                    <span>{formatGroupLabel(g, t)}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {canManageStructure && (
                        <Link
                            href={`${prefixedRoute('settings.create')}?new_group=1`}
                            className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pr-2"
                        >
                            {t('settings.pages.group.new_group')}
                        </Link>
                    )}
                </div>

                {/* Settings Form Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{groupIcon}</span>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {formatGroupLabel(currentGroup, t)}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {groupSettings.length} pengaturan dalam grup ini
                                </p>
                            </div>
                        </div>

                        {isAppearanceGroup && appearanceResetUrl && (
                            <SecondaryButton
                                type="button"
                                disabled={processing || resetProcessing}
                                onClick={() => setShowResetAppearance(true)}
                                className="!rounded-xl text-xs"
                            >
                                🔄 {t('settings.pages.group.reset_appearance')}
                            </SecondaryButton>
                        )}
                    </div>

                    {groupSettings.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 text-xl font-bold">
                                ⚙️
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                {t('settings.pages.group.empty_title')}
                            </h3>
                            {canManageStructure && (
                                <p className="mt-1 text-xs text-slate-500">{t('settings.pages.group.empty_hint')}</p>
                            )}
                        </div>
                    ) : !canEditValues ? (
                        <div className="space-y-6">
                            {groupSettings.map((setting) => (
                                <div key={setting.id} className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-b-0 last:pb-0">
                                    <InputLabel value={setting.label} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    {setting.description && (
                                        <p className="mt-0.5 text-xs text-slate-500">{setting.description}</p>
                                    )}
                                    {setting.type === 'color' && setting.value ? (
                                        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                                            <span
                                                className="inline-block h-5 w-5 rounded-lg border border-slate-300 shadow-sm"
                                                style={{ backgroundColor: setting.value }}
                                            />
                                            <span className="font-mono uppercase">{setting.value}</span>
                                        </p>
                                    ) : (setting.type === 'image' || setting.key === 'site.logo' || setting.key === 'site.favicon') && setting.value ? (
                                        <div className="mt-2">
                                            <img
                                                src={setting.value}
                                                alt={setting.label}
                                                className="max-h-24 rounded-xl border border-slate-200 dark:border-slate-800 object-contain p-2 bg-slate-50 dark:bg-slate-800"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">{formatDisplayValue(setting)}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            {groupSettings.map((setting, index) => (
                                <div key={setting.id} className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-b-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <InputLabel htmlFor={`value-${setting.id}`} value={setting.label} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {setting.key}
                                                </span>
                                            </div>

                                            {setting.description && (
                                                <p className="mt-0.5 text-xs text-slate-500">{setting.description}</p>
                                            )}

                                            <div className="mt-2.5 max-w-xl">
                                                {setting.type === 'textarea' || setting.type === 'json' ? (
                                                    <textarea
                                                        id={`value-${setting.id}`}
                                                        rows={4}
                                                        className="block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                ) : setting.type === 'boolean' ? (
                                                    <label className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                                                        data.settings[index].value === '1'
                                                            ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                            : 'border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
                                                    }`}>
                                                        <div className="flex items-center gap-2">
                                                            {setting.key === 'general.ai_features_enabled' && (
                                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs text-white shadow-xs">✨</span>
                                                            )}
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {data.settings[index].value === '1'
                                                                    ? (setting.key === 'general.ai_features_enabled' ? 'Aktif (AI Features Enabled)' : t('settings.pages.group.enabled_label'))
                                                                    : (setting.key === 'general.ai_features_enabled' ? 'Nonaktif (AI Features Disabled)' : 'Nonaktif')}
                                                            </span>
                                                        </div>
                                                        <div className="relative shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={data.settings[index].value === '1'}
                                                                onChange={(e) => updateValue(index, e.target.checked ? '1' : '0')}
                                                            />
                                                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 peer-checked:bg-indigo-600 transition-colors dark:bg-slate-700" />
                                                            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm" />
                                                        </div>
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
                                                            className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm"
                                                            value={data.settings[index].value || '#000000'}
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                        <TextInput
                                                            className="w-32 font-mono uppercase !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                            value={data.settings[index].value}
                                                            placeholder="#000000"
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                    </div>
                                                ) : setting.type === 'image' || setting.key === 'site.logo' || setting.key === 'site.favicon' ? (
                                                    <ImageUploader
                                                        value={data.settings[index].value}
                                                        onChange={(value) => updateValue(index, value)}
                                                    />
                                                ) : (
                                                    <TextInput
                                                        id={`value-${setting.id}`}
                                                        type={setting.type === 'number' ? 'number' : setting.type === 'email' ? 'email' : setting.type === 'url' ? 'url' : 'text'}
                                                        className="block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                            {fieldErrors[`settings.${index}.value`] && (
                                                <p className="mt-1.5 text-xs font-semibold text-rose-500">{fieldErrors[`settings.${index}.value`]}</p>
                                            )}
                                        </div>

                                        {canManageStructure && (
                                            <div className="flex shrink-0 items-center gap-2 pt-1">
                                                <Link
                                                    href={prefixedRoute('settings.edit', setting.id)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-all"
                                                    title={t('common.edit')}
                                                >
                                                    <PencilIcon />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettingToDelete(setting)}
                                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-all"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-end pt-2">
                                <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                    {t('settings.pages.group.save')}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>

                {mailConfig && (
                    <MailSmtpForm
                        mailConfig={mailConfig}
                        updateUrl={mailConfigUpdateUrl}
                        canEdit={canEditValues}
                    />
                )}
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


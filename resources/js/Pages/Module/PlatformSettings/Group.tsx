import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface PlatformSetting {
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
    groupSettings: PlatformSetting[];
    groups: string[];
    currentGroup: string;
    systemModes: string[];
}

const GROUP_ICONS: Record<string, string> = {
    general: '⚙️',
    capacity: '🚗',
    billing: '💳',
    email: '✉️',
    security: '🛡️',
};

export default function Group({
    groupSettings,
    groups,
    currentGroup,
    systemModes,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage<{ flash?: { success?: string } }>().props;

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        group: currentGroup,
        settings: groupSettings.map((s) => ({
            id: s.id,
            value: s.value ?? '',
        })),
    });

    const updateValue = (index: number, value: string) => {
        const next = [...data.settings];
        next[index] = { ...next[index], value };
        setData('settings', next);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('module.platform-settings.bulk-update'), { preserveScroll: true });
    };

    const formatGroupLabel = (group: string): string => {
        const key = `settings.groups.${group}`;
        const translated = t(key);
        return translated === key ? group.charAt(0).toUpperCase() + group.slice(1) : translated;
    };

    const modeOptions = (systemModes || ['development', 'production']).map((mode) => ({
        value: mode,
        label: mode.charAt(0).toUpperCase() + mode.slice(1),
        badge: mode === 'production' ? 'LIVE' : 'DEV',
        description:
            mode === 'production'
                ? 'Mode produksi live (email nyata & keamanan aktif)'
                : 'Mode pengembangan (debug, simulasi email & OTP)',
    }));

    const groupIcon = GROUP_ICONS[currentGroup] ?? '⚙️';

    return (
        <DynamicLayout
            header={<PageHeader title={t('platform_settings.title', undefined, 'Pengaturan Platform')} />}
        >
            <Head title={t('platform_settings.title', undefined, 'Pengaturan Platform')} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Global Scope Banner */}
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 text-xs font-medium text-amber-900 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    <span className="text-base shrink-0">🌐</span>
                    <p>
                        {t(
                            'platform_settings.scope_hint',
                            undefined,
                            'Pengaturan global platform — berlaku untuk seluruh workspace tenant di sistem. Hanya dapat dikonfigurasi oleh Admin Central.',
                        )}
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                ✓
                            </span>
                            <span>{flash.success}</span>
                        </div>
                    </div>
                )}

                {/* Group Pill Navigation Bar */}
                <div className="flex items-center justify-between gap-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <nav className="flex items-center gap-1.5 overflow-x-auto">
                        {groups.map((g) => {
                            const active = g === currentGroup;
                            const icon = GROUP_ICONS[g] ?? '⚙️';
                            return (
                                <Link
                                    key={g}
                                    href={route('module.platform-settings.group', g)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shrink-0 ${
                                        active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{icon}</span>
                                    <span>{formatGroupLabel(g)}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Settings Form Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                    <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{groupIcon}</span>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {formatGroupLabel(currentGroup)}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {groupSettings.length} pengaturan platform di grup ini
                                </p>
                            </div>
                        </div>
                    </div>

                    {groupSettings.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl font-bold text-indigo-600">
                                ⚙️
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                                Belum ada pengaturan di grup ini
                            </h3>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            {groupSettings.map((setting, index) => (
                                <div
                                    key={setting.id}
                                    className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0 dark:border-slate-800"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <InputLabel
                                                    htmlFor={`value-${setting.id}`}
                                                    value={setting.label}
                                                    className="!text-xs !font-bold !uppercase !tracking-wider"
                                                />
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-slate-800">
                                                    {setting.key}
                                                </span>
                                            </div>

                                            {setting.description && (
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {setting.description}
                                                </p>
                                            )}

                                            <div className="mt-3 max-w-xl">
                                                {setting.type === 'textarea' || setting.type === 'json' ? (
                                                    <textarea
                                                        id={`value-${setting.id}`}
                                                        rows={4}
                                                        className="block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-xs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                ) : setting.type === 'boolean' ? (
                                                    <label
                                                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                                                            data.settings[index].value === '1'
                                                                ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                                                : 'border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {setting.key === 'general.ai_features_enabled' && (
                                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-xs text-white shadow-xs">
                                                                    ✨
                                                                </span>
                                                            )}
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                                {data.settings[index].value === '1'
                                                                    ? 'Aktif (Enabled)'
                                                                    : 'Nonaktif (Disabled)'}
                                                            </span>
                                                        </div>
                                                        <div className="relative shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="peer sr-only"
                                                                checked={data.settings[index].value === '1'}
                                                                onChange={(e) =>
                                                                    updateValue(index, e.target.checked ? '1' : '0')
                                                                }
                                                            />
                                                            <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 peer-checked:bg-indigo-600 dark:bg-slate-700" />
                                                            <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-5" />
                                                        </div>
                                                    </label>
                                                ) : setting.key === 'general.system_mode' ? (
                                                    <Select
                                                        id={`value-${setting.id}`}
                                                        className="w-full max-w-sm"
                                                        value={data.settings[index].value}
                                                        onChange={(value) => updateValue(index, value)}
                                                        options={modeOptions}
                                                    />
                                                ) : setting.type === 'number' ? (
                                                    <div className="flex items-center gap-3">
                                                        <TextInput
                                                            id={`value-${setting.id}`}
                                                            type="number"
                                                            className="block w-48 !rounded-xl !py-2 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                            value={data.settings[index].value}
                                                            onChange={(e) => updateValue(index, e.target.value)}
                                                        />
                                                        {setting.key.includes('days') && (
                                                            <span className="text-xs font-medium text-slate-500">
                                                                Hari
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <TextInput
                                                        id={`value-${setting.id}`}
                                                        type={
                                                            setting.type === 'email'
                                                                ? 'email'
                                                                : setting.type === 'url'
                                                                  ? 'url'
                                                                  : 'text'
                                                        }
                                                        className="block w-full !rounded-xl !py-2 text-xs border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                                        value={data.settings[index].value}
                                                        onChange={(e) => updateValue(index, e.target.value)}
                                                    />
                                                )}

                                                <InputError
                                                    message={
                                                        (errors as Record<string, string>)[`settings.${index}.value`]
                                                    }
                                                    className="mt-1.5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-xs">
                                    {t('platform_settings.save', undefined, 'Simpan Pengaturan Platform')}
                                </PrimaryButton>
                                {recentlySuccessful && (
                                    <span className="text-xs font-bold text-emerald-600">
                                        ✅ {t('platform_settings.saved', undefined, 'Tersimpan')}
                                    </span>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

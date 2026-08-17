import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import PageHeader from '@/Components/PageHeader';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
}

interface Props {
    role: Role;
    rolePermissions: number[];
    lockedPermissionIds?: number[];
    permissions: Record<string, Permission[]>;
    modules: Record<string, string>;
    actions: Record<string, string>;
}

export default function Edit({
    role,
    rolePermissions,
    lockedPermissionIds = [],
    permissions,
    modules,
    actions,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const lockedIds = useMemo(() => new Set(lockedPermissionIds), [lockedPermissionIds]);
    const { data, setData, patch, processing, errors } = useForm({
        name: role.name,
        description: role.description || '',
        permissions: rolePermissions,
    });

    const isLocked = (permissionId: number): boolean => lockedIds.has(permissionId);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('roles.update', role.id));
    };

    const togglePermission = (permissionId: number) => {
        if (isLocked(permissionId)) {
            return;
        }

        if (data.permissions.includes(permissionId)) {
            setData(
                'permissions',
                data.permissions.filter((id) => id !== permissionId),
            );
        } else {
            setData('permissions', [...data.permissions, permissionId]);
        }
    };

    const toggleModulePermissions = (modulePermissions: Permission[]) => {
        const unlockedIds = modulePermissions.map((p) => p.id).filter((id) => !isLocked(id));

        if (unlockedIds.length === 0) {
            return;
        }

        const allUnlockedSelected = unlockedIds.every((id) => data.permissions.includes(id));

        if (allUnlockedSelected) {
            setData(
                'permissions',
                data.permissions.filter((id) => !unlockedIds.includes(id)),
            );
        } else {
            const next = [...data.permissions];
            unlockedIds.forEach((id) => {
                if (!next.includes(id)) {
                    next.push(id);
                }
            });
            setData('permissions', next);
        }
    };

    const selectAllPermissions = () => {
        const allPermissionIds = Object.values(permissions)
            .flat()
            .map((p) => p.id);
        setData('permissions', allPermissionIds);
    };

    const clearAllPermissions = () => {
        setData(
            'permissions',
            data.permissions.filter((id) => isLocked(id)),
        );
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('roles.pages.edit.head', { name: role.name })}
                    actions={
                        <Link href={prefixedRoute('roles.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('roles.actions.back_to_roles')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('roles.pages.edit.title', { name: role.name })} />

            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    {role.is_system && (
                        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-700 dark:text-amber-300">
                            <div className="flex items-center gap-3">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 font-bold">🔒</span>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{t('roles.pages.edit.system_notice_title')}</h4>
                                    <p className="mt-0.5 text-slate-500">{t('roles.pages.edit.system_notice_body')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-5">
                            <div>
                                <InputLabel htmlFor="name" value={t('roles.fields.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 disabled:opacity-60"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    disabled={role.is_system}
                                    placeholder={t('roles.placeholders.name')}
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value={t('roles.fields.description')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    disabled={role.is_system}
                                    placeholder={t('roles.placeholders.description')}
                                />
                                <InputError message={errors.description} className="mt-1.5" />
                            </div>

                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2 border border-slate-200/60 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('roles.pages.show.information')}</h4>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('roles.pages.show.slug')}:</span>
                                        <span className="text-slate-900 dark:text-white font-mono font-bold">{role.slug}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">{t('roles.fields.type')}:</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{role.is_system ? t('roles.type.system') : t('roles.type.custom')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <InputLabel value={t('roles.fields.permissions')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllPermissions}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        {t('roles.actions.select_all')}
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-700">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAllPermissions}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                        {t('roles.actions.clear_extras')}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
                                {Object.entries(permissions).map(([module, modulePermissions]) => {
                                    const modulePermissionIds = modulePermissions.map((p) => p.id);
                                    const unlockedIds = modulePermissionIds.filter((id) => !isLocked(id));
                                    const allSelected = modulePermissionIds.every((id) => data.permissions.includes(id));
                                    const someSelected = modulePermissionIds.some((id) => data.permissions.includes(id));
                                    const moduleToggleDisabled = unlockedIds.length === 0;

                                    return (
                                        <div key={module} className="p-4">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <label className={`flex items-center gap-2 ${moduleToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = someSelected && !allSelected;
                                                            }
                                                        }}
                                                        onChange={() => toggleModulePermissions(modulePermissions)}
                                                        disabled={moduleToggleDisabled}
                                                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                    />
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                                        🧩 {modules[module] || module}
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => {
                                                    const locked = isLocked(permission.id);

                                                    return (
                                                        <label
                                                            key={permission.id}
                                                            className={`flex items-center gap-2 text-xs ${locked ? 'cursor-not-allowed opacity-60 text-slate-400' : 'cursor-pointer text-slate-700 dark:text-slate-300'}`}
                                                            title={locked ? t('roles.pages.edit.default_permission_locked') : undefined}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.permissions.includes(permission.id)}
                                                                onChange={() => togglePermission(permission.id)}
                                                                disabled={locked}
                                                                className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                            />
                                                            <span>
                                                                {actions[permission.action] || permission.action}
                                                                {locked && (
                                                                    <span className="ml-1 rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-600">
                                                                        {t('roles.pages.edit.default_badge')}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={errors.permissions} className="mt-1.5" />

                            <p className="mt-2 text-xs font-bold text-slate-500">
                                {t('roles.permissions_selected', { count: data.permissions.length })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href={prefixedRoute('roles.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                            {processing ? t('roles.pages.edit.submitting') : t('roles.pages.edit.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}


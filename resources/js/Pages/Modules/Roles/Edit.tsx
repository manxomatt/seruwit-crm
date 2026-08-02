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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('roles.pages.edit.head', { name: role.name })}
                    </h2>
                    <Link href={prefixedRoute('roles.index')}>
                        <SecondaryButton>{t('roles.actions.back_to_roles')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('roles.pages.edit.title', { name: role.name })} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <form onSubmit={submit} className="p-6">
                    {role.is_system && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex">
                                <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">{t('roles.pages.edit.system_notice_title')}</h3>
                                    <p className="mt-1 text-sm text-yellow-700">
                                        {t('roles.pages.edit.system_notice_body')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value={t('roles.fields.name')} />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    disabled={role.is_system}
                                    placeholder={t('roles.placeholders.name')}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value={t('roles.fields.description')} />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    disabled={role.is_system}
                                    placeholder={t('roles.placeholders.description')}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">{t('roles.pages.show.information')}</h4>
                                <dl className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">{t('roles.pages.show.slug')}:</dt>
                                        <dd className="text-gray-900 font-mono">{role.slug}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">{t('roles.fields.type')}:</dt>
                                        <dd className="text-gray-900">{role.is_system ? t('roles.type.system') : t('roles.type.custom')}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <InputLabel value={t('roles.fields.permissions')} />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllPermissions}
                                        className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        {t('roles.actions.select_all')}
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={clearAllPermissions}
                                        className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        {t('roles.actions.clear_extras')}
                                    </button>
                                </div>
                            </div>

                            <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                                {Object.entries(permissions).map(([module, modulePermissions]) => {
                                    const modulePermissionIds = modulePermissions.map((p) => p.id);
                                    const unlockedIds = modulePermissionIds.filter((id) => !isLocked(id));
                                    const allSelected = modulePermissionIds.every((id) => data.permissions.includes(id));
                                    const someSelected = modulePermissionIds.some((id) => data.permissions.includes(id));
                                    const moduleToggleDisabled = unlockedIds.length === 0;

                                    return (
                                        <div key={module} className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className={`flex items-center ${moduleToggleDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
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
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 disabled:opacity-50"
                                                    />
                                                    <span className="ml-2 font-medium text-gray-900">
                                                        {modules[module] || module}
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => {
                                                    const locked = isLocked(permission.id);

                                                    return (
                                                        <label
                                                            key={permission.id}
                                                            className={`flex items-center ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                            title={locked ? t('roles.pages.edit.default_permission_locked') : undefined}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={data.permissions.includes(permission.id)}
                                                                onChange={() => togglePermission(permission.id)}
                                                                disabled={locked}
                                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 disabled:opacity-50"
                                                            />
                                                            <span className={`ml-2 text-sm ${locked ? 'text-gray-500' : 'text-gray-700'}`}>
                                                                {actions[permission.action] || permission.action}
                                                                {locked && (
                                                                    <span className="ml-1 text-[10px] uppercase tracking-wide text-amber-700">
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
                            <InputError message={errors.permissions} className="mt-2" />

                            <p className="mt-2 text-sm text-gray-500">
                                {t('roles.permissions_selected', { count: data.permissions.length })}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-4">
                        <Link href={prefixedRoute('roles.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton disabled={processing}>
                            {processing ? t('roles.pages.edit.submitting') : t('roles.pages.edit.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

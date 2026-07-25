import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    module: string;
    action: string;
    description: string | null;
}

interface Props {
    permissions: Record<string, Permission[]>;
    modules: Record<string, string>;
    actions: Record<string, string>;
}

export default function Create({ permissions, modules, actions }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        permissions: [] as number[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('roles.store'));
    };

    const togglePermission = (permissionId: number) => {
        if (data.permissions.includes(permissionId)) {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        } else {
            setData('permissions', [...data.permissions, permissionId]);
        }
    };

    const toggleModulePermissions = (modulePermissions: Permission[]) => {
        const modulePermissionIds = modulePermissions.map(p => p.id);
        const allSelected = modulePermissionIds.every(id => data.permissions.includes(id));
        
        if (allSelected) {
            setData('permissions', data.permissions.filter(id => !modulePermissionIds.includes(id)));
        } else {
            const newPermissions = [...data.permissions];
            modulePermissionIds.forEach(id => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            setData('permissions', newPermissions);
        }
    };

    const selectAllPermissions = () => {
        const allPermissionIds = Object.values(permissions).flat().map(p => p.id);
        setData('permissions', allPermissionIds);
    };

    const clearAllPermissions = () => {
        setData('permissions', []);
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('roles.pages.create.head')}
                    </h2>
                    <Link href={prefixedRoute('roles.index')}>
                        <SecondaryButton>{t('roles.actions.back_to_roles')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={t('roles.pages.create.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <form onSubmit={submit} className="p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column - Role Details */}
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
                                    autoFocus
                                    placeholder={t('roles.placeholders.name')}
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value={t('roles.fields.description')} />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder={t('roles.placeholders.description')}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>
                        </div>

                        {/* Right Column - Permissions */}
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
                                        {t('roles.actions.clear_all')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
                                {Object.entries(permissions).map(([module, modulePermissions]) => {
                                    const modulePermissionIds = modulePermissions.map(p => p.id);
                                    const allSelected = modulePermissionIds.every(id => data.permissions.includes(id));
                                    const someSelected = modulePermissionIds.some(id => data.permissions.includes(id));
                                    
                                    return (
                                        <div key={module} className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = someSelected && !allSelected;
                                                            }
                                                        }}
                                                        onChange={() => toggleModulePermissions(modulePermissions)}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    />
                                                    <span className="ml-2 font-medium text-gray-900">
                                                        {modules[module] || module}
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => (
                                                    <label
                                                        key={permission.id}
                                                        className="flex items-center cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.permissions.includes(permission.id)}
                                                            onChange={() => togglePermission(permission.id)}
                                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">
                                                            {actions[permission.action] || permission.action}
                                                        </span>
                                                    </label>
                                                ))}
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
                            {processing ? t('roles.pages.create.submitting') : t('roles.pages.create.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

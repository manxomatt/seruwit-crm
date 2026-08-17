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
import PageHeader from '@/Components/PageHeader';

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
                <PageHeader
                    title={t('roles.pages.create.head')}
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
            <Head title={t('roles.pages.create.title')} />

            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column - Role Details */}
                        <div className="space-y-5">
                            <div>
                                <InputLabel htmlFor="name" value={t('roles.fields.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder={t('roles.placeholders.name')}
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value={t('roles.fields.description')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder={t('roles.placeholders.description')}
                                />
                                <InputError message={errors.description} className="mt-1.5" />
                            </div>
                        </div>

                        {/* Right Column - Permissions */}
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
                                        {t('roles.actions.clear_all')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
                                {Object.entries(permissions).map(([module, modulePermissions]) => {
                                    const modulePermissionIds = modulePermissions.map(p => p.id);
                                    const allSelected = modulePermissionIds.every(id => data.permissions.includes(id));
                                    const someSelected = modulePermissionIds.some(id => data.permissions.includes(id));
                                    
                                    return (
                                        <div key={module} className="p-4">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = someSelected && !allSelected;
                                                            }
                                                        }}
                                                        onChange={() => toggleModulePermissions(modulePermissions)}
                                                        className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                                        🧩 {modules[module] || module}
                                                    </span>
                                                </label>
                                            </div>
                                            <div className="ml-6 grid grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => (
                                                    <label
                                                        key={permission.id}
                                                        className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.permissions.includes(permission.id)}
                                                            onChange={() => togglePermission(permission.id)}
                                                            className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span>
                                                            {actions[permission.action] || permission.action}
                                                        </span>
                                                    </label>
                                                ))}
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
                            {processing ? t('roles.pages.create.submitting') : t('roles.pages.create.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}


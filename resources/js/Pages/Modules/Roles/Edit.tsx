import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

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

const getModuleIcon = (moduleKey: string): string => {
    switch (moduleKey.toLowerCase()) {
        case 'fleet':
            return '🚗';
        case 'rental':
            return '🔑';
        case 'transportation':
            return '🚚';
        case 'accounting':
            return '💰';
        case 'maintenance':
            return '🛠️';
        case 'inventory':
            return '📦';
        case 'attendance':
            return '⏱️';
        case 'payroll':
            return '💵';
        case 'users':
            return '👥';
        case 'roles':
            return '🛡️';
        case 'settings':
            return '⚙️';
        case 'dashboard':
            return '📊';
        case 'reports':
            return '📈';
        case 'customers':
            return '👤';
        default:
            return '🧩';
    }
};

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

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // Collapsible states per module (all expanded by default)
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(permissions).forEach((mod) => {
            initial[mod] = true;
        });
        return initial;
    });

    const toggleExpand = (mod: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [mod]: !prev[mod],
        }));
    };

    const expandAll = () => {
        const next: Record<string, boolean> = {};
        Object.keys(permissions).forEach((mod) => {
            next[mod] = true;
        });
        setExpandedModules(next);
    };

    const collapseAll = () => {
        const next: Record<string, boolean> = {};
        Object.keys(permissions).forEach((mod) => {
            next[mod] = false;
        });
        setExpandedModules(next);
    };

    const totalPermissionsCount = useMemo(() => {
        return Object.values(permissions).flat().length;
    }, [permissions]);

    // Filter permissions by search query
    const filteredPermissions = useMemo(() => {
        if (!searchQuery.trim()) {
            return permissions;
        }

        const query = searchQuery.toLowerCase();
        const result: Record<string, Permission[]> = {};

        Object.entries(permissions).forEach(([mod, perms]) => {
            const moduleName = (modules[mod] || mod).toLowerCase();
            const matchingPerms = perms.filter((p) => {
                const actionLabel = (actions[p.action] || p.action).toLowerCase();
                const permSlug = p.slug.toLowerCase();
                return (
                    moduleName.includes(query) ||
                    actionLabel.includes(query) ||
                    permSlug.includes(query) ||
                    (p.description && p.description.toLowerCase().includes(query))
                );
            });

            if (matchingPerms.length > 0) {
                result[mod] = matchingPerms;
            }
        });

        return result;
    }, [permissions, modules, actions, searchQuery]);

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
                            <SecondaryButton className="!rounded-xl text-xs font-semibold">
                                ← {t('roles.actions.back_to_roles')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('roles.pages.edit.title', { name: role.name })} />

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
                        {/* Left Column - Role Details (5 cols) */}
                        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4 dark:border-slate-800/80 dark:bg-slate-800/30">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    Informasi Peran (Role)
                                </h3>

                                <div>
                                    <InputLabel htmlFor="name" value={t('roles.fields.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1.5 block w-full !rounded-xl !py-2.5 text-xs font-medium bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs disabled:opacity-60"
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
                                        className="mt-1.5 block w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={4}
                                        disabled={role.is_system}
                                        placeholder={t('roles.placeholders.description')}
                                    />
                                    <InputError message={errors.description} className="mt-1.5" />
                                </div>

                                <div className="rounded-xl bg-white dark:bg-slate-900/80 p-3.5 space-y-2 border border-slate-200/60 dark:border-slate-800">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('roles.pages.show.information')}</h4>
                                    <div className="space-y-1.5 text-xs">
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

                                {/* Summary Box */}
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                                            Total Hak Akses Dipilih:
                                        </span>
                                        <span className="rounded-lg bg-indigo-600 px-2.5 py-0.5 font-mono text-xs font-black text-white shadow-2xs">
                                            {data.permissions.length} / {totalPermissionsCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Collapsible Permissions (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            {/* Header Bar & Control Buttons */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        {t('roles.fields.permissions')}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Atur izin akses untuk setiap modul sistem
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {/* Expand / Collapse All */}
                                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                                        <button
                                            type="button"
                                            onClick={expandAll}
                                            className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                                            title="Buka semua accordion modul"
                                        >
                                            Buka Semua
                                        </button>
                                        <button
                                            type="button"
                                            onClick={collapseAll}
                                            className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                                            title="Tutup semua accordion modul"
                                        >
                                            Tutup Semua
                                        </button>
                                    </div>

                                    <span className="text-slate-300 dark:text-slate-700">|</span>

                                    {/* Select / Clear All */}
                                    <button
                                        type="button"
                                        onClick={selectAllPermissions}
                                        className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                                    >
                                        {t('roles.actions.select_all')}
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-700">·</span>
                                    <button
                                        type="button"
                                        onClick={clearAllPermissions}
                                        className="font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        {t('roles.actions.clear_extras')}
                                    </button>
                                </div>
                            </div>

                            {/* Search Filter Input */}
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari modul atau nama hak akses (contoh: fleet, view, rental, delete)..."
                                    className="block w-full rounded-2xl border border-slate-200/80 bg-slate-50/60 pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Collapsible Accordion List */}
                            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                                {Object.keys(filteredPermissions).length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                                        <p className="text-xs font-semibold text-slate-400">
                                            Tidak ada hak akses yang cocok dengan pencarian "{searchQuery}".
                                        </p>
                                    </div>
                                ) : (
                                    Object.entries(filteredPermissions).map(([module, modulePermissions]) => {
                                        const modulePermissionIds = modulePermissions.map((p) => p.id);
                                        const unlockedIds = modulePermissionIds.filter((id) => !isLocked(id));
                                        const selectedCount = modulePermissionIds.filter((id) => data.permissions.includes(id)).length;
                                        const allSelected = modulePermissionIds.length > 0 && selectedCount === modulePermissionIds.length;
                                        const someSelected = selectedCount > 0 && !allSelected;
                                        const isExpanded = expandedModules[module] ?? true;
                                        const moduleToggleDisabled = unlockedIds.length === 0;
                                        const icon = getModuleIcon(module);

                                        return (
                                            <div
                                                key={module}
                                                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                                    allSelected
                                                        ? 'border-emerald-200 bg-white shadow-2xs dark:border-emerald-900/40 dark:bg-slate-900'
                                                        : someSelected
                                                            ? 'border-indigo-200 bg-white shadow-2xs dark:border-indigo-900/40 dark:bg-slate-900'
                                                            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                }`}
                                            >
                                                {/* Accordion Module Header */}
                                                <div
                                                    onClick={() => toggleExpand(module)}
                                                    className={`flex items-center justify-between p-3.5 cursor-pointer select-none transition ${
                                                        allSelected
                                                            ? 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30'
                                                            : someSelected
                                                                ? 'bg-indigo-50/40 hover:bg-indigo-50/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30'
                                                                : 'bg-slate-50/60 hover:bg-slate-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    {/* Left: Checkbox + Module Name */}
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    el.indeterminate = someSelected;
                                                                }
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={() => toggleModulePermissions(modulePermissions)}
                                                            disabled={moduleToggleDisabled}
                                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">{icon}</span>
                                                            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                                                {modules[module] || module}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: Selected Counter Badge + Chevron */}
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                allSelected
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                    : someSelected
                                                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            {selectedCount} / {modulePermissionIds.length} dipilih
                                                        </span>

                                                        <div
                                                            className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 dark:bg-slate-800 text-slate-500 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-180' : ''
                                                            }`}
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Accordion Collapsible Body */}
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 p-3.5 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {modulePermissions.map((permission) => {
                                                                const isChecked = data.permissions.includes(permission.id);
                                                                const locked = isLocked(permission.id);

                                                                return (
                                                                    <label
                                                                        key={permission.id}
                                                                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                                                                            locked
                                                                                ? 'cursor-not-allowed border-amber-200/60 bg-amber-50/40 text-slate-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-slate-400'
                                                                                : isChecked
                                                                                    ? 'cursor-pointer border-indigo-200 bg-indigo-50/50 font-bold text-indigo-950 ring-1 ring-indigo-500/20 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200'
                                                                                    : 'cursor-pointer border-slate-100 bg-slate-50/40 text-slate-700 hover:border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-850/40 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                        }`}
                                                                        title={locked ? t('roles.pages.edit.default_permission_locked') : undefined}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => togglePermission(permission.id)}
                                                                            disabled={locked}
                                                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                                        />
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <p className="truncate">
                                                                                    {actions[permission.action] || permission.action}
                                                                                </p>
                                                                                {locked && (
                                                                                    <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
                                                                                        {t('roles.pages.edit.default_badge')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {permission.description && (
                                                                                <p className="text-[10px] font-normal text-slate-400 truncate">
                                                                                    {permission.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <InputError message={errors.permissions} className="mt-1.5" />
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                        <Link href={prefixedRoute('roles.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs font-semibold">
                                {t('common.cancel')}
                            </SecondaryButton>
                        </Link>
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs font-bold shadow-md bg-indigo-600 hover:bg-indigo-700">
                            {processing ? t('roles.pages.edit.submitting') : t('roles.pages.edit.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

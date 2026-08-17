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

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_system: boolean;
}

interface UserProfile {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    profile: UserProfile | null;
}

interface WarehouseOption {
    id: number;
    name: string;
    kind: string | null;
}

interface FleetBaseOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    user: User;
    userRoles: number[];
    userWarehouseIds?: number[];
    userFleetBaseIds?: number[];
    roles: Role[];
    warehouses?: WarehouseOption[];
    warehouseScopedRoleSlugs?: string[];
    fleetBases?: FleetBaseOption[];
    fleetBaseScopedRoleSlugs?: string[];
}

export default function Edit({
    user,
    userRoles,
    userWarehouseIds = [],
    userFleetBaseIds = [],
    roles,
    warehouses = [],
    warehouseScopedRoleSlugs = ['warehouse_head', 'warehouse_manager'],
    fleetBases = [],
    fleetBaseScopedRoleSlugs = ['fleet_base_head', 'fleet_base_manager'],
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: userRoles,
        warehouse_ids: userWarehouseIds,
        fleet_base_ids: userFleetBaseIds,
        first_name: user.profile?.first_name || '',
        last_name: user.profile?.last_name || '',
        phone_number: user.profile?.phone_number || '',
        avatar_url: user.profile?.avatar_url || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('users.update', user.id));
    };

    const toggleRole = (roleId: number) => {
        if (data.roles.includes(roleId)) {
            setData(
                'roles',
                data.roles.filter((id) => id !== roleId),
            );
        } else {
            setData('roles', [...data.roles, roleId]);
        }
    };

    const toggleWarehouse = (warehouseId: number) => {
        if (data.warehouse_ids.includes(warehouseId)) {
            setData(
                'warehouse_ids',
                data.warehouse_ids.filter((id) => id !== warehouseId),
            );
        } else {
            setData('warehouse_ids', [...data.warehouse_ids, warehouseId]);
        }
    };

    const toggleFleetBase = (fleetBaseId: number) => {
        if (data.fleet_base_ids.includes(fleetBaseId)) {
            setData(
                'fleet_base_ids',
                data.fleet_base_ids.filter((id) => id !== fleetBaseId),
            );
        } else {
            setData('fleet_base_ids', [...data.fleet_base_ids, fleetBaseId]);
        }
    };

    const selectedRoleSlugs = roles.filter((role) => data.roles.includes(role.id)).map((role) => role.slug);
    const needsWarehouses = selectedRoleSlugs.some((slug) => warehouseScopedRoleSlugs.includes(slug));
    const isHeadOnly =
        selectedRoleSlugs.includes('warehouse_head') && !selectedRoleSlugs.includes('warehouse_manager');
    const needsFleetBases = selectedRoleSlugs.some((slug) => fleetBaseScopedRoleSlugs.includes(slug));
    const isFleetHeadOnly =
        selectedRoleSlugs.includes('fleet_base_head') && !selectedRoleSlugs.includes('fleet_base_manager');

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('users.pages.edit.head')}
                    actions={
                        <Link href={prefixedRoute('users.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('users.pages.show.back')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('users.pages.edit.title', { name: user.name })} />

            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Left Column - User Account & Profile */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                🔑 {t('users.sections.account_details')}
                            </h4>

                            <div>
                                <InputLabel htmlFor="name" value={t('users.fields.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value={t('users.fields.email')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                                    autoComplete="email"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="password" value={t('users.fields.password_hint')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value={t('users.fields.password_confirmation')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                                </div>
                            </div>

                            {/* Profile Fields */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    👤 {t('users.sections.profile_information')}
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="first_name" value={t('users.fields.first_name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                        <TextInput
                                            id="first_name"
                                            type="text"
                                            name="first_name"
                                            value={data.first_name}
                                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            onChange={(e) => setData('first_name', e.target.value)}
                                        />
                                        <InputError message={errors.first_name} className="mt-1.5" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="last_name" value={t('users.fields.last_name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                        <TextInput
                                            id="last_name"
                                            type="text"
                                            name="last_name"
                                            value={data.last_name}
                                            className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                            onChange={(e) => setData('last_name', e.target.value)}
                                        />
                                        <InputError message={errors.last_name} className="mt-1.5" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone_number" value={t('users.fields.phone_number')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <TextInput
                                        id="phone_number"
                                        type="text"
                                        name="phone_number"
                                        value={data.phone_number}
                                        className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                    />
                                    <InputError message={errors.phone_number} className="mt-1.5" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="avatar_url" value={t('users.fields.avatar_url')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <TextInput
                                        id="avatar_url"
                                        type="text"
                                        name="avatar_url"
                                        value={data.avatar_url}
                                        className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                                        placeholder={t('users.placeholders.avatar_url')}
                                        onChange={(e) => setData('avatar_url', e.target.value)}
                                    />
                                    <InputError message={errors.avatar_url} className="mt-1.5" />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Roles & Permissions Scope */}
                        <div className="space-y-5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                🛡️ {t('users.fields.roles')}
                            </h4>

                            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-[280px] overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
                                {roles.map((role) => (
                                    <label
                                        key={role.id}
                                        className="flex items-start p-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.roles.includes(role.id)}
                                            onChange={() => toggleRole(role.id)}
                                            className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {role.name}
                                                </span>
                                                {role.is_system && (
                                                    <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                        {t('users.system_badge')}
                                                    </span>
                                                )}
                                            </div>
                                            {role.description && (
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.roles} className="mt-1.5" />
                            <p className="text-xs font-bold text-slate-500">
                                {t('users.roles_selected', { count: data.roles.length })}
                            </p>

                            {needsWarehouses && warehouses.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <InputLabel value={t('users.fields.warehouses')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <p className="text-xs text-slate-500">
                                        {isHeadOnly
                                            ? t('users.warehouses_hint_head')
                                            : t('users.warehouses_hint_manager')}
                                    </p>
                                    <div className="max-h-[200px] divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                        {warehouses.map((warehouse) => (
                                            <label
                                                key={warehouse.id}
                                                className="flex cursor-pointer items-start p-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                            >
                                                <input
                                                    type={isHeadOnly ? 'radio' : 'checkbox'}
                                                    name="warehouse_ids"
                                                    checked={data.warehouse_ids.includes(warehouse.id)}
                                                    onChange={() => {
                                                        if (isHeadOnly) {
                                                            setData('warehouse_ids', [warehouse.id]);
                                                        } else {
                                                            toggleWarehouse(warehouse.id);
                                                        }
                                                    }}
                                                    className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="ml-3">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {warehouse.name}
                                                    </span>
                                                    {warehouse.kind && (
                                                        <p className="text-[10px] text-slate-500">
                                                            {t(`inventory.warehouse_kinds.${warehouse.kind}`, undefined, warehouse.kind)}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.warehouse_ids} className="mt-1.5" />
                                    <p className="text-xs font-bold text-slate-500">
                                        {t('users.warehouses_selected', { count: data.warehouse_ids.length })}
                                    </p>
                                </div>
                            )}

                            {needsFleetBases && fleetBases.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <InputLabel value={t('users.fields.fleet_bases')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                    <p className="text-xs text-slate-500">
                                        {isFleetHeadOnly
                                            ? t('users.fleet_bases_hint_head')
                                            : t('users.fleet_bases_hint_manager')}
                                    </p>
                                    <div className="max-h-[200px] divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                        {fleetBases.map((base) => (
                                            <label
                                                key={base.id}
                                                className="flex cursor-pointer items-start p-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                            >
                                                <input
                                                    type={isFleetHeadOnly ? 'radio' : 'checkbox'}
                                                    name="fleet_base_ids"
                                                    checked={data.fleet_base_ids.includes(base.id)}
                                                    onChange={() => {
                                                        if (isFleetHeadOnly) {
                                                            setData('fleet_base_ids', [base.id]);
                                                        } else {
                                                            toggleFleetBase(base.id);
                                                        }
                                                    }}
                                                    className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div className="ml-3">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                                                        {base.code} — {base.name}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <InputError message={errors.fleet_base_ids} className="mt-1.5" />
                                    <p className="text-xs font-bold text-slate-500">
                                        {t('users.fleet_bases_selected', { count: data.fleet_base_ids.length })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link href={prefixedRoute('users.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                            {t('users.pages.edit.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}


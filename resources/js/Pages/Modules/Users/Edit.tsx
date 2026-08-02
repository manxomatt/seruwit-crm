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

interface Props {
    user: User;
    userRoles: number[];
    userWarehouseIds?: number[];
    roles: Role[];
    warehouses?: WarehouseOption[];
    warehouseScopedRoleSlugs?: string[];
}

export default function Edit({
    user,
    userRoles,
    userWarehouseIds = [],
    roles,
    warehouses = [],
    warehouseScopedRoleSlugs = ['warehouse_head', 'warehouse_manager'],
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

    const selectedRoleSlugs = roles.filter((role) => data.roles.includes(role.id)).map((role) => role.slug);
    const needsWarehouses = selectedRoleSlugs.some((slug) => warehouseScopedRoleSlugs.includes(slug));
    const isHeadOnly =
        selectedRoleSlugs.includes('warehouse_head') && !selectedRoleSlugs.includes('warehouse_manager');

    return (
        <DynamicLayout
            header={<PageHeader title={t('users.pages.edit.head')} />}
        >
            <Head title={t('users.pages.edit.title', { name: user.name })} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Left Column - User Details */}
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="name" value={t('users.fields.name')} />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value={t('users.fields.email')} />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="email"
                                        onChange={(e) => setData('email', e.target.value)}
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value={t('users.fields.password_hint')} />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value={t('users.fields.password_confirmation')} />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-1 block w-full"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                {/* Profile Fields */}
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('users.sections.profile_information')}</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="first_name" value={t('users.fields.first_name')} />
                                            <TextInput
                                                id="first_name"
                                                type="text"
                                                name="first_name"
                                                value={data.first_name}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('first_name', e.target.value)}
                                            />
                                            <InputError message={errors.first_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="last_name" value={t('users.fields.last_name')} />
                                            <TextInput
                                                id="last_name"
                                                type="text"
                                                name="last_name"
                                                value={data.last_name}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('last_name', e.target.value)}
                                            />
                                            <InputError message={errors.last_name} className="mt-2" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel htmlFor="phone_number" value={t('users.fields.phone_number')} />
                                        <TextInput
                                            id="phone_number"
                                            type="text"
                                            name="phone_number"
                                            value={data.phone_number}
                                            className="mt-1 block w-full"
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                        />
                                        <InputError message={errors.phone_number} className="mt-2" />
                                    </div>

                                    <div className="mt-4">
                                        <InputLabel htmlFor="avatar_url" value={t('users.fields.avatar_url')} />
                                        <TextInput
                                            id="avatar_url"
                                            type="text"
                                            name="avatar_url"
                                            value={data.avatar_url}
                                            className="mt-1 block w-full"
                                            placeholder={t('users.placeholders.avatar_url')}
                                            onChange={(e) => setData('avatar_url', e.target.value)}
                                        />
                                        <InputError message={errors.avatar_url} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Roles */}
                            <div>
                                <InputLabel value={t('users.fields.roles')} />
                                <div className="mt-2 border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className="flex items-start p-3 cursor-pointer hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.roles.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                            />
                                            <div className="ml-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {role.name}
                                                    </span>
                                                    {role.is_system && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                            {t('users.system_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                                {role.description && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {role.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.roles} className="mt-2" />
                                <p className="mt-2 text-sm text-gray-500">
                                    {t('users.roles_selected', { count: data.roles.length })}
                                </p>

                                {needsWarehouses && warehouses.length > 0 && (
                                    <div className="mt-6">
                                        <InputLabel value={t('users.fields.warehouses')} />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {isHeadOnly
                                                ? t('users.warehouses_hint_head')
                                                : t('users.warehouses_hint_manager')}
                                        </p>
                                        <div className="mt-2 max-h-[240px] divide-y overflow-y-auto rounded-lg border">
                                            {warehouses.map((warehouse) => (
                                                <label
                                                    key={warehouse.id}
                                                    className="flex cursor-pointer items-start p-3 hover:bg-gray-50"
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
                                                        className="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                    />
                                                    <div className="ml-3">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {warehouse.name}
                                                        </span>
                                                        {warehouse.kind && (
                                                            <p className="text-xs text-gray-500">
                                                                {t(`inventory.warehouse_kinds.${warehouse.kind}`, undefined, warehouse.kind)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.warehouse_ids} className="mt-2" />
                                        <p className="mt-2 text-sm text-gray-500">
                                            {t('users.warehouses_selected', { count: data.warehouse_ids.length })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                            <PrimaryButton disabled={processing}>
                                {t('users.pages.edit.submit')}
                            </PrimaryButton>
                            <Link href={prefixedRoute('users.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

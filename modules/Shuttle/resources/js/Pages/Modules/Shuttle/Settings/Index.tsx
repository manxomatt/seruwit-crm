import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import ShuttleNav from '../ShuttleNav';
import { ActionIconButton, PencilIcon, TrashIcon } from '../components/ActionIcons';

type Tab = 'general' | 'cities' | 'pools';

interface City {
    id: number;
    code: string;
    name: string;
    province: string | null;
    is_active: boolean;
}

interface Pool {
    id: number;
    city_id: number | null;
    code: string | null;
    name: string | null;
    location_id: number;
    is_origin: boolean;
    is_destination: boolean;
    is_active: boolean;
    city?: { id: number; name: string } | null;
    location?: {
        id: number;
        code: string;
        name: string;
        city: string | null;
        address?: string | null;
        latitude?: string | number | null;
        longitude?: string | number | null;
    } | null;
}

interface Props {
    tab: Tab;
    settings: {
        default_seat_capacity: string;
        default_pickup_cutoff_minutes: string;
        default_pool_base_fare: string;
        default_door_base_fare: string;
        passenger_booking_enabled: string;
        hold_ttl_minutes: string;
        public_brand_name: string;
        public_brand_color: string;
    };
    cities: City[];
    pools: Pool[];
    can: { update: boolean; create: boolean; delete: boolean };
}

export default function Index({ tab, settings, cities, pools, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const tabs: { key: Tab; label: string }[] = [
        { key: 'general', label: t('shuttle.settings.tab_general') },
        { key: 'cities', label: t('shuttle.settings.tab_cities') },
        { key: 'pools', label: t('shuttle.settings.tab_pools') },
    ];

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.settings.title')}</h2>}
        >
            <Head title={t('shuttle.settings.title')} />
            <ShuttleNav active="settings" />

            <div className="mb-6 flex gap-2 border-b border-gray-200">
                {tabs.map((item) => (
                    <Link
                        key={item.key}
                        href={prefixedRoute('shuttle.settings.index', { tab: item.key })}
                        className={`border-b-2 px-3 py-2 text-sm font-medium ${
                            tab === item.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            {tab === 'general' && <GeneralTab settings={settings} canUpdate={can.update} />}
            {tab === 'cities' && <CitiesTab cities={cities} can={can} />}
            {tab === 'pools' && <PoolsTab pools={pools} cities={cities} can={can} />}
        </DynamicLayout>
    );
}

function GeneralTab({
    settings,
    canUpdate,
}: {
    settings: Props['settings'];
    canUpdate: boolean;
}) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        default_seat_capacity: settings.default_seat_capacity,
        default_pickup_cutoff_minutes: settings.default_pickup_cutoff_minutes,
        default_pool_base_fare: settings.default_pool_base_fare,
        default_door_base_fare: settings.default_door_base_fare,
        passenger_booking_enabled: settings.passenger_booking_enabled === '1',
        hold_ttl_minutes: settings.hold_ttl_minutes,
        public_brand_name: settings.public_brand_name,
        public_brand_color: settings.public_brand_color,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('shuttle.settings.general'));
    };

    return (
        <form onSubmit={submit} className="max-w-2xl space-y-4 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel value={t('shuttle.settings.default_seat_capacity')} />
                    <TextInput
                        type="number"
                        min={1}
                        className="mt-1 w-full"
                        value={data.default_seat_capacity}
                        onChange={(e) => setData('default_seat_capacity', e.target.value)}
                        disabled={!canUpdate}
                    />
                    <InputError message={errors.default_seat_capacity} className="mt-1" />
                </div>
                <div>
                    <InputLabel value={t('shuttle.settings.default_pickup_cutoff')} />
                    <TextInput
                        type="number"
                        min={0}
                        className="mt-1 w-full"
                        value={data.default_pickup_cutoff_minutes}
                        onChange={(e) => setData('default_pickup_cutoff_minutes', e.target.value)}
                        disabled={!canUpdate}
                    />
                    <InputError message={errors.default_pickup_cutoff_minutes} className="mt-1" />
                </div>
                <div>
                    <InputLabel value={t('shuttle.settings.default_pool_fare')} />
                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">Rp</span>
                        <MoneyInput
                            value={data.default_pool_base_fare}
                            onChange={(v) => setData('default_pool_base_fare', v)}
                            className="w-full pl-10"
                            disabled={!canUpdate}
                        />
                    </div>
                    <InputError message={errors.default_pool_base_fare} className="mt-1" />
                </div>
                <div>
                    <InputLabel value={t('shuttle.settings.default_door_fare')} />
                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">Rp</span>
                        <MoneyInput
                            value={data.default_door_base_fare}
                            onChange={(v) => setData('default_door_base_fare', v)}
                            className="w-full pl-10"
                            disabled={!canUpdate}
                        />
                    </div>
                    <InputError message={errors.default_door_base_fare} className="mt-1" />
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">{t('shuttle.settings.passenger_channel')}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={data.passenger_booking_enabled}
                            onChange={(e) => setData('passenger_booking_enabled', e.target.checked)}
                            disabled={!canUpdate}
                        />
                        {t('shuttle.settings.passenger_booking_enabled')}
                    </label>
                    <div>
                        <InputLabel value={t('shuttle.settings.hold_ttl_minutes')} />
                        <TextInput
                            type="number"
                            min={5}
                            max={120}
                            className="mt-1 w-full"
                            value={data.hold_ttl_minutes}
                            onChange={(e) => setData('hold_ttl_minutes', e.target.value)}
                            disabled={!canUpdate}
                        />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.public_brand_name')} />
                        <TextInput
                            className="mt-1 w-full"
                            value={data.public_brand_name}
                            onChange={(e) => setData('public_brand_name', e.target.value)}
                            disabled={!canUpdate}
                        />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.public_brand_color')} />
                        <div className="mt-1 flex items-center gap-3">
                            <input
                                type="color"
                                className="h-10 w-14 cursor-pointer rounded-md border border-gray-300 bg-white p-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                value={/^#[0-9A-Fa-f]{6}$/.test(data.public_brand_color) ? data.public_brand_color : '#0f766e'}
                                onChange={(e) => setData('public_brand_color', e.target.value)}
                                disabled={!canUpdate}
                                aria-label={t('shuttle.settings.public_brand_color')}
                            />
                            <TextInput
                                className="w-32 font-mono uppercase"
                                value={data.public_brand_color}
                                placeholder="#0F766E"
                                onChange={(e) => setData('public_brand_color', e.target.value)}
                                disabled={!canUpdate}
                            />
                            <span
                                className="h-10 flex-1 rounded-md border border-gray-200"
                                style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(data.public_brand_color) ? data.public_brand_color : '#0f766e' }}
                                title={data.public_brand_color}
                            />
                        </div>
                        <InputError message={errors.public_brand_color} className="mt-1" />
                    </div>
                </div>
                {data.passenger_booking_enabled && typeof window !== 'undefined' && (
                    <p className="mt-2 text-xs text-gray-500">
                        Public URL:{' '}
                        <a className="font-medium text-indigo-600 underline" href={`${window.location.origin}/book/shuttle`} target="_blank" rel="noreferrer">
                            {`${window.location.origin}/book/shuttle`}
                        </a>
                    </p>
                )}
            </div>
            {canUpdate && (
                <div className="flex justify-end">
                    <PrimaryButton disabled={processing}>{t('common.save')}</PrimaryButton>
                </div>
            )}
        </form>
    );
}

function CitiesTab({ cities, can }: { cities: City[]; can: Props['can'] }) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [editing, setEditing] = useState<City | null>(null);
    const [deleting, setDeleting] = useState<City | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const form = useForm({
        code: '',
        name: '',
        province: '',
        is_active: true as boolean,
    });

    const resetForm = () => {
        setEditing(null);
        form.setData({ code: '', name: '', province: '', is_active: true });
        form.clearErrors();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            form.patch(prefixedRoute('shuttle.settings.cities.update', editing.id), {
                onSuccess: () => resetForm(),
            });
            return;
        }
        form.post(prefixedRoute('shuttle.settings.cities.store'), {
            onSuccess: () => resetForm(),
        });
    };

    const closeDeleteDialog = () => {
        setDeleting(null);
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setProcessingDelete(true);
        router.delete(prefixedRoute('shuttle.settings.cities.destroy', deleting.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {(can.create || (can.update && editing)) && (
                <form onSubmit={submit} className="space-y-3 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h3 className="font-medium text-gray-900">
                        {editing ? t('shuttle.settings.edit_city') : t('shuttle.settings.add_city')}
                    </h3>
                    <div>
                        <InputLabel value={t('shuttle.settings.city_code')} />
                        <TextInput className="mt-1 w-full" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
                        <InputError message={form.errors.code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.city_name')} />
                        <TextInput className="mt-1 w-full" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        <InputError message={form.errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.province')} />
                        <TextInput className="mt-1 w-full" value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                        {editing && (
                            <button type="button" className="text-sm text-gray-500" onClick={resetForm}>
                                {t('common.cancel')}
                            </button>
                        )}
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.settings.city_code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.settings.city_name')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cities.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    {t('shuttle.settings.empty_cities')}
                                </td>
                            </tr>
                        ) : (
                            cities.map((city) => (
                                <tr key={city.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{city.code}</td>
                                    <td className="px-4 py-3">
                                        <div>{city.name}</div>
                                        {city.province && <div className="text-xs text-gray-500">{city.province}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            {can.update && (
                                                <ActionIconButton
                                                    title={t('common.edit')}
                                                    onClick={() => {
                                                        setEditing(city);
                                                        form.setData({
                                                            code: city.code,
                                                            name: city.name,
                                                            province: city.province ?? '',
                                                            is_active: city.is_active,
                                                        });
                                                    }}
                                                >
                                                    <PencilIcon />
                                                </ActionIconButton>
                                            )}
                                            {can.delete && (
                                                <ActionIconButton
                                                    title={t('common.delete')}
                                                    tone="red"
                                                    onClick={() => setDeleting(city)}
                                                >
                                                    <TrashIcon />
                                                </ActionIconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDeleteDialog
                show={deleting !== null}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processingDelete}
                message={
                    deleting
                        ? t('shuttle.messages.delete_confirm', { name: `${deleting.code} — ${deleting.name}` })
                        : undefined
                }
            />
        </div>
    );
}

function PoolsTab({
    pools,
    cities,
    can,
}: {
    pools: Pool[];
    cities: City[];
    can: Props['can'];
}) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [editing, setEditing] = useState<Pool | null>(null);
    const [deleting, setDeleting] = useState<Pool | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const form = useForm({
        city_id: cities[0] ? String(cities[0].id) : '',
        code: '',
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        is_origin: true as boolean,
        is_destination: true as boolean,
        is_active: true as boolean,
    });

    const cityOptions = useMemo(() => cities.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` })), [cities]);

    const resetForm = () => {
        setEditing(null);
        form.setData({
            city_id: cities[0] ? String(cities[0].id) : '',
            code: '',
            name: '',
            address: '',
            latitude: '',
            longitude: '',
            is_origin: true,
            is_destination: true,
            is_active: true,
        });
        form.clearErrors();
    };

    const closeDeleteDialog = () => {
        setDeleting(null);
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setProcessingDelete(true);
        router.delete(prefixedRoute('shuttle.settings.pools.destroy', deleting.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessingDelete(false),
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editing) {
            form.patch(prefixedRoute('shuttle.settings.pools.update', editing.id), {
                onSuccess: () => resetForm(),
            });
            return;
        }
        form.post(prefixedRoute('shuttle.settings.pools.store'), {
            onSuccess: () => resetForm(),
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {(can.create || (can.update && editing)) && (
                <form onSubmit={submit} className="space-y-3 overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <h3 className="font-medium text-gray-900">
                        {editing ? t('shuttle.settings.edit_pool') : t('shuttle.settings.add_pool')}
                    </h3>
                    <div>
                        <InputLabel value={t('shuttle.settings.city')} />
                        <Select className="mt-1 w-full" value={form.data.city_id} onChange={(v) => form.setData('city_id', v)} options={cityOptions} />
                        <InputError message={form.errors.city_id} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.pool_code')} />
                        <TextInput className="mt-1 w-full" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
                        <InputError message={form.errors.code} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.pool_name')} />
                        <TextInput className="mt-1 w-full" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        <InputError message={form.errors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.address')} />
                        <TextInput className="mt-1 w-full" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                        <InputError message={form.errors.address} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel value={t('shuttle.settings.map_pin')} />
                        <p className="mb-2 text-xs text-gray-500">{t('shuttle.settings.map_hint')}</p>
                        <LocationMapPicker
                            latitude={form.data.latitude}
                            longitude={form.data.longitude}
                            height="280px"
                            onChange={({ latitude, longitude, address }) => {
                                form.setData({
                                    ...form.data,
                                    latitude,
                                    longitude,
                                    address: address ?? form.data.address,
                                });
                            }}
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div>Lat: {form.data.latitude || '—'}</div>
                            <div>Lng: {form.data.longitude || '—'}</div>
                        </div>
                        <InputError message={form.errors.latitude || form.errors.longitude} className="mt-1" />
                    </div>
                    <div className="flex justify-end gap-2">
                        {editing && (
                            <button type="button" className="text-sm text-gray-500" onClick={resetForm}>
                                {t('common.cancel')}
                            </button>
                        )}
                        <PrimaryButton disabled={form.processing || cities.length === 0 || !form.data.latitude}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.settings.pool_code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.settings.pool_name')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pools.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    {t('shuttle.settings.empty_pools')}
                                </td>
                            </tr>
                        ) : (
                            pools.map((pool) => (
                                <tr key={pool.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{pool.code}</td>
                                    <td className="px-4 py-3">
                                        <div>{pool.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {pool.city?.name}
                                            {pool.location?.latitude != null && pool.location?.longitude != null
                                                ? ` · ${Number(pool.location.latitude).toFixed(5)}, ${Number(pool.location.longitude).toFixed(5)}`
                                                : ''}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            {can.update && (
                                                <ActionIconButton
                                                    title={t('common.edit')}
                                                    onClick={() => {
                                                        setEditing(pool);
                                                        form.setData({
                                                            city_id: pool.city_id ? String(pool.city_id) : '',
                                                            code: pool.code ?? '',
                                                            name: pool.name ?? '',
                                                            address: pool.location?.address ?? '',
                                                            latitude:
                                                                pool.location?.latitude != null
                                                                    ? String(pool.location.latitude)
                                                                    : '',
                                                            longitude:
                                                                pool.location?.longitude != null
                                                                    ? String(pool.location.longitude)
                                                                    : '',
                                                            is_origin: pool.is_origin,
                                                            is_destination: pool.is_destination,
                                                            is_active: pool.is_active,
                                                        });
                                                    }}
                                                >
                                                    <PencilIcon />
                                                </ActionIconButton>
                                            )}
                                            {can.delete && (
                                                <ActionIconButton
                                                    title={t('common.delete')}
                                                    tone="red"
                                                    onClick={() => setDeleting(pool)}
                                                >
                                                    <TrashIcon />
                                                </ActionIconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDeleteDialog
                show={deleting !== null}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processingDelete}
                message={
                    deleting
                        ? t('shuttle.messages.delete_confirm', {
                              name: `${deleting.code ?? ''} — ${deleting.name ?? ''}`.trim(),
                          })
                        : undefined
                }
            />
        </div>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';
import PageHeader from '@/Components/PageHeader';

interface ManagerOption {
    id: number;
    name: string;
    email: string;
}

interface LocationOption {
    id: number;
    code: string;
    name: string;
    city: string | null;
}

interface WarehouseOption {
    id: number;
    name: string;
    kind: string | null;
}

interface FleetBase {
    id: number;
    code: string;
    name: string;
    kind: string;
    status: string;
    address: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    phone: string | null;
    email: string | null;
    opens_at: string | null;
    closes_at: string | null;
    timezone: string;
    vehicle_capacity: number | null;
    allows_overnight: boolean;
    service_radius_km: string | number | null;
    manager_id: number;
    location_id: number | null;
    warehouse_id: number | null;
    notes: string | null;
    users: Array<{ id: number }>;
}

interface Props {
    base: FleetBase;
    managers: ManagerOption[];
    kinds: string[];
    locations: LocationOption[];
    warehouses: WarehouseOption[];
    locationLinkEnabled: boolean;
    warehouseLinkEnabled: boolean;
}

const STATUSES = ['active', 'inactive'] as const;

export default function Edit({
    base,
    managers,
    kinds,
    locations,
    warehouses,
    locationLinkEnabled,
    warehouseLinkEnabled,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        code: base.code || '',
        name: base.name || '',
        kind: typeof base.kind === 'string' ? base.kind : String(base.kind ?? 'depot'),
        status: base.status || 'active',
        address: base.address || '',
        city: base.city || '',
        province: base.province || '',
        zip: base.zip || '',
        latitude: base.latitude ?? '',
        longitude: base.longitude ?? '',
        phone: base.phone || '',
        email: base.email || '',
        opens_at: (base.opens_at || '').toString().slice(0, 5),
        closes_at: (base.closes_at || '').toString().slice(0, 5),
        timezone: base.timezone || 'Asia/Jakarta',
        vehicle_capacity: base.vehicle_capacity ?? '',
        allows_overnight: Boolean(base.allows_overnight),
        service_radius_km: base.service_radius_km ?? '',
        manager_id: String(base.manager_id),
        location_id: base.location_id ? String(base.location_id) : '',
        warehouse_id: base.warehouse_id ? String(base.warehouse_id) : '',
        notes: base.notes || '',
        staff_ids: base.users.map((u) => u.id),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('fleet.bases.update', base.id));
    };

    const toggleStaff = (userId: number) => {
        if (data.staff_ids.includes(userId)) {
            setData(
                'staff_ids',
                data.staff_ids.filter((id) => id !== userId),
            );
        } else {
            setData('staff_ids', [...data.staff_ids, userId]);
        }
    };

    return (
        <DynamicLayout header={<PageHeader title={t('fleet.title')} />}>
            <Head title={t('fleet.bases.edit')} />
            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-4xl space-y-8">
                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.identity')}</h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="code" value={t('fleet.bases.code')} />
                                    <TextInput id="code" className="mt-1 block w-full" value={data.code} onChange={(e) => setData('code', e.target.value)} required autoFocus />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="name" value={t('fleet.bases.name')} />
                                    <TextInput id="name" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="kind" value={t('fleet.bases.kind')} />
                                    <Select
                                        id="kind"
                                        className="mt-1"
                                        value={data.kind}
                                        onChange={(value) => setData('kind', value)}
                                        options={kinds.map((kind) => ({
                                            value: kind,
                                            label: t(`fleet.base_kinds.${kind}`),
                                        }))}
                                    />
                                    <InputError message={errors.kind} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="status" value={t('fleet.bases.status')} />
                                    <Select
                                        id="status"
                                        className="mt-1"
                                        value={data.status}
                                        onChange={(value) => setData('status', value)}
                                        options={STATUSES.map((status) => ({
                                            value: status,
                                            label: t(`fleet.status.${status}`),
                                        }))}
                                    />
                                    <InputError message={errors.status} className="mt-2" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.address')}</h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <InputLabel htmlFor="address" value={t('fleet.bases.address')} />
                                    <TextInput id="address" className="mt-1 block w-full" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="city" value={t('fleet.bases.city')} />
                                    <TextInput id="city" className="mt-1 block w-full" value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                    <InputError message={errors.city} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="province" value={t('fleet.bases.province')} />
                                    <TextInput id="province" className="mt-1 block w-full" value={data.province} onChange={(e) => setData('province', e.target.value)} />
                                    <InputError message={errors.province} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="zip" value={t('fleet.bases.zip')} />
                                    <TextInput id="zip" className="mt-1 block w-full" value={data.zip} onChange={(e) => setData('zip', e.target.value)} />
                                    <InputError message={errors.zip} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="latitude" value={t('fleet.bases.latitude')} />
                                    <TextInput id="latitude" type="number" step="any" className="mt-1 block w-full" value={data.latitude} onChange={(e) => setData('latitude', e.target.value)} />
                                    <InputError message={errors.latitude} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="longitude" value={t('fleet.bases.longitude')} />
                                    <TextInput id="longitude" type="number" step="any" className="mt-1 block w-full" value={data.longitude} onChange={(e) => setData('longitude', e.target.value)} />
                                    <InputError message={errors.longitude} className="mt-2" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.operations')}</h3>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="phone" value={t('fleet.bases.phone')} />
                                    <TextInput id="phone" className="mt-1 block w-full" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="email" value={t('fleet.bases.email')} />
                                    <TextInput id="email" type="email" className="mt-1 block w-full" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="opens_at" value={t('fleet.bases.opens_at')} />
                                    <TextInput id="opens_at" type="time" className="mt-1 block w-full" value={data.opens_at} onChange={(e) => setData('opens_at', e.target.value)} />
                                    <InputError message={errors.opens_at} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="closes_at" value={t('fleet.bases.closes_at')} />
                                    <TextInput id="closes_at" type="time" className="mt-1 block w-full" value={data.closes_at} onChange={(e) => setData('closes_at', e.target.value)} />
                                    <InputError message={errors.closes_at} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="timezone" value={t('fleet.bases.timezone')} />
                                    <TextInput id="timezone" className="mt-1 block w-full" value={data.timezone} onChange={(e) => setData('timezone', e.target.value)} required />
                                    <InputError message={errors.timezone} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="vehicle_capacity" value={t('fleet.bases.vehicle_capacity')} />
                                    <TextInput id="vehicle_capacity" type="number" min={1} className="mt-1 block w-full" value={data.vehicle_capacity} onChange={(e) => setData('vehicle_capacity', e.target.value)} />
                                    <InputError message={errors.vehicle_capacity} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="service_radius_km" value={t('fleet.bases.service_radius_km')} />
                                    <TextInput id="service_radius_km" type="number" step="0.01" min={0} className="mt-1 block w-full" value={data.service_radius_km} onChange={(e) => setData('service_radius_km', e.target.value)} />
                                    <InputError message={errors.service_radius_km} className="mt-2" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2">
                                        <Checkbox
                                            checked={data.allows_overnight}
                                            onChange={(e) => setData('allows_overnight', e.target.checked)}
                                        />
                                        <span className="text-sm text-gray-700">{t('fleet.bases.allows_overnight')}</span>
                                    </label>
                                    <InputError message={errors.allows_overnight} className="mt-2" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.responsibility')}</h3>
                            <div>
                                <InputLabel htmlFor="manager_id" value={t('fleet.bases.manager')} />
                                <Select
                                    id="manager_id"
                                    className="mt-1"
                                    value={data.manager_id}
                                    onChange={(value) => setData('manager_id', value)}
                                    options={managers.map((manager) => ({
                                        value: String(manager.id),
                                        label: `${manager.name} (${manager.email})`,
                                    }))}
                                />
                                <InputError message={errors.manager_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value={t('fleet.bases.staff')} />
                                <p className="mt-1 text-xs text-gray-500">{t('fleet.bases.staff_hint')}</p>
                                <div className="mt-2 max-h-[220px] divide-y overflow-y-auto rounded-lg border">
                                    {managers.map((manager) => (
                                        <label key={manager.id} className="flex cursor-pointer items-start p-3 hover:bg-gray-50">
                                            <Checkbox
                                                checked={data.staff_ids.includes(manager.id) || String(manager.id) === data.manager_id}
                                                disabled={String(manager.id) === data.manager_id}
                                                onChange={() => toggleStaff(manager.id)}
                                            />
                                            <div className="ml-3">
                                                <span className="text-sm font-medium text-gray-900">{manager.name}</span>
                                                <p className="text-xs text-gray-500">{manager.email}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.staff_ids} className="mt-2" />
                            </div>
                        </section>

                        {(locationLinkEnabled || warehouseLinkEnabled) && (
                            <section className="space-y-6">
                                <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.links')}</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {locationLinkEnabled && (
                                        <div>
                                            <InputLabel htmlFor="location_id" value={t('fleet.bases.location')} />
                                            <Select
                                                id="location_id"
                                                className="mt-1"
                                                value={data.location_id}
                                                onChange={(value) => setData('location_id', value)}
                                                placeholder={t('fleet.bases.location_none')}
                                                options={[
                                                    { value: '', label: t('fleet.bases.location_none') },
                                                    ...locations.map((location) => ({
                                                        value: String(location.id),
                                                        label: `${location.code} — ${location.name}`,
                                                    })),
                                                ]}
                                            />
                                            <InputError message={errors.location_id} className="mt-2" />
                                        </div>
                                    )}
                                    {warehouseLinkEnabled && (
                                        <div>
                                            <InputLabel htmlFor="warehouse_id" value={t('fleet.bases.warehouse')} />
                                            <Select
                                                id="warehouse_id"
                                                className="mt-1"
                                                value={data.warehouse_id}
                                                onChange={(value) => setData('warehouse_id', value)}
                                                placeholder={t('fleet.bases.warehouse_none')}
                                                options={[
                                                    { value: '', label: t('fleet.bases.warehouse_none') },
                                                    ...warehouses.map((warehouse) => ({
                                                        value: String(warehouse.id),
                                                        label: warehouse.name,
                                                    })),
                                                ]}
                                            />
                                            <InputError message={errors.warehouse_id} className="mt-2" />
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <div>
                            <InputLabel htmlFor="notes" value={t('fleet.bases.notes')} />
                            <textarea
                                id="notes"
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>{t('fleet.bases.save')}</PrimaryButton>
                            <Link href={prefixedRoute('fleet.bases.show', base.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, type ReactNode, useCallback } from 'react';
import FleetNav from '../../../../FleetNav';

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

interface Props {
    managers: ManagerOption[];
    kinds: string[];
    locations: LocationOption[];
    warehouses: WarehouseOption[];
    locationLinkEnabled: boolean;
    warehouseLinkEnabled: boolean;
}

const STATUSES = ['active', 'inactive'] as const;

function FormSection({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:px-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
        </section>
    );
}

export default function Create({
    managers,
    kinds,
    locations,
    warehouses,
    locationLinkEnabled,
    warehouseLinkEnabled,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        kind: 'depot',
        status: 'active',
        address: '',
        city: '',
        province: '',
        zip: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        opens_at: '08:00',
        closes_at: '17:00',
        timezone: 'Asia/Jakarta',
        vehicle_capacity: '',
        allows_overnight: true as boolean,
        service_radius_km: '',
        manager_id: managers[0] ? String(managers[0].id) : '',
        location_id: '',
        warehouse_id: '',
        notes: '',
        staff_ids: [] as number[],
    });

    const displayName = data.name.trim() || t('fleet.bases.preview_untitled');
    const displayCode = data.code.trim() || '—';

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('fleet.bases.store'));
    };

    const handleMapChange = useCallback(
        (next: { latitude: string; longitude: string; address?: string }) => {
            setData((current) => ({
                ...current,
                latitude: next.latitude,
                longitude: next.longitude,
                ...(next.address ? { address: next.address } : {}),
            }));
        },
        [setData],
    );

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

    const textareaClass =
        'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white';

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {t('fleet.bases.title')}
                        </p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">
                            {t('fleet.bases.add')}
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.bases.index')}>
                            <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                        </Link>
                        <PrimaryButton type="submit" form="fleet-base-create-form" disabled={processing}>
                            {processing ? t('fleet.bases.creating') : t('fleet.bases.create')}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.bases.add')} />
            <FleetNav />

            <form id="fleet-base-create-form" onSubmit={submit} className="space-y-6">
                <div className="space-y-6">
                    <FormSection
                        title={t('fleet.bases.sections.identity')}
                        subtitle={t('fleet.bases.sections.identity_hint')}
                    >
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="code" value={t('fleet.bases.code')} />
                                <TextInput
                                    id="code"
                                    className="mt-1 block w-full font-mono uppercase"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    required
                                    autoFocus
                                    placeholder="JKT-CGK-01"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.bases.code_hint')}</p>
                                <InputError message={errors.code} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="name" value={t('fleet.bases.name')} />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="Depot Cakung"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={t('fleet.bases.kind')} />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {kinds.map((kind) => {
                                    const active = data.kind === kind;

                                    return (
                                        <button
                                            key={kind}
                                            type="button"
                                            onClick={() => setData('kind', kind)}
                                            className={`rounded-xl border px-4 py-3 text-left transition ${
                                                active
                                                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200 dark:border-sky-700 dark:bg-sky-950/40 dark:ring-sky-800'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:hover:bg-gray-700/60'
                                            }`}
                                        >
                                            <p className={`text-sm font-semibold ${active ? 'text-sky-900 dark:text-sky-100' : 'text-gray-900 dark:text-white'}`}>
                                                {t(`fleet.base_kinds.${kind}`, undefined, kind)}
                                            </p>
                                            <p className={`mt-0.5 text-xs ${active ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {t(`fleet.bases.kind_hints.${kind}`, undefined, kind)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
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
                    </FormSection>

                    <FormSection
                        title={t('fleet.bases.sections.address')}
                        subtitle={t('fleet.bases.sections.address_hint')}
                    >
                            <div>
                                <InputLabel value={t('fleet.bases.map_title')} />
                                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t('fleet.bases.map_hint')}</p>
                                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
                                    <LocationMapPicker
                                        latitude={data.latitude}
                                        longitude={data.longitude}
                                        onChange={handleMapChange}
                                        height="360px"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="latitude" value={t('fleet.bases.latitude')} />
                                    <TextInput
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        className="mt-1 block w-full font-mono"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', e.target.value)}
                                    />
                                    <InputError message={errors.latitude} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="longitude" value={t('fleet.bases.longitude')} />
                                    <TextInput
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        className="mt-1 block w-full font-mono"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', e.target.value)}
                                    />
                                    <InputError message={errors.longitude} className="mt-2" />
                                </div>
                                <div className="sm:col-span-2">
                                    <InputLabel htmlFor="address" value={t('fleet.bases.address')} />
                                    <TextInput
                                        id="address"
                                        className="mt-1 block w-full"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                    />
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
                            </div>
                        </FormSection>

                        <FormSection
                            title={t('fleet.bases.sections.operations')}
                            subtitle={t('fleet.bases.sections.operations_hint')}
                        >
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            </div>

                            <button
                                type="button"
                                onClick={() => setData('allows_overnight', !data.allows_overnight)}
                                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                    data.allows_overnight
                                        ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/40 dark:ring-emerald-900'
                                        : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700/60'
                                }`}
                            >
                                <span className="pointer-events-none pt-0.5">
                                    <Checkbox checked={data.allows_overnight} readOnly tabIndex={-1} />
                                </span>
                                <span>
                                    <span className={`block text-sm font-semibold ${data.allows_overnight ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'}`}>
                                        {data.allows_overnight ? t('fleet.bases.overnight_on') : t('fleet.bases.overnight_off')}
                                    </span>
                                    <span className={`mt-0.5 block text-xs ${data.allows_overnight ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {t('fleet.bases.overnight_hint')}
                                    </span>
                                </span>
                            </button>
                            <InputError message={errors.allows_overnight} />
                        </FormSection>

                        <FormSection
                            title={t('fleet.bases.sections.responsibility')}
                            subtitle={t('fleet.bases.sections.responsibility_hint')}
                        >
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
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('fleet.bases.staff_hint')}</p>
                                <div className="mt-2 max-h-[220px] divide-y overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-600">
                                    {managers.map((manager) => {
                                        const isManager = String(manager.id) === data.manager_id;
                                        const checked = data.staff_ids.includes(manager.id) || isManager;

                                        return (
                                            <label
                                                key={manager.id}
                                                className={`flex cursor-pointer items-start p-3 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                                    isManager ? 'bg-sky-50/70 dark:bg-sky-950/30' : ''
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    disabled={isManager}
                                                    onChange={() => toggleStaff(manager.id)}
                                                />
                                                <div className="ml-3 min-w-0">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {manager.name}
                                                        {isManager && (
                                                            <span className="ml-2 text-xs font-normal text-sky-700 dark:text-sky-300">
                                                                {t('fleet.bases.manager')}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{manager.email}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.staff_ids} className="mt-2" />
                            </div>
                        </FormSection>

                        {(locationLinkEnabled || warehouseLinkEnabled) && (
                            <FormSection
                                title={t('fleet.bases.sections.links')}
                                subtitle={t('fleet.bases.sections.links_hint')}
                            >
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                            </FormSection>
                        )}

                        <FormSection
                            title={t('fleet.bases.sections.notes')}
                            subtitle={t('fleet.bases.sections.notes_hint')}
                        >
                            <div>
                                <InputLabel htmlFor="notes" value={t('fleet.bases.notes')} />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className={textareaClass}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>
                        </FormSection>
                </div>

                <div className="sticky bottom-4 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
                        <p className="min-w-0 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{displayName}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                            <span className="font-mono text-xs">{displayCode}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                            <span>{t(`fleet.base_kinds.${data.kind}`, undefined, data.kind)}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link href={prefixedRoute('fleet.bases.index')}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? t('fleet.bases.creating') : t('fleet.bases.create')}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}

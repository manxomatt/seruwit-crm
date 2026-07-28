import DynamicLayout from '@/Layouts/DynamicLayout';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LeafletMap from '@/Components/Map/LeafletMap';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { Circle, Marker } from 'react-leaflet';
import TrackingNav from '../../../../TrackingNav';

interface Geofence {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    radius_m: number;
    alert_on: string;
    active_rentals_only: boolean;
    is_active: boolean;
}

interface Props {
    geofences: Geofence[];
}

export default function Index({ geofences }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Geofence | null>(null);
    const [deleting, setDeleting] = useState<Geofence | null>(null);

    const form = useForm({
        name: '',
        latitude: '',
        longitude: '',
        radius_m: 500,
        alert_on: 'exit',
        active_rentals_only: true,
        is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        form.setData({
            name: '',
            latitude: '-6.2000000',
            longitude: '106.8160000',
            radius_m: 500,
            alert_on: 'exit',
            active_rentals_only: true,
            is_active: true,
        });
        setShowModal(true);
    };

    const openEdit = (geofence: Geofence) => {
        setEditing(geofence);
        form.clearErrors();
        form.setData({
            name: geofence.name,
            latitude: geofence.latitude,
            longitude: geofence.longitude,
            radius_m: geofence.radius_m,
            alert_on: geofence.alert_on,
            active_rentals_only: geofence.active_rentals_only,
            is_active: geofence.is_active,
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                form.reset();
            },
        };

        if (editing) {
            form.patch(prefixedRoute('tracking.geofences.update', editing.id), options);
        } else {
            form.post(prefixedRoute('tracking.geofences.store'), options);
        }
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        router.delete(prefixedRoute('tracking.geofences.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const previewBounds = useMemo(
        () =>
            geofences.map((geofence) => [Number(geofence.latitude), Number(geofence.longitude)] as [number, number]),
        [geofences],
    );

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{t('tracking.title')}</h2>}>
            <Head title={t('tracking.pages.geofences.title')} />

            <TrackingNav />

            <div className="mb-4 flex justify-end">
                <PrimaryButton type="button" onClick={openCreate}>
                    {t('tracking.actions.add_geofence')}
                </PrimaryButton>
            </div>

            <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="p-4">
                    <LeafletMap bounds={previewBounds} height="320px">
                        {geofences.map((geofence) => (
                            <Circle
                                key={geofence.id}
                                center={[Number(geofence.latitude), Number(geofence.longitude)]}
                                radius={geofence.radius_m}
                                pathOptions={{
                                    color: geofence.is_active ? '#4f46e5' : '#9ca3af',
                                    fillOpacity: 0.12,
                                }}
                            />
                        ))}
                        {geofences.map((geofence) => (
                            <Marker
                                key={`m-${geofence.id}`}
                                position={[Number(geofence.latitude), Number(geofence.longitude)]}
                            />
                        ))}
                    </LeafletMap>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                {geofences.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500">{t('tracking.pages.geofences.empty')}</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {geofences.map((geofence) => (
                            <li key={geofence.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {geofence.name}
                                        {!geofence.is_active && (
                                            <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                {t('tracking.status.inactive')}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {t('tracking.pages.geofences.summary', {
                                            radius: geofence.radius_m,
                                            alert: t(`tracking.geofence.alert_on.${geofence.alert_on}`),
                                            scope: geofence.active_rentals_only
                                                ? t('tracking.pages.geofences.active_rentals_only')
                                                : t('tracking.pages.geofences.all_vehicles'),
                                        })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <SecondaryButton type="button" onClick={() => openEdit(geofence)}>
                                        {t('common.edit')}
                                    </SecondaryButton>
                                    <DangerButton type="button" onClick={() => setDeleting(geofence)}>
                                        {t('common.delete')}
                                    </DangerButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={submit} className="space-y-4 p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        {editing ? t('tracking.pages.geofences.edit') : t('tracking.pages.geofences.create')}
                    </h3>

                    <div>
                        <InputLabel htmlFor="geofence_name" value={t('tracking.fields.geofence_name')} />
                        <TextInput
                            id="geofence_name"
                            className="mt-1 block w-full"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        <InputError message={form.errors.name} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <InputLabel htmlFor="radius_m" value={t('tracking.fields.radius_m')} />
                            <TextInput
                                id="radius_m"
                                type="number"
                                min={50}
                                className="mt-1 block w-full"
                                value={form.data.radius_m}
                                onChange={(e) => form.setData('radius_m', Number(e.target.value))}
                            />
                            <InputError message={form.errors.radius_m} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value={t('tracking.fields.alert_on')} />
                            <Select
                                className="mt-1"
                                value={form.data.alert_on}
                                onChange={(value) => form.setData('alert_on', value)}
                                options={[
                                    { value: 'exit', label: t('tracking.geofence.alert_on.exit') },
                                    { value: 'enter', label: t('tracking.geofence.alert_on.enter') },
                                    { value: 'both', label: t('tracking.geofence.alert_on.both') },
                                ]}
                            />
                            <InputError message={form.errors.alert_on} className="mt-2" />
                        </div>
                        <div className="space-y-2 pt-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.active_rentals_only}
                                    onChange={(e) => form.setData('active_rentals_only', e.target.checked)}
                                />
                                {t('tracking.fields.active_rentals_only')}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                {t('tracking.fields.is_active')}
                            </label>
                        </div>
                    </div>

                    <div>
                        <InputLabel value={t('tracking.fields.centre')} />
                        <div className="mt-2">
                            <LocationMapPicker
                                latitude={form.data.latitude}
                                longitude={form.data.longitude}
                                resolveAddress={false}
                                onChange={({ latitude, longitude }) => {
                                    form.setData({
                                        ...form.data,
                                        latitude,
                                        longitude,
                                    });
                                }}
                            />
                        </div>
                        <InputError message={form.errors.latitude || form.errors.longitude} className="mt-2" />
                    </div>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">{t('tracking.pages.geofences.delete_title')}</h3>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('tracking.pages.geofences.delete_confirm', { name: deleting?.name ?? '' })}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <DangerButton type="button" onClick={confirmDelete}>
                            {t('common.delete')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LeafletMap from '@/Components/Map/LeafletMap';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import GeofencePolygonPicker from '@/Components/Map/GeofencePolygonPicker';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { Circle, Marker, Polygon } from 'react-leaflet';
import TrackingNav from '../../../../TrackingNav';
import PageHeader from '@/Components/PageHeader';

interface Geofence {
    id: number;
    name: string;
    type?: 'circle' | 'polygon';
    coordinates?: [number, number][] | null;
    latitude: string | null;
    longitude: string | null;
    radius_m: number | null;
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
    const [customError, setCustomError] = useState<string | null>(null);

    const form = useForm<{
        name: string;
        type: 'circle' | 'polygon';
        coordinates: [number, number][];
        latitude: string;
        longitude: string;
        radius_m: number;
        alert_on: string;
        active_rentals_only: boolean;
        is_active: boolean;
    }>({
        name: '',
        type: 'circle',
        coordinates: [],
        latitude: '-6.2000000',
        longitude: '106.8160000',
        radius_m: 500,
        alert_on: 'exit',
        active_rentals_only: true,
        is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        setCustomError(null);
        form.reset();
        form.clearErrors();
        form.setData({
            name: '',
            type: 'circle',
            coordinates: [],
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
        setCustomError(null);
        form.clearErrors();
        form.setData({
            name: geofence.name,
            type: geofence.type === 'polygon' ? 'polygon' : 'circle',
            coordinates: Array.isArray(geofence.coordinates) ? geofence.coordinates : [],
            latitude: geofence.latitude ?? '-6.2000000',
            longitude: geofence.longitude ?? '106.8160000',
            radius_m: geofence.radius_m ?? 500,
            alert_on: geofence.alert_on,
            active_rentals_only: geofence.active_rentals_only,
            is_active: geofence.is_active,
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setCustomError(null);

        if (form.data.type === 'polygon' && form.data.coordinates.length < 3) {
            setCustomError(t('tracking.fields.min_polygon_points', undefined, 'Minimal 3 titik koordinat untuk membentuk area poligon.'));
            return;
        }

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

    const previewBounds = useMemo(() => {
        const points: [number, number][] = [];
        geofences.forEach((geofence) => {
            if (geofence.type === 'polygon' && Array.isArray(geofence.coordinates)) {
                geofence.coordinates.forEach((coord) => points.push([Number(coord[0]), Number(coord[1])]));
            } else if (geofence.latitude && geofence.longitude) {
                points.push([Number(geofence.latitude), Number(geofence.longitude)]);
            }
        });
        return points.length > 0 ? points : undefined;
    }, [geofences]);

    const PencilIcon = () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );

    const TrashIcon = () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );

    const EllipsisVerticalIcon = () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
        </svg>
    );

    const menuItemClassName =
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

    return (
        <DynamicLayout header={<PageHeader title={t('tracking.title')} />}>
            <Head title={t('tracking.pages.geofences.title')} />

            <TrackingNav />

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('tracking.pages.geofences.title')}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t('tracking.pages.geofences.empty')}
                    </p>
                </div>
                <PrimaryButton type="button" onClick={openCreate} className="shadow-sm">
                    + {t('tracking.actions.add_geofence')}
                </PrimaryButton>
            </div>

            {/* Overview Map */}
            <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
                <div className="p-3">
                    <LeafletMap bounds={previewBounds} height="424px">
                        {geofences.map((geofence) => {
                            if (geofence.type === 'polygon' && Array.isArray(geofence.coordinates) && geofence.coordinates.length >= 3) {
                                return (
                                    <Polygon
                                        key={`poly-${geofence.id}`}
                                        positions={geofence.coordinates}
                                        pathOptions={{
                                            color: geofence.is_active ? '#0d9488' : '#9ca3af',
                                            fillColor: geofence.is_active ? '#14b8a6' : '#9ca3af',
                                            fillOpacity: 0.25,
                                            weight: 2.5,
                                        }}
                                    />
                                );
                            }

                            if (geofence.latitude && geofence.longitude) {
                                return (
                                    <Circle
                                        key={`circle-${geofence.id}`}
                                        center={[Number(geofence.latitude), Number(geofence.longitude)]}
                                        radius={geofence.radius_m ?? 500}
                                        pathOptions={{
                                            color: geofence.is_active ? '#4f46e5' : '#9ca3af',
                                            fillColor: geofence.is_active ? '#6366f1' : '#9ca3af',
                                            fillOpacity: 0.15,
                                            weight: 2,
                                        }}
                                    />
                                );
                            }

                            return null;
                        })}

                        {geofences.map((geofence) => {
                            if (!geofence.latitude || !geofence.longitude) return null;
                            return (
                                <Marker
                                    key={`m-${geofence.id}`}
                                    position={[Number(geofence.latitude), Number(geofence.longitude)]}
                                />
                            );
                        })}
                    </LeafletMap>
                </div>
            </div>

            {/* Geofence List */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                {geofences.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500">{t('tracking.pages.geofences.empty')}</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {geofences.map((geofence) => {
                            const isPolygon = geofence.type === 'polygon';
                            const pointsCount = geofence.coordinates?.length ?? 0;

                            return (
                                <li key={geofence.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50/60 transition">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {geofence.name}
                                            </p>

                                            {/* Type Badge */}
                                            {isPolygon ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-200/60">
                                                    ⬡ Poligon ({pointsCount} Titik)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                                                    ◯ Lingkaran ({geofence.radius_m ?? 500}m)
                                                </span>
                                            )}

                                            {!geofence.is_active && (
                                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                                    {t('tracking.status.inactive')}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500">
                                            {isPolygon
                                                ? t('tracking.pages.geofences.polygon_summary', {
                                                      points: pointsCount,
                                                      alert: t(`tracking.geofence.alert_on.${geofence.alert_on}`),
                                                      scope: geofence.active_rentals_only
                                                          ? t('tracking.pages.geofences.active_rentals_only')
                                                          : t('tracking.pages.geofences.all_vehicles'),
                                                  }, `Poligon (${pointsCount} titik) · alert ${geofence.alert_on}`)
                                                : t('tracking.pages.geofences.summary', {
                                                      radius: geofence.radius_m ?? 500,
                                                      alert: t(`tracking.geofence.alert_on.${geofence.alert_on}`),
                                                      scope: geofence.active_rentals_only
                                                          ? t('tracking.pages.geofences.active_rentals_only')
                                                          : t('tracking.pages.geofences.all_vehicles'),
                                                  })}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Menu as="div" className="relative inline-block text-right">
                                            <MenuButton
                                                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
                                                title={t('common.actions')}
                                                aria-label={t('common.actions')}
                                            >
                                                <EllipsisVerticalIcon />
                                            </MenuButton>

                                            <MenuItems
                                                transition
                                                anchor="bottom end"
                                                className="z-50 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg outline-none transition"
                                            >
                                                <MenuItem>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(geofence)}
                                                        className={menuItemClassName}
                                                        title={t('common.edit')}
                                                    >
                                                        <span className="text-indigo-600">
                                                            <PencilIcon />
                                                        </span>
                                                        {t('common.edit')}
                                                    </button>
                                                </MenuItem>
                                                <div className="my-1 border-t border-slate-100" />
                                                <MenuItem>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(geofence)}
                                                        className={menuItemDangerClassName}
                                                        title={t('common.delete')}
                                                    >
                                                        <TrashIcon />
                                                        {t('common.delete')}
                                                    </button>
                                                </MenuItem>
                                            </MenuItems>
                                        </Menu>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal Create / Edit */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={submit} className="space-y-4 p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-lg font-bold text-slate-900">
                            {editing ? t('tracking.pages.geofences.edit') : t('tracking.pages.geofences.create')}
                        </h3>
                        <span className="text-xs text-slate-400">Geofencing Realtime</span>
                    </div>

                    <div>
                        <InputLabel htmlFor="geofence_name" value={t('tracking.fields.geofence_name')} />
                        <TextInput
                            id="geofence_name"
                            className="mt-1 block w-full rounded-xl"
                            placeholder="Contoh: Pool Pusat, Kawasan Industri Jababeka, dll."
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        <InputError message={form.errors.name} className="mt-1" />
                    </div>

                    {/* Zone Type Toggle (Circle vs Polygon) */}
                    <div>
                        <InputLabel value={t('tracking.fields.geofence_type', undefined, 'Tipe Bentuk Zona')} />
                        <div className="mt-1.5 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => form.setData('type', 'circle')}
                                className={`flex items-center gap-3 rounded-xl p-3 text-left border transition ${
                                    form.data.type === 'circle'
                                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600/30'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                    form.data.type === 'circle' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    <span className="text-lg font-bold">◯</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold">{t('tracking.fields.type_circle', undefined, 'Lingkaran (Radial)')}</p>
                                    <p className="text-[11px] text-slate-500">1 Titik pusat & radius meter</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => form.setData('type', 'polygon')}
                                className={`flex items-center gap-3 rounded-xl p-3 text-left border transition ${
                                    form.data.type === 'polygon'
                                        ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/30'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                    form.data.type === 'polygon' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    <span className="text-lg font-bold">⬡</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold">{t('tracking.fields.type_polygon', undefined, 'Poligon (Bentuk Bebas)')}</p>
                                    <p className="text-[11px] text-slate-500">Klik garis & aneka bentuk</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Alert & Rule Settings */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
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
                            <InputError message={form.errors.alert_on} className="mt-1" />
                        </div>

                        <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.active_rentals_only}
                                    onChange={(e) => form.setData('active_rentals_only', e.target.checked)}
                                />
                                {t('tracking.fields.active_rentals_only')}
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                {t('tracking.fields.is_active')}
                            </label>
                        </div>
                    </div>

                    {/* Interactive Map Picker according to type */}
                    {form.data.type === 'circle' ? (
                        <div className="space-y-3">
                            <div className="w-full sm:w-1/2">
                                <InputLabel htmlFor="radius_m" value={t('tracking.fields.radius_m')} />
                                <TextInput
                                    id="radius_m"
                                    type="number"
                                    min={50}
                                    className="mt-1 block w-full rounded-xl"
                                    value={form.data.radius_m}
                                    onChange={(e) => form.setData('radius_m', Number(e.target.value))}
                                />
                                <InputError message={form.errors.radius_m} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value={t('tracking.fields.centre')} />
                                <div className="mt-1">
                                    <LocationMapPicker
                                        latitude={form.data.latitude}
                                        longitude={form.data.longitude}
                                        resolveAddress={false}
                                        height="384px"
                                        onChange={({ latitude, longitude }) => {
                                            form.setData({
                                                ...form.data,
                                                latitude,
                                                longitude,
                                            });
                                        }}
                                    />
                                </div>
                                <InputError message={form.errors.latitude || form.errors.longitude} className="mt-1" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <InputLabel value="Gambar Area Poligon Bebas di Peta" />
                            <GeofencePolygonPicker
                                coordinates={form.data.coordinates}
                                height="424px"
                                onChange={(coords) => {
                                    setCustomError(null);
                                    form.setData('coordinates', coords);
                                }}
                            />
                            {customError && <p className="text-xs font-semibold text-rose-600">{customError}</p>}
                            <InputError message={form.errors.coordinates} className="mt-1" />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>
                            {form.processing ? 'Menyimpan...' : t('common.save')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900">{t('tracking.pages.geofences.delete_title')}</h3>
                    <p className="mt-2 text-sm text-slate-600">
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

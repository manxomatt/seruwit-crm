import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';

interface Location {
    id: number;
    code: string;
    name: string;
    address: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    latitude: string | null;
    longitude: string | null;
    is_active: boolean;
}

interface PaginatedLocations {
    data: Location[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    locations: PaginatedLocations;
    filters: { search: string | null; active: string | null };
    canGeocode?: boolean;
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ locations, filters, canGeocode = false, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Location | null>(null);
    const [deleting, setDeleting] = useState<Location | null>(null);

    const form = useForm({
        code: '',
        name: '',
        address: '',
        city: '',
        province: '',
        zip: '',
        latitude: '',
        longitude: '',
        is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (location: Location) => {
        setEditing(location);
        form.clearErrors();
        form.setData({
            code: location.code,
            name: location.name,
            address: location.address || '',
            city: location.city || '',
            province: location.province || '',
            zip: location.zip || '',
            latitude: location.latitude || '',
            longitude: location.longitude || '',
            is_active: location.is_active,
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
            form.patch(prefixedRoute('partners.locations.update', editing.id), options);
        } else {
            form.post(prefixedRoute('partners.locations.store'), options);
        }
    };

    const confirmDelete = () => {
        if (!deleting) return;
        router.delete(prefixedRoute('partners.locations.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(
            prefixedRoute('partners.locations.index'),
            {
                search: search || undefined,
                active: filters.active || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleMapChange = useCallback(
        (next: { latitude: string; longitude: string; address?: string }) => {
            form.setData((current) => ({
                ...current,
                latitude: next.latitude,
                longitude: next.longitude,
                ...(next.address && !current.address ? { address: next.address } : {}),
            }));
        },
        [form],
    );

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('partners.locations.head')}</h2>
                        <p className="mt-1 text-sm text-gray-500">{t('partners.locations.hint')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={prefixedRoute('partners.index')} className="text-sm text-indigo-600 hover:text-indigo-900">
                            {t('partners.locations.back_to_partners')}
                        </Link>
                        {can.create && <PrimaryButton onClick={openCreate}>{t('partners.locations.new')}</PrimaryButton>}
                    </div>
                </div>
            }
        >
            <Head title={t('partners.locations.head')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('partners.locations.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-44"
                            value={filters.active || ''}
                            onChange={(value) =>
                                router.get(
                                    prefixedRoute('partners.locations.index'),
                                    {
                                        search: search || undefined,
                                        active: value || undefined,
                                    },
                                    { preserveState: true, replace: true },
                                )
                            }
                            placeholder={t('partners.locations.all_status')}
                            options={[
                                { value: '', label: t('partners.locations.all_status') },
                                { value: '1', label: t('partners.status.active') },
                                { value: '0', label: t('partners.status.inactive') },
                            ]}
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {locations.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('partners.locations.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('partners.locations.empty_hint')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.fields.code')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.locations.name')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.fields.address')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.locations.coords')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('partners.fields.status')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {locations.data.map((location) => (
                                        <tr key={location.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{location.code}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{location.name}</td>
                                            <td className="max-w-sm truncate px-6 py-4 text-sm text-gray-500">
                                                {[location.address, location.city, location.province].filter(Boolean).join(', ') || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {location.latitude && location.longitude
                                                    ? `${location.latitude}, ${location.longitude}`
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        location.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {location.is_active ? t('partners.status.active') : t('partners.status.inactive')}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-3">
                                                    {can.update && (
                                                        <button onClick={() => openEdit(location)} className="text-indigo-600 hover:text-indigo-900">
                                                            {t('common.edit')}
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button onClick={() => setDeleting(location)} className="text-red-600 hover:text-red-900">
                                                            {t('common.delete')}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="2xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {editing ? t('partners.locations.edit') : t('partners.locations.new')}
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="loc_code" value={t('partners.fields.code')} />
                                <TextInput id="loc_code" className="mt-1 block w-full" value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} />
                                <p className="mt-1 text-xs text-gray-500">{t('partners.locations.code_hint')}</p>
                                <InputError message={form.errors.code} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="loc_name" value={t('partners.locations.name')} />
                                <TextInput id="loc_name" className="mt-1 block w-full" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                <InputError message={form.errors.name} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="loc_address" value={t('partners.fields.street')} />
                            <TextInput id="loc_address" className="mt-1 block w-full" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                            <InputError message={form.errors.address} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="loc_city" value={t('partners.fields.city')} />
                                <TextInput id="loc_city" className="mt-1 block w-full" value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="loc_province" value={t('partners.fields.province')} />
                                <TextInput id="loc_province" className="mt-1 block w-full" value={form.data.province} onChange={(e) => form.setData('province', e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="loc_zip" value={t('partners.fields.zip')} />
                                <TextInput id="loc_zip" className="mt-1 block w-full" value={form.data.zip} onChange={(e) => form.setData('zip', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <InputLabel value={t('partners.locations.map')} />
                            <p className="mb-2 text-xs text-gray-500">{t('partners.locations.map_hint')}</p>
                            <LocationMapPicker
                                latitude={String(form.data.latitude)}
                                longitude={String(form.data.longitude)}
                                onChange={handleMapChange}
                                height="280px"
                                resolveAddress={canGeocode}
                            />
                            <InputError message={form.errors.latitude || form.errors.longitude} className="mt-2" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            {t('partners.status.active')}
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">{t('partners.locations.delete_title')}</h3>
                    <p className="text-sm text-gray-500">
                        {deleting ? t('partners.locations.delete_confirm', { name: deleting.name }) : ''}
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <DangerButton onClick={confirmDelete}>{t('common.delete')}</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

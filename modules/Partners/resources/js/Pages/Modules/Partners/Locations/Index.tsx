import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';
import PartnersNav from '../../../../PartnersNav';

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
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
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-900/30';

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
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ locations, filters, can }: Props): JSX.Element {
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
                <PageHeader
                    title={t('partners.locations.head')}
                    actions={can.create ? <PrimaryButton onClick={openCreate} className="!rounded-xl text-xs shadow-sm">+ {t('partners.locations.new')}</PrimaryButton> : undefined}
                />
            }
        >
            <Head title={t('partners.locations.head')} />

            <PartnersNav />

            <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="p-6">
                        <form onSubmit={handleSearch} className="mb-6 flex flex-wrap items-center gap-3">
                            <div className="min-w-[220px] flex-1">
                                <TextInput
                                    type="text"
                                    placeholder={t('partners.locations.search_placeholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full !rounded-xl border-slate-200 dark:border-slate-800 !py-2 text-xs bg-white dark:bg-slate-900"
                                />
                            </div>
                            <Select
                                className="w-44 !py-1.5 text-xs !rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
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
                            <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('common.search')}</PrimaryButton>
                        </form>

                        {locations.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 text-xl font-bold">
                                    📍
                                </div>
                                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{t('partners.locations.empty_title')}</h3>
                                <p className="mt-1 text-xs text-slate-500">{t('partners.locations.empty_hint')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                    <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.fields.code')}</th>
                                            <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.locations.name')}</th>
                                            <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.fields.address')}</th>
                                            <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.locations.coords')}</th>
                                            <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.fields.status')}</th>
                                            <th className="w-28 px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                                {t('common.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                                        {locations.data.map((location) => (
                                            <tr key={location.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="whitespace-nowrap px-6 py-4 font-mono font-bold text-slate-500">{location.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 font-bold text-slate-900 dark:text-white">{location.name}</td>
                                                <td className="max-w-sm truncate px-6 py-4 text-slate-500 font-medium">
                                                    {[location.address, location.city, location.province].filter(Boolean).join(', ') || '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 font-mono text-[10px] text-slate-400">
                                                    {location.latitude && location.longitude
                                                        ? `${location.latitude}, ${location.longitude}`
                                                        : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${location.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        {location.is_active ? t('partners.status.active') : t('partners.status.inactive')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                                    <Menu as="div" className="relative inline-block text-right">
                                                        <MenuButton
                                                            className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                                                            title={t('common.actions')}
                                                            aria-label={t('common.actions')}
                                                        >
                                                            <EllipsisVerticalIcon />
                                                        </MenuButton>

                                                        <MenuItems
                                                            anchor="bottom end"
                                                            className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none"
                                                        >
                                                            {can.update && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(location)}
                                                                    className={menuItemClassName}
                                                                >
                                                                    <span className="text-indigo-600">
                                                                        <PencilIcon />
                                                                    </span>
                                                                    {t('common.edit')}
                                                                </button>
                                                            </MenuItem>
                                                        )}
                                                        {(can.update && can.delete) && (
                                                            <div className="my-1 border-t border-gray-100" />
                                                        )}
                                                        {can.delete && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleting(location)}
                                                                    className={menuItemDangerClassName}
                                                                >
                                                                    <TrashIcon />
                                                                    {t('common.delete')}
                                                                </button>
                                                            </MenuItem>
                                                        )}
                                                    </MenuItems>
                                                </Menu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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

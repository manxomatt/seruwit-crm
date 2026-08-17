import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatCoordinate, formatSpeedKph } from '@/utils/geo';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TrackingNav from '../../../../TrackingNav';
import PageHeader from '@/Components/PageHeader';

interface Device {
    id: number;
    name: string;
    unique_id: string;
    status: string | null;
    last_latitude: string | null;
    last_longitude: string | null;
    last_speed_kph: string | null;
    last_recorded_at: string | null;
    vehicle: { id: number; name: string; plate_number: string } | null;
    source?: { id: number; name: string; provider: string } | null;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    odometer_km: number;
}

interface PaginatedDevices {
    data: Device[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    devices: PaginatedDevices;
    pairableVehicles: Vehicle[];
    sources: Array<{ id: number; name: string; provider: string }>;
    filters: { search: string | null; source_id: number | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const LinkIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
    </svg>
);

const UnlinkIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M6 18L18 6"
        />
    </svg>
);

export default function Index({ devices, pairableVehicles, sources, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [pairing, setPairing] = useState<Device | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [sourceId, setSourceId] = useState(filters.source_id ? String(filters.source_id) : '');

    const form = useForm({ vehicle_id: '' });
    const hasFilters = Boolean(filters.search || filters.source_id);

    const sync = () => {
        router.post(
            prefixedRoute('tracking.devices.sync'),
            sourceId ? { source_id: Number(sourceId) } : {},
            { preserveScroll: true },
        );
    };

    const applyFilters = (nextSearch: string, nextSourceId: string) => {
        router.get(
            prefixedRoute('tracking.devices.index'),
            {
                search: nextSearch || undefined,
                source_id: nextSourceId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters(search, sourceId);
    };

    const clearSearch = () => {
        setSearch('');
        setSourceId('');
        router.get(prefixedRoute('tracking.devices.index'), {}, { preserveState: true, replace: true });
    };

    const submitPair: FormEventHandler = (e) => {
        e.preventDefault();
        if (!pairing) return;

        form.patch(prefixedRoute('tracking.devices.pair', pairing.id), {
            preserveScroll: true,
            onSuccess: () => {
                setPairing(null);
                form.reset();
            },
        });
    };

    const unpair = (device: Device) => {
        router.delete(prefixedRoute('tracking.devices.unpair', device.id), { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('tracking.title')}
                    actions={can.create && <PrimaryButton onClick={sync}>{t('tracking.actions.sync')}</PrimaryButton>}
                />
            }
        >
            <Head title={t('tracking.pages.devices.title')} />

            <TrackingNav />

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('tracking.pages.devices.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        {sources.length > 0 && (
                            <div className="w-full sm:w-56">
                                <Select
                                    value={sourceId}
                                    onChange={(value) => {
                                        setSourceId(value);
                                        applyFilters(search, value);
                                    }}
                                    options={[
                                        { value: '', label: t('tracking.fields.all_sources') },
                                        ...sources.map((source) => ({
                                            value: String(source.id),
                                            label: source.name,
                                        })),
                                    ]}
                                />
                            </div>
                        )}
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                        {hasFilters && (
                            <SecondaryButton type="button" onClick={clearSearch}>
                                {t('common.clear_filters')}
                            </SecondaryButton>
                        )}
                    </form>

                    {devices.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">
                                {hasFilters ? t('tracking.pages.devices.empty_search') : t('tracking.pages.devices.empty')}
                            </h3>
                            {!hasFilters && (
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('tracking.pages.devices.empty_hint')}
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tracking.fields.device')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">IMEI</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tracking.fields.source')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tracking.fields.vehicle')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Fix</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('tracking.fields.status')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {devices.data.map((device) => (
                                            <tr key={device.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{device.unique_id}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{device.source?.name ?? '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {device.vehicle ? `${device.vehicle.name} (${device.vehicle.plate_number})` : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                            {t('tracking.status.unpaired')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {device.last_latitude && device.last_longitude ? (
                                                        <>
                                                            {formatCoordinate(device.last_latitude, device.last_longitude)}
                                                            <span className="block text-xs text-gray-400">
                                                                {formatSpeedKph(device.last_speed_kph)} — {device.last_recorded_at}
                                                            </span>
                                                        </>
                                                    ) : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {device.status === 'online' ? t('tracking.status.online') : t('tracking.status.unknown')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can.update && !device.vehicle && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setPairing(device)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title={t('tracking.actions.pair')}
                                                                aria-label={t('tracking.actions.pair')}
                                                            >
                                                                <LinkIcon />
                                                            </button>
                                                        )}
                                                        {can.update && device.vehicle && (
                                                            <button
                                                                type="button"
                                                                onClick={() => unpair(device)}
                                                                className="text-amber-600 hover:text-amber-900"
                                                                title={t('tracking.actions.unpair')}
                                                                aria-label={t('tracking.actions.unpair')}
                                                            >
                                                                <UnlinkIcon />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {devices.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (devices.current_page - 1) * devices.per_page + 1,
                                            to: Math.min(devices.current_page * devices.per_page, devices.total),
                                            total: devices.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {devices.links.map((link, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                          ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                          : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Modal show={pairing !== null} onClose={() => setPairing(null)} maxWidth="md">
                <form onSubmit={submitPair} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">
                        {t('tracking.actions.pair')} {pairing?.name}
                    </h3>

                    {pairableVehicles.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('tracking.pages.devices.all_paired')}</p>
                    ) : (
                        <div>
                            <InputLabel htmlFor="vehicle_id" value={t('tracking.fields.vehicle')} />
                            <Select
                                id="vehicle_id"
                                className="mt-1"
                                value={form.data.vehicle_id}
                                onChange={(value) => form.setData('vehicle_id', value)}
                                placeholder={t('tracking.placeholders.select_vehicle')}
                                options={pairableVehicles.map((vehicle) => ({
                                    value: String(vehicle.id),
                                    label: `${vehicle.name} (${vehicle.plate_number}) — ${vehicle.odometer_km.toLocaleString('id-ID')} km`,
                                }))}
                            />
                            <InputError message={form.errors.vehicle_id} className="mt-2" />
                            <p className="mt-3 text-xs text-gray-500">
                                The vehicle's current odometer becomes the baseline; GPS kilometres are added on top of it.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setPairing(null)}>{t('common.cancel')}</SecondaryButton>
                        {pairableVehicles.length > 0 && (
                            <PrimaryButton disabled={form.processing}>{t('tracking.actions.pair')}</PrimaryButton>
                        )}
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}

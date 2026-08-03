import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    MaintenanceCategory,
    MaintenanceSchedule,
    WorkOrderVehicle,
    formatDate,
    formatOdometer,
} from '../../../../maintenanceUtils';
import PageHeader from '@/Components/PageHeader';

interface PaginatedSchedules {
    data: MaintenanceSchedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    schedules: PaginatedSchedules;
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
    filters: { vehicle_id: string | null; is_active: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

function isDue(schedule: MaintenanceSchedule, currentOdometer?: number): boolean {
    if (schedule.interval_type === 'calendar' && schedule.next_service_date) {
        return new Date(schedule.next_service_date) <= new Date();
    }

    if (schedule.interval_type === 'mileage' && schedule.next_service_odometer && currentOdometer !== undefined) {
        return currentOdometer >= schedule.next_service_odometer;
    }

    return false;
}

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function Index({ schedules, vehicles, categories, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        vehicle_id: '',
        category_id: '',
        name: '',
        interval_type: 'mileage',
        interval_value: '5000',
        last_service_odometer: '',
        last_service_date: '',
        is_active: true,
        notes: '',
    });

    const openCreate = () => {
        setEditingSchedule(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (s: MaintenanceSchedule) => {
        setEditingSchedule(s);
        setData({
            vehicle_id: String(s.vehicle_id),
            category_id: String(s.category_id),
            name: s.name,
            interval_type: s.interval_type,
            interval_value: String(s.interval_value),
            last_service_odometer: s.last_service_odometer ? String(s.last_service_odometer) : '',
            last_service_date: s.last_service_date ?? '',
            is_active: s.is_active,
            notes: s.notes ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingSchedule(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSchedule) {
            patch(prefixedRoute('maintenance.schedules.update', editingSchedule.id), { onSuccess: closeModal });
        } else {
            post(prefixedRoute('maintenance.schedules.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = () => {
        if (!deletingSchedule) return;
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.schedules.destroy', deletingSchedule.id), {
            onSuccess: () => setDeletingSchedule(null),
            onFinish: () => setDeleting(false),
        });
    };

    const applyFilter = (key: string, value: string) => {
        router.get(prefixedRoute('maintenance.schedules.index'), { ...filters, [key]: value || undefined } as Record<string, string>, {
            preserveState: true,
            replace: true,
        });
    };

    const formatInterval = (schedule: MaintenanceSchedule): string => {
        if (schedule.interval_type === 'mileage') {
            return t('maintenance.interval.every_km', {
                value: new Intl.NumberFormat(localeTag).format(schedule.interval_value),
            });
        }

        return t('maintenance.interval.every_days', { value: schedule.interval_value });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.title')}
                    actions={can.create && (
                        <PrimaryButton onClick={openCreate}>{t('maintenance.schedules.new')}</PrimaryButton>
                    )}
                />
            }
        >
            <Head title={t('maintenance.schedules.head')} />
            <MaintenanceNav />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="w-64"
                    value={filters.vehicle_id ?? ''}
                    onChange={(val) => applyFilter('vehicle_id', val)}
                    searchable
                    placeholder={t('maintenance.schedules.all_vehicles')}
                    options={[
                        { value: '', label: t('maintenance.schedules.all_vehicles') },
                        ...vehicles.map((v) => ({
                            value: String(v.id),
                            label: `${v.name} — ${v.plate_number}`,
                        })),
                    ]}
                />

                <Select
                    className="w-48"
                    value={filters.is_active ?? ''}
                    onChange={(val) => applyFilter('is_active', val)}
                    placeholder={t('maintenance.status.all')}
                    options={[
                        { value: '', label: t('maintenance.status.all') },
                        { value: '1', label: t('maintenance.status.active') },
                        { value: '0', label: t('maintenance.status.inactive') },
                    ]}
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-3 text-sm text-gray-500">
                    {t('maintenance.schedules.found', { count: schedules.total })}
                </div>

                {schedules.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <p className="text-sm">{t('maintenance.schedules.empty')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.vehicle')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.schedule')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.interval')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.last_service')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.next_service')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('maintenance.schedules.columns.status')}</th>
                                    <th className="w-28 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        <span className="sr-only">{t('common.actions')}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {schedules.data.map((s) => {
                                    const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                                    const due = isDue(s, vehicleOdometer);

                                    return (
                                        <tr key={s.id} className={`group hover:bg-gray-50 ${due ? 'bg-amber-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 text-sm">{s.vehicle?.name}</p>
                                                <p className="text-gray-400 text-xs">{s.vehicle?.plate_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: s.category?.color ?? '#6B7280' }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                                                        <p className="text-xs text-gray-500">{s.category?.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                                                {formatInterval(s)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {s.interval_type === 'mileage'
                                                    ? formatOdometer(s.last_service_odometer, localeTag)
                                                    : formatDate(s.last_service_date, localeTag)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                {s.interval_type === 'mileage' ? (
                                                    <span className={due ? 'font-semibold text-amber-700' : 'text-gray-700'}>
                                                        {formatOdometer(s.next_service_odometer, localeTag)}
                                                    </span>
                                                ) : (
                                                    <span className={due ? 'font-semibold text-amber-700' : 'text-gray-700'}>
                                                        {formatDate(s.next_service_date, localeTag)}
                                                    </span>
                                                )}
                                                {due && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{t('maintenance.schedules.due')}</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {s.is_active ? t('maintenance.status.active') : t('maintenance.status.inactive')}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                                    {can.update && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(s)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title={t('common.edit')}
                                                        >
                                                            <PencilIcon />
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingSchedule(s)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title={t('common.delete')}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {schedules.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (schedules.current_page - 1) * schedules.per_page + 1,
                                to: Math.min(schedules.current_page * schedules.per_page, schedules.total),
                                total: schedules.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {schedules.links.map((link, i) => (
                                <button
                                    key={i}
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
            </div>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        {editingSchedule ? t('maintenance.schedules.edit_title') : t('maintenance.schedules.create_title')}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="vehicle_id" value={t('maintenance.schedules.vehicle')} />
                            <Select
                                id="vehicle_id"
                                className="mt-1 w-full"
                                value={data.vehicle_id}
                                onChange={(val) => setData('vehicle_id', val)}
                                searchable
                                options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))}
                                placeholder={t('maintenance.schedules.select_vehicle')}
                            />
                            <InputError message={errors.vehicle_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="category_id" value={t('maintenance.schedules.category')} />
                            <Select
                                id="category_id"
                                className="mt-1 w-full"
                                value={data.category_id}
                                onChange={(val) => setData('category_id', val)}
                                searchable
                                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                                placeholder={t('maintenance.schedules.select_category')}
                            />
                            <InputError message={errors.category_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value={t('maintenance.schedules.name')} />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder={t('maintenance.schedules.name_placeholder')}
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="interval_type" value={t('maintenance.schedules.interval_type')} />
                                <Select
                                    id="interval_type"
                                    className="mt-1 w-full"
                                    value={data.interval_type}
                                    onChange={(val) => setData('interval_type', val)}
                                    options={[
                                        { value: 'mileage', label: t('maintenance.interval.mileage') },
                                        { value: 'calendar', label: t('maintenance.interval.calendar') },
                                    ]}
                                />
                                <InputError message={errors.interval_type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="interval_value" value={data.interval_type === 'mileage' ? t('maintenance.schedules.interval_km') : t('maintenance.schedules.interval_days')} />
                                <TextInput
                                    id="interval_value"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.interval_value}
                                    onChange={(e) => setData('interval_value', e.target.value)}
                                    required
                                />
                                <InputError message={errors.interval_value} className="mt-2" />
                            </div>
                        </div>

                        {data.interval_type === 'mileage' ? (
                            <div>
                                <InputLabel htmlFor="last_service_odometer" value={t('maintenance.schedules.last_odometer')} />
                                <TextInput
                                    id="last_service_odometer"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.last_service_odometer}
                                    onChange={(e) => setData('last_service_odometer', e.target.value)}
                                />
                                <InputError message={errors.last_service_odometer} className="mt-2" />
                            </div>
                        ) : (
                            <div>
                                <InputLabel htmlFor="last_service_date" value={t('maintenance.schedules.last_date')} />
                                <TextInput
                                    id="last_service_date"
                                    type="date"
                                    className="mt-1 block w-full"
                                    value={data.last_service_date}
                                    onChange={(e) => setData('last_service_date', e.target.value)}
                                />
                                <InputError message={errors.last_service_date} className="mt-2" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="notes" value={t('maintenance.schedules.notes')} />
                            <textarea
                                id="notes"
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? t('maintenance.actions.saving') : editingSchedule ? t('common.save') : t('maintenance.schedules.submit_create')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingSchedule}
                title={t('maintenance.schedules.delete_title')}
                message={t('maintenance.schedules.delete_confirm', { name: deletingSchedule?.name ?? '' })}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeletingSchedule(null)}
            />
        </DynamicLayout>
    );
}

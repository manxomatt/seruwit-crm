import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import MaintenanceNav from '../../MaintenanceNav';
import {
    MaintenanceCategory,
    MaintenanceSchedule,
    WorkOrderVehicle,
    formatDate,
    formatOdometer,
} from '../../maintenanceUtils';

interface PaginatedSchedules {
    data: MaintenanceSchedule[];
    current_page: number;
    last_page: number;
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

export default function Index({ schedules, vehicles, categories, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
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

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance</h2>
                    {can.create && (
                        <PrimaryButton onClick={openCreate}>+ Jadwal Baru</PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title="Jadwal Maintenance" />
            <MaintenanceNav />

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-3">
                <select
                    value={filters.vehicle_id ?? ''}
                    onChange={(e) => applyFilter('vehicle_id', e.target.value)}
                    className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Semua Kendaraan</option>
                    {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} — {v.plate_number}</option>
                    ))}
                </select>

                <select
                    value={filters.is_active ?? ''}
                    onChange={(e) => applyFilter('is_active', e.target.value)}
                    className="rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    <option value="">Semua Status</option>
                    <option value="1">Aktif</option>
                    <option value="0">Non-aktif</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-3 text-sm text-gray-500">
                    {schedules.total} jadwal ditemukan
                </div>

                {schedules.data.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <p className="text-sm">Belum ada jadwal maintenance</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Kendaraan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Jadwal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Interval</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Servis Terakhir</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Servis Berikutnya</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {schedules.data.map((s) => {
                                    const vehicleOdometer = vehicles.find((v) => v.id === s.vehicle_id)?.odometer_km;
                                    const due = isDue(s, vehicleOdometer);

                                    return (
                                        <tr key={s.id} className={`hover:bg-gray-50 ${due ? 'bg-amber-50' : ''}`}>
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
                                                {s.interval_type === 'mileage'
                                                    ? `Setiap ${new Intl.NumberFormat('id-ID').format(s.interval_value)} km`
                                                    : `Setiap ${s.interval_value} hari`}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {s.interval_type === 'mileage'
                                                    ? formatOdometer(s.last_service_odometer)
                                                    : formatDate(s.last_service_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                {s.interval_type === 'mileage' ? (
                                                    <span className={due ? 'font-semibold text-amber-700' : 'text-gray-700'}>
                                                        {formatOdometer(s.next_service_odometer)}
                                                    </span>
                                                ) : (
                                                    <span className={due ? 'font-semibold text-amber-700' : 'text-gray-700'}>
                                                        {formatDate(s.next_service_date)}
                                                    </span>
                                                )}
                                                {due && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Jatuh Tempo</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {s.is_active ? 'Aktif' : 'Non-aktif'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    {can.update && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(s)}
                                                            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {can.delete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingSchedule(s)}
                                                            className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                                                        >
                                                            Hapus
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
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-500">Hal {schedules.current_page} dari {schedules.last_page}</p>
                        <div className="flex gap-1">
                            {schedules.links.map((link, i) => (
                                <Link key={i} href={link.url ?? '#'} preserveState
                                    className={`rounded px-3 py-1.5 text-sm ${link.active ? 'bg-indigo-600 text-white' : link.url ? 'text-gray-600 hover:bg-gray-100' : 'cursor-default text-gray-300'}`}
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
                        {editingSchedule ? 'Edit Jadwal' : 'Jadwal Maintenance Baru'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="vehicle_id" value="Kendaraan *" />
                            <Select
                                id="vehicle_id"
                                className="mt-1"
                                value={data.vehicle_id}
                                onChange={(val) => setData('vehicle_id', val)}
                                options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))}
                                placeholder="Pilih kendaraan..."
                            />
                            <InputError message={errors.vehicle_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="category_id" value="Kategori *" />
                            <Select
                                id="category_id"
                                className="mt-1"
                                value={data.category_id}
                                onChange={(val) => setData('category_id', val)}
                                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                                placeholder="Pilih kategori..."
                            />
                            <InputError message={errors.category_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nama Jadwal *" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Misal: Ganti Oli Setiap 5.000 km"
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="interval_type" value="Tipe Interval" />
                                <Select
                                    id="interval_type"
                                    className="mt-1"
                                    value={data.interval_type}
                                    onChange={(val) => setData('interval_type', val)}
                                    options={[
                                        { value: 'mileage', label: 'Jarak (km)' },
                                        { value: 'calendar', label: 'Kalender (hari)' },
                                    ]}
                                />
                                <InputError message={errors.interval_type} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="interval_value" value={data.interval_type === 'mileage' ? 'Interval (km)' : 'Interval (hari)'} />
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
                                <InputLabel htmlFor="last_service_odometer" value="Odometer Servis Terakhir (km)" />
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
                                <InputLabel htmlFor="last_service_date" value="Tanggal Servis Terakhir" />
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
                            <InputLabel htmlFor="notes" value="Catatan" />
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
                        <SecondaryButton type="button" onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : editingSchedule ? 'Simpan' : 'Tambah Jadwal'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingSchedule}
                title="Hapus Jadwal"
                description={`Yakin ingin menghapus jadwal "${deletingSchedule?.name}"?`}
                processing={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingSchedule(null)}
            />
        </DynamicLayout>
    );
}

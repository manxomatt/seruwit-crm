import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    MaintenanceCategory,
    WorkOrder,
    WorkOrderVehicle,
    WorkOrderItem,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    TYPE_OPTIONS,
    ITEM_TYPE_OPTIONS,
    formatCurrency,
} from '../../../../maintenanceUtils';

interface Props {
    workOrder: WorkOrder;
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
}

const PlusIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

export default function Edit({ workOrder: wo, vehicles, categories }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const { data, setData, patch, processing, errors } = useForm({
        vehicle_id: String(wo.vehicle_id),
        category_id: String(wo.category_id),
        title: wo.title,
        description: wo.description ?? '',
        status: wo.status,
        priority: wo.priority,
        type: wo.type,
        odometer_at_service: wo.odometer_at_service ? String(wo.odometer_at_service) : '',
        scheduled_date: wo.scheduled_date ?? '',
        started_at: wo.started_at ? wo.started_at.slice(0, 16) : '',
        completed_at: wo.completed_at ? wo.completed_at.slice(0, 16) : '',
        vendor_name: wo.vendor_name ?? '',
        mechanic_name: wo.mechanic_name ?? '',
        invoice_number: wo.invoice_number ?? '',
        estimated_cost: wo.estimated_cost ?? '',
        actual_labor_cost: wo.actual_labor_cost ?? '',
        actual_parts_cost: wo.actual_parts_cost ?? '',
        notes: wo.notes ?? '',
        resolution_notes: wo.resolution_notes ?? '',
        items: (wo.items ?? []) as WorkOrderItem[],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('maintenance.work-orders.update', wo.id));
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { item_type: 'part', name: '', description: null, quantity: 1, unit: 'pcs', unit_price: 0, total_price: 0 },
        ]);
    };

    const updateItem = (index: number, field: keyof WorkOrderItem, value: string | number) => {
        const newItems = [...data.items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'unit_price') {
            item.total_price = Number(item.quantity) * Number(item.unit_price);
        }

        newItems[index] = item;
        setData('items', newItems);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const totalItems = data.items.reduce((sum, item) => sum + Number(item.total_price), 0);
    const isCompleted = data.status === 'completed';

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Work Order</h2>
                        <p className="mt-1 font-mono text-sm text-gray-500">{wo.reference_number}</p>
                    </div>
                    <Link href={prefixedRoute('maintenance.work-orders.show', wo.id)}>
                        <SecondaryButton>← Kembali</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={`Edit — ${wo.reference_number}`} />
            <MaintenanceNav />

            <form onSubmit={submit} className="space-y-6">
                {/* Main Info */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-gray-900">Informasi Pekerjaan</h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="title" value="Judul Pekerjaan *" />
                            <TextInput id="title" className="mt-1 block w-full" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                            <InputError message={errors.title} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="vehicle_id" value="Kendaraan *" />
                            <Select id="vehicle_id" className="mt-1" value={data.vehicle_id} onChange={(val) => setData('vehicle_id', val)}
                                options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))} />
                            <InputError message={errors.vehicle_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="category_id" value="Kategori *" />
                            <Select id="category_id" className="mt-1" value={data.category_id} onChange={(val) => setData('category_id', val)}
                                options={categories.map((c) => ({ value: String(c.id), label: c.name }))} />
                            <InputError message={errors.category_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <Select id="status" className="mt-1" value={data.status} onChange={(val) => setData('status', val)} options={STATUS_OPTIONS} />
                            <InputError message={errors.status} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="priority" value="Prioritas" />
                            <Select id="priority" className="mt-1" value={data.priority} onChange={(val) => setData('priority', val)} options={PRIORITY_OPTIONS} />
                            <InputError message={errors.priority} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value="Tipe" />
                            <Select id="type" className="mt-1" value={data.type} onChange={(val) => setData('type', val)} options={TYPE_OPTIONS} />
                            <InputError message={errors.type} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="scheduled_date" value="Tanggal Jadwal" />
                            <TextInput id="scheduled_date" type="date" className="mt-1 block w-full" value={data.scheduled_date} onChange={(e) => setData('scheduled_date', e.target.value)} />
                            <InputError message={errors.scheduled_date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="started_at" value="Tanggal Mulai" />
                            <TextInput id="started_at" type="datetime-local" className="mt-1 block w-full" value={data.started_at} onChange={(e) => setData('started_at', e.target.value)} />
                            <InputError message={errors.started_at} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="completed_at" value="Tanggal Selesai" />
                            <TextInput id="completed_at" type="datetime-local" className="mt-1 block w-full" value={data.completed_at} onChange={(e) => setData('completed_at', e.target.value)} />
                            <InputError message={errors.completed_at} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="odometer_at_service" value="Odometer (km)" />
                            <TextInput id="odometer_at_service" type="number" className="mt-1 block w-full" value={data.odometer_at_service} onChange={(e) => setData('odometer_at_service', e.target.value)} />
                            <InputError message={errors.odometer_at_service} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="vendor_name" value="Bengkel / Vendor" />
                            <TextInput id="vendor_name" className="mt-1 block w-full" value={data.vendor_name} onChange={(e) => setData('vendor_name', e.target.value)} />
                            <InputError message={errors.vendor_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="mechanic_name" value="Mekanik" />
                            <TextInput id="mechanic_name" className="mt-1 block w-full" value={data.mechanic_name} onChange={(e) => setData('mechanic_name', e.target.value)} />
                            <InputError message={errors.mechanic_name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="invoice_number" value="No. Invoice" />
                            <TextInput id="invoice_number" className="mt-1 block w-full" value={data.invoice_number} onChange={(e) => setData('invoice_number', e.target.value)} />
                            <InputError message={errors.invoice_number} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="estimated_cost" value="Estimasi Biaya (Rp)" />
                            <TextInput id="estimated_cost" type="number" className="mt-1 block w-full" value={String(data.estimated_cost)} onChange={(e) => setData('estimated_cost', e.target.value)} />
                            <InputError message={errors.estimated_cost} className="mt-2" />
                        </div>

                        {isCompleted && (
                            <>
                                <div>
                                    <InputLabel htmlFor="actual_labor_cost" value="Biaya Jasa Aktual (Rp)" />
                                    <TextInput id="actual_labor_cost" type="number" className="mt-1 block w-full" value={String(data.actual_labor_cost)} onChange={(e) => setData('actual_labor_cost', e.target.value)} />
                                    <InputError message={errors.actual_labor_cost} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="actual_parts_cost" value="Biaya Suku Cadang Aktual (Rp)" />
                                    <TextInput id="actual_parts_cost" type="number" className="mt-1 block w-full" value={String(data.actual_parts_cost)} onChange={(e) => setData('actual_parts_cost', e.target.value)} />
                                    <InputError message={errors.actual_parts_cost} className="mt-2" />
                                </div>
                            </>
                        )}

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="description" value="Deskripsi / Keluhan" />
                            <textarea id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="notes" value="Catatan" />
                            <textarea id="notes" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        {isCompleted && (
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="resolution_notes" value="Catatan Penyelesaian" />
                                <textarea id="resolution_notes" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    value={data.resolution_notes} onChange={(e) => setData('resolution_notes', e.target.value)} />
                                <InputError message={errors.resolution_notes} className="mt-2" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Suku Cadang & Jasa</h3>
                        <button type="button" onClick={addItem}
                            className="flex items-center gap-1 rounded-lg border border-dashed border-indigo-400 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50">
                            <PlusIcon /> Tambah Item
                        </button>
                    </div>

                    {data.items.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">Belum ada item.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 text-xs text-gray-500">
                                        <th className="pb-2 text-left font-medium">Tipe</th>
                                        <th className="pb-2 text-left font-medium">Nama</th>
                                        <th className="pb-2 text-left font-medium">Qty</th>
                                        <th className="pb-2 text-left font-medium">Satuan</th>
                                        <th className="pb-2 text-right font-medium">Harga Satuan</th>
                                        <th className="pb-2 text-right font-medium">Total</th>
                                        <th className="pb-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-2 pr-2">
                                                <select value={item.item_type} onChange={(e) => updateItem(i, 'item_type', e.target.value)}
                                                    className="rounded border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
                                                    {ITEM_TYPE_OPTIONS.map((o) => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 pr-2">
                                                <TextInput className="w-48" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} placeholder="Nama item" />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <TextInput type="number" className="w-20" value={String(item.quantity)} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <TextInput className="w-20" value={item.unit ?? ''} onChange={(e) => updateItem(i, 'unit', e.target.value)} placeholder="pcs" />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <TextInput type="number" className="w-32 text-right" value={String(item.unit_price)} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))} />
                                            </td>
                                            <td className="py-2 pr-2 text-right text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                                            <td className="py-2">
                                                <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-300">
                                        <td colSpan={5} className="pt-3 text-right text-sm font-semibold text-gray-700">Total</td>
                                        <td className="pt-3 text-right text-sm font-bold text-gray-900">{formatCurrency(totalItems)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <Link href={prefixedRoute('maintenance.work-orders.show', wo.id)}>
                        <SecondaryButton type="button">Batal</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}

import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';
import {
    BayOption,
    ItemType,
    MaintenanceCategory,
    MechanicOption,
    SparePartOption,
    VendorOption,
    WorkOrder,
    WorkOrderItem,
    WorkOrderVehicle,
    formatCurrency,
    itemTypeOptions,
    locationOptions,
    priorityOptions,
    statusOptions,
    typeOptions,
} from '../../../../maintenanceUtils';

interface Props {
    workOrder: WorkOrder;
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
    spareParts: SparePartOption[];
    vendors: VendorOption[];
    mechanics: MechanicOption[];
    bays: BayOption[];
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

export default function Edit({ workOrder: wo, vehicles, categories, spareParts, vendors, mechanics, bays }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const { data, setData, patch, processing, errors } = useForm({
        vehicle_id: String(wo.vehicle_id),
        category_id: String(wo.category_id),
        title: wo.title,
        description: wo.description ?? '',
        status: wo.status,
        priority: wo.priority,
        type: wo.type,
        service_location: wo.service_location ?? 'in_house',
        odometer_at_service: wo.odometer_at_service ? String(wo.odometer_at_service) : '',
        scheduled_date: wo.scheduled_date ?? '',
        started_at: wo.started_at ? wo.started_at.slice(0, 16) : '',
        completed_at: wo.completed_at ? wo.completed_at.slice(0, 16) : '',
        vendor_name: wo.vendor_name ?? '',
        vendor_partner_id: wo.vendor_partner_id ? String(wo.vendor_partner_id) : '',
        mechanic_name: wo.mechanic_name ?? '',
        mechanic_user_id: wo.mechanic_user_id ? String(wo.mechanic_user_id) : '',
        bay_id: wo.bay_id ? String(wo.bay_id) : '',
        estimated_hours: wo.estimated_hours != null ? String(wo.estimated_hours) : '',
        actual_hours: wo.actual_hours != null ? String(wo.actual_hours) : '',
        waiting_parts: wo.waiting_parts ?? false,
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
        patch(prefixedRoute('maintenance.work-orders.update', wo.id), {
            onError: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        });
    };

    const addItem = (): void => {
        setData('items', [
            ...data.items,
            { item_type: 'part', product_id: null, warehouse_id: null, name: '', description: null, quantity: 1, unit: 'pcs', unit_price: 0, total_price: 0 },
        ]);
    };

    const updateItem = (index: number, field: keyof WorkOrderItem, value: string | number | null): void => {
        const newItems = [...data.items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'unit_price') {
            item.total_price = Number(item.quantity) * Number(item.unit_price);
        }

        if (field === 'item_type' && value !== 'part') {
            item.product_id = null;
            item.warehouse_id = null;
        }

        newItems[index] = item;
        setData('items', newItems);
    };

    const selectSparePart = (index: number, productId: string): void => {
        const newItems = [...data.items];
        const item = { ...newItems[index] };

        if (!productId) {
            item.product_id = null;
            item.warehouse_id = null;
        } else {
            const part = spareParts.find((p) => p.id === Number(productId));
            if (part) {
                item.product_id = part.id;
                item.warehouse_id = part.warehouse_id;
                item.name = part.name;
                item.unit = part.unit ?? item.unit;
                item.unit_price = Number(part.price ?? item.unit_price);
                item.total_price = Number(item.quantity) * item.unit_price;
            }
        }

        newItems[index] = item;
        setData('items', newItems);
    };

    const removeItem = (index: number): void => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const totalItems = data.items.reduce((sum, item) => sum + Number(item.total_price), 0);
    const isCompleted = data.status === 'completed';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`Edit SPK: ${wo.reference_number}`}
                    subtitle="Perbarui informasi pekerjaan, status, kendaraan, teknisi, lokasi servis, dan rincian sparepart/jasa."
                    actions={
                        <Link
                            href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Kembali ke Detail SPK
                        </Link>
                    }
                />
            }
        >
            <Head title={`Edit SPK ${wo.reference_number} — ${wo.title}`} />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">Fleet</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('maintenance.work-orders.index')} className="hover:text-slate-700 dark:hover:text-slate-200">Maintenance & Work Orders</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('maintenance.work-orders.show', wo.id)} className="hover:text-slate-700 dark:hover:text-slate-200">{wo.reference_number}</Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Edit</span>
                </nav>

                <form onSubmit={submit} className="space-y-6">
                    {/* Card 1: Identitas & Klasifikasi Pekerjaan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">1</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Identitas & Klasifikasi SPK</h3>
                                <p className="text-xs text-slate-500">Judul perbaikan, unit kendaraan, kategori servis, status, dan prioritas pekerjaan.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="sm:col-span-2 lg:col-span-3">
                                <InputLabel htmlFor="title" value="Judul Perbaikan / Servis *" />
                                <TextInput
                                    id="title"
                                    className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    placeholder="Ganti Oli Mesin & Filter, Ganti Kampas Rem Depan..."
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="vehicle_id" value="Unit Kendaraan *" />
                                <Select
                                    id="vehicle_id"
                                    className="mt-1.5 w-full"
                                    value={data.vehicle_id}
                                    onChange={(val) => setData('vehicle_id', val)}
                                    searchable
                                    options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))}
                                    placeholder="Pilih Kendaraan..."
                                />
                                <InputError message={errors.vehicle_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="category_id" value="Kategori Maintenance *" />
                                <Select
                                    id="category_id"
                                    className="mt-1.5 w-full"
                                    value={data.category_id}
                                    onChange={(val) => setData('category_id', val)}
                                    searchable
                                    options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                                    placeholder="Pilih Kategori..."
                                />
                                <InputError message={errors.category_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status SPK *" />
                                <Select
                                    id="status"
                                    className="mt-1.5 w-full"
                                    value={data.status}
                                    onChange={(val) => setData('status', val as WorkOrder['status'])}
                                    options={statusOptions(t)}
                                />
                                <InputError message={errors.status} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="priority" value="Tingkat Prioritas *" />
                                <Select
                                    id="priority"
                                    className="mt-1.5 w-full"
                                    value={data.priority}
                                    onChange={(val) => setData('priority', val as WorkOrder['priority'])}
                                    options={priorityOptions(t)}
                                />
                                <InputError message={errors.priority} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Jenis Perbaikan *" />
                                <Select
                                    id="type"
                                    className="mt-1.5 w-full"
                                    value={data.type}
                                    onChange={(val) => setData('type', val as WorkOrder['type'])}
                                    options={typeOptions(t)}
                                />
                                <InputError message={errors.type} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="odometer_at_service" value="Odometer Kendaraan (km)" />
                                <TextInput
                                    id="odometer_at_service"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.odometer_at_service}
                                    onChange={(e) => setData('odometer_at_service', e.target.value)}
                                    placeholder="contoh: 125000"
                                />
                                <InputError message={errors.odometer_at_service} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="scheduled_date" value="Tanggal Jadwal Servis" />
                                <TextInput
                                    id="scheduled_date"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.scheduled_date}
                                    onChange={(e) => setData('scheduled_date', e.target.value)}
                                />
                                <InputError message={errors.scheduled_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="started_at" value="Waktu Waktu Mulai Pengerjaan" />
                                <TextInput
                                    id="started_at"
                                    type="datetime-local"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs text-xs"
                                    value={data.started_at}
                                    onChange={(e) => setData('started_at', e.target.value)}
                                />
                                <InputError message={errors.started_at} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="completed_at" value="Waktu Waktu Selesai Pengerjaan" />
                                <TextInput
                                    id="completed_at"
                                    type="datetime-local"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs text-xs"
                                    value={data.completed_at}
                                    onChange={(e) => setData('completed_at', e.target.value)}
                                />
                                <InputError message={errors.completed_at} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Lokasi & Penugasan Teknisi */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">2</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Lokasi Servis & Penugasan Teknisi</h3>
                                <p className="text-xs text-slate-500">Penentuan pengerjaan internal/bengkel luar, penugasan mekanik, dan bay lokasi.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="service_location" value="Lokasi Pengerjaan *" />
                                <Select
                                    id="service_location"
                                    className="mt-1.5 w-full"
                                    value={data.service_location}
                                    onChange={(val) => setData('service_location', val as WorkOrder['service_location'])}
                                    options={locationOptions(t)}
                                />
                                <InputError message={errors.service_location} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="vendor_partner_id" value="Bengkel / Vendor Rekanan" />
                                {vendors.length > 0 ? (
                                    <Select
                                        id="vendor_partner_id"
                                        className="mt-1.5 w-full"
                                        value={data.vendor_partner_id}
                                        onChange={(val) => {
                                            const vendor = vendors.find((v) => String(v.id) === val);
                                            setData({
                                                ...data,
                                                vendor_partner_id: val,
                                                vendor_name: vendor?.name ?? data.vendor_name,
                                            });
                                        }}
                                        options={[
                                            { value: '', label: '— Pilih Vendor Bengkel Rekanan —' },
                                            ...vendors.map((v) => ({
                                                value: String(v.id),
                                                label: v.code ? `${v.name} (${v.code})` : v.name,
                                            })),
                                        ]}
                                    />
                                ) : (
                                    <TextInput
                                        id="vendor_name"
                                        className="mt-1.5 block w-full !rounded-2xl shadow-2xs"
                                        value={data.vendor_name}
                                        onChange={(e) => setData('vendor_name', e.target.value)}
                                        placeholder="Nama Bengkel Luar..."
                                    />
                                )}
                                {vendors.length > 0 && !data.vendor_partner_id && (
                                    <TextInput
                                        id="vendor_name"
                                        className="mt-2 block w-full !rounded-2xl text-xs shadow-2xs"
                                        value={data.vendor_name}
                                        onChange={(e) => setData('vendor_name', e.target.value)}
                                        placeholder="Atau ketik nama bengkel manual..."
                                    />
                                )}
                                <InputError message={errors.vendor_partner_id || errors.vendor_name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="mechanic_user_id" value="Mekanik / Teknisi Penanggung Jawab" />
                                {mechanics.length > 0 && data.service_location === 'in_house' ? (
                                    <Select
                                        id="mechanic_user_id"
                                        className="mt-1.5 w-full"
                                        value={data.mechanic_user_id}
                                        onChange={(val) => {
                                            const mechanic = mechanics.find((m) => String(m.id) === val);
                                            setData({
                                                ...data,
                                                mechanic_user_id: val,
                                                mechanic_name: mechanic?.name ?? '',
                                            });
                                        }}
                                        options={[
                                            { value: '', label: '— Pilih Mekanisi Internal —' },
                                            ...mechanics.map((m) => ({ value: String(m.id), label: m.name })),
                                        ]}
                                    />
                                ) : (
                                    <TextInput
                                        id="mechanic_name"
                                        className="mt-1.5 block w-full !rounded-2xl shadow-2xs"
                                        value={data.mechanic_name}
                                        onChange={(e) => setData('mechanic_name', e.target.value)}
                                        placeholder="Nama Mekanik..."
                                    />
                                )}
                                <InputError message={errors.mechanic_user_id || errors.mechanic_name} className="mt-1" />
                            </div>

                            {data.service_location === 'in_house' && (
                                <div>
                                    <InputLabel htmlFor="bay_id" value="Bay / Stall Lokasi Servis" />
                                    <Select
                                        id="bay_id"
                                        className="mt-1.5 w-full"
                                        value={data.bay_id}
                                        onChange={(val) => setData('bay_id', val)}
                                        options={[
                                            { value: '', label: '— Pilih Bay Bengkel —' },
                                            ...bays.map((bay) => ({
                                                value: String(bay.id),
                                                label: `${bay.code} — ${bay.name}`,
                                            })),
                                        ]}
                                    />
                                    <InputError message={errors.bay_id} className="mt-1" />
                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="estimated_hours" value="Estimasi Jam Pengerjaan (Jam)" />
                                <TextInput
                                    id="estimated_hours"
                                    type="number"
                                    step="0.25"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.estimated_hours}
                                    onChange={(e) => setData('estimated_hours', e.target.value)}
                                    placeholder="contoh: 2.5"
                                />
                                <InputError message={errors.estimated_hours} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="actual_hours" value="Aktual Jam Pengerjaan (Jam)" />
                                <TextInput
                                    id="actual_hours"
                                    type="number"
                                    step="0.25"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.actual_hours}
                                    onChange={(e) => setData('actual_hours', e.target.value)}
                                    placeholder="contoh: 3.0"
                                />
                                <InputError message={errors.actual_hours} className="mt-1" />
                            </div>

                            {data.status === 'in_progress' && (
                                <div className="sm:col-span-2 flex items-center gap-2 pt-4">
                                    <label className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                                        <input
                                            type="checkbox"
                                            checked={data.waiting_parts}
                                            onChange={(e) => setData('waiting_parts', e.target.checked)}
                                            className="h-4 w-4 rounded-md border-amber-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span>⏳ Tandai Kendaraan Menunggu Ketersediaan Sparepart</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 3: Rincian Sparepart & Jasa */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">3</span>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">Rincian Item Sparepart & Jasa Maintanance</h3>
                                    <p className="text-xs text-slate-500">Tambah rincian suku cadang, ongkos kerja mekanik, dan biaya faktur pendukung.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-300"
                            >
                                <PlusIcon />
                                <span>Tambah Item</span>
                            </button>
                        </div>

                        {/* Financial Inputs */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <InputLabel htmlFor="invoice_number" value="Nomor Faktur / Invoice Vendor" />
                                <TextInput
                                    id="invoice_number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.invoice_number}
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    placeholder="INV/2026/08/..."
                                />
                                <InputError message={errors.invoice_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="estimated_cost" value="Estimasi Total Biaya (Rp)" />
                                <TextInput
                                    id="estimated_cost"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={String(data.estimated_cost)}
                                    onChange={(e) => setData('estimated_cost', e.target.value)}
                                    placeholder="0"
                                />
                                <InputError message={errors.estimated_cost} className="mt-1" />
                            </div>

                            {isCompleted && (
                                <>
                                    <div>
                                        <InputLabel htmlFor="actual_labor_cost" value="Aktual Biaya Jasa (Rp)" />
                                        <TextInput
                                            id="actual_labor_cost"
                                            type="number"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                            value={String(data.actual_labor_cost)}
                                            onChange={(e) => setData('actual_labor_cost', e.target.value)}
                                        />
                                        <InputError message={errors.actual_labor_cost} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="actual_parts_cost" value="Aktual Biaya Sparepart (Rp)" />
                                        <TextInput
                                            id="actual_parts_cost"
                                            type="number"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                            value={String(data.actual_parts_cost)}
                                            onChange={(e) => setData('actual_parts_cost', e.target.value)}
                                        />
                                        <InputError message={errors.actual_parts_cost} className="mt-1" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Dynamic Item Table */}
                        {data.items.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-400">Belum ada item rincian sparepart/jasa ditambahkan.</p>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    <PlusIcon /> Tambah Item Pertama
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-850/50 p-2">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200/60 text-[10px] font-black uppercase text-slate-400 dark:border-slate-800">
                                            <th className="pb-2 text-left px-2">Tipe Item</th>
                                            <th className="pb-2 text-left px-2">Pilih Stok Sparepart</th>
                                            <th className="pb-2 text-left px-2">Nama / Deskripsi Item</th>
                                            <th className="pb-2 text-left px-2">Qty</th>
                                            <th className="pb-2 text-left px-2">Satuan</th>
                                            <th className="pb-2 text-right px-2">Harga Satuan (Rp)</th>
                                            <th className="pb-2 text-right px-2">Total Harga</th>
                                            <th className="pb-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {data.items.map((item, i) => (
                                            <tr key={i} className="hover:bg-white/60 dark:hover:bg-slate-800/60">
                                                <td className="py-2.5 px-2">
                                                    <Select
                                                        className="w-32 !py-1 text-xs"
                                                        value={item.item_type}
                                                        onChange={(val) => updateItem(i, 'item_type', val as ItemType)}
                                                        options={itemTypeOptions(t)}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    {item.item_type === 'part' ? (
                                                        <Select
                                                            className="w-48 !py-1 text-xs"
                                                            value={item.product_id != null ? String(item.product_id) : ''}
                                                            onChange={(val) => selectSparePart(i, val)}
                                                            searchable
                                                            disabled={spareParts.length === 0}
                                                            placeholder={spareParts.length === 0 ? 'Stok Tidak Ada' : 'Manual / Pilih Stok'}
                                                            options={[
                                                                { value: '', label: spareParts.length === 0 ? 'Stok Tidak Ada' : 'Manual / Non-Stok' },
                                                                ...spareParts.map((p) => ({ value: String(p.id), label: p.name })),
                                                            ]}
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    <TextInput
                                                        className="w-48 !py-1 text-xs !rounded-xl"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(i, 'name', e.target.value)}
                                                        placeholder="Nama barang / jasa..."
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    <TextInput
                                                        type="number"
                                                        className="w-16 !py-1 text-xs !rounded-xl font-mono text-center"
                                                        value={String(item.quantity)}
                                                        onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    <TextInput
                                                        className="w-16 !py-1 text-xs !rounded-xl"
                                                        value={item.unit ?? ''}
                                                        onChange={(e) => updateItem(i, 'unit', e.target.value)}
                                                        placeholder="pcs"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2">
                                                    <TextInput
                                                        type="number"
                                                        className="w-28 !py-1 text-xs !rounded-xl font-mono text-right"
                                                        value={String(item.unit_price)}
                                                        onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(item.total_price, localeTag)}
                                                </td>
                                                <td className="py-2.5 px-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(i)}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-slate-200 dark:border-slate-700">
                                            <td colSpan={6} className="pt-3 text-right text-xs font-black text-slate-700 dark:text-slate-300">
                                                Total Rincian Item:
                                            </td>
                                            <td className="pt-3 text-right font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(totalItems, localeTag)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Card 4: Deskripsi & Catatan Pekerjaan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">4</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Deskripsi Pekerjaan & Catatan Penyelesaian</h3>
                                <p className="text-xs text-slate-500">Rincian kendala kendaraan, instruksi pekerjaan, serta rincian penyelesaian.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="description" value="Deskripsi Masalah / Instuksi Pekerjaan" />
                                <textarea
                                    id="description"
                                    rows={3}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Jelaskan kendala kendaraan atau instruksi khusus perbaikan..."
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Catatan Tambahan" />
                                <textarea
                                    id="notes"
                                    rows={2}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan internal tambahan..."
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>

                            {isCompleted && (
                                <div>
                                    <InputLabel htmlFor="resolution_notes" value="Catatan Hasil Penyelesaian Pekerjaan" />
                                    <textarea
                                        id="resolution_notes"
                                        rows={2}
                                        className="mt-1.5 block w-full rounded-2xl border-emerald-200 bg-emerald-50/50 p-3 text-xs font-medium text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                                        value={data.resolution_notes}
                                        onChange={(e) => setData('resolution_notes', e.target.value)}
                                        placeholder="Tuliskan catatan hasil pengujian dan penyelesaian pekerjaan..."
                                    />
                                    <InputError message={errors.resolution_notes} className="mt-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Action Footer Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-xl bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-black text-white dark:bg-slate-200 dark:text-slate-900">
                                {wo.reference_number}
                            </span>
                            <span className="font-black text-slate-900 dark:text-white truncate max-w-xs">{data.title || wo.title}</span>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Batal
                            </Link>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md"
                            >
                                {processing ? 'Menyimpan Perubahan...' : '💾 Simpan Perubahan SPK'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

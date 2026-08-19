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
    vehicles: WorkOrderVehicle[];
    categories: MaintenanceCategory[];
    spareParts: SparePartOption[];
    vendors: VendorOption[];
    mechanics: MechanicOption[];
    bays: BayOption[];
}

type FormData = {
    vehicle_id: string;
    category_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    type: string;
    service_location: string;
    odometer_at_service: string;
    scheduled_date: string;
    vendor_name: string;
    vendor_partner_id: string;
    mechanic_name: string;
    mechanic_user_id: string;
    bay_id: string;
    estimated_hours: string;
    estimated_cost: string;
    notes: string;
    items: WorkOrderItem[];
};

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

export default function Create({ vehicles, categories, spareParts, vendors, mechanics, bays }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const { data, setData, post, processing, errors } = useForm<FormData>({
        vehicle_id: '',
        category_id: '',
        title: '',
        description: '',
        status: 'draft',
        priority: 'normal',
        type: 'corrective',
        service_location: 'in_house',
        odometer_at_service: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        vendor_name: '',
        vendor_partner_id: '',
        mechanic_name: '',
        mechanic_user_id: '',
        bay_id: '',
        estimated_hours: '',
        estimated_cost: '',
        notes: '',
        items: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('maintenance.work-orders.store'));
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

    const totalEstimatedItems = data.items.reduce((sum, item) => sum + Number(item.total_price), 0);
    const selectedVehicle = vehicles.find((v) => String(v.id) === data.vehicle_id);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Buat Surat Perintah Kerja (SPK)"
                    subtitle="Terbitkan SPK perbaikan armada baru, alokasikan lokasi perbaikan, serta rincian estimasi biaya."
                    actions={
                        <Link href={prefixedRoute('maintenance.work-orders.index')}>
                            <SecondaryButton className="rounded-2xl text-xs font-bold">
                                ← Kembali ke Daftar
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title="Buat SPK Baru · Maintenance" />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">Fleet</Link>
                    <span>/</span>
                    <Link href={prefixedRoute('maintenance.work-orders.index')} className="hover:text-slate-700 dark:hover:text-slate-200">Maintenance & Work Orders</Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Buat SPK Baru</span>
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
                                    placeholder="contoh: Ganti Oli Mesin & Filter, Tune Up, Perbaikan Rem..."
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="vehicle_id" value="Unit Kendaraan *" />
                                <Select
                                    id="vehicle_id"
                                    className="mt-1.5 w-full"
                                    value={data.vehicle_id}
                                    onChange={(val) => {
                                        const v = vehicles.find((veh) => String(veh.id) === val);
                                        setData({
                                            ...data,
                                            vehicle_id: val,
                                            odometer_at_service: v ? String(v.odometer_km) : data.odometer_at_service,
                                        });
                                    }}
                                    searchable
                                    options={vehicles.map((v) => ({ value: String(v.id), label: `${v.name} — ${v.plate_number}` }))}
                                    placeholder="Pilih Kendaraan..."
                                />
                                {selectedVehicle && (
                                    <p className="mt-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        📍 Odometer Tercatat: {new Intl.NumberFormat(localeTag).format(selectedVehicle.odometer_km)} km
                                    </p>
                                )}
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
                                    onChange={(val) => setData('status', val)}
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
                                    onChange={(val) => setData('priority', val)}
                                    options={priorityOptions(t)}
                                />
                                <InputError message={errors.priority} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Tipe Pekerjaan *" />
                                <Select
                                    id="type"
                                    className="mt-1.5 w-full"
                                    value={data.type}
                                    onChange={(val) => setData('type', val)}
                                    options={typeOptions(t)}
                                />
                                <InputError message={errors.type} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="scheduled_date" value="Tanggal Dijadwalkan *" />
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
                                <InputLabel htmlFor="odometer_at_service" value="Odometer saat Servis (km)" />
                                <TextInput
                                    id="odometer_at_service"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.odometer_at_service}
                                    onChange={(e) => setData('odometer_at_service', e.target.value)}
                                    placeholder={selectedVehicle ? String(selectedVehicle.odometer_km) : '0'}
                                />
                                <InputError message={errors.odometer_at_service} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Lokasi & Alokasi Pengerjaan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">2</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Alokasi Lokasi Perbaikan & Tenaga Kerja</h3>
                                <p className="text-xs text-slate-500">Pilih lokasi pengerjaan (bengkel sendiri / vendor luar), mekanik, dan estimasi waktu.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="service_location" value="Lokasi Pengerjaan *" />
                                <Select
                                    id="service_location"
                                    className="mt-1.5 w-full"
                                    value={data.service_location}
                                    onChange={(val) => setData('service_location', val)}
                                    options={locationOptions(t)}
                                />
                                <InputError message={errors.service_location} className="mt-1" />
                            </div>

                            {data.service_location === 'outsource' ? (
                                <div>
                                    <InputLabel htmlFor="vendor_partner_id" value="Vendor / Bengkel Luar Rekanan" />
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
                                            searchable
                                            options={[
                                                { value: '', label: 'Pilih Vendor Rekanan...' },
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
                                            placeholder="Tuliskan nama bengkel / vendor..."
                                        />
                                    )}
                                    <InputError message={errors.vendor_partner_id || errors.vendor_name} className="mt-1" />
                                </div>
                            ) : (
                                <div>
                                    <InputLabel htmlFor="mechanic_user_id" value="Mekanik / Teknisi Penanggung Jawab" />
                                    {mechanics.length > 0 ? (
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
                                            searchable
                                            options={[
                                                { value: '', label: 'Pilih Mekanik Internal...' },
                                                ...mechanics.map((m) => ({ value: String(m.id), label: m.name })),
                                            ]}
                                        />
                                    ) : (
                                        <TextInput
                                            id="mechanic_name"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs"
                                            value={data.mechanic_name}
                                            onChange={(e) => setData('mechanic_name', e.target.value)}
                                            placeholder="Tulis nama teknisi..."
                                        />
                                    )}
                                    <InputError message={errors.mechanic_user_id || errors.mechanic_name} className="mt-1" />
                                </div>
                            )}

                            {data.service_location === 'in_house' && (
                                <div>
                                    <InputLabel htmlFor="bay_id" value="Bay / Stall Perbaikan" />
                                    <Select
                                        id="bay_id"
                                        className="mt-1.5 w-full"
                                        value={data.bay_id}
                                        onChange={(val) => setData('bay_id', val)}
                                        options={[
                                            { value: '', label: 'Pilih Bay Bengkel...' },
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
                                <InputLabel htmlFor="estimated_hours" value="Estimasi Durasi (Jam)" />
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
                                <InputLabel htmlFor="estimated_cost" value="Estimasi Total Biaya (Rp)" />
                                <TextInput
                                    id="estimated_cost"
                                    type="number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.estimated_cost}
                                    onChange={(e) => setData('estimated_cost', e.target.value)}
                                    placeholder="0"
                                />
                                <InputError message={errors.estimated_cost} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Rincian Item Sparepart & Jasa */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">3</span>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">Estimasi Rincian Item Sparepart & Jasa</h3>
                                    <p className="text-xs text-slate-500">Rincian suku cadang dan ongkos jasa mekanik yang dibutuhkan.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 px-3.5 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                            >
                                <PlusIcon /> Tambah Item Pekerjaan
                            </button>
                        </div>

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
                                                {formatCurrency(totalEstimatedItems, localeTag)}
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
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">4</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Deskripsi Pekerjaan & Catatan Internal</h3>
                                <p className="text-xs text-slate-500">Catatan gejala kerusakan, instruksi pengerjaan mekanik, dan catatan khusus.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="description" value="Deskripsi Kendala / Instruksi Pekerjaan" />
                                <textarea
                                    id="description"
                                    rows={3}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Jelaskan rincian gejala keluhan driver atau instruksi pekerjaan..."
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Catatan Internal Tambahan" />
                                <textarea
                                    id="notes"
                                    rows={2}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan tambahan..."
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Form Action Footer Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pastikan seluruh data SPK dan estimasi rincian item telah diisi dengan benar.</p>
                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('maintenance.work-orders.index')}>
                                <SecondaryButton type="button" className="rounded-2xl px-5 py-2.5 text-xs font-bold">
                                    ← Batal
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md">
                                {processing ? 'Menyimpan...' : '💾 Terbitkan SPK Baru'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

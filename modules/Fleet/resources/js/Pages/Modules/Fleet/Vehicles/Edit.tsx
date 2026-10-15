import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { toDateInputValue } from '@/utils/date';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';

const VEHICLE_STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'] as const;

const VEHICLE_TYPES = [
    { key: 'car', label: 'Mobil (Car)', icon: '🚗', desc: 'Mobil penumpang sedan, hatchback, MPV, SUV' },
    { key: 'van', label: 'Van / Minibus', icon: '🚐', desc: 'Van komersial, minibus travel / blindvan' },
    { key: 'truck', label: 'Truk (Truck)', icon: '🚚', desc: 'Truk kargo, engkel, dump truck, logistik' },
    { key: 'bus', label: 'Bus', icon: '🚌', desc: 'Medium bus atau big bus pariwisata' },
    { key: 'motorcycle', label: 'Motor', icon: '🏍️', desc: 'Sepeda motor operasional kurir / lapangan' },
] as const;

const FUEL_TYPES = [
    { key: 'petrol', label: '⛽ Bensin (Petrol)' },
    { key: 'diesel', label: '🛢️ Solar (Diesel)' },
    { key: 'electric', label: '⚡ Listrik (EV)' },
    { key: 'hybrid', label: '🔋 Hybrid' },
] as const;

const RENTAL_CLASSES = [
    { value: '', label: 'Tanpa Kelas Rental Khusus' },
    { value: 'economy', label: 'Economy (City Car)' },
    { value: 'mpv', label: 'MPV (Keluarga)' },
    { value: 'suv', label: 'SUV (Tangguh / Offroad)' },
    { value: 'van', label: 'Van / Minibus VIP' },
    { value: 'premium', label: 'Premium / Luxury VIP' },
    { value: 'other', label: 'Lainnya' },
] as const;

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    rental_class: string | null;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity: string | null;
    capacity_kg: string | number | null;
    capacity_seats: number | null;
    cost_per_km: string | number | null;
    tank_capacity_liters: string | number | null;
    expected_km_per_liter: string | number | null;
    fuel_type: string;
    status: string;
    odometer_km: number;
    stnk_expires_at: string | null;
    stnk_five_year_expires_at?: string | null;
    insurance_provider?: string | null;
    insurance_policy_number?: string | null;
    insurance_type?: string | null;
    insurance_expires_at?: string | null;
    kir_expires_at: string | null;
    photo_url: string | null;
    notes: string | null;
    home_base_id: number | null;
    ownership_type?: string | null;
    partner_id?: number | null;
    contract_number?: string | null;
    contract_start_date?: string | null;
    contract_end_date?: string | null;
    settlement_scheme?: string | null;
    revenue_share_owner_pct?: string | number | null;
    revenue_share_tenant_pct?: string | number | null;
    fixed_fee_amount?: string | number | null;
    maintenance_payer?: string | null;
}

interface HomeBaseOption {
    id: number;
    code: string;
    name: string;
}

interface PartnerOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    vehicle: Vehicle;
    bases?: HomeBaseOption[];
    partners?: PartnerOption[];
}

export default function Edit({ vehicle, bases = [], partners = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        name: vehicle.name,
        plate_number: vehicle.plate_number,
        type: vehicle.type,
        rental_class: vehicle.rental_class || '',
        brand: vehicle.brand || '',
        model_year: vehicle.model_year ?? '',
        color: vehicle.color || '',
        capacity: vehicle.capacity || '',
        capacity_kg: vehicle.capacity_kg ?? '',
        capacity_seats: vehicle.capacity_seats ?? '',
        cost_per_km: vehicle.cost_per_km ?? '',
        tank_capacity_liters: vehicle.tank_capacity_liters ?? '',
        expected_km_per_liter: vehicle.expected_km_per_liter ?? '',
        fuel_type: vehicle.fuel_type,
        status: vehicle.status,
        home_base_id: vehicle.home_base_id ? String(vehicle.home_base_id) : '',
        ownership_type: vehicle.ownership_type || 'owned',
        partner_id: vehicle.partner_id ? String(vehicle.partner_id) : '',
        contract_number: vehicle.contract_number || '',
        contract_start_date: toDateInputValue(vehicle.contract_start_date),
        contract_end_date: toDateInputValue(vehicle.contract_end_date),
        settlement_scheme: vehicle.settlement_scheme || 'revenue_share',
        revenue_share_owner_pct: vehicle.revenue_share_owner_pct !== null && vehicle.revenue_share_owner_pct !== undefined ? String(vehicle.revenue_share_owner_pct) : '70',
        revenue_share_tenant_pct: vehicle.revenue_share_tenant_pct !== null && vehicle.revenue_share_tenant_pct !== undefined ? String(vehicle.revenue_share_tenant_pct) : '30',
        fixed_fee_amount: vehicle.fixed_fee_amount !== null && vehicle.fixed_fee_amount !== undefined ? String(vehicle.fixed_fee_amount) : '',
        maintenance_payer: vehicle.maintenance_payer || 'tenant',
        odometer_km: vehicle.odometer_km,
        stnk_expires_at: toDateInputValue(vehicle.stnk_expires_at),
        stnk_five_year_expires_at: toDateInputValue(vehicle.stnk_five_year_expires_at),
        insurance_provider: vehicle.insurance_provider || '',
        insurance_policy_number: vehicle.insurance_policy_number || '',
        insurance_type: vehicle.insurance_type || 'all_risk',
        insurance_expires_at: toDateInputValue(vehicle.insurance_expires_at),
        kir_expires_at: toDateInputValue(vehicle.kir_expires_at),
        photo_url: vehicle.photo_url || '',
        notes: vehicle.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('fleet.vehicles.update', vehicle.id), {
            onError: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`Edit Kendaraan: ${vehicle.name}`}
                    subtitle={`Perbarui spesifikasi, plat nomor ${vehicle.plate_number}, foto unit, atau home base pool.`}
                    actions={
                        <Link
                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Kembali ke Detail Kendaraan
                        </Link>
                    }
                />
            }
        >
            <Head title={`Edit Kendaraan · ${vehicle.name}`} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        Fleet
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.vehicles.index')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        Armada Kendaraan
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.vehicles.show', vehicle.id)} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {vehicle.name}
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Edit</span>
                </nav>

                <form id="fleet-vehicle-edit-form" onSubmit={submit} className="space-y-6">
                    {/* 1. Identitas & Foto Kendaraan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                1
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Identitas, Foto & Tipe Kendaraan
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Informasi dasar kendaraan, nomor plat polisi, foto unit, dan kategori jenis armada.
                                </p>
                            </div>
                        </div>

                        {/* Photo Uploader */}
                        <div>
                            <InputLabel value="Foto Kendaraan (Opsional)" />
                            <p className="text-xs text-slate-400 mb-2">Upload foto tampak depan/samping kendaraan untuk kemudahan identifikasi.</p>
                            <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} />
                            <InputError message={errors.photo_url} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="Nama / Model Unit *" />
                                <TextInput
                                    id="name"
                                    className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Contoh: Toyota Avanza 1.5 G MT, Isuzu Giga Dump"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="plate_number" value="Nomor Polisi (Plat Nomor) *" />
                                <TextInput
                                    id="plate_number"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                    value={data.plate_number}
                                    onChange={(e) => setData('plate_number', e.target.value.toUpperCase())}
                                    required
                                    placeholder="B 1234 XYZ"
                                />
                                <InputError message={errors.plate_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="brand" value="Merk / Pabrikan (Brand)" />
                                <TextInput
                                    id="brand"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.brand}
                                    onChange={(e) => setData('brand', e.target.value)}
                                    placeholder="Toyota, Daihatsu, Mitsubishi, Hino, Isuzu..."
                                />
                                <InputError message={errors.brand} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="rental_class" value="Klasifikasi / Kelas Rental" />
                                <Select
                                    id="rental_class"
                                    className="mt-1.5"
                                    value={data.rental_class}
                                    onChange={(value) => setData('rental_class', value)}
                                    options={RENTAL_CLASSES.map((rc) => ({
                                        value: rc.value,
                                        label: rc.label,
                                    }))}
                                />
                                <InputError message={errors.rental_class} className="mt-1" />
                            </div>
                        </div>

                        {/* Vehicle Type Selector Cards */}
                        <div>
                            <InputLabel value="Tipe Kendaraan *" />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {VEHICLE_TYPES.map((vt) => {
                                    const active = data.type === vt.key;

                                    return (
                                        <button
                                            key={vt.key}
                                            type="button"
                                            onClick={() => setData('type', vt.key)}
                                            className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition ${
                                                active
                                                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white">
                                                <span className="text-base">{vt.icon}</span>
                                                <span>{vt.label}</span>
                                            </div>
                                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {vt.desc}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={errors.type} className="mt-1" />
                        </div>
                    </div>

                    {/* 2. Spesifikasi Fisik & Kapasitas */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                2
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Spesifikasi Fisik & Daya Tampung
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tahun perakitan, warna fisik, kapasitas kursi penumpang, dan kapasitas angkut muatan barang.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="model_year" value="Tahun Pembuatan (Model Year)" />
                                <TextInput
                                    id="model_year"
                                    type="number"
                                    min={1990}
                                    max={2030}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.model_year}
                                    onChange={(e) => setData('model_year', e.target.value)}
                                    placeholder="2023"
                                />
                                <InputError message={errors.model_year} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="color" value="Warna Kendaraan" />
                                <TextInput
                                    id="color"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.color}
                                    onChange={(e) => setData('color', e.target.value)}
                                    placeholder="Putih Metalik, Hitam, Silver..."
                                />
                                <InputError message={errors.color} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="capacity_seats" value="Kapasitas Tempat Duduk (Kursi)" />
                                <TextInput
                                    id="capacity_seats"
                                    type="number"
                                    min={1}
                                    max={100}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.capacity_seats}
                                    onChange={(e) => setData('capacity_seats', e.target.value)}
                                    placeholder="Contoh: 7"
                                />
                                <InputError message={errors.capacity_seats} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="capacity_kg" value="Kapasitas Muatan Berat (KG)" />
                                <TextInput
                                    id="capacity_kg"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.capacity_kg}
                                    onChange={(e) => setData('capacity_kg', e.target.value)}
                                    placeholder="Contoh: 1500"
                                />
                                <InputError message={errors.capacity_kg} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="capacity" value="Label Ringkasan Kapasitas (Teks Bebas)" />
                                <TextInput
                                    id="capacity"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', e.target.value)}
                                    placeholder="Contoh: 7 Kursi Penumpang + Bagasi Luas"
                                />
                                <InputError message={errors.capacity} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Bahan Bakar & Odometer */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                3
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Bahan Bakar, Efisiensi & Odometer
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Jenis bahan bakar, kapasitas tangki, estimasi konsumsi BBM, dan catatan kilometer odometer.
                                </p>
                            </div>
                        </div>

                        {/* Fuel Type Chips */}
                        <div>
                            <InputLabel value="Jenis Bahan Bakar *" />
                            <div className="mt-2 flex flex-wrap gap-2.5">
                                {FUEL_TYPES.map((ft) => (
                                    <button
                                        key={ft.key}
                                        type="button"
                                        onClick={() => setData('fuel_type', ft.key)}
                                        className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                                            data.fuel_type === ft.key
                                                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-200'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {ft.label}
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.fuel_type} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="tank_capacity_liters" value="Kapasitas Tangki (Liter)" />
                                <TextInput
                                    id="tank_capacity_liters"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.tank_capacity_liters}
                                    onChange={(e) => setData('tank_capacity_liters', e.target.value)}
                                    placeholder="Contoh: 45"
                                />
                                <InputError message={errors.tank_capacity_liters} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="expected_km_per_liter" value="Target Konsumsi BBM (KM / Liter)" />
                                <TextInput
                                    id="expected_km_per_liter"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.expected_km_per_liter}
                                    onChange={(e) => setData('expected_km_per_liter', e.target.value)}
                                    placeholder="Contoh: 12.5"
                                />
                                <InputError message={errors.expected_km_per_liter} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="cost_per_km" value="Estimasi Biaya Operasional / KM (Rp)" />
                                <TextInput
                                    id="cost_per_km"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.cost_per_km}
                                    onChange={(e) => setData('cost_per_km', e.target.value)}
                                    placeholder="Contoh: 1800"
                                />
                                <InputError message={errors.cost_per_km} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="odometer_km" value="Odometer Saat Ini (KM) *" />
                                <TextInput
                                    id="odometer_km"
                                    type="number"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.odometer_km}
                                    onChange={(e) => setData('odometer_km', parseInt(e.target.value) || 0)}
                                    required
                                />
                                <InputError message={errors.odometer_km} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* 4. Penugasan Base Pool & Status */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-base font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                4
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Penugasan Home Base Pool & Status Operasional
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tentukan titik pangkalan pool tempat unit diparkir dan status kesiapan operasionalnya.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="home_base_id" value="Home Base / Pangkalan Pool" />
                                <Select
                                    id="home_base_id"
                                    className="mt-1.5"
                                    value={data.home_base_id}
                                    onChange={(value) => setData('home_base_id', value)}
                                    placeholder="Pilih Home Base Pool Kendaraan"
                                    options={[
                                        { value: '', label: 'Tanpa Home Base Khusus' },
                                        ...bases.map((base) => ({
                                            value: String(base.id),
                                            label: `🏢 ${base.name} (${base.code})`,
                                        })),
                                    ]}
                                />
                                <InputError message={errors.home_base_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status Kesiapan Operasional *" />
                                <Select
                                    id="status"
                                    className="mt-1.5"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: '✓ Siap Operasi (Aktif)' },
                                        { value: 'maintenance', label: '🛠️ Dalam Perawatan (Servis)' },
                                        { value: 'out_of_service', label: '✕ Rusak / Non-Aktif' },
                                        { value: 'retired', label: '⏸ Purna Tugas / Dijual' },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* 5. Status Kepemilikan & Kerjasama Mitra */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-100 text-base font-black text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                                5
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Status Kepemilikan & Kerjasama Mitra / Investor
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tentukan apakah unit merupakan aset sendiri, titipan investor (bagi hasil/sewa tetap), atau pinjaman/sublease rekanan.
                                </p>
                            </div>
                        </div>

                        {/* Pilihan Kepemilikan */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                                    data.ownership_type === 'owned'
                                        ? 'border-teal-500 bg-teal-50/40 dark:border-teal-500/80 dark:bg-teal-950/30'
                                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="ownership_type"
                                    value="owned"
                                    checked={data.ownership_type === 'owned'}
                                    onChange={() => setData('ownership_type', 'owned')}
                                    className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500"
                                />
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span>🏢</span> Milik Sendiri (Owned)
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Aset penuh perusahaan tenant. Pendapatan dan perawatan 100% internal.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                                    data.ownership_type === 'investor'
                                        ? 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-500/80 dark:bg-indigo-950/30'
                                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="ownership_type"
                                    value="investor"
                                    checked={data.ownership_type === 'investor'}
                                    onChange={() => setData('ownership_type', 'investor')}
                                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span>🤝</span> Titipan Investor
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Unit dititipkan pemodal/investor dengan skema bagi hasil omset atau sewa bulanan.
                                    </p>
                                </div>
                            </label>

                            <label
                                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                                    data.ownership_type === 'partner_loan'
                                        ? 'border-amber-500 bg-amber-50/40 dark:border-amber-500/80 dark:bg-amber-950/30'
                                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="ownership_type"
                                    value="partner_loan"
                                    checked={data.ownership_type === 'partner_loan'}
                                    onChange={() => setData('ownership_type', 'partner_loan')}
                                    className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500"
                                />
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span>🔄</span> Pinjaman / Sublease Rekanan
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Unit dipinjam atau disewa dari vendor rekanan sewa untuk mencukupi lonjakan order.
                                    </p>
                                </div>
                            </label>
                        </div>
                        <InputError message={errors.ownership_type} className="mt-1" />

                        {/* Form Detail jika Bukan Milik Sendiri */}
                        {data.ownership_type !== 'owned' && (
                            <div className="mt-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-850/50 space-y-5 animate-in fade-in duration-200">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <InputLabel
                                            htmlFor="partner_id"
                                            value={data.ownership_type === 'investor' ? 'Investor Pemilik Unit *' : 'Mitra Rekanan Penyedia Unit *'}
                                        />
                                        <Select
                                            id="partner_id"
                                            className="mt-1.5"
                                            value={data.partner_id}
                                            onChange={(value) => setData('partner_id', value)}
                                            placeholder="Pilih Mitra / Investor Terdaftar"
                                            options={[
                                                { value: '', label: '-- Pilih Mitra / Investor --' },
                                                ...partners.map((p) => ({
                                                    value: String(p.id),
                                                    label: `👤 ${p.name} (${p.code})`,
                                                })),
                                            ]}
                                        />
                                        <InputError message={errors.partner_id} className="mt-1" />
                                        {partners.length === 0 && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Belum ada mitra terdaftar. Tambahkan investor/mitra terlebih dahulu di menu Pelanggan & Mitra.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="contract_number" value="Nomor Perjanjian / PKS Kerjasama" />
                                        <TextInput
                                            id="contract_number"
                                            type="text"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs"
                                            value={data.contract_number}
                                            onChange={(e) => setData('contract_number', e.target.value)}
                                            placeholder="Contoh: PKS/2026/INV-001"
                                        />
                                        <InputError message={errors.contract_number} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="contract_start_date" value="Tanggal Mulai Kerjasama" />
                                        <TextInput
                                            id="contract_start_date"
                                            type="date"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                            value={data.contract_start_date}
                                            onChange={(e) => setData('contract_start_date', e.target.value)}
                                        />
                                        <InputError message={errors.contract_start_date} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="contract_end_date" value="Tanggal Selesai Kerjasama" />
                                        <TextInput
                                            id="contract_end_date"
                                            type="date"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                            value={data.contract_end_date}
                                            onChange={(e) => setData('contract_end_date', e.target.value)}
                                        />
                                        <InputError message={errors.contract_end_date} className="mt-1" />
                                    </div>
                                </div>

                                {/* Skema Finansial & Komitmen */}
                                <div className="border-t border-slate-200/80 pt-4 dark:border-slate-800 space-y-4">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Skema Pembayaran & Bagi Hasil
                                    </h4>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                        <div>
                                            <InputLabel htmlFor="settlement_scheme" value="Skema Komitmen Finansial" />
                                            <Select
                                                id="settlement_scheme"
                                                className="mt-1.5"
                                                value={data.settlement_scheme}
                                                onChange={(value) => setData('settlement_scheme', value)}
                                                options={[
                                                    { value: 'revenue_share', label: 'Bagi Hasil Omset (%)' },
                                                    { value: 'fixed_monthly', label: 'Sewa Tetap Bulanan (Rp)' },
                                                    { value: 'daily_rental', label: 'Tarif Sewa Harian Rekanan (Rp)' },
                                                ]}
                                            />
                                            <InputError message={errors.settlement_scheme} className="mt-1" />
                                        </div>

                                        {data.settlement_scheme === 'revenue_share' ? (
                                            <>
                                                <div>
                                                    <InputLabel htmlFor="revenue_share_owner_pct" value="Porsi Pemilik / Investor (%)" />
                                                    <TextInput
                                                        id="revenue_share_owner_pct"
                                                        type="number"
                                                        step="0.1"
                                                        min={0}
                                                        max={100}
                                                        className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                                        value={data.revenue_share_owner_pct}
                                                        onChange={(e) => {
                                                            const ownerVal = parseFloat(e.target.value) || 0;
                                                            setData((prev) => ({
                                                                ...prev,
                                                                revenue_share_owner_pct: e.target.value,
                                                                revenue_share_tenant_pct: String(Math.max(0, 100 - ownerVal)),
                                                            }));
                                                        }}
                                                        placeholder="70"
                                                    />
                                                    <InputError message={errors.revenue_share_owner_pct} className="mt-1" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="revenue_share_tenant_pct" value="Porsi Pengelola / Tenant (%)" />
                                                    <TextInput
                                                        id="revenue_share_tenant_pct"
                                                        type="number"
                                                        step="0.1"
                                                        min={0}
                                                        max={100}
                                                        className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                                        value={data.revenue_share_tenant_pct}
                                                        onChange={(e) => setData('revenue_share_tenant_pct', e.target.value)}
                                                        placeholder="30"
                                                    />
                                                    <InputError message={errors.revenue_share_tenant_pct} className="mt-1" />
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <InputLabel
                                                    htmlFor="fixed_fee_amount"
                                                    value={data.settlement_scheme === 'fixed_monthly' ? 'Biaya Sewa Bulanan (Rp)' : 'Tarif Sewa Harian (Rp)'}
                                                />
                                                <MoneyInput
                                                    id="fixed_fee_amount"
                                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                                    value={data.fixed_fee_amount}
                                                    onChange={(val) => setData('fixed_fee_amount', val)}
                                                    placeholder="Contoh: 4500000"
                                                />
                                                <InputError message={errors.fixed_fee_amount} className="mt-1" />
                                            </div>
                                        )}

                                        <div>
                                            <InputLabel htmlFor="maintenance_payer" value="Penanggung Servis & Perawatan" />
                                            <Select
                                                id="maintenance_payer"
                                                className="mt-1.5"
                                                value={data.maintenance_payer}
                                                onChange={(value) => setData('maintenance_payer', value)}
                                                options={[
                                                    { value: 'tenant', label: 'Pengelola / Tenant' },
                                                    { value: 'owner', label: 'Pemilik Unit (Potong Hasil)' },
                                                    { value: 'shared', label: 'Dibagi Dua (50 : 50)' },
                                                ]}
                                            />
                                            <InputError message={errors.maintenance_payer} className="mt-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 6. Kepatuhan Dokumen & Catatan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                6
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Kepatuhan Pajak, Uji KIR & Catatan Unit
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Catat tanggal jatuh tempo STNK dan uji berkala KIR agar sistem dapat memberikan peringatan dini.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="stnk_expires_at" value="Pajak STNK Tahunan" />
                                <TextInput
                                    id="stnk_expires_at"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.stnk_expires_at}
                                    onChange={(e) => setData('stnk_expires_at', e.target.value)}
                                />
                                <InputError message={errors.stnk_expires_at} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="stnk_five_year_expires_at" value="STNK 5 Tahunan (Ganti Plat / Kaleng)" />
                                <TextInput
                                    id="stnk_five_year_expires_at"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.stnk_five_year_expires_at}
                                    onChange={(e) => setData('stnk_five_year_expires_at', e.target.value)}
                                />
                                <InputError message={errors.stnk_five_year_expires_at} className="mt-1" />
                            </div>

                            {/* Insurance Details Box */}
                            <div className="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/40 space-y-3">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span>🛡️</span>
                                    <span>Informasi Polis Asuransi Kendaraan</span>
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div>
                                        <InputLabel htmlFor="insurance_provider" value="Perusahaan Asuransi" />
                                        <TextInput
                                            id="insurance_provider"
                                            placeholder="cth: Garda Oto / ACA"
                                            className="mt-1.5 block w-full !rounded-xl text-xs"
                                            value={data.insurance_provider}
                                            onChange={(e) => setData('insurance_provider', e.target.value)}
                                        />
                                        <InputError message={errors.insurance_provider} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="insurance_type" value="Jenis Perlindungan" />
                                        <select
                                            id="insurance_type"
                                            className="mt-1.5 block w-full rounded-xl border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                            value={data.insurance_type}
                                            onChange={(e) => setData('insurance_type', e.target.value)}
                                        >
                                            <option value="all_risk">All Risk (Comprehensive)</option>
                                            <option value="tlo">Total Loss Only (TLO)</option>
                                            <option value="comprehensive">Kombinasi</option>
                                        </select>
                                        <InputError message={errors.insurance_type} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="insurance_expires_at" value="Jatuh Tempo Asuransi" />
                                        <TextInput
                                            id="insurance_expires_at"
                                            type="date"
                                            className="mt-1.5 block w-full !rounded-xl font-mono text-xs"
                                            value={data.insurance_expires_at}
                                            onChange={(e) => setData('insurance_expires_at', e.target.value)}
                                        />
                                        <InputError message={errors.insurance_expires_at} className="mt-1" />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <InputLabel htmlFor="insurance_policy_number" value="Nomor Polis Asuransi (Opsional)" />
                                        <TextInput
                                            id="insurance_policy_number"
                                            placeholder="cth: POL-2026-ASTRA-88912"
                                            className="mt-1.5 block w-full !rounded-xl font-mono text-xs"
                                            value={data.insurance_policy_number}
                                            onChange={(e) => setData('insurance_policy_number', e.target.value)}
                                        />
                                        <InputError message={errors.insurance_policy_number} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="kir_expires_at" value="Masa Berlaku Uji KIR (Opsional, untuk komersial/shuttle/elf)" />
                                <TextInput
                                    id="kir_expires_at"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                    value={data.kir_expires_at}
                                    onChange={(e) => setData('kir_expires_at', e.target.value)}
                                />
                                <InputError message={errors.kir_expires_at} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="notes" value="Catatan Khusus Unit Kendaraan" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Catatan kondisi velg, riwayat baret, perlengkapan dongkrak, atau modifikasi khusus..."
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Form Action Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <Link
                            href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Batal & Kembali
                        </Link>

                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                        >
                            {processing ? 'Menyimpan Perubahan...' : '💾 Simpan Perubahan Unit'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

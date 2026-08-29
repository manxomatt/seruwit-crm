import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import VehicleAiGeneratePanel, { ExtractedVehicleData } from '../../../../Components/VehicleAiGeneratePanel';
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

interface HomeBaseOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    bases?: HomeBaseOption[];
}

export default function Create({ bases = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        plate_number: '',
        type: 'car',
        rental_class: '',
        brand: '',
        model_year: '',
        color: '',
        capacity: '',
        capacity_kg: '',
        capacity_seats: '',
        cost_per_km: '',
        tank_capacity_liters: '',
        expected_km_per_liter: '',
        fuel_type: 'petrol',
        status: 'active',
        home_base_id: bases[0] ? String(bases[0].id) : '',
        odometer_km: 0,
        stnk_expires_at: '',
        kir_expires_at: '',
        photo_url: '',
        notes: '',
    });

    const handleApplyAiData = (generated: ExtractedVehicleData) => {
        setData((prev) => ({
            ...prev,
            name: generated.name || prev.name,
            brand: generated.brand !== undefined && generated.brand !== '' ? generated.brand : prev.brand,
            plate_number: generated.plate_number || prev.plate_number,
            type: (generated.type as any) || prev.type,
            rental_class: generated.rental_class !== undefined ? generated.rental_class : prev.rental_class,
            model_year: generated.model_year !== null && generated.model_year !== undefined ? String(generated.model_year) : prev.model_year,
            color: generated.color !== undefined && generated.color !== '' ? generated.color : prev.color,
            capacity: generated.capacity !== undefined && generated.capacity !== '' ? generated.capacity : prev.capacity,
            capacity_seats: generated.capacity_seats !== null && generated.capacity_seats !== undefined ? String(generated.capacity_seats) : prev.capacity_seats,
            capacity_kg: generated.capacity_kg !== null && generated.capacity_kg !== undefined ? String(generated.capacity_kg) : prev.capacity_kg,
            cost_per_km: generated.cost_per_km !== null && generated.cost_per_km !== undefined ? String(generated.cost_per_km) : prev.cost_per_km,
            tank_capacity_liters: generated.tank_capacity_liters !== null && generated.tank_capacity_liters !== undefined ? String(generated.tank_capacity_liters) : prev.tank_capacity_liters,
            expected_km_per_liter: generated.expected_km_per_liter !== null && generated.expected_km_per_liter !== undefined ? String(generated.expected_km_per_liter) : prev.expected_km_per_liter,
            fuel_type: (generated.fuel_type as any) || prev.fuel_type,
            status: (generated.status as any) || prev.status,
            home_base_id: generated.home_base_id ? String(generated.home_base_id) : prev.home_base_id,
            odometer_km: generated.odometer_km !== null && generated.odometer_km !== undefined ? Number(generated.odometer_km) : prev.odometer_km,
            stnk_expires_at: generated.stnk_expires_at || prev.stnk_expires_at,
            kir_expires_at: generated.kir_expires_at || prev.kir_expires_at,
            notes: generated.notes ? (prev.notes ? `${prev.notes}\n${generated.notes}` : generated.notes) : prev.notes,
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('fleet.vehicles.store'), {
            onError: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Tambah Unit Kendaraan Baru"
                    subtitle="Daftarkan kendaraan operasional baru ke dalam armada sistem dengan spesifikasi lengkap, foto unit, dan home base pool."
                    actions={
                        <Link
                            href={prefixedRoute('fleet.vehicles.index')}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Kembali ke Daftar Kendaraan
                        </Link>
                    }
                />
            }
        >
            <Head title="Tambah Kendaraan Baru · Armada" />
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tambah Unit Baru</span>
                </nav>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
                    {/* Kolom Kiri: Form Utama */}
                    <div className="lg:col-span-8 space-y-6">
                        <form id="fleet-vehicle-create-form" onSubmit={submit} className="space-y-6">
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

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                                <InputLabel htmlFor="expected_km_per_liter" value="Target Konsumsi (KM / Liter)" />
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

                    {/* 5. Kepatuhan Dokumen & Catatan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                5
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
                                <InputLabel htmlFor="stnk_expires_at" value="Masa Berlaku STNK / Pajak" />
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
                                <InputLabel htmlFor="kir_expires_at" value="Masa Berlaku Uji KIR (Opsional)" />
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
                            href={prefixedRoute('fleet.vehicles.index')}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Batal & Kembali
                        </Link>

                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                        >
                            {processing ? 'Menyimpan Unit...' : 'Simpan Kendaraan Baru'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>

            {/* Kolom Kanan: Panel AI Asisten (Sticky) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                <VehicleAiGeneratePanel bases={bases} onApply={handleApplyAiData} />
            </div>
        </div>
    </div>
</DynamicLayout>
    );
}

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
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
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

interface RentalRateCoverage {
    has_global_rate: boolean;
    covered_rental_classes: string[];
    covered_vehicle_types: string[];
    sample_rates: Record<string, { name: string; rate_per_period: number; period_type: string }>;
}

interface Props {
    bases?: HomeBaseOption[];
    available_credits?: number;
    is_trial_mode?: boolean;
    trial_duration_days?: number;
    max_trial_vehicles?: number;
    trial_vehicles_count?: number;
    has_reached_trial_limit?: boolean;
    remaining_trial_slots?: number | null;
    rental_module_enabled?: boolean;
    rental_rate_coverage?: RentalRateCoverage | null;
}

export default function Create({
    bases = [],
    available_credits = 0,
    is_trial_mode = false,
    trial_duration_days = 30,
    max_trial_vehicles = 5,
    trial_vehicles_count = 0,
    has_reached_trial_limit = false,
    remaining_trial_slots = null,
    rental_module_enabled = false,
    rental_rate_coverage = null,
}: Props): JSX.Element {
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
        rental_rate: {
            name: '',
            rate_per_period: '',
            period_type: 'daily',
            deposit_amount: '0',
            scope: 'class',
        },
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

    // Evaluasi cakupan tarif sewa secara reaktif
    const rateCoverageStatus = useMemo(() => {
        if (!rental_module_enabled || !rental_rate_coverage) {
            return { isCovered: true, source: null, sample: null };
        }

        const selectedClass = data.rental_class ? data.rental_class.toLowerCase().trim() : '';
        const selectedType = data.type ? data.type.toLowerCase().trim() : '';

        if (selectedClass && rental_rate_coverage.covered_rental_classes.includes(selectedClass)) {
            return {
                isCovered: true,
                source: t('fleet.vehicles.rate_source_class', { class: selectedClass.toUpperCase() }, `Kelas Rental (${selectedClass.toUpperCase()})`),
                sample: rental_rate_coverage.sample_rates[`class:${selectedClass}`] || null,
            };
        }

        if (selectedType && rental_rate_coverage.covered_vehicle_types.includes(selectedType)) {
            return {
                isCovered: true,
                source: t('fleet.vehicles.rate_source_type', { type: selectedType.toUpperCase() }, `Tipe Kendaraan (${selectedType.toUpperCase()})`),
                sample: rental_rate_coverage.sample_rates[`type:${selectedType}`] || null,
            };
        }

        if (rental_rate_coverage.has_global_rate) {
            return {
                isCovered: true,
                source: t('fleet.vehicles.rate_source_global', undefined, 'Tarif Umum Global'),
                sample: rental_rate_coverage.sample_rates['global'] || null,
            };
        }

        return { isCovered: false, source: null, sample: null };
    }, [rental_module_enabled, rental_rate_coverage, data.rental_class, data.type, t]);

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
                    title={t('fleet.vehicles.create_title', undefined, 'Tambah Unit Kendaraan Baru')}
                    subtitle={t('fleet.vehicles.create_subtitle', undefined, 'Daftarkan kendaraan operasional baru ke dalam armada sistem dengan spesifikasi lengkap, foto unit, dan home base pool.')}
                    actions={
                        <Link
                            href={prefixedRoute('fleet.vehicles.index')}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← {t('fleet.vehicles.back_to_index', undefined, 'Kembali ke Daftar Kendaraan')}
                        </Link>
                    }
                />
            }
        >
            <Head title={t('fleet.vehicles.head_create_title', undefined, 'Tambah Kendaraan Baru · Armada')} />
            <FleetNav />

            <div className="w-full space-y-6 pb-20">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {t('fleet.vehicles.breadcrumb_root', undefined, 'Armada')}
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.vehicles.index')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {t('fleet.vehicles.breadcrumb_vehicles', undefined, 'Armada Kendaraan')}
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                        {t('fleet.vehicles.breadcrumb_create', undefined, 'Tambah Unit Baru')}
                    </span>
                </nav>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
                    {/* Kolom Kiri: Form Utama */}
                    <div className="lg:col-span-8 space-y-6">
                        {is_trial_mode && (
                            has_reached_trial_limit ? (
                                <div className="flex items-center gap-4 rounded-3xl border border-amber-200/80 bg-amber-50/60 p-5 shadow-xs dark:border-amber-800/60 dark:bg-amber-950/20">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-600 text-xl text-white shadow-xs">
                                        ⚠️
                                    </span>
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                                            {t('fleet.vehicles.trial_limit_reached_title', { count: trial_vehicles_count, max: max_trial_vehicles }, `Batas Kuota Free Trial Tercapai (${trial_vehicles_count} / ${max_trial_vehicles} Unit Digunakan)`)}
                                        </h4>
                                        <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                                            {t('fleet.vehicles.trial_limit_reached_desc', { max: max_trial_vehicles }, `Akun Anda telah menggunakan seluruh jatah ${max_trial_vehicles} unit uji coba gratis. Kendaraan baru ini akan didaftarkan sebagai unit berbayar dan memerlukan 1 saldo kredit kapasitas atau diset Non-Aktif sampai dilakukan aktivasi.`)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 rounded-3xl border border-cyan-200/80 bg-cyan-50/60 p-5 shadow-xs dark:border-cyan-800/60 dark:bg-cyan-950/20">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-600 text-xl text-white shadow-xs">
                                        🎁
                                    </span>
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                                            {t('fleet.vehicles.trial_active_title', { days: trial_duration_days }, `Free Trial ${trial_duration_days} Hari untuk Armada Baru`)}
                                            {max_trial_vehicles > 0 ? ` ${t('fleet.vehicles.trial_active_units', { count: trial_vehicles_count, max: max_trial_vehicles }, `(${trial_vehicles_count} / ${max_trial_vehicles} Unit Digunakan)`)}` : ''}
                                        </h4>
                                        <p className="text-[11px] leading-relaxed text-cyan-700 dark:text-cyan-300">
                                            {t('fleet.vehicles.trial_active_desc', { days: trial_duration_days }, `Pendaftaran armada bebas kuota. Setiap unit baru yang didaftarkan otomatis mendapatkan masa uji coba gratis selama ${trial_duration_days} hari tanpa memotong saldo kredit kapasitas unit Anda`)}
                                            {remaining_trial_slots !== null && remaining_trial_slots !== undefined ? ` ${t('fleet.vehicles.trial_remaining_slots', { slots: remaining_trial_slots }, `(Tersisa ${remaining_trial_slots} kuota trial).`)}` : '.'}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}

                        <form id="fleet-vehicle-create-form" onSubmit={submit} className="space-y-6">
                            {/* 1. Identitas & Foto Kendaraan */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {t('fleet.vehicles.section1_num', undefined, '1')}
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.vehicles.section1_title', undefined, 'Identitas, Foto & Tipe Kendaraan')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.vehicles.section1_desc', undefined, 'Informasi dasar kendaraan, nomor plat polisi, foto unit, dan kategori jenis armada.')}
                                        </p>
                                    </div>
                                </div>

                                {/* Photo Uploader */}
                                <div>
                                    <InputLabel value={t('fleet.vehicles.photo_optional', undefined, 'Foto Kendaraan (Opsional)')} />
                                    <p className="text-xs text-slate-400 mb-2">
                                        {t('fleet.vehicles.photo_hint_upload', undefined, 'Upload foto tampak depan/samping kendaraan untuk kemudahan identifikasi.')}
                                    </p>
                                    <ImageUploader value={data.photo_url} onChange={(value) => setData('photo_url', value)} />
                                    <InputError message={errors.photo_url} className="mt-1" />
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="name" value={t('fleet.vehicles.name_label', undefined, 'Nama / Model Unit *')} />
                                        <TextInput
                                            id="name"
                                            className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            autoFocus
                                            placeholder={t('fleet.vehicles.name_placeholder', undefined, 'Contoh: Toyota Avanza 1.5 G MT, Isuzu Giga Dump')}
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="plate_number" value={t('fleet.vehicles.plate_number_label', undefined, 'Nomor Polisi (Plat Nomor) *')} />
                                        <TextInput
                                            id="plate_number"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                            value={data.plate_number}
                                            onChange={(e) => setData('plate_number', e.target.value.toUpperCase())}
                                            required
                                            placeholder={t('fleet.vehicles.plate_number_placeholder', undefined, 'B 1234 XYZ')}
                                        />
                                        <InputError message={errors.plate_number} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="brand" value={t('fleet.vehicles.brand_label', undefined, 'Merk / Pabrikan (Brand)')} />
                                        <TextInput
                                            id="brand"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.brand}
                                            onChange={(e) => setData('brand', e.target.value)}
                                            placeholder={t('fleet.vehicles.brand_placeholder', undefined, 'Toyota, Daihatsu, Mitsubishi, Hino, Isuzu...')}
                                        />
                                        <InputError message={errors.brand} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="rental_class" value={t('fleet.vehicles.rental_class_label', undefined, 'Klasifikasi / Kelas Rental')} />
                                        <Select
                                            id="rental_class"
                                            className="mt-1.5"
                                            value={data.rental_class}
                                            onChange={(value) => setData('rental_class', value)}
                                            options={RENTAL_CLASSES.map((rc) => ({
                                                value: rc.value,
                                                label: rc.value === ''
                                                    ? t('fleet.vehicles.rental_class_none', undefined, rc.label)
                                                    : (rc.value === 'economy'
                                                        ? `${t('fleet.rental_class.economy', undefined, 'Economy')} (City Car)`
                                                        : rc.value === 'mpv'
                                                            ? `${t('fleet.rental_class.mpv', undefined, 'MPV')} (Keluarga)`
                                                            : rc.value === 'suv'
                                                                ? `${t('fleet.rental_class.suv', undefined, 'SUV')} (Tangguh / Offroad)`
                                                                : rc.value === 'van'
                                                                    ? `${t('fleet.rental_class.van', undefined, 'Van')} / Minibus VIP`
                                                                    : rc.value === 'premium'
                                                                        ? `${t('fleet.rental_class.premium', undefined, 'Premium')} / Luxury VIP`
                                                                        : t('fleet.rental_class.other', undefined, rc.label)),
                                            }))}
                                        />
                                        <InputError message={errors.rental_class} className="mt-1" />
                                    </div>
                                </div>

                                {/* Vehicle Type Selector Cards */}
                                <div>
                                    <InputLabel value={t('fleet.vehicles.type_label', undefined, 'Tipe Kendaraan *')} />
                                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                        {VEHICLE_TYPES.map((vt) => {
                                            const active = data.type === vt.key;
                                            const localizedLabel = t(`fleet.vehicles.types.${vt.key}`, undefined, vt.label);
                                            const localizedHint = t(`fleet.vehicles.type_hints.${vt.key}`, undefined, vt.desc);

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
                                                        <span>{localizedLabel}</span>
                                                    </div>
                                                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {localizedHint}
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
                                        {t('fleet.vehicles.section2_num', undefined, '2')}
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.vehicles.section2_title', undefined, 'Spesifikasi Fisik & Daya Tampung')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.vehicles.section2_desc', undefined, 'Tahun perakitan, warna fisik, kapasitas kursi penumpang, dan kapasitas angkut muatan barang.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <InputLabel htmlFor="model_year" value={t('fleet.vehicles.model_year_label', undefined, 'Tahun Pembuatan (Model Year)')} />
                                        <TextInput
                                            id="model_year"
                                            type="number"
                                            min={1990}
                                            max={2030}
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                            value={data.model_year}
                                            onChange={(e) => setData('model_year', e.target.value)}
                                            placeholder={t('fleet.vehicles.model_year_placeholder', undefined, '2023')}
                                        />
                                        <InputError message={errors.model_year} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="color" value={t('fleet.vehicles.color_label', undefined, 'Warna Kendaraan')} />
                                        <TextInput
                                            id="color"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            placeholder={t('fleet.vehicles.color_placeholder', undefined, 'Putih Metalik, Hitam, Silver...')}
                                        />
                                        <InputError message={errors.color} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="capacity_seats" value={t('fleet.vehicles.capacity_seats_label', undefined, 'Kapasitas Tempat Duduk (Kursi)')} />
                                        <TextInput
                                            id="capacity_seats"
                                            type="number"
                                            min={1}
                                            max={100}
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                            value={data.capacity_seats}
                                            onChange={(e) => setData('capacity_seats', e.target.value)}
                                            placeholder={t('fleet.vehicles.capacity_seats_placeholder', undefined, 'Contoh: 7')}
                                        />
                                        <InputError message={errors.capacity_seats} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="capacity_kg" value={t('fleet.vehicles.capacity_kg_label', undefined, 'Kapasitas Muatan Berat (KG)')} />
                                        <TextInput
                                            id="capacity_kg"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                            value={data.capacity_kg}
                                            onChange={(e) => setData('capacity_kg', e.target.value)}
                                            placeholder={t('fleet.vehicles.capacity_kg_placeholder', undefined, 'Contoh: 1500')}
                                        />
                                        <InputError message={errors.capacity_kg} className="mt-1" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="capacity" value={t('fleet.vehicles.capacity_text_label', undefined, 'Label Ringkasan Kapasitas (Teks Bebas)')} />
                                        <TextInput
                                            id="capacity"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.capacity}
                                            onChange={(e) => setData('capacity', e.target.value)}
                                            placeholder={t('fleet.vehicles.capacity_text_placeholder', undefined, 'Contoh: 7 Kursi Penumpang + Bagasi Luas')}
                                        />
                                        <InputError message={errors.capacity} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                    {/* 3. Bahan Bakar & Odometer */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                {t('fleet.vehicles.section3_num', undefined, '3')}
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {t('fleet.vehicles.section3_title', undefined, 'Bahan Bakar, Efisiensi & Odometer')}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {t('fleet.vehicles.section3_desc', undefined, 'Jenis bahan bakar, kapasitas tangki, estimasi konsumsi BBM, dan catatan kilometer odometer.')}
                                </p>
                            </div>
                        </div>

                        {/* Fuel Type Chips */}
                        <div>
                            <InputLabel value={t('fleet.vehicles.fuel_type_label', undefined, 'Jenis Bahan Bakar *')} />
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
                                        {ft.key === 'petrol'
                                            ? `⛽ ${t('fleet.vehicles.fuel_types.petrol', undefined, 'Bensin (Petrol)')}`
                                            : ft.key === 'diesel'
                                                ? `🛢️ ${t('fleet.vehicles.fuel_types.diesel', undefined, 'Solar (Diesel)')}`
                                                : ft.key === 'electric'
                                                    ? `⚡ ${t('fleet.vehicles.fuel_types.electric', undefined, 'Listrik (EV)')}`
                                                    : `🔋 ${t('fleet.vehicles.fuel_types.hybrid', undefined, 'Hybrid')}`}
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.fuel_type} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="tank_capacity_liters" value={t('fleet.vehicles.tank_capacity_label', undefined, 'Kapasitas Tangki (Liter)')} />
                                <TextInput
                                    id="tank_capacity_liters"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.tank_capacity_liters}
                                    onChange={(e) => setData('tank_capacity_liters', e.target.value)}
                                    placeholder={t('fleet.vehicles.tank_capacity_placeholder', undefined, 'Contoh: 45')}
                                />
                                <InputError message={errors.tank_capacity_liters} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="expected_km_per_liter" value={t('fleet.vehicles.expected_kml_label', undefined, 'Target Konsumsi BBM (KM / Liter)')} />
                                <TextInput
                                    id="expected_km_per_liter"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.expected_km_per_liter}
                                    onChange={(e) => setData('expected_km_per_liter', e.target.value)}
                                    placeholder={t('fleet.vehicles.expected_kml_placeholder', undefined, 'Contoh: 12.5')}
                                />
                                <InputError message={errors.expected_km_per_liter} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="cost_per_km" value={t('fleet.vehicles.cost_per_km_label', undefined, 'Estimasi Biaya Operasional / KM (Rp)')} />
                                <TextInput
                                    id="cost_per_km"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-bold"
                                    value={data.cost_per_km}
                                    onChange={(e) => setData('cost_per_km', e.target.value)}
                                    placeholder={t('fleet.vehicles.cost_per_km_placeholder', undefined, 'Contoh: 1800')}
                                />
                                <InputError message={errors.cost_per_km} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="odometer_km" value={t('fleet.vehicles.odometer_label', undefined, 'Odometer Saat Ini (KM) *')} />
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
                                {t('fleet.vehicles.section4_num', undefined, '4')}
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {t('fleet.vehicles.section4_title', undefined, 'Penugasan Home Base Pool & Status Operasional')}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {t('fleet.vehicles.section4_desc', undefined, 'Tentukan titik pangkalan pool tempat unit diparkir dan status kesiapan operasionalnya.')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="home_base_id" value={t('fleet.vehicles.home_base_label', undefined, 'Home Base / Pangkalan Pool')} />
                                <Select
                                    id="home_base_id"
                                    className="mt-1.5"
                                    value={data.home_base_id}
                                    onChange={(value) => setData('home_base_id', value)}
                                    placeholder={t('fleet.vehicles.home_base_placeholder', undefined, 'Pilih Home Base Pool Kendaraan')}
                                    options={[
                                        { value: '', label: t('fleet.vehicles.home_base_none', undefined, 'Tanpa Home Base Khusus') },
                                        ...bases.map((base) => ({
                                            value: String(base.id),
                                            label: `🏢 ${base.name} (${base.code})`,
                                        })),
                                    ]}
                                />
                                <InputError message={errors.home_base_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value={t('fleet.vehicles.status_label', undefined, 'Status Kesiapan Operasional *')} />
                                <Select
                                    id="status"
                                    className="mt-1.5"
                                    value={data.status}
                                    onChange={(value) => setData('status', value)}
                                    options={[
                                        { value: 'active', label: t('fleet.vehicles.status_opt_active', undefined, '✓ Siap Operasi (Aktif)') },
                                        { value: 'maintenance', label: t('fleet.vehicles.status_opt_maintenance', undefined, '🛠️ Dalam Perawatan (Servis)') },
                                        { value: 'out_of_service', label: t('fleet.vehicles.status_opt_out_of_service', undefined, '✕ Rusak / Non-Aktif') },
                                        { value: 'retired', label: t('fleet.vehicles.status_opt_retired', undefined, '⏸ Purna Tugas / Dijual') },
                                    ]}
                                />
                                <InputError message={errors.status} className="mt-1" />
                                {data.status === 'active' && is_trial_mode && (
                                    <div className="mt-2.5 rounded-2xl bg-cyan-50/70 p-3 text-xs border border-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200">
                                        <div className="flex items-center gap-2">
                                            <span>
                                                🎁 {t('fleet.vehicles.trial_active_notice', { days: trial_duration_days }, `Unit baru akan langsung aktif dengan masa uji coba Free Trial ${trial_duration_days} Hari.`)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {data.status === 'active' && !is_trial_mode && (
                                    <div className="mt-2.5 rounded-2xl bg-indigo-50/70 p-3 text-xs border border-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center justify-between">
                                            <span>
                                                🚗 {t('fleet.vehicles.credit_active_notice', { days: trial_duration_days }, `Mendaftarkan unit aktif akan menggunakan 1 Kredit Unit (${trial_duration_days} hari masa aktif).`)}
                                            </span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {t('fleet.vehicles.credit_balance', { count: available_credits }, `Saldo: ${available_credits} Unit`)}
                                            </span>
                                        </div>
                                        {available_credits === 0 && (
                                            <p className="mt-1 text-rose-500 font-semibold text-[11px]">
                                                ⚠️ {t('fleet.vehicles.credit_zero_warning', undefined, 'Saldo kredit unit Anda 0. Simpan unit sebagai Non-Aktif atau hubungi admin central untuk top-up.')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 5. Kepatuhan Dokumen & Catatan */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                {t('fleet.vehicles.section5_num', undefined, '5')}
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {t('fleet.vehicles.section5_title', undefined, 'Kepatuhan Pajak, Uji KIR & Catatan Unit')}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {t('fleet.vehicles.section5_desc', undefined, 'Catat tanggal jatuh tempo STNK dan uji berkala KIR agar sistem dapat memberikan peringatan dini.')}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="stnk_expires_at" value={t('fleet.vehicles.stnk_expires_label', undefined, 'Masa Berlaku STNK / Pajak')} />
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
                                <InputLabel htmlFor="kir_expires_at" value={t('fleet.vehicles.kir_expires_label', undefined, 'Masa Berlaku Uji KIR (Opsional)')} />
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
                                <InputLabel htmlFor="notes" value={t('fleet.vehicles.notes_label', undefined, 'Catatan Khusus Unit Kendaraan')} />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder={t('fleet.vehicles.notes_placeholder', undefined, 'Catatan kondisi velg, riwayat baret, perlengkapan dongkrak, atau modifikasi khusus...')}
                                />
                                <InputError message={errors.notes} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* 6. Skema Tarif Sewa (Opsi A - Inline Smart Rate Section) */}
                    {rental_module_enabled && (
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    {t('fleet.vehicles.section6_num', undefined, '6')}
                                </span>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {t('fleet.vehicles.section6_title', undefined, 'Pemeriksaan & Skema Tarif Sewa')}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {t('fleet.vehicles.section6_desc', undefined, 'Memastikan armada memiliki tarif sewa yang valid agar langsung siap dibooking pada katalog rental.')}
                                    </p>
                                </div>
                            </div>

                            {rateCoverageStatus.isCovered ? (
                                <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1 pt-0.5">
                                            <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                                                {t('fleet.vehicles.rate_covered_title', { source: rateCoverageStatus.source }, `Tarif Sewa Sudah Tersedia (${rateCoverageStatus.source})`)}
                                            </h4>
                                            <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">
                                                {rateCoverageStatus.sample ? (
                                                    <span>
                                                        {t('fleet.vehicles.rate_covered_desc', { sample: '' }, 'Unit kendaraan ini otomatis menggunakan skema tarif aktif yang sudah terdaftar')}
                                                        {' '}: <strong className="font-semibold text-emerald-950 dark:text-emerald-100">{rateCoverageStatus.sample.name}</strong> (Rp {Number(rateCoverageStatus.sample.rate_per_period).toLocaleString('id-ID')} / {rateCoverageStatus.sample.period_type === 'daily' ? 'Hari' : rateCoverageStatus.sample.period_type}). {t('fleet.vehicles.rate_covered_desc_no_sample', undefined, 'Anda tidak wajib membuat tarif baru.')}
                                                    </span>
                                                ) : (
                                                    t('fleet.vehicles.rate_covered_desc_no_sample', undefined, 'Unit kendaraan ini otomatis menggunakan skema tarif aktif yang sudah terdaftar. Anda tidak wajib membuat tarif baru.')
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                                </svg>
                                            </div>
                                            <div className="space-y-1 pt-0.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                                        {t('fleet.vehicles.rate_uncovered_title', undefined, 'Belum Ada Tarif Sewa untuk Kelas / Tipe Kendaraan Ini')}
                                                    </h4>
                                                    <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                                                        {t('fleet.vehicles.rate_uncovered_badge', undefined, 'Wajib Diisi')}
                                                    </span>
                                                </div>
                                                <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                                                    {t('fleet.vehicles.rate_uncovered_desc', undefined, 'Sistem mendeteksi belum ada skema tarif sewa aktif yang mencakup kendaraan ini. Tentukan harga sewa harian pokok pada formulir di bawah agar kendaraan siap disewakan.')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-form Pembuatan Skema Tarif Langsung */}
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-850/40 space-y-4">
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <InputLabel htmlFor="rate_per_period" value={t('fleet.vehicles.rate_price_label', undefined, 'Harga Sewa Pokok (Rp / Hari) *')} />
                                                <MoneyInput
                                                    id="rate_per_period"
                                                    value={data.rental_rate.rate_per_period}
                                                    onChange={(val) => setData('rental_rate', { ...data.rental_rate, rate_per_period: val })}
                                                    className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                                    placeholder={t('fleet.vehicles.rate_price_placeholder', undefined, 'Contoh: 450.000')}
                                                />
                                                <InputError message={(errors as any)['rental_rate.rate_per_period']} className="mt-1" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="rate_deposit" value={t('fleet.vehicles.rate_deposit_label', undefined, 'Uang Jaminan / Deposit (Opsional)')} />
                                                <MoneyInput
                                                    id="rate_deposit"
                                                    value={data.rental_rate.deposit_amount}
                                                    onChange={(val) => setData('rental_rate', { ...data.rental_rate, deposit_amount: val })}
                                                    className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                                    placeholder="0"
                                                />
                                                <InputError message={(errors as any)['rental_rate.deposit_amount']} className="mt-1" />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <InputLabel htmlFor="rate_name" value={t('fleet.vehicles.rate_name_label', undefined, 'Nama Skema Tarif (Opsional)')} />
                                                <TextInput
                                                    id="rate_name"
                                                    value={data.rental_rate.name}
                                                    onChange={(e) => setData('rental_rate', { ...data.rental_rate, name: e.target.value })}
                                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                                    placeholder={data.rental_class ? `Tarif Kelas ${data.rental_class.toUpperCase()}` : (data.name ? `Tarif ${data.name}` : 'Tarif Sewa Harian')}
                                                />
                                                <p className="mt-1 text-[11px] text-slate-500">
                                                    {t('fleet.vehicles.rate_scope_hint', {
                                                        class: data.rental_class ? data.rental_class.toUpperCase() : (data.type ? data.type.toUpperCase() : 'tersebut'),
                                                    }, `Tarif ini akan otomatis diterapkan untuk semua armada kelas ${data.rental_class ? data.rental_class.toUpperCase() : (data.type ? data.type.toUpperCase() : 'tersebut')}.`)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form Action Panel */}
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <Link
                            href={prefixedRoute('fleet.vehicles.index')}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← {t('fleet.vehicles.cancel_btn', undefined, 'Batal & Kembali')}
                        </Link>

                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                        >
                            {processing ? t('fleet.vehicles.saving_btn', undefined, 'Menyimpan Unit...') : t('fleet.vehicles.save_btn', undefined, 'Simpan Kendaraan Baru')}
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

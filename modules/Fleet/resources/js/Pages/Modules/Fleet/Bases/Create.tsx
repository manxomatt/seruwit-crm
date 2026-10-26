import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import LocationMapPicker from '@/Components/Map/LocationMapPicker';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEventHandler, useCallback, useState } from 'react';
import FleetBaseAiGeneratePanel, { ExtractedBaseData } from '../../../../Components/FleetBaseAiGeneratePanel';
import FleetNav from '../../../../FleetNav';

interface ManagerOption {
    id: number;
    name: string;
    email: string;
}

interface LocationOption {
    id: number;
    code: string;
    name: string;
    city: string | null;
}

interface WarehouseOption {
    id: number;
    name: string;
    kind: string | null;
}

interface Props {
    managers: ManagerOption[];
    kinds: string[];
    locations: LocationOption[];
    warehouses: WarehouseOption[];
    locationLinkEnabled: boolean;
    warehouseLinkEnabled: boolean;
}

const STATUSES = ['active', 'inactive'] as const;

const getKindInfo = (kind: string, t: (key: string, params?: Record<string, string | number>, fallback?: string) => string) => {
    switch (kind) {
        case 'depot':
            return {
                icon: '🏢',
                label: t('fleet.base_kinds.depot', undefined, 'Pool Pusat'),
                desc: t('fleet.bases.kind_hints.depot', undefined, 'Kantor pusat / pangkalan induk operasional armada.'),
            };
        case 'yard':
            return {
                icon: '🅿️',
                label: t('fleet.base_kinds.yard', undefined, 'Pool Parkir / Yard'),
                desc: t('fleet.bases.kind_hints.yard', undefined, 'Area parkir terbuka & tempat penyimpanan unit kendaraan.'),
            };
        case 'satellite':
            return {
                icon: '📍',
                label: t('fleet.base_kinds.satellite', undefined, 'Cabang Satelit'),
                desc: t('fleet.bases.kind_hints.satellite', undefined, 'Pos layanan cabang atau titik drop/pickup unit.'),
            };
        case 'workshop_base':
            return {
                icon: '🛠️',
                label: t('fleet.base_kinds.workshop_base', undefined, 'Base Bengkel'),
                desc: t('fleet.bases.kind_hints.workshop_base', undefined, 'Pangkalan bengkel & pemeliharaan teknis armada.'),
            };
        default:
            return {
                icon: '🏢',
                label: t(`fleet.base_kinds.${kind}`, undefined, kind),
                desc: t(`fleet.bases.kind_hints.${kind}`, undefined, 'Fasilitas pangkalan armada.'),
            };
    }
};

export default function Create({
    managers,
    kinds,
    locations,
    warehouses,
    locationLinkEnabled,
    warehouseLinkEnabled,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        kind: 'depot',
        status: 'active',
        address: '',
        city: '',
        province: '',
        zip: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        opens_at: '08:00',
        closes_at: '17:00',
        timezone: 'Asia/Jakarta',
        vehicle_capacity: '',
        allows_overnight: true as boolean,
        service_radius_km: '',
        manager_id: managers[0] ? String(managers[0].id) : '',
        location_id: '',
        warehouse_id: '',
        notes: '',
        staff_ids: [] as number[],
    });

    const [searchingAddress, setSearchingAddress] = useState(false);
    const [searchAddressFeedback, setSearchAddressFeedback] = useState<string | null>(null);

    const handleApplyAiData = (generated: ExtractedBaseData) => {
        setData((prev) => ({
            ...prev,
            code: generated.code || prev.code,
            name: generated.name || prev.name,
            kind: (generated.kind as any) || prev.kind,
            status: (generated.status as any) || prev.status,
            address: generated.address !== undefined && generated.address !== '' ? generated.address : prev.address,
            city: generated.city !== undefined && generated.city !== '' ? generated.city : prev.city,
            province: generated.province !== undefined && generated.province !== '' ? generated.province : prev.province,
            zip: generated.zip !== undefined && generated.zip !== '' ? generated.zip : prev.zip,
            latitude: generated.latitude !== undefined && generated.latitude !== '' ? String(generated.latitude) : prev.latitude,
            longitude: generated.longitude !== undefined && generated.longitude !== '' ? String(generated.longitude) : prev.longitude,
            phone: generated.phone !== undefined && generated.phone !== '' ? generated.phone : prev.phone,
            email: generated.email !== undefined && generated.email !== '' ? generated.email : prev.email,
            opens_at: generated.opens_at || prev.opens_at,
            closes_at: generated.closes_at || prev.closes_at,
            timezone: (generated.timezone as any) || prev.timezone,
            vehicle_capacity: generated.vehicle_capacity !== null && generated.vehicle_capacity !== undefined ? String(generated.vehicle_capacity) : prev.vehicle_capacity,
            allows_overnight: generated.allows_overnight !== undefined ? generated.allows_overnight : prev.allows_overnight,
            service_radius_km: generated.service_radius_km !== null && generated.service_radius_km !== undefined ? String(generated.service_radius_km) : prev.service_radius_km,
            manager_id: generated.manager_id ? String(generated.manager_id) : prev.manager_id,
            notes: generated.notes ? (prev.notes ? `${prev.notes}\n${generated.notes}` : generated.notes) : prev.notes,
        }));
    };

    const handleSearchAddressOnMap = async () => {
        const query = [data.address, data.city, data.province, data.zip].filter(Boolean).join(', ');
        if (!query.trim()) {
            return;
        }

        setSearchingAddress(true);
        setSearchAddressFeedback(null);

        try {
            const response = await axios.get(prefixedRoute('geocode.forward'), {
                params: { q: query },
            });
            if (response.data && response.data.latitude && response.data.longitude) {
                setData((prev) => ({
                    ...prev,
                    latitude: String(response.data.latitude),
                    longitude: String(response.data.longitude),
                    ...(response.data.city && !prev.city ? { city: response.data.city } : {}),
                    ...(response.data.province && !prev.province ? { province: response.data.province } : {}),
                    ...(response.data.zip && !prev.zip ? { zip: response.data.zip } : {}),
                }));
                setSearchAddressFeedback(t('fleet.bases.geocode_synced', undefined, 'Titik koordinat peta berhasil disinkronkan!'));
                setTimeout(() => setSearchAddressFeedback(null), 4000);
            }
        } catch {
            setSearchAddressFeedback(t('fleet.bases.geocode_not_found', undefined, 'Lokasi tidak ditemukan di geocoder.'));
            setTimeout(() => setSearchAddressFeedback(null), 4000);
        } finally {
            setSearchingAddress(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('fleet.bases.store'), {
            onError: () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
        });
    };

    const handleMapChange = useCallback(
        (next: { latitude: string; longitude: string; address?: string }) => {
            setData((current) => ({
                ...current,
                latitude: next.latitude,
                longitude: next.longitude,
                ...(next.address ? { address: next.address } : {}),
            }));
        },
        [setData],
    );

    const toggleStaff = (userId: number) => {
        if (data.staff_ids.includes(userId)) {
            setData(
                'staff_ids',
                data.staff_ids.filter((id) => id !== userId),
            );
        } else {
            setData('staff_ids', [...data.staff_ids, userId]);
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('fleet.bases.create_title', undefined, 'Tambah Pool & Base Armada Baru')}
                    subtitle={t('fleet.bases.create_subtitle', undefined, 'Buat titik pangkalan baru, pool pusat, cabang satelit, atau workshop pemeliharaan unit armada.')}
                    actions={
                        <Link
                            href={prefixedRoute('fleet.bases.index')}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            {t('fleet.bases.back_to_list', undefined, '← Kembali ke Daftar Pool')}
                        </Link>
                    }
                />
            }
        >
            <Head title={t('fleet.bases.head_create', undefined, 'Tambah Base Baru · Pool Armada')} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {t('fleet.nav.dashboard', undefined, 'Fleet')}
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.bases.index')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {t('fleet.bases.breadcrumb_bases', undefined, 'Pool & Base Armada')}
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                        {t('fleet.bases.breadcrumb_create', undefined, 'Tambah Base Baru')}
                    </span>
                </nav>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
                    {/* Kolom Kiri: Form Utama */}
                    <div className="lg:col-span-8 space-y-6">
                        <form id="fleet-base-create-form" onSubmit={submit} className="space-y-6">
                            {/* 1. Identitas & Jenis Base */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        1
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.bases.section_identity_title', undefined, 'Identitas & Klasifikasi Base Armada')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.bases.section_identity_desc', undefined, 'Tentukan kode unik base, nama pangkalan pool, dan klasifikasi peruntukan fasilitas.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="code" value={t('fleet.bases.code_label', undefined, 'Kode Base (Unik) *')} />
                                        <TextInput
                                            id="code"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            required
                                            autoFocus
                                            placeholder={t('fleet.bases.code_placeholder', undefined, 'Contoh: JKT-CGK-01')}
                                        />
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            {t('fleet.bases.code_hint', undefined, 'Kode unik pengidentifikasi pool di sistem.')}
                                        </p>
                                        <InputError message={errors.code} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="name" value={t('fleet.bases.name_label', undefined, 'Nama Pool / Base *')} />
                                        <TextInput
                                            id="name"
                                            className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder={t('fleet.bases.name_placeholder', undefined, 'Contoh: Pool Pusat Cakung, Pool Bandara Soetta')}
                                        />
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                </div>

                                {/* Kind Selector Cards */}
                                <div>
                                    <InputLabel value={t('fleet.bases.kind_label', undefined, 'Jenis / Peruntukan Base *')} />
                                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        {kinds.map((k) => {
                                            const info = getKindInfo(k, t);
                                            const active = data.kind === k;

                                            return (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    onClick={() => setData('kind', k)}
                                                    className={`flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                                                        active
                                                            ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-850/40'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                                                        <span className="text-base">{info.icon}</span>
                                                        <span>{info.label}</span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {info.desc}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.kind} className="mt-1" />
                                </div>

                                {/* Status Radio / Selector */}
                                <div>
                                    <InputLabel htmlFor="status" value={t('fleet.bases.status_label', undefined, 'Status Operasional Base *')} />
                                    <div className="mt-2 flex gap-3">
                                        {STATUSES.map((st) => (
                                            <button
                                                key={st}
                                                type="button"
                                                onClick={() => setData('status', st)}
                                                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                                                    data.status === st
                                                        ? st === 'active'
                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200'
                                                            : 'border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-400/20 dark:bg-slate-800 dark:text-slate-200'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-400'
                                                }`}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${st === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>
                                                    {st === 'active'
                                                        ? t('fleet.bases.status_active', undefined, 'Operasional Aktif')
                                                        : t('fleet.bases.status_inactive', undefined, 'Non Aktif')}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <InputError message={errors.status} className="mt-1" />
                                </div>
                            </div>

                            {/* 2. Lokasi Geografis & Peta GPS */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-base font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        2
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.bases.section_location_title', undefined, 'Lokasi Geografis & Titik Koordinat Peta')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.bases.section_location_desc', undefined, 'Pilih lokasi pada peta interaktif untuk menentukan koordinat GPS, alamat, kota, dan provinsi.')}
                                        </p>
                                    </div>
                                </div>

                                {/* Interactive Map Picker */}
                                <div className="space-y-2">
                                    <InputLabel value={t('fleet.bases.map_picker_label', undefined, 'Penanda Titik Peta (Klik / Geser Pin untuk Menentukan Koordinat)')} />
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-2xs dark:border-slate-700">
                                        <LocationMapPicker
                                            latitude={data.latitude}
                                            longitude={data.longitude}
                                            onChange={handleMapChange}
                                            height="340px"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="latitude" value={t('fleet.bases.latitude_label', undefined, 'Latitude (GPS)')} />
                                        <TextInput
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono text-xs font-bold shadow-2xs"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            placeholder="-6.20000"
                                        />
                                        <InputError message={errors.latitude} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="longitude" value={t('fleet.bases.longitude_label', undefined, 'Longitude (GPS)')} />
                                        <TextInput
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono text-xs font-bold shadow-2xs"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            placeholder="106.81666"
                                        />
                                        <InputError message={errors.longitude} className="mt-1" />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <InputLabel htmlFor="address" value={t('fleet.bases.address_label', undefined, 'Alamat Lengkap Base')} />
                                            {(data.address || data.city) && (
                                                <button
                                                    type="button"
                                                    onClick={handleSearchAddressOnMap}
                                                    disabled={searchingAddress}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                                                >
                                                    {searchingAddress ? (
                                                        <span>{t('fleet.bases.searching_map', undefined, 'Mencari titik peta...')}</span>
                                                    ) : (
                                                        <>
                                                            <span>{t('fleet.bases.search_map_btn', undefined, '📍 Cari / Sinkronkan ke Peta')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <TextInput
                                            id="address"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder={t('fleet.bases.address_placeholder', undefined, 'Jl. Raya Bekasi KM 24, Cakung...')}
                                        />
                                        {searchAddressFeedback && (
                                            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                {searchAddressFeedback}
                                            </p>
                                        )}
                                        <InputError message={errors.address} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="city" value={t('fleet.bases.city_label', undefined, 'Kota / Kabupaten')} />
                                        <TextInput
                                            id="city"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder={t('fleet.bases.city_placeholder', undefined, 'Jakarta Timur')}
                                        />
                                        <InputError message={errors.city} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="province" value={t('fleet.bases.province_label', undefined, 'Provinsi')} />
                                        <TextInput
                                            id="province"
                                            className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                            value={data.province}
                                            onChange={(e) => setData('province', e.target.value)}
                                            placeholder={t('fleet.bases.province_placeholder', undefined, 'DKI Jakarta')}
                                        />
                                        <InputError message={errors.province} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="zip" value={t('fleet.bases.zip_label', undefined, 'Kode Pos')} />
                                        <TextInput
                                            id="zip"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-medium"
                                            value={data.zip}
                                            onChange={(e) => setData('zip', e.target.value)}
                                            placeholder={t('fleet.bases.zip_placeholder', undefined, '13910')}
                                        />
                                        <InputError message={errors.zip} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Ketentuan Operasional & Kapasitas */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-base font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                        3
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.bases.section_operations_title', undefined, 'Ketentuan Operasional & Kapasitas Armada')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.bases.section_operations_desc', undefined, 'Kontak pangkalan, jadwal jam buka-tutup, batas kapasitas kendaraan terparkir, dan radius layanan.')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        <InputLabel htmlFor="phone" value={t('fleet.bases.phone_label', undefined, 'Nomor Telepon Base')} />
                                        <TextInput
                                            id="phone"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono font-medium shadow-2xs"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder={t('fleet.bases.phone_placeholder', undefined, '021-12345678')}
                                        />
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="email" value={t('fleet.bases.email_label', undefined, 'Alamat Email Base')} />
                                        <TextInput
                                            id="email"
                                            type="email"
                                            className="mt-1.5 block w-full !rounded-2xl font-medium shadow-2xs"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder={t('fleet.bases.email_placeholder', undefined, 'pool.cakung@seruwit.com')}
                                        />
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="timezone" value={t('fleet.bases.timezone_label', undefined, 'Zona Waktu *')} />
                                        <Select
                                            id="timezone"
                                            className="mt-1.5"
                                            value={data.timezone}
                                            onChange={(value) => setData('timezone', value)}
                                            options={[
                                                { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB · UTC+7)' },
                                                { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA · UTC+8)' },
                                                { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT · UTC+9)' },
                                            ]}
                                        />
                                        <InputError message={errors.timezone} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="opens_at" value={t('fleet.bases.opens_at_label', undefined, 'Jam Buka Operasional')} />
                                        <TextInput
                                            id="opens_at"
                                            type="time"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                            value={data.opens_at}
                                            onChange={(e) => setData('opens_at', e.target.value)}
                                        />
                                        <InputError message={errors.opens_at} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="closes_at" value={t('fleet.bases.closes_at_label', undefined, 'Jam Tutup Operasional')} />
                                        <TextInput
                                            id="closes_at"
                                            type="time"
                                            className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                            value={data.closes_at}
                                            onChange={(e) => setData('closes_at', e.target.value)}
                                        />
                                        <InputError message={errors.closes_at} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="vehicle_capacity" value={t('fleet.bases.vehicle_capacity_label', undefined, 'Kapasitas Unit Kendaraan')} />
                                        <TextInput
                                            id="vehicle_capacity"
                                            type="number"
                                            min={1}
                                            className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                            value={data.vehicle_capacity}
                                            onChange={(e) => setData('vehicle_capacity', e.target.value)}
                                            placeholder={t('fleet.bases.vehicle_capacity_placeholder', undefined, 'Contoh: 30')}
                                        />
                                        <InputError message={errors.vehicle_capacity} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="service_radius_km" value={t('fleet.bases.service_radius_label', undefined, 'Radius Layanan Antar/Jemput (KM)')} />
                                        <TextInput
                                            id="service_radius_km"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                            value={data.service_radius_km}
                                            onChange={(e) => setData('service_radius_km', e.target.value)}
                                            placeholder={t('fleet.bases.service_radius_placeholder', undefined, 'Contoh: 25')}
                                        />
                                        <InputError message={errors.service_radius_km} className="mt-1" />
                                    </div>
                                </div>

                                {/* Overnight Storage Toggle Card */}
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-850/60">
                                    <label className="flex cursor-pointer items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {t('fleet.bases.allows_overnight_title', undefined, 'Izin Parkir Menginap (Overnight Storage 24h)')}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {t('fleet.bases.allows_overnight_desc', undefined, 'Aktifkan jika base ini mengizinkan armada diparkir semalam / fasilitas buka 24 jam dengan penjagaan.')}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.allows_overnight}
                                            onChange={(e) => setData('allows_overnight', e.target.checked)}
                                            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* 4. Tim Manajemen & Staf Operasional */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-base font-black text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                        4
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.bases.section_team_title', undefined, 'Tim Manajemen & Penugasan Staf Pool')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.bases.section_team_desc', undefined, 'Tentukan manajer penanggung jawab utama dan staf operasional yang berwenang di base ini.')}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="manager_id" value={t('fleet.bases.manager_label', undefined, 'Manajer / Penanggung Jawab Utama *')} />
                                    <Select
                                        id="manager_id"
                                        className="mt-1.5"
                                        value={data.manager_id}
                                        onChange={(value) => setData('manager_id', value)}
                                        options={managers.map((manager) => ({
                                            value: String(manager.id),
                                            label: `👑 ${manager.name} (${manager.email})`,
                                        }))}
                                    />
                                    <InputError message={errors.manager_id} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel value={t('fleet.bases.staff_label', undefined, 'Staf Operasional yang Diberikan Hak Akses di Base Ini')} />
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {t('fleet.bases.staff_desc', undefined, 'Centang user yang bertugas di lokasi pool ini.')}
                                    </p>

                                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 max-h-[260px] overflow-y-auto p-1">
                                        {managers.map((manager) => {
                                            const isManager = String(manager.id) === data.manager_id;
                                            const checked = data.staff_ids.includes(manager.id) || isManager;

                                            return (
                                                <label
                                                    key={manager.id}
                                                    className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3 text-xs transition ${
                                                        isManager
                                                            ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/40'
                                                            : checked
                                                                ? 'border-slate-300 bg-white shadow-2xs dark:border-slate-700 dark:bg-slate-800'
                                                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-850/40'
                                                    }`}
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="font-bold text-slate-900 dark:text-white truncate">{manager.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{manager.email}</p>
                                                        {isManager && (
                                                            <span className="mt-0.5 inline-block text-[10px] font-black text-indigo-700 dark:text-indigo-300">
                                                                {t('fleet.bases.manager_badge', undefined, '👑 Manajer Utama')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={isManager}
                                                        onChange={() => toggleStaff(manager.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.staff_ids} className="mt-1" />
                                </div>
                            </div>

                            {/* 5. Integrasi Lokasi, Gudang & Catatan */}
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-base font-black text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                                        5
                                    </span>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                            {t('fleet.bases.section_integrations_title', undefined, 'Integrasi Mitra, Gudang & Catatan Tambahan')}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {t('fleet.bases.section_integrations_desc', undefined, 'Hubungkan base ini dengan data lokasi mitra rekanan, gudang persediaan, dan SOP internal.')}
                                        </p>
                                    </div>
                                </div>

                                {(locationLinkEnabled || warehouseLinkEnabled) && (
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        {locationLinkEnabled && (
                                            <div>
                                                <InputLabel htmlFor="location_id" value={t('fleet.bases.partner_location_label', undefined, 'Integrasi Lokasi Mitra / Partner')} />
                                                <Select
                                                    id="location_id"
                                                    className="mt-1.5"
                                                    value={data.location_id}
                                                    onChange={(value) => setData('location_id', value)}
                                                    placeholder={t('fleet.bases.partner_location_none', undefined, 'Tanpa Tautan Lokasi Mitra')}
                                                    options={[
                                                        { value: '', label: t('fleet.bases.partner_location_none', undefined, 'Tanpa Tautan Lokasi Mitra') },
                                                        ...locations.map((location) => ({
                                                            value: String(location.id),
                                                            label: `${location.code} — ${location.name}`,
                                                        })),
                                                    ]}
                                                />
                                                <InputError message={errors.location_id} className="mt-1" />
                                            </div>
                                        )}

                                        {warehouseLinkEnabled && (
                                            <div>
                                                <InputLabel htmlFor="warehouse_id" value={t('fleet.bases.warehouse_label', undefined, 'Integrasi Gudang Persediaan (Inventory)')} />
                                                <Select
                                                    id="warehouse_id"
                                                    className="mt-1.5"
                                                    value={data.warehouse_id}
                                                    onChange={(value) => setData('warehouse_id', value)}
                                                    placeholder={t('fleet.bases.warehouse_none', undefined, 'Tanpa Tautan Gudang Logistik')}
                                                    options={[
                                                        { value: '', label: t('fleet.bases.warehouse_none', undefined, 'Tanpa Tautan Gudang Logistik') },
                                                        ...warehouses.map((warehouse) => ({
                                                            value: String(warehouse.id),
                                                            label: warehouse.name,
                                                        })),
                                                    ]}
                                                />
                                                <InputError message={errors.warehouse_id} className="mt-1" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <InputLabel htmlFor="notes" value={t('fleet.bases.notes_label', undefined, 'Catatan Tambahan & SOP Operasional')} />
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder={t('fleet.bases.notes_placeholder', undefined, 'Petunjuk akses masuk gerbang, kontak darurat satpam, aturan parkir...')}
                                    />
                                    <InputError message={errors.notes} className="mt-1" />
                                </div>
                            </div>

                            {/* Form Action Panel */}
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <Link
                                    href={prefixedRoute('fleet.bases.index')}
                                    className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    {t('fleet.bases.cancel', undefined, '← Batal & Kembali')}
                                </Link>

                                <PrimaryButton
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                                >
                                    {processing
                                        ? t('fleet.bases.submit_create_processing', undefined, 'Menyimpan...')
                                        : t('fleet.bases.submit_create', undefined, 'Simpan Base Baru')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Kolom Kanan: Panel AI Asisten (Sticky) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                        <FleetBaseAiGeneratePanel managers={managers} onApply={handleApplyAiData} />
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

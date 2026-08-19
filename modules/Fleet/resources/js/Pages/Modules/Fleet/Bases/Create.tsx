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
import { FormEventHandler, useCallback } from 'react';
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

const getKindInfo = (kind: string) => {
    switch (kind) {
        case 'depot':
            return {
                icon: '🏢',
                label: 'Depot Utama',
                desc: 'Kantor pusat / pangkalan induk operasional armada.',
            };
        case 'yard':
            return {
                icon: '🅿️',
                label: 'Yard / Pool Parkir',
                desc: 'Area parkir terbuka & tempat penyimpanan unit kendaraan.',
            };
        case 'satellite':
            return {
                icon: '📍',
                label: 'Cabang Satelit',
                desc: 'Pos layanan cabang atau titik drop/pickup unit.',
            };
        case 'workshop_base':
            return {
                icon: '🛠️',
                label: 'Workshop Base',
                desc: 'Pangkalan bengkel & pemeliharaan teknis armada.',
            };
        default:
            return {
                icon: '🏢',
                label: kind,
                desc: 'Fasilitas pangkalan armada.',
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
                    title="Tambah Pool & Base Armada Baru"
                    subtitle="Buat titik pangkalan baru, depot utama, cabang satelit, atau workshop pemeliharaan unit armada."
                    actions={
                        <Link
                            href={prefixedRoute('fleet.bases.index')}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            ← Kembali ke Daftar Pool
                        </Link>
                    }
                />
            }
        >
            <Head title="Tambah Base Baru · Pool Armada" />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-12">
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('fleet.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        Fleet
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('fleet.bases.index')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        Pool & Base Armada
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Tambah Base Baru</span>
                </nav>

                <form id="fleet-base-create-form" onSubmit={submit} className="space-y-6">
                    {/* 1. Identitas & Jenis Base */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 text-base font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                1
                            </span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Identitas & Klasifikasi Base Armada
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tentukan kode unik base, nama pangkalan pool, dan klasifikasi peruntukan fasilitas.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="code" value="Kode Base (Unik) *" />
                                <TextInput
                                    id="code"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    required
                                    autoFocus
                                    placeholder="Contoh: JKT-CGK-01"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">Kode unik pengidentifikasi pool di sistem.</p>
                                <InputError message={errors.code} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="name" value="Nama Pool / Base *" />
                                <TextInput
                                    id="name"
                                    className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="Contoh: Depot Utama Cakung, Pool Bandara Soetta"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>
                        </div>

                        {/* Kind Selector Cards */}
                        <div>
                            <InputLabel value="Jenis / Peruntukan Base *" />
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {kinds.map((k) => {
                                    const info = getKindInfo(k);
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
                            <InputLabel htmlFor="status" value="Status Operasional Base *" />
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
                                        <span>{st === 'active' ? 'Operasional Aktif' : 'Non Aktif'}</span>
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
                                    Lokasi Geografis & Titik Koordinat Peta
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Pilih lokasi pada peta interaktif untuk menentukan koordinat GPS, alamat, kota, dan provinsi.
                                </p>
                            </div>
                        </div>

                        {/* Interactive Map Picker */}
                        <div className="space-y-2">
                            <InputLabel value="Penanda Titik Peta (Klik / Geser Pin untuk Menentukan Koordinat)" />
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
                                <InputLabel htmlFor="latitude" value="Latitude (GPS)" />
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
                                <InputLabel htmlFor="longitude" value="Longitude (GPS)" />
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
                                <InputLabel htmlFor="address" value="Alamat Lengkap Base" />
                                <TextInput
                                    id="address"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Jl. Raya Bekasi KM 24, Cakung..."
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="city" value="Kota / Kabupaten" />
                                <TextInput
                                    id="city"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="Jakarta Timur"
                                />
                                <InputError message={errors.city} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="province" value="Provinsi" />
                                <TextInput
                                    id="province"
                                    className="mt-1.5 block w-full !rounded-2xl shadow-2xs font-medium"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                    placeholder="DKI Jakarta"
                                />
                                <InputError message={errors.province} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="zip" value="Kode Pos" />
                                <TextInput
                                    id="zip"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs font-medium"
                                    value={data.zip}
                                    onChange={(e) => setData('zip', e.target.value)}
                                    placeholder="13910"
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
                                    Ketentuan Operasional & Kapasitas Armada
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Kontak pangkalan, jadwal jam buka-tutup, batas kapasitas kendaraan terparkir, dan radius layanan.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="phone" value="Nomor Telepon Base" />
                                <TextInput
                                    id="phone"
                                    className="mt-1.5 block w-full !rounded-2xl font-mono font-medium shadow-2xs"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="021-12345678"
                                />
                                <InputError message={errors.phone} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Alamat Email Base" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1.5 block w-full !rounded-2xl font-medium shadow-2xs"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="pool.cakung@seruwit.com"
                                />
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="timezone" value="Zona Waktu *" />
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
                                <InputLabel htmlFor="opens_at" value="Jam Buka Operasional" />
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
                                <InputLabel htmlFor="closes_at" value="Jam Tutup Operasional" />
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
                                <InputLabel htmlFor="vehicle_capacity" value="Kapasitas Parkir Unit (Slot)" />
                                <TextInput
                                    id="vehicle_capacity"
                                    type="number"
                                    min={1}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                    value={data.vehicle_capacity}
                                    onChange={(e) => setData('vehicle_capacity', e.target.value)}
                                    placeholder="Contoh: 30"
                                />
                                <InputError message={errors.vehicle_capacity} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="service_radius_km" value="Radius Layanan Antar/Jemput (KM)" />
                                <TextInput
                                    id="service_radius_km"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono font-bold shadow-2xs"
                                    value={data.service_radius_km}
                                    onChange={(e) => setData('service_radius_km', e.target.value)}
                                    placeholder="Contoh: 25"
                                />
                                <InputError message={errors.service_radius_km} className="mt-1" />
                            </div>
                        </div>

                        {/* Overnight Storage Toggle Card */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-850/60">
                            <label className="flex cursor-pointer items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        Izin Parkir Menginap (Overnight Storage 24h)
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Aktifkan jika base ini mengizinkan armada diparkir semalam / fasilitas buka 24 jam dengan penjagaan.
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
                                    Tim Manajemen & Penugasan Staf Pool
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Tentukan manajer penanggung jawab utama dan staf operasional yang berwenang di base ini.
                                </p>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="manager_id" value="Manajer / Penanggung Jawab Utama *" />
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
                            <InputLabel value="Staf Operasional yang Diberikan Hak Akses di Base Ini" />
                            <p className="mt-0.5 text-xs text-slate-400">Centang user yang bertugas di lokasi pool ini.</p>

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
                                                        👑 Manajer Utama
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
                                    Integrasi Mitra, Gudang & Catatan Tambahan
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Hubungkan base ini dengan data lokasi mitra rekanan, gudang persediaan, dan SOP internal.
                                </p>
                            </div>
                        </div>

                        {(locationLinkEnabled || warehouseLinkEnabled) && (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {locationLinkEnabled && (
                                    <div>
                                        <InputLabel htmlFor="location_id" value="Integrasi Lokasi Mitra / Partner" />
                                        <Select
                                            id="location_id"
                                            className="mt-1.5"
                                            value={data.location_id}
                                            onChange={(value) => setData('location_id', value)}
                                            placeholder="Tanpa Tautan Lokasi Mitra"
                                            options={[
                                                { value: '', label: 'Tanpa Tautan Lokasi Mitra' },
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
                                        <InputLabel htmlFor="warehouse_id" value="Integrasi Gudang Persediaan (Inventory)" />
                                        <Select
                                            id="warehouse_id"
                                            className="mt-1.5"
                                            value={data.warehouse_id}
                                            onChange={(value) => setData('warehouse_id', value)}
                                            placeholder="Tanpa Tautan Gudang Logistik"
                                            options={[
                                                { value: '', label: 'Tanpa Tautan Gudang Logistik' },
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
                            <InputLabel htmlFor="notes" value="Catatan Tambahan & SOP Operasional" />
                            <textarea
                                id="notes"
                                rows={3}
                                className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850/50 dark:text-white"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Petunjuk akses masuk gerbang, kontak darurat satpam, aturan parkir..."
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
                            ← Batal & Kembali
                        </Link>

                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="rounded-2xl px-6 py-2.5 text-xs font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Base Baru'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}

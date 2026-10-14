import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import LeafletMap from '@/Components/Map/LeafletMap';
import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { toLatLng } from '@/utils/geo';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Marker } from 'react-leaflet';
import FleetNav from '../../../../FleetNav';

interface Manager {
    id: number;
    name: string;
    email: string;
}

interface StaffUser {
    id: number;
    name: string;
    email: string;
}

interface VehicleSummary {
    id: number;
    name: string;
    plate_number: string;
    status: string;
}

interface LocationSummary {
    id: number;
    code: string;
    name: string;
    city: string | null;
}

interface WarehouseSummary {
    id: number;
    name: string;
    kind: string | null;
}

interface FleetBase {
    id: number;
    code: string;
    name: string;
    kind: string;
    status: string;
    address: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    phone: string | null;
    email: string | null;
    opens_at: string | null;
    closes_at: string | null;
    timezone: string;
    vehicle_capacity: number | null;
    allows_overnight: boolean;
    service_radius_km: string | number | null;
    notes: string | null;
    manager: Manager | null;
    users: StaffUser[];
    vehicles: VehicleSummary[];
    location?: LocationSummary | null;
    warehouse?: WarehouseSummary | null;
}

interface Props {
    base: FleetBase;
    can: { update: boolean; delete: boolean };
}

const getKindBadge = (kind: string) => {
    switch (kind) {
        case 'depot':
            return {
                icon: '🏢',
                label: 'Depot Utama',
                className: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800',
            };
        case 'yard':
            return {
                icon: '🅿️',
                label: 'Yard / Pool Parkir',
                className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800',
            };
        case 'satellite':
            return {
                icon: '📍',
                label: 'Cabang Satelit',
                className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800',
            };
        case 'workshop_base':
            return {
                icon: '🛠️',
                label: 'Workshop Base',
                className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800',
            };
        default:
            return {
                icon: '🏢',
                label: kind,
                className: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300',
            };
    }
};

const getVehicleStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300';
        case 'maintenance':
            return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-950/60 dark:text-amber-300';
        case 'rented':
        case 'on_rent':
            return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400';
    }
};

const timeValue = (value: string | null | undefined): string => (value || '').toString().slice(0, 5);

const resolveKind = (kind: string | { value?: string } | null | undefined): string => {
    if (!kind) return '';
    if (typeof kind === 'string') return kind;
    return kind.value ?? '';
};

const displayAddress = (base: FleetBase): string => {
    const parts = [base.address, base.city, base.province, base.zip].filter((part) => Boolean(part && String(part).trim() !== ''));
    return parts.length > 0 ? parts.join(', ') : 'Belum ada alamat terdaftar.';
};

export default function Show({ base, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');

    const kind = resolveKind(base.kind);
    const kindInfo = getKindBadge(kind);

    const mapPosition = toLatLng(
        base.latitude != null ? String(base.latitude) : null,
        base.longitude != null ? String(base.longitude) : null,
    );

    const hoursLabel =
        timeValue(base.opens_at) && timeValue(base.closes_at)
            ? `${timeValue(base.opens_at)} – ${timeValue(base.closes_at)}`
            : '24 Jam / Fleksibel';

    const capacityTotal = base.vehicle_capacity || 0;
    const currentVehicles = base.vehicles.length;
    const capacityPercent = capacityTotal > 0 ? Math.min(100, Math.round((currentVehicles / capacityTotal) * 100)) : 0;

    const staffWithoutManager = base.users.filter((user) => user.id !== base.manager?.id);

    const filteredVehicles = useMemo(() => {
        if (!vehicleSearch.trim()) return base.vehicles;
        const q = vehicleSearch.toLowerCase();
        return base.vehicles.filter((v) => v.name.toLowerCase().includes(q) || v.plate_number.toLowerCase().includes(q));
    }, [base.vehicles, vehicleSearch]);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', base.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={base.name}
                    subtitle={`Kode Base: ${base.code} · ${base.city || 'Semua Wilayah'}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={prefixedRoute('fleet.bases.index')}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Kembali ke Daftar Pool
                            </Link>

                            {can.update && (
                                <Link
                                    href={prefixedRoute('fleet.bases.edit', base.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                                >
                                    <span>✏️</span>
                                    <span>{t('common.edit', undefined, 'Edit Base')}</span>
                                </Link>
                            )}

                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                    <span>🗑️</span>
                                    <span>{t('common.delete', undefined, 'Hapus')}</span>
                                </button>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={`${base.code} · ${base.name}`} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-20">
                {/* 1. Hero Identity & Capacity Overview Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
                                    {base.code}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold ${kindInfo.className}`}>
                                    <span>{kindInfo.icon}</span>
                                    <span>{kindInfo.label}</span>
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${
                                        base.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${base.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    <span>{base.status === 'active' ? 'Operasional Aktif' : 'Non Aktif'}</span>
                                </span>
                            </div>

                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{base.name}</h1>
                            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                                📍 {displayAddress(base)}
                            </p>
                        </div>

                        {/* Manager Pill Card */}
                        {base.manager && (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-850">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-2xs">
                                    {base.manager.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Penanggung Jawab / Manajer</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{base.manager.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{base.manager.email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4 Metric Cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {/* Vehicle Capacity */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Armada Terparkir</p>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {currentVehicles}
                                </span>
                                {capacityTotal > 0 ? (
                                    <span className="font-mono text-xs font-bold text-slate-400">/ {capacityTotal} Unit</span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400">Unit</span>
                                )}
                            </div>
                            {capacityTotal > 0 && (
                                <div className="mt-2 space-y-1">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                        <div
                                            className={`h-full rounded-full ${capacityPercent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${capacityPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">{capacityPercent}% kapasitas terpakai</p>
                                </div>
                            )}
                        </div>

                        {/* Operational Hours */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Jam Operasional</p>
                            <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{hoursLabel}</p>
                            <p className="mt-1 text-[11px] text-slate-400">Zona: {base.timezone || 'WIB'}</p>
                        </div>

                        {/* Service Radius */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Radius Layanan</p>
                            <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                {base.service_radius_km != null ? `${base.service_radius_km} KM` : 'Tanpa Batas'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">Jangkauan antar/jemput</p>
                        </div>

                        {/* Allows Overnight */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parkir Menginap</p>
                            <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                                {base.allows_overnight ? '✓ Diizinkan (24h)' : '✕ Tidak Diizinkan'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">Overnight storage unit</p>
                        </div>
                    </div>
                </div>

                {/* 2. Main 2-Column Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Details & Assigned Vehicles (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* Operational Details */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">📋</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Informasi Operasional & Kontak Base
                                </h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                <div className="flex justify-between py-3">
                                    <dt className="text-slate-400">Nomor Telepon:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {base.phone ? (
                                            <a href={`tel:${base.phone}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                                                📞 {base.phone}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>

                                <div className="flex justify-between py-3">
                                    <dt className="text-slate-400">Alamat Email:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">
                                        {base.email ? (
                                            <a href={`mailto:${base.email}`} className="text-indigo-600 hover:underline dark:text-indigo-400">
                                                ✉️ {base.email}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>

                                <div className="flex justify-between py-3">
                                    <dt className="text-slate-400">Kapasitas Maksimal Kendaraan:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {base.vehicle_capacity ? `${base.vehicle_capacity} Unit` : 'Tidak Dibatasi'}
                                    </dd>
                                </div>

                                {(base.location || base.warehouse) && (
                                    <>
                                        {base.location && (
                                            <div className="flex justify-between py-3">
                                                <dt className="text-slate-400">Integrasi Lokasi Mitra:</dt>
                                                <dd className="font-bold text-slate-800 dark:text-slate-200">
                                                    🏷️ {base.location.code} — {base.location.name} {base.location.city ? `(${base.location.city})` : ''}
                                                </dd>
                                            </div>
                                        )}
                                        {base.warehouse && (
                                            <div className="flex justify-between py-3">
                                                <dt className="text-slate-400">Integrasi Gudang Logistik:</dt>
                                                <dd className="font-bold text-slate-800 dark:text-slate-200">
                                                    📦 {base.warehouse.name} {base.warehouse.kind ? `(${base.warehouse.kind})` : ''}
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}

                                {base.notes && (
                                    <div className="py-3">
                                        <dt className="text-slate-400 mb-1">Catatan Tambahan:</dt>
                                        <dd className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-700 leading-relaxed dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                                            {base.notes}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Assigned Fleet List */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🚗</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Daftar Armada Terparkir ({base.vehicles.length})
                                        </h3>
                                        <p className="text-xs text-slate-400">Unit kendaraan yang berstatus home base di lokasi ini.</p>
                                    </div>
                                </div>

                                {base.vehicles.length > 3 && (
                                    <div className="relative min-w-[180px]">
                                        <input
                                            type="text"
                                            value={vehicleSearch}
                                            onChange={(e) => setVehicleSearch(e.target.value)}
                                            placeholder="Cari mobil / plat..."
                                            className="w-full rounded-xl border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                                        />
                                        {vehicleSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setVehicleSearch('')}
                                                className="absolute inset-y-0 right-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                {filteredVehicles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <span className="text-3xl mb-2">🚗</span>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {base.vehicles.length === 0 ? 'Belum Ada Armada Ditugaskan' : 'Kendaraan Tidak Ditemukan'}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            {base.vehicles.length === 0 ? 'Atur home base pada modul kendaraan untuk menambahkan armada ke pool ini.' : 'Coba cari dengan plat nomor lain.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {filteredVehicles.map((vehicle) => (
                                            <Link
                                                key={vehicle.id}
                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 shadow-2xs transition hover:border-indigo-200 hover:bg-indigo-50/20 dark:border-slate-800 dark:bg-slate-850"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 dark:text-white truncate">{vehicle.name}</p>
                                                    <p className="font-mono text-xs font-bold text-slate-400">{vehicle.plate_number}</p>
                                                </div>

                                                <span className={`inline-flex items-center rounded-xl px-2 py-0.5 text-[11px] font-bold ${getVehicleStatusBadge(vehicle.status)}`}>
                                                    {t(`fleet.status.${vehicle.status}`, undefined, vehicle.status)}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Map & Staff (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Map Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">📍</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Lokasi Peta Pool</h3>
                                        {mapPosition && (
                                            <p className="font-mono text-[11px] text-slate-400">
                                                {Number(base.latitude).toFixed(5)}, {Number(base.longitude).toFixed(5)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {mapPosition && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${base.latitude},${base.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        Buka Google Maps ↗
                                    </a>
                                )}
                            </div>

                            {mapPosition ? (
                                <div className="h-[280px] w-full">
                                    <LeafletMap center={mapPosition} zoom={15} height="280px" bounds={[mapPosition]}>
                                        <Marker position={mapPosition} />
                                    </LeafletMap>
                                </div>
                            ) : (
                                <div className="flex h-[220px] flex-col items-center justify-center bg-slate-50/70 p-6 text-center text-xs text-slate-400 dark:bg-slate-850">
                                    <span className="text-2xl mb-1">🗺️</span>
                                    <span>Koordinat GPS belum diatur untuk pool ini.</span>
                                </div>
                            )}
                        </div>

                        {/* Staff & Operasional Pool */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">👥</span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Tim & Staf Operasional ({base.users.length})
                                    </h3>
                                    <p className="text-xs text-slate-400">Daftar staf yang memiliki hak akses operasional di base ini.</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {base.manager && (
                                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/30">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                                            👑
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-black text-indigo-950 dark:text-indigo-200 truncate">{base.manager.name}</p>
                                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 truncate">{base.manager.email} · Manajer Base</p>
                                        </div>
                                    </div>
                                )}

                                {staffWithoutManager.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-slate-400">Belum ada staf tambahan yang ditugaskan.</p>
                                ) : (
                                    <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                        {staffWithoutManager.map((user) => (
                                            <div key={user.id} className="flex items-center gap-3 py-2.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                                                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                message={t('fleet.bases.delete_confirm', { name: base.name }, `Apakah Anda yakin ingin menghapus base "${base.name}"?`)}
            />
        </DynamicLayout>
    );
}

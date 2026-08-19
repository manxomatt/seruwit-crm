import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatDate } from '@/utils/date';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, type ReactNode } from 'react';
import FleetNav from '../../../../FleetNav';

interface MaintenanceLog {
    id: number;
    type: string;
    description: string;
    scheduled_date: string;
    completed_date: string | null;
    cost: string | null;
    odometer_km: number | null;
    status: string;
}

interface FuelLog {
    id: number;
    filled_at: string;
    liters: string;
    cost: string;
    odometer_km: number | null;
    distance_since_last_km: number | null;
    km_per_liter: string | number | null;
    liters_per_100km: string | number | null;
    odometer_source: string | null;
    station_name: string | null;
    is_full_tank: boolean;
    anomaly_flags: { code: string; message: string; severity: string }[] | null;
    driver: { id: number; name: string } | null;
}

interface FuelSummary {
    average_km_per_liter: number | null;
    expected_km_per_liter: number | null;
    anomaly_count: number;
    suggested_odometer_km: number;
    suggested_odometer_source: string;
}

interface DocumentSummary {
    total: number;
    expired: number;
    expiring_soon: number;
    nearest_expiry: string | null;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    rental_class?: string | null;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity: string | null;
    capacity_kg?: string | number | null;
    capacity_seats?: number | null;
    cost_per_km?: string | number | null;
    tank_capacity_liters: string | number | null;
    expected_km_per_liter: string | number | null;
    fuel_type: string;
    status: string;
    home_base?: { id: number; code: string; name: string } | null;
    odometer_km: number;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    photo_url: string | null;
    notes: string | null;
    maintenance_logs?: MaintenanceLog[];
    fuel_logs: FuelLog[];
}

interface ServiceHistoryItem {
    id: number;
    reference_number: string;
    title: string;
    status: string;
    type: string;
    category: string | null;
    scheduled_date: string | null;
    completed_at: string | null;
    total_cost: number | null;
    vendor_name: string | null;
    mechanic_name: string | null;
}

interface Props {
    vehicle: Vehicle;
    trackingEnabled?: boolean;
    documentsEnabled?: boolean;
    documentSummary?: DocumentSummary | null;
    maintenanceEnabled?: boolean;
    serviceHistory?: ServiceHistoryItem[] | null;
    fuelSummary: FuelSummary;
    drivers: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
    aiPredictiveEnabled?: boolean;
    aiDiagnoseUrl?: string | null;
    aiCreateWoUrl?: string | null;
}

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active':
            return {
                label: 'Siap Operasi',
                className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                dot: 'bg-emerald-500',
            };
        case 'maintenance':
            return {
                label: 'Perawatan (Servis)',
                className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                dot: 'bg-amber-500',
            };
        case 'out_of_service':
            return {
                label: 'Rusak / Non-Aktif',
                className: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                dot: 'bg-rose-500',
            };
        case 'retired':
            return {
                label: 'Purna Tugas / Dijual',
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                dot: 'bg-slate-400',
            };
        default:
            return {
                label: status,
                className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                dot: 'bg-slate-400',
            };
    }
};

const getVehicleTypeIcon = (type: string) => {
    switch (type) {
        case 'car':
            return '🚗 Mobil';
        case 'van':
            return '🚐 Van';
        case 'truck':
            return '🚚 Truk';
        case 'bus':
            return '🚌 Bus';
        case 'motorcycle':
            return '🏍️ Motor';
        default:
            return `🚗 ${type}`;
    }
};

const TrashIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

function expiryTone(date: string | null): ExpiryTone {
    if (!date) return 'empty';
    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) return 'empty';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'soon';
    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired':
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
        case 'soon':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
        case 'ok':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
        default:
            return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
}

export default function Show({
    vehicle,
    trackingEnabled = false,
    documentsEnabled = false,
    documentSummary = null,
    maintenanceEnabled = false,
    serviceHistory = null,
    fuelSummary,
    drivers,
    can,
    aiPredictiveEnabled = false,
    aiDiagnoseUrl = null,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [aiDiagnosis, setAiDiagnosis] = useState<{
        health_score: number;
        status: string;
        km_per_day_run_rate: number;
        schedule_insights: Array<{ name: string; km_remaining: number; days_to_due: number; is_overdue: boolean }>;
        damages_last_60_days: number;
    } | null>(null);
    const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<
        | { type: 'vehicle' }
        | { type: 'maintenance'; id: number; label: string }
        | { type: 'fuel'; id: number; label: string }
        | null
    >(null);
    const [processing, setProcessing] = useState(false);

    const statusInfo = getStatusBadge(vehicle.status);

    const handleFetchDiagnosis = async () => {
        if (!aiDiagnoseUrl || loadingDiagnosis) return;
        setLoadingDiagnosis(true);
        try {
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const res = await fetch(aiDiagnoseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': meta?.content || '',
                    Accept: 'application/json',
                },
            });
            const data = await res.json();
            if (res.ok && data.success && data.result) {
                setAiDiagnosis(data.result);
            }
        } catch {
            // ignore
        } finally {
            setLoadingDiagnosis(false);
        }
    };

    const maintenanceForm = useForm({
        type: 'scheduled_service',
        description: '',
        scheduled_date: '',
        completed_date: '',
        cost: '',
        odometer_km: '',
        status: 'scheduled',
    });

    const fuelForm = useForm({
        filled_at: new Date().toISOString().slice(0, 10),
        liters: '',
        cost: '',
        odometer_km: String(fuelSummary.suggested_odometer_km || ''),
        odometer_source: fuelSummary.suggested_odometer_source || 'vehicle',
        driver_id: '',
        station_name: '',
        receipt_number: '',
        is_full_tank: true as boolean,
        notes: '',
    });

    const submitMaintenance: FormEventHandler = (e) => {
        e.preventDefault();
        maintenanceForm.post(prefixedRoute('fleet.vehicles.maintenance-logs.store', vehicle.id), {
            onSuccess: () => {
                setShowMaintenanceModal(false);
                maintenanceForm.reset();
            },
        });
    };

    const submitFuel: FormEventHandler = (e) => {
        e.preventDefault();
        fuelForm.post(prefixedRoute('fleet.vehicles.fuel-logs.store', vehicle.id), {
            onSuccess: () => {
                setShowFuelModal(false);
                fuelForm.reset();
            },
        });
    };

    const closeDeleteDialog = (): void => {
        if (!processing) {
            setPendingDelete(null);
        }
    };

    const confirmPendingDelete = (): void => {
        if (!pendingDelete) return;
        setProcessing(true);

        if (pendingDelete.type === 'vehicle') {
            router.delete(prefixedRoute('fleet.vehicles.destroy', vehicle.id), {
                onFinish: () => setProcessing(false),
            });
            return;
        }

        const routeName =
            pendingDelete.type === 'maintenance'
                ? 'fleet.vehicles.maintenance-logs.destroy'
                : 'fleet.vehicles.fuel-logs.destroy';

        router.delete(prefixedRoute(routeName, [vehicle.id, pendingDelete.id]), {
            preserveScroll: true,
            onSuccess: () => setPendingDelete(null),
            onFinish: () => setProcessing(false),
        });
    };

    const deleteConfirmMessage = (): string | undefined => {
        if (!pendingDelete) return undefined;
        if (pendingDelete.type === 'vehicle') {
            return `Apakah Anda yakin ingin menghapus unit kendaraan "${vehicle.name}" (${vehicle.plate_number})?`;
        }
        if (pendingDelete.type === 'maintenance') {
            return `Hapus log maintenance: ${pendingDelete.label}?`;
        }
        return `Hapus log pengisian BBM: ${pendingDelete.label}?`;
    };

    const openFuelModal = (): void => {
        fuelForm.setData({
            ...fuelForm.data,
            filled_at: new Date().toISOString().slice(0, 10),
            odometer_km: String(fuelSummary.suggested_odometer_km || ''),
            odometer_source: fuelSummary.suggested_odometer_source || 'vehicle',
        });
        setShowFuelModal(true);
    };

    const stnkTone = expiryTone(vehicle.stnk_expires_at);
    const kirTone = expiryTone(vehicle.kir_expires_at);

    const expiryLabel = (tone: ExpiryTone): string => {
        if (tone === 'expired') return '⚠️ Telah Lewat Tempo';
        if (tone === 'soon') return '⚡ Jatuh Tempo Segera (≤30 Hari)';
        if (tone === 'ok') return '✓ Masih Berlaku Aktif';
        return '—';
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={`${vehicle.name} (${vehicle.plate_number})`}
                    subtitle={`Tipe: ${getVehicleTypeIcon(vehicle.type)} · Home Base: ${vehicle.home_base?.name || 'Tanpa Home Base'}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={prefixedRoute('fleet.vehicles.index')}
                                className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Kembali ke Daftar Armada
                            </Link>

                            {can.create && (
                                <button
                                    type="button"
                                    onClick={openFuelModal}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-amber-500/20 transition hover:bg-amber-600"
                                >
                                    <span>⛽</span>
                                    <span>Catat BBM</span>
                                </button>
                            )}

                            {maintenanceEnabled ? (
                                <Link
                                    href={`${prefixedRoute('maintenance.work-orders.create')}?vehicle_id=${vehicle.id}`}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-800 px-3.5 py-2 text-xs font-black text-white shadow-md transition hover:bg-slate-900"
                                >
                                    <span>🛠️</span>
                                    <span>Buat Work Order Servis</span>
                                </Link>
                            ) : (
                                can.create && (
                                    <button
                                        type="button"
                                        onClick={() => setShowMaintenanceModal(true)}
                                        className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-800 px-3.5 py-2 text-xs font-black text-white shadow-md transition hover:bg-slate-900"
                                    >
                                        <span>🛠️</span>
                                        <span>Catat Servis</span>
                                    </button>
                                )
                            )}

                            {can.update && (
                                <Link
                                    href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                                >
                                    <span>✏️</span>
                                    <span>Edit Kendaraan</span>
                                </Link>
                            )}

                            {can.delete && (
                                <button
                                    type="button"
                                    onClick={() => setPendingDelete({ type: 'vehicle' })}
                                    className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                                >
                                    <TrashIcon />
                                    <span>Hapus</span>
                                </button>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={`${vehicle.plate_number} · ${vehicle.name}`} />
            <FleetNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-24">
                {/* 1. Hero Identity & Photo Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
                        {/* Vehicle Photo / Thumbnail */}
                        <div className="shrink-0">
                            {vehicle.photo_url ? (
                                <img
                                    src={vehicle.photo_url}
                                    alt={vehicle.name}
                                    className="h-44 w-full rounded-2xl object-cover ring-1 ring-slate-200 shadow-md sm:h-48 sm:w-72 dark:ring-slate-700"
                                />
                            ) : (
                                <div className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center sm:h-48 sm:w-72 dark:border-slate-700 dark:bg-slate-850">
                                    <span className="text-4xl mb-1">🚗</span>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Belum Ada Foto Unit</p>
                                    <p className="text-[10px] text-slate-400">Edit kendaraan untuk mengunggah foto.</p>
                                </div>
                            )}
                        </div>

                        {/* Identity & Main Info */}
                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                                    {vehicle.plate_number}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-black ${statusInfo.className}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                                    <span>{statusInfo.label}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                    {getVehicleTypeIcon(vehicle.type)}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                                    ⛽ {vehicle.fuel_type}
                                </span>
                                {vehicle.rental_class && (
                                    <span className="inline-flex items-center rounded-xl bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                        🏷️ {vehicle.rental_class.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{vehicle.name}</h1>

                            <p className="text-xs text-slate-500">
                                {vehicle.brand || 'Tanpa Merk'} · {vehicle.model_year ? `Tahun ${vehicle.model_year}` : ''}{' '}
                                {vehicle.color ? `· Warna ${vehicle.color}` : ''}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="text-slate-400">Home Base Pool:</span>
                                {vehicle.home_base ? (
                                    <Link
                                        href={prefixedRoute('fleet.bases.show', vehicle.home_base.id)}
                                        className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        🏢 {vehicle.home_base.code} — {vehicle.home_base.name}
                                    </Link>
                                ) : (
                                    <span className="text-slate-400">Belum Ditugaskan ke Pool Khusus</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4 KPI Metrics */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Odometer Terkini</p>
                            <p className="mt-1 font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                {vehicle.odometer_km.toLocaleString()} KM
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">Jarak tempuh akumulatif unit</p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Efisiensi Konsumsi BBM</p>
                            <p className="mt-1 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {fuelSummary.average_km_per_liter != null ? `${fuelSummary.average_km_per_liter} KM/L` : '—'}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                                {fuelSummary.expected_km_per_liter ? `Target: ${fuelSummary.expected_km_per_liter} KM/L` : 'Rata-rata pengisian'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status Pajak STNK</p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-black ${expiryBadgeClass(stnkTone)}`}>
                                    {expiryLabel(stnkTone)}
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">
                                {vehicle.stnk_expires_at ? formatDate(vehicle.stnk_expires_at, localeTag) : 'Belum diatur'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-850">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Log BBM & Servis</p>
                            <p className="mt-1 font-mono text-2xl font-black text-slate-800 dark:text-slate-200">
                                {vehicle.fuel_logs.length} / {serviceHistory?.length ?? vehicle.maintenance_logs?.length ?? 0}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">Pengisian BBM / Riwayat Servis</p>
                        </div>
                    </div>
                </div>

                {/* 2. Main 2-Column Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Specs & Fuel/Maintenance Logs (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* Specifications Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">📋</span>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                    Spesifikasi Fisik & Teknis Kendaraan
                                </h3>
                            </div>

                            <dl className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Pabrikan / Merk:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">{vehicle.brand || '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Tahun Pembuatan:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle.model_year || '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Warna Unit:</dt>
                                    <dd className="font-bold text-slate-800 dark:text-slate-200">{vehicle.color || '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Kapasitas Tempat Duduk (Kursi):</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle.capacity_seats ? `${vehicle.capacity_seats} Penumpang` : '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Kapasitas Muatan (KG):</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle.capacity_kg ? `${vehicle.capacity_kg} KG` : '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Kapasitas Tangki BBM:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle.tank_capacity_liters ? `${vehicle.tank_capacity_liters} Liter` : '—'}</dd>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <dt className="text-slate-400">Target Konsumsi BBM:</dt>
                                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle.expected_km_per_liter ? `${vehicle.expected_km_per_liter} KM / Liter` : '—'}</dd>
                                </div>
                                {vehicle.cost_per_km && (
                                    <div className="flex justify-between py-2.5">
                                        <dt className="text-slate-400">Estimasi Biaya Operasional / KM:</dt>
                                        <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">Rp {Number(vehicle.cost_per_km).toLocaleString()} / km</dd>
                                    </div>
                                )}
                                {vehicle.notes && (
                                    <div className="py-2.5">
                                        <dt className="text-slate-400 mb-1">Catatan Tambahan:</dt>
                                        <dd className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-slate-700 leading-relaxed dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300">
                                            {vehicle.notes}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Maintenance / Service History Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🛠️</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Riwayat Servis & Perawatan Armada
                                        </h3>
                                        <p className="text-xs text-slate-400">Log pemeliharaan berkala, perbaikan mesin, dan ganti oli.</p>
                                    </div>
                                </div>

                                {maintenanceEnabled ? (
                                    <Link
                                        href={`${prefixedRoute('maintenance.work-orders.create')}?vehicle_id=${vehicle.id}`}
                                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
                                    >
                                        Buat Work Order
                                    </Link>
                                ) : (
                                    can.create && (
                                        <button
                                            type="button"
                                            onClick={() => setShowMaintenanceModal(true)}
                                            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
                                        >
                                            ＋ Catat Servis
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="mt-4">
                                {maintenanceEnabled ? (
                                    !serviceHistory || serviceHistory.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-slate-400">Belum ada riwayat work order perawatan untuk unit ini.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                                <thead>
                                                    <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                                        <th className="px-3 py-2 font-bold">No. Ref</th>
                                                        <th className="px-3 py-2 font-bold">Deskripsi Servis</th>
                                                        <th className="px-3 py-2 font-bold">Status</th>
                                                        <th className="px-3 py-2 font-bold">Tanggal</th>
                                                        <th className="px-3 py-2 font-bold">Total Biaya</th>
                                                        <th className="px-3 py-2 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                                    {serviceHistory.map((wo) => (
                                                        <tr key={wo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                {wo.reference_number}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                                                <div>{wo.title}</div>
                                                                {wo.category && <div className="text-[11px] text-slate-400">{wo.category}</div>}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                                                                    {wo.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5 text-slate-500">
                                                                {formatDate(wo.completed_at ?? wo.scheduled_date, localeTag)}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                {wo.total_cost != null ? `Rp ${Number(wo.total_cost).toLocaleString()}` : '—'}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right">
                                                                <Link
                                                                    href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                                    className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                                                >
                                                                    Buka WO →
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                ) : (vehicle.maintenance_logs?.length ?? 0) === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">Belum ada riwayat pemeliharaan tercatat.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                                    <th className="px-3 py-2 font-bold">Jenis Servis</th>
                                                    <th className="px-3 py-2 font-bold">Catatan</th>
                                                    <th className="px-3 py-2 font-bold">Tanggal</th>
                                                    <th className="px-3 py-2 font-bold">Biaya</th>
                                                    <th className="px-3 py-2 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                                {(vehicle.maintenance_logs ?? []).map((log) => (
                                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                                                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 capitalize">
                                                            {log.type.replace('_', ' ')}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{log.description}</td>
                                                        <td className="px-3 py-2.5 text-slate-500">{formatDate(log.scheduled_date, localeTag)}</td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                            {log.cost ? `Rp ${Number(log.cost).toLocaleString()}` : '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            {can.delete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPendingDelete({
                                                                            type: 'maintenance',
                                                                            id: log.id,
                                                                            label: log.description,
                                                                        })
                                                                    }
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fuel Logs Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⛽</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Log Pengisian Bahan Bakar (BBM)
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Rata-rata: {fuelSummary.average_km_per_liter ?? '—'} KM/L · Anomali: {fuelSummary.anomaly_count} kejadian
                                        </p>
                                    </div>
                                </div>

                                {can.create && (
                                    <button
                                        type="button"
                                        onClick={openFuelModal}
                                        className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-amber-600"
                                    >
                                        ＋ Catat BBM
                                    </button>
                                )}
                            </div>

                            <div className="mt-4">
                                {vehicle.fuel_logs.length === 0 ? (
                                    <p className="py-6 text-center text-xs text-slate-400">Belum ada riwayat pengisian BBM untuk unit ini.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs dark:divide-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50/70 text-slate-400 dark:bg-slate-850">
                                                    <th className="px-3 py-2 font-bold">Tanggal</th>
                                                    <th className="px-3 py-2 font-bold">Volume (L)</th>
                                                    <th className="px-3 py-2 font-bold">Biaya (Rp)</th>
                                                    <th className="px-3 py-2 font-bold">Odometer (KM)</th>
                                                    <th className="px-3 py-2 font-bold">KM / L</th>
                                                    <th className="px-3 py-2 font-bold">Anomali</th>
                                                    <th className="px-3 py-2 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800">
                                                {vehicle.fuel_logs.map((log) => (
                                                    <tr key={log.id} className={log.anomaly_flags?.length ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/50'}>
                                                        <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                                                            {formatDate(log.filled_at, localeTag)}
                                                            {log.is_full_tank && (
                                                                <span className="ml-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">(Full)</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{log.liters} L</td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">Rp {Number(log.cost).toLocaleString()}</td>
                                                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                                                            {log.odometer_km ? `${log.odometer_km.toLocaleString()} km` : '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                            {log.km_per_liter ?? '—'}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            {log.anomaly_flags?.length ? (
                                                                <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                    ⚠️ {log.anomaly_flags[0].code.replaceAll('_', ' ')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right">
                                                            {can.delete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPendingDelete({
                                                                            type: 'fuel',
                                                                            id: log.id,
                                                                            label: `${log.liters} L · ${formatDate(log.filled_at, localeTag)}`,
                                                                        })
                                                                    }
                                                                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                                >
                                                                    <TrashIcon />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Compliance, Documents & AI Health (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Compliance Card */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="text-base">📅</span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Kepatuhan Pajak & Uji Berkala
                                    </h3>
                                    <p className="text-xs text-slate-400">Jadwal jatuh tempo legalitas berkendara.</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Masa Berlaku Pajak STNK</span>
                                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${expiryBadgeClass(stnkTone)}`}>
                                            {expiryLabel(stnkTone)}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                        {vehicle.stnk_expires_at ? formatDate(vehicle.stnk_expires_at, localeTag) : 'Belum Diatur'}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-850">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Masa Berlaku Uji KIR</span>
                                        <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black ${expiryBadgeClass(kirTone)}`}>
                                            {expiryLabel(kirTone)}
                                        </span>
                                    </div>
                                    <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">
                                        {vehicle.kir_expires_at ? formatDate(vehicle.kir_expires_at, localeTag) : 'Tidak Wajib / Belum Diatur'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Documents Summary Card */}
                        {documentsEnabled && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📄</span>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Dokumen Unit</h3>
                                    </div>

                                    <Link
                                        href={prefixedRoute('fleet.vehicles.documents.index', vehicle.id)}
                                        className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        Kelola Dokumen →
                                    </Link>
                                </div>

                                <div className="mt-4">
                                    {!documentSummary || documentSummary.total === 0 ? (
                                        <p className="py-4 text-center text-xs text-slate-400">Belum ada file dokumen diunggah.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Total Dokumen</p>
                                                <p className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">{documentSummary.total}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-850">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold">Jatuh Tempo Terdekat</p>
                                                <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{formatDate(documentSummary.nearest_expiry, localeTag)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
                                                <p className="text-[10px] text-rose-500 uppercase font-bold">Expired</p>
                                                <p className="mt-1 font-mono text-xl font-black text-rose-600 dark:text-rose-400">{documentSummary.expired}</p>
                                            </div>
                                            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                                                <p className="text-[10px] text-amber-500 uppercase font-bold">Habis Segera</p>
                                                <p className="mt-1 font-mono text-xl font-black text-amber-600 dark:text-amber-400">{documentSummary.expiring_soon}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI Health Diagnostics Card */}
                        {aiPredictiveEnabled && aiDiagnoseUrl && (
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                                    <span className="text-base">✨</span>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">AI Health Diagnosis</h3>
                                        <p className="text-xs text-slate-400">Prediksi keandalan mesin & laju pemakaian armada.</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {!aiDiagnosis ? (
                                        <div className="text-center py-4">
                                            <button
                                                type="button"
                                                onClick={handleFetchDiagnosis}
                                                disabled={loadingDiagnosis}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900 dark:bg-slate-800 dark:text-indigo-300"
                                            >
                                                {loadingDiagnosis ? (
                                                    <>
                                                        <svg className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                        <span>Mendiagnosis Unit…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>🛡️</span>
                                                        <span>Jalankan Diagnostik AI</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 text-xs">
                                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-850">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Skor Kesehatan</span>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{aiDiagnosis.health_score} / 100</p>
                                                </div>
                                                <span
                                                    className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                                                        aiDiagnosis.status === 'good'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                                            : aiDiagnosis.status === 'warning'
                                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {aiDiagnosis.status === 'good' ? 'Kondisi Prima' : aiDiagnosis.status === 'warning' ? 'Perlu Cek' : 'Kritis'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                                <span>Laju Penambahan KM:</span>
                                                <span className="font-bold font-mono text-slate-900 dark:text-white">{aiDiagnosis.km_per_day_run_rate} KM/hari</span>
                                            </div>

                                            {aiDiagnosis.schedule_insights && aiDiagnosis.schedule_insights.length > 0 && (
                                                <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">Jadwal Servis Terdekat:</span>
                                                    {aiDiagnosis.schedule_insights.map((si, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-[11px]">
                                                            <span className="font-medium text-slate-700 dark:text-slate-300">{si.name}</span>
                                                            <span className={`font-bold ${si.is_overdue ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                                {si.is_overdue ? '🚨 Terlewat' : `~${si.days_to_due} hari lagi`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Quick Log Maintenance */}
            <Modal show={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} maxWidth="lg">
                <form onSubmit={submitMaintenance} className="p-6">
                    <h3 className="mb-4 text-base font-black text-slate-900 dark:text-white">Catat Pemeliharaan / Servis Unit</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="m_type" value="Jenis Pemeliharaan *" />
                            <Select
                                id="m_type"
                                className="mt-1.5"
                                value={maintenanceForm.data.type}
                                onChange={(value) => maintenanceForm.setData('type', value)}
                                options={[
                                    { value: 'scheduled_service', label: 'Servis Berkala' },
                                    { value: 'repair', label: 'Perbaikan Mesin / Kerusakan' },
                                    { value: 'inspection', label: 'Inspeksi Berkala' },
                                ]}
                            />
                            <InputError message={maintenanceForm.errors.type} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="m_description" value="Deskripsi Pekerjaan Servis *" />
                            <TextInput
                                id="m_description"
                                className="mt-1.5 block w-full !rounded-2xl"
                                value={maintenanceForm.data.description}
                                onChange={(e) => maintenanceForm.setData('description', e.target.value)}
                                placeholder="Ganti oli mesin, kampas rem, tune up..."
                                required
                            />
                            <InputError message={maintenanceForm.errors.description} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="m_scheduled_date" value="Tanggal Dijadwalkan *" />
                                <TextInput
                                    id="m_scheduled_date"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl"
                                    value={maintenanceForm.data.scheduled_date}
                                    onChange={(e) => maintenanceForm.setData('scheduled_date', e.target.value)}
                                    required
                                />
                                <InputError message={maintenanceForm.errors.scheduled_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="m_completed_date" value="Tanggal Selesai" />
                                <TextInput
                                    id="m_completed_date"
                                    type="date"
                                    className="mt-1.5 block w-full !rounded-2xl"
                                    value={maintenanceForm.data.completed_date}
                                    onChange={(e) => maintenanceForm.setData('completed_date', e.target.value)}
                                />
                                <InputError message={maintenanceForm.errors.completed_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="m_cost" value="Total Biaya Servis (Rp)" />
                                <TextInput
                                    id="m_cost"
                                    type="number"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono"
                                    value={maintenanceForm.data.cost}
                                    onChange={(e) => maintenanceForm.setData('cost', e.target.value)}
                                    placeholder="500000"
                                />
                                <InputError message={maintenanceForm.errors.cost} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="m_odometer_km" value="Odometer Saat Servis (KM)" />
                                <TextInput
                                    id="m_odometer_km"
                                    type="number"
                                    min={0}
                                    className="mt-1.5 block w-full !rounded-2xl font-mono"
                                    value={maintenanceForm.data.odometer_km}
                                    onChange={(e) => maintenanceForm.setData('odometer_km', e.target.value)}
                                />
                                <InputError message={maintenanceForm.errors.odometer_km} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="m_status" value="Status Pengerjaan *" />
                            <Select
                                id="m_status"
                                className="mt-1.5"
                                value={maintenanceForm.data.status}
                                onChange={(value) => maintenanceForm.setData('status', value)}
                                options={[
                                    { value: 'scheduled', label: 'Dijadwalkan' },
                                    { value: 'completed', label: 'Selesai' },
                                    { value: 'cancelled', label: 'Dibatalkan' },
                                ]}
                            />
                            <InputError message={maintenanceForm.errors.status} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowMaintenanceModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={maintenanceForm.processing}>
                            {maintenanceForm.processing ? 'Menyimpan...' : 'Simpan Log Servis'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Quick Log Fuel */}
            <Modal show={showFuelModal} onClose={() => setShowFuelModal(false)} maxWidth="lg">
                <form onSubmit={submitFuel} className="p-6">
                    <h3 className="mb-4 text-base font-black text-slate-900 dark:text-white">Catat Pengisian Bahan Bakar (BBM)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="f_filled_at" value="Tanggal Pengisian *" />
                            <TextInput
                                id="f_filled_at"
                                type="date"
                                className="mt-1.5 block w-full !rounded-2xl"
                                value={fuelForm.data.filled_at}
                                onChange={(e) => fuelForm.setData('filled_at', e.target.value)}
                                required
                            />
                            <InputError message={fuelForm.errors.filled_at} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_driver_id" value="Pengemudi / Driver" />
                            <Select
                                id="f_driver_id"
                                className="mt-1.5"
                                value={fuelForm.data.driver_id}
                                onChange={(value) => fuelForm.setData('driver_id', value)}
                                placeholder="Pilih Pengemudi"
                                options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_liters" value="Volume BBM (Liter) *" />
                            <TextInput
                                id="f_liters"
                                type="number"
                                min={0}
                                step="0.01"
                                className="mt-1.5 block w-full !rounded-2xl font-mono"
                                value={fuelForm.data.liters}
                                onChange={(e) => fuelForm.setData('liters', e.target.value)}
                                placeholder="Contoh: 30"
                                required
                            />
                            <InputError message={fuelForm.errors.liters} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_cost" value="Total Biaya (Rp) *" />
                            <TextInput
                                id="f_cost"
                                type="number"
                                min={0}
                                className="mt-1.5 block w-full !rounded-2xl font-mono"
                                value={fuelForm.data.cost}
                                onChange={(e) => fuelForm.setData('cost', e.target.value)}
                                placeholder="Contoh: 300000"
                                required
                            />
                            <InputError message={fuelForm.errors.cost} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_odometer_km" value="Odometer Saat Isi (KM)" />
                            <TextInput
                                id="f_odometer_km"
                                type="number"
                                min={0}
                                className="mt-1.5 block w-full !rounded-2xl font-mono"
                                value={fuelForm.data.odometer_km}
                                onChange={(e) => fuelForm.setData('odometer_km', e.target.value)}
                            />
                            <InputError message={fuelForm.errors.odometer_km} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_station_name" value="Nama SPBU / Lokasi" />
                            <TextInput
                                id="f_station_name"
                                className="mt-1.5 block w-full !rounded-2xl"
                                value={fuelForm.data.station_name}
                                onChange={(e) => fuelForm.setData('station_name', e.target.value)}
                                placeholder="SPBU Pertamina KM 19"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="f_receipt_number" value="No. Struk / Bukti" />
                            <TextInput
                                id="f_receipt_number"
                                className="mt-1.5 block w-full !rounded-2xl font-mono"
                                value={fuelForm.data.receipt_number}
                                onChange={(e) => fuelForm.setData('receipt_number', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={fuelForm.data.is_full_tank}
                                    onChange={(e) => fuelForm.setData('is_full_tank', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Isi Tangki Penuh (Full Tank)</span>
                            </label>
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="f_notes" value="Catatan Tambahan" />
                            <TextInput
                                id="f_notes"
                                className="mt-1.5 block w-full !rounded-2xl"
                                value={fuelForm.data.notes}
                                onChange={(e) => fuelForm.setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowFuelModal(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={fuelForm.processing}>
                            {fuelForm.processing ? 'Menyimpan...' : 'Simpan Log BBM'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={pendingDelete !== null}
                onClose={closeDeleteDialog}
                onConfirm={confirmPendingDelete}
                processing={processing}
                message={deleteConfirmMessage()}
            />
        </DynamicLayout>
    );
}

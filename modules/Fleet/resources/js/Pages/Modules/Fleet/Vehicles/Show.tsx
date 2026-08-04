import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
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
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity: string | null;
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
}

type ExpiryTone = 'ok' | 'soon' | 'expired' | 'empty';

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'maintenance':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'out_of_service':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
};

const TrashIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
    </svg>
);

function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'default' | 'warning' | 'danger' | 'success';
}): JSX.Element {
    const valueTone =
        tone === 'danger'
            ? 'text-rose-700'
            : tone === 'warning'
              ? 'text-amber-700'
              : tone === 'success'
                ? 'text-emerald-700'
                : 'text-gray-900';

    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${valueTone}`}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-0.5 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="shrink-0 text-sm text-gray-500">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 sm:text-right">{children}</dd>
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            <div className="px-6 py-4">{children}</div>
        </section>
    );
}

function expiryTone(date: string | null): ExpiryTone {
    if (!date) {
        return 'empty';
    }

    const target = new Date(`${date}T00:00:00`);
    if (Number.isNaN(target.getTime())) {
        return 'empty';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

    if (diffDays < 0) {
        return 'expired';
    }

    if (diffDays <= 30) {
        return 'soon';
    }

    return 'ok';
}

function expiryBadgeClass(tone: ExpiryTone): string {
    switch (tone) {
        case 'expired':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        case 'soon':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'ok':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
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
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [pendingDelete, setPendingDelete] = useState<
        | { type: 'vehicle' }
        | { type: 'maintenance'; id: number; label: string }
        | { type: 'fuel'; id: number; label: string }
        | null
    >(null);
    const [processing, setProcessing] = useState(false);

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
        if (!pendingDelete) {
            return;
        }

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
        if (!pendingDelete) {
            return undefined;
        }

        if (pendingDelete.type === 'vehicle') {
            return t('fleet.vehicles.delete_confirm', { name: vehicle.name });
        }

        if (pendingDelete.type === 'maintenance') {
            return t('fleet.vehicles.delete_maintenance_confirm', { description: pendingDelete.label });
        }

        return t('fleet.vehicles.delete_fuel_confirm', { label: pendingDelete.label });
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
    const docsAttention = (documentSummary?.expired ?? 0) + (documentSummary?.expiring_soon ?? 0);
    const subtitleParts = [vehicle.brand, vehicle.model_year, vehicle.color].filter(Boolean);
    const fuelEconomyValue =
        fuelSummary.average_km_per_liter != null ? String(fuelSummary.average_km_per_liter) : '—';
    const fuelEconomyHint =
        fuelSummary.expected_km_per_liter != null
            ? `${t('fleet.vehicles.expected')}: ${fuelSummary.expected_km_per_liter}`
            : t('fleet.vehicles.fuel_economy_hint');

    const expiryLabel = (tone: ExpiryTone): string => {
        if (tone === 'expired') {
            return t('fleet.vehicles.expiry_expired');
        }
        if (tone === 'soon') {
            return t('fleet.vehicles.expiry_soon');
        }
        if (tone === 'ok') {
            return t('fleet.vehicles.expiry_ok');
        }

        return '—';
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('fleet.title')}</p>
                        <h2 className="font-mono text-xl font-semibold leading-tight text-gray-800">{vehicle.plate_number}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.vehicles.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}>
                                <PrimaryButton type="button">{t('common.edit')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${vehicle.plate_number} · ${vehicle.name}`} />

            <FleetNav />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-5 border-b border-gray-100 p-6 lg:flex-row">
                        <div className="shrink-0">
                            {vehicle.photo_url ? (
                                <img
                                    src={vehicle.photo_url}
                                    alt={vehicle.name}
                                    className="h-44 w-full rounded-xl object-cover sm:h-52 sm:w-72"
                                />
                            ) : (
                                <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center sm:h-52 sm:w-72">
                                    <p className="text-sm font-medium text-gray-500">{t('fleet.vehicles.photo_empty')}</p>
                                    <p className="mt-1 text-xs text-gray-400">{t('fleet.vehicles.no_photo_hint')}</p>
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-indigo-600">{vehicle.plate_number}</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                        {t(`fleet.status.${vehicle.status}`)}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                        {vehicle.type.replaceAll('_', ' ')}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 ring-1 ring-inset ring-slate-500/20">
                                        {vehicle.fuel_type}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{vehicle.name}</h1>
                                {subtitleParts.length > 0 && (
                                    <p className="text-sm text-gray-600">{subtitleParts.join(' · ')}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                    <span className="text-gray-500">{t('fleet.vehicles.home_base')}: </span>
                                    {vehicle.home_base ? (
                                        <Link
                                            href={prefixedRoute('fleet.bases.show', vehicle.home_base.id)}
                                            className="font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            {vehicle.home_base.code} — {vehicle.home_base.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">{t('fleet.vehicles.home_base_none')}</span>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {can.create && (
                                    <PrimaryButton type="button" onClick={openFuelModal}>
                                        {t('fleet.vehicles.quick_fuel')}
                                    </PrimaryButton>
                                )}
                                {maintenanceEnabled ? (
                                    <Link
                                        href={`${prefixedRoute('maintenance.work-orders.create')}?vehicle_id=${vehicle.id}`}
                                    >
                                        <SecondaryButton type="button">{t('fleet.vehicles.quick_service')}</SecondaryButton>
                                    </Link>
                                ) : (
                                    can.create && (
                                        <SecondaryButton type="button" onClick={() => setShowMaintenanceModal(true)}>
                                            {t('fleet.vehicles.log_maintenance')}
                                        </SecondaryButton>
                                    )
                                )}
                                {documentsEnabled && (
                                    <Link href={prefixedRoute('fleet.vehicles.documents.index', vehicle.id)}>
                                        <SecondaryButton type="button">{t('fleet.vehicles.documents')}</SecondaryButton>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 px-6 py-4 lg:grid-cols-4">
                        <StatCard
                            label={t('fleet.vehicles.odometer')}
                            value={`${vehicle.odometer_km.toLocaleString()} km`}
                            hint={t('fleet.vehicles.odometer_hint')}
                        />
                        <StatCard
                            label={t('fleet.vehicles.avg_kml')}
                            value={fuelEconomyValue}
                            hint={fuelEconomyHint}
                            tone={fuelSummary.anomaly_count > 0 ? 'warning' : 'default'}
                        />
                        {documentsEnabled ? (
                            <StatCard
                                label={t('fleet.vehicles.documents')}
                                value={String(docsAttention)}
                                hint={
                                    docsAttention > 0
                                        ? t('fleet.vehicles.docs_attention_hint')
                                        : t('fleet.vehicles.docs_ok_hint')
                                }
                                tone={docsAttention > 0 ? 'danger' : 'success'}
                            />
                        ) : (
                            <StatCard
                                label={t('fleet.vehicles.fuel_logs')}
                                value={String(vehicle.fuel_logs.length)}
                                hint={t('fleet.vehicles.fills')}
                            />
                        )}
                        <StatCard
                            label={t('fleet.vehicles.anomalies')}
                            value={String(fuelSummary.anomaly_count)}
                            hint={t('fleet.vehicles.fuel_summary')}
                            tone={fuelSummary.anomaly_count > 0 ? 'warning' : 'success'}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="space-y-6 lg:col-span-3">
                        <SectionCard title={t('fleet.vehicles.sections.specs')}>
                            <dl>
                                <DetailRow label={t('fleet.vehicles.brand')}>{vehicle.brand || '—'}</DetailRow>
                                <DetailRow label={t('fleet.vehicles.model_year')}>{vehicle.model_year || '—'}</DetailRow>
                                <DetailRow label={t('fleet.vehicles.color')}>{vehicle.color || '—'}</DetailRow>
                                <DetailRow label={t('fleet.vehicles.capacity')}>{vehicle.capacity || '—'}</DetailRow>
                                <DetailRow label={t('fleet.vehicles.tank_capacity')}>
                                    {vehicle.tank_capacity_liters != null ? `${vehicle.tank_capacity_liters} L` : '—'}
                                </DetailRow>
                                <DetailRow label={t('fleet.vehicles.expected_kml')}>
                                    {vehicle.expected_km_per_liter ?? '—'}
                                </DetailRow>
                                {vehicle.notes && <DetailRow label={t('fleet.vehicles.notes')}>{vehicle.notes}</DetailRow>}
                            </dl>
                        </SectionCard>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <SectionCard
                            title={t('fleet.vehicles.sections.compliance')}
                            subtitle={t('fleet.vehicles.sections.compliance_hint')}
                        >
                            <div className="space-y-4">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {t('fleet.vehicles.stnk_expires')}
                                        </p>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expiryBadgeClass(stnkTone)}`}>
                                            {expiryLabel(stnkTone)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatDate(vehicle.stnk_expires_at, localeTag)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            {t('fleet.vehicles.kir_expires')}
                                        </p>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expiryBadgeClass(kirTone)}`}>
                                            {expiryLabel(kirTone)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {formatDate(vehicle.kir_expires_at, localeTag)}
                                    </p>
                                </div>
                            </div>
                        </SectionCard>

                        {documentsEnabled && (
                            <SectionCard
                                title={t('fleet.vehicles.documents')}
                                action={
                                    <Link
                                        href={prefixedRoute('fleet.vehicles.documents.index', vehicle.id)}
                                        className="text-sm font-medium text-indigo-600 hover:underline"
                                    >
                                        {t('fleet.vehicles.manage_documents')}
                                    </Link>
                                }
                            >
                                {!documentSummary || documentSummary.total === 0 ? (
                                    <p className="text-sm text-gray-500">{t('fleet.vehicles.no_documents')}</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_total')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums">{documentSummary.total}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_nearest')}</p>
                                            <p className="mt-1 font-medium">{formatDate(documentSummary.nearest_expiry, localeTag)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_expired')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-rose-700">{documentSummary.expired}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_expiring')}</p>
                                            <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">{documentSummary.expiring_soon}</p>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        )}
                    </div>
                </div>

                <SectionCard
                    title={
                        maintenanceEnabled
                            ? t('fleet.vehicles.service_history')
                            : t('fleet.vehicles.maintenance')
                    }
                    action={
                        maintenanceEnabled ? (
                            <Link
                                href={`${prefixedRoute('maintenance.work-orders.create')}?vehicle_id=${vehicle.id}`}
                                className="inline-flex items-center rounded-md border border-transparent bg-gray-800 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-gray-700"
                            >
                                {t('maintenance.work_orders.new')}
                            </Link>
                        ) : (
                            can.create && (
                                <PrimaryButton type="button" onClick={() => setShowMaintenanceModal(true)}>
                                    {t('fleet.vehicles.log_maintenance')}
                                </PrimaryButton>
                            )
                        )
                    }
                >
                    {maintenanceEnabled ? (
                        !serviceHistory || serviceHistory.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('fleet.vehicles.no_service_history')}</p>
                        ) : (
                            <div className="-mx-6 overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.wo_ref')}</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.wo_title')}</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.status')}</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.wo_completed')}</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.wo_total')}</th>
                                            <th className="px-6 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {serviceHistory.map((wo) => (
                                            <tr key={wo.id} className="hover:bg-gray-50/80">
                                                <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{wo.reference_number}</td>
                                                <td className="px-3 py-3 text-sm text-gray-700">
                                                    <div>{wo.title}</div>
                                                    {wo.category && <div className="text-xs text-gray-500">{wo.category}</div>}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm capitalize text-gray-500">{wo.status.replace('_', ' ')}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{formatDate(wo.completed_at ?? wo.scheduled_date, localeTag)}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                                                    {wo.total_cost != null ? `Rp ${Number(wo.total_cost).toLocaleString()}` : '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                                                    <Link
                                                        href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {t('fleet.vehicles.open_work_order')}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (vehicle.maintenance_logs?.length ?? 0) === 0 ? (
                        <p className="text-sm text-gray-500">{t('fleet.vehicles.no_maintenance')}</p>
                    ) : (
                        <div className="-mx-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.type')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.notes')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.date')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.cost')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.status')}</th>
                                        <th className="px-6 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(vehicle.maintenance_logs ?? []).map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/80">
                                            <td className="whitespace-nowrap px-6 py-3 text-sm capitalize text-gray-900">{log.type.replace('_', ' ')}</td>
                                            <td className="px-3 py-3 text-sm text-gray-500">{log.description}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{formatDate(log.scheduled_date, localeTag)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{log.cost ? `Rp ${Number(log.cost).toLocaleString()}` : '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm capitalize text-gray-500">{log.status}</td>
                                            <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
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
                                                        className="text-red-600 hover:text-red-900"
                                                        title={t('common.delete')}
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
                </SectionCard>

                <SectionCard
                    title={t('fleet.vehicles.fuel_logs')}
                    subtitle={[
                        `${t('fleet.vehicles.avg_kml')}: ${fuelSummary.average_km_per_liter ?? '—'}`,
                        fuelSummary.expected_km_per_liter
                            ? `${t('fleet.vehicles.expected')}: ${fuelSummary.expected_km_per_liter}`
                            : null,
                        fuelSummary.anomaly_count > 0
                            ? `${t('fleet.vehicles.anomalies')}: ${fuelSummary.anomaly_count}`
                            : null,
                        trackingEnabled ? 'GPS odometer linked' : null,
                    ]
                        .filter(Boolean)
                        .join(' · ')}
                    action={
                        can.create && (
                            <PrimaryButton type="button" onClick={openFuelModal}>
                                {t('fleet.vehicles.add_fuel')}
                            </PrimaryButton>
                        )
                    }
                >
                    {vehicle.fuel_logs.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('fleet.vehicles.no_fuel')}</p>
                    ) : (
                        <div className="-mx-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.date')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.liters')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.cost')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.odometer')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Δ km</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.km_l')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.flags')}</th>
                                        <th className="px-6 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicle.fuel_logs.map((log) => (
                                        <tr key={log.id} className={log.anomaly_flags?.length ? 'bg-amber-50/60' : 'hover:bg-gray-50/80'}>
                                            <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-900">
                                                {formatDate(log.filled_at, localeTag)}
                                                {log.is_full_tank && (
                                                    <span className="ml-1 text-xs text-indigo-600">{t('fleet.fuel.full_tank')}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{log.liters} L</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">Rp {Number(log.cost).toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                                                {log.odometer_km ? `${log.odometer_km.toLocaleString()} km` : '—'}
                                                {log.odometer_source && (
                                                    <span className="ml-1 text-xs uppercase text-gray-400">{log.odometer_source}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                                                {log.distance_since_last_km != null ? `${log.distance_since_last_km} km` : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">
                                                {log.km_per_liter ?? '—'}
                                                {log.liters_per_100km != null && (
                                                    <span className="block text-xs text-gray-400">{log.liters_per_100km} L/100km</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm">
                                                {log.anomaly_flags?.length ? (
                                                    <ul className="space-y-0.5 text-xs text-amber-800">
                                                        {log.anomaly_flags.map((flag) => (
                                                            <li key={flag.code} title={flag.message}>
                                                                {flag.code.replaceAll('_', ' ')}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
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
                                                        className="text-red-600 hover:text-red-900"
                                                        title={t('common.delete')}
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
                </SectionCard>

                {can.delete && (
                    <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40">
                        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-rose-900">{t('common.delete')}</h3>
                                <p className="text-sm text-rose-700/80">{t('common.confirm_delete_message')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPendingDelete({ type: 'vehicle' })}
                                className="inline-flex items-center justify-center gap-2 rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                            >
                                <TrashIcon />
                                {t('common.delete')}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            <Modal show={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} maxWidth="lg">
                <form onSubmit={submitMaintenance} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">{t('fleet.vehicles.log_maintenance')}</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="m_type" value={t('fleet.vehicles.type')} />
                            <Select
                                id="m_type"
                                className="mt-1"
                                value={maintenanceForm.data.type}
                                onChange={(value) => maintenanceForm.setData('type', value)}
                                options={[
                                    { value: 'scheduled_service', label: 'Scheduled Service' },
                                    { value: 'repair', label: 'Repair' },
                                    { value: 'inspection', label: 'Inspection' },
                                ]}
                            />
                            <InputError message={maintenanceForm.errors.type} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="m_description" value={t('fleet.vehicles.notes')} />
                            <TextInput id="m_description" className="mt-1 block w-full" value={maintenanceForm.data.description} onChange={(e) => maintenanceForm.setData('description', e.target.value)} required />
                            <InputError message={maintenanceForm.errors.description} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="m_scheduled_date" value={t('fleet.fuel.date')} />
                                <TextInput id="m_scheduled_date" type="date" className="mt-1 block w-full" value={maintenanceForm.data.scheduled_date} onChange={(e) => maintenanceForm.setData('scheduled_date', e.target.value)} required />
                                <InputError message={maintenanceForm.errors.scheduled_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_completed_date" value={t('fleet.fuel.date')} />
                                <TextInput id="m_completed_date" type="date" className="mt-1 block w-full" value={maintenanceForm.data.completed_date} onChange={(e) => maintenanceForm.setData('completed_date', e.target.value)} />
                                <InputError message={maintenanceForm.errors.completed_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_cost" value={t('fleet.fuel.cost')} />
                                <TextInput id="m_cost" type="number" min={0} className="mt-1 block w-full" value={maintenanceForm.data.cost} onChange={(e) => maintenanceForm.setData('cost', e.target.value)} />
                                <InputError message={maintenanceForm.errors.cost} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="m_odometer_km" value={t('fleet.vehicles.odometer')} />
                                <TextInput id="m_odometer_km" type="number" min={0} className="mt-1 block w-full" value={maintenanceForm.data.odometer_km} onChange={(e) => maintenanceForm.setData('odometer_km', e.target.value)} />
                                <InputError message={maintenanceForm.errors.odometer_km} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="m_status" value={t('fleet.vehicles.status')} />
                            <Select
                                id="m_status"
                                className="mt-1"
                                value={maintenanceForm.data.status}
                                onChange={(value) => maintenanceForm.setData('status', value)}
                                options={[
                                    { value: 'scheduled', label: 'Scheduled' },
                                    { value: 'completed', label: 'Completed' },
                                    { value: 'cancelled', label: 'Cancelled' },
                                ]}
                            />
                            <InputError message={maintenanceForm.errors.status} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowMaintenanceModal(false)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={maintenanceForm.processing}>{t('common.save')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showFuelModal} onClose={() => setShowFuelModal(false)} maxWidth="lg">
                <form onSubmit={submitFuel} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">{t('fleet.vehicles.add_fuel')}</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="f_filled_at" value={t('fleet.fuel.filled_at')} />
                            <TextInput id="f_filled_at" type="date" className="mt-1 block w-full" value={fuelForm.data.filled_at} onChange={(e) => fuelForm.setData('filled_at', e.target.value)} required />
                            <InputError message={fuelForm.errors.filled_at} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_driver_id" value={t('fleet.fuel.driver')} />
                            <Select
                                id="f_driver_id"
                                className="mt-1"
                                value={fuelForm.data.driver_id}
                                onChange={(value) => fuelForm.setData('driver_id', value)}
                                placeholder="—"
                                options={drivers.map((d) => ({ value: String(d.id), label: d.name }))}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_liters" value={t('fleet.fuel.liters')} />
                            <TextInput id="f_liters" type="number" min={0} step="0.01" className="mt-1 block w-full" value={fuelForm.data.liters} onChange={(e) => fuelForm.setData('liters', e.target.value)} required />
                            <InputError message={fuelForm.errors.liters} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_cost" value={t('fleet.fuel.cost')} />
                            <TextInput id="f_cost" type="number" min={0} className="mt-1 block w-full" value={fuelForm.data.cost} onChange={(e) => fuelForm.setData('cost', e.target.value)} required />
                            <InputError message={fuelForm.errors.cost} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_odometer_km" value={`${t('fleet.fuel.odometer')} (${fuelForm.data.odometer_source || 'manual'})`} />
                            <TextInput id="f_odometer_km" type="number" min={0} className="mt-1 block w-full" value={fuelForm.data.odometer_km} onChange={(e) => fuelForm.setData('odometer_km', e.target.value)} />
                            <p className="mt-1 text-xs text-gray-500">
                                Prefills from vehicle{trackingEnabled ? ' / GPS' : ''} odometer ({fuelSummary.suggested_odometer_km.toLocaleString()} km).
                            </p>
                            <InputError message={fuelForm.errors.odometer_km} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_station_name" value={t('fleet.fuel.station')} />
                            <TextInput id="f_station_name" className="mt-1 block w-full" value={fuelForm.data.station_name} onChange={(e) => fuelForm.setData('station_name', e.target.value)} />
                        </div>
                        <div>
                            <InputLabel htmlFor="f_receipt_number" value={t('fleet.fuel.receipt')} />
                            <TextInput id="f_receipt_number" className="mt-1 block w-full" value={fuelForm.data.receipt_number} onChange={(e) => fuelForm.setData('receipt_number', e.target.value)} />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={fuelForm.data.is_full_tank}
                                    onChange={(e) => fuelForm.setData('is_full_tank', e.target.checked)}
                                />
                                {t('fleet.fuel.full_tank')}
                            </label>
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="f_notes" value={t('fleet.fuel.notes')} />
                            <TextInput id="f_notes" className="mt-1 block w-full" value={fuelForm.data.notes} onChange={(e) => fuelForm.setData('notes', e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowFuelModal(false)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={fuelForm.processing}>{t('common.save')}</PrimaryButton>
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

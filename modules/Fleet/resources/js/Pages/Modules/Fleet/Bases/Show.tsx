import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import LeafletMap from '@/Components/Map/LeafletMap';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { toLatLng } from '@/utils/geo';
import { Head, Link, router } from '@inertiajs/react';
import { Marker } from 'react-leaflet';
import { useState, type ReactNode } from 'react';
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

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'inactive':
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
        case 'maintenance':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'out_of_service':
            return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
        default:
            return 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20';
    }
};

const timeValue = (value: string | null | undefined): string => (value || '').toString().slice(0, 5);

const resolveKind = (kind: string | { value?: string } | null | undefined): string => {
    if (!kind) {
        return '';
    }
    if (typeof kind === 'string') {
        return kind;
    }
    return kind.value ?? '';
};

const displayAddress = (base: FleetBase): string => {
    const parts = [base.address, base.city, base.province, base.zip].filter((part) => filled(part));
    return parts.length > 0 ? parts.join(', ') : '—';
};

const filled = (value: string | null | undefined): boolean => Boolean(value && String(value).trim() !== '');

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
    return (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
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

export default function Show({ base, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const kind = resolveKind(base.kind);
    const mapPosition = toLatLng(
        base.latitude != null ? String(base.latitude) : null,
        base.longitude != null ? String(base.longitude) : null,
    );
    const hoursLabel =
        timeValue(base.opens_at) && timeValue(base.closes_at)
            ? `${timeValue(base.opens_at)} – ${timeValue(base.closes_at)}`
            : '—';
    const capacityLabel =
        base.vehicle_capacity != null
            ? `${base.vehicles.length} / ${base.vehicle_capacity}`
            : String(base.vehicles.length);
    const staffWithoutManager = base.users.filter((user) => user.id !== base.manager?.id);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', base.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('fleet.title')}</p>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{base.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={prefixedRoute('fleet.bases.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                        {can.update && (
                            <Link href={prefixedRoute('fleet.bases.edit', base.id)}>
                                <PrimaryButton type="button">{t('common.edit')}</PrimaryButton>
                            </Link>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${base.code} · ${base.name}`} />

            <FleetNav />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-indigo-600">{base.code}</span>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(base.status)}`}>
                                    {t(`fleet.status.${base.status}`)}
                                </span>
                                {kind && (
                                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                                        {t(`fleet.base_kinds.${kind}`)}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{base.name}</h1>
                            <p className="max-w-2xl text-sm text-gray-600">{displayAddress(base)}</p>
                        </div>
                        {base.manager && (
                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:min-w-[220px]">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('fleet.bases.manager')}</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">{base.manager.name}</p>
                                <p className="text-xs text-gray-500">{base.manager.email}</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 px-6 py-4 lg:grid-cols-4">
                        <StatCard
                            label={t('fleet.bases.vehicles')}
                            value={capacityLabel}
                            hint={
                                base.vehicle_capacity != null
                                    ? t('fleet.bases.capacity_hint')
                                    : t('fleet.bases.vehicles_assigned')
                            }
                        />
                        <StatCard label={t('fleet.bases.hours')} value={hoursLabel} hint={base.timezone} />
                        <StatCard
                            label={t('fleet.bases.service_radius_km')}
                            value={base.service_radius_km != null ? `${base.service_radius_km} km` : '—'}
                        />
                        <StatCard
                            label={t('fleet.bases.allows_overnight')}
                            value={base.allows_overnight ? t('common.yes') : t('common.no')}
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <section className="space-y-6 lg:col-span-3">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.sections.operations')}</h3>
                            </div>
                            <dl className="px-6">
                                <DetailRow label={t('fleet.bases.phone')}>
                                    {base.phone ? (
                                        <a href={`tel:${base.phone}`} className="text-indigo-600 hover:underline">
                                            {base.phone}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('fleet.bases.email')}>
                                    {base.email ? (
                                        <a href={`mailto:${base.email}`} className="text-indigo-600 hover:underline">
                                            {base.email}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </DetailRow>
                                <DetailRow label={t('fleet.bases.opens_at')}>{timeValue(base.opens_at) || '—'}</DetailRow>
                                <DetailRow label={t('fleet.bases.closes_at')}>{timeValue(base.closes_at) || '—'}</DetailRow>
                                <DetailRow label={t('fleet.bases.timezone')}>{base.timezone || '—'}</DetailRow>
                                <DetailRow label={t('fleet.bases.vehicle_capacity')}>
                                    {base.vehicle_capacity ?? '—'}
                                </DetailRow>
                                {(base.location || base.warehouse) && (
                                    <>
                                        {base.location && (
                                            <DetailRow label={t('fleet.bases.location')}>
                                                {base.location.code} — {base.location.name}
                                                {base.location.city ? ` (${base.location.city})` : ''}
                                            </DetailRow>
                                        )}
                                        {base.warehouse && (
                                            <DetailRow label={t('fleet.bases.warehouse')}>{base.warehouse.name}</DetailRow>
                                        )}
                                    </>
                                )}
                                {base.notes && <DetailRow label={t('fleet.bases.notes')}>{base.notes}</DetailRow>}
                            </dl>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.vehicles')}</h3>
                                    <p className="text-xs text-gray-500">{t('fleet.bases.vehicles_assigned')}</p>
                                </div>
                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                    {base.vehicles.length}
                                </span>
                            </div>
                            {base.vehicles.length === 0 ? (
                                <p className="px-6 py-8 text-center text-sm text-gray-500">{t('fleet.bases.no_vehicles')}</p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {base.vehicles.map((vehicle) => (
                                        <li key={vehicle.id}>
                                            <Link
                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                className="flex items-center justify-between gap-3 px-6 py-3.5 transition hover:bg-gray-50"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">{vehicle.name}</p>
                                                    <p className="font-mono text-xs text-gray-500">{vehicle.plate_number}</p>
                                                </div>
                                                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                                    {t(`fleet.status.${vehicle.status}`)}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    <section className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.map_title')}</h3>
                                {mapPosition && (
                                    <p className="mt-1 font-mono text-xs text-gray-500">
                                        {Number(base.latitude).toFixed(5)}, {Number(base.longitude).toFixed(5)}
                                    </p>
                                )}
                            </div>
                            {mapPosition ? (
                                <LeafletMap center={mapPosition} zoom={15} height="280px" bounds={[mapPosition]}>
                                    <Marker position={mapPosition} />
                                </LeafletMap>
                            ) : (
                                <div className="flex h-[220px] items-center justify-center bg-gray-50 px-6 text-center text-sm text-gray-500">
                                    {t('fleet.bases.map_empty')}
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900">{t('fleet.bases.staff')}</h3>
                                <p className="text-xs text-gray-500">{t('fleet.bases.staff_hint')}</p>
                            </div>
                            {base.manager && (
                                <div className="border-b border-gray-100 px-6 py-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{t('fleet.bases.manager')}</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{base.manager.name}</p>
                                    <p className="text-xs text-gray-500">{base.manager.email}</p>
                                </div>
                            )}
                            {staffWithoutManager.length === 0 ? (
                                <p className="px-6 py-6 text-sm text-gray-500">{t('fleet.bases.no_staff')}</p>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {staffWithoutManager.map((user) => (
                                        <li key={user.id} className="px-6 py-3.5">
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>
                </div>

                {can.delete && (
                    <section className="overflow-hidden rounded-xl border border-rose-200 bg-rose-50/40">
                        <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-rose-900">{t('common.delete')}</h3>
                                <p className="text-sm text-rose-700/80">{t('common.confirm_delete_message')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteDialog(true)}
                                className="inline-flex items-center justify-center rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                message={t('fleet.bases.delete_confirm', { name: base.name })}
            />
        </DynamicLayout>
    );
}

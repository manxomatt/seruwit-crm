import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
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
            return 'bg-green-100 text-green-800';
        case 'inactive':
            return 'bg-gray-100 text-gray-800';
        case 'maintenance':
            return 'bg-yellow-100 text-yellow-800';
        case 'out_of_service':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
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

export default function Show({ base, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const kind = resolveKind(base.kind);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.bases.destroy', base.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('fleet.title')}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('fleet.bases.edit', base.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.bases.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.bases.show')} />

            <FleetNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.code')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.code}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.name')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.kind')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {kind ? t(`fleet.base_kinds.${kind}`) : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.status')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(base.status)}`}>
                                        {t(`fleet.status.${base.status}`)}
                                    </span>
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.address')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.address || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.city')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.city || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.province')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.province || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.zip')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.zip || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.latitude')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.latitude ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.longitude')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.longitude ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.phone')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.phone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.email')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.email || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.opens_at')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{timeValue(base.opens_at) || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.closes_at')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{timeValue(base.closes_at) || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.timezone')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.timezone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.vehicle_capacity')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.vehicle_capacity ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.service_radius_km')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{base.service_radius_km ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.allows_overnight')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {base.allows_overnight ? t('common.yes') : t('common.no')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.manager')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {base.manager ? (
                                        <>
                                            <div>{base.manager.name}</div>
                                            <div className="text-xs text-gray-500">{base.manager.email}</div>
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            {base.location && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.location')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {base.location.code} — {base.location.name}
                                        {base.location.city ? ` (${base.location.city})` : ''}
                                    </dd>
                                </div>
                            )}
                            {base.warehouse && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.warehouse')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{base.warehouse.name}</dd>
                                </div>
                            )}
                            {base.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('fleet.bases.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{base.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-900">{t('fleet.bases.staff')}</h3>
                        {base.users.length === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">{t('fleet.bases.no_staff')}</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-gray-100 rounded-lg border">
                                {base.users.map((user) => (
                                    <li key={user.id} className="flex items-start px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-900">{t('fleet.bases.vehicles')}</h3>
                        {base.vehicles.length === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">{t('fleet.bases.no_vehicles')}</p>
                        ) : (
                            <ul className="mt-3 divide-y divide-gray-100 rounded-lg border">
                                {base.vehicles.map((vehicle) => (
                                    <li key={vehicle.id} className="flex items-center justify-between px-4 py-3">
                                        <div>
                                            <Link
                                                href={prefixedRoute('fleet.vehicles.show', vehicle.id)}
                                                className="text-sm font-medium text-indigo-600 hover:underline"
                                            >
                                                {vehicle.name}
                                            </Link>
                                            <p className="text-xs text-gray-500">{vehicle.plate_number}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                            {t(`fleet.status.${vehicle.status}`)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{t('common.delete')}</h3>
                                <p className="text-sm text-gray-500">{t('common.confirm_delete_message')}</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
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

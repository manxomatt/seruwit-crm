import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
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
    capacity: string | null;
    tank_capacity_liters: string | number | null;
    expected_km_per_liter: string | number | null;
    fuel_type: string;
    status: string;
    odometer_km: number;
    stnk_expires_at: string | null;
    kir_expires_at: string | null;
    photo_url: string | null;
    notes: string | null;
    maintenance_logs: MaintenanceLog[];
    fuel_logs: FuelLog[];
}

interface Props {
    vehicle: Vehicle;
    trackingEnabled?: boolean;
    documentsEnabled?: boolean;
    documentSummary?: DocumentSummary | null;
    fuelSummary: FuelSummary;
    drivers: { id: number; name: string }[];
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'maintenance':
            return 'bg-yellow-100 text-yellow-800';
        case 'out_of_service':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Show({
    vehicle,
    trackingEnabled = false,
    documentsEnabled = false,
    documentSummary = null,
    fuelSummary,
    drivers,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showFuelModal, setShowFuelModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

    const deleteMaintenance = (id: number) => {
        router.delete(prefixedRoute('fleet.vehicles.maintenance-logs.destroy', [vehicle.id, id]), { preserveScroll: true });
    };

    const deleteFuel = (id: number) => {
        router.delete(prefixedRoute('fleet.vehicles.fuel-logs.destroy', [vehicle.id, id]), { preserveScroll: true });
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.destroy', vehicle.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const fuelSummaryParts = [
        `${t('fleet.vehicles.avg_kml')}: ${fuelSummary.average_km_per_liter ?? '—'}`,
        fuelSummary.expected_km_per_liter
            ? `${t('fleet.vehicles.expected')}: ${fuelSummary.expected_km_per_liter}`
            : null,
        fuelSummary.anomaly_count > 0
            ? `${t('fleet.vehicles.anomalies')}: ${fuelSummary.anomaly_count}`
            : null,
        trackingEnabled ? 'GPS odometer linked' : null,
    ].filter(Boolean);

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('fleet.vehicles.show')}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('fleet.vehicles.edit', vehicle.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.vehicles.index')}>
                            <SecondaryButton>{t('common.back')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={t('fleet.vehicles.show')} />

            <FleetNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {vehicle.photo_url && (
                            <img src={vehicle.photo_url} alt={vehicle.name} className="mb-6 h-48 w-full rounded-lg object-cover sm:w-64" />
                        )}
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.name')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.plate')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.plate_number}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.type')}</dt>
                                <dd className="mt-1 text-sm capitalize text-gray-900">{vehicle.type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.status')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                        {t(`fleet.status.${vehicle.status}`)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.brand')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.brand || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.model_year')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.model_year || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.capacity')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.capacity || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.fuel_type')}</dt>
                                <dd className="mt-1 text-sm capitalize text-gray-900">{vehicle.fuel_type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.odometer')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.odometer_km.toLocaleString()} km</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.stnk_expires')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.stnk_expires_at || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.kir_expires')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{vehicle.kir_expires_at || '—'}</dd>
                            </div>
                            {vehicle.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">{t('fleet.vehicles.notes')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{vehicle.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {documentsEnabled && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">{t('fleet.vehicles.documents')}</h3>
                                <Link
                                    href={prefixedRoute('fleet.vehicles.documents.index', vehicle.id)}
                                    className="text-sm font-medium text-indigo-600 hover:underline"
                                >
                                    {t('fleet.vehicles.manage_documents')}
                                </Link>
                            </div>
                            {!documentSummary || documentSummary.total === 0 ? (
                                <p className="text-sm text-gray-500">{t('fleet.vehicles.no_documents')}</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-4 text-sm">
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_total')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums">{documentSummary.total}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_expired')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums text-red-700">{documentSummary.expired}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_expiring')}</p>
                                        <p className="mt-1 text-xl font-semibold tabular-nums text-amber-700">{documentSummary.expiring_soon}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-gray-500">{t('fleet.vehicles.docs_nearest')}</p>
                                        <p className="mt-1 font-medium">
                                            {documentSummary.nearest_expiry
                                                ? new Date(documentSummary.nearest_expiry).toLocaleDateString('id-ID')
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{t('fleet.vehicles.maintenance')}</h3>
                            {can.create && (
                                <PrimaryButton onClick={() => setShowMaintenanceModal(true)}>
                                    {t('fleet.vehicles.log_maintenance')}
                                </PrimaryButton>
                            )}
                        </div>
                        {vehicle.maintenance_logs.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('fleet.vehicles.no_maintenance')}</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.type')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.notes')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.date')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.cost')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.vehicles.status')}</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicle.maintenance_logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm capitalize text-gray-900">{log.type.replace('_', ' ')}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{log.description}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.scheduled_date}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.cost ? `Rp ${Number(log.cost).toLocaleString()}` : '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm capitalize text-gray-500">{log.status}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                                                {can.delete && (
                                                    <button onClick={() => deleteMaintenance(log.id)} className="text-red-600 hover:text-red-900">
                                                        {t('common.delete')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{t('fleet.vehicles.fuel_logs')}</h3>
                                <p className="text-xs text-gray-500">{fuelSummaryParts.join(' · ')}</p>
                            </div>
                            {can.create && (
                                <PrimaryButton
                                    onClick={() => {
                                        fuelForm.setData({
                                            ...fuelForm.data,
                                            filled_at: new Date().toISOString().slice(0, 10),
                                            odometer_km: String(fuelSummary.suggested_odometer_km || ''),
                                            odometer_source: fuelSummary.suggested_odometer_source || 'vehicle',
                                        });
                                        setShowFuelModal(true);
                                    }}
                                >
                                    {t('fleet.vehicles.add_fuel')}
                                </PrimaryButton>
                            )}
                        </div>
                        {vehicle.fuel_logs.length === 0 ? (
                            <p className="text-sm text-gray-500">{t('fleet.vehicles.no_fuel')}</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.date')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.liters')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.cost')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.odometer')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Δ km</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.km_l')}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('fleet.fuel.flags')}</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicle.fuel_logs.map((log) => (
                                        <tr key={log.id} className={log.anomaly_flags?.length ? 'bg-amber-50/60' : ''}>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                                                {log.filled_at}
                                                {log.is_full_tank && <span className="ml-1 text-xs text-indigo-600">{t('fleet.fuel.full_tank')}</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{log.liters} L</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">Rp {Number(log.cost).toLocaleString()}</td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {log.odometer_km ? `${log.odometer_km.toLocaleString()} km` : '—'}
                                                {log.odometer_source && (
                                                    <span className="ml-1 text-xs uppercase text-gray-400">{log.odometer_source}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {log.distance_since_last_km != null ? `${log.distance_since_last_km} km` : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                                                {log.km_per_liter ?? '—'}
                                                {log.liters_per_100km != null && (
                                                    <span className="block text-xs text-gray-400">{log.liters_per_100km} L/100km</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
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
                                            <td className="whitespace-nowrap px-3 py-2 text-right text-sm">
                                                {can.delete && (
                                                    <button onClick={() => deleteFuel(log.id)} className="text-red-600 hover:text-red-900">
                                                        {t('common.delete')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                show={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={confirmDelete}
                processing={processing}
                message={t('fleet.vehicles.delete_confirm', { name: vehicle.name })}
            />
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TransportationNav from '../../../../TransportationNav';
import PageHeader from '@/Components/PageHeader';

interface VehicleRef {
    id: number;
    name: string;
    plate_number: string;
}

interface DriverRef {
    id: number;
    name: string;
}

interface VehicleUtilization {
    vehicle_id: number;
    trip_count: number;
    total_distance_km: string | null;
    vehicle: VehicleRef;
}

interface DriverUtilization {
    driver_id: number;
    trip_count: number;
    driver: DriverRef;
}

interface FuelCost {
    vehicle_id: number;
    total_cost: string;
    total_liters: string;
    avg_km_per_liter: string | null;
    anomaly_count: number;
    vehicle: VehicleRef;
}

interface MaintenanceCost {
    vehicle_id: number;
    total_cost: string;
    log_count: number;
    vehicle: VehicleRef;
}

interface Props {
    filters: { from: string; to: string };
    tripsByStatus: Record<string, number>;
    vehicleUtilization: VehicleUtilization[];
    driverUtilization: DriverUtilization[];
    fuelCostByVehicle: FuelCost[];
    maintenanceCostByVehicle: MaintenanceCost[];
}

function Bar({ value, max }: { value: number; max: number }): JSX.Element {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="h-2 w-full rounded bg-gray-100">
            <div className="h-2 rounded bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function Index({ filters, tripsByStatus, vehicleUtilization, driverUtilization, fuelCostByVehicle, maintenanceCostByVehicle }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('transportation.reports.index'), { from, to }, { preserveState: true, replace: true });
    };

    const maxTripCount = Math.max(1, ...vehicleUtilization.map((v) => v.trip_count));
    const maxDriverTripCount = Math.max(1, ...driverUtilization.map((d) => d.trip_count));
    const maxFuelCost = Math.max(1, ...fuelCostByVehicle.map((f) => Number(f.total_cost)));
    const maxMaintenanceCost = Math.max(1, ...maintenanceCostByVehicle.map((m) => Number(m.total_cost)));

    return (
        <DynamicLayout
            header={<PageHeader title={t('transportation.pages.reports.title')} />}
        >
            <Head title={t('transportation.pages.reports.title')} />

            <TransportationNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
                            <div>
                                <InputLabel htmlFor="from" value={t('transportation.fields.starts_on')} />
                                <TextInput id="from" type="date" className="mt-1 block" value={from} onChange={(e) => setFrom(e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="to" value={t('transportation.fields.ends_on')} />
                                <TextInput id="to" type="date" className="mt-1 block" value={to} onChange={(e) => setTo(e.target.value)} />
                            </div>
                            <PrimaryButton type="submit">{t('common.apply')}</PrimaryButton>
                        </form>
                    </div>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">{t('transportation.pages.reports.by_status')}</h3>
                        {Object.keys(tripsByStatus).length === 0 ? (
                            <p className="text-sm text-gray-500">No trips scheduled in this range.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                {Object.entries(tripsByStatus).map(([status, count]) => (
                                    <div key={status} className="rounded-md border border-gray-200 p-4">
                                        <p className="text-sm capitalize text-gray-500">{t(`transportation.status.${status}`, undefined, status)}</p>
                                        <p className="text-2xl font-semibold text-gray-900">{count}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('transportation.pages.reports.vehicle_utilization')}</h3>
                            {vehicleUtilization.length === 0 ? (
                                <p className="text-sm text-gray-500">No trips in this range.</p>
                            ) : (
                                <div className="space-y-4">
                                    {vehicleUtilization.map((row) => (
                                        <div key={row.vehicle_id}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="text-gray-900">{row.vehicle.name} ({row.vehicle.plate_number})</span>
                                                <span className="text-gray-500">{row.trip_count} trips · {row.total_distance_km ? `${row.total_distance_km} km` : '0 km'}</span>
                                            </div>
                                            <Bar value={row.trip_count} max={maxTripCount} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('transportation.pages.reports.driver_utilization')}</h3>
                            {driverUtilization.length === 0 ? (
                                <p className="text-sm text-gray-500">No trips in this range.</p>
                            ) : (
                                <div className="space-y-4">
                                    {driverUtilization.map((row) => (
                                        <div key={row.driver_id}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="text-gray-900">{row.driver.name}</span>
                                                <span className="text-gray-500">{row.trip_count} trips</span>
                                            </div>
                                            <Bar value={row.trip_count} max={maxDriverTripCount} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('transportation.pages.reports.fuel_by_vehicle')}</h3>
                            {fuelCostByVehicle.length === 0 ? (
                                <p className="text-sm text-gray-500">No fuel logs in this range.</p>
                            ) : (
                                <div className="space-y-4">
                                    {fuelCostByVehicle.map((row) => (
                                        <div key={row.vehicle_id}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="text-gray-900">{row.vehicle.name} ({row.vehicle.plate_number})</span>
                                                <span className="text-gray-500">
                                                    Rp {Number(row.total_cost).toLocaleString()} · {row.total_liters} L
                                                    {row.avg_km_per_liter ? ` · ${Number(row.avg_km_per_liter).toFixed(1)} km/L` : ''}
                                                    {row.anomaly_count > 0 ? ` · ${row.anomaly_count} anomal${row.anomaly_count === 1 ? 'y' : 'ies'}` : ''}
                                                </span>
                                            </div>
                                            <Bar value={Number(row.total_cost)} max={maxFuelCost} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">{t('transportation.pages.reports.maintenance_by_vehicle')}</h3>
                            {maintenanceCostByVehicle.length === 0 ? (
                                <p className="text-sm text-gray-500">No completed maintenance in this range.</p>
                            ) : (
                                <div className="space-y-4">
                                    {maintenanceCostByVehicle.map((row) => (
                                        <div key={row.vehicle_id}>
                                            <div className="mb-1 flex justify-between text-sm">
                                                <span className="text-gray-900">{row.vehicle.name} ({row.vehicle.plate_number})</span>
                                                <span className="text-gray-500">Rp {Number(row.total_cost).toLocaleString()} · {row.log_count} logs</span>
                                            </div>
                                            <Bar value={Number(row.total_cost)} max={maxMaintenanceCost} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

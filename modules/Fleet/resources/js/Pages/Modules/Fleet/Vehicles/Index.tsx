import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import FleetNav from '../../../../FleetNav';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    brand: string | null;
    status: string;
    odometer_km: number;
}

interface PaginatedVehicles {
    data: Vehicle[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    vehicles: PaginatedVehicles;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

const STATUSES = ['active', 'maintenance', 'retired', 'out_of_service'];

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

export default function Index({ vehicles, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('fleet.vehicles.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('fleet.vehicles.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const openDeleteDialog = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setVehicleToDelete(null);
    };

    const confirmDelete = () => {
        if (!vehicleToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('fleet.vehicles.destroy', vehicleToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Transportation</h2>
                    {can.create && (
                        <Link href={prefixedRoute('fleet.vehicles.create')}>
                            <PrimaryButton>Add Vehicle</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Vehicles" />

            <FleetNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Search by name, plate, or brand..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-48"
                            value={filters.status || ''}
                            onChange={handleStatusFilter}
                            placeholder="All statuses"
                            options={[
                                { value: '', label: 'All statuses' },
                                ...STATUSES.map((status) => ({ value: status, label: status.replace('_', ' ') })),
                            ]}
                        />
                        <PrimaryButton type="submit">Search</PrimaryButton>
                    </form>

                    {vehicles.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No vehicles found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by adding a vehicle to the fleet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vehicle</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plate</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Odometer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {vehicles.data.map((vehicle) => (
                                            <tr key={vehicle.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                                                    {vehicle.brand && <div className="text-xs text-gray-500">{vehicle.brand}</div>}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{vehicle.plate_number}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-500">{vehicle.type}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{vehicle.odometer_km.toLocaleString()} km</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(vehicle.status)}`}>
                                                        {vehicle.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Link href={prefixedRoute('fleet.vehicles.show', vehicle.id)} className="text-gray-600 hover:text-gray-900">
                                                            View
                                                        </Link>
                                                        {can.update && (
                                                            <Link href={prefixedRoute('fleet.vehicles.edit', vehicle.id)} className="text-indigo-600 hover:text-indigo-900">
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => openDeleteDialog(vehicle)} className="text-red-600 hover:text-red-900">
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {vehicles.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(vehicles.current_page - 1) * vehicles.per_page + 1} to{' '}
                                        {Math.min(vehicles.current_page * vehicles.per_page, vehicles.total)} of {vehicles.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {vehicles.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title="Delete Vehicle"
                message={
                    vehicleToDelete
                        ? `Are you sure you want to delete "${vehicleToDelete.name}" (${vehicleToDelete.plate_number})? This action cannot be undone.`
                        : 'Are you sure you want to delete this vehicle?'
                }
            />
        </DynamicLayout>
    );
}

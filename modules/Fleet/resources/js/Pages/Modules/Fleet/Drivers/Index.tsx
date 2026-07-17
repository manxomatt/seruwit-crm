import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import TransportationNav from '../../../../TransportationNav';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    phone: string;
    status: string;
}

interface PaginatedDrivers {
    data: Driver[];
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
    drivers: PaginatedDrivers;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

const STATUSES = ['available', 'on_trip', 'off_duty', 'inactive'];

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'bg-green-100 text-green-800';
        case 'on_trip':
            return 'bg-blue-100 text-blue-800';
        case 'off_duty':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Index({ drivers, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('transportation.drivers.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('transportation.drivers.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const openDeleteDialog = (driver: Driver) => {
        setDriverToDelete(driver);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setDriverToDelete(null);
    };

    const confirmDelete = () => {
        if (!driverToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('transportation.drivers.destroy', driverToDelete.id), {
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
                        <Link href={prefixedRoute('transportation.drivers.create')}>
                            <PrimaryButton>Add Driver</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Drivers" />

            <TransportationNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Search by name, license, or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All statuses</option>
                            {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                    </form>

                    {drivers.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No drivers found</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by adding a driver.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">License</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {drivers.data.map((driver) => (
                                            <tr key={driver.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{driver.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{driver.license_number}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{driver.phone}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                                        {driver.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Link href={prefixedRoute('transportation.drivers.show', driver.id)} className="text-gray-600 hover:text-gray-900">
                                                            View
                                                        </Link>
                                                        {can.update && (
                                                            <Link href={prefixedRoute('transportation.drivers.edit', driver.id)} className="text-indigo-600 hover:text-indigo-900">
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => openDeleteDialog(driver)} className="text-red-600 hover:text-red-900">
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

                            {drivers.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(drivers.current_page - 1) * drivers.per_page + 1} to{' '}
                                        {Math.min(drivers.current_page * drivers.per_page, drivers.total)} of {drivers.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {drivers.links.map((link, index) => (
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
                title="Delete Driver"
                message={
                    driverToDelete
                        ? `Are you sure you want to delete "${driverToDelete.name}"? This action cannot be undone.`
                        : 'Are you sure you want to delete this driver?'
                }
            />
        </DynamicLayout>
    );
}

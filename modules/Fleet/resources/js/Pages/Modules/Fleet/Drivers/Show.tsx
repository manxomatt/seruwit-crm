import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FleetNav from '../../../../FleetNav';

interface Driver {
    id: number;
    name: string;
    license_number: string;
    license_type: string | null;
    license_expires_at: string | null;
    phone: string;
    email: string | null;
    status: string;
    photo_url: string | null;
    notes: string | null;
}

interface Props {
    driver: Driver;
    can: { update: boolean; delete: boolean };
}

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

export default function Show({ driver, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('fleet.drivers.destroy', driver.id), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{driver.name}</h2>
                    <div className="flex gap-2">
                        {can.update && (
                            <Link href={prefixedRoute('fleet.drivers.edit', driver.id)}>
                                <SecondaryButton>Edit</SecondaryButton>
                            </Link>
                        )}
                        <Link href={prefixedRoute('fleet.drivers.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={driver.name} />

            <FleetNav />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        {driver.photo_url && (
                            <img src={driver.photo_url} alt={driver.name} className="mb-6 h-32 w-32 rounded-full object-cover" />
                        )}
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">License Number</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_number}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">License Type</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_type || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(driver.status)}`}>
                                        {driver.status.replace('_', ' ')}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.phone}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.email || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">License Expiry</dt>
                                <dd className="mt-1 text-sm text-gray-900">{driver.license_expires_at || '—'}</dd>
                            </div>
                            {driver.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{driver.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {can.delete && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this driver</h3>
                                <p className="text-sm text-gray-500">This cannot be undone once confirmed.</p>
                            </div>
                            <button onClick={() => setShowDeleteDialog(true)} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Driver
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
                title="Delete Driver"
                message={`Are you sure you want to delete "${driver.name}"? This action cannot be undone.`}
            />
        </DynamicLayout>
    );
}

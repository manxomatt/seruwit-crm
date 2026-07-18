import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Product {
    id: number;
    code: string;
    name: string;
    unit: string;
}

interface OrderItem {
    id: number;
    quantity: string;
    notes: string | null;
    product: Product;
}

interface AssignableTrip {
    id: number;
    code: string;
    origin: string;
    destination: string;
    scheduled_at: string;
    vehicle: { id: number; name: string; plate_number: string } | null;
    driver: { id: number; name: string } | null;
}

interface Order {
    id: number;
    code: string;
    status: string;
    order_date: string;
    pickup_address: string;
    delivery_address: string;
    notes: string | null;
    confirmed_at: string | null;
    delivered_at: string | null;
    cancelled_reason: string | null;
    customer: { id: number; code: string; name: string };
    trip: {
        id: number;
        code: string;
        status: string;
        scheduled_at: string;
        vehicle: { id: number; name: string; plate_number: string };
        driver: { id: number; name: string };
    } | null;
    items: OrderItem[];
}

interface Props {
    order: Order;
    products: Product[];
    assignableTrips: AssignableTrip[];
    can: { create: boolean; update: boolean; delete: boolean };
}

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'confirmed':
            return 'bg-blue-100 text-blue-800';
        case 'assigned':
            return 'bg-indigo-100 text-indigo-800';
        case 'in_transit':
            return 'bg-yellow-100 text-yellow-800';
        case 'delivered':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

export default function Show({ order, products, assignableTrips, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const cancelForm = useForm({ cancelled_reason: '' });
    const itemForm = useForm({
        product_id: '',
        quantity: '',
        notes: '',
    });
    const assignForm = useForm({ trip_id: '' });

    const isDraft = order.status === 'draft';
    const isConfirmed = order.status === 'confirmed';
    const isAssigned = order.status === 'assigned';
    const hasSuratJalan = ['assigned', 'in_transit', 'delivered'].includes(order.status);
    const canUnassign = isAssigned && order.trip?.status === 'scheduled';

    const confirm = () => {
        router.post(prefixedRoute('orders.confirm', order.id), {}, { preserveScroll: true });
    };

    const unassign = () => {
        router.post(prefixedRoute('orders.unassign-trip', order.id), {}, { preserveScroll: true });
    };

    const submitCancel: FormEventHandler = (e) => {
        e.preventDefault();
        cancelForm.post(prefixedRoute('orders.cancel', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCancelModal(false);
                cancelForm.reset();
            },
        });
    };

    const submitItem: FormEventHandler = (e) => {
        e.preventDefault();
        itemForm.post(prefixedRoute('orders.items.store', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowItemModal(false);
                itemForm.reset();
            },
        });
    };

    const deleteItem = (id: number) => {
        router.delete(prefixedRoute('orders.items.destroy', [order.id, id]), { preserveScroll: true });
    };

    const submitAssign: FormEventHandler = (e) => {
        e.preventDefault();
        assignForm.post(prefixedRoute('orders.assign-trip', order.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAssignModal(false);
                assignForm.reset();
            },
        });
    };

    const deleteOrder = () => {
        router.delete(prefixedRoute('orders.destroy', order.id));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{order.code}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        {can.update && isDraft && (
                            <PrimaryButton onClick={confirm}>Confirm Order</PrimaryButton>
                        )}
                        {can.update && isConfirmed && (
                            <PrimaryButton onClick={() => setShowAssignModal(true)}>Assign to Trip</PrimaryButton>
                        )}
                        {can.update && canUnassign && (
                            <SecondaryButton onClick={unassign}>Unassign Trip</SecondaryButton>
                        )}
                        {hasSuratJalan && (
                            <a href={prefixedRoute('orders.surat-jalan', order.id)} target="_blank" rel="noreferrer">
                                <SecondaryButton type="button">Surat Jalan</SecondaryButton>
                            </a>
                        )}
                        {can.update && isDraft && (
                            <Link href={prefixedRoute('orders.edit', order.id)}>
                                <SecondaryButton type="button">Edit</SecondaryButton>
                            </Link>
                        )}
                        {can.update && (isDraft || isConfirmed) && (
                            <DangerButton onClick={() => setShowCancelModal(true)}>Cancel Order</DangerButton>
                        )}
                        <Link href={prefixedRoute('orders.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={order.code} />

            <div className="space-y-6">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    <Link href={prefixedRoute('customers.show', order.customer.id)} className="text-indigo-600 hover:text-indigo-900">
                                        {order.customer.name}
                                    </Link>{' '}
                                    ({order.customer.code})
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.order_date}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Confirmed At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.confirmed_at || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Pickup Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.pickup_address}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.delivery_address}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Delivered At</dt>
                                <dd className="mt-1 text-sm text-gray-900">{order.delivered_at || '—'}</dd>
                            </div>
                            {order.cancelled_reason && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Cancellation Reason</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.cancelled_reason}</dd>
                                </div>
                            )}
                            {order.notes && (
                                <div className="sm:col-span-3">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {order.trip && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">Trip</h3>
                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Code</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        <Link href={prefixedRoute('transportation.trips.show', order.trip.id)} className="text-indigo-600 hover:text-indigo-900">
                                            {order.trip.code}
                                        </Link>{' '}
                                        ({order.trip.status.replace('_', ' ')})
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Vehicle / Driver</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {order.trip.vehicle.name} ({order.trip.vehicle.plate_number}) / {order.trip.driver.name}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Scheduled At</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{order.trip.scheduled_at}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Items</h3>
                            {can.create && isDraft && (
                                <PrimaryButton onClick={() => setShowItemModal(true)}>Add Item</PrimaryButton>
                            )}
                        </div>
                        {order.items.length === 0 ? (
                            <p className="text-sm text-gray-500">No items yet. Add at least one item before confirming.</p>
                        ) : (
                            <ul className="space-y-3">
                                {order.items.map((item) => (
                                    <li key={item.id} className="flex items-start justify-between rounded-md border border-gray-200 p-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.product.name} ({item.product.code})
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} {item.product.unit}
                                                {item.notes ? ` — ${item.notes}` : ''}
                                            </p>
                                        </div>
                                        {can.delete && isDraft && (
                                            <button onClick={() => deleteItem(item.id)} className="text-sm text-red-600 hover:text-red-900">
                                                Delete
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {can.delete && isDraft && (
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Delete this order</h3>
                                <p className="text-sm text-gray-500">This cannot be undone once confirmed.</p>
                            </div>
                            <button onClick={deleteOrder} className="text-sm font-medium text-red-600 hover:text-red-900">
                                Delete Order
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal show={showItemModal} onClose={() => setShowItemModal(false)} maxWidth="md">
                <form onSubmit={submitItem} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Add Item</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="i_product_id" value="Product" />
                            <Select
                                id="i_product_id"
                                className="mt-1"
                                value={itemForm.data.product_id}
                                onChange={(value) => itemForm.setData('product_id', value)}
                                placeholder="Select a product"
                                options={products.map((product) => ({
                                    value: String(product.id),
                                    label: `${product.name} (${product.code})`,
                                }))}
                            />
                            <InputError message={itemForm.errors.product_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="i_quantity" value="Quantity" />
                            <TextInput id="i_quantity" type="number" step="0.01" min="0.01" className="mt-1 block w-full" value={itemForm.data.quantity} onChange={(e) => itemForm.setData('quantity', e.target.value)} required />
                            <InputError message={itemForm.errors.quantity} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="i_notes" value="Notes (optional)" />
                            <TextInput id="i_notes" className="mt-1 block w-full" value={itemForm.data.notes} onChange={(e) => itemForm.setData('notes', e.target.value)} />
                            <InputError message={itemForm.errors.notes} className="mt-2" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowItemModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={itemForm.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="md">
                <form onSubmit={submitAssign} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Assign to Trip</h3>
                    {assignableTrips.length === 0 ? (
                        <p className="text-sm text-gray-500">No scheduled trips available. Dispatch a trip first.</p>
                    ) : (
                        <div>
                            <InputLabel htmlFor="a_trip_id" value="Trip" />
                            <Select
                                id="a_trip_id"
                                className="mt-1"
                                value={assignForm.data.trip_id}
                                onChange={(value) => assignForm.setData('trip_id', value)}
                                placeholder="Select a scheduled trip"
                                options={assignableTrips.map((trip) => ({
                                    value: String(trip.id),
                                    label: `${trip.code} — ${trip.origin} → ${trip.destination} (${trip.vehicle?.name || '?'} / ${trip.driver?.name || '?'})`,
                                }))}
                            />
                            <InputError message={assignForm.errors.trip_id} className="mt-2" />
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowAssignModal(false)}>Cancel</SecondaryButton>
                        {assignableTrips.length > 0 && (
                            <PrimaryButton disabled={assignForm.processing}>Assign</PrimaryButton>
                        )}
                    </div>
                </form>
            </Modal>

            <Modal show={showCancelModal} onClose={() => setShowCancelModal(false)} maxWidth="md">
                <form onSubmit={submitCancel} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Cancel Order</h3>
                    <InputLabel htmlFor="cancelled_reason" value="Reason" />
                    <TextInput id="cancelled_reason" className="mt-1 block w-full" value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} required />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-2" />
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowCancelModal(false)}>Back</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>Confirm Cancellation</DangerButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}

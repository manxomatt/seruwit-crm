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
import { Head, router, useForm } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import BillingNav from '../../../../BillingNav';
import { formatMoney } from '@/utils/money';

interface Customer {
    id: number;
    code: string;
    name: string;
}

interface Tariff {
    id: number;
    customer_id: number | null;
    origin: string;
    destination: string;
    price: string;
    is_active: boolean;
    customer: Customer | null;
}

interface PaginatedTariffs {
    data: Tariff[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    tariffs: PaginatedTariffs;
    customers: Customer[];
    filters: { search: string | null; customer_id: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ tariffs, customers, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Tariff | null>(null);
    const [deleting, setDeleting] = useState<Tariff | null>(null);

    const form = useForm({
        customer_id: '',
        origin: '',
        destination: '',
        price: '',
        is_active: true,
    });

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (tariff: Tariff) => {
        setEditing(tariff);
        form.clearErrors();
        form.setData({
            customer_id: tariff.customer_id ? String(tariff.customer_id) : '',
            origin: tariff.origin,
            destination: tariff.destination,
            price: tariff.price,
            is_active: tariff.is_active,
        });
        setShowModal(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                form.reset();
            },
        };
        if (editing) {
            form.patch(prefixedRoute('billing.tariffs.update', editing.id), options);
        } else {
            form.post(prefixedRoute('billing.tariffs.store'), options);
        }
    };

    const confirmDelete = () => {
        if (!deleting) return;
        router.delete(prefixedRoute('billing.tariffs.destroy', deleting.id), {
            preserveScroll: true,
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('billing.tariffs.index'), {
            search: search || undefined,
            customer_id: filters.customer_id || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleCustomerFilter = (customerId: string) => {
        router.get(prefixedRoute('billing.tariffs.index'), {
            search: search || undefined,
            customer_id: customerId || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Billing</h2>
                    {can.create && <PrimaryButton onClick={openCreate}>New Tariff</PrimaryButton>}
                </div>
            }
        >
            <Head title="Tariffs" />

            <BillingNav />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Search by origin or destination..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select
                            className="w-56"
                            value={filters.customer_id || ''}
                            onChange={handleCustomerFilter}
                            placeholder="All customers"
                            options={[
                                { value: '', label: 'All customers' },
                                ...customers.map((customer) => ({ value: String(customer.id), label: customer.name })),
                            ]}
                        />
                        <PrimaryButton type="submit">Search</PrimaryButton>
                    </form>

                    {tariffs.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No tariffs found</h3>
                            <p className="mt-1 text-sm text-gray-500">Create a tariff so confirmed orders get priced automatically.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Route</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {tariffs.data.map((tariff) => (
                                            <tr key={tariff.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {tariff.origin} → {tariff.destination}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {tariff.customer ? tariff.customer.name : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Umum</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{formatMoney(tariff.price)}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tariff.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {tariff.is_active ? 'active' : 'inactive'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {can.update && (
                                                            <button onClick={() => openEdit(tariff)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => setDeleting(tariff)} className="text-red-600 hover:text-red-900">Delete</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {tariffs.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(tariffs.current_page - 1) * tariffs.per_page + 1} to{' '}
                                        {Math.min(tariffs.current_page * tariffs.per_page, tariffs.total)} of {tariffs.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {tariffs.links.map((link, index) => (
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

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="md">
                <form onSubmit={submit} className="p-6">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">{editing ? 'Edit Tariff' : 'New Tariff'}</h3>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="t_customer_id" value="Customer (kosongkan untuk tarif umum)" />
                            <Select
                                id="t_customer_id"
                                className="mt-1"
                                value={form.data.customer_id}
                                onChange={(value) => form.setData('customer_id', value)}
                                placeholder="Tarif umum"
                                options={[
                                    { value: '', label: 'Tarif umum' },
                                    ...customers.map((customer) => ({ value: String(customer.id), label: `${customer.name} (${customer.code})` })),
                                ]}
                            />
                            <InputError message={form.errors.customer_id} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="t_origin" value="Origin" />
                                <TextInput id="t_origin" className="mt-1 block w-full" value={form.data.origin} onChange={(e) => form.setData('origin', e.target.value)} required />
                                <InputError message={form.errors.origin} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="t_destination" value="Destination" />
                                <TextInput id="t_destination" className="mt-1 block w-full" value={form.data.destination} onChange={(e) => form.setData('destination', e.target.value)} required />
                                <InputError message={form.errors.destination} className="mt-2" />
                            </div>
                        </div>
                        <div>
                            <InputLabel htmlFor="t_price" value="Price (Rp)" />
                            <TextInput id="t_price" type="number" min={0} step="0.01" className="mt-1 block w-full" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                            <InputError message={form.errors.price} className="mt-2" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                checked={form.data.is_active}
                                onChange={(e) => form.setData('is_active', e.target.checked)}
                            />
                            Active
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setShowModal(false)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={form.processing}>Save</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={deleting !== null} onClose={() => setDeleting(null)} maxWidth="sm">
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Delete Tariff</h3>
                    <p className="text-sm text-gray-500">
                        Delete the tariff {deleting?.origin} → {deleting?.destination}? Existing charges keep their amounts.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setDeleting(null)}>Cancel</SecondaryButton>
                        <DangerButton onClick={confirmDelete}>Delete</DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

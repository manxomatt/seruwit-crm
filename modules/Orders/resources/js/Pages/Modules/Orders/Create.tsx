import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Customer {
    id: number;
    code: string;
    name: string;
}

interface Props {
    customers: Customer[];
}

export default function Create({ customers }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        order_date: '',
        pickup_address: '',
        delivery_address: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('orders.store'));
    };

    return (
        <DynamicLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">New Order</h2>}
        >
            <Head title="New Order" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={submit} className="max-w-2xl space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="customer_id" value="Customer" />
                                <Select
                                    id="customer_id"
                                    className="mt-1"
                                    value={data.customer_id}
                                    onChange={(value) => setData('customer_id', value)}
                                    placeholder="Select a customer"
                                    options={customers.map((customer) => ({
                                        value: String(customer.id),
                                        label: `${customer.name} (${customer.code})`,
                                    }))}
                                />
                                <InputError message={errors.customer_id} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="order_date" value="Order Date" />
                                <TextInput id="order_date" type="date" className="mt-1 block w-full" value={data.order_date} onChange={(e) => setData('order_date', e.target.value)} required />
                                <InputError message={errors.order_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="pickup_address" value="Pickup Address" />
                                <TextInput id="pickup_address" className="mt-1 block w-full" value={data.pickup_address} onChange={(e) => setData('pickup_address', e.target.value)} required />
                                <InputError message={errors.pickup_address} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="delivery_address" value="Delivery Address" />
                                <TextInput id="delivery_address" className="mt-1 block w-full" value={data.delivery_address} onChange={(e) => setData('delivery_address', e.target.value)} required />
                                <InputError message={errors.delivery_address} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Notes (optional)" />
                            <textarea id="notes" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                            <InputError message={errors.notes} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={processing}>Create Order</PrimaryButton>
                            <Link href={prefixedRoute('orders.index')}>
                                <SecondaryButton type="button">Cancel</SecondaryButton>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

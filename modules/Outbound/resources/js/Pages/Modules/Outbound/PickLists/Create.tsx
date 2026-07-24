import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import OutboundNav from '../../../../OutboundNav';

interface Order {
    id: number;
    code: string;
    status: string;
    order_date: string;
    items_count: number;
    partner: { id: number; name: string; code: string };
}

interface Warehouse {
    id: number;
    name: string;
}

interface Props {
    orders: Order[];
    warehouses: Warehouse[];
    selectedOrderId: number | null;
}

export default function Create({ orders, warehouses, selectedOrderId }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, post, processing, errors } = useForm({
        delivery_order_id: selectedOrderId ? String(selectedOrderId) : '',
        warehouse_id: warehouses[0] ? String(warehouses[0].id) : '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('outbound.pick-lists.store'));
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">Generate Pick List</h2>}>
            <Head title="Generate Pick List" />
            <div className="py-6">
                <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <OutboundNav />

                    <form onSubmit={submit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
                        <div>
                            <InputLabel value="Delivery Order *" />
                            <select
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.delivery_order_id}
                                onChange={(e) => setData('delivery_order_id', e.target.value)}
                            >
                                <option value="">— pilih DO —</option>
                                {orders.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.code} · {o.partner.name} · {o.items_count} item · {o.status}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.delivery_order_id} className="mt-2" />
                            {orders.length === 0 && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Tidak ada DO eligible (confirmed/assigned/in_transit tanpa pick list aktif).
                                </p>
                            )}
                        </div>

                        <div>
                            <InputLabel value="Gudang sumber *" />
                            <select
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.warehouse_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value="Catatan" />
                            <textarea
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={2}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('outbound.pick-lists.index')}>
                                <SecondaryButton type="button">Batal</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing || !data.delivery_order_id}>Generate</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

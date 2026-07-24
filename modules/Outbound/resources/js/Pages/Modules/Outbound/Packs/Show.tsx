import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link, router } from '@inertiajs/react';
import OutboundNav from '../../../../OutboundNav';

interface Pack {
    id: number;
    code: string;
    label_code: string;
    status: string;
    weight_kg: string | null;
    sealed_at: string | null;
    packed_at: string | null;
    pick_list: {
        id: number;
        code: string;
        delivery_order: { id: number; code: string };
        warehouse: { id: number; name: string };
    };
    items: Array<{
        id: number;
        quantity: string;
        pick_list_item: {
            id: number;
            batch_number: string | null;
            product: { id: number; name: string; sku: string | null };
        };
    }>;
    packer: { id: number; name: string } | null;
}

interface Props {
    pack: Pack;
    can: { pack: boolean; dispatch: boolean };
}

export default function Show({ pack, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-800">{pack.code}</h2>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize">{pack.status}</span>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('outbound.packs.label', pack.id)}>
                            <SecondaryButton type="button">Print Label</SecondaryButton>
                        </Link>
                        {can.pack && pack.status === 'open' && (
                            <PrimaryButton
                                onClick={() => router.post(prefixedRoute('outbound.packs.seal', pack.id), {}, { preserveScroll: true })}
                            >
                                Seal Pack
                            </PrimaryButton>
                        )}
                        <Link href={prefixedRoute('outbound.pick-lists.show', pack.pick_list.id)}>
                            <SecondaryButton type="button">Back to Pick List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={pack.code} />
            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <OutboundNav />

                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-gray-500">Label</p>
                            <p className="font-mono text-lg font-semibold tracking-wide">{pack.label_code}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pick List / DO</p>
                            <p className="font-medium">
                                {pack.pick_list.code} · {pack.pick_list.delivery_order.code}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Warehouse</p>
                            <p className="font-medium">{pack.pick_list.warehouse.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Weight</p>
                            <p className="font-medium">{pack.weight_kg ? `${pack.weight_kg} kg` : '—'}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Batch</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pack.items.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-2 font-medium">{row.pick_list_item.product.name}</td>
                                        <td className="px-4 py-2 text-gray-600">{row.pick_list_item.batch_number || '—'}</td>
                                        <td className="px-4 py-2 text-right tabular-nums">{row.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

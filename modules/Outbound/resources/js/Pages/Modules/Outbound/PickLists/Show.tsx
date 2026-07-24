import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import OutboundNav from '../../../../OutboundNav';

interface Location {
    id: number;
    name: string;
    code: string;
    type: string;
}

interface PickItem {
    id: number;
    quantity_requested: string;
    quantity_picked: string;
    status: string;
    batch_number: string | null;
    suggested_batch_number: string | null;
    expiry_date: string | null;
    suggested_expiry_date: string | null;
    product: { id: number; name: string; sku: string | null; unit: string | null };
    suggested_location: { id: number; name: string; code: string } | null;
    location: { id: number; name: string; code: string } | null;
}

interface Pack {
    id: number;
    code: string;
    label_code: string;
    status: string;
}

interface PickList {
    id: number;
    code: string;
    status: string;
    notes: string | null;
    delivery_order: { id: number; code: string; status: string; partner: { id: number; name: string } };
    warehouse: { id: number; name: string };
    items: PickItem[];
    packs: Pack[];
}

interface Props {
    pickList: PickList;
    locations: Location[];
    can: {
        create: boolean;
        delete: boolean;
        pick: boolean;
        pack: boolean;
        dispatch: boolean;
    };
}

export default function Show({ pickList, locations, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [drafts, setDrafts] = useState<Record<number, { qty: string; location_id: string; batch_number: string }>>(() => {
        const initial: Record<number, { qty: string; location_id: string; batch_number: string }> = {};
        pickList.items.forEach((item) => {
            initial[item.id] = {
                qty: item.quantity_picked !== '0.00' ? item.quantity_picked : item.quantity_requested,
                location_id: String(item.location?.id ?? item.suggested_location?.id ?? ''),
                batch_number: item.batch_number ?? item.suggested_batch_number ?? '',
            };
        });
        return initial;
    });

    const canPick = can.pick && ['open', 'picking'].includes(pickList.status);
    const canComplete = can.pick && ['open', 'picking'].includes(pickList.status);
    const canPack = can.pack && ['picked', 'packing', 'packed'].includes(pickList.status);
    const canDispatch = can.dispatch && pickList.status === 'packed';

    const confirmItem = (item: PickItem) => {
        const draft = drafts[item.id];
        router.post(
            prefixedRoute('outbound.pick-lists.items.confirm', [pickList.id, item.id]),
            {
                quantity_picked: Number(draft.qty),
                location_id: draft.location_id ? Number(draft.location_id) : null,
                batch_number: draft.batch_number || null,
                expiry_date: item.suggested_expiry_date,
            },
            { preserveScroll: true },
        );
    };

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-800">{pickList.code}</h2>
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                            {pickList.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canComplete && (
                            <PrimaryButton
                                onClick={() =>
                                    router.post(prefixedRoute('outbound.pick-lists.complete-picking', pickList.id), {}, { preserveScroll: true })
                                }
                            >
                                Complete Picking
                            </PrimaryButton>
                        )}
                        {canPack && (
                            <Link href={prefixedRoute('outbound.packs.create', pickList.id)}>
                                <SecondaryButton type="button">Create Pack</SecondaryButton>
                            </Link>
                        )}
                        {canDispatch && (
                            <PrimaryButton
                                onClick={() => {
                                    if (confirm('Dispatch & deduct stock?')) {
                                        router.post(prefixedRoute('outbound.pick-lists.dispatch', pickList.id), {}, { preserveScroll: true });
                                    }
                                }}
                            >
                                Dispatch
                            </PrimaryButton>
                        )}
                        {can.delete && pickList.status !== 'dispatched' && pickList.status !== 'cancelled' && (
                            <DangerButton
                                onClick={() => {
                                    if (confirm('Cancel this pick list?')) {
                                        router.post(prefixedRoute('outbound.pick-lists.cancel', pickList.id));
                                    }
                                }}
                            >
                                Cancel
                            </DangerButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={pickList.code} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <OutboundNav />

                    <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-gray-500">Delivery Order</p>
                            <p className="font-medium">
                                {pickList.delivery_order.code} · {pickList.delivery_order.partner.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Warehouse</p>
                            <p className="font-medium">{pickList.warehouse.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">DO Status</p>
                            <p className="font-medium capitalize">{pickList.delivery_order.status.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold">Pick lines</div>
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Req</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Suggest</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Pick Qty</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Batch</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pickList.items.map((item) => {
                                    const draft = drafts[item.id];
                                    return (
                                        <tr key={item.id}>
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{item.product.name}</div>
                                                <div className="text-xs text-gray-500">{item.product.sku || '—'}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">{item.quantity_requested}</td>
                                            <td className="px-3 py-2 text-xs text-gray-600">
                                                {item.suggested_location?.code || '—'}
                                                {item.suggested_batch_number ? ` · ${item.suggested_batch_number}` : ''}
                                            </td>
                                            <td className="px-3 py-2">
                                                {canPick ? (
                                                    <TextInput
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-24"
                                                        value={draft?.qty ?? ''}
                                                        onChange={(e) =>
                                                            setDrafts((d) => ({
                                                                ...d,
                                                                [item.id]: { ...d[item.id], qty: e.target.value },
                                                            }))
                                                        }
                                                    />
                                                ) : (
                                                    <span className="tabular-nums">{item.quantity_picked}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {canPick ? (
                                                    <select
                                                        className="w-36 rounded-md border-gray-300 text-sm shadow-sm"
                                                        value={draft?.location_id ?? ''}
                                                        onChange={(e) =>
                                                            setDrafts((d) => ({
                                                                ...d,
                                                                [item.id]: { ...d[item.id], location_id: e.target.value },
                                                            }))
                                                        }
                                                    >
                                                        <option value="">—</option>
                                                        {locations.map((loc) => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    item.location?.code || '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {canPick ? (
                                                    <TextInput
                                                        className="w-28"
                                                        value={draft?.batch_number ?? ''}
                                                        onChange={(e) =>
                                                            setDrafts((d) => ({
                                                                ...d,
                                                                [item.id]: { ...d[item.id], batch_number: e.target.value },
                                                            }))
                                                        }
                                                    />
                                                ) : (
                                                    item.batch_number || '—'
                                                )}
                                            </td>
                                            <td className="px-3 py-2 capitalize">{item.status}</td>
                                            <td className="px-3 py-2 text-right">
                                                {canPick && (
                                                    <button
                                                        type="button"
                                                        className="text-sm font-medium text-indigo-600 hover:underline"
                                                        onClick={() => confirmItem(item)}
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {pickList.packs.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold">Packs</div>
                            <ul className="divide-y divide-gray-100">
                                {pickList.packs.map((pack) => (
                                    <li key={pack.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                        <div>
                                            <Link
                                                href={prefixedRoute('outbound.packs.show', pack.id)}
                                                className="font-medium text-indigo-600 hover:underline"
                                            >
                                                {pack.code}
                                            </Link>
                                            <span className="ml-2 text-gray-500">{pack.label_code}</span>
                                            <span className="ml-2 capitalize text-gray-600">· {pack.status}</span>
                                        </div>
                                        <Link href={prefixedRoute('outbound.packs.label', pack.id)}>
                                            <SecondaryButton type="button">Label</SecondaryButton>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

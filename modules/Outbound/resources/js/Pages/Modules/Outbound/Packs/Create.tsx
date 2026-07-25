import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import OutboundNav from '../../../../OutboundNav';

interface Line {
    id: number;
    product: { id: number; name: string; sku: string | null };
    quantity_picked: number;
    quantity_remaining: number;
    batch_number: string | null;
}

interface Props {
    pickList: { id: number; code: string; status: string };
    deliveryOrder: { id: number; code: string };
    lines: Line[];
}

export default function Create({ pickList, deliveryOrder, lines }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [qty, setQty] = useState<Record<number, string>>(() => {
        const init: Record<number, string> = {};
        lines.forEach((line) => {
            init[line.id] = line.quantity_remaining > 0 ? String(line.quantity_remaining) : '';
        });
        return init;
    });
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');

    const packable = useMemo(
        () =>
            lines
                .filter((line) => parseFloat(qty[line.id] || '0') > 0)
                .map((line) => ({
                    pick_list_item_id: line.id,
                    quantity: Number(qty[line.id]),
                })),
        [lines, qty],
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.post(prefixedRoute('outbound.packs.store', pickList.id), {
            weight_kg: weight ? Number(weight) : null,
            notes: notes || null,
            items: packable,
        });
    };

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    {t('outbound.packs.create.title', { code: pickList.code })}
                </h2>
            }
        >
            <Head title={t('outbound.packs.create.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <OutboundNav />
                    <p className="text-sm text-gray-600">{t('outbound.packs.create.hint', { code: deliveryOrder.code })}</p>

                    <form onSubmit={submit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">
                        <div className="overflow-hidden rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.packs.create.columns.product')}</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('outbound.packs.create.columns.remaining')}</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('outbound.packs.create.columns.pack_qty')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lines.map((line) => (
                                        <tr key={line.id}>
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{line.product.name}</div>
                                                <div className="text-xs text-gray-500">{line.batch_number || '—'}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">{line.quantity_remaining}</td>
                                            <td className="px-3 py-2 text-right">
                                                <TextInput
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={line.quantity_remaining}
                                                    className="ml-auto w-28 text-right"
                                                    value={qty[line.id] ?? ''}
                                                    onChange={(e) => setQty((q) => ({ ...q, [line.id]: e.target.value }))}
                                                    disabled={line.quantity_remaining <= 0}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel value={t('outbound.packs.create.weight_kg')} />
                                <TextInput
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel value={t('outbound.packs.create.notes')} />
                                <TextInput className="mt-1 block w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Link href={prefixedRoute('outbound.pick-lists.show', pickList.id)}>
                                <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={packable.length === 0}>{t('outbound.actions.create_pack_label')}</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

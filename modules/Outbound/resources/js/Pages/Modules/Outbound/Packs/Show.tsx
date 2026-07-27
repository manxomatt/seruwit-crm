import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{pack.code}</h2>
                        <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                            {t(`outbound.pack_status.${pack.status}`, undefined, pack.status)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('outbound.packs.label', pack.id)}>
                            <SecondaryButton type="button">{t('outbound.actions.print_label')}</SecondaryButton>
                        </Link>
                        {can.pack && pack.status === 'open' && (
                            <PrimaryButton
                                onClick={() => router.post(prefixedRoute('outbound.packs.seal', pack.id), {}, { preserveScroll: true })}
                            >
                                {t('outbound.actions.seal_pack')}
                            </PrimaryButton>
                        )}
                        <Link href={prefixedRoute('outbound.pick-lists.show', pack.pick_list.id)}>
                            <SecondaryButton type="button">{t('outbound.actions.back_to_pick_list')}</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={pack.code} />

            <OutboundNav />

            <div className="mb-6 grid gap-4 overflow-hidden bg-white p-5 shadow-sm sm:grid-cols-2 sm:rounded-lg">
                <div>
                    <p className="text-xs text-gray-500">{t('outbound.packs.show.label')}</p>
                    <p className="font-mono text-lg font-semibold tracking-wide">{pack.label_code}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('outbound.packs.show.pick_list_do')}</p>
                    <p className="font-medium">
                        {pack.pick_list.code} · {pack.pick_list.delivery_order.code}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('outbound.packs.show.warehouse')}</p>
                    <p className="font-medium">{pack.pick_list.warehouse.name}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">{t('outbound.packs.show.weight')}</p>
                    <p className="font-medium">
                        {pack.weight_kg ? t('outbound.packs.show.weight_value', { weight: pack.weight_kg }) : '—'}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.packs.show.columns.product')}</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.packs.show.columns.batch')}</th>
                            <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('outbound.packs.show.columns.qty')}</th>
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
        </DynamicLayout>
    );
}

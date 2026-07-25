import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';

interface Pack {
    id: number;
    code: string;
    label_code: string;
    weight_kg: string | null;
    pick_list: {
        code: string;
        delivery_order: {
            code: string;
            delivery_address: string;
            partner: { id: number; name: string };
        };
    };
    items: Array<{
        id: number;
        quantity: string;
        pick_list_item: {
            product: { id: number; name: string; sku: string | null };
            batch_number: string | null;
        };
    }>;
}

interface Props {
    pack: Pack;
}

export default function Label({ pack }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <div className="min-h-screen bg-white p-8 text-gray-900 print:p-4">
            <Head title={t('outbound.packs.label.title', { code: pack.label_code })} />
            <div className="mx-auto max-w-md border-2 border-gray-900 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{t('outbound.packs.label.shipping_label')}</p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-wider">{pack.label_code}</p>
                <p className="mt-1 text-sm text-gray-600">
                    {pack.code} · {pack.pick_list.code}
                </p>

                <div className="mt-6 border-t border-gray-300 pt-4">
                    <p className="text-xs text-gray-500">{t('outbound.packs.label.ship_to')}</p>
                    <p className="text-lg font-semibold">{pack.pick_list.delivery_order.partner.name}</p>
                    <p className="mt-1 text-sm text-gray-700">{pack.pick_list.delivery_order.delivery_address}</p>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('outbound.packs.label.do', { code: pack.pick_list.delivery_order.code })}
                    </p>
                </div>

                <div className="mt-6 border-t border-gray-300 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('outbound.packs.label.contents')}</p>
                    <ul className="space-y-1 text-sm">
                        {pack.items.map((row) => (
                            <li key={row.id} className="flex justify-between gap-3">
                                <span>
                                    {row.pick_list_item.product.name}
                                    {row.pick_list_item.batch_number ? ` (${row.pick_list_item.batch_number})` : ''}
                                </span>
                                <span className="tabular-nums">{row.quantity}</span>
                            </li>
                        ))}
                    </ul>
                    {pack.weight_kg && (
                        <p className="mt-3 text-sm text-gray-600">
                            {t('outbound.packs.label.weight', { weight: pack.weight_kg })}
                        </p>
                    )}
                </div>

                <div className="mt-8 flex justify-center print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        {t('outbound.actions.print')}
                    </button>
                </div>
            </div>
        </div>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import OutboundNav from '../../../../OutboundNav';

interface PickList {
    id: number;
    code: string;
    status: string;
    generated_at: string | null;
    items_count: number;
    delivery_order: { id: number; code: string; status: string; partner: { id: number; name: string } };
    warehouse: { id: number; name: string };
}

interface Props {
    pickLists: {
        data: PickList[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { status?: string; search?: string };
    can: { create: boolean };
}

const statusBadge = (status: string): string => {
    switch (status) {
        case 'open':
            return 'bg-gray-100 text-gray-700';
        case 'picking':
            return 'bg-blue-100 text-blue-800';
        case 'picked':
            return 'bg-sky-100 text-sky-800';
        case 'packing':
            return 'bg-amber-100 text-amber-800';
        case 'packed':
            return 'bg-violet-100 text-violet-800';
        case 'dispatched':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export default function Index({ pickLists, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('outbound.pick-lists.index'), { search, status: filters.status }, { preserveState: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{t('outbound.pick_lists.index.head')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('outbound.pick-lists.create')}>
                            <PrimaryButton>{t('outbound.pick_lists.index.generate')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('outbound.pick_lists.index.title')} />
            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <OutboundNav />

                    <form onSubmit={submit} className="flex gap-2">
                        <TextInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('outbound.pick_lists.index.search_placeholder')}
                            className="max-w-sm"
                        />
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.pick_list')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.do')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.partner')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.warehouse')}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.lines')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pickLists.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                            {t('outbound.pick_lists.index.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    pickLists.data.map((pl) => (
                                        <tr key={pl.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('outbound.pick-lists.show', pl.id)}
                                                    className="font-medium text-indigo-600 hover:underline"
                                                >
                                                    {pl.code}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{pl.delivery_order.code}</td>
                                            <td className="px-4 py-3">{pl.delivery_order.partner.name}</td>
                                            <td className="px-4 py-3">{pl.warehouse.name}</td>
                                            <td className="px-4 py-3 text-right tabular-nums">{pl.items_count}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(pl.status)}`}>
                                                    {t(`outbound.pick_list_status.${pl.status}`, undefined, pl.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

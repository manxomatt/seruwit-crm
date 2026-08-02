import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import OutboundNav from '../../../../OutboundNav';
import PageHeader from '@/Components/PageHeader';

interface PickList {
    id: number;
    code: string;
    status: string;
    generated_at: string | null;
    items_count: number;
    delivery_order: { id: number; code: string; status: string; partner: { id: number; name: string } };
    warehouse: { id: number; name: string };
}

interface PaginatedPickLists {
    data: PickList[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    pickLists: PaginatedPickLists;
    filters: { status?: string; search?: string };
    can: { create: boolean };
}

const STATUSES = ['open', 'picking', 'picked', 'packing', 'packed', 'dispatched', 'cancelled'] as const;

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

function statusBadgeClass(status: string): string {
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
}

export default function Index({ pickLists, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (overrides: Record<string, string>): void => {
        router.get(
            prefixedRoute('outbound.pick-lists.index'),
            {
                status: overrides.status !== undefined ? overrides.status || undefined : filters.status || undefined,
                search: overrides.search !== undefined ? overrides.search || undefined : search || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('outbound.pick_lists.index.head')}
                    actions={can.create && (
                        <Link href={prefixedRoute('outbound.pick-lists.create')}>
                            <PrimaryButton>{t('outbound.pick_lists.index.generate')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('outbound.pick_lists.index.title')} />

            <OutboundNav />

            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('outbound.pick_lists.index.search_placeholder')}
                        className="w-56"
                    />
                    <button
                        type="submit"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        {t('common.search')}
                    </button>
                </form>
                <Select
                    className="min-w-[12rem]"
                    value={filters.status || ''}
                    onChange={(value) => applyFilters({ status: value })}
                    placeholder={t('outbound.pick_lists.index.all_statuses')}
                    options={[
                        { value: '', label: t('outbound.pick_lists.index.all_statuses') },
                        ...STATUSES.map((status) => ({
                            value: status,
                            label: t(`outbound.pick_list_status.${status}`, undefined, status),
                        })),
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.pick_list')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.do')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.partner')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.warehouse')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.lines')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('outbound.pick_lists.index.columns.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pickLists.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
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
                                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(pl.status)}`}>
                                            {t(`outbound.pick_list_status.${pl.status}`, undefined, pl.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('outbound.pick-lists.show', pl.id)}
                                            className="inline-flex text-gray-600 hover:text-gray-900"
                                            title={t('common.view')}
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {pickLists.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (pickLists.current_page - 1) * pickLists.per_page + 1,
                                to: Math.min(pickLists.current_page * pickLists.per_page, pickLists.total),
                                total: pickLists.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {pickLists.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
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
            </div>
        </DynamicLayout>
    );
}

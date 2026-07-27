import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PosLayout from '../../../../PosLayout';

interface SaleRow {
    id: number;
    code: string;
    status: string;
    grand_total: string | number;
    sold_at: string;
    warehouse: { id: number; name: string };
    cashier: { id: number; name: string } | null;
    payments: Array<{ method: string; amount: string | number }>;
}

interface Paginated {
    data: SaleRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    sales: Paginated;
    stores: Array<{ id: number; name: string }>;
    filters: {
        status?: string | null;
        warehouse_id?: number | null;
        search?: string | null;
        date?: string | null;
    };
    can: { void: boolean; sell: boolean };
}

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

function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);
}

export default function Index({ sales, stores, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (overrides: Record<string, string>): void => {
        router.get(
            prefixedRoute('pos.sales.index'),
            {
                status: overrides.status !== undefined ? overrides.status || undefined : filters.status || undefined,
                warehouse_id:
                    overrides.warehouse_id !== undefined
                        ? overrides.warehouse_id || undefined
                        : filters.warehouse_id || undefined,
                search: overrides.search !== undefined ? overrides.search || undefined : search || undefined,
                date: overrides.date !== undefined ? overrides.date || undefined : filters.date || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    return (
        <PosLayout title={t('pos.sales.index.head')}>
            <Head title={t('pos.sales.index.title')} />

            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('pos.sales.index.search_placeholder')}
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
                    placeholder={t('pos.sales.index.all_statuses')}
                    options={[
                        { value: '', label: t('pos.sales.index.all_statuses') },
                        { value: 'completed', label: t('pos.sale_status.completed') },
                        { value: 'voided', label: t('pos.sale_status.voided') },
                    ]}
                />
                <Select
                    className="min-w-[14rem]"
                    value={filters.warehouse_id ? String(filters.warehouse_id) : ''}
                    onChange={(value) => applyFilters({ warehouse_id: value })}
                    placeholder={t('pos.sales.index.all_stores')}
                    maxVisibleOptions={10}
                    options={[
                        { value: '', label: t('pos.sales.index.all_stores') },
                        ...stores.map((store) => ({ value: String(store.id), label: store.name })),
                    ]}
                />
                <TextInput
                    type="date"
                    value={filters.date || ''}
                    onChange={(e) => applyFilters({ date: e.target.value })}
                    className="w-40"
                />
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.code')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.store')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.cashier')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.total')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.method')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.sold_at')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('pos.sales.index.columns.status')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sales.data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                    {t('pos.sales.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            sales.data.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-3 font-medium">{sale.code}</td>
                                    <td className="px-4 py-3">{sale.warehouse?.name}</td>
                                    <td className="px-4 py-3">{sale.cashier?.name}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(Number(sale.grand_total))}</td>
                                    <td className="px-4 py-3">
                                        {sale.payments[0]
                                            ? t(`pos.payment_methods.${sale.payments[0].method}`, undefined, sale.payments[0].method)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {sale.sold_at ? new Date(sale.sold_at).toLocaleString('id-ID') : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                sale.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : sale.status === 'voided'
                                                      ? 'bg-red-100 text-red-700'
                                                      : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {t(`pos.sale_status.${sale.status}`, undefined, sale.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('pos.sales.show', sale.id)}
                                            className="inline-flex text-[var(--pos-accent)] hover:opacity-80"
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {sales.links.length > 3 && (
                <div className="mt-4 flex flex-wrap gap-1">
                    {sales.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url || '#'}
                            preserveState
                            className={`rounded-md px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-[var(--pos-accent)] text-white'
                                    : link.url
                                      ? 'bg-white text-gray-700 hover:bg-slate-50'
                                      : 'cursor-not-allowed bg-slate-100 text-gray-400'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </PosLayout>
    );
}

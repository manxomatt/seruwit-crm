import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Select, { SelectOption } from '@/Components/Select';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler, useMemo } from 'react';

interface PaymentOrder {
    id: number;
    tenant: { id: string; name: string };
    plan: { id: number; name: string };
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    currency: string;
    expires_at: string;
    created_at: string;
}

interface PaginatedPaymentOrders {
    data: PaymentOrder[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
    status: string | null;
}

interface Props {
    paymentOrders: PaginatedPaymentOrders;
    filters: Filters;
}

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
    pending:               { dot: 'bg-slate-400',              badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
    awaiting_confirmation: { dot: 'bg-amber-500 animate-pulse', badge: 'bg-amber-100 text-amber-800 ring-amber-200' },
    confirmed:             { dot: 'bg-emerald-500',             badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
    rejected:              { dot: 'bg-red-500',                 badge: 'bg-red-100 text-red-800 ring-red-200' },
    expired:               { dot: 'bg-slate-300',               badge: 'bg-slate-100 text-slate-500 ring-slate-200' },
    cancelled:             { dot: 'bg-slate-300',               badge: 'bg-slate-100 text-slate-500 ring-slate-200' },
};

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const styles = STATUS_STYLES[status] ?? { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 ring-slate-200' };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            {t(`payment_orders.statuses.${status}`, {}, status)}
        </span>
    );
}

function Pagination({ links, total, from, to }: { links: PaginatedPaymentOrders['links']; total: number; from: number | null; to: number | null }) {
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    if (links.length <= 3) return null;

    const prev = links[0];
    const next = links[links.length - 1];
    const pages = links.slice(1, -1);

    const countLabel = from && to
        ? t('payment_orders.index.showing')
            .replace(':from', String(from))
            .replace(':to', String(to))
            .replace(':total', total.toLocaleString(localeTag))
        : t('payment_orders.index.showing_count').replace(':total', total.toLocaleString(localeTag));

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row">
            <p className="text-sm text-slate-500">{countLabel}</p>

            <div className="flex items-center gap-1">
                {prev.url ? (
                    <Link
                        href={prev.url}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        preserveScroll
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                    </Link>
                ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}

                {pages.map((link, i) => (
                    link.url ? (
                        <Link
                            key={i}
                            href={link.url}
                            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-1 text-sm font-medium transition ${
                                link.active
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            preserveScroll
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span key={i} className="flex h-8 min-w-[2rem] items-center justify-center px-1 text-sm text-slate-400">
                            …
                        </span>
                    )
                ))}

                {next.url ? (
                    <Link
                        href={next.url}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        preserveScroll
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </Link>
                ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}
            </div>
        </div>
    );
}

export default function PaymentOrdersIndex({ paymentOrders, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const statusOptions: SelectOption[] = useMemo(() => [
        { value: 'pending',               label: t('payment_orders.statuses.pending') },
        { value: 'awaiting_confirmation', label: t('payment_orders.statuses.awaiting_confirmation') },
        { value: 'confirmed',             label: t('payment_orders.statuses.confirmed') },
        { value: 'rejected',              label: t('payment_orders.statuses.rejected') },
        { value: 'expired',               label: t('payment_orders.statuses.expired') },
        { value: 'cancelled',             label: t('payment_orders.statuses.cancelled') },
    ], [t]);

    const applyFilters = (overrides: { search?: string; status?: string } = {}) => {
        const s = overrides.search !== undefined ? overrides.search : search;
        const st = overrides.status !== undefined ? overrides.status : status;
        router.get(prefixedRoute('payment-orders.index'), {
            ...(s ? { search: s } : {}),
            ...(st ? { status: st } : {}),
        }, { preserveState: true, replace: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const handleStatusChange = (val: string) => {
        setStatus(val);
        applyFilters({ status: val });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        router.get(prefixedRoute('payment-orders.index'), {}, { replace: true });
    };

    const hasFilters = Boolean(filters.search || filters.status);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('payment_orders.title')}
                    description={t('payment_orders.description')}
                />
            }
        >
            <Head title={t('payment_orders.title')} />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4">
                    <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
                        <div className="relative min-w-[220px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder={t('payment_orders.index.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="block w-full rounded-xl border-slate-200 py-2 pl-9 pr-3 text-sm shadow-none focus:border-teal-400 focus:ring-teal-400"
                            />
                        </div>
                        <button type="submit" className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                            {t('payment_orders.index.search_button')}
                        </button>
                    </form>

                    <div className="flex items-center gap-2">
                        <Select
                            value={status}
                            onChange={handleStatusChange}
                            options={statusOptions}
                            placeholder={t('payment_orders.index.status_all')}
                            searchable={false}
                            className="min-w-[220px]"
                        />

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                            >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                                {t('payment_orders.index.reset')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {paymentOrders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                            </svg>
                        </span>
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            {hasFilters ? t('payment_orders.index.empty_filtered') : t('payment_orders.index.empty_all')}
                        </p>
                        {hasFilters && (
                            <button onClick={clearFilters} className="mt-2 text-sm text-teal-600 hover:text-teal-800">
                                {t('payment_orders.index.clear_filter')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.number')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.tenant')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.plan')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.total')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.status')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{t('payment_orders.index.columns.date')}</th>
                                    <th className="w-12 px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paymentOrders.data.map((order) => (
                                    <tr key={order.id} className="group transition hover:bg-slate-50/70">
                                        <td className="px-6 py-3.5 text-sm font-mono text-slate-400">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="text-sm font-medium text-slate-800">{order.tenant.name}</div>
                                            <div className="text-xs text-slate-400 capitalize">
                                                {t(`payment_orders.types.${order.type}`, {}, order.type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-slate-600">{order.plan.name}</td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="font-mono text-sm font-semibold tabular-nums text-slate-800">
                                                {'Rp ' + Number(order.total_amount).toLocaleString('id-ID')}
                                            </div>
                                            {Number(order.unique_code) > 0 && (
                                                <div className="font-mono text-xs text-slate-400">+{order.unique_code}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-3.5 text-sm text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString(localeTag, { dateStyle: 'medium' })}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                            <Menu as="div" className="relative inline-block text-right">
                                                <MenuButton
                                                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                    title={t('payment_orders.index.actions_menu')}
                                                    aria-label={t('payment_orders.index.actions_menu')}
                                                >
                                                    <EllipsisVerticalIcon />
                                                </MenuButton>

                                                <MenuItems
                                                    transition
                                                    anchor="bottom end"
                                                    className="z-50 w-48 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                                >
                                                    <MenuItem>
                                                        <Link
                                                            href={prefixedRoute('payment-orders.show', order.id)}
                                                            className={menuItemClassName}
                                                        >
                                                            <span className="text-gray-500">
                                                                <EyeIcon />
                                                            </span>
                                                            {t('payment_orders.index.view_detail')}
                                                        </Link>
                                                    </MenuItem>
                                                </MenuItems>
                                            </Menu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {paymentOrders.data.length > 0 && (
                    <Pagination
                        links={paymentOrders.links}
                        total={paymentOrders.total}
                        from={paymentOrders.from}
                        to={paymentOrders.to}
                    />
                )}
            </div>
        </DynamicLayout>
    );
}

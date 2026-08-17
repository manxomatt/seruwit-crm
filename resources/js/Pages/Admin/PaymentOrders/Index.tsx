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
    pending: {
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
    },
    awaiting_confirmation: {
        dot: 'bg-amber-500 animate-pulse',
        badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
    },
    confirmed: {
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50',
    },
    rejected: {
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
    },
    expired: {
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800',
    },
    cancelled: {
        dot: 'bg-slate-400',
        badge: 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800',
    },
};

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition';

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const styles = STATUS_STYLES[status] ?? STATUS_STYLES['pending'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
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
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60 px-6 py-4 sm:flex-row">
            <p className="text-xs font-bold text-slate-400">{countLabel}</p>

            <div className="flex items-center gap-1">
                {prev.url ? (
                    <Link
                        href={prev.url}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        preserveScroll
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                        </svg>
                    </Link>
                ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 dark:text-slate-700">
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
                            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                link.active
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                            preserveScroll
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span key={i} className="flex h-8 min-w-[2rem] items-center justify-center px-1 text-xs text-slate-400">
                            …
                        </span>
                    )
                ))}

                {next.url ? (
                    <Link
                        href={next.url}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        preserveScroll
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </Link>
                ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-300 dark:text-slate-700">
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

    // Stat card metrics
    const stats = useMemo(() => {
        const total = paymentOrders.total;
        const awaiting = paymentOrders.data.filter((o) => o.status === 'awaiting_confirmation' || o.status === 'pending').length;
        const confirmed = paymentOrders.data.filter((o) => o.status === 'confirmed').length;
        const rejected = paymentOrders.data.filter((o) => o.status === 'rejected' || o.status === 'expired' || o.status === 'cancelled').length;
        return { total, awaiting, confirmed, rejected };
    }, [paymentOrders]);

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

            <div className="space-y-6">
                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                💳
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-lg font-bold">
                                ⏳
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting / Pending</p>
                                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.awaiting}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                ✅
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmed</p>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.confirmed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-lg font-bold">
                                ❌
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected / Expired</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 max-w-md">
                            <div className="relative flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder={t('payment_orders.index.search_placeholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 py-2 pl-9 pr-3 text-xs focus:border-indigo-400 focus:ring-indigo-400 text-slate-900 dark:text-white"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-9 items-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-xs font-bold shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-100"
                            >
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
                                className="min-w-[200px]"
                            />

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                                >
                                    ❌ {t('payment_orders.index.reset')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {paymentOrders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl mb-3">
                                💳
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {hasFilters ? t('payment_orders.index.empty_filtered') : t('payment_orders.index.empty_all')}
                            </h3>
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    {t('payment_orders.index.clear_filter')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.number')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.tenant')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.plan')}</th>
                                        <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.total')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.status')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('payment_orders.index.columns.date')}</th>
                                        <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {paymentOrders.data.map((order) => (
                                        <tr key={order.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-400 dark:text-slate-500">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900 dark:text-white">{order.tenant.name}</div>
                                                <div className="text-[11px] text-slate-400 capitalize">
                                                    {t(`payment_orders.types.${order.type}`, {}, order.type)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                                                {order.plan.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="font-mono font-bold text-slate-900 dark:text-white">
                                                    {'Rp ' + Number(order.total_amount).toLocaleString('id-ID')}
                                                </div>
                                                {Number(order.unique_code) > 0 && (
                                                    <div className="font-mono text-[10px] text-slate-400">+{order.unique_code}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                {new Date(order.created_at).toLocaleDateString(localeTag, { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                        title={t('payment_orders.index.actions_menu')}
                                                    >
                                                        ⚙️
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('payment-orders.show', order.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <EyeIcon />
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
            </div>
        </DynamicLayout>
    );
}

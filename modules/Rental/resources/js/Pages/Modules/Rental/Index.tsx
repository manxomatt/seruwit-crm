import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatDateDmY } from '@/utils/date';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import RentalNav from '../../../RentalNav';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface Partner {
    id: number;
    name: string;
    code: string;
}

interface Driver {
    id: number;
    name: string;
}

interface Rental {
    id: number;
    code: string;
    channel?: string | null;
    status: string;
    start_date: string;
    end_date: string;
    period_type: string;
    total_periods: number;
    total_amount: string;
    is_overdue: boolean;
    vehicle: Vehicle;
    partner: Partner;
    driver: Driver | null;
}

interface PaginatedRentals {
    data: Rental[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    status: string | null;
    search: string | null;
}

interface Props {
    rentals: PaginatedRentals;
    filters: Filters;
}

const STATUSES = [
    'draft',
    'pending',
    'pending_reserved',
    'confirmed',
    'active',
    'returned',
    'completed',
    'cancelled',
    'cancelled_paid',
    'no_show',
    'no_show_paid',
] as const;

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-500/20';
        case 'pending':
            return 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-500/20';
        case 'pending_reserved':
            return 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20';
        case 'confirmed':
            return 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20';
        case 'active':
            return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
        case 'returned':
            return 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20';
        case 'completed':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
        case 'cancelled':
        case 'cancelled_paid':
            return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
        case 'no_show':
        case 'no_show_paid':
            return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20';
        default:
            return 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-500/20';
    }
}

const formatMoney = (v: string | number): string => 'Rp ' + Number(v).toLocaleString('id-ID');

const periodUnit = (periodType: string): string =>
    periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month';

const SearchIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

export default function Index({ rentals, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search ?? '');
    const hasActiveFilters = Boolean(filters.search || filters.status);

    const applyFilters = (overrides: Record<string, string>): void => {
        router.get(
            prefixedRoute('rental.index'),
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

    const clearFilters = (): void => {
        setSearch('');
        router.get(prefixedRoute('rental.index'), {}, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.index.title')}
                    actions={<Link href={prefixedRoute('rental.create')}>
                        <PrimaryButton>{t('rental.actions.new_rental')}</PrimaryButton>
                    </Link>}
                />
            }
        >
            <Head title={t('rental.pages.index.head')} />

            <RentalNav />

            {flash?.success && (
                <div className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-600/20">
                    {flash.error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                    <p className="text-sm text-gray-600">{t('rental.pages.index.total', { count: rentals.total })}</p>

                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                                <SearchIcon />
                            </span>
                            <TextInput
                                type="search"
                                placeholder={t('rental.placeholders.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full !py-2 pl-10 text-sm"
                            />
                        </div>
                        <div className="w-52 shrink-0 sm:w-56">
                            <Select
                                className="!py-1.5 text-sm"
                                value={filters.status || ''}
                                onChange={(value) => applyFilters({ status: value })}
                                placeholder={t('rental.status.all')}
                                options={[
                                    { value: '', label: t('rental.status.all') },
                                    ...STATUSES.map((status) => ({
                                        value: status,
                                        label: t(`rental.status.${status}`, undefined, status),
                                    })),
                                ]}
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            {t('rental.actions.search')}
                        </button>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex h-9 items-center rounded-md px-2 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                                {t('common.clear_filters', undefined, 'Clear filters')}
                            </button>
                        )}
                        <span className="ml-auto text-xs tabular-nums text-gray-400">
                            {t('common.showing_results', {
                                from: rentals.total === 0 ? 0 : (rentals.current_page - 1) * rentals.per_page + 1,
                                to: Math.min(rentals.current_page * rentals.per_page, rentals.total),
                                total: rentals.total,
                            })}
                        </span>
                    </form>
                </div>

                {rentals.data.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <h3 className="text-sm font-medium text-gray-900">{t('rental.pages.index.empty')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('common.empty_hint', undefined, 'Try adjusting your filters.')}</p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                {t('common.clear_filters', undefined, 'Clear filters')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.code')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.partner')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.vehicle')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.period')}
                                        </th>
                                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.status')}
                                        </th>
                                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                            {t('rental.fields.amount')}
                                        </th>
                                        <th className="w-24 px-3 py-2.5">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rentals.data.map((rental) => (
                                        <tr
                                            key={rental.id}
                                            className="group transition-colors hover:bg-gray-50/80"
                                        >
                                            <td className="whitespace-nowrap px-3 py-2.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Link
                                                        href={prefixedRoute('rental.show', rental.id)}
                                                        className="font-mono text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        {rental.code}
                                                    </Link>
                                                    {rental.channel && rental.channel !== 'staff' && (
                                                        <span className="inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                                                            {t(`rental.channel.${rental.channel}`, undefined, rental.channel)}
                                                        </span>
                                                    )}
                                                    {rental.is_overdue && (
                                                        <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                                            {t('rental.status.overdue')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-gray-900">{rental.partner.name}</div>
                                                    <div className="font-mono text-xs text-gray-500">{rental.partner.code}</div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium text-gray-900">{rental.vehicle.name}</div>
                                                    <div className="font-mono text-xs text-gray-500">{rental.vehicle.plate_number}</div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-xs text-gray-600">
                                                <div className="font-medium text-gray-800">
                                                    {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)}
                                                </div>
                                                <div className="text-gray-400">
                                                    {rental.total_periods}{' '}
                                                    {t(`rental.period_type.${periodUnit(rental.period_type)}`, undefined, rental.period_type)}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(rental.status)}`}
                                                >
                                                    {t(`rental.status.${rental.status}`, undefined, rental.status)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums text-gray-900">
                                                {formatMoney(rental.total_amount)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                        title={t('common.actions')}
                                                        aria-label={t('common.actions')}
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-52 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('rental.show', rental.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                <span className="text-gray-500"><EyeIcon /></span>
                                                                {t('common.view', undefined, 'View')}
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

                        {rentals.last_page > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                                <p className="text-xs text-gray-500">
                                    {t('common.showing_results', {
                                        from: (rentals.current_page - 1) * rentals.per_page + 1,
                                        to: Math.min(rentals.current_page * rentals.per_page, rentals.total),
                                        total: rentals.total,
                                    })}
                                </p>
                                <div className="flex gap-1">
                                    {rentals.links.map((link, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${link.active
                                                ? 'bg-gray-900 text-white'
                                                : link.url
                                                    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                    : 'cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Vehicle { id: number; name: string; plate_number: string; type: string; }
interface Partner { id: number; name: string; code: string; }
interface Driver { id: number; name: string; }

interface Rental {
    id: number;
    code: string;
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
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    rentals: PaginatedRentals;
    filters: { status: string | null; search: string | null };
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft', confirmed: 'Confirmed', active: 'Active',
    returned: 'Returned', completed: 'Completed', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-blue-100 text-blue-700',
    active: 'bg-amber-100 text-amber-700',
    returned: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const formatMoney = (v: string | number) =>
    'Rp ' + Number(v).toLocaleString('id-ID');

export default function Index({ rentals, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (overrides: Record<string, string>) => {
        router.get(prefixedRoute('rental.index'), { ...filters, search, ...overrides }, { preserveState: true });
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters({ search });
    };

    return (
        <DynamicLayout header="Rental">
            <Head title="Rental" />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Vehicle Rentals</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{rentals.total} total rentals</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('rental.rates.index')}>
                            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                Rates
                            </button>
                        </Link>
                        <Link href={prefixedRoute('rental.create')}>
                            <PrimaryButton>New Rental</PrimaryButton>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <TextInput
                            placeholder="Search code or partner…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-56"
                        />
                        <button type="submit" className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                            Search
                        </button>
                    </form>
                    <select
                        value={filters.status ?? ''}
                        onChange={(e) => applyFilters({ status: e.target.value })}
                        className="w-40 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {['Code', 'Partner', 'Vehicle', 'Period', 'Status', 'Amount', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {rentals.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                                        No rentals found.
                                    </td>
                                </tr>
                            )}
                            {rentals.data.map((rental) => (
                                <tr key={rental.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                            {rental.code}
                                        </span>
                                        {rental.is_overdue && (
                                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                                Overdue
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        {rental.partner.name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div>{rental.vehicle.name}</div>
                                        <div className="text-xs text-gray-400">{rental.vehicle.plate_number}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div>{rental.start_date} → {rental.end_date}</div>
                                        <div className="text-xs text-gray-400">
                                            {rental.total_periods} {rental.period_type === 'daily' ? 'day(s)' : rental.period_type === 'weekly' ? 'week(s)' : 'month(s)'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[rental.status] ?? ''}`}>
                                            {STATUS_LABELS[rental.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 tabular-nums dark:text-white">
                                        {formatMoney(rental.total_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('rental.show', rental.id)}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {rentals.last_page > 1 && (
                    <div className="mt-4 flex justify-center gap-1">
                        {rentals.links.map((link, i) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span key={i} className="rounded px-3 py-1 text-sm text-gray-400" dangerouslySetInnerHTML={{ __html: link.label }} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

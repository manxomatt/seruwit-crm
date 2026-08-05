import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import RentalNav from '../../../RentalNav';
import PageHeader from '@/Components/PageHeader';

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

interface Props {
    rentals: PaginatedRentals;
    filters: { status: string | null; search: string | null };
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
            return 'bg-gray-100 text-gray-700';
        case 'pending':
            return 'bg-slate-100 text-slate-700';
        case 'pending_reserved':
            return 'bg-indigo-100 text-indigo-800';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'active':
            return 'bg-amber-100 text-amber-800';
        case 'returned':
            return 'bg-violet-100 text-violet-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
        case 'cancelled_paid':
            return 'bg-red-100 text-red-800';
        case 'no_show':
        case 'no_show_paid':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

const formatMoney = (v: string | number): string => 'Rp ' + Number(v).toLocaleString('id-ID');

const periodUnit = (periodType: string): string =>
    periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month';

export default function Index({ rentals, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');

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

            <p className="mb-6 text-sm text-gray-600">{t('rental.pages.index.total', { count: rentals.total })}</p>

            <div className="mb-6 flex flex-wrap gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <TextInput
                        placeholder={t('rental.placeholders.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-56"
                    />
                    <button
                        type="submit"
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        {t('rental.actions.search')}
                    </button>
                </form>
                <Select
                    className="min-w-[12rem]"
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

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.partner')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.vehicle')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.period')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('rental.fields.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('rental.fields.amount')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rentals.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    {t('rental.pages.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            rentals.data.map((rental) => (
                                <tr key={rental.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={prefixedRoute('rental.show', rental.id)}
                                            className="font-medium text-indigo-600 hover:underline"
                                        >
                                            {rental.code}
                                        </Link>
                                        {rental.is_overdue && (
                                            <span className="ml-2 inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                                {t('rental.status.overdue')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{rental.partner.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{rental.vehicle.name}</div>
                                        <div className="text-xs text-gray-500">{rental.vehicle.plate_number}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                                        <div>
                                            {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)}
                                        </div>
                                        <div className="text-gray-400">
                                            {rental.total_periods}{' '}
                                            {t(`rental.period_type.${periodUnit(rental.period_type)}`, undefined, rental.period_type)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(rental.status)}`}
                                        >
                                            {t(`rental.status.${rental.status}`, undefined, rental.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                                        {formatMoney(rental.total_amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {rentals.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
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

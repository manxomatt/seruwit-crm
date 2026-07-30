import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';
import { ActionIconButton, EyeIcon } from '../components/ActionIcons';
import ShuttlePagination, { type PaginatedMeta } from '../components/ShuttlePagination';

interface Booking {
    id: number;
    booking_number: string;
    status: string;
    passenger_count: number;
    total_fare: string | number;
    partner?: { name: string } | null;
    departure?: { departure_number: string; depart_date: string; corridor?: { name: string } | null } | null;
}

interface Props {
    bookings: PaginatedMeta & { data: Booking[] };
    filters: { status: string | null; search: string | null };
    can: { create: boolean; confirm: boolean };
}

const STATUSES = ['draft', 'confirmed', 'boarded', 'completed', 'cancelled', 'no_show'] as const;

const money = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800';
        case 'boarded':
            return 'bg-amber-100 text-amber-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
        case 'no_show':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ bookings, filters, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const applyFilters = (overrides: { search?: string; status?: string } = {}): void => {
        router.get(
            prefixedRoute('shuttle.bookings.index'),
            {
                search: (overrides.search !== undefined ? overrides.search : search) || undefined,
                status: (overrides.status !== undefined ? overrides.status : status) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.bookings.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('shuttle.bookings.create')}>
                            <PrimaryButton type="button">{t('shuttle.bookings.create')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('shuttle.bookings.title')} />
            <ShuttleNav active="bookings" />

            <form onSubmit={submit} className="mb-6 flex flex-wrap gap-3">
                <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('common.search', undefined, 'Search…')}
                    className="w-56"
                />
                <Select
                    className="min-w-[12rem]"
                    value={status}
                    onChange={(value) => {
                        setStatus(value);
                        applyFilters({ status: value });
                    }}
                    options={[
                        { value: '', label: t('common.all', undefined, 'All statuses') },
                        ...STATUSES.map((s) => ({ value: s, label: t(`shuttle.status.${s}`) })),
                    ]}
                />
                <button type="submit" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {t('common.filter', undefined, 'Filter')}
                </button>
            </form>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.number')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.partner')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.departure')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('shuttle.bookings.fare')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.departures.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions', undefined, 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    —
                                </td>
                            </tr>
                        ) : (
                            bookings.data.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{b.booking_number}</td>
                                    <td className="px-4 py-3 text-gray-700">{b.partner?.name ?? t('shuttle.bookings.walk_in')}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{b.departure?.departure_number}</div>
                                        <div className="text-xs text-gray-500">{b.departure?.corridor?.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{money(b.total_fare)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(b.status)}`}>
                                            {t(`shuttle.status.${b.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <ActionIconButton
                                                title={t('common.view', undefined, 'View')}
                                                href={prefixedRoute('shuttle.bookings.show', b.id)}
                                            >
                                                <EyeIcon />
                                            </ActionIconButton>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <ShuttlePagination meta={bookings} />
            </div>
        </DynamicLayout>
    );
}

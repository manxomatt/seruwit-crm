import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import RentalNav from '../../../../RentalNav';

interface Booking {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    partner: string | null;
}

interface VehicleRow {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    status: string;
    photo_url: string | null;
    availability: 'free' | 'booked' | 'in_use' | 'unavailable';
    has_rate: boolean;
    bookings: Booking[];
}

interface Board {
    from: string;
    to: string;
    counts: { total: number; free: number; booked: number; in_use: number };
    vehicles: VehicleRow[];
}

interface Props {
    board: Board;
    filters: { from: string; to: string };
}

type AvailabilityFilter = 'all' | 'free' | 'booked' | 'in_use' | 'unavailable';

const AVAIL_BADGE: Record<VehicleRow['availability'], string> = {
    free: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-200',
    booked: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950 dark:text-amber-200',
    in_use: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-600/20 dark:bg-sky-950 dark:text-sky-200',
    unavailable: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300',
};

const AVAIL_ACCENT: Record<VehicleRow['availability'], string> = {
    free: 'border-l-emerald-500',
    booked: 'border-l-amber-500',
    in_use: 'border-l-sky-500',
    unavailable: 'border-l-slate-400',
};

function StatCard({
    label,
    value,
    tone = 'default',
    active = false,
    onClick,
}: {
    label: string;
    value: number;
    tone?: 'default' | 'success' | 'warning' | 'info';
    active?: boolean;
    onClick?: () => void;
}): JSX.Element {
    const toneClass =
        tone === 'success'
            ? 'text-emerald-700 dark:text-emerald-300'
            : tone === 'warning'
              ? 'text-amber-700 dark:text-amber-300'
              : tone === 'info'
                ? 'text-sky-700 dark:text-sky-300'
                : 'text-gray-900 dark:text-white';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                    ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500/30 dark:border-indigo-700 dark:bg-indigo-950/50'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
            }`}
        >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
        </button>
    );
}

export default function Index({ board, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [filter, setFilter] = useState<AvailabilityFilter>('all');
    const [query, setQuery] = useState('');

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('rental.availability.index'), { from, to }, { preserveState: true });
    };

    const vehicles = useMemo(() => {
        const q = query.trim().toLowerCase();

        return board.vehicles.filter((vehicle) => {
            if (filter !== 'all' && vehicle.availability !== filter) {
                return false;
            }

            if (! q) {
                return true;
            }

            return (
                vehicle.name.toLowerCase().includes(q) ||
                vehicle.plate_number.toLowerCase().includes(q) ||
                (vehicle.type ?? '').toLowerCase().includes(q)
            );
        });
    }, [board.vehicles, filter, query]);

    const bookUrl = (vehicleId: number): string =>
        prefixedRoute('rental.create', {
            vehicle_id: vehicleId,
            start_date: filters.from,
            end_date: filters.to,
        });

    return (
        <DynamicLayout header={<PageHeader title={t('rental.pages.availability.head')} />}>
            <Head title={t('rental.pages.availability.title')} />
            <RentalNav />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700 sm:px-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t('rental.pages.availability.head')}
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {t('rental.pages.availability.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 px-5 py-4 sm:px-6">
                        <div>
                            <InputLabel htmlFor="from" value={t('rental.fields.start_date')} />
                            <TextInput
                                id="from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="to" value={t('rental.fields.end_date')} />
                            <TextInput
                                id="to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="min-w-[12rem] flex-1">
                            <InputLabel htmlFor="vehicle_search" value={t('rental.availability.search')} />
                            <TextInput
                                id="vehicle_search"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('rental.availability.search_placeholder')}
                                className="mt-1 w-full"
                            />
                        </div>
                        <PrimaryButton type="submit">{t('rental.actions.search')}</PrimaryButton>
                    </form>
                </section>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={t('rental.availability.total')}
                        value={board.counts.total}
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                    />
                    <StatCard
                        label={t('rental.availability.free')}
                        value={board.counts.free}
                        tone="success"
                        active={filter === 'free'}
                        onClick={() => setFilter('free')}
                    />
                    <StatCard
                        label={t('rental.availability.booked')}
                        value={board.counts.booked}
                        tone="warning"
                        active={filter === 'booked'}
                        onClick={() => setFilter('booked')}
                    />
                    <StatCard
                        label={t('rental.availability.in_use')}
                        value={board.counts.in_use}
                        tone="info"
                        active={filter === 'in_use'}
                        onClick={() => setFilter('in_use')}
                    />
                </div>

                {vehicles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center dark:border-gray-600 dark:bg-gray-900/40">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {t('rental.pages.availability.empty')}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {t('rental.availability.empty_hint')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {vehicles.map((vehicle) => (
                            <article
                                key={vehicle.id}
                                className={`overflow-hidden rounded-xl border border-gray-200 border-l-4 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${AVAIL_ACCENT[vehicle.availability]}`}
                            >
                                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5 sm:py-4">
                                    <div className="flex min-w-0 flex-1 items-center gap-4 sm:max-w-sm">
                                        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-600">
                                            {vehicle.photo_url ? (
                                                <img
                                                    src={vehicle.photo_url}
                                                    alt={vehicle.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400 dark:text-gray-500">
                                                    {t('rental.availability.no_photo')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                                                    {vehicle.name}
                                                </h3>
                                                <span
                                                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AVAIL_BADGE[vehicle.availability]}`}
                                                >
                                                    {t(
                                                        `rental.availability.${vehicle.availability}`,
                                                        undefined,
                                                        vehicle.availability,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">
                                                {vehicle.plate_number}
                                                {vehicle.type ? (
                                                    <span className="font-sans text-gray-400"> · {vehicle.type}</span>
                                                ) : null}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {t('rental.fields.status')}:{' '}
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {vehicle.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1 border-t border-gray-100 pt-3 dark:border-gray-700 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                            {t('rental.availability.bookings')}
                                        </p>
                                        {vehicle.bookings.length === 0 ? (
                                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                                {t('rental.availability.no_bookings')}
                                            </p>
                                        ) : (
                                            <ul className="space-y-1.5">
                                                {vehicle.bookings.map((booking) => (
                                                    <li key={booking.id} className="text-sm">
                                                        <Link
                                                            href={prefixedRoute('rental.show', booking.id)}
                                                            className="font-mono font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                                        >
                                                            {booking.code}
                                                        </Link>
                                                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                                            {t(`rental.status.${booking.status}`, undefined, booking.status)}
                                                            {' · '}
                                                            {booking.start_date} → {booking.end_date}
                                                            {booking.partner ? ` · ${booking.partner}` : ''}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="shrink-0 border-t border-gray-100 pt-3 dark:border-gray-700 sm:border-t-0 sm:pt-0">
                                        {vehicle.availability === 'free' && vehicle.has_rate ? (
                                            <Link href={bookUrl(vehicle.id)}>
                                                <PrimaryButton type="button" className="w-full justify-center sm:w-auto">
                                                    {t('rental.availability.book_vehicle')}
                                                </PrimaryButton>
                                            </Link>
                                        ) : vehicle.availability === 'free' && ! vehicle.has_rate ? (
                                            <p className="max-w-[12rem] text-right text-xs text-amber-700 dark:text-amber-300 sm:text-left">
                                                {t('rental.availability.needs_rate')}
                                            </p>
                                        ) : (
                                            <SecondaryButton
                                                type="button"
                                                className="w-full justify-center sm:w-auto"
                                                disabled
                                            >
                                                {t(
                                                    `rental.availability.${vehicle.availability}`,
                                                    undefined,
                                                    vehicle.availability,
                                                )}
                                            </SecondaryButton>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

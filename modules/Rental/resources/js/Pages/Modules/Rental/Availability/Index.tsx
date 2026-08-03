import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import RentalNav from '../../../../RentalNav';
import PageHeader from '@/Components/PageHeader';

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
    availability: 'free' | 'booked' | 'in_use' | 'unavailable';
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

const AVAIL_STYLES: Record<string, string> = {
    free: 'bg-green-100 text-green-800',
    booked: 'bg-amber-100 text-amber-800',
    in_use: 'bg-blue-600 text-white',
    unavailable: 'bg-gray-100 text-gray-600',
};

function StatCard({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: number;
    tone?: 'default' | 'in_use';
}): JSX.Element {
    const toneClass = tone === 'in_use'
        ? 'border-blue-200 bg-blue-50'
        : 'border-gray-200 bg-white';
    const valueClass = tone === 'in_use' ? 'text-blue-700' : 'text-gray-900';

    return (
        <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
        </div>
    );
}

export default function Index({ board, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('rental.availability.index'), { from, to }, { preserveState: true });
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('rental.pages.availability.head')} />}
        >
            <Head title={t('rental.pages.availability.title')} />
            <RentalNav />

            <p className="mb-4 text-sm text-gray-600">{t('rental.pages.availability.subtitle')}</p>

            <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3">
                <div>
                    <InputLabel htmlFor="from" value={t('rental.fields.start_date')} />
                    <TextInput id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="to" value={t('rental.fields.end_date')} />
                    <TextInput id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
                </div>
                <SecondaryButton type="submit">{t('rental.actions.search')}</SecondaryButton>
            </form>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label={t('rental.availability.total')} value={board.counts.total} />
                <StatCard label={t('rental.availability.free')} value={board.counts.free} />
                <StatCard label={t('rental.availability.booked')} value={board.counts.booked} />
                <StatCard label={t('rental.availability.in_use')} value={board.counts.in_use} tone="in_use" />
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">{t('rental.fields.vehicle')}</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">{t('rental.fields.status')}</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">{t('rental.availability.column')}</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">{t('rental.availability.bookings')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {board.vehicles.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    {t('rental.pages.availability.empty')}
                                </td>
                            </tr>
                        )}
                        {board.vehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="align-top">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{vehicle.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {vehicle.plate_number}
                                        {vehicle.type ? ` · ${vehicle.type}` : ''}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{vehicle.status}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${AVAIL_STYLES[vehicle.availability]}`}>
                                        {t(`rental.availability.${vehicle.availability}`, undefined, vehicle.availability)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {vehicle.bookings.length === 0 ? (
                                        <span className="text-gray-400">—</span>
                                    ) : (
                                        <ul className="space-y-1">
                                            {vehicle.bookings.map((booking) => (
                                                <li key={booking.id}>
                                                    <Link
                                                        href={prefixedRoute('rental.show', booking.id)}
                                                        className="font-mono text-indigo-600 hover:underline"
                                                    >
                                                        {booking.code}
                                                    </Link>
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        {t(`rental.status.${booking.status}`, undefined, booking.status)}
                                                        {' · '}
                                                        {booking.start_date} → {booking.end_date}
                                                        {booking.partner ? ` · ${booking.partner}` : ''}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DynamicLayout>
    );
}

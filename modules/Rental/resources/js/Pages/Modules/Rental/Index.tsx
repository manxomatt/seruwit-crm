import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
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
    'overdue',
    'inactive',
] as const;

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        case 'pending':
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
        case 'pending_reserved':
            return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
        case 'confirmed':
            return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30 dark:bg-emerald-950/60 dark:text-emerald-300';
        case 'returned':
            return 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300';
        case 'completed':
            return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300';
        case 'cancelled':
        case 'cancelled_paid':
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
        case 'no_show':
        case 'no_show_paid':
            return 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300';
        case 'overdue':
            return 'bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-200';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

const formatMoney = (v: string | number): string => 'Rp ' + Number(v).toLocaleString('id-ID');

const periodUnit = (periodType: string): string =>
    periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month';

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const QUICK_FILTERS = [
    { label: 'Semua', value: '' },
    { label: 'Aktif', value: 'active' },
    { label: 'Dikonfirmasi', value: 'confirmed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Returned', value: 'returned' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Overdue', value: 'overdue' },
];

export default function Index({ rentals, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const page = usePage();
    const flash = page.props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState(filters.search ?? '');
    const [previewRental, setPreviewRental] = useState<Rental | null>(null);
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
                    title={t('rental.pages.index.title', undefined, 'Manajemen Rental')}
                    subtitle="Kelola seluruh transaksi sewa kendaraan, jadwal serah terima, dan status pengembalian."
                    actions={
                        <Link href={prefixedRoute('rental.create')}>
                            <PrimaryButton className="rounded-xl shadow-sm">
                                {t('rental.actions.new_rental', undefined, 'Buat Rental Baru')}
                            </PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('rental.pages.index.head', undefined, 'Daftar Rental')} />

            <RentalNav />

            {flash?.success && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs">
                    ✓ {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 shadow-2xs">
                    ⚠️ {flash.error}
                </div>
            )}

            <div className="space-y-4">
                {/* Search & Filter Header Bar */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2.5">
                            <div className="relative min-w-[240px] flex-1">
                                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                    <SearchIcon />
                                </span>
                                <TextInput
                                    type="search"
                                    placeholder={t('rental.placeholders.search', undefined, 'Cari kode booking, nama pelanggan, atau plat nomor...')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full !rounded-2xl !py-2.5 pl-10 text-xs shadow-2xs"
                                />
                            </div>
                            <div className="w-48 shrink-0 sm:w-52">
                                <Select
                                    className="!rounded-2xl !py-2 text-xs shadow-2xs"
                                    value={filters.status || ''}
                                    onChange={(value) => applyFilters({ status: value })}
                                    placeholder={t('rental.status.all', undefined, 'Semua Status')}
                                    options={[
                                        { value: '', label: t('rental.status.all', undefined, 'Semua Status') },
                                        ...STATUSES.map((status) => ({
                                            value: status,
                                            label: t(`rental.status.${status}`, undefined, status),
                                        })),
                                    ]}
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-slate-900 px-4 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
                            >
                                {t('rental.actions.search', undefined, 'Cari')}
                            </button>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition"
                                >
                                    ✕ Reset
                                </button>
                            )}
                        </form>

                        {/* Quick filter chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Filter Cepat:</span>
                            {QUICK_FILTERS.map((chip) => {
                                const isActive = (filters.status || '') === chip.value;
                                return (
                                    <button
                                        key={chip.value}
                                        type="button"
                                        onClick={() => applyFilters({ status: chip.value })}
                                        className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {chip.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {rentals.data.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 dark:bg-slate-800">
                                🚗
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('rental.pages.index.empty', undefined, 'Belum ada data rental')}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                {t('common.empty_hint', undefined, 'Coba sesuaikan pencarian atau tambahkan rental baru.')}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-3 inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                                >
                                    ✕ Reset Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                    <thead className="bg-slate-50/80 dark:bg-slate-850">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.code', undefined, 'Kode Booking')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.partner', undefined, 'Pelanggan')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.vehicle', undefined, 'Kendaraan')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.period', undefined, 'Periode Sewa')}
                                            </th>
                                            <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.status', undefined, 'Status')}
                                            </th>
                                            <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {t('rental.fields.amount', undefined, 'Total Biaya')}
                                            </th>
                                            <th className="w-28 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {rentals.data.map((rental) => (
                                            <tr
                                                key={rental.id}
                                                className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link
                                                            href={prefixedRoute('rental.show', rental.id)}
                                                            className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                                                        >
                                                            {rental.code}
                                                        </Link>
                                                        {rental.channel && rental.channel !== 'staff' && (
                                                            <span className="inline-flex w-fit rounded-lg bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                                                                {t(`rental.channel.${rental.channel}`, undefined, rental.channel)}
                                                            </span>
                                                        )}
                                                        {rental.is_overdue && (
                                                            <span className="inline-flex w-fit rounded-lg bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                                ⚠️ {t('rental.status.overdue', undefined, 'Overdue')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                            {rental.partner.name}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-slate-400">
                                                            {rental.partner.code}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                            {rental.vehicle.name}
                                                        </div>
                                                        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                            {rental.vehicle.plate_number}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                                        {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {rental.total_periods}{' '}
                                                        {t(`rental.period_type.${periodUnit(rental.period_type)}`, undefined, rental.period_type)}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-bold ${statusBadgeClass(
                                                            rental.status,
                                                        )}`}
                                                    >
                                                        {t(`rental.status.${rental.status}`, undefined, rental.status)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-black text-slate-900 dark:text-white">
                                                    {formatMoney(rental.total_amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewRental(rental)}
                                                            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                                                            title="Lihat Cepat (Quick Preview)"
                                                        >
                                                            <EyeIcon />
                                                        </button>
                                                        <Link
                                                            href={prefixedRoute('rental.show', rental.id)}
                                                            className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition"
                                                        >
                                                            Buka
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:px-5 dark:border-slate-800">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('common.showing_results', {
                                        from: (rentals.current_page - 1) * rentals.per_page + 1,
                                        to: Math.min(rentals.current_page * rentals.per_page, rentals.total),
                                        total: rentals.total,
                                    }, `Menampilkan ${(rentals.current_page - 1) * rentals.per_page + 1} - ${Math.min(rentals.current_page * rentals.per_page, rentals.total)} dari ${rentals.total} data`)}
                                </p>
                                {rentals.last_page > 1 && (
                                    <div className="flex gap-1">
                                        {rentals.links.map((link, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                                        : link.url
                                                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            : 'cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-600'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Preview Modal */}
            {previewRental && (
                <Modal show onClose={() => setPreviewRental(null)} maxWidth="md">
                    <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-2xs">
                                    🚗
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-mono text-base font-black text-slate-900 dark:text-white">
                                            {previewRental.code}
                                        </h3>
                                        <span
                                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(
                                                previewRental.status,
                                            )}`}
                                        >
                                            {t(`rental.status.${previewRental.status}`, undefined, previewRental.status)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {previewRental.partner.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewRental(null)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50 space-y-2.5 text-xs">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-slate-700">
                                <span className="text-slate-500">Kendaraan:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {previewRental.vehicle.name} ({previewRental.vehicle.plate_number})
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Pelanggan:</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {previewRental.partner.name} ({previewRental.partner.code})
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Jadwal Sewa:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {formatDateDmY(previewRental.start_date)} → {formatDateDmY(previewRental.end_date)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Durasi:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {previewRental.total_periods} {t(`rental.period_type.${periodUnit(previewRental.period_type)}`, undefined, previewRental.period_type)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-slate-700">
                                <span className="text-slate-500 font-bold">Total Biaya:</span>
                                <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                                    {formatMoney(previewRental.total_amount)}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <SecondaryButton type="button" onClick={() => setPreviewRental(null)} className="rounded-xl px-4 py-2">
                                Tutup
                            </SecondaryButton>
                            <Link href={prefixedRoute('rental.show', previewRental.id)}>
                                <PrimaryButton className="rounded-xl px-5 py-2">
                                    Buka Halaman Detail Lengkap ➔
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                </Modal>
            )}
        </DynamicLayout>
    );
}

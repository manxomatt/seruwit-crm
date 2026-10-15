import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import RentalNav from '../../../../RentalNav';

interface DriverItem {
    id: number;
    name: string;
    phone: string | null;
}

interface VehicleItem {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
}

interface DutyOrderItem {
    id: number;
    duty_order_number: string;
    rental_id: number | null;
    driver_id: number;
    vehicle_id: number;
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string;
    departure_time: string | null;
    return_time: string | null;
    passenger_name: string | null;
    passenger_phone: string | null;
    status: 'draft' | 'dispatched' | 'completed' | 'settled' | 'cancelled';
    cash_advance_amount: number;
    actual_expense_total: number;
    net_balance: number;
    settlement_status: 'pending' | 'submitted' | 'settled';
    driver?: DriverItem;
    vehicle?: VehicleItem;
    rental?: {
        id: number;
        code: string;
        status: string;
    };
    creator?: {
        id: number;
        name: string;
    };
}

interface Props {
    orders: {
        data: DutyOrderItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    metrics: {
        total_orders: number;
        active_orders: number;
        pending_settlement: number;
        total_advance_disbursed: number;
        total_actual_expenses: number;
        total_net_balance: number;
    };
    drivers: DriverItem[];
    vehicles: VehicleItem[];
    filters: {
        search: string;
        status: string;
        settlement_status: string;
        driver_id: number | null;
        vehicle_id: number | null;
        date: string;
    };
}

export default function DutyOrdersIndex({ orders, metrics, drivers, vehicles, filters }: Props) {
    const { t } = useTrans();
    const { routePrefix } = useRoutePrefix();

    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [settlementStatus, setSettlementStatus] = useState(filters.settlement_status || 'all');
    const [driverId, setDriverId] = useState<number | ''>(filters.driver_id || '');
    const [vehicleId, setVehicleId] = useState<number | ''>(filters.vehicle_id || '');
    const [date, setDate] = useState(filters.date || '');

    const applyFilter = (newFilters: Record<string, any>) => {
        const merged = {
            search,
            status,
            settlement_status: settlementStatus,
            driver_id: driverId || undefined,
            vehicle_id: vehicleId || undefined,
            date: date || undefined,
            ...newFilters,
        };

        router.get(route(`${routePrefix}.rental.duty_orders.index`), merged, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const statusBadge = (s: string) => {
        switch (s) {
            case 'dispatched':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Berangkat (On Duty)</span>;
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Selesai Tugas</span>;
            case 'settled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Settled (Selesai Kas)</span>;
            case 'cancelled':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Dibatalkan</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Draft</span>;
        }
    };

    const settlementBadge = (st: string) => {
        switch (st) {
            case 'settled':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">✓ Lunas / Settled</span>;
            case 'submitted':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Menunggu Verifikasi</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">Belum Selesai (Pending)</span>;
        }
    };

    const statusOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status Tugas' },
        { value: 'draft', label: 'Draft' },
        { value: 'dispatched', label: 'Berangkat (On Duty)' },
        { value: 'completed', label: 'Selesai Tugas' },
        { value: 'settled', label: 'Settled (Selesai Kas)' },
        { value: 'cancelled', label: 'Dibatalkan' },
    ];

    const settlementOptions: SelectOption[] = [
        { value: 'all', label: 'Semua Status Kas' },
        { value: 'pending', label: 'Belum Selesai (Pending)' },
        { value: 'settled', label: 'Lunas / Settled' },
    ];

    const driverOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Pengemudi' },
        ...drivers.map((d) => ({ value: String(d.id), label: d.name })),
    ], [drivers]);

    const vehicleOptions: SelectOption[] = useMemo(() => [
        { value: '', label: 'Semua Kendaraan' },
        ...vehicles.map((v) => ({ value: String(v.id), label: `${v.plate_number} - ${v.name}` })),
    ], [vehicles]);

    return (
        <DynamicLayout>
            <Head title="SPPD & Uang Jalan Pengemudi - Rental" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                <PageHeader
                    title="Surat Perintah Perjalanan Dinas (SPPD) & Uang Jalan"
                    subtitle="Kelola surat tugas supir, pencairan uang muka perjalanan, pencatatan nota riil, dan rekonsiliasi kas lembur."
                    actions={
                        <Link href={route(`${routePrefix}.rental.duty_orders.create`)}>
                            <PrimaryButton className="inline-flex items-center gap-2">
                                <span className="text-base">＋</span> Buat SPPD Baru
                            </PrimaryButton>
                        </Link>
                    }
                />

                <RentalNav />

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total SPPD</div>
                        <div className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{metrics.total_orders}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Sedang Bertugas</div>
                        <div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.active_orders}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Kas Belum Selesai</div>
                        <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{metrics.pending_settlement}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Uang Muka Keluar</div>
                        <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(metrics.total_advance_disbursed)}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Realisasi Nota Riil</div>
                        <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(metrics.total_actual_expenses)}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Netto Kas Belum Selesai</div>
                        <div className={`mt-1 text-lg font-bold ${metrics.total_net_balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(metrics.total_net_balance)}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="lg:col-span-2">
                            <TextInput
                                placeholder="Cari No SPPD, rute, supir, tamu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilter({ search });
                                    }
                                }}
                                className="w-full text-sm"
                            />
                        </div>

                        <div>
                            <Select
                                value={status}
                                options={statusOptions}
                                onChange={(val) => {
                                    setStatus(val);
                                    applyFilter({ status: val });
                                }}
                            />
                        </div>

                        <div>
                            <Select
                                value={settlementStatus}
                                options={settlementOptions}
                                onChange={(val) => {
                                    setSettlementStatus(val);
                                    applyFilter({ settlement_status: val });
                                }}
                            />
                        </div>

                        <div>
                            <Select
                                value={String(driverId)}
                                options={driverOptions}
                                onChange={(val) => {
                                    const id = val ? Number(val) : '';
                                    setDriverId(id);
                                    applyFilter({ driver_id: id });
                                }}
                            />
                        </div>

                        <div>
                            <Select
                                value={String(vehicleId)}
                                options={vehicleOptions}
                                onChange={(val) => {
                                    const id = val ? Number(val) : '';
                                    setVehicleId(id);
                                    applyFilter({ vehicle_id: id });
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500">
                            Menampilkan <span className="font-semibold">{orders.total}</span> surat tugas perjalanan dinas
                        </div>
                        <div className="flex items-center gap-2">
                            <SecondaryButton
                                onClick={() => {
                                    setSearch('');
                                    setStatus('all');
                                    setSettlementStatus('all');
                                    setDriverId('');
                                    setVehicleId('');
                                    setDate('');
                                    router.get(route(`${routePrefix}.rental.duty_orders.index`));
                                }}
                                className="text-xs py-1 px-3"
                            >
                                Reset Filter
                            </SecondaryButton>
                            <PrimaryButton
                                onClick={() => applyFilter({ search })}
                                className="text-xs py-1 px-3"
                            >
                                Terapkan
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* Table of Orders */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-3 px-4">No. SPPD & Tanggal</th>
                                    <th className="py-3 px-4">Pengemudi & Unit</th>
                                    <th className="py-3 px-4">Rute & Penumpang</th>
                                    <th className="py-3 px-4 text-right">Uang Muka</th>
                                    <th className="py-3 px-4 text-right">Nota Riil</th>
                                    <th className="py-3 px-4 text-right">Saldo Kas</th>
                                    <th className="py-3 px-4 text-center">Status Operasional</th>
                                    <th className="py-3 px-4 text-center">Status Kas</th>
                                    <th className="py-3 px-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <span className="text-3xl">👨‍✈️</span>
                                                <p className="font-medium">Belum ada Surat Perintah Perjalanan Dinas (SPPD)</p>
                                                <Link href={route(`${routePrefix}.rental.duty_orders.create`)}>
                                                    <SecondaryButton className="mt-2 text-xs">
                                                        Buat SPPD Pertama
                                                    </SecondaryButton>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((order) => {
                                        const isCashAdvanceSurplus = order.net_balance >= 0;

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                                                <td className="py-3 px-4">
                                                    <Link
                                                        href={route(`${routePrefix}.rental.duty_orders.show`, order.id)}
                                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                                    >
                                                        <span>📄</span> {order.duty_order_number}
                                                    </Link>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {order.departure_date} s/d {order.return_date}
                                                    </div>
                                                    {order.rental && (
                                                        <div className="text-[11px] text-slate-400 mt-0.5">
                                                            Booking: <span className="font-mono text-slate-600 dark:text-slate-300">{order.rental.code}</span>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-slate-800 dark:text-slate-100">
                                                        {order.driver?.name || '-'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-mono">
                                                        {order.vehicle?.plate_number} • {order.vehicle?.name}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="text-slate-700 dark:text-slate-200 font-medium">
                                                        {order.origin} ➔ {order.destination}
                                                    </div>
                                                    {order.passenger_name && (
                                                        <div className="text-xs text-slate-500">
                                                            Penumpang: {order.passenger_name}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                                    {formatCurrency(order.cash_advance_amount)}
                                                </td>

                                                <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                                    {formatCurrency(order.actual_expense_total)}
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <div className={`font-semibold ${isCashAdvanceSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {formatCurrency(order.net_balance)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {isCashAdvanceSurplus ? 'Sisa Kembali' : 'Kurang / Talangan'}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    {statusBadge(order.status)}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    {settlementBadge(order.settlement_status)}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Link
                                                            href={route(`${routePrefix}.rental.duty_orders.show`, order.id)}
                                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                                                        >
                                                            Rincian & Kas
                                                        </Link>
                                                        <a
                                                            href={route(`${routePrefix}.rental.duty_orders.print`, order.id)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                                                            title="Cetak SPPD"
                                                        >
                                                            🖨️ Cetak
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {orders.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="text-xs text-slate-500">
                                Halaman {orders.current_page} dari {orders.last_page}
                            </div>
                            <div className="flex gap-1">
                                {orders.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded cursor-not-allowed"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-2.5 py-1 text-xs rounded transition ${
                                                link.active
                                                    ? 'bg-blue-600 text-white font-semibold'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

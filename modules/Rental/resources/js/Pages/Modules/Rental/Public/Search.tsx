import PublicSelect from '@/Components/PublicSelect';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
}

interface LocationOption {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
}

interface ClassOption {
    value: string;
    label: string;
}

interface VehicleCard {
    id: number;
    name: string;
    plate_number: string;
    rental_class: string | null;
    rental_class_label: string | null;
    capacity_seats: number | null;
    color: string | null;
    model_year: number | null;
    photo_url: string | null;
    from_price: number | null;
    deposit_amount: number | null;
}

interface Props {
    brand: Brand;
    filters: {
        start_date: string | null;
        end_date: string | null;
        period_type: string;
        pickup_location_id: number | null;
        return_location_id: number | null;
        rental_class: string | null;
    };
    classes: ClassOption[];
    locations: LocationOption[];
    vehicles: VehicleCard[];
    searched: boolean;
    hold_ttl_minutes: number;
    gateway_available: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const fieldClassName =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20';

const periodOptions = [
    { value: 'daily', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
];

export default function Search({
    brand,
    filters,
    classes,
    locations,
    vehicles,
    searched,
    hold_ttl_minutes,
}: Props) {
    const form = useForm({
        start_date: filters.start_date ?? '',
        end_date: filters.end_date ?? '',
        period_type: filters.period_type || 'daily',
        pickup_location_id: filters.pickup_location_id ? String(filters.pickup_location_id) : '',
        return_location_id: filters.return_location_id ? String(filters.return_location_id) : '',
        rental_class: filters.rental_class ?? '',
    });

    const depotOptions = useMemo(
        () =>
            locations.map((location) => ({
                value: String(location.id),
                label: location.city ? `${location.name} · ${location.city}` : location.name,
            })),
        [locations],
    );

    const classOptions = useMemo(
        () => [
            { value: '', label: 'Semua Kelas' },
            ...classes.map((item) => ({ value: item.value, label: item.label || item.value })),
        ],
        [classes],
    );

    const pickupOptions = useMemo(
        () => [{ value: '', label: 'Pilih Depot Penjemputan' }, ...depotOptions],
        [depotOptions],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: 'Sama dengan Lokasi Jemput' }, ...depotOptions],
        [depotOptions],
    );

    // Calculate duration in days for display hint
    const daysDuration = useMemo(() => {
        if (!form.data.start_date || !form.data.end_date) return null;
        const start = new Date(form.data.start_date);
        const end = new Date(form.data.end_date);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : null;
    }, [form.data.start_date, form.data.end_date]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('book.rental.search'),
            {
                start_date: form.data.start_date || undefined,
                end_date: form.data.end_date || undefined,
                period_type: form.data.period_type || 'daily',
                pickup_location_id: form.data.pickup_location_id || undefined,
                return_location_id: form.data.return_location_id || undefined,
                rental_class: form.data.rental_class || undefined,
            },
            { preserveState: true },
        );
    };

    const vehicleUrl = (vehicleId: number) =>
        route('book.rental.vehicles.show', vehicleId) +
        '?' +
        new URLSearchParams({
            start_date: form.data.start_date,
            end_date: form.data.end_date,
            period_type: form.data.period_type,
            ...(form.data.pickup_location_id ? { pickup_location_id: form.data.pickup_location_id } : {}),
            ...(form.data.return_location_id ? { return_location_id: form.data.return_location_id } : {}),
        }).toString();

    return (
        <div className="min-h-screen bg-slate-900 font-sans antialiased">
            <Head title={`${brand.name} · Sewa Kendaraan`} />

            {/* Header section with brand accent */}
            <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 pb-12 pt-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none" />
                <div className="mx-auto max-w-xl px-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/40">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-white">{brand.name}</h1>
                                <p className="text-xs text-slate-400">Layanan Sewa Kendaraan Online</p>
                            </div>
                        </div>

                        <Link
                            href={route('book.rental.history')}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3.5 py-1.5 text-xs font-medium text-teal-300 backdrop-blur-sm transition hover:bg-slate-700 hover:text-teal-200 ring-1 ring-slate-700"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Riwayat Pesanan
                        </Link>
                    </div>

                    {/* Step indicator */}
                    <div className="mt-8 grid grid-cols-4 gap-1 rounded-xl bg-slate-800/60 p-1.5 text-center text-xs backdrop-blur-md ring-1 ring-white/10">
                        <div className="rounded-lg bg-teal-500/20 py-1.5 font-semibold text-teal-300 ring-1 ring-teal-500/30">
                            1. Cari
                        </div>
                        <div className="py-1.5 text-slate-400">2. Pilih Unit</div>
                        <div className="py-1.5 text-slate-400">3. OTP</div>
                        <div className="py-1.5 text-slate-400">4. Bayar</div>
                    </div>
                </div>
            </div>

            {/* Main content wrapper */}
            <div className="mx-auto max-w-xl px-4 -mt-6 pb-12 relative z-20">
                {/* Search Form Card */}
                <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200/60">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Pencarian Ketersediaan</h2>
                        {daysDuration !== null && (
                            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                                Durasi: {daysDuration} Hari
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-slate-700">
                            Mulai Sewa
                            <input
                                type="date"
                                className={fieldClassName}
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                                required
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                            Selesai Sewa
                            <input
                                type="date"
                                className={fieldClassName}
                                value={form.data.end_date}
                                onChange={(e) => form.setData('end_date', e.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Periode Tarif</label>
                        <PublicSelect
                            value={form.data.period_type}
                            onChange={(value) => form.setData('period_type', value || 'daily')}
                            options={periodOptions}
                            placeholder="Pilih Periode"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Depot Penjemputan</label>
                            <PublicSelect
                                value={form.data.pickup_location_id}
                                onChange={(value) => {
                                    form.setData({
                                        ...form.data,
                                        pickup_location_id: value,
                                        return_location_id: form.data.return_location_id || value,
                                    });
                                }}
                                options={pickupOptions}
                                placeholder="Pilih Depot"
                                emptyText="Belum ada depot aktif"
                            />
                            {locations.length === 0 && (
                                <p className="mt-1 text-xs text-amber-600">Belum ada depot aktif di sistem.</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Depot Pengembalian</label>
                            <PublicSelect
                                value={form.data.return_location_id}
                                onChange={(value) => form.setData('return_location_id', value)}
                                options={returnOptions}
                                placeholder="Sama dengan lokasi jemput"
                                emptyText="Belum ada depot aktif"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Kelas Kendaraan</label>
                        <PublicSelect
                            value={form.data.rental_class}
                            onChange={(value) => form.setData('rental_class', value)}
                            options={classOptions}
                            placeholder="Semua Kelas Kendaraan"
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700 active:scale-[0.99]"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Cari Kendaraan Tersedia
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 pt-1">
                        <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Pemesanan menahan unit hingga <b>{hold_ttl_minutes} menit</b> untuk bayar deposit.</span>
                    </div>
                </form>

                {/* Results Section */}
                <div className="mt-6 space-y-4">
                    {!searched && (
                        <div className="rounded-2xl bg-slate-800/60 p-8 text-center backdrop-blur-sm ring-1 ring-white/10">
                            <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-3 text-sm font-medium text-slate-300">Pilih tanggal sewa di atas untuk mencari kendaraan.</p>
                        </div>
                    )}

                    {searched && vehicles.length === 0 && (
                        <div className="rounded-2xl bg-slate-800/80 p-8 text-center backdrop-blur-sm ring-1 ring-white/10">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-sm font-bold text-white">Tidak Ada Kendaraan Tersedia</h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Coba sesuaikan tanggal sewa, periode tarif, atau kelas kendaraan yang Anda cari.
                            </p>
                        </div>
                    )}

                    {vehicles.map((vehicle) => (
                        <Link
                            key={vehicle.id}
                            href={vehicleUrl(vehicle.id)}
                            className="group relative flex flex-col sm:flex-row gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ring-1 ring-slate-200/80"
                        >
                            {/* Photo Container */}
                            <div className="relative h-44 sm:h-32 sm:w-40 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                {vehicle.photo_url ? (
                                    <img
                                        src={vehicle.photo_url}
                                        alt={vehicle.name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">Tanpa Foto</span>
                                    </div>
                                )}

                                {vehicle.rental_class_label && (
                                    <span className="absolute left-2.5 top-2.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                                        {vehicle.rental_class_label}
                                    </span>
                                )}
                            </div>

                            {/* Info Container */}
                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                                            {vehicle.name}
                                        </h3>
                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
                                            {vehicle.plate_number}
                                        </span>
                                    </div>

                                    {/* Specifications badges */}
                                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
                                        {vehicle.capacity_seats && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                {vehicle.capacity_seats} Kursi
                                            </span>
                                        )}
                                        {vehicle.model_year && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                                Tahun {vehicle.model_year}
                                            </span>
                                        )}
                                        {vehicle.color && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                                {vehicle.color}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Price tag & action footer */}
                                <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                                    <div>
                                        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mulai Dari</div>
                                        {vehicle.from_price != null ? (
                                            <div className="text-base font-extrabold text-teal-600">
                                                {money(vehicle.from_price)}
                                                <span className="text-xs font-normal text-slate-500"> / periode</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400">Hubungi CS</div>
                                        )}
                                    </div>

                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform">
                                        Pilih Unit
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <p className="mt-8 text-center text-xs text-slate-400">
                    Sewa Kendaraan Resmi dari {brand.name}. Pengambilan & pengembalian di cabang depot terpilih.
                </p>
            </div>
        </div>
    );
}

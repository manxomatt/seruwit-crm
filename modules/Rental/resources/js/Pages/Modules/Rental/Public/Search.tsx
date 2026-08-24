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
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[var(--brand-color)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20';

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

    const brandColor = brand.color || '#0f766e';

    return (
        <div 
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${brand.name} · Sewa Kendaraan`} />

            {/* Brand Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div 
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold tracking-tight text-slate-900">{brand.name}</h1>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Sewa Kendaraan Resmi</p>
                        </div>
                    </div>

                    <Link
                        href={route('book.rental.history')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-xs"
                    >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Riwayat Pesanan
                    </Link>
                </div>
            </div>

            {/* Main content wrapper (Wide layout for desktop) */}
            <div className="mx-auto max-w-7xl px-4 py-6 pb-16 space-y-6">
                
                {/* Stepper progress indicator */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold uppercase tracking-wider max-w-md">
                    <div className="rounded-xl bg-white p-2.5 border-b-2 shadow-xs border-[var(--brand-color)] text-[var(--brand-color)]">
                        1. Cari
                    </div>
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">2. Pilih</div>
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">3. OTP</div>
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">4. Bayar</div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column: Search Form Card */}
                    <div className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-[90px] z-10">
                        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/85 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cari Ketersediaan</h2>
                                {daysDuration !== null && (
                                    <span 
                                        className="rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                        style={{ 
                                            color: 'var(--brand-color)', 
                                            backgroundColor: 'rgba(15, 118, 110, 0.05)',
                                            borderColor: 'rgba(15, 118, 110, 0.15)'
                                        }}
                                    >
                                        {daysDuration} Hari
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs font-bold text-slate-700">
                                    Tanggal Mulai
                                    <input
                                        type="date"
                                        className={fieldClassName}
                                        value={form.data.start_date}
                                        onChange={(e) => form.setData('start_date', e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="text-xs font-bold text-slate-700">
                                    Tanggal Selesai
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
                                <label className="mb-1 block text-xs font-bold text-slate-700">Periode Tarif</label>
                                <PublicSelect
                                    value={form.data.period_type}
                                    onChange={(value) => form.setData('period_type', value || 'daily')}
                                    options={periodOptions}
                                    placeholder="Pilih Periode"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Depot Penjemputan</label>
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
                                        <p className="mt-1 text-xs text-amber-600 font-medium">Belum ada depot aktif di sistem.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Depot Pengembalian</label>
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
                                <label className="mb-1 block text-xs font-bold text-slate-700">Kelas Kendaraan</label>
                                <PublicSelect
                                    value={form.data.rental_class}
                                    onChange={(value) => form.setData('rental_class', value)}
                                    options={classOptions}
                                    placeholder="Semua Kelas Kendaraan"
                                />
                            </div>

                            <button
                                type="submit"
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-[0.99]"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Cari Kendaraan
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 pt-1">
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--brand-color)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Hold unit hingga <b>{hold_ttl_minutes} menit</b> untuk bayar.</span>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Vehicle Catalog Grid */}
                    <div className="flex-1 w-full">
                        {!searched && (
                            <div className="rounded-2xl bg-white p-12 text-center border border-slate-200/80 shadow-xs">
                                <svg className="mx-auto h-16 w-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <h3 className="mt-4 text-base font-bold text-slate-900">Temukan Kendaraan Anda</h3>
                                <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto font-medium">Pilih tanggal sewa dan lokasi depot di panel samping untuk memulai pencarian armada aktif.</p>
                            </div>
                        )}

                        {searched && vehicles.length === 0 && (
                            <div className="rounded-2xl bg-white p-12 text-center border border-slate-200/80 shadow-xs">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-500 border border-amber-200">
                                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-base font-bold text-slate-900">Tidak Ada Kendaraan Tersedia</h3>
                                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                                    Armada kami mungkin sedang fully-booked atau tidak cocok dengan filter Anda. Silakan coba sesuaikan tanggal sewa atau kelas kendaraan lain.
                                </p>
                            </div>
                        )}

                        {searched && vehicles.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {vehicles.map((vehicle) => (
                                    <Link
                                        key={vehicle.id}
                                        href={vehicleUrl(vehicle.id)}
                                        className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/85 hover:border-[var(--brand-color)] hover:shadow-md transition-all duration-200"
                                    >
                                        <div>
                                            {/* Photo Container */}
                                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                                                {vehicle.photo_url ? (
                                                    <img
                                                        src={vehicle.photo_url}
                                                        alt={vehicle.name}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                                        <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Tanpa Foto</span>
                                                    </div>
                                                )}

                                                {vehicle.rental_class_label && (
                                                    <span 
                                                        className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                                    >
                                                        {vehicle.rental_class_label}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info Body */}
                                            <div className="p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[var(--brand-color)] transition-colors line-clamp-1">
                                                        {vehicle.name}
                                                    </h3>
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-600 border border-slate-200 shrink-0">
                                                        {vehicle.plate_number}
                                                    </span>
                                                </div>

                                                {/* Specifications badges */}
                                                <div className="flex flex-wrap gap-1.5 text-xs">
                                                    {vehicle.capacity_seats && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-200/50">
                                                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            {vehicle.capacity_seats} Kursi
                                                        </span>
                                                    )}
                                                    {vehicle.model_year && (
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 border border-slate-200/50">
                                                            Th {vehicle.model_year}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & CTA Footer */}
                                        <div className="border-t border-slate-100 p-4 pt-3 flex items-center justify-between bg-slate-50/50">
                                            <div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tarif Sewa</div>
                                                {vehicle.from_price != null ? (
                                                    <div className="text-sm font-extrabold text-[var(--brand-color)]">
                                                        {money(vehicle.from_price)}
                                                        <span className="text-[10px] font-normal text-slate-500">/{vehicle.rental_class === 'daily' ? 'hari' : 'periode'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-450 font-bold">Call CS</div>
                                                )}
                                            </div>

                                            <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 hover:border-[var(--brand-color)] px-3 py-1.5 text-xs font-bold text-[var(--brand-color)] group-hover:bg-[var(--brand-color)] group-hover:text-white transition-all shadow-xs">
                                                Pilih
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                </svg>
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 font-medium pt-4">
                    Sewa Kendaraan Resmi dari {brand.name}. Pengambilan & pengembalian dilakukan di cabang depot resmi.
                </p>
            </div>
        </div>
    );
}

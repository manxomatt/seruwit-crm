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
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

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
            { value: '', label: 'Semua kelas' },
            ...classes.map((item) => ({ value: item.value, label: item.label || item.value })),
        ],
        [classes],
    );

    const pickupOptions = useMemo(
        () => [{ value: '', label: 'Pilih depot' }, ...depotOptions],
        [depotOptions],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: 'Sama dengan jemput' }, ...depotOptions],
        [depotOptions],
    );

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
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title={`${brand.name} · Sewa kendaraan`} />
            <div className="mx-auto max-w-lg px-4">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight" style={{ color: brand.color }}>
                        {brand.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">Sewa kendaraan online</p>
                    <Link href={route('book.rental.history')} className="mt-2 inline-block text-sm text-slate-500 underline">
                        Riwayat pesanan
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-3 overflow-visible rounded-2xl bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-medium text-slate-600">
                            Mulai sewa
                            <input
                                type="date"
                                className={fieldClassName}
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                                required
                            />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                            Selesai sewa
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
                        <label className="mb-1 block text-xs font-medium text-slate-600">Periode tarif</label>
                        <PublicSelect
                            value={form.data.period_type}
                            onChange={(value) => form.setData('period_type', value || 'daily')}
                            options={periodOptions}
                            placeholder="Pilih periode"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Cabang jemput (depot)</label>
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
                            placeholder="Pilih depot"
                            emptyText="Belum ada depot aktif"
                        />
                        {locations.length === 0 && (
                            <p className="mt-1 text-xs text-amber-700">Belum ada depot aktif di Fleet → Bases.</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Cabang kembali (depot)</label>
                        <PublicSelect
                            value={form.data.return_location_id}
                            onChange={(value) => form.setData('return_location_id', value)}
                            options={returnOptions}
                            placeholder="Sama dengan jemput"
                            emptyText="Belum ada depot aktif"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">Kelas kendaraan</label>
                        <PublicSelect
                            value={form.data.rental_class}
                            onChange={(value) => form.setData('rental_class', value)}
                            options={classOptions}
                            placeholder="Semua kelas"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white"
                        style={{ background: brand.color }}
                    >
                        Cari ketersediaan
                    </button>
                    <p className="text-center text-xs text-slate-500">
                        Setelah pesan, unit ditahan hingga {hold_ttl_minutes} menit untuk bayar deposit.
                    </p>
                </form>

                <div className="mt-6 space-y-3">
                    {!searched && (
                        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                            Pilih tanggal sewa untuk melihat kendaraan tersedia.
                        </p>
                    )}
                    {searched && vehicles.length === 0 && (
                        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
                            Tidak ada kendaraan dengan tarif aktif untuk periode ini. Pastikan unit punya kelas rental
                            yang cocok dengan skema tarif, atau coba ubah tanggal/kelas.
                        </p>
                    )}
                    {vehicles.map((vehicle) => (
                        <Link
                            key={vehicle.id}
                            href={vehicleUrl(vehicle.id)}
                            className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:ring-1 hover:ring-teal-200"
                        >
                            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {vehicle.photo_url ? (
                                    <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-400">Foto</div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900">{vehicle.name}</div>
                                <div className="text-xs text-slate-500">
                                    {vehicle.rental_class_label ?? '—'}
                                    {vehicle.capacity_seats ? ` · ${vehicle.capacity_seats} kursi` : ''}
                                    {vehicle.model_year ? ` · ${vehicle.model_year}` : ''}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">{vehicle.plate_number}</div>
                                {vehicle.from_price != null && (
                                    <div className="mt-1 text-sm font-semibold" style={{ color: brand.color }}>
                                        dari {money(vehicle.from_price)}
                                        <span className="font-normal text-slate-500"> / periode</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                <p className="mt-8 text-center text-xs text-slate-400">
                    Pengambilan & pengembalian dilakukan di cabang sesuai jadwal.
                </p>
            </div>
        </div>
    );
}

import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

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
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

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

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(route('book.rental.search'), form.data, { preserveState: true });
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

                <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
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

                    <label className="block text-xs font-medium text-slate-600">
                        Periode tarif
                        <select
                            className={fieldClassName}
                            value={form.data.period_type}
                            onChange={(e) => form.setData('period_type', e.target.value)}
                        >
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                        </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Lokasi ambil
                        <select
                            className={fieldClassName}
                            value={form.data.pickup_location_id}
                            onChange={(e) => {
                                form.setData('pickup_location_id', e.target.value);
                                if (!form.data.return_location_id) {
                                    form.setData('return_location_id', e.target.value);
                                }
                            }}
                        >
                            <option value="">Pilih lokasi</option>
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                    {location.city ? ` · ${location.city}` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Lokasi kembali
                        <select
                            className={fieldClassName}
                            value={form.data.return_location_id}
                            onChange={(e) => form.setData('return_location_id', e.target.value)}
                        >
                            <option value="">Sama dengan ambil</option>
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                    {location.city ? ` · ${location.city}` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Kelas kendaraan
                        <select
                            className={fieldClassName}
                            value={form.data.rental_class}
                            onChange={(e) => form.setData('rental_class', e.target.value)}
                        >
                            <option value="">Semua kelas</option>
                            {classes.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>

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
                            Tidak ada kendaraan tersedia. Coba ubah tanggal atau kelas.
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

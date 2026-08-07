import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
}

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string | null;
    rental_class: string | null;
    rental_class_label: string | null;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity_seats: number | null;
    fuel_type: string | null;
    photo_url: string | null;
}

interface Quote {
    available: boolean;
    reasons: string[];
    total_periods: number;
    rate_per_period: number | null;
    deposit_amount: number | null;
    base_amount: number | null;
    one_way_fee_amount: number | null;
    insurance_amount: number | null;
    total_amount: number | null;
    min_periods: number | null;
}

interface InsurancePackage {
    id: number;
    code: string;
    name: string;
    amount: number;
    description: string | null;
}

interface LocationOption {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
}

interface Props {
    brand: Brand;
    vehicle: Vehicle;
    filters: {
        start_date: string;
        end_date: string;
        period_type: string;
        pickup_location_id: number | null;
        return_location_id: number | null;
        insurance_package_id: number | null;
    };
    quote: Quote;
    locations: LocationOption[];
    insurance_packages: InsurancePackage[];
    hold_ttl_minutes: number;
    gateway_available: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const selectClassName =
    'mt-1 block w-full appearance-none rounded-md border border-gray-300 bg-white bg-[length:1.25rem] bg-[right_0.6rem_center] bg-no-repeat py-2.5 pl-3 pr-10 text-sm text-slate-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

const selectChevron =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9'/%3E%3C/svg%3E";

const fieldClassName =
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600';

export default function VehicleShow({
    brand,
    vehicle,
    filters,
    quote: initialQuote,
    locations,
    insurance_packages,
    hold_ttl_minutes,
}: Props) {
    const { flash, errors } = usePage().props as {
        flash?: { success?: string; error?: string };
        errors: Record<string, string>;
    };
    const [quote, setQuote] = useState(initialQuote);
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [quoting, setQuoting] = useState(false);

    const form = useForm({
        vehicle_id: vehicle.id,
        start_date: filters.start_date,
        end_date: filters.end_date,
        period_type: filters.period_type,
        pickup_location_id: filters.pickup_location_id ? String(filters.pickup_location_id) : '',
        return_location_id: filters.return_location_id ? String(filters.return_location_id) : '',
        insurance_package_id: filters.insurance_package_id ? String(filters.insurance_package_id) : '',
        customer_name: '',
        customer_email: '',
        booker_phone: '',
        otp_code: '',
        notes: '',
    });

    const refreshQuote = async (overrides: Partial<typeof form.data> = {}) => {
        const payload = { ...form.data, ...overrides };
        setQuoting(true);
        try {
            const { data } = await axios.post(route('book.rental.quote'), {
                vehicle_id: Number(payload.vehicle_id),
                start_date: payload.start_date,
                end_date: payload.end_date,
                period_type: payload.period_type,
                pickup_location_id: payload.pickup_location_id || null,
                return_location_id: payload.return_location_id || null,
                insurance_package_id: payload.insurance_package_id || null,
            });
            setQuote(data.quote);
        } finally {
            setQuoting(false);
        }
    };

    const sendOtp = async () => {
        if (!form.data.booker_phone) {
            return;
        }
        const { data } = await axios.post(route('book.rental.otp'), {
            booker_phone: form.data.booker_phone,
        });
        setOtpHint(data.debug_code ? `Kode (dev): ${data.debug_code}` : data.message);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('book.rental.bookings.store'));
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <Head title={`${vehicle.name} · Sewa`} />
            <div className="mx-auto max-w-lg px-4">
                <Link href={route('book.rental.search')} className="text-sm text-slate-500">
                    ← Kembali ke pencarian
                </Link>
                <h1 className="mt-2 text-xl font-semibold" style={{ color: brand.color }}>
                    {brand.name}
                </h1>

                {(flash?.error || flash?.success) && (
                    <p className={`mt-3 rounded-md px-3 py-2 text-sm ${flash.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {flash.error || flash.success}
                    </p>
                )}

                <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="aspect-[16/9] bg-slate-100">
                        {vehicle.photo_url ? (
                            <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">Tidak ada foto</div>
                        )}
                    </div>
                    <div className="space-y-1 p-4">
                        <div className="text-lg font-semibold text-slate-900">{vehicle.name}</div>
                        <div className="text-sm text-slate-500">
                            {vehicle.rental_class_label ?? '—'}
                            {vehicle.capacity_seats ? ` · ${vehicle.capacity_seats} kursi` : ''}
                            {vehicle.fuel_type ? ` · ${vehicle.fuel_type}` : ''}
                        </div>
                        <div className="text-xs text-slate-400">{vehicle.plate_number}</div>
                    </div>
                </div>

                <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-medium text-slate-600">
                            Mulai
                            <input
                                type="date"
                                className={fieldClassName}
                                value={form.data.start_date}
                                onChange={(e) => {
                                    form.setData('start_date', e.target.value);
                                    void refreshQuote({ start_date: e.target.value });
                                }}
                                required
                            />
                        </label>
                        <label className="text-xs font-medium text-slate-600">
                            Selesai
                            <input
                                type="date"
                                className={fieldClassName}
                                value={form.data.end_date}
                                onChange={(e) => {
                                    form.setData('end_date', e.target.value);
                                    void refreshQuote({ end_date: e.target.value });
                                }}
                                required
                            />
                        </label>
                    </div>

                    <label className="block text-xs font-medium text-slate-600">
                        Cabang jemput (depot)
                        <select
                            className={selectClassName}
                            style={{ backgroundImage: `url("${selectChevron}")` }}
                            value={form.data.pickup_location_id}
                            onChange={(e) => {
                                const value = e.target.value;
                                form.setData({
                                    ...form.data,
                                    pickup_location_id: value,
                                    return_location_id: form.data.return_location_id || value,
                                });
                                void refreshQuote({
                                    pickup_location_id: value,
                                    return_location_id: form.data.return_location_id || value,
                                });
                            }}
                        >
                            <option value="">Pilih depot</option>
                            {locations.map((location) => (
                                <option key={location.id} value={String(location.id)}>
                                    {location.name}
                                    {location.city ? ` · ${location.city}` : ''}
                                </option>
                            ))}
                        </select>
                        {locations.length === 0 && (
                            <p className="mt-1 text-xs text-amber-700">Belum ada depot aktif di Fleet → Bases.</p>
                        )}
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Cabang kembali (depot)
                        <select
                            className={selectClassName}
                            style={{ backgroundImage: `url("${selectChevron}")` }}
                            value={form.data.return_location_id}
                            onChange={(e) => {
                                form.setData('return_location_id', e.target.value);
                                void refreshQuote({ return_location_id: e.target.value });
                            }}
                        >
                            <option value="">Sama dengan jemput</option>
                            {locations.map((location) => (
                                <option key={location.id} value={String(location.id)}>
                                    {location.name}
                                    {location.city ? ` · ${location.city}` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    {insurance_packages.length > 0 && (
                        <label className="block text-xs font-medium text-slate-600">
                            Paket asuransi
                            <select
                                className={selectClassName}
                                style={{ backgroundImage: `url("${selectChevron}")` }}
                                value={form.data.insurance_package_id}
                                onChange={(e) => {
                                    form.setData('insurance_package_id', e.target.value);
                                    void refreshQuote({ insurance_package_id: e.target.value });
                                }}
                            >
                                <option value="">Tanpa asuransi tambahan</option>
                                {insurance_packages.map((pkg) => (
                                    <option key={pkg.id} value={String(pkg.id)}>
                                        {pkg.name} · {money(pkg.amount)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div className="rounded-xl bg-slate-50 p-3 text-sm">
                        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                            <span>Ringkasan harga</span>
                            {quoting && <span>Menghitung…</span>}
                        </div>
                        {!quote.available && (
                            <p className="text-sm text-red-600">{quote.reasons[0] ?? 'Tidak tersedia untuk periode ini.'}</p>
                        )}
                        {quote.available && (
                            <dl className="space-y-1 text-slate-700">
                                <div className="flex justify-between gap-3">
                                    <dt>
                                        Sewa ({quote.total_periods} periode
                                        {quote.rate_per_period != null ? ` × ${money(quote.rate_per_period)}` : ''})
                                    </dt>
                                    <dd>{quote.base_amount != null ? money(quote.base_amount) : '—'}</dd>
                                </div>
                                {quote.one_way_fee_amount != null && quote.one_way_fee_amount > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt>Biaya one-way</dt>
                                        <dd>{money(quote.one_way_fee_amount)}</dd>
                                    </div>
                                )}
                                {quote.insurance_amount != null && quote.insurance_amount > 0 && (
                                    <div className="flex justify-between gap-3">
                                        <dt>Asuransi</dt>
                                        <dd>{money(quote.insurance_amount)}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between gap-3 border-t border-slate-200 pt-1 font-semibold">
                                    <dt>Total sewa</dt>
                                    <dd>{quote.total_amount != null ? money(quote.total_amount) : '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-3 text-amber-800">
                                    <dt>Deposit (dibayar sekarang)</dt>
                                    <dd>{quote.deposit_amount != null ? money(quote.deposit_amount) : '—'}</dd>
                                </div>
                            </dl>
                        )}
                    </div>

                    <label className="block text-xs font-medium text-slate-600">
                        Nama pemesan
                        <input
                            className={fieldClassName}
                            value={form.data.customer_name}
                            onChange={(e) => form.setData('customer_name', e.target.value)}
                            required
                        />
                        {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Email (opsional — untuk konfirmasi)
                        <input
                            type="email"
                            className={fieldClassName}
                            value={form.data.customer_email}
                            onChange={(e) => form.setData('customer_email', e.target.value)}
                            placeholder="nama@email.com"
                        />
                        {errors.customer_email && <p className="mt-1 text-xs text-red-600">{errors.customer_email}</p>}
                    </label>

                    <label className="block text-xs font-medium text-slate-600">
                        Nomor HP
                        <input
                            className={fieldClassName}
                            value={form.data.booker_phone}
                            onChange={(e) => form.setData('booker_phone', e.target.value)}
                            placeholder="08…"
                            required
                        />
                        {errors.booker_phone && <p className="mt-1 text-xs text-red-600">{errors.booker_phone}</p>}
                    </label>

                    <div className="flex gap-2">
                        <label className="block flex-1 text-xs font-medium text-slate-600">
                            Kode OTP
                            <input
                                className={fieldClassName}
                                value={form.data.otp_code}
                                onChange={(e) => form.setData('otp_code', e.target.value)}
                                maxLength={6}
                                required
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => void sendOtp()}
                            className="mt-5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Kirim OTP
                        </button>
                    </div>
                    {otpHint && <p className="text-xs text-slate-500">{otpHint}</p>}
                    {errors.otp_code && <p className="text-xs text-red-600">{errors.otp_code}</p>}

                    <label className="block text-xs font-medium text-slate-600">
                        Catatan (opsional)
                        <textarea
                            className={fieldClassName}
                            rows={2}
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={form.processing || !quote.available}
                        className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: brand.color }}
                    >
                        {form.processing ? 'Memproses…' : 'Pesan sekarang'}
                    </button>
                    <p className="text-center text-xs text-slate-500">
                        Setelah pesan, Anda punya {hold_ttl_minutes} menit untuk bayar deposit agar unit tetap ditahan.
                    </p>
                </form>
            </div>
        </div>
    );
}

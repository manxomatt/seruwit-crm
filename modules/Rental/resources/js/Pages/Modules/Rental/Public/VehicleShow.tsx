import PublicSelect from '@/Components/PublicSelect';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useMemo, useState } from 'react';

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

const fieldClassName =
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20';

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
    const [sendingOtp, setSendingOtp] = useState(false);
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

    const depotOptions = useMemo(
        () =>
            locations.map((location) => ({
                value: String(location.id),
                label: location.city ? `${location.name} · ${location.city}` : location.name,
            })),
        [locations],
    );

    const pickupOptions = useMemo(
        () => [{ value: '', label: 'Pilih Depot Penjemputan' }, ...depotOptions],
        [depotOptions],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: 'Sama dengan Lokasi Jemput' }, ...depotOptions],
        [depotOptions],
    );

    const insuranceOptions = useMemo(
        () => [
            { value: '', label: 'Tanpa Asuransi Tambahan' },
            ...insurance_packages.map((pkg) => ({
                value: String(pkg.id),
                label: `${pkg.name} (${money(pkg.amount)})`,
            })),
        ],
        [insurance_packages],
    );

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
        } catch {
            // keep existing quote if error
        } finally {
            setQuoting(false);
        }
    };

    const sendOtp = async () => {
        if (!form.data.booker_phone) {
            alert('Masukkan nomor telepon terlebih dahulu');
            return;
        }
        setSendingOtp(true);
        try {
            const { data } = await axios.post(route('book.rental.otp'), {
                booker_phone: form.data.booker_phone,
            });
            setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
        } catch (err: any) {
            setOtpHint(err.response?.data?.message || 'Gagal mengirim OTP. Periksa nomor telepon.');
        } finally {
            setSendingOtp(false);
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('book.rental.bookings.store'), {
            preserveScroll: true,
            onError: () => {
                if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            },
        });
    };

    const errorMessages = Array.from(
        new Set([
            ...(flash?.error ? [flash.error] : []),
            ...(Object.values(form.errors).filter(Boolean) as string[]),
        ]),
    );

    return (
        <div className="min-h-screen bg-slate-900 font-sans antialiased pb-28">
            <Head title={`${vehicle.name} · Detail & Reservasi`} />

            {/* Header section with brand accent */}
            <div className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 pb-12 pt-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.15),transparent_50%)] pointer-events-none" />
                <div className="mx-auto max-w-xl px-4 relative z-10">
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('book.rental.search')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Kembali ke Pencarian
                        </Link>
                        <span className="text-xs font-bold text-teal-400">{brand.name}</span>
                    </div>

                    {/* Step indicator */}
                    <div className="mt-6 grid grid-cols-4 gap-1 rounded-xl bg-slate-800/60 p-1.5 text-center text-xs backdrop-blur-md ring-1 ring-white/10">
                        <div className="py-1.5 text-slate-400">1. Cari</div>
                        <div className="rounded-lg bg-teal-500/20 py-1.5 font-semibold text-teal-300 ring-1 ring-teal-500/30">
                            2. Detail & OTP
                        </div>
                        <div className="py-1.5 text-slate-400">3. Hold</div>
                        <div className="py-1.5 text-slate-400">4. Bayar</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-xl px-4 -mt-6 relative z-20 space-y-5">
                {/* Flash Notifications */}
                {(flash?.error || flash?.success) && (
                    <div className={`rounded-xl p-4 text-sm font-medium shadow-md ${flash.error ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                        {flash.error || flash.success}
                    </div>
                )}

                {/* Vehicle Hero Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                    <div className="relative aspect-[16/9] bg-slate-100">
                        {vehicle.photo_url ? (
                            <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="mt-1 text-xs font-medium uppercase tracking-wider">Tidak ada foto</span>
                            </div>
                        )}
                        {vehicle.rental_class_label && (
                            <span className="absolute left-3 top-3 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                {vehicle.rental_class_label}
                            </span>
                        )}
                    </div>

                    <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">{vehicle.name}</h1>
                                <p className="text-xs text-slate-500 font-medium">Plat Nomor: <span className="font-mono text-slate-800">{vehicle.plate_number}</span></p>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {vehicle.capacity_seats && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {vehicle.capacity_seats} Kursi
                                </span>
                            )}
                            {vehicle.fuel_type && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    {vehicle.fuel_type}
                                </span>
                            )}
                            {vehicle.model_year && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                    Tahun {vehicle.model_year}
                                </span>
                            )}
                            {vehicle.color && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                    {vehicle.color}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form & Quote calculation */}
                <form onSubmit={submit} className="space-y-5">
                    {/* Validation / Submission Error Summary */}
                    {errorMessages.length > 0 && (
                        <div className="rounded-2xl border border-rose-400/60 bg-rose-500/10 p-4 text-xs text-rose-100 ring-1 ring-rose-500/30">
                            <div className="flex items-start gap-2">
                                <span className="text-base leading-none">⛔</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-white">Pemesanan gagal diproses</p>
                                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                        {errorMessages.map((message, index) => (
                                            <li key={index}>{message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Setup Rental Options */}
                    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2 border-slate-100">
                            Konfigurasi Tanggal & Depot
                        </h2>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="text-xs font-semibold text-slate-700">
                                Tanggal Mulai
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
                            <label className="text-xs font-semibold text-slate-700">
                                Tanggal Selesai
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

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Depot Penjemputan</label>
                                <PublicSelect
                                    value={form.data.pickup_location_id}
                                    onChange={(value) => {
                                        const newReturn = form.data.return_location_id || value;
                                        form.setData({
                                            ...form.data,
                                            pickup_location_id: value,
                                            return_location_id: newReturn,
                                        });
                                        void refreshQuote({
                                            pickup_location_id: value,
                                            return_location_id: newReturn,
                                        });
                                    }}
                                    options={pickupOptions}
                                    placeholder="Pilih Depot"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">Depot Pengembalian</label>
                                <PublicSelect
                                    value={form.data.return_location_id}
                                    onChange={(value) => {
                                        form.setData('return_location_id', value);
                                        void refreshQuote({ return_location_id: value });
                                    }}
                                    options={returnOptions}
                                    placeholder="Sama dengan lokasi jemput"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">Paket Asuransi Tambahan</label>
                            <PublicSelect
                                value={form.data.insurance_package_id}
                                onChange={(value) => {
                                    form.setData('insurance_package_id', value);
                                    void refreshQuote({ insurance_package_id: value });
                                }}
                                options={insuranceOptions}
                                placeholder="Tanpa Asuransi Tambahan"
                            />
                        </div>
                    </div>

                    {/* Live Quote Breakdown Card */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl ring-1 ring-white/10">
                        {quoting && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-xs z-10">
                                <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Menghitung ulang tarif...
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">Rincian Estimasi Biaya</h3>
                            <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
                                Durasi: {quote.total_periods} Periode
                            </span>
                        </div>

                        {!quote.available ? (
                            <div className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300 border border-amber-500/20">
                                {quote.reasons[0] || 'Kendaraan tidak dapat dipesan untuk periode ini.'}
                            </div>
                        ) : (
                            <div className="mt-4 space-y-2.5 text-xs">
                                <div className="flex justify-between text-slate-300">
                                    <span>Sewa Dasar ({quote.total_periods} hari)</span>
                                    <span className="font-semibold text-white">{quote.base_amount ? money(quote.base_amount) : '—'}</span>
                                </div>

                                {quote.one_way_fee_amount != null && quote.one_way_fee_amount > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                        <span>Biaya Beda Depot (One-Way)</span>
                                        <span className="font-semibold text-white">{money(quote.one_way_fee_amount)}</span>
                                    </div>
                                )}

                                {quote.insurance_amount != null && quote.insurance_amount > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                        <span>Asuransi Tambahan</span>
                                        <span className="font-semibold text-white">{money(quote.insurance_amount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-white/10 pt-2.5 flex justify-between text-sm font-extrabold text-white">
                                    <span>Total Estimasi</span>
                                    <span className="text-teal-400">{quote.total_amount ? money(quote.total_amount) : '—'}</span>
                                </div>

                                <div className="rounded-xl bg-teal-500/10 p-3 mt-3 border border-teal-500/20 flex items-center justify-between text-xs">
                                    <div>
                                        <div className="font-bold text-teal-300">Wajib Deposit Saat Hold</div>
                                        <div className="text-[11px] text-slate-300">Hold unit selama {hold_ttl_minutes} menit</div>
                                    </div>
                                    <div className="text-sm font-extrabold text-teal-300">
                                        {quote.deposit_amount ? money(quote.deposit_amount) : 'Rp 0'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booker Details & OTP Section */}
                    <div className="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-2 border-slate-100">
                            Data Pemesan & Verifikasi OTP
                        </h2>

                        <div>
                            <label className="text-xs font-semibold text-slate-700">
                                Nama Lengkap Pemesan <span className="text-red-500">*</span>
                                <input
                                    type="text"
                                    className={fieldClassName}
                                    placeholder="Contoh: Budi Santoso"
                                    value={form.data.customer_name}
                                    onChange={(e) => form.setData('customer_name', e.target.value)}
                                    required
                                />
                            </label>
                            {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-700">
                                    Nomor Telepon (WhatsApp) <span className="text-red-500">*</span>
                                    <input
                                        type="tel"
                                        className={fieldClassName}
                                        placeholder="081234567890"
                                        value={form.data.booker_phone}
                                        onChange={(e) => form.setData('booker_phone', e.target.value)}
                                        required
                                    />
                                </label>
                                {errors.booker_phone && <p className="mt-1 text-xs text-red-600">{errors.booker_phone}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700">
                                    Email (Opsional)
                                    <input
                                        type="email"
                                        className={fieldClassName}
                                        placeholder="nama@email.com"
                                        value={form.data.customer_email}
                                        onChange={(e) => form.setData('customer_email', e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* OTP Verification Block */}
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-800">
                                    Kode OTP Verifikasi <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => void sendOtp()}
                                    disabled={sendingOtp || !form.data.booker_phone}
                                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                                >
                                    {sendingOtp ? 'Sending...' : 'Kirim Kode OTP'}
                                </button>
                            </div>

                            <input
                                type="text"
                                className={`${fieldClassName} tracking-widest text-center text-base font-bold bg-white`}
                                placeholder="0 0 0 0 0 0"
                                maxLength={6}
                                value={form.data.otp_code}
                                onChange={(e) => form.setData('otp_code', e.target.value)}
                                required
                            />

                            {otpHint && (
                                <p className="rounded-lg bg-teal-50 p-2.5 text-xs font-medium text-teal-800 border border-teal-200">
                                    {otpHint}
                                </p>
                            )}

                            {errors.otp_code && <p className="text-xs text-red-600">{errors.otp_code}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700">
                                Catatan Khusus (Opsional)
                                <textarea
                                    className={`${fieldClassName} h-20 resize-none`}
                                    placeholder="Permintaan tambahan atau lokasi spesifik..."
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Submit Bar Desktop */}
                    <div className="hidden sm:block">
                        <button
                            type="submit"
                            disabled={form.processing || !quote.available}
                            className="w-full rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-teal-600/30 transition hover:bg-teal-700 disabled:opacity-50"
                        >
                            {form.processing ? 'Memproses Reservasi...' : 'Konfirmasi & Pesan Unit'}
                        </button>
                    </div>

                    {/* Mobile Fixed Bottom Sticky Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-2xl">
                        <div className="mx-auto max-w-xl flex items-center justify-between gap-3">
                            <div>
                                <div className="text-[11px] font-medium text-slate-500 uppercase">Wajib Deposit</div>
                                <div className="text-base font-extrabold text-teal-600">
                                    {quote.deposit_amount ? money(quote.deposit_amount) : 'Rp 0'}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing || !quote.available}
                                className="flex-1 rounded-xl bg-teal-600 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-teal-600/30 transition hover:bg-teal-700 disabled:opacity-50 text-center"
                            >
                                {form.processing ? 'Memproses...' : 'Pesan Unit'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

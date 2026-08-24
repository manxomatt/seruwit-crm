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
    'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[var(--brand-color)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]/20';

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
    const [phoneVerified, setPhoneVerified] = useState(false);

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
        setOtpHint(null);
        try {
            const { data } = await axios.post(route('book.rental.otp'), {
                booker_phone: form.data.booker_phone,
            });
            if (data.already_verified) {
                setPhoneVerified(true);
                form.setData('otp_code', '000000');
                setOtpHint('Nomor WhatsApp Anda sudah terverifikasi ✓');
            } else {
                setPhoneVerified(false);
                setOtpHint(data.debug_code ? `Kode OTP (Dev): ${data.debug_code}` : (data.message || 'OTP berhasil dikirim'));
                if (data.debug_code) {
                    form.setData('otp_code', String(data.debug_code));
                }
            }
        } catch (err: any) {
            setPhoneVerified(false);
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

    const brandColor = brand.color || '#0f766e';

    return (
        <div 
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 pb-28"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${vehicle.name} · Detail & Reservasi`} />

            {/* Brand Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
                    <Link
                        href={route('book.rental.search')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Kembali ke Catalog
                    </Link>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--brand-color)]">{brand.name}</span>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
                
                {/* Stepper progress indicator */}
                <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold uppercase tracking-wider max-w-md">
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">1. Cari</div>
                    <div className="rounded-xl bg-white p-2.5 border-b-2 shadow-xs border-[var(--brand-color)] text-[var(--brand-color)]">
                        2. Pilih & Detail
                    </div>
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">3. OTP</div>
                    <div className="rounded-xl bg-white p-2.5 text-slate-400 border border-slate-200/60 shadow-xs">4. Bayar</div>
                </div>

                {/* Flash Notifications */}
                {(flash?.error || flash?.success) && (
                    <div className={`rounded-xl p-4 text-sm font-medium shadow-md ${flash.error ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {flash.error || flash.success}
                    </div>
                )}

                {/* Validation / Submission Error Summary */}
                {errorMessages.length > 0 && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 max-w-3xl">
                        <div className="flex items-start gap-2">
                            <span className="text-base leading-none">⛔</span>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-rose-900">Pemesanan gagal diproses</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-rose-800">
                                    {errorMessages.map((message, index) => (
                                        <li key={index}>{message}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    
                    {/* Left Column: Vehicle Details Showcase */}
                    <div className="flex-1 w-full space-y-6">
                        {/* Vehicle Card */}
                        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                            <div className="relative aspect-[16/9] w-full bg-slate-50 border-b border-slate-100">
                                {vehicle.photo_url ? (
                                    <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                        <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">Tidak ada foto</span>
                                    </div>
                                )}
                                {vehicle.rental_class_label && (
                                    <span 
                                        className="absolute left-4 top-4 rounded-md px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    >
                                        {vehicle.rental_class_label}
                                    </span>
                                )}
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{vehicle.name}</h1>
                                    <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                        Plat Nomor: <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{vehicle.plate_number}</span>
                                    </p>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Spesifikasi Kendaraan</h3>
                                    {/* Specifications Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                                        {vehicle.capacity_seats && (
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 shadow-xs">
                                                <span className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1">Kapasitas</span>
                                                {vehicle.capacity_seats} Kursi
                                            </div>
                                        )}
                                        {vehicle.fuel_type && (
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 shadow-xs">
                                                <span className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1">Bahan Bakar</span>
                                                {vehicle.fuel_type}
                                            </div>
                                        )}
                                        {vehicle.model_year && (
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 shadow-xs">
                                                <span className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1">Tahun Rilis</span>
                                                {vehicle.model_year}
                                            </div>
                                        )}
                                        {vehicle.color && (
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 shadow-xs">
                                                <span className="block text-[9px] uppercase tracking-wider text-slate-450 mb-1">Warna</span>
                                                {vehicle.color}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* General Terms Alert */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
                            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Ketentuan & Syarat Umum</h3>
                            <ul className="list-disc list-inside text-xs font-medium text-slate-500 space-y-1.5 leading-relaxed">
                                <li>Pengambilan & pengembalian kendaraan wajib dilakukan di depot cabang yang telah dipilih.</li>
                                <li>Penyewa diwajibkan mengunggah dokumen KTP & SIM A yang valid saat serah terima.</li>
                                <li>Deposit wajib dibayarkan saat hold unit untuk menjamin unit kendaraan tidak dilepas.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Checkout & Quote Panel */}
                    <div className="w-full lg:w-[440px] shrink-0 space-y-6">
                        
                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Setup Rental Options */}
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b pb-2 border-slate-100">
                                    Konfigurasi Sewa
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    <label className="text-xs font-bold text-slate-700">
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
                                    <label className="text-xs font-bold text-slate-700">
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
                                        <label className="mb-1 block text-xs font-bold text-slate-700">Depot Jemput</label>
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
                                        <label className="mb-1 block text-xs font-bold text-slate-700">Depot Kembali</label>
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
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Paket Asuransi Tambahan</label>
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
                            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden">
                                {quoting && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs z-10">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--brand-color)]">
                                            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Menghitung...
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Rincian Estimasi Biaya</h3>
                                    <span 
                                        className="rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                        style={{ 
                                            color: 'var(--brand-color)', 
                                            backgroundColor: 'rgba(15, 118, 110, 0.05)',
                                            borderColor: 'rgba(15, 118, 110, 0.15)'
                                        }}
                                    >
                                        {quote.total_periods} Periode
                                    </span>
                                </div>

                                {!quote.available ? (
                                    <div className="mt-4 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-900 border border-amber-200">
                                        {quote.reasons[0] || 'Kendaraan tidak dapat dipesan untuk periode ini.'}
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-3 text-xs">
                                        <div className="flex justify-between text-slate-600 font-medium">
                                            <span>Sewa Dasar ({quote.total_periods} hari)</span>
                                            <span className="font-bold text-slate-900">{quote.base_amount ? money(quote.base_amount) : '—'}</span>
                                        </div>

                                        {quote.one_way_fee_amount != null && quote.one_way_fee_amount > 0 && (
                                            <div className="flex justify-between text-slate-600 font-medium">
                                                <span>Biaya Beda Depot (One-Way)</span>
                                                <span className="font-bold text-slate-900">{money(quote.one_way_fee_amount)}</span>
                                            </div>
                                        )}

                                        {quote.insurance_amount != null && quote.insurance_amount > 0 && (
                                            <div className="flex justify-between text-slate-600 font-medium">
                                                <span>Asuransi Tambahan</span>
                                                <span className="font-bold text-slate-900">{money(quote.insurance_amount)}</span>
                                            </div>
                                        )}

                                        <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                                            <span>Total Estimasi Sewa</span>
                                            <span className="text-base text-[var(--brand-color)]">{quote.total_amount ? money(quote.total_amount) : '—'}</span>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3.5 mt-3 border border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                                            <div>
                                                <div className="font-bold text-slate-950">Deposit Hold Unit</div>
                                                <div className="text-[10px] text-slate-550">Batas bayar {hold_ttl_minutes} menit</div>
                                            </div>
                                            <div className="text-sm font-extrabold text-[var(--brand-color)]">
                                                {quote.deposit_amount ? money(quote.deposit_amount) : 'Rp 0'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Booker Details & OTP Section */}
                            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs space-y-4">
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b pb-2 border-slate-100">
                                    Identitas Pemesan & Verifikasi
                                </h2>

                                <div>
                                    <label className="text-xs font-bold text-slate-700">
                                        Nama Lengkap Pemesan <span className="text-rose-500">*</span>
                                        <input
                                            type="text"
                                            className={fieldClassName}
                                            placeholder="Nama lengkap Anda..."
                                            value={form.data.customer_name}
                                            onChange={(e) => form.setData('customer_name', e.target.value)}
                                            required
                                        />
                                    </label>
                                    {errors.customer_name && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.customer_name}</p>}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700">
                                            Nomor Telepon (WhatsApp) <span className="text-rose-500">*</span>
                                            <input
                                                type="tel"
                                                className={fieldClassName}
                                                placeholder="Contoh: 081234567890"
                                                value={form.data.booker_phone}
                                                onChange={(e) => {
                                                    form.setData('booker_phone', e.target.value);
                                                    setPhoneVerified(false);
                                                    setOtpHint(null);
                                                }}
                                                required
                                            />
                                        </label>
                                        {errors.booker_phone && <p className="mt-1 text-xs text-rose-600 font-bold">{errors.booker_phone}</p>}
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700">
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
                                        <label className="text-xs font-bold text-slate-850">
                                            Kode OTP Verifikasi <span className="text-rose-500">*</span>
                                        </label>
                                        {!phoneVerified && (
                                            <button
                                                type="button"
                                                onClick={() => void sendOtp()}
                                                disabled={sendingOtp || !form.data.booker_phone}
                                                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                                            >
                                                {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                                            </button>
                                        )}
                                    </div>

                                    {phoneVerified ? (
                                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Terverifikasi ✓ (OTP tidak diperlukan)
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            className={`${fieldClassName} tracking-widest text-center text-base font-extrabold bg-white`}
                                            placeholder="0 0 0 0 0 0"
                                            maxLength={6}
                                            value={form.data.otp_code}
                                            onChange={(e) => form.setData('otp_code', e.target.value)}
                                            required
                                        />
                                    )}

                                    {otpHint && !phoneVerified && (
                                        <p className="rounded-lg bg-teal-50 p-2.5 text-xs font-medium text-teal-800 border border-teal-200">
                                            {otpHint}
                                        </p>
                                    )}

                                    {errors.otp_code && <p className="text-xs text-rose-600 font-bold">{errors.otp_code}</p>}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700">
                                        Catatan Tambahan (Opsional)
                                        <textarea
                                            className={`${fieldClassName} h-20 resize-none`}
                                            placeholder="Tulis permintaan khusus..."
                                            value={form.data.notes}
                                            onChange={(e) => form.setData('notes', e.target.value)}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={form.processing || !quote.available}
                                className="w-full rounded-xl py-3.5 text-sm font-extrabold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                {form.processing ? 'Memproses Reservasi...' : 'Konfirmasi & Pesan Unit'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>

            {/* Mobile Fixed Bottom Sticky Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 border-t border-slate-200 p-4 shadow-lg backdrop-blur-md">
                <div className="mx-auto max-w-xl flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Deposit Hold</div>
                        <div className="text-base font-extrabold text-[var(--brand-color)]">
                            {quote.deposit_amount ? money(quote.deposit_amount) : 'Rp 0'}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            // Programmatically trigger checkout form submit
                            const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
                            if (btn) btn.click();
                        }}
                        disabled={form.processing || !quote.available}
                        className="flex-1 rounded-xl py-3 px-4 text-xs font-extrabold text-white transition hover:opacity-95 disabled:opacity-50 text-center"
                        style={{ backgroundColor: 'var(--brand-color)' }}
                    >
                        {form.processing ? 'Memproses...' : 'Pesan Unit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

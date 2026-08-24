import PublicSelect from '@/Components/PublicSelect';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useMemo, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
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

interface Seo {
    title: string;
    description: string;
    image: string | null;
    url: string;
    json_ld: Record<string, unknown>;
}

interface Props {
    brand: Brand;
    vehicle: Vehicle;
    seo: Seo;
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
    'mt-1 w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10';

export default function VehicleShow({
    brand,
    vehicle,
    seo,
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
            className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col justify-between"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={seo.title}>
                <meta name="description" content={seo.description} head-key="description" />
                <meta property="og:type" content="product" head-key="og:type" />
                <meta property="og:title" content={seo.title} head-key="og:title" />
                <meta property="og:description" content={seo.description} head-key="og:description" />
                <meta property="og:url" content={seo.url} head-key="og:url" />
                {seo.image && <meta property="og:image" content={seo.image} head-key="og:image" />}
                <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} head-key="twitter:card" />
                <meta name="twitter:title" content={seo.title} head-key="twitter:title" />
                <meta name="twitter:description" content={seo.description} head-key="twitter:description" />
                {seo.image && <meta name="twitter:image" content={seo.image} head-key="twitter:image" />}
            </Head>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.json_ld).replace(/</g, '\\u003c') }}
            />

            <div>
                {/* Modern Crisp Glass Navbar */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
                        <Link href={route('book.rental.search')} className="flex items-center gap-3 group">
                            {brand.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-10 w-10 rounded-xl object-contain transition-transform duration-200 group-hover:scale-105"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs transition-transform duration-200 group-hover:scale-105"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">{brand.name}</h1>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Showroom & Rental Resmi</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                                <span>Kembali ke Katalog</span>
                            </Link>

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 transition hover:bg-emerald-100 shadow-2xs"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    WhatsApp CS
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Showcase & Checkout Container */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Link href={route('book.rental.search')} className="hover:text-slate-900">Katalog Kendaraan</Link>
                        <span>/</span>
                        <span className="text-slate-700">{vehicle.name}</span>
                    </div>

                    {/* Flash Notifications */}
                    {(flash?.error || flash?.success) && (
                        <div className={`rounded-2xl p-4 text-sm font-bold shadow-sm ${flash.error ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                            {flash.error || flash.success}
                        </div>
                    )}

                    {/* Validation Errors */}
                    {errorMessages.length > 0 && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs">
                            <div className="flex items-start gap-2.5">
                                <span className="text-base leading-none">⛔</span>
                                <div>
                                    <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">Pemesanan Belum Dapat Diproses</p>
                                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-rose-850">
                                        {errorMessages.map((msg, idx) => (
                                            <li key={idx}>{msg}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Split Layout: Showcase Left + Checkout Right */}
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* Left Column: Showcase & Specs */}
                        <div className="flex-1 w-full space-y-6">
                            
                            {/* Showcase Card */}
                            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xs">
                                <div className="relative aspect-[16/9] w-full bg-slate-100 border-b border-slate-100">
                                    {vehicle.photo_url ? (
                                        <img src={vehicle.photo_url} alt={vehicle.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                            <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Foto Unit Menyesuaikan</span>
                                        </div>
                                    )}

                                    {vehicle.rental_class_label && (
                                        <span 
                                            className="absolute left-4 top-4 rounded-lg px-3 py-1 text-xs font-black text-white shadow-xs"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            {vehicle.rental_class_label}
                                        </span>
                                    )}

                                    <span className="absolute right-4 top-4 rounded-lg bg-white/95 px-3 py-1 text-xs font-black text-emerald-800 shadow-2xs border border-slate-200 flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Unit Siap Pakai
                                    </span>
                                </div>

                                <div className="p-6 sm:p-7 space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{vehicle.name}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plat Nomor:</span>
                                                <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                                    {vehicle.plate_number}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4-column Specification Grid */}
                                    <div className="pt-2">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Spesifikasi Unit</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Kapasitas</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.capacity_seats ? `${vehicle.capacity_seats} Kursi` : '—'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Bahan Bakar</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.fuel_type || 'Bensin / Hybrid'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Tahun Rilis</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.model_year ? `Tahun ${vehicle.model_year}` : '—'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Warna</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.color || 'Standar'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inclusions & Guarantees Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3.5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Jaminan Standar Kenyamanan Kami</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-emerald-600 font-black">✓</span>
                                        <div>
                                            <div className="font-bold text-slate-900">Kondisi Bersih & Terawat</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Disinfeksi dan cuci menyeluruh sebelum diserahterimakan.</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-emerald-600 font-black">✓</span>
                                        <div>
                                            <div className="font-bold text-slate-900">Bantuan Darurat 24 Jam</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">Dukungan teknis sigap kapan pun Anda membutuhkan.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Checkout & Live Quote Panel */}
                        <div className="w-full lg:w-[420px] shrink-0 space-y-6 lg:sticky lg:top-[90px]">
                            
                            <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-md border border-slate-200 space-y-5">
                                
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Formulir Reservasi</h3>
                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                                        Booking Instan
                                    </span>
                                </div>

                                {/* Date & Depot Section */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="text-[11px] font-bold text-slate-700">
                                            Mulai Sewa
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
                                        <label className="text-[11px] font-bold text-slate-700">
                                            Selesai Sewa
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

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Lokasi Jemput</label>
                                        <PublicSelect
                                            value={form.data.pickup_location_id}
                                            onChange={(val) => {
                                                const newReturn = form.data.return_location_id || val;
                                                form.setData({
                                                    ...form.data,
                                                    pickup_location_id: val,
                                                    return_location_id: newReturn,
                                                });
                                                void refreshQuote({
                                                    pickup_location_id: val,
                                                    return_location_id: newReturn,
                                                });
                                            }}
                                            options={pickupOptions}
                                            placeholder="Pilih Lokasi Depot"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Paket Asuransi Tambahan</label>
                                        <PublicSelect
                                            value={form.data.insurance_package_id}
                                            onChange={(val) => {
                                                form.setData('insurance_package_id', val);
                                                void refreshQuote({ insurance_package_id: val });
                                            }}
                                            options={insuranceOptions}
                                            placeholder="Tanpa Asuransi Tambahan"
                                        />
                                    </div>
                                </div>

                                {/* Live Quote Breakdown Card */}
                                <div className="relative rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2.5">
                                    {quoting && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs rounded-xl z-10">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                                <svg className="h-4 w-4 animate-spin text-slate-800" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Kalkulasi tarif...
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                                        <span>Rincian Estimasi Biaya</span>
                                        <span className="text-[11px] text-slate-700 font-bold">{quote.total_periods} Hari Sewa</span>
                                    </div>

                                    {!quote.available ? (
                                        <div className="text-xs text-rose-700 font-bold p-2 bg-rose-50 rounded-lg">
                                            {quote.reasons[0] || 'Unit tidak tersedia untuk jadwal ini.'}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between text-slate-600 font-medium">
                                                <span>Sewa Dasar</span>
                                                <span className="font-bold text-slate-900">{quote.base_amount ? money(quote.base_amount) : '—'}</span>
                                            </div>

                                            {quote.insurance_amount != null && quote.insurance_amount > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span>Proteksi Asuransi</span>
                                                    <span className="font-bold text-slate-900">{money(quote.insurance_amount)}</span>
                                                </div>
                                            )}

                                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs font-extrabold text-slate-900">
                                                <span>Total Estimasi Sewa</span>
                                                <span className="text-sm text-slate-900 font-black">{quote.total_amount ? money(quote.total_amount) : '—'}</span>
                                            </div>

                                            <div className="rounded-lg bg-white p-3 border border-slate-200 flex items-center justify-between text-xs font-bold mt-1 shadow-2xs">
                                                <div>
                                                    <div className="text-slate-900 font-black">Deposit Penahanan Unit</div>
                                                    <div className="text-[9px] text-slate-400 font-normal">Batas bayar {hold_ttl_minutes} menit</div>
                                                </div>
                                                <div className="text-sm font-black text-slate-900">
                                                    {quote.deposit_amount ? money(quote.deposit_amount) : 'Rp 0'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Booker Identity Section */}
                                <div className="space-y-3 pt-1 border-t border-slate-100">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            Nama Lengkap <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={fieldClassName}
                                            placeholder="Contoh: Budi Pratama"
                                            value={form.data.customer_name}
                                            onChange={(e) => form.setData('customer_name', e.target.value)}
                                            required
                                        />
                                        {errors.customer_name && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.customer_name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            Nomor WhatsApp <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className={fieldClassName}
                                            placeholder="081234567890"
                                            value={form.data.booker_phone}
                                            onChange={(e) => {
                                                form.setData('booker_phone', e.target.value);
                                                setPhoneVerified(false);
                                                setOtpHint(null);
                                            }}
                                            required
                                        />
                                        {errors.booker_phone && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.booker_phone}</p>}
                                    </div>

                                    {/* OTP Verification Block */}
                                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold text-slate-800">Verifikasi Kode OTP *</span>
                                            {!phoneVerified && (
                                                <button
                                                    type="button"
                                                    onClick={() => void sendOtp()}
                                                    disabled={sendingOtp || !form.data.booker_phone}
                                                    className="rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                                >
                                                    {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                                                </button>
                                            )}
                                        </div>

                                        {phoneVerified ? (
                                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                                <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Terverifikasi ✓ (OTP tidak diperlukan)
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                className={`${fieldClassName} tracking-widest text-center text-sm font-black bg-white`}
                                                placeholder="0 0 0 0 0 0"
                                                maxLength={6}
                                                value={form.data.otp_code}
                                                onChange={(e) => form.setData('otp_code', e.target.value)}
                                                required
                                            />
                                        )}

                                        {otpHint && !phoneVerified && (
                                            <p className="rounded-lg bg-teal-50 p-2 text-xs font-medium text-teal-800 border border-teal-200">
                                                {otpHint}
                                            </p>
                                        )}
                                        {errors.otp_code && <p className="text-[10px] text-rose-600 font-bold">{errors.otp_code}</p>}
                                    </div>
                                </div>

                                {/* Booking CTA Button */}
                                <button
                                    type="submit"
                                    disabled={form.processing || !quote.available}
                                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    {form.processing ? 'Memproses Pesanan...' : 'Konfirmasi & Pesan Sekarang'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>

            {/* Grounded Deep Slate Footer */}
            <footer className="mt-16 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Column 1: Brand Info */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span 
                                    className="block h-3 w-3 rounded-full shadow-xs"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                />
                                <span className="font-black text-white tracking-tight text-sm">{brand.name}</span>
                            </div>
                            <p className="text-xs font-normal text-slate-400 leading-relaxed max-w-sm">
                                Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Navigasi Cepat</h4>
                            <ul className="space-y-2 text-xs font-medium text-slate-400">
                                <li>
                                    <Link href={route('book.rental.search')} className="hover:text-white transition-colors">
                                        Katalog Kendaraan
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('book.rental.history')} className="hover:text-white transition-colors">
                                        Riwayat & Cek Status
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Contact/Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">Pusat Bantuan</h4>
                            <div className="text-xs font-medium text-slate-400 space-y-2.5">
                                <p className="leading-relaxed">
                                    Butuh konsultasi armada atau konfirmasi pembayaran transfer? Hubungi tim support kami:
                                </p>
                                {brand.support_phone ? (
                                    <a
                                        href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs hover:underline"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        WhatsApp Hotline: {brand.support_phone} ↗
                                    </a>
                                ) : (
                                    <span className="font-bold text-slate-300">Silakan hubungi cabang terdekat.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. Seluruh Hak Cipta Dilindungi.
                        </div>
                        <div className="flex gap-4">
                            <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
                            <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

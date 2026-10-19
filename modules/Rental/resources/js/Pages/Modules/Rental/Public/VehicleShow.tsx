import LanguageToggle from '@/Components/LanguageToggle';
import PublicSelect from '@/Components/PublicSelect';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useMemo, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
    terms_url?: string | null;
    privacy_url?: string | null;
}

interface Vehicle {
    id: number;
    name: string;
    type: string | null;
    rental_class: string | null;
    rental_class_label: string | null;
    brand: string | null;
    model_year: number | null;
    color: string | null;
    capacity_seats: number | null;
    fuel_type: string | null;
    fuel_label: string | null;
    photo_url: string | null;
    similar_available: number;
}

interface Quote {
    available: boolean;
    reasons: string[];
    service_type?: string;
    driver_fee_amount?: number;
    delivery_type?: string;
    delivery_fee?: number;
    return_delivery_type?: string;
    return_delivery_fee?: number;
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
        service_type?: string;
        delivery_type?: string;
        return_delivery_type?: string;
        pickup_location_id: number | null;
        return_location_id: number | null;
        insurance_package_id: number | null;
    };
    quote: Quote;
    locations: LocationOption[];
    insurance_packages: InsurancePackage[];
    insurance_packages_enabled?: boolean;
    hold_ttl_minutes: number;
    gateway_available: boolean;
    is_dev_mode?: boolean;
    require_otp?: boolean;
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
    insurance_packages_enabled = true,
    hold_ttl_minutes,
    is_dev_mode = false,
    require_otp = true,
}: Props) {
    const { locale } = useTrans();
    const tr = (id: string, en: string) => (locale === 'en' ? en : id);

    const RELATION_OPTIONS = useMemo(
        () => [
            { value: 'Keluarga', label: tr('Keluarga', 'Family') },
            { value: 'Pasangan', label: tr('Pasangan', 'Spouse / Partner') },
            { value: 'Teman', label: tr('Teman', 'Friend') },
            { value: 'Rekan Kerja', label: tr('Rekan Kerja', 'Colleague') },
        ],
        [locale],
    );

    const { flash, errors } = usePage().props as {
        flash?: { success?: string; error?: string };
        errors: Record<string, string>;
    };
    const customer = (usePage().props as any)?.auth?.customer;
    const [quote, setQuote] = useState(initialQuote);
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [quoting, setQuoting] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(Boolean(customer));
    const isGenericCustomerName = useMemo(() => {
        if (!customer?.name) return true;
        const trimmed = customer.name.trim();
        return (
            trimmed === customer.phone ||
            trimmed.toLowerCase() === `customer ${customer.phone}`.toLowerCase() ||
            /^Customer\s+\d+$/i.test(trimmed)
        );
    }, [customer]);

    const customerDisplayName = useMemo(() => {
        if (!customer) return '';
        return isGenericCustomerName ? (customer.phone || tr('Pelanggan', 'Customer')) : customer.name;
    }, [customer, isGenericCustomerName, locale]);

    const customerSubtitle = useMemo(() => {
        if (!customer) return '';
        if (isGenericCustomerName) {
            return customer.email ? customer.email : tr('Nomor WhatsApp terverifikasi', 'Verified WhatsApp number');
        }
        return `${customer.phone}${customer.email ? ` · ${customer.email}` : ''}`;
    }, [customer, isGenericCustomerName, locale]);

    const form = useForm({
        vehicle_id: vehicle.id,
        start_date: filters.start_date,
        end_date: filters.end_date,
        period_type: filters.period_type,
        service_type: filters.service_type || 'self_drive',
        delivery_type: filters.delivery_type || 'depot',
        delivery_address: '',
        delivery_landmark: '',
        return_delivery_type: filters.return_delivery_type || 'depot',
        return_delivery_address: '',
        pickup_location_id: filters.pickup_location_id ? String(filters.pickup_location_id) : '',
        return_location_id: filters.return_location_id ? String(filters.return_location_id) : '',
        pickup_time: '08:00',
        return_time: '17:00',
        insurance_package_id: insurance_packages_enabled && filters.insurance_package_id ? String(filters.insurance_package_id) : '',
        customer_name: (customer?.name && !/^Customer\s+\d+$/i.test(customer.name.trim()) && customer.name.trim() !== customer.phone) ? customer.name : '',
        customer_email: customer?.email || '',
        booker_phone: customer?.phone || '',
        otp_code: (!require_otp || customer) ? '000000' : '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: 'Keluarga',
        social_media_account: '',
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
        () => [{ value: '', label: tr('Pilih Depot Penjemputan', 'Select Pickup Depot') }, ...depotOptions],
        [depotOptions, locale],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: tr('Sama dengan Lokasi Jemput', 'Same as Pickup Location') }, ...depotOptions],
        [depotOptions, locale],
    );

    const insuranceOptions = useMemo(
        () => [
            { value: '', label: tr('Tanpa Asuransi Tambahan', 'No Additional Insurance') },
            ...insurance_packages.map((pkg) => ({
                value: String(pkg.id),
                label: `${pkg.name} (${money(pkg.amount)})`,
            })),
        ],
        [insurance_packages, locale],
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
                service_type: payload.service_type || 'self_drive',
                delivery_type: payload.delivery_type || 'depot',
                return_delivery_type: payload.return_delivery_type || 'depot',
                pickup_location_id: payload.pickup_location_id || null,
                return_location_id: payload.return_location_id || null,
                insurance_package_id: insurance_packages_enabled ? (payload.insurance_package_id || null) : null,
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
            alert(tr('Masukkan nomor telepon terlebih dahulu', 'Please enter your phone number first'));
            return;
        }
        setSendingOtp(true);
        setOtpHint(null);
        setDevOtpCode(null);
        try {
            const { data } = await axios.post(route('book.rental.otp'), {
                booker_phone: form.data.booker_phone,
            });
            if (data.already_verified) {
                setPhoneVerified(true);
                setDevOtpCode(null);
                form.setData('otp_code', '000000');
                setOtpHint(tr('Nomor WhatsApp Anda sudah terverifikasi ✓', 'Your WhatsApp number is already verified ✓'));
            } else {
                setPhoneVerified(false);
                if (data.debug_code) {
                    const codeStr = String(data.debug_code);
                    setDevOtpCode(codeStr);
                    form.setData('otp_code', codeStr);
                    setOtpHint(tr(`Mode Development: Kode OTP adalah ${codeStr} (tidak dikirim ke HP).`, `Development Mode: OTP code is ${codeStr} (not sent to phone).`));
                } else {
                    setDevOtpCode(null);
                    setOtpHint(data.message || tr('OTP berhasil dikirim ke nomor WhatsApp Anda.', 'OTP sent to your WhatsApp number.'));
                }
            }
        } catch (err: any) {
            setPhoneVerified(false);
            setDevOtpCode(null);
            setOtpHint(err.response?.data?.message || tr('Gagal mengirim OTP. Periksa nomor telepon.', 'Failed to send OTP. Please check your phone number.'));
        } finally {
            setSendingOtp(false);
        }
    };

    const periodUnit = form.data.period_type === 'weekly' ? tr('minggu', 'week(s)') : form.data.period_type === 'monthly' ? tr('bulan', 'month(s)') : tr('hari', 'day(s)');

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (locations.length > 0 && !form.data.pickup_location_id) {
            form.setError('pickup_location_id', tr('Pilih lokasi jemput.', 'Please select a pickup location.'));
            return;
        }
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
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">{tr('Showroom & Rental Resmi', 'Official Showroom & Rental')}</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <LanguageToggle />
                            <Link
                                href={route('book.rental.search')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                                <span>{tr('Katalog', 'Catalog')}</span>
                            </Link>

                            {customer ? (
                                <Link
                                    href={route('book.rental.portal.dashboard')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
                                >
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-black text-white">
                                        {customer.name?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    <span className="hidden sm:inline">{tr('Portal Pelanggan', 'Customer Portal')}</span>
                                    <span className="sm:hidden">{tr('Portal', 'Portal')}</span>
                                </Link>
                            ) : (
                                <Link
                                    href={route('book.rental.login')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950"
                                >
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    <span className="hidden sm:inline">{tr('Masuk', 'Sign In')}</span>
                                </Link>
                            )}

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 transition hover:bg-emerald-100 shadow-2xs"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    CS
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Showcase & Checkout Container */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Link href={route('book.rental.search')} className="hover:text-slate-900">{tr('Katalog Kendaraan', 'Vehicle Catalog')}</Link>
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
                                    <p className="text-xs font-bold text-rose-950 uppercase tracking-wider">{tr('Pemesanan Belum Dapat Diproses', 'Booking Could Not Be Processed')}</p>
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
                    <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
                        
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
                                            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">{tr('Foto unit menyusul', 'Unit photo coming soon')}</span>
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
                                        {tr('Unit Siap Pakai', 'Ready to Use')}
                                    </span>
                                </div>

                                <div className="p-6 sm:p-7 space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{vehicle.name}</h2>
                                            {vehicle.similar_available > 1 && (
                                                <p className="mt-2 text-sm font-medium text-slate-600">
                                                    {tr(
                                                        `Ada ${vehicle.similar_available} unit sejenis. Kami pilihkan yang siap pada tanggal ini. Nomor plat muncul setelah pesanan dibuat.`,
                                                        `There are ${vehicle.similar_available} similar units available. We will assign the best unit ready for your dates. License plate will appear after booking.`
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* 4-column Specification Grid */}
                                    <div className="pt-2">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{tr('Spesifikasi Unit', 'Unit Specifications')}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-700">
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">{tr('Kapasitas', 'Capacity')}</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.capacity_seats ? `${vehicle.capacity_seats} ${tr('Kursi', 'Seats')}` : '—'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">{tr('Bahan Bakar', 'Fuel Type')}</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.fuel_label || '—'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">{tr('Tahun Rilis', 'Model Year')}</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.model_year ? `${tr('Tahun', 'Year')} ${vehicle.model_year}` : '—'}</div>
                                            </div>
                                            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 space-y-1">
                                                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">{tr('Warna', 'Color')}</span>
                                                <div className="text-sm font-black text-slate-900">{vehicle.color || '—'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inclusions & Guarantees Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3.5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">{tr('Jaminan Standar Kenyamanan Kami', 'Our Standard Comfort Guarantee')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-emerald-600 font-black">✓</span>
                                        <div>
                                            <div className="font-bold text-slate-900">{tr('Kondisi Bersih & Terawat', 'Clean & Well-Maintained')}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{tr('Disinfeksi dan cuci menyeluruh sebelum diserahterimakan.', 'Thoroughly washed and sanitized before handover.')}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                                        <span className="text-emerald-600 font-black">✓</span>
                                        <div>
                                            <div className="font-bold text-slate-900">{tr('Bantuan Darurat 24 Jam', '24-Hour Emergency Assistance')}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{tr('Dukungan teknis sigap kapan pun Anda membutuhkan.', 'Responsive technical support whenever you need it.')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Checkout & Live Quote Panel */}
                        <div className="w-full lg:w-[420px] shrink-0 space-y-6 lg:sticky lg:top-[90px]">
                            
                            <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-md border border-slate-200 space-y-5">
                                
                                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">{tr('Formulir Reservasi', 'Reservation Form')}</h3>
                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                                        {tr('Booking Instan', 'Instant Booking')}
                                    </span>
                                </div>

                                {/* Date & Depot Section */}
                                <div className="space-y-3.5">
                                    {/* Service Type Switcher */}
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                                            {tr('Jenis Layanan', 'Service Type')}
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    form.setData('service_type', 'self_drive');
                                                    void refreshQuote({ service_type: 'self_drive' });
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                                                    form.data.service_type === 'self_drive'
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>🔑</span>
                                                <span>{tr('Lepas Kunci', 'Self Drive')}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    form.setData('service_type', 'with_driver');
                                                    void refreshQuote({ service_type: 'with_driver' });
                                                }}
                                                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition border ${
                                                    form.data.service_type === 'with_driver'
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>👨‍✈️</span>
                                                <span>{tr('Dengan Sopir', 'With Driver')}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delivery Method Options */}
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                            {tr('Metode Penjemputan Unit', 'Unit Pickup Method')}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'depot', label: tr('Depot Pool', 'Depot Pool'), icon: '🏢' },
                                                { id: 'airport', label: tr('Bandara', 'Airport'), icon: '✈️' },
                                                { id: 'custom_address', label: tr('Alamat / Hotel', 'Address / Hotel'), icon: '📍' },
                                            ].map((del) => (
                                                <button
                                                    key={del.id}
                                                    type="button"
                                                    onClick={() => {
                                                        form.setData('delivery_type', del.id);
                                                        void refreshQuote({ delivery_type: del.id });
                                                    }}
                                                    className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition border text-center flex flex-col items-center gap-1 ${
                                                        form.data.delivery_type === del.id
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span>{del.icon}</span>
                                                    <span>{del.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {form.data.delivery_type !== 'depot' && (
                                        <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                                            <label className="text-[11px] font-bold text-slate-700 block">
                                                {tr('Alamat / Lokasi Pengantaran Unit', 'Unit Delivery Address / Location')} <span className="text-rose-500">*</span>
                                                <input
                                                    type="text"
                                                    placeholder={form.data.delivery_type === 'airport' ? tr('Contoh: Bandara Terminal 3 Ultimate', 'E.g.: Airport Terminal 3 Ultimate') : tr('Nama hotel / nama jalan & nomor', 'Hotel name / street & number')}
                                                    className={fieldClassName}
                                                    value={form.data.delivery_address}
                                                    onChange={(e) => form.setData('delivery_address', e.target.value)}
                                                    required
                                                />
                                            </label>
                                            <label className="text-[11px] font-bold text-slate-700 block">
                                                {tr('Patokan / Petunjuk Tambahan (Opsional)', 'Landmark / Additional Instructions (Optional)')}
                                                <input
                                                    type="text"
                                                    placeholder={tr('Contoh: Gate 2 Keberangkatan / Lobby Hotel', 'E.g.: Departure Gate 2 / Hotel Lobby')}
                                                    className={fieldClassName}
                                                    value={form.data.delivery_landmark}
                                                    onChange={(e) => form.setData('delivery_landmark', e.target.value)}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="text-[11px] font-bold text-slate-700">
                                            {tr('Mulai Sewa', 'Start Date')}
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
                                            {tr('Selesai Sewa', 'End Date')}
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

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="text-[11px] font-bold text-slate-700">
                                            {tr('Jam jemput', 'Pickup time')}
                                            <input
                                                type="time"
                                                className={fieldClassName}
                                                value={form.data.pickup_time}
                                                onChange={(e) => form.setData('pickup_time', e.target.value)}
                                                required
                                            />
                                        </label>
                                        <label className="text-[11px] font-bold text-slate-700">
                                            {tr('Jam kembali', 'Return time')}
                                            <input
                                                type="time"
                                                className={fieldClassName}
                                                value={form.data.return_time}
                                                onChange={(e) => form.setData('return_time', e.target.value)}
                                                required
                                            />
                                        </label>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                            {tr('Lokasi Jemput', 'Pickup Location')} {locations.length > 0 && <span className="text-rose-500">*</span>}
                                        </label>
                                        <PublicSelect
                                            value={form.data.pickup_location_id}
                                            onChange={(val) => {
                                                const newReturn = form.data.return_location_id || val;
                                                form.clearErrors('pickup_location_id');
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
                                            placeholder={tr('Pilih Lokasi Depot', 'Select Depot Location')}
                                        />
                                        {form.errors.pickup_location_id && (
                                            <p className="text-[10px] text-rose-600 font-bold mt-1">{form.errors.pickup_location_id}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1">{tr('Lokasi Kembali', 'Return Location')}</label>
                                        <PublicSelect
                                            value={form.data.return_location_id}
                                            onChange={(val) => {
                                                form.setData('return_location_id', val);
                                                void refreshQuote({ return_location_id: val });
                                            }}
                                            options={returnOptions}
                                            placeholder={tr('Sama dengan lokasi jemput', 'Same as pickup location')}
                                        />
                                    </div>

                                    {insurance_packages_enabled && insurance_packages.length > 0 && (
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-700 block mb-1">{tr('Paket Asuransi Tambahan', 'Additional Insurance Package')}</label>
                                            <PublicSelect
                                                value={form.data.insurance_package_id}
                                                onChange={(val) => {
                                                    form.setData('insurance_package_id', val);
                                                    void refreshQuote({ insurance_package_id: val });
                                                }}
                                                options={insuranceOptions}
                                                placeholder={tr('Tanpa Asuransi Tambahan', 'No Additional Insurance')}
                                            />
                                        </div>
                                    )}
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
                                                {tr('Kalkulasi tarif...', 'Calculating rates...')}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                                        <span>{tr('Rincian Estimasi Biaya', 'Estimated Price Breakdown')}</span>
                                        <span className="text-[11px] text-slate-700 font-bold">{quote.total_periods} {periodUnit}</span>
                                    </div>

                                    {!quote.available ? (
                                        <div className="text-xs text-rose-700 font-bold p-2 bg-rose-50 rounded-lg">
                                            {quote.reasons[0] || tr('Unit tidak tersedia untuk jadwal ini.', 'Unit is not available for this schedule.')}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between text-slate-600 font-medium">
                                                <span>{tr('Sewa Dasar Unit', 'Base Unit Rental')}</span>
                                                <span className="font-bold text-slate-900">{quote.base_amount ? money(quote.base_amount) : '—'}</span>
                                            </div>

                                            {quote.driver_fee_amount != null && quote.driver_fee_amount > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span>👨‍✈️</span> {tr('Jasa Pengemudi', 'Driver Service')} ({quote.total_periods} {tr('hari', 'days')})
                                                    </span>
                                                    <span className="font-bold text-slate-900">{money(quote.driver_fee_amount)}</span>
                                                </div>
                                            )}

                                            {quote.delivery_fee != null && quote.delivery_fee > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span>✈️</span> {tr('Biaya Pengantaran', 'Delivery Fee')} ({quote.delivery_type})
                                                    </span>
                                                    <span className="font-bold text-slate-900">{money(quote.delivery_fee)}</span>
                                                </div>
                                            )}

                                            {quote.return_delivery_fee != null && quote.return_delivery_fee > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <span>🔄</span> {tr('Biaya Pengambilan Kembali', 'Return Pickup Fee')}
                                                    </span>
                                                    <span className="font-bold text-slate-900">{money(quote.return_delivery_fee)}</span>
                                                </div>
                                            )}

                                            {insurance_packages_enabled && quote.insurance_amount != null && quote.insurance_amount > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span>{tr('Proteksi Asuransi', 'Insurance Protection')}</span>
                                                    <span className="font-bold text-slate-900">{money(quote.insurance_amount)}</span>
                                                </div>
                                            )}

                                            {quote.one_way_fee_amount != null && quote.one_way_fee_amount > 0 && (
                                                <div className="flex justify-between text-slate-600 font-medium">
                                                    <span>{tr('Biaya antar cabang', 'Inter-branch drop-off fee')}</span>
                                                    <span className="font-bold text-slate-900">{money(quote.one_way_fee_amount)}</span>
                                                </div>
                                            )}

                                            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs font-extrabold text-slate-900">
                                                <span>{tr('Total sewa', 'Total rental')}</span>
                                                <span className="text-sm text-slate-900 font-black">{quote.total_amount ? money(quote.total_amount) : '—'}</span>
                                            </div>

                                            <p className="text-[11px] font-medium text-slate-500">{tr('Tanggal selesai ikut dihitung.', 'End date is included in the duration.')}</p>

                                            {quote.deposit_amount != null && quote.deposit_amount > 0 && (
                                                <div className="rounded-lg bg-white p-3 border border-slate-200 flex items-center justify-between text-xs font-bold mt-1 shadow-2xs">
                                                    <div>
                                                        <div className="text-slate-900 font-black">{tr('Deposit Jaminan Unit', 'Security Deposit')}</div>
                                                        <div className="text-[9px] text-emerald-700 font-bold">{tr(`Dapat dikembalikan penuh · Bayar dalam ${hold_ttl_minutes} menit`, `Fully refundable · Pay within ${hold_ttl_minutes} minutes`)}</div>
                                                    </div>
                                                    <div className="text-sm font-black text-slate-900">
                                                        {money(quote.deposit_amount)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Booker Identity Section */}
                                <div className="space-y-3 pt-1 border-t border-slate-100">
                                    {customer ? (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                                                    <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-extrabold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                                                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{customerDisplayName}</span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200/80 px-2 py-0.5 text-[9px] font-bold text-emerald-900 whitespace-nowrap shrink-0">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                                                            {tr('Akun Terverifikasi', 'Verified Account')}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-emerald-800 font-medium truncate mt-0.5">
                                                        {customerSubtitle}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link
                                                href={route('book.rental.logout')}
                                                method="post"
                                                as="button"
                                                className="inline-flex items-center justify-center rounded-lg border border-emerald-300/80 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-emerald-900 transition hover:bg-emerald-100 hover:text-emerald-950 shadow-2xs shrink-0 whitespace-nowrap"
                                            >
                                                {tr('Ganti Akun', 'Switch Account')}
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex items-center justify-between gap-3 text-xs">
                                            <div className="text-[11px] text-slate-600">
                                                {tr('Sudah punya akun pelanggan?', 'Already have a customer account?')}
                                            </div>
                                            <Link
                                                href={route('book.rental.login')}
                                                className="text-[11px] font-bold text-slate-900 hover:underline shrink-0"
                                            >
                                                {tr('Masuk di sini →', 'Sign in here →')}
                                            </Link>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            {tr('Nama Lengkap', 'Full Name')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={fieldClassName}
                                            placeholder={tr('Contoh: Budi Pratama', 'E.g.: Budi Pratama')}
                                            value={form.data.customer_name}
                                            onChange={(e) => form.setData('customer_name', e.target.value)}
                                            required
                                        />
                                        {errors.customer_name && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.customer_name}</p>}
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            {tr('Nomor WhatsApp', 'WhatsApp Number')} <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className={fieldClassName}
                                            placeholder="081234567890"
                                            value={form.data.booker_phone}
                                            onChange={(e) => {
                                                form.setData('booker_phone', e.target.value);
                                                if (!customer) {
                                                    setPhoneVerified(false);
                                                    setOtpHint(null);
                                                }
                                            }}
                                            required
                                        />
                                        {errors.booker_phone && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.booker_phone}</p>}
                                    </div>

                                    {/* Alamat Email - Wajib jika OTP WhatsApp nonaktif */}
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block">
                                            {tr('Alamat Email', 'Email Address')} {!require_otp ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">{tr('(Opsional)', '(Optional)')}</span>}
                                        </label>
                                        <input
                                            type="email"
                                            className={fieldClassName}
                                            placeholder={tr('nama@email.com', 'name@email.com')}
                                            value={form.data.customer_email}
                                            onChange={(e) => form.setData('customer_email', e.target.value)}
                                            required={!require_otp}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {!require_otp
                                                ? tr('Alamat email wajib diisi untuk registrasi, konfirmasi reservasi, dan bukti invoice sewa.', 'Email address is required for registration, booking confirmation, and rental invoice.')
                                                : tr('Bukti konfirmasi pemesanan dan invoice elektronik akan dikirimkan ke email ini.', 'Booking confirmation and electronic invoice will be sent to this email.')}
                                        </p>
                                        {errors.customer_email && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.customer_email}</p>}
                                    </div>

                                    {/* Emergency Contact & Risk Mitigation */}
                                    <div className="rounded-2xl border border-slate-250/80 bg-slate-50/70 p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-2xs">
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{tr('Kontak Darurat (Emergency Contact)', 'Emergency Contact')}</h4>
                                                <p className="text-[10px] text-slate-500 font-medium">{tr('Verifikasi keamanan & penanggung jawab perjalanan', 'Security verification & trip emergency contact')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-700 block">
                                                    {tr('Nama Kontak', 'Contact Name')} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={tr('Nama lengkap kerabat', 'Relative full name')}
                                                    className={fieldClassName}
                                                    value={form.data.emergency_contact_name}
                                                    onChange={(e) => form.setData('emergency_contact_name', e.target.value)}
                                                    required
                                                />
                                                {errors.emergency_contact_name && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.emergency_contact_name}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block">
                                                        {tr('Hubungan', 'Relationship')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="mt-1">
                                                        <PublicSelect
                                                            value={form.data.emergency_contact_relation}
                                                            onChange={(val) => form.setData('emergency_contact_relation', val)}
                                                            options={RELATION_OPTIONS}
                                                            placeholder={tr('Pilih Hubungan', 'Select Relationship')}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block">
                                                        {tr('No. Telepon Kontak', 'Contact Phone No.')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        placeholder="08xxxxxxxxxx"
                                                        className={fieldClassName}
                                                        value={form.data.emergency_contact_phone}
                                                        onChange={(e) => form.setData('emergency_contact_phone', e.target.value)}
                                                        required
                                                    />
                                                    {errors.emergency_contact_phone && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{errors.emergency_contact_phone}</p>}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-bold text-slate-700 block">
                                                    {tr('Akun Media Sosial Penyewa', 'Renter Social Media Account')} <span className="text-slate-400 font-normal">{tr('(Opsional)', '(Optional)')}</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={tr('Contoh: @instagram / LinkedIn', 'E.g.: @instagram / LinkedIn')}
                                                    className={fieldClassName}
                                                    value={form.data.social_media_account}
                                                    onChange={(e) => form.setData('social_media_account', e.target.value)}
                                                />
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{tr('Opsional, untuk mempercepat proses verifikasi sewa.', 'Optional, to speed up rental verification.')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* OTP Verification Block */}
                                    {require_otp ? (
                                        customer ? (
                                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-2xs">
                                                <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{tr('Akun terverifikasi. Kode OTP tidak diperlukan.', 'Verified account. OTP code is not required.')}</span>
                                            </div>
                                        ) : (
                                            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-extrabold text-slate-800">{tr('Verifikasi Kode OTP *', 'OTP Code Verification *')}</span>
                                                    {!phoneVerified && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void sendOtp()}
                                                            disabled={sendingOtp || !form.data.booker_phone}
                                                            className="rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 shadow-2xs"
                                                        >
                                                            {sendingOtp ? tr('Mengirim...', 'Sending...') : tr('Kirim OTP', 'Send OTP')}
                                                        </button>
                                                    )}
                                                </div>

                                                {phoneVerified ? (
                                                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                                        <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {tr('Terverifikasi ✓ (OTP tidak diperlukan)', 'Verified ✓ (OTP not required)')}
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

                                                {devOtpCode && !phoneVerified && (
                                                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 shadow-2xs space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-white shadow-2xs">
                                                                    ⚡
                                                                </span>
                                                                <div>
                                                                    <span className="font-black text-amber-900 block leading-tight">{tr('Mode Development', 'Development Mode')}</span>
                                                                    <span className="text-[11px] text-amber-700 font-medium">{tr('OTP tidak dikirim ke HP. Kode OTP:', 'OTP not sent to phone. OTP Code:')}</span>
                                                                </div>
                                                            </div>
                                                            <span className="font-mono text-sm font-black bg-white px-2.5 py-1 rounded-lg border border-amber-300 tracking-widest text-slate-900 shadow-xs shrink-0">
                                                                {devOtpCode}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-1 rounded-lg border border-amber-200/80 font-semibold flex items-center gap-1">
                                                            <span>✓</span>
                                                            <span>{tr('Kode OTP telah diisikan otomatis ke kotak input di atas.', 'OTP code has been automatically filled in the input above.')}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {otpHint && !devOtpCode && !phoneVerified && (
                                                    <p className="rounded-lg bg-teal-50 p-2 text-xs font-medium text-teal-800 border border-teal-200">
                                                        {otpHint}
                                                    </p>
                                                )}
                                                {errors.otp_code && <p className="text-[10px] text-rose-600 font-bold">{errors.otp_code}</p>}
                                            </div>
                                        )
                                    ) : null}
                                </div>

                                {/* Booking CTA Button */}
                                <button
                                    type="submit"
                                    disabled={form.processing || !quote.available}
                                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    {form.processing ? tr('Memproses pesanan...', 'Processing booking...') : tr('Pesan sekarang', 'Book now')}
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
                                {tr(
                                    'Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.',
                                    'Official, safe, and licensed vehicle rental service. We provide well-maintained fleets with extra comfort guarantees and wide branch handover support.'
                                )}
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">{tr('Navigasi Cepat', 'Quick Links')}</h4>
                            <ul className="space-y-2 text-xs font-medium text-slate-400">
                                <li>
                                    <Link href={route('book.rental.search')} className="hover:text-white transition-colors">
                                        {tr('Katalog Kendaraan', 'Vehicle Catalog')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('book.rental.history')} className="hover:text-white transition-colors">
                                        {tr('Riwayat & Cek Status', 'History & Check Status')}
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Contact/Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">{tr('Pusat Bantuan', 'Support Center')}</h4>
                            <div className="text-xs font-medium text-slate-400 space-y-2.5">
                                <p className="leading-relaxed">
                                    {tr(
                                        'Butuh konsultasi armada atau konfirmasi pembayaran transfer? Hubungi tim support kami:',
                                        'Need fleet consultation or bank transfer confirmation? Contact our support team:'
                                    )}
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
                                    <span className="font-bold text-slate-300">{tr('Silakan hubungi cabang terdekat.', 'Please contact the nearest branch.')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. {tr('Seluruh Hak Cipta Dilindungi.', 'All Rights Reserved.')}
                        </div>
                        <div className="flex gap-4">
                            <a href={brand.terms_url || `${route('book.rental.search')}#ketentuan`} className="hover:text-slate-300">{tr('Syarat & Ketentuan', 'Terms & Conditions')}</a>
                            <a href={brand.privacy_url || `${route('book.rental.search')}#privasi`} className="hover:text-slate-300">{tr('Kebijakan Privasi', 'Privacy Policy')}</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

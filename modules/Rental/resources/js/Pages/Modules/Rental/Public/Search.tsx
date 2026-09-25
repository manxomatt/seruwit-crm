import LanguageToggle from '@/Components/LanguageToggle';
import PublicSelect from '@/Components/PublicSelect';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

interface HelpLocation {
    name: string;
    address: string | null;
    city: string | null;
}

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
    hero_title?: string | null;
    hero_subtitle?: string | null;
    hero_image_url?: string | null;
    terms_url?: string | null;
    privacy_url?: string | null;
    help_locations?: HelpLocation[];
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
    available_count: number;
    rental_class: string | null;
    rental_class_label: string | null;
    capacity_seats: number | null;
    fuel_label: string | null;
    model_year: number | null;
    photo_url: string | null;
    from_price: number | null;
    total_periods: number;
    total_amount: number | null;
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
        total_periods?: number;
    };
    classes: ClassOption[];
    locations: LocationOption[];
    vehicles: VehicleCard[];
    searched: boolean;
    needs_depot?: boolean;
    hold_ttl_minutes: number;
    gateway_available: boolean;
}

const money = (v: number) => 'Rp ' + Number(v).toLocaleString('id-ID');

const formatIndoDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        }
    } catch {
        // fallback
    }
    return dateStr;
};

const toISODate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function Search({
    brand,
    filters,
    classes,
    locations,
    vehicles,
    searched,
    needs_depot = false,
    hold_ttl_minutes,
}: Props) {
    const { t } = useTrans();
    const customer = (usePage().props as any)?.auth?.customer;
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.rental_class ?? '');
    const [searching, setSearching] = useState(false);
    const [depotError, setDepotError] = useState(false);
    const [diffReturnDepot, setDiffReturnDepot] = useState(
        Boolean(filters.return_location_id && filters.return_location_id !== filters.pickup_location_id),
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'seats_desc'>('recommended');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const todayStr = useMemo(() => toISODate(new Date()), []);

    const periodOptions = [
        { value: 'daily', label: t('rental.storefront_ui.period_daily', undefined, 'Sewa Harian'), badge: 'Populer' },
        { value: 'weekly', label: t('rental.storefront_ui.period_weekly', undefined, 'Sewa Mingguan'), badge: 'Hemat' },
        { value: 'monthly', label: t('rental.storefront_ui.period_monthly', undefined, 'Sewa Bulanan'), badge: 'Terbaik' },
    ];

    const form = useForm({
        start_date: filters.start_date || todayStr,
        end_date: filters.end_date || (() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            return toISODate(d);
        })(),
        period_type: filters.period_type || 'daily',
        pickup_location_id: filters.pickup_location_id ? String(filters.pickup_location_id) : '',
        return_location_id: filters.return_location_id ? String(filters.return_location_id) : '',
        rental_class: filters.rental_class ?? '',
    });

    const depotOptions = useMemo(
        () =>
            locations.map((location) => ({
                value: String(location.id),
                label: location.city ? `${location.name} (${location.city})` : location.name,
            })),
        [locations],
    );

    const pickupOptions = useMemo(
        () => [{ value: '', label: t('rental.storefront_ui.pickup_placeholder', undefined, 'Pilih Depot Penjemputan') }, ...depotOptions],
        [depotOptions, t],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: 'Sama dengan Lokasi Jemput' }, ...depotOptions],
        [depotOptions],
    );

    const periodCount = useMemo(() => {
        if (!form.data.start_date || !form.data.end_date) {
            return null;
        }
        const start = new Date(`${form.data.start_date}T00:00:00`);
        const end = new Date(`${form.data.end_date}T00:00:00`);
        const days = Math.round((end.getTime() - start.getTime()) / 86400000);
        if (days < 0) {
            return null;
        }
        const inclusive = days + 1;
        if (form.data.period_type === 'weekly') {
            return Math.max(1, Math.ceil(inclusive / 7));
        }
        if (form.data.period_type === 'monthly') {
            return Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
        }
        return inclusive;
    }, [form.data.end_date, form.data.period_type, form.data.start_date]);

    const periodUnit = form.data.period_type === 'weekly'
        ? t('rental.storefront_ui.unit_week', undefined, 'minggu')
        : form.data.period_type === 'monthly'
          ? t('rental.storefront_ui.unit_month', undefined, 'bulan')
          : t('rental.storefront_ui.unit_day', undefined, 'hari');

    // Quick Date Presets
    const applyDatePreset = (daysToAdd: number) => {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + (daysToAdd - 1));
        form.setData({
            ...form.data,
            start_date: toISODate(start),
            end_date: toISODate(end),
            period_type: daysToAdd >= 30 ? 'monthly' : daysToAdd >= 7 ? 'weekly' : 'daily',
        });
    };

    const applyWeekendPreset = () => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday, 5 is Friday
        const distToFriday = (5 - dayOfWeek + 7) % 7;
        const friday = new Date();
        friday.setDate(today.getDate() + (distToFriday === 0 ? 7 : distToFriday));
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);

        form.setData({
            ...form.data,
            start_date: toISODate(friday),
            end_date: toISODate(sunday),
            period_type: 'daily',
        });
    };

    const submit = (e?: FormEvent, classOverride?: string) => {
        if (e) e.preventDefault();
        if (locations.length > 0 && !form.data.pickup_location_id) {
            setDepotError(true);
            return;
        }
        setDepotError(false);
        const activeClass = classOverride !== undefined ? classOverride : form.data.rental_class;
        const returnId = diffReturnDepot ? form.data.return_location_id : form.data.pickup_location_id;

        setSearching(true);
        router.get(
            route('book.rental.search'),
            {
                start_date: form.data.start_date || undefined,
                end_date: form.data.end_date || undefined,
                period_type: form.data.period_type || 'daily',
                pickup_location_id: form.data.pickup_location_id || undefined,
                return_location_id: returnId || undefined,
                rental_class: activeClass || undefined,
            },
            {
                preserveState: true,
                onFinish: () => setSearching(false),
            },
        );
    };

    const handleCategoryClick = (categoryVal: string) => {
        setSelectedCategory(categoryVal);
        form.setData('rental_class', categoryVal);
        submit(undefined, categoryVal);
    };

    // Filter & Sort Vehicles Client-Side for instant UI responsiveness
    const displayedVehicles = useMemo(() => {
        let list = [...vehicles];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (v) =>
                    v.name.toLowerCase().includes(q) ||
                    (v.rental_class_label && v.rental_class_label.toLowerCase().includes(q)) ||
                    (v.fuel_label && v.fuel_label.toLowerCase().includes(q)),
            );
        }

        if (sortBy === 'price_asc') {
            list.sort((a, b) => (a.total_amount ?? a.from_price ?? 0) - (b.total_amount ?? b.from_price ?? 0));
        } else if (sortBy === 'price_desc') {
            list.sort((a, b) => (b.total_amount ?? b.from_price ?? 0) - (a.total_amount ?? a.from_price ?? 0));
        } else if (sortBy === 'seats_desc') {
            list.sort((a, b) => (b.capacity_seats ?? 0) - (a.capacity_seats ?? 0));
        }

        return list;
    }, [vehicles, searchQuery, sortBy]);

    const vehicleUrl = (vehicleId: number) =>
        route('book.rental.vehicles.show', vehicleId) +
        '?' +
        new URLSearchParams({
            start_date: form.data.start_date,
            end_date: form.data.end_date,
            period_type: form.data.period_type,
            ...(form.data.pickup_location_id ? { pickup_location_id: form.data.pickup_location_id } : {}),
            ...(diffReturnDepot && form.data.return_location_id
                ? { return_location_id: form.data.return_location_id }
                : form.data.pickup_location_id
                  ? { return_location_id: form.data.pickup_location_id }
                  : {}),
        }).toString();

    const brandColor = brand.color || '#0f766e';
    const selectedPickupDepot = locations.find((l) => String(l.id) === form.data.pickup_location_id);

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800 flex flex-col justify-between selection:bg-teal-500 selection:text-white"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${brand.name} · Katalog & Pemesanan Sewa Mobil Online`} />

            <div>
                {/* Modern Floating Header Navbar */}
                <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
                        <Link href={route('book.rental.search')} className="flex items-center gap-3 group">
                            {brand.logo_url ? (
                                <img
                                    src={brand.logo_url}
                                    alt={brand.name}
                                    className="h-10 w-10 rounded-2xl object-contain ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105"
                                />
                            ) : (
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105"
                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none group-hover:text-slate-950 transition-colors">
                                    {brand.name}
                                </h1>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                                    {t('rental.storefront_ui.tagline', undefined, 'Showroom & Rental Resmi')}
                                </span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <LanguageToggle />

                            {customer ? (
                                <Link
                                    href={route('book.rental.portal.dashboard')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800"
                                >
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[9px] font-black text-white">
                                        {customer.name?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    <span className="hidden sm:inline">Portal Pelanggan</span>
                                    <span className="sm:hidden">Portal</span>
                                </Link>
                            ) : (
                                <Link
                                    href={route('book.rental.login')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 hover:text-slate-950"
                                >
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    <span className="hidden sm:inline">Masuk / Daftar</span>
                                    <span className="sm:hidden">Masuk</span>
                                </Link>
                            )}

                            <Link
                                href={route('book.rental.history')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="hidden sm:inline">{t('rental.storefront_ui.check_history', undefined, 'Cek Riwayat')}</span>
                                <span className="sm:hidden">Riwayat</span>
                            </Link>

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}?text=${encodeURIComponent('Halo ' + brand.name + ', saya ingin bertanya mengenai ketersediaan sewa mobil.')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 shadow-2xs transition hover:bg-emerald-100"
                                >
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                                    </span>
                                    <span className="hidden sm:inline">{t('rental.storefront_ui.whatsapp_cs', undefined, 'Bantuan CS')}</span>
                                    <span className="sm:hidden">CS</span>
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Banner Section */}
                <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-12 pb-24 sm:pt-16 sm:pb-32">
                    {/* Background Hero Image with Deep Contrast Overlay */}
                    {brand.hero_image_url ? (
                        <div className="absolute inset-0 z-0">
                            <img
                                src={brand.hero_image_url}
                                alt="Hero background"
                                className="h-full w-full object-cover object-center opacity-30 mix-blend-luminosity filter blur-[1px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/85 to-slate-900/60" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 z-0 opacity-10">
                            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                        </div>
                    )}

                    {/* Ambient Glow */}
                    <div 
                        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
                        style={{ backgroundColor: 'var(--brand-color)' }}
                    />

                    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-3xl mx-auto space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-inner">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{t('rental.storefront_ui.hero_badge', undefined, 'Showroom Resmi · Unit Terawat & Bergaransi')}</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
                                {brand.hero_title || t('rental.storefront_ui.hero_title', undefined, 'Temukan Kendaraan Nyaman Untuk Setiap Perjalanan')}
                            </h2>

                            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
                                {brand.hero_subtitle || t('rental.storefront_ui.hero_subtitle', undefined, 'Pilihan lengkap mobil lepas kunci & berizin resmi. Proses booking instan, transparan, tanpa biaya tersembunyi.')}
                            </p>

                            {/* Trust Highlights Checklist */}
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-slate-300">
                                <div className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/60">
                                    <span className="text-emerald-400 font-black">✓</span> {t('rental.storefront_ui.trust_clean', undefined, 'Unit Bersih & Higienis')}
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/60">
                                    <span className="text-emerald-400 font-black">✓</span> {t('rental.storefront_ui.trust_depot', undefined, 'Serah Terima di Depot Resmi')}
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/60">
                                    <span className="text-emerald-400 font-black">✓</span> {t('rental.storefront_ui.trust_otp', undefined, 'Verifikasi Nomor Cepat')}
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/60">
                                    <span className="text-emerald-400 font-black">✓</span> {t('rental.storefront_ui.trust_cs', undefined, 'Layanan CS Responsif')}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Floating Modern Interactive Booking Search Card */}
                <div className="relative z-20 -mt-16 sm:-mt-20 mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="rounded-3xl bg-white p-5 sm:p-8 shadow-xl border border-slate-200/90 transition-all">
                        {/* Segmented Rental Period Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
                            <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                                {periodOptions.map((opt) => {
                                    const active = form.data.period_type === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => form.setData('period_type', opt.value)}
                                            className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                                active
                                                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                                                    : 'text-slate-600 hover:text-slate-950'
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                            {opt.badge && (
                                                <span
                                                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
                                                        active
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-200/80 text-slate-600'
                                                    }`}
                                                >
                                                    {opt.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Quick Date Shortcuts */}
                            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600">
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mr-1 hidden sm:inline">Pilihan Cepat:</span>
                                <button
                                    type="button"
                                    onClick={() => applyDatePreset(2)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                >
                                    2 Hari
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyDatePreset(3)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                >
                                    3 Hari
                                </button>
                                <button
                                    type="button"
                                    onClick={applyWeekendPreset}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                >
                                    Akhir Pekan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyDatePreset(7)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                >
                                    1 Minggu
                                </button>
                            </div>
                        </div>

                        {/* Search Input Controls Form */}
                        <form onSubmit={submit} className="mt-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                {/* Pickup Depot Field */}
                                <div className={`${diffReturnDepot ? 'md:col-span-3' : 'md:col-span-4'} space-y-1.5`}>
                                    <label className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <span className="text-teal-600">📍</span>
                                            {t('rental.storefront_ui.pickup_location', undefined, 'Lokasi Jemput')}
                                            {locations.length > 0 && <span className="text-rose-500 font-bold">*</span>}
                                        </span>
                                    </label>
                                    <PublicSelect
                                        value={form.data.pickup_location_id}
                                        onChange={(val) => {
                                            setDepotError(false);
                                            form.setData({
                                                ...form.data,
                                                pickup_location_id: val,
                                                return_location_id: diffReturnDepot ? form.data.return_location_id : val,
                                            });
                                        }}
                                        options={pickupOptions}
                                        placeholder={t('rental.storefront_ui.pickup_placeholder', undefined, 'Pilih Depot Penjemputan')}
                                    />
                                    {depotError && (
                                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                                            <span>⚠️</span> Silakan pilih lokasi depot penjemputan.
                                        </p>
                                    )}
                                </div>

                                {/* Return Depot Field (Conditional or synced) */}
                                {diffReturnDepot ? (
                                    <div className="md:col-span-3 space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                                <span className="text-indigo-600">🔄</span>
                                                {t('rental.storefront_ui.return_location', undefined, 'Lokasi Kembali')}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDiffReturnDepot(false);
                                                    form.setData('return_location_id', form.data.pickup_location_id);
                                                }}
                                                className="text-[10px] text-teal-700 hover:underline font-bold"
                                            >
                                                Sama dgn jemput
                                            </button>
                                        </div>
                                        <PublicSelect
                                            value={form.data.return_location_id}
                                            onChange={(val) => form.setData('return_location_id', val)}
                                            options={returnOptions}
                                            placeholder={t('rental.storefront_ui.return_placeholder', undefined, 'Sama dengan lokasi jemput')}
                                        />
                                    </div>
                                ) : (
                                    <div className="hidden" />
                                )}

                                {/* Start Date Field */}
                                <div className={`${diffReturnDepot ? 'md:col-span-2' : 'md:col-span-3'} space-y-1.5`}>
                                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                        <span>🗓️</span>
                                        {t('rental.storefront_ui.start_date', undefined, 'Mulai Sewa')}
                                    </label>
                                    <input
                                        type="date"
                                        min={todayStr}
                                        value={form.data.start_date}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            form.setData((prev) => ({
                                                ...prev,
                                                start_date: newStart,
                                                end_date: prev.end_date < newStart ? newStart : prev.end_date,
                                            }));
                                        }}
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 transition focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                        required
                                    />
                                </div>

                                {/* End Date Field */}
                                <div className={`${diffReturnDepot ? 'md:col-span-2' : 'md:col-span-3'} space-y-1.5`}>
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                            <span>🏁</span>
                                            {t('rental.storefront_ui.end_date', undefined, 'Selesai Sewa')}
                                        </label>
                                        {periodCount !== null && (
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                {periodCount} {periodUnit}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="date"
                                        min={form.data.start_date || todayStr}
                                        value={form.data.end_date}
                                        onChange={(e) => form.setData('end_date', e.target.value)}
                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 transition focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                        required
                                    />
                                </div>

                                {/* Submit CTA Button */}
                                <div className={`${diffReturnDepot ? 'md:col-span-2' : 'md:col-span-2'} flex flex-col justify-end`}>
                                    <button
                                        type="submit"
                                        disabled={searching}
                                        className="w-full h-[42px] flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    >
                                        {searching ? (
                                            <>
                                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                <span>Mencari…</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <span>Cari Mobil</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Sub-bar with Depot toggle & Booking Policy Notice */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                <div className="flex items-center gap-3">
                                    {!diffReturnDepot && (
                                        <button
                                            type="button"
                                            onClick={() => setDiffReturnDepot(true)}
                                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 transition flex items-center gap-1"
                                        >
                                            <span>+</span> Kembalikan ke cabang/depot berbeda
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="text-emerald-600 font-bold">🔒 Aman:</span>
                                    <span>
                                        {t('rental.storefront_ui.hold_notice_before', undefined, 'Unit pesanan dikunci aman hingga')}{' '}
                                        <strong className="text-slate-800 font-black">
                                            {hold_ttl_minutes} {t('rental.storefront_ui.minutes', undefined, 'menit')}
                                        </strong>{' '}
                                        {t('rental.storefront_ui.hold_notice_after', undefined, 'setelah checkout.')}
                                    </span>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Main Vehicle Showroom Catalog Section */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16 space-y-8">
                    {/* Catalog Header, Category Pills, Search & Sort */}
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full mb-1.5 border border-teal-200">
                                    <span>🚗</span>
                                    <span>Armada Siap Jalan</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {t('rental.storefront_ui.catalog_title', undefined, 'Pilihan Mobil Tersedia')}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                                    {selectedPickupDepot
                                        ? `Menampilkan mobil yang siap diambil di ${selectedPickupDepot.name}`
                                        : t('rental.storefront_ui.catalog_subtitle', undefined, 'Pilih armada yang paling cocok untuk rencana perjalanan Anda.')}
                                </p>
                            </div>

                            {/* Search by Car Name & Quick Sort */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Instant Search Input */}
                                <div className="relative min-w-[200px]">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari model mobil…"
                                        className="w-full rounded-xl border border-slate-250 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                    />
                                    <svg className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="rounded-xl border border-slate-250 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                >
                                    <option value="recommended">Rekomendasi</option>
                                    <option value="price_asc">Harga: Termurah</option>
                                    <option value="price_desc">Harga: Tertinggi</option>
                                    <option value="seats_desc">Kapasitas Kursi Terbanyak</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Filter Pills Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                type="button"
                                onClick={() => handleCategoryClick('')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                                    !selectedCategory
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-white border border-slate-250 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <span>{t('rental.storefront_ui.all_classes', undefined, 'Semua Kelas')}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${!selectedCategory ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {vehicles.length}
                                </span>
                            </button>

                            {classes.map((cls) => {
                                const active = selectedCategory === cls.value;
                                return (
                                    <button
                                        key={cls.value}
                                        type="button"
                                        onClick={() => handleCategoryClick(cls.value)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                            active
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'bg-white border border-slate-250 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        {cls.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results Status Summary */}
                    {searched && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80">
                            <div>
                                Ditemukan <strong className="text-slate-900 font-black">{displayedVehicles.length} armada</strong>
                                {form.data.start_date && form.data.end_date ? (
                                    <span>
                                        {' '}untuk periode sewa{' '}
                                        <strong className="text-slate-800 font-bold">
                                            {formatIndoDate(form.data.start_date)} – {formatIndoDate(form.data.end_date)}
                                        </strong>{' '}
                                        ({periodCount} {periodUnit})
                                    </span>
                                ) : null}
                            </div>
                            {selectedPickupDepot && (
                                <div className="text-teal-700 font-semibold flex items-center gap-1">
                                    <span>📍</span> {selectedPickupDepot.name}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State 1: Needs Depot / Initial Search */}
                    {!searched && (
                        <div className="rounded-3xl bg-white p-12 sm:p-16 text-center border border-slate-200/90 shadow-sm max-w-2xl mx-auto">
                            <div 
                                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lg"
                                style={{ backgroundColor: 'var(--brand-color)' }}
                            >
                                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-xl font-black text-slate-900">
                                {needs_depot
                                    ? t('rental.storefront_ui.needs_depot_title', undefined, 'Pilih Lokasi Depot Terlebih Dahulu')
                                    : t('rental.storefront_ui.empty_start_title', undefined, 'Mulai Pencarian Armada Anda')}
                            </h3>
                            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal max-w-md mx-auto leading-relaxed">
                                {needs_depot
                                    ? t('rental.storefront_ui.needs_depot_body', undefined, 'Pilih cabang depot di kolom pencarian di atas untuk memeriksa armada mobil yang siap disewa pada tanggal perjalanan Anda.')
                                    : t('rental.storefront_ui.empty_start_body', undefined, 'Tentukan jadwal dan lokasi penjemputan untuk menemukan mobil yang sesuai dengan kebutuhan Anda.')}
                            </p>
                        </div>
                    )}

                    {/* Empty State 2: No vehicles matching */}
                    {searched && displayedVehicles.length === 0 && (
                        <div className="rounded-3xl bg-white p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-black text-slate-900">{t('rental.storefront_ui.empty_none_title', undefined, 'Unit Tidak Ditemukan')}</h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                                {t('rental.storefront_ui.empty_none_body', undefined, 'Tidak ada armada yang tersedia untuk kriteria dan tanggal yang Anda pilih. Silakan ganti jadwal sewa atau pilih kelas lainnya.')}
                            </p>
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition border border-teal-200"
                                >
                                    Reset Pencarian Model
                                </button>
                            )}
                        </div>
                    )}

                    {/* Modern Showroom Cards Grid */}
                    {searched && displayedVehicles.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                            {displayedVehicles.map((vehicle) => (
                                <Link
                                    key={vehicle.id}
                                    href={vehicleUrl(vehicle.id)}
                                    className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
                                >
                                    <div>
                                        {/* Showcase Photo Wrapper */}
                                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                                            {vehicle.photo_url ? (
                                                <img
                                                    src={vehicle.photo_url}
                                                    alt={vehicle.name}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                                                    <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                        {t('rental.storefront_ui.card_photo_soon', undefined, 'Foto Unit Menyusul')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Gradient Bottom Shadow on Photo */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                                            {/* Floating Class Pill */}
                                            {vehicle.rental_class_label && (
                                                <span
                                                    className="absolute left-3.5 top-3.5 rounded-xl px-3 py-1 text-[10px] font-black text-white shadow-sm backdrop-blur-xs"
                                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                                >
                                                    {vehicle.rental_class_label}
                                                </span>
                                            )}

                                            {/* Availability Badge */}
                                            <span className="absolute right-3.5 top-3.5 rounded-xl bg-white/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-emerald-800 shadow-xs border border-slate-200/80 flex items-center gap-1.5">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                </span>
                                                <span>{t('rental.storefront_ui.card_available', undefined, 'Tersedia')}</span>
                                            </span>

                                            {/* Available Units Count pill (bottom right photo) */}
                                            <span className="absolute right-3.5 bottom-3 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                                {vehicle.available_count} Unit Siap
                                            </span>
                                        </div>

                                        {/* Card Body Details */}
                                        <div className="p-5 sm:p-6 space-y-4">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                                                    {vehicle.name}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                    {vehicle.fuel_label ? `Bahan Bakar: ${vehicle.fuel_label}` : 'Perawatan Berkala Terjamin'}
                                                </p>
                                            </div>

                                            {/* Spec Icons Grid */}
                                            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
                                                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-2.5 border border-slate-200/60 text-center">
                                                    <span className="text-sm">👥</span>
                                                    <span className="mt-1 text-[11px] font-bold text-slate-800">
                                                        {vehicle.capacity_seats ? `${vehicle.capacity_seats} Kursi` : '4-5 Kursi'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-2.5 border border-slate-200/60 text-center">
                                                    <span className="text-sm">⛽</span>
                                                    <span className="mt-1 text-[11px] font-bold text-slate-800 line-clamp-1">
                                                        {vehicle.fuel_label || 'Bensin'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-2.5 border border-slate-200/60 text-center">
                                                    <span className="text-sm">📅</span>
                                                    <span className="mt-1 text-[11px] font-bold text-slate-800">
                                                        {vehicle.model_year ? `Th ${vehicle.model_year}` : 'Terawat'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer: Transparent Pricing & CTA Action */}
                                    <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/70 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                                {form.data.start_date && form.data.end_date ? 'Total Estimasi Sewa' : 'Mulai Dari'}
                                            </span>
                                            {vehicle.total_amount != null ? (
                                                <div>
                                                    <div className="text-lg font-black text-slate-900 leading-tight">
                                                        {money(vehicle.total_amount)}
                                                    </div>
                                                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                        {vehicle.total_periods} {periodUnit}
                                                        {vehicle.from_price != null ? ` · ${money(vehicle.from_price)}/${periodUnit}` : ''}
                                                    </div>
                                                </div>
                                            ) : vehicle.from_price != null ? (
                                                <div>
                                                    <div className="text-lg font-black text-slate-900 leading-tight">
                                                        {money(vehicle.from_price)}
                                                    </div>
                                                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                                                        per {periodUnit}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 font-bold">Hubungi Customer Service</div>
                                            )}
                                        </div>

                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-md transition-all group-hover:scale-105"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            <span>Pesan Unit</span>
                                            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>

                {/* Section: Why Choose Us (Kenapa Memilih Kami) */}
                <section className="bg-white border-y border-slate-200/80 py-16">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
                            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-wider border border-teal-200">
                                Keunggulan Layanan
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Kenapa Memilih Sewa Mobil di {brand.name}?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Kami mengutamakan kenyamanan, transparansi tarif, dan kepastian unit untuk setiap perjalanan Anda.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="rounded-3xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-3 hover:shadow-sm transition">
                                <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl font-bold">
                                    🧼
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Armada Bersih & Prima</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Setiap mobil dicek berkala di bengkel resmi serta dicuci dan disanitasi sebelum diserahterimakan.
                                </p>
                            </div>

                            <div className="rounded-3xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-3 hover:shadow-sm transition">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl font-bold">
                                    🏷️
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Harga Pasti & Transparan</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Tarif sewa dan nilai deposit tertera jelas di muka. Tidak ada biaya tambahan tak terduga saat pengembalian.
                                </p>
                            </div>

                            <div className="rounded-3xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-3 hover:shadow-sm transition">
                                <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-bold">
                                    ⚡
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Pemesanan Cepat & Praktis</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Booking langsung lewat ponsel tanpa antre. Notifikasi status dan detail kontrak dikirimkan instan ke WhatsApp.
                                </p>
                            </div>

                            <div className="rounded-3xl p-6 bg-slate-50/80 border border-slate-200/80 space-y-3 hover:shadow-sm transition">
                                <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl font-bold">
                                    🛡️
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Proteksi & CS Siaga</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Dilengkapi opsi paket proteksi asuransi serta layanan darurat jalan raya yang siap mendampingi Anda 24 jam.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: 3 Langkah Cara Sewa (How It Works) */}
                <section className="py-16 bg-slate-50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
                            <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-200">
                                Panduan Mudah
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                3 Langkah Mudah Sewa Mobil
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Proses reservasi kendaraan cepat dan tanpa prosedur berbelit-belit.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Step 1 */}
                            <div className="relative rounded-3xl bg-white p-7 border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
                                <span className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-md">
                                    1
                                </span>
                                <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl font-bold">
                                    🚗
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Pilih Mobil & Jadwal</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Tentukan tanggal mulai, tanggal selesai, dan pilih unit mobil yang pas dengan kapasitas penumpang Anda.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative rounded-3xl bg-white p-7 border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
                                <span className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-md">
                                    2
                                </span>
                                <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl font-bold">
                                    📄
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Isi Data & Verifikasi</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Lengkapi identitas KTP & SIM Anda secara aman untuk mengunci unit dan mendapatkan bukti reservasi resmi.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative rounded-3xl bg-white p-7 border border-slate-200 shadow-xs flex flex-col items-center text-center space-y-3">
                                <span className="absolute -top-4 left-6 h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-md">
                                    3
                                </span>
                                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                                    🔑
                                </div>
                                <h4 className="text-base font-bold text-slate-900">Ambil Kunci & Jalan</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Temui tim kami di depot resmi, periksa checklist kendaraan bersama, dan mobil siap menemani perjalanan Anda!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section: Ketentuan Sewa & Tanya Jawab (Interactive FAQ) */}
                <section id="ketentuan" className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
                        <div className="text-center max-w-xl mx-auto space-y-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Penting</span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Ketentuan Sewa & Tanya Jawab</h3>
                            <p className="text-xs text-slate-500">Hal-hal yang perlu Anda ketahui sebelum melakukan pemesanan.</p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                {
                                    q: 'Apa saja dokumen yang wajib dibawa saat serah terima unit?',
                                    a: 'Penyewa wajib menunjukkan dokumen identitas asli berupa KTP fisik dan SIM A (atau SIM B) yang masih berlaku. Foto dokumen juga diunggah ke sistem saat verifikasi online untuk keamanan bersama.',
                                },
                                {
                                    q: `Berapa lama batas waktu pembayaran dan penahanan unit?`,
                                    a: `Setelah formulir pesanan dibuat, unit mobil akan kami tahan aman selama ${hold_ttl_minutes} menit. Jika pembayaran atau konfirmasi belum dilakukan melewati batas waktu tersebut, sistem secara otomatis merilis unit agar dapat dipesan kembali oleh pelanggan lain.`,
                                },
                                {
                                    q: 'Bagaimana ketentuan deposit jaminan sewa?',
                                    a: 'Deposit diperlukan sebagai jaminan keamanan selama masa sewa kendaraan. Setelah unit mobil dikembalikan dalam kondisi baik dan checklist serah terima selesai, dana deposit akan dikembalikan penuh ke rekening Anda.',
                                },
                                {
                                    q: 'Apakah bisa mengembalikan kendaraan di lokasi/cabang depot berbeda?',
                                    a: 'Bisa. Anda cukup mengaktifkan opsi lokasi kembali yang berbeda di kolom pencarian. Biaya antar cabang (one-way fee) akan terhitung secara otomatis dan transparan.',
                                },
                                {
                                    q: 'Bagaimana dengan kebijakan privasi dan data pribadi saya?',
                                    a: 'Data pribadi Anda (nama, WhatsApp, KTP/SIM) disimpan dengan enkripsi aman dan hanya digunakan untuk keperluan verifikasi pesanan rental dan serah terima kendaraan.',
                                },
                            ].map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} className="rounded-2xl border border-slate-200/90 overflow-hidden transition-all">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition"
                                        >
                                            <span className="text-xs sm:text-sm font-bold text-slate-900 pr-4">{faq.q}</span>
                                            <span className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                {isOpen ? '−' : '+'}
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="p-4 sm:p-5 text-xs text-slate-600 border-t border-slate-100 bg-white leading-relaxed">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Grounded Deep Slate Footer */}
            <footer className="mt-12 bg-slate-900 text-slate-400 border-t border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Column 1: Brand Info */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                {brand.logo_url ? (
                                    <img src={brand.logo_url} alt={brand.name} className="h-7 w-7 rounded-lg object-contain" />
                                ) : (
                                    <span
                                        className="block h-3 w-3 rounded-full shadow-xs"
                                        style={{ backgroundColor: 'var(--brand-color)' }}
                                    />
                                )}
                                <span className="font-black text-white tracking-tight text-base">{brand.name}</span>
                            </div>
                            <p className="text-xs font-normal text-slate-400 leading-relaxed max-w-sm">
                                {t('rental.storefront_ui.footer_desc', undefined, 'Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.')}
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">
                                {t('rental.storefront_ui.footer_quick_nav', undefined, 'Navigasi Cepat')}
                            </h4>
                            <ul className="space-y-2 text-xs font-medium text-slate-400">
                                <li>
                                    <Link href={route('book.rental.search')} className="hover:text-white transition-colors">
                                        {t('rental.storefront_ui.footer_catalog', undefined, 'Katalog Kendaraan')}
                                    </Link>
                                </li>
                                <li>
                                    <Link href={route('book.rental.history')} className="hover:text-white transition-colors">
                                        {t('rental.storefront_ui.footer_history', undefined, 'Riwayat & Cek Status')}
                                    </Link>
                                </li>
                                <li>
                                    <a href="#ketentuan" className="hover:text-white transition-colors">
                                        Ketentuan & Tanya Jawab
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Contact / Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">
                                {t('rental.storefront_ui.footer_help_title', undefined, 'Pusat Bantuan')}
                            </h4>
                            <div className="text-xs font-medium text-slate-400 space-y-2.5">
                                <p className="leading-relaxed">
                                    {t('rental.storefront_ui.footer_help_body', undefined, 'Butuh konsultasi armada atau konfirmasi pembayaran transfer? Hubungi tim support kami:')}
                                </p>
                                {brand.support_phone ? (
                                    <a
                                        href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 text-emerald-400 font-bold text-xs hover:underline"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                        {t('rental.storefront_ui.footer_hotline', undefined, 'WhatsApp Hotline:')} {brand.support_phone} ↗
                                    </a>
                                ) : (brand.help_locations ?? []).length > 0 ? (
                                    <ul className="space-y-2">
                                        {(brand.help_locations ?? []).map((location) => (
                                            <li key={location.name}>
                                                <span className="font-bold text-slate-200">{location.name}</span>
                                                {location.city ? ` · ${location.city}` : ''}
                                                {location.address ? <span className="block text-slate-400">{location.address}</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="font-bold text-slate-300">
                                        {t('rental.storefront_ui.footer_no_phone', undefined, 'Silakan hubungi cabang terdekat.')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. {t('rental.storefront_ui.rights', undefined, 'Seluruh Hak Cipta Dilindungi.')}
                        </div>
                        <div className="flex gap-4">
                            <a href={brand.terms_url || '#ketentuan'} className="hover:text-slate-300 transition-colors">
                                Syarat & Ketentuan
                            </a>
                            <a href={brand.privacy_url || '#ketentuan'} className="hover:text-slate-300 transition-colors">
                                Kebijakan Privasi
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import LanguageToggle from '@/Components/LanguageToggle';
import PublicSelect from '@/Components/PublicSelect';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
    hero_title?: string | null;
    hero_subtitle?: string | null;
    hero_image_url?: string | null;
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

export default function Search({
    brand,
    filters,
    classes,
    locations,
    vehicles,
    searched,
    hold_ttl_minutes,
}: Props) {
    const { t } = useTrans();
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.rental_class ?? '');

    const periodOptions = [
        { value: 'daily', label: t('rental.storefront_ui.period_daily', undefined, 'Harian') },
        { value: 'weekly', label: t('rental.storefront_ui.period_weekly', undefined, 'Mingguan') },
        { value: 'monthly', label: t('rental.storefront_ui.period_monthly', undefined, 'Bulanan') },
    ];

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

    const pickupOptions = useMemo(
        () => [{ value: '', label: t('rental.storefront_ui.pickup_placeholder', undefined, 'Pilih Lokasi Depot') }, ...depotOptions],
        [depotOptions, t],
    );

    const returnOptions = useMemo(
        () => [{ value: '', label: 'Sama dengan Lokasi Jemput' }, ...depotOptions],
        [depotOptions],
    );

    const daysDuration = useMemo(() => {
        if (!form.data.start_date || !form.data.end_date) return null;
        const start = new Date(form.data.start_date);
        const end = new Date(form.data.end_date);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : null;
    }, [form.data.start_date, form.data.end_date]);

    const submit = (e?: FormEvent, classOverride?: string) => {
        if (e) e.preventDefault();
        const activeClass = classOverride !== undefined ? classOverride : form.data.rental_class;
        router.get(
            route('book.rental.search'),
            {
                start_date: form.data.start_date || undefined,
                end_date: form.data.end_date || undefined,
                period_type: form.data.period_type || 'daily',
                pickup_location_id: form.data.pickup_location_id || undefined,
                return_location_id: form.data.return_location_id || undefined,
                rental_class: activeClass || undefined,
            },
            { preserveState: true },
        );
    };

    const handleCategoryClick = (categoryVal: string) => {
        setSelectedCategory(categoryVal);
        form.setData('rental_class', categoryVal);
        submit(undefined, categoryVal);
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
            className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col justify-between"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${brand.name} · Katalog Sewa Kendaraan`} />

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
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">{t('rental.storefront_ui.tagline', undefined, 'Showroom & Rental Resmi')}</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3">
                            <LanguageToggle />
                            <Link
                                href={route('book.rental.history')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-250 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 shadow-2xs"
                            >
                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('rental.storefront_ui.check_history', undefined, 'Cek Riwayat')}</span>
                            </Link>

                            {brand.support_phone && (
                                <a
                                    href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 transition hover:bg-emerald-100 shadow-2xs"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                    {t('rental.storefront_ui.whatsapp_cs', undefined, 'WhatsApp CS')}
                                </a>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Showcase Section */}
                <section className="bg-white border-b border-slate-200/80 py-10 sm:py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6">
                        <div className="text-center max-w-3xl mx-auto space-y-3.5">
                            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {t('rental.storefront_ui.hero_badge', undefined, 'Pilihan Armada Siap Pakai & Terawat')}
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                {brand.hero_title || t('rental.storefront_ui.hero_title', undefined, 'Temukan Kendaraan Nyaman Untuk Setiap Perjalanan Anda')}
                            </h2>
                            <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                                {brand.hero_subtitle || t('rental.storefront_ui.hero_subtitle', undefined, 'Proses sewa mobil cepat dan transparan. Seluruh unit kami dirawat berkala, bersih, dan bergaransi resmi.')}
                            </p>

                            {/* Trust Markers */}
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold text-slate-600">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 text-sm font-black">✓</span> {t('rental.storefront_ui.trust_clean', undefined, 'Unit Bersih & Higienis')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 text-sm font-black">✓</span> {t('rental.storefront_ui.trust_otp', undefined, 'Booking Cepat WhatsApp OTP')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 text-sm font-black">✓</span> {t('rental.storefront_ui.trust_depot', undefined, 'Serah Terima Depot Resmi')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 text-sm font-black">✓</span> {t('rental.storefront_ui.trust_cs', undefined, 'Dukungan CS 24 Jam')}
                                </div>
                            </div>
                        </div>

                        {brand.hero_image_url && (
                            <div className="mt-8 max-w-5xl mx-auto overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                                <img
                                    src={brand.hero_image_url}
                                    alt={brand.hero_title || brand.name}
                                    className="h-48 w-full object-cover sm:h-64"
                                />
                            </div>
                        )}

                        {/* Interactive Search Bar Widget */}
                        <div className="mt-8 max-w-5xl mx-auto">
                            <form 
                                onSubmit={submit} 
                                className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Pickup Date */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                            {t('rental.storefront_ui.start_date', undefined, 'Tanggal Mulai')}
                                        </label>
                                        <input
                                            type="date"
                                            value={form.data.start_date}
                                            onChange={(e) => form.setData('start_date', e.target.value)}
                                            className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                            required
                                        />
                                    </div>

                                    {/* Return Date */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                                {t('rental.storefront_ui.end_date', undefined, 'Tanggal Selesai')}
                                            </label>
                                            {daysDuration !== null && (
                                                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                    {t('rental.storefront_ui.duration_days', { count: daysDuration }, `${daysDuration} Hari`)}
                                                </span>
                                            )}
                                        </div>
                                        <input
                                            type="date"
                                            value={form.data.end_date}
                                            onChange={(e) => form.setData('end_date', e.target.value)}
                                            className="w-full rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                            required
                                        />
                                    </div>

                                    {/* Pickup Depot */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                                            {t('rental.storefront_ui.pickup_location', undefined, 'Lokasi Penjemputan')}
                                        </label>
                                        <PublicSelect
                                            value={form.data.pickup_location_id}
                                            onChange={(val) => {
                                                form.setData({
                                                    ...form.data,
                                                    pickup_location_id: val,
                                                    return_location_id: form.data.return_location_id || val,
                                                });
                                            }}
                                            options={pickupOptions}
                                            placeholder="Pilih Lokasi Depot"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="space-y-1 flex flex-col justify-end">
                                        <button
                                            type="submit"
                                            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {t('rental.storefront_ui.search_availability', undefined, 'Cari Ketersediaan')}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold uppercase text-slate-400">{t('rental.storefront_ui.period_label', undefined, 'Periode:')}</span>
                                        <div className="flex gap-1.5">
                                            {periodOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => form.setData('period_type', opt.value)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${form.data.period_type === opt.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-[11px] text-slate-400">
                                        {t('rental.storefront_ui.hold_notice_before', undefined, 'Unit ditahan aman hingga')} <b className="text-slate-700 font-bold">{hold_ttl_minutes} {t('rental.storefront_ui.minutes', undefined, 'menit')}</b> {t('rental.storefront_ui.hold_notice_after', undefined, 'setelah dipesan.')}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Main Vehicle Catalog List */}
                <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-8">
                    
                    {/* Category Filter Pills */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('rental.storefront_ui.catalog_title', undefined, 'Katalog Kendaraan Tersedia')}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{t('rental.storefront_ui.catalog_subtitle', undefined, 'Pilih armada yang paling sesuai dengan kebutuhan mobilitas Anda.')}</p>
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                            <button
                                type="button"
                                onClick={() => handleCategoryClick('')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${!selectedCategory ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {t('rental.storefront_ui.all_classes', undefined, 'Semua Kelas')}
                            </button>
                            {classes.map((cls) => (
                                <button
                                    key={cls.value}
                                    type="button"
                                    onClick={() => handleCategoryClick(cls.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${selectedCategory === cls.value ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {cls.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Display */}
                    {!searched && (
                        <div className="rounded-2xl bg-white p-14 text-center border border-slate-200 shadow-xs">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900">{t('rental.storefront_ui.empty_start_title', undefined, 'Mulai Pencarian Kendaraan')}</h3>
                            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                                {t('rental.storefront_ui.empty_start_body', undefined, 'Tentukan tanggal sewa dan lokasi depot di atas untuk menampilkan seluruh unit mobil yang siap disewa.')}
                            </p>
                        </div>
                    )}

                    {searched && vehicles.length === 0 && (
                        <div className="rounded-2xl bg-white p-14 text-center border border-slate-200 shadow-xs">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900">{t('rental.storefront_ui.empty_none_title', undefined, 'Unit Tidak Ditemukan')}</h3>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-md mx-auto font-medium">
                                {t('rental.storefront_ui.empty_none_body', undefined, 'Tidak ada armada yang tersedia untuk kriteria dan tanggal yang Anda pilih. Silakan ganti jadwal sewa atau pilih kelas lainnya.')}
                            </p>
                        </div>
                    )}

                    {/* Showroom Cards Grid */}
                    {searched && vehicles.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vehicles.map((vehicle) => (
                                <Link
                                    key={vehicle.id}
                                    href={vehicleUrl(vehicle.id)}
                                    className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all duration-200"
                                >
                                    <div>
                                        {/* Showcase Photo Container */}
                                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
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
                                                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{t('rental.storefront_ui.card_photo_soon', undefined, 'Foto Unit Menyusul')}</span>
                                                </div>
                                            )}

                                            {/* Floating Class Pill */}
                                            {vehicle.rental_class_label && (
                                                <span 
                                                    className="absolute left-3.5 top-3.5 rounded-lg px-2.5 py-1 text-[10px] font-black text-white shadow-xs"
                                                    style={{ backgroundColor: 'var(--brand-color)' }}
                                                >
                                                    {vehicle.rental_class_label}
                                                </span>
                                            )}

                                            {/* Ready Badge */}
                                            <span className="absolute right-3.5 top-3.5 rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-black text-emerald-800 shadow-2xs border border-slate-200 flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                {t('rental.storefront_ui.card_available', undefined, 'Tersedia')}
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 space-y-3.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="text-base font-black text-slate-900 group-hover:text-slate-950 transition-colors line-clamp-1">
                                                        {vehicle.name}
                                                    </h4>
                                                    <span className="font-mono text-[10px] font-bold text-slate-400 mt-0.5 block">
                                                        {vehicle.plate_number}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Feature Grid Badges */}
                                            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                                                {vehicle.capacity_seats && (
                                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60">
                                                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        <span>{t('rental.storefront_ui.card_seats', { count: vehicle.capacity_seats }, `${vehicle.capacity_seats} Kursi`)}</span>
                                                    </div>
                                                )}
                                                {vehicle.model_year && (
                                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60">
                                                        <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{t('rental.storefront_ui.card_year', { year: vehicle.model_year }, `Th ${vehicle.model_year}`)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Price & Action */}
                                    <div className="border-t border-slate-100 p-5 flex items-center justify-between bg-slate-50/50">
                                        <div>
                                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t('rental.storefront_ui.card_from', undefined, 'Mulai Dari')}</div>
                                            {vehicle.from_price != null ? (
                                                <div className="text-base font-black text-slate-900">
                                                    {money(vehicle.from_price)}
                                                    <span className="text-[10px] font-normal text-slate-500"> / {form.data.period_type === 'daily' ? t('rental.storefront_ui.card_per_day', undefined, 'hari') : t('rental.storefront_ui.card_per_period', undefined, 'periode')}</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-400 font-bold">{t('rental.storefront_ui.card_contact_cs', undefined, 'Hubungi CS')}</div>
                                            )}
                                        </div>

                                        <span 
                                            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-2xs transition-all group-hover:scale-102"
                                            style={{ backgroundColor: 'var(--brand-color)' }}
                                        >
                                            {t('rental.storefront_ui.card_order', undefined, 'Pesan Unit')}
                                            <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
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
                                {t('rental.storefront_ui.footer_desc', undefined, 'Layanan penyewaan kendaraan resmi, aman, dan berlisensi. Kami menghadirkan armada terawat dengan jaminan kenyamanan ekstra dan dukungan serah terima cabang yang luas.')}
                            </p>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div className="md:col-span-3 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">{t('rental.storefront_ui.footer_quick_nav', undefined, 'Navigasi Cepat')}</h4>
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
                            </ul>
                        </div>

                        {/* Column 3: Contact/Support */}
                        <div className="md:col-span-4 space-y-3.5">
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest">{t('rental.storefront_ui.footer_help_title', undefined, 'Pusat Bantuan')}</h4>
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
                                ) : (
                                    <span className="font-bold text-slate-300">{t('rental.storefront_ui.footer_no_phone', undefined, 'Silakan hubungi cabang terdekat.')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
                        <div>
                            © 2026 {brand.name}. {t('rental.storefront_ui.rights', undefined, 'Seluruh Hak Cipta Dilindungi.')}
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

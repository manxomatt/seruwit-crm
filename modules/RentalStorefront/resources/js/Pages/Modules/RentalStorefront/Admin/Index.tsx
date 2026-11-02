import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import RentalNav from '../../../../../../../Rental/resources/js/RentalNav';
import StorefrontPanel, { StorefrontSettings } from '../../../../../../../Rental/resources/js/Pages/Modules/Rental/Settings/StorefrontPanel';
import TestimonialsPanel, { TestimonialItem } from '../../../../../../../Rental/resources/js/Pages/Modules/Rental/Settings/TestimonialsPanel';

interface OnlinePolicy {
    passenger_booking_enabled: boolean;
    pending_reserved_ttl_minutes: string;
    public_mask_plates: boolean;
}

interface Kpis {
    online_bookings_count: number;
    portal_customers_count: number;
    pending_online_bookings: number;
}

interface PublicUrls {
    booking: string;
    portal: string;
    track: string;
}

interface Props {
    storefront: StorefrontSettings;
    testimonials: TestimonialItem[];
    onlinePolicy: OnlinePolicy;
    kpis: Kpis;
    publicUrls: PublicUrls;
}

function PolicyPanel({
    policy,
}: {
    policy: OnlinePolicy;
}): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful, isDirty } = useForm<OnlinePolicy>({
        passenger_booking_enabled: policy.passenger_booking_enabled,
        pending_reserved_ttl_minutes: policy.pending_reserved_ttl_minutes,
        public_mask_plates: policy.public_mask_plates,
    });

    const ttlPresets = [
        { label: '30 Menit', minutes: '30' },
        { label: '1 Jam', minutes: '60' },
        { label: '2 Jam', minutes: '120' },
        { label: '6 Jam', minutes: '360' },
        { label: '24 Jam', minutes: '1440' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.storefront.policy.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                ⚙️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Kebijakan Pemesanan & Privasi Online
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Kontrol akses publik dan batas waktu reservasi web mandiri oleh konsumen.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-6">
                            {/* Toggle 1: Passenger Booking Enabled */}
                            <label
                                htmlFor="passenger_booking_enabled"
                                className={`group flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                    data.passenger_booking_enabled
                                        ? 'border-emerald-200 bg-emerald-50/40 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20'
                                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            Kanal Booking Mandiri Konsumen
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                data.passenger_booking_enabled
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}
                                        >
                                            {data.passenger_booking_enabled ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Izinkan pelanggan umum melakukan pemesanan mandiri secara online melalui katalog website publik.
                                    </p>
                                </div>
                                <input
                                    id="passenger_booking_enabled"
                                    type="checkbox"
                                    checked={data.passenger_booking_enabled}
                                    onChange={(e) => setData('passenger_booking_enabled', e.target.checked)}
                                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                            </label>

                            {/* Pending TTL */}
                            <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
                                <InputLabel
                                    htmlFor="pending_reserved_ttl_minutes"
                                    value="Batas Waktu Penahanan Booking Menunggu Pembayaran (TTL Menit)"
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Pemesanan berstatus Pending yang tidak diselesaikan deposit/pembayarannya dalam waktu ini akan kedaluwarsa otomatis dan unit dilepas kembali ke kalender.
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <div className="relative w-36">
                                        <TextInput
                                            id="pending_reserved_ttl_minutes"
                                            type="number"
                                            min="5"
                                            value={data.pending_reserved_ttl_minutes}
                                            onChange={(e) => setData('pending_reserved_ttl_minutes', e.target.value)}
                                            className="w-full text-sm font-semibold"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-slate-400">
                                            menit
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ttlPresets.map((preset) => (
                                            <button
                                                key={preset.minutes}
                                                type="button"
                                                onClick={() => setData('pending_reserved_ttl_minutes', preset.minutes)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                                                    data.pending_reserved_ttl_minutes === preset.minutes
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <InputError message={errors.pending_reserved_ttl_minutes} className="mt-1.5" />
                            </div>

                            {/* Toggle 2: Mask License Plates */}
                            <label
                                htmlFor="public_mask_plates"
                                className={`group flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                                    data.public_mask_plates
                                        ? 'border-indigo-200 bg-indigo-50/40 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/20'
                                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            Samarkan Plat Nomor di Katalog Publik
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Melindungi privasi dan keamanan armada rental dengan menampilkan format acak (mis. B **** XYZ) di website publik sebelum pemesanan terkonfirmasi.
                                    </p>
                                </div>
                                <input
                                    id="public_mask_plates"
                                    type="checkbox"
                                    checked={data.public_mask_plates}
                                    onChange={(e) => setData('public_mask_plates', e.target.checked)}
                                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Save card */}
                <div className="space-y-6 lg:col-span-4">
                    <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Simpan Kebijakan</h4>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Perubahan kebijakan langsung berlaku untuk semua reservasi baru di website.
                        </p>
                        <div className="mt-6 flex flex-col gap-3">
                            <PrimaryButton type="submit" disabled={processing} className="w-full justify-center">
                                {processing ? 'Menyimpan…' : 'Simpan Perubahan'}
                            </PrimaryButton>
                            {recentlySuccessful && (
                                <p className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    ✓ Kebijakan berhasil diperbarui
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

export default function StorefrontAdminIndex({
    storefront,
    testimonials,
    onlinePolicy,
    kpis,
    publicUrls,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [activeTab, setActiveTab] = useState<'theme' | 'policy' | 'testimonials'>('theme');
    const [copied, setCopied] = useState(false);

    const copyBookingUrl = (): void => {
        if (navigator.clipboard && publicUrls.booking) {
            navigator.clipboard.writeText(publicUrls.booking).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Storefront & Portal Online"
                    subtitle="Pusat kendali website booking publik, katalog armada, portal mandiri konsumen, dan ulasan pelanggan."
                />
            }
        >
            <Head title="Storefront & Portal Online" />
            <RentalNav />

            {/* Quick Links & Status Bar */}
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl backdrop-blur-sm">
                            🌐
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white">
                                    {storefront.brand_name || 'Website Rental'}
                                </h2>
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                        onlinePolicy.passenger_booking_enabled
                                            ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                                            : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                                    }`}
                                >
                                    {onlinePolicy.passenger_booking_enabled ? '● Booking Online Aktif' : '○ Booking Online Nonaktif'}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-300">
                                Katalog publik dan portal pelanggan siap menerima reservasi mandiri.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <a
                        href={publicUrls.booking}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 shadow-sm"
                    >
                        <span>Lihat Website</span>
                        <span className="text-[10px]">↗</span>
                    </a>
                    <a
                        href={publicUrls.portal}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 shadow-sm"
                    >
                        <span>Portal Pelanggan</span>
                        <span className="text-[10px]">↗</span>
                    </a>
                    <button
                        type="button"
                        onClick={copyBookingUrl}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 shadow-sm"
                    >
                        <span>{copied ? '✓ Tersalin!' : '📋 Salin Link Web'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Booking Web</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            🚗
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {kpis.online_bookings_count}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">reservasi</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pelanggan Portal Mandiri</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            👤
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {kpis.portal_customers_count}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">terdaftar</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Booking Menunggu Bayar</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                            ⏳
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {kpis.pending_online_bookings}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">pending</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Warna Brand Utama</span>
                        <span
                            className="h-6 w-6 rounded-full border border-slate-200 shadow-inner dark:border-slate-700"
                            style={{ backgroundColor: storefront.primary_color || '#0f766e' }}
                        />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-xl font-bold uppercase text-slate-900 dark:text-white">
                            {storefront.primary_color || '#0F766E'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 border-b border-slate-200 dark:border-slate-800">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('theme')}
                        className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'theme'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        🎨 Tampilan, Brand & Kontak
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('policy')}
                        className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'policy'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        ⚙️ Kebijakan Pemesanan Online
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('testimonials')}
                        className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'testimonials'
                                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        💬 Ulasan & Testimoni Pelanggan
                    </button>
                </nav>
            </div>

            {/* Tab Contents */}
            {activeTab === 'theme' && (
                <StorefrontPanel
                    storefront={storefront}
                    submitRoute={prefixedRoute('rental.storefront.settings.update')}
                />
            )}
            {activeTab === 'policy' && <PolicyPanel policy={onlinePolicy} />}
            {activeTab === 'testimonials' && (
                <TestimonialsPanel
                    testimonials={testimonials}
                    submitRoute={prefixedRoute('rental.storefront.testimonials.update')}
                />
            )}
        </DynamicLayout>
    );
}

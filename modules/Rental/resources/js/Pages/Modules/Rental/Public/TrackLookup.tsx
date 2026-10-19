import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import LanguageToggle from '@/Components/LanguageToggle';
import { useTrans } from '@/hooks/useTrans';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
    terms_url?: string | null;
    privacy_url?: string | null;
}

interface Props {
    brand: Brand;
}

const fieldClassName =
    'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5';

export default function TrackLookup({ brand }: Props) {
    const { locale } = useTrans();
    const tr = (id: string, en: string) => (locale === 'en' ? en : id);

    const { data, setData, post, processing, errors } = useForm({
        booking_code: '',
        phone: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('book.rental.track.find'));
    };

    const brandColor = brand.color || '#0f766e';

    return (
        <div
            className="min-h-screen bg-slate-50/60 font-sans antialiased text-slate-800 flex flex-col justify-between"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${tr('Lacak Status Pemesanan', 'Track Booking Status')} — ${brand.name}`} />

            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3.5">
                <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
                    <Link href={route('book.rental.search')} className="flex items-center gap-2.5 min-w-0">
                        {brand.logo_url ? (
                            <img src={brand.logo_url} alt={brand.name} className="h-7 w-auto object-contain shrink-0" />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0"
                                style={{ backgroundColor: brandColor }}
                            >
                                {brand.name.substring(0, 1)}
                            </div>
                        )}
                        <span className="font-extrabold text-slate-900 tracking-tight text-base truncate max-w-[120px] sm:max-w-none">{brand.name}</span>
                    </Link>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
                        <LanguageToggle />
                        <Link
                            href={route('book.rental.search')}
                            className="text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg transition hover:bg-slate-100"
                        >
                            {tr('Sewa Mobil', 'Rent a Car')}
                        </Link>
                        <Link
                            href={route('book.rental.history')}
                            className="text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg transition hover:bg-slate-100"
                        >
                            {tr('Riwayat', 'History')}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 md:py-12">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8">
                    <div className="text-center mb-6">
                        <div
                            className="w-14 h-14 rounded-2xl mx-auto mb-3.5 flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: brandColor }}
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {tr('Lacak Status Pemesanan', 'Track Booking Status')}
                        </h1>
                        <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                            {tr(
                                'Pantau status verifikasi, penyiapan unit & driver, kontrak sewa digital, dan serah terima kendaraan secara real-time.',
                                'Monitor verification status, vehicle & driver preparation, digital rental contract, and vehicle handover in real-time.'
                            )}
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                {tr('Kode Booking / Reservasi *', 'Booking / Reservation Code *')}
                            </label>
                            <input
                                type="text"
                                placeholder={tr('Contoh: RNT-202610-0001', 'e.g. RNT-202610-0001')}
                                value={data.booking_code}
                                onChange={(e) => setData('booking_code', e.target.value.toUpperCase())}
                                className={fieldClassName}
                                required
                                autoFocus
                            />
                            {errors.booking_code && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.booking_code}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700">
                                {tr('Nomor WhatsApp Pemesan *', 'Booker WhatsApp Number *')}
                            </label>
                            <input
                                type="tel"
                                placeholder={tr('Contoh: 081234567890', 'e.g. 081234567890')}
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className={fieldClassName}
                                required
                            />
                            {errors.phone && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.phone}</p>}
                            <p className="text-[11px] text-slate-400 mt-1">
                                {tr(
                                    'Masukkan nomor WhatsApp yang digunakan saat melakukan pemesanan rental.',
                                    'Enter the WhatsApp number used when making the rental reservation.'
                                )}
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: brandColor }}
                        >
                            {processing
                                ? tr('Mencari Reservasi...', 'Searching Reservation...')
                                : tr('Lacak Status Sekarang →', 'Track Status Now →')}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
                        <span className="text-slate-500">{tr('Lupa Kode Booking Anda?', 'Forgot your Booking Code?')}</span>
                        <Link
                            href={route('book.rental.history')}
                            className="font-bold text-slate-700 hover:text-slate-900 underline flex items-center gap-1"
                        >
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tr('Cari via Riwayat Nomor WhatsApp', 'Search via WhatsApp Number History')}
                        </Link>
                    </div>
                </div>

                {/* Tracking Highlights */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">{tr('Live Status Real-Time', 'Real-Time Live Status')}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {tr('Pembaruan progres otomatis tanpa perlu chat admin.', 'Automatic progress updates without needing to chat with admin.')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">{tr('Rincian Driver & Mobil', 'Driver & Car Details')}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {tr('Kontak sopir dan pelat nomor mobil terpampang jelas.', 'Driver contact and vehicle license plate clearly displayed.')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900">{tr('Unduh PDF Resmi', 'Download Official PDF')}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {tr('Kontrak Sewa Digital & BAST sah dapat diunduh kapan saja.', 'Valid Digital Rental Contract & Handover Report downloadable anytime.')}
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
                <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p>© {new Date().getFullYear()} {brand.name}. {tr('Seluruh hak cipta dilindungi.', 'All rights reserved.')}</p>
                    {brand.support_phone && (
                        <a
                            href={`https://wa.me/${brand.support_phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                        >
                            <span>{tr('Bantuan Pelanggan', 'Customer Support')}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                                WhatsApp
                            </span>
                        </a>
                    )}
                </div>
            </footer>
        </div>
    );
}

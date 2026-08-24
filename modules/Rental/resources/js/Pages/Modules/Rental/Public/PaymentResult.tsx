import { Head, Link } from '@inertiajs/react';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

type Status = 'success' | 'pending' | 'failed';

interface Props {
    brand: Brand;
    status: Status;
    intent: 'deposit' | 'invoice';
    booking: {
        code: string;
        public_token: string;
    };
    booking_url: string;
}

const COPY: Record<Status, { title: string; body: string; icon: string; tone: string }> = {
    success: {
        title: 'Pembayaran Berhasil',
        body: 'Terima kasih! Pembayaran Anda telah kami terima. Detail terbaru tersedia di halaman reservasi.',
        icon: '✓',
        tone: '#16a34a',
    },
    pending: {
        title: 'Menunggu Konfirmasi',
        body: 'Pembayaran Anda sedang diproses. Status akan diperbarui otomatis begitu pembayaran terkonfirmasi — biasanya beberapa saat.',
        icon: '⏳',
        tone: '#d97706',
    },
    failed: {
        title: 'Pembayaran Belum Selesai',
        body: 'Pembayaran belum berhasil atau dibatalkan. Anda dapat mencoba lagi dari halaman reservasi.',
        icon: '!',
        tone: '#dc2626',
    },
};

export default function PaymentResult({ brand, status, intent, booking, booking_url }: Props) {
    const brandColor = brand.color || '#0f766e';
    const copy = COPY[status];
    const intentLabel = intent === 'invoice' ? 'Pembayaran tagihan' : 'Pembayaran deposit';

    return (
        <div
            className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 flex flex-col"
            style={{ ['--brand-color' as string]: brandColor }}
        >
            <Head title={`${copy.title} · ${brand.name}`} />

            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 py-3.5 flex items-center gap-3">
                    {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="h-10 w-10 rounded-xl object-contain" />
                    ) : (
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h8m-8 4h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    )}
                    <h1 className="text-base font-black tracking-tight text-slate-900">{brand.name}</h1>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white"
                        style={{ backgroundColor: copy.tone }}
                    >
                        {copy.icon}
                    </div>
                    <span className="mt-5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {intentLabel} · #{booking.code}
                    </span>
                    <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{copy.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{copy.body}</p>

                    <div className="mt-7 flex flex-col gap-3">
                        <Link
                            href={booking_url}
                            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            Lihat Detail Reservasi
                        </Link>
                        {brand.support_phone && (
                            <a
                                href={`https://wa.me/${brand.support_phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
                            >
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                Hubungi CS via WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} {brand.name}. Seluruh Hak Cipta Dilindungi.
            </footer>
        </div>
    );
}

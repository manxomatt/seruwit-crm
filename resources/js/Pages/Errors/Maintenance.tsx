import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { Head, Link } from '@inertiajs/react';

interface Props {
    siteName: string;
    siteTagline?: string | null;
    siteDescription?: string | null;
    siteLogo?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    workingHours?: string | null;
    loginUrl: string;
}

export default function Maintenance({
    siteName,
    siteTagline,
    siteLogo,
    contactEmail,
    phone,
    whatsapp,
    workingHours,
    loginUrl,
}: Props): JSX.Element {
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
            <Head title={`Mode Pemeliharaan · ${siteName}`} />

            {/* Header bar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {siteLogo ? (
                            <img src={siteLogo} alt={siteName} className="h-8 w-auto rounded-lg" />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-black shadow-sm">
                                ⚙️
                            </span>
                        )}
                        <div className="truncate">
                            <span className="truncate font-display text-base font-bold tracking-tight text-white sm:text-lg">
                                {siteName}
                            </span>
                            {siteTagline && (
                                <p className="hidden sm:block text-[11px] text-slate-400 truncate">
                                    {siteTagline}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher compact className="bg-slate-800 text-slate-300" />
                        <Link
                            href={loginUrl}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                            <span>🔐</span>
                            <span>Login Staf</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
                {/* Background ambient lighting */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
                    <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
                    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-lg">
                    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
                        <div className="flex flex-col items-center text-center">
                            {/* Animated Icon */}
                            <div className="relative mb-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-400 ring-1 ring-amber-500/30 shadow-inner">
                                    <span className="text-4xl animate-pulse">🛠️</span>
                                </div>
                                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md ring-2 ring-slate-900 text-xs font-black">
                                    !
                                </span>
                            </div>

                            {/* Status Badge */}
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300">
                                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                                <span>Sedang Dalam Pemeliharaan (Maintenance)</span>
                            </span>

                            {/* Headline */}
                            <h1 className="mt-4 font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                                Kami Akan Segera Kembali
                            </h1>

                            <p className="mt-3 text-sm leading-relaxed text-slate-300">
                                Saat ini sistem sedang menjalani peningkatan performa dan pemeliharaan terjadwal untuk meningkatkan kenyamanan dan kualitas layanan.
                            </p>

                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                Mohon maaf atas ketidaknyamanan ini. Seluruh fitur publik akan segera dapat diakses kembali setelah pembaruan selesai.
                            </p>

                            {/* Contact Box if available */}
                            {(contactEmail || phone || whatsapp) && (
                                <div className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-800/40 p-4 text-left">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        Butuh bantuan darurat? Hubungi kami:
                                    </p>
                                    <div className="space-y-1.5 text-xs text-slate-300">
                                        {contactEmail && (
                                            <div className="flex items-center gap-2">
                                                <span>✉️</span>
                                                <a href={`mailto:${contactEmail}`} className="text-indigo-400 hover:underline font-mono">
                                                    {contactEmail}
                                                </a>
                                            </div>
                                        )}
                                        {phone && (
                                            <div className="flex items-center gap-2">
                                                <span>📞</span>
                                                <a href={`tel:${phone}`} className="text-indigo-400 hover:underline">
                                                    {phone}
                                                </a>
                                            </div>
                                        )}
                                        {whatsapp && (
                                            <div className="flex items-center gap-2">
                                                <span>💬</span>
                                                <a
                                                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-400 hover:underline font-semibold"
                                                >
                                                    WhatsApp: {whatsapp}
                                                </a>
                                            </div>
                                        )}
                                        {workingHours && (
                                            <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-700/50 mt-1">
                                                <span>🕒</span>
                                                <span>{workingHours}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={handleReload}
                                    className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-98"
                                >
                                    <span>🔄</span>
                                    <span>Muat Ulang Halaman</span>
                                </button>
                                <Link
                                    href={loginUrl}
                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                                >
                                    <span>🔐</span>
                                    <span>Login Staf</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
            </footer>
        </div>
    );
}

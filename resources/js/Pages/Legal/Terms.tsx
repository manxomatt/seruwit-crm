import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';

interface Props {
    settings?: Record<string, string>;
}

export default function Terms({ settings }: Props) {
    const { t } = useTrans();
    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;

    return (
        <>
            <Head title={`Syarat & Ketentuan - ${siteName}`} />

            <div className="min-h-screen bg-slate-950 text-slate-100">
                {/* Header Navbar */}
                <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-3 font-bold text-white transition-opacity hover:opacity-90">
                            <span className="material-symbols-outlined text-2xl text-cyan-400">location_on</span>
                            <span className="text-xl tracking-tight">{siteName}</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <LanguageSwitcher compact className="bg-white/10 [&_button]:text-white/70 [&_button.bg-white]:text-gray-900" />
                            <Link
                                href={route('register')}
                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
                            >
                                {t('auth_ui.register_title')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-4xl px-6 py-12">
                    <div className="mb-10 text-center">
                        <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                            Ketentuan Layanan & Registrasi
                        </span>
                        <h1 className="mt-4 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                            Syarat & Ketentuan Registrasi Platform
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">Terakhir diperbarui: 8 Agustus 2026</p>
                    </div>

                    <div className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm">
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-cyan-400">
                                <span className="material-symbols-outlined">badge</span>
                                1. Ketentuan Akun & Registrasi Pengguna
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Dengan mendaftar dan membuat akun pada platform <strong className="text-white">{siteName}</strong>, Anda menyatakan bahwa Anda berusia minimal 18 tahun atau memiliki kewenangan legal untuk mewakili badan usaha/perusahaan yang mendaftar. Seluruh informasi yang Anda berikan saat registrasi (nama lengkap, alamat email, dan identitas bisnis) harus akurat dan benar.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-cyan-400">
                                <span className="material-symbols-outlined">domain</span>
                                2. Pengelolaan Tenant & Workspace Bisnis
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Akun registrasi utama Anda berfungsi sebagai pemilik (*owner*) awal dari ruang kerja bisnis (*tenant workspace*). Anda bertanggung jawab penuh atas segala aktivitas, pengelolaan hak akses modul, staf/driver yang diundang, serta kepatuhan data transaksi yang dikelola di dalam workspace Anda.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-cyan-400">
                                <span className="material-symbols-outlined">security</span>
                                3. Keamanan Sandi & Hak Akses
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi (*password*) dan keamanan credential akun. Jika ditemukan indikasi akses tanpa izin atau pelanggaran keamanan pada akun Anda, harap segera hubungi tim dukungan sistem kami.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-cyan-400">
                                <span className="material-symbols-outlined">gavel</span>
                                4. Pembatasan Penggunaan & Hak Kekayaan Intelektual
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Seluruh hak cipta, merek dagang, dan kode sumber platform ini dimiliki secara eksklusif oleh penyedia platform. Pengguna dilarang melakukan penyalahgunaan sistem, rekayasa balik (*reverse engineering*), atau memanfaatkan platform untuk kegiatan yang melanggar hukum yang berlaku di Republik Indonesia.
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 flex justify-center gap-4">
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Kembali ke Halaman Registrasi
                        </Link>
                    </div>
                </main>

                <footer className="mt-12 border-t border-slate-800 bg-slate-950 py-6 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                </footer>
            </div>
        </>
    );
}

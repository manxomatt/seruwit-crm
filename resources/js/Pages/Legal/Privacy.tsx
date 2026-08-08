import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';

interface Props {
    settings?: Record<string, string>;
}

export default function Privacy({ settings }: Props) {
    const { t } = useTrans();
    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;

    return (
        <>
            <Head title={`Kebijakan Privasi - ${siteName}`} />

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
                        <span className="inline-block rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                            Perlindungan Data & Privasi
                        </span>
                        <h1 className="mt-4 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                            Kebijakan Privasi Pengguna
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">Terakhir diperbarui: 8 Agustus 2026</p>
                    </div>

                    <div className="space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-sm">
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-400">
                                <span className="material-symbols-outlined">dataset</span>
                                1. Pengumpulan Informasi Pribadi & Bisnis
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Kami mengumpulkan informasi yang Anda berikan secara langsung saat registrasi akun dan pembuatan workspace, meliputi nama pengguna, alamat email, nomor telepon bisnis, serta informasi transaksi layanan operasional yang Anda kelola di dalam platform <strong className="text-white">{siteName}</strong>.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-400">
                                <span className="material-symbols-outlined">tune</span>
                                2. Penggunaan Data & Tujuan Pengolahan
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Data yang dikumpulkan digunakan semata-mata untuk mengoperasikan platform CRM, memverifikasi identitas pengguna, mengelola tagihan & reservasi, memberikan layanan dukungan pelanggan, serta meningkatkan kinerja dan keamanan platform secara berkelanjutan.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-400">
                                <span className="material-symbols-outlined">lock</span>
                                3. Keamanan Data & Isolasi Tenant
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Seluruh data tenant disimpan dengan isolasi skema database (*multi-tenancy isolation*) dan enkripsi jaringan berstandar industri. Kami tidak pernah menjual atau membagikan data bisnis pribadi Anda kepada pihak ketiga tanpa persetujuan tertulis dari Anda.
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-800/80 pt-6">
                            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-400">
                                <span className="material-symbols-outlined">delete_history</span>
                                4. Hak Pengguna & Retensi Data
                            </h2>
                            <p className="leading-relaxed text-slate-300">
                                Pengguna berhak meminta pembaruan data, ekspor data transaksi bisnis, atau pengahapusan akun sesuai dengan prosedur dan regulasi pelindungan data pribadi yang berlaku.
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

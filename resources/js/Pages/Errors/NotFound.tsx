import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, usePage } from '@inertiajs/react';

interface NotFoundProps {
    siteName?: string;
    siteTagline?: string | null;
    siteLogo?: string | null;
    homeUrl: string;
    dashboardUrl: string;
    loginUrl: string;
    isAuthenticated?: boolean;
}

export default function NotFound({
    siteName,
    siteTagline,
    siteLogo,
    homeUrl,
    dashboardUrl,
    loginUrl,
    isAuthenticated = false,
}: NotFoundProps): JSX.Element {
    const { t } = useTrans();
    const pageProps = usePage().props as {
        availableLocales?: Array<{ code: string; label: string }>;
        settings?: Record<string, string>;
    };

    const resolvedSiteName =
        siteName || pageProps.settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const resolvedLogo = siteLogo || pageProps.settings?.['site.logo'] || null;
    const hasLocales = (pageProps.availableLocales?.length ?? 0) > 0;

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();

            return;
        }

        window.location.assign(homeUrl);
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-primary selection:text-white dark:bg-slate-950 dark:text-slate-100">
            <Head title={`${t('errors.not_found.page_title', {}, '404 — Halaman Tidak Ditemukan')} · ${resolvedSiteName}`} />

            {/* Architectural subtle grid + ambient glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div
                    className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '28px 28px',
                    }}
                />
                <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
                <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-3xl dark:bg-secondary/15" />
                <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
            </div>

            {/* Sticky Glassmorphism Header */}
            <header className="sticky top-0 z-40 w-full border-b border-slate-200/75 bg-white/75 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link href={homeUrl} className="flex min-w-0 items-center gap-3 group">
                        {resolvedLogo ? (
                            <img
                                src={resolvedLogo}
                                alt={resolvedSiteName}
                                className="h-8 w-auto rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
                            />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200/80 transition-transform duration-200 group-hover:scale-105 dark:bg-slate-900 dark:ring-slate-800">
                                <ApplicationLogo showText={false} className="h-full w-full" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <span className="block truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                                {resolvedSiteName}
                            </span>
                            {siteTagline && (
                                <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
                                    {siteTagline}
                                </p>
                            )}
                        </div>
                    </Link>

                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {hasLocales && (
                            <LanguageSwitcher
                                compact
                                className="bg-slate-100 dark:bg-slate-900 dark:[&_button]:text-slate-400 dark:[&_button.bg-white]:bg-slate-800 dark:[&_button.bg-white]:text-white"
                            />
                        )}
                        <Link
                            href={isAuthenticated ? dashboardUrl : loginUrl}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                        >
                            <span className="material-symbols-outlined text-[16px]">
                                {isAuthenticated ? 'space_dashboard' : 'login'}
                            </span>
                            <span>
                                {isAuthenticated
                                    ? t('errors.not_found.back_dashboard', {}, 'Buka Dashboard')
                                    : t('errors.not_found.sign_in', {}, 'Masuk ke Akun')}
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="overflow-hidden rounded-3xl border border-slate-200/85 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/85 dark:shadow-black/40 sm:p-10 md:p-12">
                        <div className="flex flex-col items-center text-center">
                            {/* Sculptural 404 Visual */}
                            <div className="relative mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-tr from-primary/20 via-sky-400/15 to-secondary/20 blur-2xl" />
                                <div className="relative flex items-center gap-2 sm:gap-4">
                                    <span className="font-display text-7xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-8xl md:text-9xl">
                                        4
                                    </span>
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-sky-500/10 to-secondary/15 shadow-inner dark:border-primary/30 sm:h-24 sm:w-24 md:h-28 md:w-28">
                                        <span className="absolute inset-2 rounded-2xl border border-dashed border-primary/30 animate-[spin_18s_linear_infinite]" />
                                        <span className="material-symbols-outlined text-4xl text-primary dark:text-sky-400 sm:text-5xl">
                                            explore_off
                                        </span>
                                    </div>
                                    <span className="font-display text-7xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-8xl md:text-9xl">
                                        4
                                    </span>
                                </div>
                            </div>

                            {/* Status Pill */}
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 dark:bg-sky-400" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary dark:bg-sky-400" />
                                </span>
                                {t('errors.not_found.badge', {}, 'HTTP 404 · Halaman Tidak Ditemukan')}
                            </span>

                            {/* Headline & Description */}
                            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl">
                                {t('errors.not_found.headline', {}, 'Sepertinya Anda tersesat di luar jalur')}
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                                {t(
                                    'errors.not_found.description',
                                    {},
                                    'Halaman yang Anda cari mungkin telah dipindahkan, dihapus, berganti alamat, atau sedang tidak tersedia saat ini.'
                                )}
                            </p>

                            {/* Primary Action */}
                            <div className="mt-8 flex w-full items-center justify-center sm:w-auto">
                                <button
                                    type="button"
                                    onClick={handleGoBack}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:w-auto"
                                >
                                    <span className="material-symbols-outlined text-[19px]">arrow_back</span>
                                    <span>{t('errors.not_found.go_back', {}, 'Halaman Sebelumnya')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="relative z-10 border-t border-slate-200/60 py-5 dark:border-slate-800/60">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
                    <span>
                        &copy; {new Date().getFullYear()} {resolvedSiteName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {t('errors.not_found.footer_note', {}, 'Kode Referensi: HTTP 404 Not Found')}
                    </span>
                </div>
            </footer>
        </div>
    );
}

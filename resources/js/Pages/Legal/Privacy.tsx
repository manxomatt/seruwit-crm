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
    const siteLogo = settings?.['site.logo'];

    return (
        <>
            <Head title={`${t('legal.privacy.page_title')} - ${siteName}`} />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/80 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient fresh glow effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-sky-300/30 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-indigo-300/30 blur-[130px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-300/20 blur-[150px]" />
                </div>

                {/* Header Navbar */}
                <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        <Link href="/" className="flex items-center gap-3 font-extrabold text-slate-900 transition-opacity hover:opacity-90">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-8 w-8 object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-2xl text-indigo-600">location_on</span>
                            )}
                            <span className="text-xl tracking-tight">{siteName}</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <LanguageSwitcher compact className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-sm [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white" />
                            <Link
                                href={route('register')}
                                className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md transition"
                            >
                                {t('auth_ui.register_title')}
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
                    <div className="mb-10 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 shadow-sm backdrop-blur-md">
                            {t('legal.privacy.badge')}
                        </span>
                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            {t('legal.privacy.title')}
                        </h1>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                            {t('legal.privacy.last_updated', { date: t('legal.privacy.last_updated_date') })}
                        </p>
                    </div>

                    <div className="space-y-8 rounded-3xl border border-white/90 bg-white/85 p-8 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                        <section className="space-y-3">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-sky-600">
                                <span className="material-symbols-outlined text-xl">dataset</span>
                                {t('legal.privacy.sections.collection.title')}
                            </h2>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">
                                {t('legal.privacy.sections.collection.prefix')}{' '}
                                <strong className="text-slate-900">{siteName}</strong>
                                {t('legal.privacy.sections.collection.suffix')}
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-100 pt-6">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-sky-600">
                                <span className="material-symbols-outlined text-xl">tune</span>
                                {t('legal.privacy.sections.usage.title')}
                            </h2>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">
                                {t('legal.privacy.sections.usage.content')}
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-100 pt-6">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-sky-600">
                                <span className="material-symbols-outlined text-xl">lock</span>
                                {t('legal.privacy.sections.security.title')}
                            </h2>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">
                                {t('legal.privacy.sections.security.content')}
                            </p>
                        </section>

                        <section className="space-y-3 border-t border-slate-100 pt-6">
                            <h2 className="flex items-center gap-2.5 text-lg font-bold text-sky-600">
                                <span className="material-symbols-outlined text-xl">delete_history</span>
                                {t('legal.privacy.sections.rights.title')}
                            </h2>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">
                                {t('legal.privacy.sections.rights.content')}
                            </p>
                        </section>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-xs font-bold text-slate-700 shadow-sm transition"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            {t('legal.privacy.back_to_register')}
                        </Link>
                    </div>
                </main>

                <footer className="relative z-10 mt-12 border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs font-medium text-slate-400">
                    {t('legal.privacy.copyright', {
                        year: new Date().getFullYear(),
                        name: siteName,
                    })}
                </footer>
            </div>
        </>
    );
}

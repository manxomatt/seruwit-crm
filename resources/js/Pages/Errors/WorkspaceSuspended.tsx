import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, usePage } from '@inertiajs/react';

interface Props {
    workspace: {
        name: string;
        domain: string | null;
    };
    workspacesUrl: string;
    settings?: Record<string, string>;
}

export default function WorkspaceSuspended({
    workspace,
    workspacesUrl,
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();
    const page = usePage().props as {
        auth?: { user?: { email?: string; name?: string } };
        settings?: Record<string, string>;
    };

    const pageSettings = settings ?? page.settings;
    const siteName = pageSettings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = pageSettings?.['site.logo'];
    const workspaceLabel = workspace.name || workspace.domain || siteName;

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
            <Head title={t('central.suspended.title')} />

            <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <a href={workspacesUrl} className="flex min-w-0 items-center gap-2.5">
                        {siteLogo ? (
                            <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                        ) : (
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-white shadow-sm shadow-teal-600/20">
                                <span className="material-symbols-outlined text-[20px]">hub</span>
                            </span>
                        )}
                        <span className="truncate font-display text-lg font-bold tracking-tight text-slate-900">
                            {siteName}
                        </span>
                    </a>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitcher
                            compact
                            className="bg-slate-100 [&_button]:text-slate-500 [&_button.bg-white]:text-teal-800"
                        />
                        {page.auth?.user && (
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                type="button"
                                className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700"
                            >
                                {t('shell.log_out')}
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden bg-slate-50">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
                    <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
                    <div className="absolute left-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-100/50 blur-2xl" />
                </div>

                <div className="relative mx-auto w-full max-w-lg px-4 py-12 sm:px-6 sm:py-16">
                    <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/60 backdrop-blur-sm sm:p-10">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600 shadow-inner ring-1 ring-amber-200/80">
                                    <span className="material-symbols-outlined text-5xl">pause_circle</span>
                                </span>
                                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                                    <span className="material-symbols-outlined text-[16px] text-amber-600">
                                        lock
                                    </span>
                                </span>
                            </div>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                {t('central.suspended.status_badge')}
                            </span>

                            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                                {t('central.suspended.headline')}
                            </h1>

                            <p className="mt-2 text-base font-semibold text-slate-800">{workspaceLabel}</p>

                            {workspace.domain && workspace.name ? (
                                <p className="mt-1 font-mono text-xs text-slate-400">{workspace.domain}</p>
                            ) : null}

                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                                {workspace.name
                                    ? t('central.suspended.message', { name: workspace.name })
                                    : t('central.suspended.message_generic')}
                            </p>

                            <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-400">
                                {t('central.suspended.hint')}
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col gap-3">
                            <a
                                href={workspacesUrl}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800"
                            >
                                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                                {t('central.suspended.back_workspaces')}
                            </a>

                            {page.auth?.user?.email ? (
                                <p className="text-center text-xs text-slate-400">
                                    {t('central.workspaces.signed_in_as')}{' '}
                                    <span className="font-medium text-slate-600">{page.auth.user.email}</span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

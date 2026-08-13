import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, usePage } from '@inertiajs/react';

interface Workspace {
    id: string;
    name: string;
    status: string;
    domain: string | null;
    trial_ends_at?: string | null;
    is_on_trial?: boolean;
}

interface Props {
    workspaces: Workspace[];
    settings?: Record<string, string>;
}

export default function Workspaces({ workspaces, settings }: Props): JSX.Element {
    const { t } = useTrans();
    const { auth } = usePage().props as { auth?: { user?: { email?: string; name?: string } } };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
            <Head title={t('central.workspaces.title')} />

            <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
                    <a href="/" className="flex min-w-0 items-center gap-2.5">
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
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            type="button"
                            className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700"
                        >
                            {t('shell.log_out')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative isolate flex-1 overflow-hidden bg-slate-50">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
                    <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
                    <div className="absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl" />
                </div>

                <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
                    <div className="mb-10 max-w-xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                            {siteName}
                        </p>
                        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            {t('central.workspaces.title')}
                        </h1>
                        <p className="mt-3 text-base text-slate-600">
                            {t('central.workspaces.subtitle')}
                        </p>
                        {auth?.user?.email && (
                            <p className="mt-2 text-sm text-slate-500">
                                {t('central.workspaces.signed_in_as')}{' '}
                                <span className="font-medium text-slate-700">{auth.user.email}</span>
                            </p>
                        )}
                    </div>

                    {workspaces.length > 0 ? (
                        <ul className="space-y-3">
                            {workspaces.map((workspace) => {
                                const active = workspace.status === 'active';
                                const onTrial = workspace.is_on_trial && active;

                                return (
                                    <li key={workspace.id}>
                                        {onTrial ? (
                                            <div className="rounded-2xl border border-cyan-200/80 bg-white/90 p-5 shadow-sm shadow-cyan-200/60 backdrop-blur-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-500 text-base font-bold text-white shadow-sm shadow-cyan-600/20">
                                                            {workspace.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-900">
                                                                {workspace.name}
                                                            </p>
                                                            {workspace.domain && (
                                                                <p className="truncate text-sm text-slate-500">
                                                                    {workspace.domain}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
                                                            {t('central.trial.days_left', { days: '7' })}
                                                        </span>
                                                        <a
                                                            href={route('central.subscription.show', workspace.id)}
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-cyan-700/25 transition hover:bg-cyan-800"
                                                        >
                                                            {t('central.trial.activate_button')}
                                                        </a>
                                                        <a
                                                            href={route('central.workspaces.enter', workspace.id)}
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800"
                                                        >
                                                            {t('central.trial.enter_workspace')}
                                                        </a>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs text-slate-500">
                                                    {t('central.trial.trial_info')}
                                                </p>
                                            </div>
                                        ) : active ? (
                                            <a
                                                href={route('central.workspaces.enter', workspace.id)}
                                                className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur-sm transition hover:border-teal-300 hover:shadow-md hover:shadow-teal-700/10"
                                            >
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 text-base font-bold text-white shadow-sm shadow-teal-600/20">
                                                        {workspace.name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-slate-900">
                                                            {workspace.name}
                                                        </p>
                                                        {workspace.domain && (
                                                            <p className="truncate text-sm text-slate-500">
                                                                {workspace.domain}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition group-hover:bg-teal-800">
                                                    {t('central.workspaces.enter')}
                                                </span>
                                            </a>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm shadow-slate-200/60 backdrop-blur-sm">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-500">
                                                            {workspace.name.charAt(0).toUpperCase()}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-slate-700">
                                                                {workspace.name}
                                                            </p>
                                                            {workspace.domain && (
                                                                <p className="truncate text-sm text-slate-400">
                                                                    {workspace.domain}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                                            {t('central.workspaces.suspended')}
                                                        </span>
                                                        <a
                                                            href={route('central.subscription.show', workspace.id)}
                                                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-700/25 transition hover:bg-amber-800"
                                                        >
                                                            {t('central.trial.activate_button')}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm">
                            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                <span className="material-symbols-outlined">apartment</span>
                            </span>
                            <p className="font-semibold text-slate-800">{t('central.workspaces.empty_title')}</p>
                            <p className="mt-1 text-sm text-slate-500">{t('central.workspaces.empty_hint')}</p>
                            <Link
                                href={route('central.onboarding.show')}
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800"
                            >
                                {t('central.workspaces.create_workspace')}
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

import AccountingShell from './AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Link } from '@inertiajs/react';

interface Check {
    key: string;
    label: string;
    ok: boolean;
    detail: string | null;
}

interface Props {
    stats: {
        accounts: number;
        draft_journals: number;
        posted_journals: number;
        open_period: { id: number; name: string; starts_on: string; ends_on: string; status: string } | null;
    };
    readiness: {
        ready: boolean;
        blocking: Check[];
        warnings: Check[];
        opening_status: string;
    };
    can: { manage_coa: boolean; journal: boolean; post: boolean; period: boolean };
}

type StatTone = 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'slate';

const STAT_TONES: Record<StatTone, { card: string; icon: string; value: string; accent: string }> = {
    emerald: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
        value: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
        value: 'text-slate-900 dark:text-white',
        accent: 'bg-sky-500',
    },
    amber: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
        value: 'text-amber-600 dark:text-amber-400',
        accent: 'bg-amber-500',
    },
    violet: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
        value: 'text-violet-600 dark:text-violet-400',
        accent: 'bg-violet-500',
    },
    rose: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
        value: 'text-rose-600 dark:text-rose-400',
        accent: 'bg-rose-500',
    },
    slate: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
        icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        value: 'text-slate-900 dark:text-white',
        accent: 'bg-slate-500',
    },
};

function IconLedger(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
    );
}

function IconDraft(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    );
}

function IconPosted(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function IconCalendar(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    );
}

function IconCheck(): JSX.Element {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function IconX(): JSX.Element {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function IconArrow(): JSX.Element {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function formatDate(value: string): string {
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    href,
}: {
    label: string;
    value: string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    href?: string;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const body = (
        <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${styles.icon}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`text-xl font-extrabold truncate ${styles.value}`}>{value}</p>
                {hint && <p className="mt-0.5 text-[11px] text-slate-400 truncate">{hint}</p>}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={`block rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${styles.card}`}
            >
                {body}
            </Link>
        );
    }

    return <div className={`rounded-3xl border p-5 shadow-sm ${styles.card}`}>{body}</div>;
}

function QuickLink({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}): JSX.Element {
    return (
        <Link
            href={href}
            className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
        >
            <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{description}</p>
            </div>
            <span className="mt-0.5 text-slate-400 transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <IconArrow />
            </span>
        </Link>
    );
}

export default function Dashboard({ stats, readiness, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const checks = [...readiness.blocking, ...readiness.warnings];
    const passed = checks.filter((check) => check.ok).length;
    const progress = checks.length > 0 ? Math.round((passed / checks.length) * 100) : 0;
    const allClear = readiness.ready && readiness.warnings.every((check) => check.ok);
    const failedBlocking = readiness.blocking.filter((check) => !check.ok).length;
    const failedWarnings = readiness.warnings.filter((check) => !check.ok).length;
    const journalsTotal = stats.draft_journals + stats.posted_journals;

    const checkAction = (key: string): string | null => {
        switch (key) {
            case 'coa_roles':
                return can.manage_coa ? prefixedRoute('accounting.accounts.index') : null;
            case 'open_period':
                return can.period ? prefixedRoute('accounting.periods.index') : null;
            case 'bank_accounts':
                return prefixedRoute('accounting.bank-accounts.index');
            case 'opening_balance':
                return can.period ? prefixedRoute('accounting.opening-balances.create') : null;
            default:
                return null;
        }
    };

    const statusBanner = allClear
        ? {
              wrap: 'border-emerald-200/60 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
              title: t('accounting.readiness.status_ready'),
              body: t('accounting.dashboard.ready_hint'),
          }
        : readiness.ready
          ? {
                wrap: 'border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200',
                title: t('accounting.readiness.status_warnings'),
                body: t('accounting.dashboard.warnings_hint', { count: failedWarnings }),
            }
          : {
                wrap: 'border-rose-200/60 dark:border-rose-800/50 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200',
                title: t('accounting.readiness.status_blocked'),
                body: t('accounting.dashboard.blocked_hint', { count: failedBlocking }),
            };

    return (
        <AccountingShell
            active="dashboard"
            title={t('accounting.dashboard.title')}
            headerActions={
                can.journal ? (
                    <Link href={prefixedRoute('accounting.journals.create')}>
                        <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('accounting.journals.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            {/* Readiness Progress Banner */}
            <div className={`mb-6 rounded-3xl border px-6 py-5 shadow-sm ${statusBanner.wrap}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-extrabold">{statusBanner.title}</p>
                        <p className="mt-0.5 text-xs opacity-90">{statusBanner.body}</p>
                    </div>
                    <div className="text-right text-xs font-bold opacity-80">
                        <p>
                            {t('accounting.dashboard.readiness_progress', {
                                passed,
                                total: checks.length,
                            })}
                        </p>
                        <p className="mt-0.5 font-mono text-sm">{progress}%</p>
                    </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/80">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            allClear ? 'bg-emerald-500' : readiness.ready ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('accounting.dashboard.accounts')}
                    value={String(stats.accounts)}
                    hint={t('accounting.dashboard.accounts_hint')}
                    tone="sky"
                    icon={<IconLedger />}
                    href={can.manage_coa ? prefixedRoute('accounting.accounts.index') : undefined}
                />
                <StatCard
                    label={t('accounting.dashboard.draft_journals')}
                    value={String(stats.draft_journals)}
                    hint={
                        stats.draft_journals > 0
                            ? t('accounting.dashboard.draft_hint')
                            : t('accounting.dashboard.draft_clear')
                    }
                    tone={stats.draft_journals > 0 ? 'amber' : 'slate'}
                    icon={<IconDraft />}
                    href={prefixedRoute('accounting.journals.index')}
                />
                <StatCard
                    label={t('accounting.dashboard.posted_journals')}
                    value={String(stats.posted_journals)}
                    hint={t('accounting.dashboard.posted_hint', { total: journalsTotal })}
                    tone="emerald"
                    icon={<IconPosted />}
                    href={prefixedRoute('accounting.journals.index')}
                />
                <StatCard
                    label={t('accounting.dashboard.open_period')}
                    value={stats.open_period?.name ?? t('accounting.dashboard.no_open_period')}
                    hint={
                        stats.open_period
                            ? t('accounting.dashboard.period_range', {
                                  start: formatDate(stats.open_period.starts_on),
                                  end: formatDate(stats.open_period.ends_on),
                              })
                            : t('accounting.dashboard.period_missing')
                    }
                    tone={stats.open_period ? 'violet' : 'rose'}
                    icon={<IconCalendar />}
                    href={can.period ? prefixedRoute('accounting.periods.index') : undefined}
                />
            </div>

            {/* Main Content Grid */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                {/* Left Column: Readiness Checklist */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">📋 {t('accounting.readiness.title')}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{t('accounting.readiness.help')}</p>
                        </div>
                        <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                allClear
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                                    : readiness.ready
                                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50'
                            }`}
                        >
                            {statusBanner.title}
                        </span>
                    </div>

                    <ul className="space-y-3">
                        {checks.map((check) => {
                            const action = !check.ok ? checkAction(check.key) : null;
                            const isBlocking = readiness.blocking.some((item) => item.key === check.key);

                            return (
                                <li
                                    key={check.key}
                                    className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                                        check.ok
                                            ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                                            : isBlocking
                                              ? 'border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20'
                                              : 'border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20'
                                    }`}
                                >
                                    <span
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                            check.ok
                                                ? 'bg-emerald-500 text-white'
                                                : isBlocking
                                                  ? 'bg-rose-500 text-white'
                                                  : 'bg-amber-500 text-white'
                                        }`}
                                    >
                                        {check.ok ? <IconCheck /> : <IconX />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{check.label}</p>
                                            {!check.ok && (
                                                <span
                                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                                        isBlocking
                                                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50'
                                                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                                                    }`}
                                                >
                                                    {isBlocking
                                                        ? t('accounting.dashboard.severity_blocking')
                                                        : t('accounting.dashboard.severity_warning')}
                                                </span>
                                            )}
                                        </div>
                                        {check.detail && <p className="mt-0.5 text-xs text-slate-400">{check.detail}</p>}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider ${
                                                check.ok ? 'text-emerald-700 dark:text-emerald-400' : isBlocking ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
                                            }`}
                                        >
                                            {check.ok ? t('accounting.readiness.ok') : t('accounting.readiness.fail')}
                                        </span>
                                        {action && (
                                            <Link
                                                href={action}
                                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {t('accounting.dashboard.fix_now')} →
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {readiness.opening_status === 'pending' && can.period && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-4">
                            <p className="flex-1 text-xs font-bold text-amber-900 dark:text-amber-200">{t('accounting.dashboard.opening_cta')}</p>
                            <Link href={prefixedRoute('accounting.opening-balances.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('accounting.opening.post')}</PrimaryButton>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right Column: Quick Actions & Draft Queue */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">⚡ {t('accounting.dashboard.quick_actions')}</h3>
                        <div className="space-y-3">
                            {can.journal && (
                                <QuickLink
                                    href={prefixedRoute('accounting.journals.create')}
                                    title={t('accounting.journals.create')}
                                    description={t('accounting.dashboard.quick_journal')}
                                />
                            )}
                            <QuickLink
                                href={prefixedRoute('accounting.reports.trial-balance')}
                                title={t('accounting.nav.trial_balance')}
                                description={t('accounting.dashboard.quick_trial_balance')}
                            />
                            <QuickLink
                                href={prefixedRoute('accounting.reports.profit-loss')}
                                title={t('accounting.nav.profit_loss')}
                                description={t('accounting.dashboard.quick_profit_loss')}
                            />
                            <QuickLink
                                href={prefixedRoute('accounting.bank-accounts.index')}
                                title={t('accounting.nav.bank')}
                                description={t('accounting.dashboard.quick_bank')}
                            />
                            {can.manage_coa && (
                                <QuickLink
                                    href={prefixedRoute('accounting.accounts.index')}
                                    title={t('accounting.nav.accounts')}
                                    description={t('accounting.dashboard.quick_coa')}
                                />
                            )}
                        </div>
                    </div>

                    {stats.draft_journals > 0 && (
                        <div className="rounded-3xl border border-amber-200/60 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-950/40 p-6 shadow-sm">
                            <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                                📝 {t('accounting.dashboard.draft_queue', { count: stats.draft_journals })}
                            </p>
                            <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-300/80">{t('accounting.dashboard.draft_queue_hint')}</p>
                            <div className="mt-4">
                                <Link href={prefixedRoute('accounting.journals.index')}>
                                    <SecondaryButton className="!rounded-xl text-xs">{t('accounting.dashboard.review_drafts')}</SecondaryButton>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AccountingShell>
    );
}

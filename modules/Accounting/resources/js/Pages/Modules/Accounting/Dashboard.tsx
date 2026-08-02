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
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        accent: 'bg-sky-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        accent: 'bg-amber-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        accent: 'bg-violet-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        accent: 'bg-rose-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        accent: 'bg-slate-500',
    },
};

function IconLedger(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"
            />
        </svg>
    );
}

function IconDraft(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
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
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
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
        <>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 truncate text-2xl font-bold tabular-nums ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
                    {icon}
                </div>
            </div>
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className={`relative block overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${styles.card}`}
            >
                {body}
            </Link>
        );
    }

    return <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${styles.card}`}>{body}</div>;
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
            className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md"
        >
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{title}</p>
                <p className="mt-1 text-xs text-gray-500">{description}</p>
            </div>
            <span className="mt-0.5 text-gray-300 transition group-hover:text-indigo-500">
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
              wrap: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900',
              title: t('accounting.readiness.status_ready'),
              body: t('accounting.dashboard.ready_hint'),
          }
        : readiness.ready
          ? {
                wrap: 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950',
                title: t('accounting.readiness.status_warnings'),
                body: t('accounting.dashboard.warnings_hint', { count: failedWarnings }),
            }
          : {
                wrap: 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-950',
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
                        <PrimaryButton>{t('accounting.journals.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <p className="mb-6 text-sm text-gray-600">{t('accounting.dashboard.subtitle')}</p>

            <div className={`mb-6 rounded-xl border px-4 py-3 ${statusBanner.wrap}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">{statusBanner.title}</p>
                        <p className="mt-0.5 text-sm opacity-90">{statusBanner.body}</p>
                    </div>
                    <div className="text-right text-xs font-medium opacity-80">
                        <p>
                            {t('accounting.dashboard.readiness_progress', {
                                passed,
                                total: checks.length,
                            })}
                        </p>
                        <p className="mt-0.5 tabular-nums">{progress}%</p>
                    </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            allClear ? 'bg-emerald-500' : readiness.ready ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

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

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('accounting.readiness.title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('accounting.readiness.help')}</p>
                        </div>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                allClear
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : readiness.ready
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                            }`}
                        >
                            {statusBanner.title}
                        </span>
                    </div>

                    <ul className="mt-5 space-y-2">
                        {checks.map((check) => {
                            const action = !check.ok ? checkAction(check.key) : null;
                            const isBlocking = readiness.blocking.some((item) => item.key === check.key);

                            return (
                                <li
                                    key={check.key}
                                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                                        check.ok
                                            ? 'border-emerald-100 bg-emerald-50/40'
                                            : isBlocking
                                              ? 'border-rose-100 bg-rose-50/50'
                                              : 'border-amber-100 bg-amber-50/50'
                                    }`}
                                >
                                    <span
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
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
                                            <p className="text-sm font-medium text-gray-900">{check.label}</p>
                                            {!check.ok && (
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                        isBlocking
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {isBlocking
                                                        ? t('accounting.dashboard.severity_blocking')
                                                        : t('accounting.dashboard.severity_warning')}
                                                </span>
                                            )}
                                        </div>
                                        {check.detail && <p className="mt-0.5 text-xs text-gray-600">{check.detail}</p>}
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <span
                                            className={`text-xs font-semibold uppercase ${
                                                check.ok ? 'text-emerald-700' : isBlocking ? 'text-rose-700' : 'text-amber-700'
                                            }`}
                                        >
                                            {check.ok ? t('accounting.readiness.ok') : t('accounting.readiness.fail')}
                                        </span>
                                        {action && (
                                            <Link
                                                href={action}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                            >
                                                {t('accounting.dashboard.fix_now')}
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {readiness.opening_status === 'pending' && can.period && (
                        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
                            <p className="flex-1 text-sm text-amber-900">{t('accounting.dashboard.opening_cta')}</p>
                            <Link href={prefixedRoute('accounting.opening-balances.create')}>
                                <PrimaryButton>{t('accounting.opening.post')}</PrimaryButton>
                            </Link>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('accounting.dashboard.quick_actions')}</h3>
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
                        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                            <p className="text-sm font-semibold text-amber-950">
                                {t('accounting.dashboard.draft_queue', { count: stats.draft_journals })}
                            </p>
                            <p className="mt-1 text-xs text-amber-900/80">{t('accounting.dashboard.draft_queue_hint')}</p>
                            <div className="mt-3">
                                <Link href={prefixedRoute('accounting.journals.index')}>
                                    <SecondaryButton>{t('accounting.dashboard.review_drafts')}</SecondaryButton>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AccountingShell>
    );
}

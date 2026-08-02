import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { formatDateTime } from '@/utils/date';
import { Head, Link } from '@inertiajs/react';
import TransportationNav from '../../../../TransportationNav';

interface Board {
    summary: {
        open_pipeline: number;
        scheduled: number;
        in_progress: number;
        scheduled_today: number;
        completed_this_month: number;
        distance_this_month: number;
    };
    dispatch: {
        overdue_count: number;
        pending_stops: number;
    };
    schedules: {
        active: number;
        total: number;
    };
    by_status: {
        scheduled: number;
        in_progress: number;
        completed: number;
        cancelled: number;
    };
    alerts: {
        attention: number;
    };
    recent: Array<{
        id: number;
        code: string;
        status: string;
        origin: string;
        destination: string;
        scheduled_at: string | null;
        distance_km: number | null;
        is_overdue: boolean;
        vehicle: { id: number; name: string; plate_number: string } | null;
        driver: { id: number; name: string } | null;
        partner: { id: number; code: string; name: string } | null;
    }>;
}

interface Props {
    board: Board;
    can: { create: boolean };
}

type StatTone = 'emerald' | 'sky' | 'violet' | 'amber' | 'slate' | 'rose';

const STAT_TONES: Record<
    StatTone,
    { card: string; icon: string; value: string; bar: string; track: string; accent: string }
> = {
    emerald: {
        card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-900',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-900',
        bar: 'bg-sky-500',
        track: 'bg-sky-100',
        accent: 'bg-sky-500',
    },
    violet: {
        card: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-indigo-50',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-900',
        bar: 'bg-violet-500',
        track: 'bg-violet-100',
        accent: 'bg-violet-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        bar: 'bg-amber-500',
        track: 'bg-amber-100',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        bar: 'bg-slate-500',
        track: 'bg-slate-200',
        accent: 'bg-slate-500',
    },
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        bar: 'bg-rose-500',
        track: 'bg-rose-100',
        accent: 'bg-rose-500',
    },
};

const STATUS_KEYS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

function IconTruck(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
        </svg>
    );
}

function IconAlert(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
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
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'scheduled':
            return 'bg-sky-100 text-sky-800';
        case 'in_progress':
            return 'bg-amber-100 text-amber-800';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        default:
            return 'bg-rose-100 text-rose-800';
    }
}

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    href,
    meta,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    href?: string;
    meta?: Array<{ label: string; value: number | string }>;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const body = (
        <>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-2xl font-bold tabular-nums sm:text-3xl ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>{icon}</div>
            </div>
            {meta && meta.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {meta.map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-gray-600 ring-1 ring-black/5"
                        >
                            <span className="tabular-nums text-gray-900">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </>
    );

    const className = `relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card} ${
        href ? 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500' : ''
    }`;

    if (href) {
        return (
            <Link href={href} className={className}>
                {body}
            </Link>
        );
    }

    return <div className={className}>{body}</div>;
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }): JSX.Element {
    return (
        <Link
            href={href}
            className="group rounded-lg border border-gray-200 bg-white px-3 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
        >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{title}</p>
            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </Link>
    );
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const locale = useLocaleTag();
    const { summary, dispatch, schedules, by_status, alerts, recent } = board;
    const statusTotal = STATUS_KEYS.reduce((sum, key) => sum + by_status[key], 0);
    const distanceLabel = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(summary.distance_this_month);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('transportation.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('transportation.trips.create')}>
                                <PrimaryButton>{t('transportation.actions.dispatch')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('transportation.dashboard.title')} />

            <TransportationNav />

            <p className="mb-6 text-sm text-gray-600">{t('transportation.dashboard.subtitle')}</p>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('transportation.dashboard.open_pipeline')}
                    value={summary.open_pipeline}
                    hint={t('transportation.dashboard.open_pipeline_hint', { count: summary.open_pipeline })}
                    tone="sky"
                    icon={<IconTruck />}
                    href={prefixedRoute('transportation.trips.index')}
                />
                <StatCard
                    label={t('transportation.dashboard.in_progress')}
                    value={summary.in_progress}
                    hint={t('transportation.dashboard.in_progress_hint', { pending: dispatch.pending_stops })}
                    tone={summary.in_progress > 0 ? 'violet' : 'slate'}
                    icon={<IconTruck />}
                    href={prefixedRoute('transportation.trips.index', { status: 'in_progress' })}
                />
                <StatCard
                    label={t('transportation.dashboard.scheduled_today')}
                    value={summary.scheduled_today}
                    hint={t('transportation.dashboard.scheduled_today_hint')}
                    tone="amber"
                    icon={<IconCalendar />}
                    href={prefixedRoute('transportation.calendar.index')}
                />
                <StatCard
                    label={t('transportation.dashboard.needs_attention')}
                    value={alerts.attention}
                    hint={t('transportation.dashboard.needs_attention_hint')}
                    tone={alerts.attention > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                    meta={[
                        { label: t('transportation.dashboard.overdue_short'), value: dispatch.overdue_count },
                        { label: t('transportation.dashboard.in_progress_short'), value: summary.in_progress },
                    ]}
                />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                        {t('transportation.dashboard.overdue')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-rose-900">{dispatch.overdue_count}</p>
                    <p className="mt-1 text-xs text-rose-700/80">{t('transportation.dashboard.overdue_hint')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        {t('transportation.dashboard.pending_stops')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{dispatch.pending_stops}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('transportation.dashboard.pending_stops_hint')}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {t('transportation.dashboard.schedules_card')}
                        </p>
                        <Link
                            href={prefixedRoute('transportation.schedules.index')}
                            className="text-[11px] font-medium text-indigo-600 hover:underline"
                        >
                            {t('transportation.dashboard.manage_schedules')}
                        </Link>
                    </div>
                    <p className="mt-2 text-xl font-bold tabular-nums text-gray-900">{schedules.active}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('transportation.dashboard.schedules_help')}</p>
                    <p className="mt-2 text-[11px] font-medium text-gray-600">
                        {t('transportation.dashboard.of_schedules', { total: schedules.total })}
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        {t('transportation.dashboard.completed_month')}
                    </p>
                    <p className="mt-2 text-xl font-bold tabular-nums text-emerald-900">{summary.completed_this_month}</p>
                    <p className="mt-1 text-xs text-emerald-800/80">
                        {t('transportation.dashboard.completed_month_hint', { distance: distanceLabel })}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-emerald-700">
                        <IconCheck />
                        <span className="text-[11px] font-medium">{distanceLabel} km</span>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t('transportation.dashboard.by_status')}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t('transportation.dashboard.by_status_help')}</p>
                    </div>
                    <div className="space-y-3">
                        {STATUS_KEYS.map((key) => (
                            <div key={key}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-800">{t(`transportation.status.${key}`)}</span>
                                    <span className="tabular-nums">{by_status[key]}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-indigo-100">
                                    <div
                                        className="h-full rounded-full bg-indigo-500"
                                        style={{
                                            width: `${Math.max(
                                                statusTotal > 0 ? (by_status[key] / statusTotal) * 100 : 0,
                                                by_status[key] > 0 ? 8 : 0,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('transportation.dashboard.recent')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('transportation.dashboard.recent_help')}</p>
                        </div>
                        <Link
                            href={prefixedRoute('transportation.trips.index')}
                            className="text-sm font-medium text-indigo-600 hover:underline"
                        >
                            {t('transportation.dashboard.view_trips')}
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('transportation.dashboard.col_trip')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('transportation.dashboard.col_route')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('transportation.dashboard.col_vehicle')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('transportation.dashboard.col_when')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                        {t('transportation.dashboard.col_status')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                            {t('transportation.dashboard.empty_open')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((trip) => (
                                        <tr key={trip.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('transportation.trips.show', trip.id)}
                                                    className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                                                >
                                                    {trip.code}
                                                </Link>
                                                {trip.partner && (
                                                    <p className="text-xs text-gray-500">{trip.partner.name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                <p className="truncate">{trip.origin}</p>
                                                <p className="truncate text-xs text-gray-500">→ {trip.destination}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                <p>{trip.vehicle ? `${trip.vehicle.plate_number}` : '—'}</p>
                                                <p className="text-gray-500">{trip.driver?.name ?? ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {trip.scheduled_at ? formatDateTime(trip.scheduled_at, locale) : '—'}
                                                {trip.is_overdue && (
                                                    <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                        {t('transportation.dashboard.overdue_badge')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(trip.status)}`}
                                                >
                                                    {t(`transportation.status.${trip.status}`, undefined, trip.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('transportation.dashboard.quick_actions')}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <QuickAction
                        href={prefixedRoute('transportation.trips.index')}
                        title={t('transportation.nav.trips')}
                        description={t('transportation.dashboard.quick_trips')}
                    />
                    {can.create && (
                        <QuickAction
                            href={prefixedRoute('transportation.trips.create')}
                            title={t('transportation.actions.dispatch')}
                            description={t('transportation.dashboard.quick_create')}
                        />
                    )}
                    <QuickAction
                        href={prefixedRoute('transportation.schedules.index')}
                        title={t('transportation.nav.schedules')}
                        description={t('transportation.dashboard.quick_schedules')}
                    />
                    <QuickAction
                        href={prefixedRoute('transportation.calendar.index')}
                        title={t('transportation.nav.calendar')}
                        description={t('transportation.dashboard.quick_calendar')}
                    />
                    <QuickAction
                        href={prefixedRoute('transportation.reports.index')}
                        title={t('transportation.nav.reports')}
                        description={t('transportation.dashboard.quick_reports')}
                    />
                </div>
            </div>
        </DynamicLayout>
    );
}

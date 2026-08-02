import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import DocumentNav from '../../../DocumentNav';
import { DocumentItem, formatDate, formatDaysUntil, getStatusBadge } from '../../../documentUtils';

interface Props {
    summary: {
        expired: number;
        expiring_week: number;
        expiring_month: number;
        total?: number;
        unverified?: number;
        vehicles?: number;
        drivers?: number;
    };
    documents: {
        data: (DocumentItem & {
            documentable: { id: number; name: string; plate_number?: string };
        })[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
}

type StatTone = 'rose' | 'amber' | 'orange' | 'emerald' | 'sky' | 'slate';

const STAT_TONES: Record<StatTone, { card: string; icon: string; value: string; accent: string }> = {
    rose: {
        card: 'border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-red-50',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-900',
        accent: 'bg-rose-500',
    },
    amber: {
        card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-yellow-50',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-900',
        accent: 'bg-amber-500',
    },
    orange: {
        card: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50',
        icon: 'bg-orange-500 text-white shadow-orange-500/30',
        value: 'text-orange-900',
        accent: 'bg-orange-500',
    },
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
    slate: {
        card: 'border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-gray-100',
        icon: 'bg-slate-500 text-white shadow-slate-500/30',
        value: 'text-slate-900',
        accent: 'bg-slate-500',
    },
};

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

function IconClock(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function IconShield(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
        </svg>
    );
}

function IconUpload(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
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

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
}: {
    label: string;
    value: number;
    hint: string;
    tone: StatTone;
    icon: JSX.Element;
}): JSX.Element {
    const styles = STAT_TONES[tone];

    return (
        <div className={`relative overflow-hidden rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                    <p className={`mt-2 text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
                    <p className="mt-1 text-xs text-gray-600">{hint}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-lg ${styles.icon}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }): JSX.Element {
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

export default function Index({ summary, documents }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const attention = summary.expired + summary.expiring_week;
    const allClear = documents.data.length === 0;

    return (
        <DynamicLayout header={<PageHeader title={t('document.title')} />}>
            <Head title={t('document.head')} />

            <DocumentNav />

            <p className="mb-6 text-sm text-gray-600">{t('document.dashboard.subtitle')}</p>

            <div
                className={`mb-6 rounded-xl border px-4 py-3 ${
                    allClear
                        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900'
                        : summary.expired > 0
                          ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 text-rose-950'
                          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">
                            {allClear
                                ? t('document.dashboard.banner_clear')
                                : summary.expired > 0
                                  ? t('document.dashboard.banner_critical')
                                  : t('document.dashboard.banner_watch')}
                        </p>
                        <p className="mt-0.5 text-sm opacity-90">
                            {allClear
                                ? t('document.dashboard.all_valid')
                                : t('document.dashboard.banner_hint', { count: attention })}
                        </p>
                    </div>
                    {(summary.total !== undefined || summary.unverified !== undefined) && (
                        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
                            {summary.total !== undefined && (
                                <span className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-black/5">
                                    <span className="tabular-nums">{summary.total}</span> {t('document.dashboard.total_short')}
                                </span>
                            )}
                            {summary.unverified !== undefined && summary.unverified > 0 && (
                                <span className="rounded-md bg-white/70 px-2 py-1 ring-1 ring-black/5">
                                    <span className="tabular-nums">{summary.unverified}</span> {t('document.dashboard.unverified_short')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('document.dashboard.expired')}
                    value={summary.expired}
                    hint={t('document.dashboard.expired_hint')}
                    tone={summary.expired > 0 ? 'rose' : 'slate'}
                    icon={<IconAlert />}
                />
                <StatCard
                    label={t('document.dashboard.expiring_week')}
                    value={summary.expiring_week}
                    hint={t('document.dashboard.expiring_week_hint')}
                    tone={summary.expiring_week > 0 ? 'amber' : 'slate'}
                    icon={<IconClock />}
                />
                <StatCard
                    label={t('document.dashboard.expiring_month')}
                    value={summary.expiring_month}
                    hint={t('document.dashboard.expiring_month_hint')}
                    tone={summary.expiring_month > 0 ? 'orange' : 'slate'}
                    icon={<IconCalendar />}
                />
                <StatCard
                    label={t('document.dashboard.compliance')}
                    value={Math.max(0, (summary.total ?? 0) - summary.expired - summary.expiring_month)}
                    hint={t('document.dashboard.compliance_hint')}
                    tone={allClear ? 'emerald' : 'sky'}
                    icon={<IconShield />}
                />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{t('document.dashboard.problem_title')}</h3>
                            <p className="mt-0.5 text-xs text-gray-500">{t('document.dashboard.problem_help')}</p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-gray-700">
                            {t('document.dashboard.total', { count: documents.total })}
                        </span>
                    </div>

                    {documents.data.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <IconShield />
                            </div>
                            <p className="text-sm font-medium text-gray-800">{t('document.dashboard.all_valid')}</p>
                            <p className="mt-1 text-xs text-gray-500">{t('document.dashboard.all_valid_hint')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('document.dashboard.columns.entity')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('document.dashboard.columns.type')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('document.dashboard.columns.number')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('document.dashboard.columns.expires')}
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            {t('document.dashboard.columns.status')}
                                        </th>
                                        <th className="relative px-5 py-3">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {documents.data.map((doc) => {
                                        const badge = getStatusBadge(doc.status, t);
                                        const entityRoute =
                                            doc.documentable_type === 'vehicle'
                                                ? prefixedRoute('fleet.vehicles.documents.index', doc.documentable_id)
                                                : prefixedRoute('fleet.drivers.documents.index', doc.documentable_id);
                                        const entityLabel =
                                            doc.documentable_type === 'vehicle'
                                                ? `${doc.documentable.name} (${doc.documentable.plate_number ?? ''})`
                                                : doc.documentable.name;

                                        return (
                                            <tr key={doc.id} className="hover:bg-gray-50/80">
                                                <td className="px-5 py-3">
                                                    <Link
                                                        href={entityRoute}
                                                        className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        {entityLabel}
                                                    </Link>
                                                    <div className="mt-0.5">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                                doc.documentable_type === 'vehicle'
                                                                    ? 'bg-sky-100 text-sky-800'
                                                                    : 'bg-violet-100 text-violet-800'
                                                            }`}
                                                        >
                                                            {t(
                                                                `document.entity.${doc.documentable_type}`,
                                                                undefined,
                                                                doc.documentable_type,
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-gray-900">{doc.document_type.name}</td>
                                                <td className="px-5 py-3 font-mono text-xs text-gray-500">
                                                    {doc.document_number ?? '—'}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={
                                                            doc.status === 'expired'
                                                                ? 'font-semibold text-rose-700'
                                                                : 'text-gray-900'
                                                        }
                                                    >
                                                        {formatDate(doc.expires_at, localeTag)}
                                                    </span>
                                                    <div className="text-xs text-gray-400">
                                                        {formatDaysUntil(doc.expires_at, t)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <Link
                                                        href={entityRoute}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                                                        title={t('document.dashboard.upload_new')}
                                                    >
                                                        <IconUpload />
                                                        {t('document.dashboard.upload_new')}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {documents.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-gray-700">
                                {t('document.dashboard.total', { count: documents.total })}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {documents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={`rounded-md px-3 py-1 text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                  : 'cursor-default text-gray-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('document.dashboard.quick_actions')}</h3>
                        <div className="space-y-3">
                            <QuickLink
                                href={prefixedRoute('fleet.vehicles.index')}
                                title={t('document.nav.vehicles')}
                                description={t('document.dashboard.quick_vehicles')}
                            />
                            <QuickLink
                                href={prefixedRoute('fleet.drivers.index')}
                                title={t('document.nav.drivers')}
                                description={t('document.dashboard.quick_drivers')}
                            />
                            <QuickLink
                                href={prefixedRoute('documents.types.index')}
                                title={t('document.nav.types')}
                                description={t('document.dashboard.quick_types')}
                            />
                        </div>
                    </div>

                    {(summary.vehicles !== undefined || summary.drivers !== undefined) && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {t('document.dashboard.coverage')}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-sky-50 px-3 py-2">
                                    <p className="text-[11px] font-medium text-sky-700">{t('document.entity.vehicle')}</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-sky-900">{summary.vehicles ?? 0}</p>
                                </div>
                                <div className="rounded-lg bg-violet-50 px-3 py-2">
                                    <p className="text-[11px] font-medium text-violet-700">{t('document.entity.driver')}</p>
                                    <p className="mt-1 text-xl font-bold tabular-nums text-violet-900">{summary.drivers ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

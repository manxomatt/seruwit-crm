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
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
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
    icon,
    bgColor,
    textColor,
}: {
    label: string;
    value: number;
    hint: string;
    icon: JSX.Element;
    bgColor: string;
    textColor: string;
}): JSX.Element {
    return (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
                </div>
                <div className={`w-11 h-11 rounded-2xl ${bgColor} ${textColor} flex items-center justify-center shadow-inner shrink-0`}>
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
            className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
        >
            <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <span className="text-slate-300 dark:text-slate-600 transition group-hover:text-indigo-500 group-hover:translate-x-0.5 transform">
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

            {/* Banner Status */}
            <div
                className={`mb-6 rounded-3xl border p-5 shadow-sm ${
                    allClear
                        ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-300'
                        : summary.expired > 0
                        ? 'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-300'
                        : 'border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-300'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {allClear ? '✅' : summary.expired > 0 ? '🚨' : '⏳'}
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider">
                                {allClear
                                    ? t('document.dashboard.banner_clear')
                                    : summary.expired > 0
                                    ? t('document.dashboard.banner_critical')
                                    : t('document.dashboard.banner_watch')}
                            </p>
                            <p className="mt-0.5 text-xs opacity-90 font-medium">
                                {allClear
                                    ? t('document.dashboard.all_valid')
                                    : t('document.dashboard.banner_hint', { count: attention })}
                            </p>
                        </div>
                    </div>
                    {(summary.total !== undefined || summary.unverified !== undefined) && (
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            {summary.total !== undefined && (
                                <span className="rounded-xl bg-white/80 dark:bg-slate-900/80 px-3 py-1 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                                    <span className="tabular-nums font-mono">{summary.total}</span> {t('document.dashboard.total_short')}
                                </span>
                            )}
                            {summary.unverified !== undefined && summary.unverified > 0 && (
                                <span className="rounded-xl bg-white/80 dark:bg-slate-900/80 px-3 py-1 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                                    <span className="tabular-nums font-mono">{summary.unverified}</span> {t('document.dashboard.unverified_short')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Stat Overview Grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label={t('document.dashboard.expired')}
                    value={summary.expired}
                    hint={t('document.dashboard.expired_hint')}
                    icon={<IconAlert />}
                    bgColor={summary.expired > 0 ? 'bg-rose-50 dark:bg-rose-950/50' : 'bg-slate-50 dark:bg-slate-800'}
                    textColor={summary.expired > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}
                />
                <StatCard
                    label={t('document.dashboard.expiring_week')}
                    value={summary.expiring_week}
                    hint={t('document.dashboard.expiring_week_hint')}
                    icon={<IconClock />}
                    bgColor={summary.expiring_week > 0 ? 'bg-amber-50 dark:bg-amber-950/50' : 'bg-slate-50 dark:bg-slate-800'}
                    textColor={summary.expiring_week > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}
                />
                <StatCard
                    label={t('document.dashboard.expiring_month')}
                    value={summary.expiring_month}
                    hint={t('document.dashboard.expiring_month_hint')}
                    icon={<IconCalendar />}
                    bgColor={summary.expiring_month > 0 ? 'bg-orange-50 dark:bg-orange-950/50' : 'bg-slate-50 dark:bg-slate-800'}
                    textColor={summary.expiring_month > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}
                />
                <StatCard
                    label={t('document.dashboard.compliance')}
                    value={Math.max(0, (summary.total ?? 0) - summary.expired - summary.expiring_month)}
                    hint={t('document.dashboard.compliance_hint')}
                    icon={<IconShield />}
                    bgColor="bg-emerald-50 dark:bg-emerald-950/50"
                    textColor="text-emerald-600 dark:text-emerald-400"
                />
            </div>

            {/* Table & Quick Actions Section */}
            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                ⚠️ {t('document.dashboard.problem_title')}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{t('document.dashboard.problem_help')}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                            {t('document.dashboard.total', { count: documents.total })}
                        </span>
                    </div>

                    {documents.data.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                                <IconShield />
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{t('document.dashboard.all_valid')}</p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{t('document.dashboard.all_valid_hint')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-5 py-3">{t('document.dashboard.columns.entity')}</th>
                                        <th className="px-5 py-3">{t('document.dashboard.columns.type')}</th>
                                        <th className="px-5 py-3">{t('document.dashboard.columns.number')}</th>
                                        <th className="px-5 py-3">{t('document.dashboard.columns.expires')}</th>
                                        <th className="px-5 py-3">{t('document.dashboard.columns.status')}</th>
                                        <th className="px-5 py-3 text-right">
                                            <span className="sr-only">{t('common.actions')}</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
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
                                            <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link
                                                        href={entityRoute}
                                                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                    >
                                                        {entityLabel}
                                                    </Link>
                                                    <div className="mt-1">
                                                        <span
                                                            className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                                                doc.documentable_type === 'vehicle'
                                                                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/50'
                                                                    : 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200/60 dark:border-violet-800/50'
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
                                                <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                                                    {doc.document_type.name}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                                                    {doc.document_number ?? '—'}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono">
                                                    <span
                                                        className={
                                                            doc.status === 'expired'
                                                                ? 'font-bold text-rose-600 dark:text-rose-400'
                                                                : 'text-slate-900 dark:text-white'
                                                        }
                                                    >
                                                        {formatDate(doc.expires_at, localeTag)}
                                                    </span>
                                                    <div className="text-[11px] text-slate-400">
                                                        {formatDaysUntil(doc.expires_at, t)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.classes}`}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Link
                                                        href={entityRoute}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
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
                        <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-slate-500 font-medium">
                                {t('document.dashboard.total', { count: documents.total })}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {documents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : link.url
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions & Coverage Card */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <h3 className="mb-4 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            ⚡ {t('document.dashboard.quick_actions')}
                        </h3>
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
                        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                📊 {t('document.dashboard.coverage')}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">{t('document.entity.vehicle')}</p>
                                    <p className="mt-1 text-2xl font-black tabular-nums text-sky-900 dark:text-sky-200">{summary.vehicles ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">{t('document.entity.driver')}</p>
                                    <p className="mt-1 text-2xl font-black tabular-nums text-violet-900 dark:text-violet-200">{summary.drivers ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}


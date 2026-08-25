import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import PartnersNav from '../../../../PartnersNav';

interface RecentPartner {
    id: number;
    code: string;
    name: string;
    account_type: string;
    customer_rank: number;
    supplier_rank: number;
    status: string;
    industry: string | null;
    created_at: string | null;
}

interface IndustryRow {
    id: number;
    name: string;
    total: number;
}

interface Board {
    counts: {
        total: number;
        active: number;
        inactive: number;
        customers: number;
        suppliers: number;
        both: number;
        companies: number;
        individuals: number;
        blacklisted: number;
        missing_contact: number;
    };
    locations: { active: number; inactive: number; total: number };
    recent: RecentPartner[];
    by_industry: IndustryRow[];
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
        card: 'border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20',
        icon: 'bg-emerald-500 text-white shadow-emerald-500/30',
        value: 'text-emerald-950 dark:text-emerald-200',
        bar: 'bg-emerald-500',
        track: 'bg-emerald-100 dark:bg-emerald-950/50',
        accent: 'bg-emerald-500',
    },
    sky: {
        card: 'border-sky-200/80 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/80 via-white to-cyan-50/50 dark:from-sky-950/20 dark:via-slate-900 dark:to-cyan-950/20',
        icon: 'bg-sky-500 text-white shadow-sky-500/30',
        value: 'text-sky-950 dark:text-sky-200',
        bar: 'bg-sky-500',
        track: 'bg-sky-100 dark:bg-sky-950/50',
        accent: 'bg-sky-500',
    },
    violet: {
        card: 'border-violet-200/80 dark:border-violet-900/50 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/50 dark:from-violet-950/20 dark:via-slate-900 dark:to-indigo-950/20',
        icon: 'bg-violet-500 text-white shadow-violet-500/30',
        value: 'text-violet-950 dark:text-violet-200',
        bar: 'bg-violet-500',
        track: 'bg-violet-100 dark:bg-violet-950/50',
        accent: 'bg-violet-500',
    },
    amber: {
        card: 'border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20',
        icon: 'bg-amber-500 text-white shadow-amber-500/30',
        value: 'text-amber-950 dark:text-amber-200',
        bar: 'bg-amber-500',
        track: 'bg-amber-100 dark:bg-amber-950/50',
        accent: 'bg-amber-500',
    },
    slate: {
        card: 'border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/80 via-white to-gray-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900',
        icon: 'bg-slate-600 text-white shadow-slate-600/30',
        value: 'text-slate-900 dark:text-white',
        bar: 'bg-slate-500',
        track: 'bg-slate-200 dark:bg-slate-800',
        accent: 'bg-slate-500',
    },
    rose: {
        card: 'border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/80 via-white to-red-50/50 dark:from-rose-950/20 dark:via-slate-900 dark:to-red-950/20',
        icon: 'bg-rose-500 text-white shadow-rose-500/30',
        value: 'text-rose-950 dark:text-rose-200',
        bar: 'bg-rose-500',
        track: 'bg-rose-100 dark:bg-rose-950/50',
        accent: 'bg-rose-500',
    },
};

function sharePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}

function IconUsers(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
        </svg>
    );
}

function IconCustomer(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
        </svg>
    );
}

function IconSupplier(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.74 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
        </svg>
    );
}

function IconPin(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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

function StatCard({
    label,
    value,
    hint,
    tone,
    icon,
    progress,
    progressLabel,
    meta,
}: {
    label: string;
    value: number | string;
    hint?: string;
    tone: StatTone;
    icon: JSX.Element;
    progress?: number;
    progressLabel?: string;
    meta?: Array<{ label: string; value: number | string }>;
}): JSX.Element {
    const styles = STAT_TONES[tone];
    const clampedProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));

    return (
        <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md ${styles.card}`}>
            <span className={`absolute inset-y-0 left-0 w-1 ${styles.accent}`} aria-hidden />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                    <p className={`mt-2 text-3xl font-black tabular-nums ${styles.value}`}>{value}</p>
                    {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-md ${styles.icon}`}>
                    {icon}
                </div>
            </div>
            {clampedProgress !== undefined && (
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-400">
                        <span className="truncate">{progressLabel}</span>
                        <span className="tabular-nums">{clampedProgress}%</span>
                    </div>
                    <div className={`h-1.5 w-full overflow-hidden rounded-full ${styles.track}`}>
                        <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${clampedProgress}%` }} />
                    </div>
                </div>
            )}
            {meta && meta.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {meta.map((item) => (
                        <span
                            key={item.label}
                            className="inline-flex items-center gap-1 rounded-xl bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 ring-1 ring-slate-900/5 dark:ring-white/10 backdrop-blur-sm"
                        >
                            <span className="tabular-nums text-slate-900 dark:text-white">{item.value}</span>
                            <span>{item.label}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Index({ board, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { counts, locations, recent, by_industry } = board;
    const industryMax = Math.max(...by_industry.map((row) => row.total), 1);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('partners.title')}
                    actions={
                        can.create ? (
                            <Link href={prefixedRoute('partners.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('partners.index.new')}</PrimaryButton>
                            </Link>
                        ) : undefined
                    }
                />
            }
        >
            <Head title={t('partners.dashboard.title')} />

            <PartnersNav />

            <div className="space-y-6">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('partners.dashboard.subtitle')}</p>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard
                        label={t('partners.dashboard.active')}
                        value={counts.active}
                        hint={t('partners.dashboard.of_partners', { total: counts.total })}
                        tone="emerald"
                        icon={<IconUsers />}
                        progress={sharePercent(counts.active, counts.total)}
                        progressLabel={t('partners.dashboard.share_label')}
                    />
                    <StatCard
                        label={t('partners.dashboard.customers')}
                        value={counts.customers}
                        hint={t('partners.dashboard.both_hint', { count: counts.both })}
                        tone="sky"
                        icon={<IconCustomer />}
                        progress={sharePercent(counts.customers, counts.total)}
                        progressLabel={t('partners.dashboard.share_label')}
                    />
                    <StatCard
                        label={t('partners.dashboard.suppliers')}
                        value={counts.suppliers}
                        hint={t('partners.dashboard.suppliers_hint')}
                        tone="violet"
                        icon={<IconSupplier />}
                        progress={sharePercent(counts.suppliers, counts.total)}
                        progressLabel={t('partners.dashboard.share_label')}
                    />
                    <StatCard
                        label={t('partners.dashboard.locations')}
                        value={locations.active}
                        hint={t('partners.dashboard.of_locations', { total: locations.total })}
                        tone="amber"
                        icon={<IconPin />}
                        progress={sharePercent(locations.active, locations.total)}
                        progressLabel={t('partners.dashboard.locations_ready')}
                        meta={[{ label: t('partners.dashboard.inactive_short'), value: locations.inactive }]}
                    />
                    <StatCard
                        label={t('partners.dashboard.needs_attention')}
                        value={counts.blacklisted + counts.missing_contact + counts.inactive}
                        hint={t('partners.dashboard.needs_attention_hint')}
                        tone={counts.blacklisted > 0 ? 'rose' : counts.missing_contact > 0 ? 'amber' : 'slate'}
                        icon={<IconAlert />}
                        meta={[
                            { label: t('partners.dashboard.blacklisted'), value: counts.blacklisted },
                            { label: t('partners.dashboard.missing_contact'), value: counts.missing_contact },
                            { label: t('partners.status.inactive'), value: counts.inactive },
                        ]}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('partners.dashboard.companies')}</p>
                        <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{counts.companies}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('partners.dashboard.account_mix')}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('partners.dashboard.individuals')}</p>
                        <p className="mt-3 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{counts.individuals}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('partners.dashboard.account_mix')}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:col-span-2">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('partners.dashboard.top_industries')}</p>
                            <Link href={prefixedRoute('partners.index')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition">
                                {t('partners.dashboard.view_all')} →
                            </Link>
                        </div>
                        {by_industry.length === 0 ? (
                            <p className="text-xs text-slate-500">{t('partners.dashboard.no_industries')}</p>
                        ) : (
                            <div className="space-y-3">
                                {by_industry.map((row) => (
                                    <div key={row.id}>
                                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                            <span className="truncate">{row.name}</span>
                                            <span className="tabular-nums font-bold text-slate-900 dark:text-white">{row.total}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-indigo-500"
                                                style={{ width: `${Math.max(8, (row.total / industryMax) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('partners.dashboard.recent')}</h3>
                        <Link href={prefixedRoute('partners.index')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition">
                            {t('partners.dashboard.view_all')} →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.index.columns.code')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.index.columns.name')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.index.columns.role')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.index.columns.industry')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.index.columns.status')}</th>
                                    <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('partners.dashboard.added')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-white">
                                {recent.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-500">
                                            {t('partners.index.empty_title')}
                                        </td>
                                    </tr>
                                ) : (
                                    recent.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{partner.code}</td>
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={prefixedRoute('partners.show', partner.id)}
                                                    className="font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition"
                                                >
                                                    {partner.name}
                                                </Link>
                                                <div className="text-[10px] font-semibold text-slate-400">
                                                    {t(`partners.account_type.${partner.account_type}`, undefined, partner.account_type)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {partner.customer_rank > 0 && (
                                                        <span className="rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-0.5 text-[10px] font-bold">
                                                            {t('partners.role.customer')}
                                                        </span>
                                                    )}
                                                    {partner.supplier_rank > 0 && (
                                                        <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 text-[10px] font-bold">
                                                            {t('partners.role.supplier')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{partner.industry ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        partner.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    {t(`partners.status.${partner.status}`, undefined, partner.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 tabular-nums text-slate-500">
                                                {partner.created_at
                                                    ? new Date(partner.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

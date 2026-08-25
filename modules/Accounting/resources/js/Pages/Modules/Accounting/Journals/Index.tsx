import AccountingShell from '../AccountingShell';
import { EyeIcon, PencilIcon } from '../icons';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';

interface Journal {
    id: number;
    number: string;
    entry_date: string;
    type: string;
    status: string;
    memo: string | null;
    period: { id: number; name: string } | null;
}

interface Paginated {
    data: Journal[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    journals: Paginated;
    filters: { status: string | null; period_id: number | null };
    periods: Array<{ id: number; name: string }>;
    can: { journal: boolean; post: boolean };
}

function JournalStatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isPosted = status === 'posted';
    const isDraft = status === 'draft';

    const style = isPosted
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : isDraft
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPosted ? 'bg-emerald-500' : isDraft ? 'bg-amber-500' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`accounting.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Index({ journals, filters, periods, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <AccountingShell
            active="journals"
            title={t('accounting.journals.title')}
            headerActions={
                can.journal ? (
                    <Link href={prefixedRoute('accounting.journals.create')}>
                        <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('accounting.journals.create')}</PrimaryButton>
                    </Link>
                ) : undefined
            }
        >
            <Head title={t('accounting.journals.title')} />

            {/* Filter Bar */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <Select
                        className="w-44"
                        value={filters.status ?? ''}
                        onChange={(value) =>
                            router.get(
                                prefixedRoute('accounting.journals.index'),
                                { status: value || undefined, period_id: filters.period_id || undefined },
                                { preserveState: true },
                            )
                        }
                        placeholder={t('accounting.journals.all_statuses')}
                        options={[
                            { value: '', label: t('accounting.journals.all_statuses') },
                            { value: 'draft', label: t('accounting.status.draft') },
                            { value: 'posted', label: t('accounting.status.posted') },
                            { value: 'void', label: t('accounting.status.void') },
                        ]}
                    />
                    <Select
                        className="w-56"
                        searchable
                        value={filters.period_id ? String(filters.period_id) : ''}
                        onChange={(value) =>
                            router.get(
                                prefixedRoute('accounting.journals.index'),
                                { status: filters.status || undefined, period_id: value || undefined },
                                { preserveState: true },
                            )
                        }
                        placeholder={t('accounting.journals.all_periods')}
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.no_options')}
                        noResultsText={t('common.no_results')}
                        options={[
                            { value: '', label: t('accounting.journals.all_periods') },
                            ...periods.map((period) => ({
                                value: String(period.id),
                                label: period.name,
                            })),
                        ]}
                    />
                </div>
            </div>

            {/* Main Table Container */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.journals.number')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.journals.date')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.journals.period')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.journals.status')}</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('accounting.journals.memo')}</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                            {journals.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                                            📑
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">{t('accounting.journals.empty')}</p>
                                    </td>
                                </tr>
                            )}
                            {journals.data.map((journal) => (
                                <tr key={journal.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">{journal.number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">{journal.entry_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{journal.period?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <JournalStatusBadge status={journal.status} />
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">{journal.memo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={prefixedRoute('accounting.journals.show', journal.id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                                title={t('common.view')}
                                            >
                                                <EyeIcon />
                                            </Link>
                                            {journal.status === 'draft' && can.journal && (
                                                <Link
                                                    href={prefixedRoute('accounting.journals.edit', journal.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                                    title={t('common.edit')}
                                                >
                                                    <PencilIcon />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AccountingShell>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';
import InvoicingNav from '../../../../InvoicingNav';
import { formatMoney } from '@/utils/money';
import PageHeader from '@/Components/PageHeader';

interface Invoice {
    id: number;
    code: string;
    status: string;
    issue_date: string;
    due_date: string | null;
    total: string;
    partner: { id: number; code: string; name: string };
}

interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    invoices: PaginatedInvoices;
    summary: { outstanding: number; paid_this_month: number; draft_count: number };
    filters: { search: string | null; status: string | null };
    can: { create: boolean; update: boolean; delete: boolean };
}

const STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'void'];

function StatusBadge({ status }: { status: string }) {
    const { t } = useTrans();
    const isPaid = status === 'paid';
    const isIssued = status === 'issued';
    const isPartial = status === 'partially_paid';
    const isDraft = status === 'draft';

    const style = isPaid
        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
        : isIssued
        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50'
        : isPartial
        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
        : isDraft
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50';

    const dot = isPaid ? 'bg-emerald-500' : isIssued ? 'bg-sky-500' : isPartial ? 'bg-amber-500' : isDraft ? 'bg-slate-400' : 'bg-rose-500';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {t(`invoicing.status.${status}`, undefined, status)}
        </span>
    );
}

export default function Index({ invoices, summary, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('invoicing.invoices.index'), {
            search: search || undefined,
            status: filters.status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        router.get(prefixedRoute('invoicing.invoices.index'), {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('invoicing.title')}
                    actions={can.create && (
                        <Link href={prefixedRoute('invoicing.invoices.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">{t('invoicing.index.new')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('invoicing.index.head')} />

            <InvoicingNav />

            {/* Overview Stat Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">💵 {t('invoicing.index.outstanding')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{formatMoney(summary.outstanding)}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('invoicing.index.outstanding_hint')}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">✅ {t('invoicing.index.paid_month')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(summary.paid_this_month)}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('invoicing.index.paid_month_hint')}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">📝 {t('invoicing.index.draft')}</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{summary.draft_count}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('invoicing.index.draft_hint')}</p>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="mb-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                        <TextInput
                            type="text"
                            placeholder={t('invoicing.index.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full !rounded-2xl text-xs bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                    <Select
                        className="w-44"
                        value={filters.status || ''}
                        onChange={handleStatusFilter}
                        placeholder={t('invoicing.status.all')}
                        options={[
                            { value: '', label: t('invoicing.status.all') },
                            ...STATUSES.map((status) => ({
                                value: status,
                                label: t(`invoicing.status.${status}`, undefined, status),
                            })),
                        ]}
                    />
                    <PrimaryButton type="submit" className="!rounded-xl text-xs shadow-sm">{t('common.search')}</PrimaryButton>
                </form>
            </div>

            {/* Main Invoices Table */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {invoices.data.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-2xl mb-2">
                            🧾
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t('invoicing.index.empty_title')}</h3>
                        <p className="mt-1 text-xs text-slate-400">{t('invoicing.index.empty_hint')}</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.code')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.partner')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.issue_date')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.due_date')}</th>
                                        <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.total')}</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">{t('invoicing.index.columns.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.id}
                                            className="group cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition"
                                            onClick={() => router.get(prefixedRoute('invoicing.invoices.show', invoice.id))}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">{invoice.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">{invoice.partner.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">{invoice.issue_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">{invoice.due_date || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(invoice.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={invoice.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invoices.last_page > 1 && (
                            <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/60 px-6 py-4">
                                <p className="text-xs font-bold text-slate-400">
                                    {t('common.showing_results', {
                                        from: (invoices.current_page - 1) * invoices.per_page + 1,
                                        to: Math.min(invoices.current_page * invoices.per_page, invoices.total),
                                        total: invoices.total,
                                    })}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {invoices.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-xl px-1 text-xs font-bold transition ${
                                                link.active
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                                    : link.url
                                                      ? 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                      : 'cursor-not-allowed text-slate-300 dark:text-slate-700'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DynamicLayout>
    );
}

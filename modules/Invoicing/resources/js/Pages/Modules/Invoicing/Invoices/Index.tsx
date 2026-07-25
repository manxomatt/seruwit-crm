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

const getStatusBadgeColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-800';
        case 'issued':
            return 'bg-blue-100 text-blue-800';
        case 'partially_paid':
            return 'bg-amber-100 text-amber-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-red-100 text-red-800';
    }
};

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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('invoicing.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('invoicing.invoices.create')}>
                            <PrimaryButton>{t('invoicing.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('invoicing.index.head')} />

            <InvoicingNav />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">{t('invoicing.index.outstanding')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(summary.outstanding)}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('invoicing.index.outstanding_hint')}</p>
                </div>
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">{t('invoicing.index.paid_month')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(summary.paid_this_month)}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('invoicing.index.paid_month_hint')}</p>
                </div>
                <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
                    <p className="text-sm font-medium text-gray-500">{t('invoicing.index.draft')}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.draft_count}</p>
                    <p className="mt-1 text-xs text-gray-500">{t('invoicing.index.draft_hint')}</p>
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder={t('invoicing.index.search_placeholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
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
                        <PrimaryButton type="submit">{t('common.search')}</PrimaryButton>
                    </form>

                    {invoices.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">{t('invoicing.index.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">{t('invoicing.index.empty_hint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.code')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.partner')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.issue_date')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.due_date')}</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.total')}</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('invoicing.index.columns.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoices.data.map((invoice) => (
                                            <tr
                                                key={invoice.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => router.get(prefixedRoute('invoicing.invoices.show', invoice.id))}
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-indigo-600">{invoice.code}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{invoice.partner.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{invoice.issue_date}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{invoice.due_date || '—'}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{formatMoney(invoice.total)}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                                                        {t(`invoicing.status.${invoice.status}`, undefined, invoice.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {invoices.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        {t('common.showing_results', {
                                            from: (invoices.current_page - 1) * invoices.per_page + 1,
                                            to: Math.min(invoices.current_page * invoices.per_page, invoices.total),
                                            total: invoices.total,
                                        })}
                                    </p>
                                    <div className="flex gap-1">
                                        {invoices.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
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
            </div>
        </DynamicLayout>
    );
}

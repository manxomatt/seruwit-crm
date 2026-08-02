import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';
import CanvassingNav from '../../../../CanvassingNav';
import PageHeader from '@/Components/PageHeader';

interface Visit {
    id: number;
    salesperson: { id: number; name: string };
    partner: { name: string };
    checked_in_at: string;
    checked_out_at: string | null;
    outcome: string;
}

interface PaginatedVisits {
    data: Visit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface SalespersonOption {
    id: number;
    name: string;
}

interface Props {
    visits: PaginatedVisits;
    filters: { salesperson_id?: string; outcome?: string; date?: string };
    salespeople?: SalespersonOption[];
}

const OUTCOMES = ['pending', 'contacted', 'interested', 'not_interested', 'no_contact', 'callback'] as const;

const outcomeColor = (o: string): string =>
    ({
        pending: 'bg-yellow-100 text-yellow-700',
        contacted: 'bg-blue-100 text-blue-700',
        interested: 'bg-green-100 text-green-700',
        not_interested: 'bg-red-100 text-red-700',
        no_contact: 'bg-gray-100 text-gray-500',
        callback: 'bg-purple-100 text-purple-700',
    })[o] ?? 'bg-gray-100 text-gray-500';

const EyeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

export default function VisitsIndex({ visits, filters, salespeople = [] }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const salespersonOptions = useMemo(
        () => salespeople.map((sp) => ({ value: String(sp.id), label: sp.name })),
        [salespeople],
    );

    const applyFilters = (patch: { salesperson_id?: string; outcome?: string; date?: string }): void => {
        router.get(
            prefixedRoute('canvassing.visits.index'),
            {
                salesperson_id:
                    patch.salesperson_id !== undefined
                        ? patch.salesperson_id || undefined
                        : filters.salesperson_id || undefined,
                outcome: patch.outcome !== undefined ? patch.outcome || undefined : filters.outcome || undefined,
                date: patch.date !== undefined ? patch.date || undefined : filters.date || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('canvassing.visits.title')} />}
        >
            <Head title={t('canvassing.visits.head')} />

            <CanvassingNav />

            <div className="mb-6 flex flex-wrap gap-3">
                {salespeople.length > 0 && (
                    <Select
                        className="min-w-[12rem]"
                        value={filters.salesperson_id ?? ''}
                        onChange={(value) => applyFilters({ salesperson_id: value })}
                        placeholder={t('canvassing.plans.all_salespeople')}
                        options={[{ value: '', label: t('canvassing.plans.all_salespeople') }, ...salespersonOptions]}
                    />
                )}
                <input
                    type="date"
                    value={filters.date ?? ''}
                    onChange={(e) => applyFilters({ date: e.target.value })}
                    className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Select
                    className="min-w-[12rem]"
                    value={filters.outcome ?? ''}
                    onChange={(value) => applyFilters({ outcome: value })}
                    placeholder={t('canvassing.visits.all_outcomes')}
                    searchable={false}
                    options={[
                        { value: '', label: t('canvassing.visits.all_outcomes') },
                        ...OUTCOMES.map((o) => ({
                            value: o,
                            label: t(`canvassing.outcomes.${o}`, undefined, o),
                        })),
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.visits.columns.partner')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.visits.columns.salesperson')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.visits.columns.check_in')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.visits.columns.duration')}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                                {t('canvassing.visits.columns.outcome')}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {visits.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    {t('canvassing.visits.empty')}
                                </td>
                            </tr>
                        ) : (
                            visits.data.map((v) => {
                                const duration = v.checked_out_at ? (
                                    t('canvassing.visits.duration_min', {
                                        count: Math.round(
                                            (new Date(v.checked_out_at).getTime() - new Date(v.checked_in_at).getTime()) /
                                                60000,
                                        ),
                                    })
                                ) : (
                                    <span className="text-orange-500">{t('canvassing.status.open')}</span>
                                );

                                return (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{v.partner.name}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <Link
                                                href={prefixedRoute('canvassing.salespeople.show', v.salesperson.id)}
                                                className="hover:underline"
                                            >
                                                {v.salesperson.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 tabular-nums text-gray-600">
                                            {new Date(v.checked_in_at).toLocaleString(localeTag)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{duration}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${outcomeColor(v.outcome)}`}
                                            >
                                                {t(`canvassing.outcomes.${v.outcome}`, undefined, v.outcome)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={prefixedRoute('canvassing.visits.show', v.id)}
                                                className="inline-flex text-gray-600 hover:text-gray-900"
                                                title={t('canvassing.visits.view')}
                                            >
                                                <EyeIcon />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {visits.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (visits.current_page - 1) * visits.per_page + 1,
                                to: Math.min(visits.current_page * visits.per_page, visits.total),
                                total: visits.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {visits.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
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
            </div>
        </DynamicLayout>
    );
}

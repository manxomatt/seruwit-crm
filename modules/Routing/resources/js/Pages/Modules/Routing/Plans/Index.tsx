import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';

interface PlanRow {
    id: number;
    code: string;
    status: string;
    objective: string;
    planned_date: string;
    total_distance_km: string | number;
    total_cost: string | number;
    unassigned_count: number;
    creator: { id: number; name: string } | null;
}

interface PaginatedPlans {
    data: PlanRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    plans: PaginatedPlans;
    filters: { status?: string | null };
    can: { create: boolean };
}

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

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'draft':
            return 'bg-amber-100 text-amber-800';
        case 'optimized':
            return 'bg-sky-100 text-sky-800';
        case 'applied':
            return 'bg-emerald-100 text-emerald-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ plans, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const applyStatus = (status: string): void => {
        router.get(
            prefixedRoute('routing.plans.index'),
            { status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    const formatMoney = (value: string | number): string => 'Rp ' + Number(value).toLocaleString('id-ID');

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('routing.pages.index.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('routing.plans.create')}>
                            <PrimaryButton>{t('routing.actions.new_plan')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('routing.pages.index.head')} />

            <p className="mb-6 text-sm text-gray-600">{t('routing.pages.index.intro')}</p>

            <div className="mb-6">
                <Select
                    className="min-w-[12rem]"
                    value={filters.status || ''}
                    onChange={applyStatus}
                    placeholder={t('routing.status.all')}
                    options={[
                        { value: '', label: t('routing.status.all') },
                        { value: 'draft', label: t('routing.status.draft') },
                        { value: 'optimized', label: t('routing.status.optimized') },
                        { value: 'applied', label: t('routing.status.applied') },
                        { value: 'cancelled', label: t('routing.status.cancelled') },
                    ]}
                    searchable={false}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.date')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.objective')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.distance')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('routing.fields.cost')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.status')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {plans.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    {t('routing.pages.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            plans.data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={prefixedRoute('routing.plans.show', row.id)}
                                            className="font-medium text-indigo-600 hover:underline"
                                        >
                                            {row.code}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDateDmY(row.planned_date)}</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {t(`routing.objective.${row.objective}`, undefined, row.objective)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">{Number(row.total_distance_km).toLocaleString('id-ID')} km</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{formatMoney(row.total_cost)}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                        >
                                            {t(`routing.status.${row.status}`, undefined, row.status)}
                                        </span>
                                        {row.unassigned_count > 0 && (
                                            <span className="ml-2 text-xs text-amber-700">
                                                {t('routing.pages.index.unassigned', { count: row.unassigned_count })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={prefixedRoute('routing.plans.show', row.id)}
                                            className="inline-flex text-gray-600 hover:text-gray-900"
                                            title={t('common.view')}
                                        >
                                            <EyeIcon />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {plans.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (plans.current_page - 1) * plans.per_page + 1,
                                to: Math.min(plans.current_page * plans.per_page, plans.total),
                                total: plans.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {plans.links.map((link, index) => (
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

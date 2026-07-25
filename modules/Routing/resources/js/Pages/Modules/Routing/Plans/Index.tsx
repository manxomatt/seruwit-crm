import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
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

interface Props {
    plans: { data: PlanRow[] };
    filters: { status?: string | null };
    can: { create: boolean };
}

const STATUS_FILTERS = ['', 'optimized', 'applied', 'cancelled', 'draft'] as const;

export default function Index({ plans, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">{t('routing.pages.index.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('routing.plans.create')}>
                            <PrimaryButton>{t('routing.actions.new_plan')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('routing.pages.index.head')} />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">{t('routing.pages.index.intro')}</p>

                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((status) => (
                            <button
                                key={status || 'all'}
                                type="button"
                                onClick={() =>
                                    router.get(prefixedRoute('routing.plans.index'), {
                                        status: status || undefined,
                                    })
                                }
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    (filters.status || '') === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {t(`routing.status.${status || 'all'}`, undefined, status || 'all')}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.code')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.date')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.objective')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.distance')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.cost')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('routing.fields.status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {plans.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
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
                                            <td className="px-4 py-3 text-gray-700">{row.planned_date}</td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {t(`routing.objective.${row.objective}`, undefined, row.objective)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">{row.total_distance_km} km</td>
                                            <td className="px-4 py-3 text-gray-700">{row.total_cost}</td>
                                            <td className="px-4 py-3">
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                                                    {t(`routing.status.${row.status}`, undefined, row.status)}
                                                </span>
                                                {row.unassigned_count > 0 && (
                                                    <span className="ml-2 text-xs text-amber-700">
                                                        {t('routing.pages.index.unassigned', { count: row.unassigned_count })}
                                                    </span>
                                                )}
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

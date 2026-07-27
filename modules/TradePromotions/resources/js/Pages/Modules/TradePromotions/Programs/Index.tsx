import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { formatDateDmY } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import PromotionsNav from '../../../../PromotionsNav';

interface ProgramRow {
    id: number;
    code: string;
    name: string;
    type: string;
    status: string;
    starts_at: string;
    ends_at: string;
    target_metric: string;
    target_amount: string | number | null;
    partners_count: number;
    realizations_count: number;
    principal: { id: number; name: string } | null;
}

interface PaginatedPrograms {
    data: ProgramRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    programs: PaginatedPrograms;
    filters: { status?: string | null; type?: string | null };
    can: { create: boolean };
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'active':
            return 'bg-emerald-100 text-emerald-800';
        case 'draft':
            return 'bg-amber-100 text-amber-800';
        case 'paused':
            return 'bg-sky-100 text-sky-800';
        case 'closed':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ programs, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const applyFilters = (patch: { status?: string; type?: string }): void => {
        router.get(
            prefixedRoute('promotions.programs.index'),
            {
                status: patch.status !== undefined ? patch.status || undefined : filters.status || undefined,
                type: patch.type !== undefined ? patch.type || undefined : filters.type || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('promotions.programs.index.title')}
                    </h2>
                    {can.create && (
                        <Link href={prefixedRoute('promotions.programs.create')}>
                            <PrimaryButton>{t('promotions.programs.index.new')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('promotions.programs.index.title')} />

            <PromotionsNav />

            <p className="mb-6 text-sm text-gray-600">{t('promotions.programs.index.subtitle')}</p>

            <div className="mb-6 flex flex-wrap gap-3">
                <Select
                    className="min-w-[12rem]"
                    value={filters.status || ''}
                    onChange={(value) => applyFilters({ status: value })}
                    placeholder={t('promotions.status.all')}
                    options={[
                        { value: '', label: t('promotions.status.all') },
                        { value: 'draft', label: t('promotions.status.draft') },
                        { value: 'active', label: t('promotions.status.active') },
                        { value: 'paused', label: t('promotions.status.paused') },
                        { value: 'closed', label: t('promotions.status.closed') },
                    ]}
                />
                <Select
                    className="min-w-[14rem]"
                    value={filters.type || ''}
                    onChange={(value) => applyFilters({ type: value })}
                    placeholder={t('promotions.placeholders.all_types')}
                    options={[
                        { value: '', label: t('promotions.placeholders.all_types') },
                        { value: 'volume_discount', label: t('promotions.types.volume_discount') },
                        { value: 'free_goods', label: t('promotions.types.free_goods') },
                        { value: 'rebate', label: t('promotions.types.rebate') },
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.name')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.type')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.period')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.target')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {programs.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    {t('promotions.programs.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            programs.data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={prefixedRoute('promotions.programs.show', row.id)}
                                            className="font-medium text-indigo-600 hover:underline"
                                        >
                                            {row.code}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{row.name}</div>
                                        {row.principal && <div className="text-xs text-gray-500">{row.principal.name}</div>}
                                    </td>
                                    <td className="px-4 py-3">{t(`promotions.types.${row.type}`, undefined, row.type)}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                                        {formatDateDmY(row.starts_at)} → {formatDateDmY(row.ends_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.target_amount ?? '—'}{' '}
                                        {t(`promotions.metrics.${row.target_metric}`, undefined, row.target_metric)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                        >
                                            {t(`promotions.status.${row.status}`, undefined, row.status)}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">
                                            {t('promotions.programs.index.realizations_abbr', {
                                                count: row.realizations_count,
                                            })}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {programs.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (programs.current_page - 1) * programs.per_page + 1,
                                to: Math.min(programs.current_page * programs.per_page, programs.total),
                                total: programs.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {programs.links.map((link, index) => (
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

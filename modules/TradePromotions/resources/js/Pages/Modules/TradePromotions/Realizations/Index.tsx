import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import Select from '@/Components/Select';
import { Head, Link, router } from '@inertiajs/react';
import PromotionsNav from '../../../../PromotionsNav';

interface Row {
    id: number;
    realized_qty: string | number;
    realized_value: string | number;
    achievement_percent: string | number;
    status: string;
    last_synced_at: string | null;
    program: { id: number; code: string; name: string; type: string } | null;
    partner: { id: number; name: string; code: string } | null;
}

interface PaginatedRealizations {
    data: Row[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    realizations: PaginatedRealizations;
    programs: { id: number; code: string; name: string }[];
    filters: { program_id?: number | null };
}

function statusBadgeClass(status: string): string {
    switch (status) {
        case 'achieved':
            return 'bg-emerald-100 text-emerald-800';
        case 'open':
            return 'bg-amber-100 text-amber-800';
        case 'closed':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

export default function Index({ realizations, programs, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">{t('promotions.realizations.index.title')}</h2>}>
            <Head title={t('promotions.realizations.index.title')} />

            <PromotionsNav />

            <div className="mb-6">
                <Select
                    className="max-w-sm"
                    value={filters.program_id ? String(filters.program_id) : ''}
                    onChange={(value) =>
                        router.get(prefixedRoute('promotions.realizations.index'), {
                            program_id: value || undefined,
                        })
                    }
                    placeholder={t('promotions.realizations.index.all_programs')}
                    options={[
                        { value: '', label: t('promotions.realizations.index.all_programs') },
                        ...programs.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` })),
                    ]}
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.program')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.distributor')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.qty')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.value')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.achievement')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('promotions.fields.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {realizations.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    {t('promotions.realizations.index.empty')}
                                </td>
                            </tr>
                        ) : (
                            realizations.data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        {row.program ? (
                                            <Link
                                                href={prefixedRoute('promotions.programs.show', row.program.id)}
                                                className="font-medium text-indigo-600 hover:underline"
                                            >
                                                {row.program.code}
                                            </Link>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{row.partner?.name}</td>
                                    <td className="px-4 py-3">{row.realized_qty}</td>
                                    <td className="px-4 py-3">Rp {Number(row.realized_value).toLocaleString()}</td>
                                    <td className="px-4 py-3 font-semibold">{row.achievement_percent}%</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
                                        >
                                            {t(`promotions.status.${row.status}`, undefined, row.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {realizations.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (realizations.current_page - 1) * realizations.per_page + 1,
                                to: Math.min(realizations.current_page * realizations.per_page, realizations.total),
                                total: realizations.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {realizations.links.map((link, index) => (
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

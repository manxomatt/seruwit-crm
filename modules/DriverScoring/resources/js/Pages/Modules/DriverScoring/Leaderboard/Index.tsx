import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';
import PageHeader from '@/Components/PageHeader';

interface Row {
    driver_id: number;
    average_score: number;
    scored_days: number;
    event_count: number;
    harsh_brake_count: number;
    speeding_count: number;
    idle_count: number;
    driver: { id: number; name: string; status: string } | null;
}

interface PaginatedLeaderboard {
    data: Row[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    leaderboard: PaginatedLeaderboard;
    filters: { from: string; to: string };
}

export default function Index({ leaderboard, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={<PageHeader title={t('scoring.pages.leaderboard.title')} />}
        >
            <Head title={t('scoring.pages.leaderboard.head')} />

            <ScoringNav />

            <p className="mb-6 text-sm text-gray-600">
                Skor perilaku berkendara dari GPS Traccar (harsh brake, speeding, idle).
            </p>

            <div className="mb-6 flex flex-wrap gap-3">
                <TextInput
                    type="date"
                    value={filters.from}
                    onChange={(e) =>
                        router.get(prefixedRoute('scoring.leaderboard'), {
                            from: e.target.value,
                            to: filters.to,
                        })
                    }
                />
                <TextInput
                    type="date"
                    value={filters.to}
                    onChange={(e) =>
                        router.get(prefixedRoute('scoring.leaderboard'), {
                            from: filters.from,
                            to: e.target.value,
                        })
                    }
                />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.fields.driver')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.fields.score')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Days</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.types.harsh_brake')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.types.speeding')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('scoring.types.idle')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {leaderboard.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                    {t('scoring.pages.leaderboard.empty_hint')}
                                </td>
                            </tr>
                        ) : (
                            leaderboard.data.map((row, index) => (
                                <tr key={row.driver_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-500">
                                        {(leaderboard.current_page - 1) * leaderboard.per_page + index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.driver ? (
                                            <Link
                                                href={prefixedRoute('scoring.drivers.show', row.driver.id)}
                                                className="font-medium text-indigo-600 hover:underline"
                                            >
                                                {row.driver.name}
                                            </Link>
                                        ) : (
                                            `#${row.driver_id}`
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-lg font-semibold text-gray-900">{row.average_score}</span>
                                        <span className="text-xs text-gray-400"> / 100</span>
                                    </td>
                                    <td className="px-4 py-3">{row.scored_days}</td>
                                    <td className="px-4 py-3">{row.harsh_brake_count}</td>
                                    <td className="px-4 py-3">{row.speeding_count}</td>
                                    <td className="px-4 py-3">{row.idle_count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {leaderboard.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (leaderboard.current_page - 1) * leaderboard.per_page + 1,
                                to: Math.min(leaderboard.current_page * leaderboard.per_page, leaderboard.total),
                                total: leaderboard.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {leaderboard.links.map((link, index) => (
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

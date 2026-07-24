import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';

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

interface Props {
    leaderboard: Row[];
    filters: { from: string; to: string };
}

export default function Index({ leaderboard, filters }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold text-gray-800">Driver Leaderboard</h2>}>
            <Head title="Driver Scoring" />
            <div className="py-6">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ScoringNav />
                    <p className="text-sm text-gray-600">
                        Skor perilaku berkendara dari GPS Traccar (harsh brake, speeding, idle).
                    </p>

                    <div className="flex flex-wrap gap-3">
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

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Driver</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Avg score</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Days</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Harsh brake</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Speeding</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Idle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {leaderboard.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                            Belum ada skor. Pastikan trip in-progress + GPS poll aktif.
                                        </td>
                                    </tr>
                                ) : (
                                    leaderboard.map((row, index) => (
                                        <tr key={row.driver_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
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
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';

interface Props {
    driver: { id: number; name: string; status: string; phone: string | null };
    scores: {
        score_date: string;
        score: number;
        harsh_brake_count: number;
        speeding_count: number;
        idle_count: number;
        event_count: number;
    }[];
    events: {
        id: number;
        type: string;
        severity: string;
        speed_kph: string | number | null;
        magnitude: string | number | null;
        points_delta: number;
        recorded_at: string;
        vehicle: { name: string; plate_number: string } | null;
    }[];
    summary: {
        average_score: number;
        event_count: number;
        harsh_brake_count: number;
        speeding_count: number;
        idle_count: number;
    };
    filters: { from: string; to: string };
}

export default function Show({ driver, scores, events, summary }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{driver.name}</h2>
                        <p className="text-sm text-gray-500">Avg {summary.average_score} · {summary.event_count} events</p>
                    </div>
                    <Link href={prefixedRoute('scoring.leaderboard')}>
                        <SecondaryButton type="button">Back</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={driver.name} />
            <div className="py-6">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <ScoringNav />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            ['Avg score', summary.average_score],
                            ['Harsh brake', summary.harsh_brake_count],
                            ['Speeding', summary.speeding_count],
                            ['Idle', summary.idle_count],
                        ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm">
                                <div className="text-xs text-gray-500">{label}</div>
                                <div className="text-lg font-semibold">{value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-4 py-3 font-medium">Daily scores</div>
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Date</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Score</th>
                                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Events</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {scores.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No scores in range.</td>
                                    </tr>
                                ) : (
                                    scores.map((s) => (
                                        <tr key={s.score_date}>
                                            <td className="px-4 py-2">{s.score_date}</td>
                                            <td className="px-4 py-2 font-semibold">{s.score}</td>
                                            <td className="px-4 py-2 text-gray-600">
                                                {s.event_count} · brake {s.harsh_brake_count} · speed {s.speeding_count} · idle {s.idle_count}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-4 py-3 font-medium">Recent events</div>
                        <ul className="divide-y divide-gray-100">
                            {events.length === 0 ? (
                                <li className="px-4 py-8 text-center text-sm text-gray-500">No events.</li>
                            ) : (
                                events.map((event) => (
                                    <li key={event.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                                        <div>
                                            <div className="font-medium capitalize text-gray-900">{event.type.replaceAll('_', ' ')}</div>
                                            <div className="text-xs text-gray-500">
                                                {event.recorded_at}
                                                {event.vehicle ? ` · ${event.vehicle.name}` : ''}
                                                {event.speed_kph != null ? ` · ${event.speed_kph} kph` : ''}
                                            </div>
                                        </div>
                                        <div className="text-amber-700">{event.points_delta}</div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

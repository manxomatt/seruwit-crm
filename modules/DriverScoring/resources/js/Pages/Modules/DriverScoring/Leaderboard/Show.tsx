import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatDateDmY, formatDateTimeDmYHi } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import ScoringNav from '../../../../ScoringNav';

interface PaginatedLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginatedLink[];
}

interface ScoreRow {
    score_date: string;
    score: number;
    harsh_brake_count: number;
    speeding_count: number;
    idle_count: number;
    event_count: number;
}

interface EventRow {
    id: number;
    type: string;
    severity: string;
    speed_kph: string | number | null;
    magnitude: string | number | null;
    points_delta: number;
    recorded_at: string;
    vehicle: { name: string; plate_number: string } | null;
}

interface Props {
    driver: { id: number; name: string; status: string; phone: string | null };
    scores: Paginated<ScoreRow>;
    events: Paginated<EventRow>;
    summary: {
        average_score: number;
        event_count: number;
        harsh_brake_count: number;
        speeding_count: number;
        idle_count: number;
    };
    filters: { from: string; to: string };
}

function PaginationFooter({ paginator }: { paginator: Paginated<unknown> }): JSX.Element | null {
    const { t } = useTrans();

    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-700">
                {t('common.showing_results', {
                    from: (paginator.current_page - 1) * paginator.per_page + 1,
                    to: Math.min(paginator.current_page * paginator.per_page, paginator.total),
                    total: paginator.total,
                })}
            </p>
            <div className="flex gap-1">
                {paginator.links.map((link, index) => (
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
    );
}

export default function Show({ driver, scores, events, summary }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const eventTypeLabel = (type: string): string =>
        t(`scoring.types.${type}`, undefined, type.replaceAll('_', ' '));

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{driver.name}</h2>
                        <p className="text-sm text-gray-500">
                            Avg {summary.average_score} · {summary.event_count} events
                        </p>
                    </div>
                    <Link href={prefixedRoute('scoring.leaderboard')}>
                        <SecondaryButton type="button">{t('scoring.actions.back')}</SecondaryButton>
                    </Link>
                </div>
            }
        >
            <Head title={driver.name} />

            <ScoringNav />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    [t('scoring.fields.score'), summary.average_score],
                    [t('scoring.types.harsh_brake'), summary.harsh_brake_count],
                    [t('scoring.types.speeding'), summary.speeding_count],
                    [t('scoring.types.idle'), summary.idle_count],
                ].map(([label, value]) => (
                    <div key={String(label)} className="bg-white px-3 py-3 text-sm shadow-sm sm:rounded-lg">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="text-lg font-semibold">{value}</div>
                    </div>
                ))}
            </div>

            <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-100 px-4 py-3 font-medium">Daily scores</div>
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('scoring.fields.date')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">{t('scoring.fields.score')}</th>
                            <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Events</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {scores.data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    {t('scoring.pages.leaderboard.empty')}
                                </td>
                            </tr>
                        ) : (
                            scores.data.map((s) => (
                                <tr key={s.score_date}>
                                    <td className="px-4 py-2 whitespace-nowrap">{formatDateDmY(s.score_date)}</td>
                                    <td className="px-4 py-2 font-semibold">{s.score}</td>
                                    <td className="px-4 py-2 text-gray-600">
                                        {s.event_count} · brake {s.harsh_brake_count} · speed {s.speeding_count} · idle{' '}
                                        {s.idle_count}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <PaginationFooter paginator={scores} />
            </div>

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="border-b border-gray-100 px-4 py-3 font-medium">Recent events</div>
                <ul className="divide-y divide-gray-100">
                    {events.data.length === 0 ? (
                        <li className="px-4 py-8 text-center text-sm text-gray-500">{t('scoring.pages.events.empty')}</li>
                    ) : (
                        events.data.map((event) => (
                            <li key={event.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                                <div>
                                    <div className="font-medium capitalize text-gray-900">{eventTypeLabel(event.type)}</div>
                                    <div className="text-xs text-gray-500">
                                        {formatDateTimeDmYHi(event.recorded_at)}
                                        {event.vehicle ? ` · ${event.vehicle.name}` : ''}
                                        {event.speed_kph != null ? ` · ${event.speed_kph} kph` : ''}
                                    </div>
                                </div>
                                <div className="text-amber-700">{event.points_delta}</div>
                            </li>
                        ))
                    )}
                </ul>
                <PaginationFooter paginator={events} />
            </div>
        </DynamicLayout>
    );
}

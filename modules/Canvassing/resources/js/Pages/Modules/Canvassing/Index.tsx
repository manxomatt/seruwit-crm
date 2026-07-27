import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';
import CanvassingNav from '../../../CanvassingNav';

interface Stats {
    total_salespeople: number;
    today_visits: number;
    open_visits: number;
}

interface Salesperson {
    id: number;
    name: string;
    area: string | null;
    today_visits: number;
}

interface Visit {
    id: number;
    salesperson: { name: string };
    partner: { name: string };
    checked_in_at: string;
    outcome: string;
}

interface Props {
    stats: Stats;
    recentVisits: Visit[];
    activeSalespeople: Salesperson[];
}

const outcomeColor = (o: string): string =>
    ({
        pending: 'bg-yellow-100 text-yellow-700',
        contacted: 'bg-blue-100 text-blue-700',
        interested: 'bg-green-100 text-green-700',
        not_interested: 'bg-red-100 text-red-700',
        no_contact: 'bg-gray-100 text-gray-500',
        callback: 'bg-purple-100 text-purple-700',
    })[o] ?? 'bg-gray-100 text-gray-500';

export default function CanvassingIndex({ stats, recentVisits, activeSalespeople }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    return (
        <DynamicLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('canvassing.dashboard.title')}</h2>
            }
        >
            <Head title={t('canvassing.dashboard.head')} />

            <CanvassingNav />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    {
                        label: t('canvassing.dashboard.active_salespeople'),
                        value: stats.total_salespeople,
                        color: 'text-emerald-600',
                    },
                    { label: t('canvassing.dashboard.today_visits'), value: stats.today_visits, color: 'text-blue-600' },
                    { label: t('canvassing.dashboard.currently_open'), value: stats.open_visits, color: 'text-orange-500' },
                ].map((s) => (
                    <div key={s.label} className="overflow-hidden bg-white p-4 shadow-sm sm:rounded-lg">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-700">{t('canvassing.dashboard.active_today')}</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {activeSalespeople.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                                {t('canvassing.dashboard.no_activity')}
                            </li>
                        )}
                        {activeSalespeople.map((sp) => (
                            <li key={sp.id} className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <Link
                                        href={prefixedRoute('canvassing.salespeople.show', sp.id)}
                                        className="text-sm font-medium text-gray-900 hover:underline"
                                    >
                                        {sp.name}
                                    </Link>
                                    {sp.area && <p className="text-xs text-gray-400">{sp.area}</p>}
                                </div>
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                    {t('canvassing.dashboard.visits_count', { count: sp.today_visits })}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-700">{t('canvassing.dashboard.recent_visits')}</h2>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {recentVisits.length === 0 && (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                                {t('canvassing.dashboard.no_visits')}
                            </li>
                        )}
                        {recentVisits.map((v) => (
                            <li key={v.id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <Link
                                            href={prefixedRoute('canvassing.visits.show', v.id)}
                                            className="text-sm font-medium text-gray-900 hover:underline"
                                        >
                                            {v.partner.name}
                                        </Link>
                                        <p className="text-xs text-gray-400">{v.salesperson.name}</p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${outcomeColor(v.outcome)}`}
                                    >
                                        {t(`canvassing.outcomes.${v.outcome}`, undefined, v.outcome)}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-400">
                                    {new Date(v.checked_in_at).toLocaleString(localeTag)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </DynamicLayout>
    );
}

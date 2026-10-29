import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

export default function FuelNav(): JSX.Element {
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { t } = useTrans();

    const tabs = [
        {
            icon: '⛽',
            name: t('fleet.fuel.title', undefined, 'Log Pengisian BBM'),
            route: prefixedRoute('fleet-fuel.index'),
            active: isCurrentRoute('fleet-fuel.index') || isCurrentRoute('fleet.fuel.index'),
        },
        {
            icon: '📈',
            name: t('fleet.dashboard.open_analytics', undefined, 'Analitik & Efisiensi'),
            route: prefixedRoute('fleet-fuel.analytics'),
            active: isCurrentRoute('fleet-fuel.analytics') || isCurrentRoute('fleet.fuel.analytics'),
        },
    ];

    return (
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-4 dark:border-slate-800">
            {tabs.map((tab) => (
                <Link
                    key={tab.name}
                    href={tab.route}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-2xs ${
                        tab.active
                            ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60'
                    }`}
                >
                    <span>{tab.icon}</span>
                    <span>{tab.name}</span>
                </Link>
            ))}
        </div>
    );
}

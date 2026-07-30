import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Link } from '@inertiajs/react';

const links = [
    { key: 'dashboard', route: 'shuttle.dashboard', labelKey: 'shuttle.nav.dashboard' },
    { key: 'corridors', route: 'shuttle.corridors.index', labelKey: 'shuttle.nav.corridors' },
    { key: 'schedules', route: 'shuttle.schedules.index', labelKey: 'shuttle.nav.schedules' },
    { key: 'departures', route: 'shuttle.departures.index', labelKey: 'shuttle.nav.departures' },
    { key: 'bookings', route: 'shuttle.bookings.index', labelKey: 'shuttle.nav.bookings' },
] as const;

export default function ShuttleNav({ active }: { active: (typeof links)[number]['key'] }) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <nav className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {links.map((link) => (
                <Link
                    key={link.key}
                    href={prefixedRoute(link.route)}
                    className={
                        active === link.key
                            ? 'rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white'
                            : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100'
                    }
                >
                    {t(link.labelKey)}
                </Link>
            ))}
        </nav>
    );
}

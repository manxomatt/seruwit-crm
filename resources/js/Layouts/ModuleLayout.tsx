import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import GlobalSearch from '@/Components/GlobalSearch';
import { Link, usePage } from '@inertiajs/react';
import { useState, ReactNode, useMemo } from 'react';

interface UserProfile {
    id: number;
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    avatar_url: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    is_admin: boolean;
    dashboard_path: string;
    profile: UserProfile | null;
    permissions: Record<string, string[]>;
}

interface Props {
    header?: ReactNode;
    children?: ReactNode;
}

interface MenuItem {
    name: string;
    href: string;
    icon: ReactNode;
    current: boolean;
    module: string;
}

const DashboardIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

const PagesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const MediaIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const CarouselIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
);

const PostsIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const RolesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);

const CustomersIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ProductIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375C2.754 3.75 2.25 4.254 2.25 4.875v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const FleetIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v-.243a2.25 2.25 0 00-.659-1.591L14.25 14.5M9.75 6.75H4.5a2.25 2.25 0 00-2.25 2.25v6a2.25 2.25 0 002.25 2.25h.75m9.75-8.25V6a2.25 2.25 0 00-2.25-2.25h-3A2.25 2.25 0 007.5 6v11.25m9.75-8.25H21a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75h-1.5m-4.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-9 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const WrenchIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
);

const TransportationIcon = () => (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.083c.621 0 1.191.354 1.409.923.156.406.301.816.436 1.228M14.25 7.5v11.25m0-11.25h-3.75m3.75 0V4.875c0-.621-.504-1.125-1.125-1.125h-7.5C6.879 3.75 6 4.629 6 5.652v9.848m0 0a1.5 1.5 0 013 0M6 15.5h3.75" />
</svg>
);

const LiveUpdatesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const TrackingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const BillingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
);

const OrdersIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
);

const MenuIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Avatar component that shows image or initials
const UserAvatar = ({ user, size = 'md' }: { user: User | null; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'h-8 w-8 text-sm',
        md: 'h-9 w-9 text-sm',
        lg: 'h-10 w-10 text-base',
    };

    const avatarUrl = user?.profile?.avatar_url;

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={user?.name || 'User'}
                className={`${sizeClasses[size]} rounded-full object-cover`}
            />
        );
    }

    // Color based on user role
    const bgColor = user?.is_admin ? 'bg-indigo-500' : 'bg-purple-500';

    return (
        <div className={`${sizeClasses[size]} rounded-full ${bgColor} flex items-center justify-center`}>
            <span className="font-medium text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
        </div>
    );
};

const ChevronDownIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

// Mirrors App\Modules\ModuleTier — the architectural layer a module declares
// for itself, shared as the `moduleTiers` prop.
type ModuleTier = 'content' | 'foundation' | 'vertical';

// Sidebar menu groups: modules are shown under these collapsible sections in
// this order. Items still appear only when the user has permission for them,
// and a group with no accessible items is hidden entirely.
//
// A group is either derived from the tier each module declares in its
// ModuleContract — so a new module lands in the right group with no edit here —
// or a fixed list of core features (media, users, settings, the platform
// control plane), which are not registered modules and so declare no tier.
type MenuGroup =
    | { title: string; tier: ModuleTier; also?: string[] }
    | { title: string; modules: string[] };

const MENU_GROUPS: MenuGroup[] = [
    { title: 'Konten', tier: 'content', also: ['media'] },
    { title: 'Fondasi', tier: 'foundation' },
    { title: 'Operasi', tier: 'vertical' },
    { title: 'Wawasan', modules: ['analytics', 'live-updates'] },
    { title: 'Administrasi', modules: ['users', 'roles', 'settings', 'modules'] },
    { title: 'Platform', modules: ['tenants', 'plans', 'module-registry'] },
];

// Module to route mapping - use module routes
const moduleRouteMap: Record<string, { route: string; routePattern: string }> = {
    'pages': { route: 'module.pages.index', routePattern: 'module.pages.*' },
    'posts': { route: 'module.posts.index', routePattern: 'module.posts.*' },
    'carousels': { route: 'module.carousels.index', routePattern: 'module.carousels.*' },
    'media': { route: 'module.media.index', routePattern: 'module.media.*' },
    'customers': { route: 'module.customers.index', routePattern: 'module.customers.*' },
    'products': { route: 'module.products.index', routePattern: 'module.products.*' },
    'fleet': { route: 'module.fleet.vehicles.index', routePattern: 'module.fleet.*' },
    'document': { route: 'module.documents.index', routePattern: 'module.documents.*' },
    'maintenance': { route: 'module.maintenance.index', routePattern: 'module.maintenance.*' },
    'tracking': { route: 'module.tracking.map', routePattern: 'module.tracking.*' },
    'transportation': { route: 'module.transportation.trips.index', routePattern: 'module.transportation.*' },
    'orders': { route: 'module.orders.index', routePattern: 'module.orders.*' },
    'billing': { route: 'module.billing.charges.index', routePattern: 'module.billing.*' },
    'invoicing': { route: 'module.invoicing.invoices.index', routePattern: 'module.invoicing.*' },
    'analytics': { route: 'module.analytics.index', routePattern: 'module.analytics.*' },
    'settings': { route: 'module.settings.index', routePattern: 'module.settings.*' },
    'users': { route: 'module.users.index', routePattern: 'module.users.*' },
    'roles': { route: 'module.roles.index', routePattern: 'module.roles.*' },
    'live-updates': { route: 'module.live-updates.index', routePattern: 'module.live-updates.*' },
};

// Module to icon mapping
const moduleIconMap: Record<string, ReactNode> = {
    'pages': <PagesIcon />,
    'posts': <PostsIcon />,
    'carousels': <CarouselIcon />,
    'media': <MediaIcon />,
    'customers': <CustomersIcon />,
    'products': <ProductIcon />,
    'fleet': <FleetIcon />,
    'document': <DocumentIcon />,
    'maintenance': <WrenchIcon />,
    'tracking': <TrackingIcon />,
    'transportation': <TransportationIcon />,
    'orders': <OrdersIcon />,
    'billing': <BillingIcon />,
    'invoicing': <BillingIcon />,
    'analytics': <AnalyticsIcon />,
    'settings': <SettingsIcon />,
    'users': <UsersIcon />,
    'roles': <RolesIcon />,
    'live-updates': <LiveUpdatesIcon />,
};

// Module display names
const moduleDisplayNames: Record<string, string> = {
    'pages': 'Pages',
    'posts': 'Posts',
    'carousels': 'Carousels',
    'media': 'Media',
    'customers': 'Customers',
    'products': 'Products',
    'fleet': 'Fleet',
    'document': 'Documents',
    'maintenance': 'Maintenance',
    'tracking': 'Tracking',
    'transportation': 'Transportation',
    'orders': 'Orders',
    'billing': 'Billing',
    'invoicing': 'Invoicing',
    'analytics': 'Analytics',
    'settings': 'Settings',
    'users': 'Users',
    'roles': 'Roles',
    'live-updates': 'Live Updates',
};

// Helper function to check if a route exists
const routeExists = (routeName: string): boolean => {
    try {
        route(routeName);
        return true;
    } catch {
        return false;
    }
};

const BuildingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const PlansIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
);

const ModulesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.007-1.875 2.25-1.875s2.25.84 2.25 1.875c0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
);

// Helper function to get dashboard route based on user role
const getDashboardRoute = (user: User | null): string => {
    if (user?.dashboard_path) {
        return user.dashboard_path;
    }

    if (routeExists('module.dashboard')) {
        return route('module.dashboard');
    }

    return route('dashboard');
};

// Get theme colors based on user role - using Sky Track theme (dark blue gradient)
const getThemeColors = (isAdmin: boolean) => {
    // Both admin and module users use the same Sky Track theme
    return {
        gradient: 'from-slate-900 via-blue-900 to-slate-900',
        border: 'border-blue-700/50',
        text: 'text-blue-100',
        textHover: 'text-cyan-300',
        bg: 'bg-blue-600',
        activeItem: 'bg-cyan-500/20 text-white border-l-4 border-cyan-400',
        hoverItem: 'hover:bg-white/5 hover:text-white',
    };
};

export default function ModuleLayout({ header, children }: Props) {
    const pageProps = usePage().props as any;
    const user = pageProps.auth.user as User | null;
    const settings = pageProps.settings as Record<string, string> | undefined;
    // Each registered module's declared tier, ordered by its menu sort_order.
    const moduleTiers = (pageProps.moduleTiers ?? []) as { key: string; tier: ModuleTier }[];
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // No current-tenant domain context means we are on the central domain (the SaaS control plane).
    const isCentral = !pageProps.currentTenant;
    const isAdmin = user?.is_admin || false;
    const theme = getThemeColors(isAdmin);
    const panelName = isAdmin ? 'Admin' : 'Module';

    // Get logo and site name from settings
    const siteLogo = settings?.['site.logo'];
    const siteName = settings?.['general.site_name'] || 'Sky Track';

    // Build navigation from the user's permissions in the active schema.
    const navigation = useMemo(() => {
        const dashboardRoute = getDashboardRoute(user);
        const items: MenuItem[] = [
            {
                name: 'Dashboard',
                href: dashboardRoute,
                icon: <DashboardIcon />,
                current: route().current('module.dashboard') || route().current('dashboard'),
                module: 'dashboard',
            },
        ];

        if (!user) {
            return items;
        }

        const permissions = user.permissions || {};

        // Add menu items based on user permissions (need 'view' permission for the module)
        Object.keys(permissions).forEach((module) => {
            const modulePermissions = permissions[module];
            // Only add menu item if user has 'view' permission, route mapping exists, and route actually exists
            if (modulePermissions.includes('view') && moduleRouteMap[module] && routeExists(moduleRouteMap[module].route)) {
                const routeInfo = moduleRouteMap[module];
                items.push({
                    name: moduleDisplayNames[module] || module,
                    href: route(routeInfo.route),
                    icon: moduleIconMap[module] || <PagesIcon />,
                    current: route().current(routeInfo.routePattern),
                    module: module,
                });
            }
        });

        // On the central domain, super admins also manage tenants (SaaS control plane).
        if (isCentral && isAdmin && routeExists('module.tenants.index')) {
            items.push({
                name: 'Kelola Tenant',
                href: route('module.tenants.index'),
                icon: <BuildingIcon />,
                current: route().current('module.tenants.*'),
                module: 'tenants',
            });
        }

        // Plans decide what every tenant may install, so they sit next to tenants
        // on the control plane rather than inside any one workspace.
        if (isCentral && isAdmin && routeExists('module.plans.index')) {
            items.push({
                name: 'Paket',
                href: route('module.plans.index'),
                icon: <PlansIcon />,
                current: route().current('module.plans.*'),
                module: 'plans',
            });
        }

        // The platform-wide module kill switch — distinct from the workspace's
        // own "Modul" catalog below, which only picks among what this switch
        // and the tenant's plan both already allow.
        if (isCentral && isAdmin && routeExists('module.registry.index')) {
            items.push({
                name: 'Modul Platform',
                href: route('module.registry.index'),
                icon: <ModulesIcon />,
                current: route().current('module.registry.*'),
                module: 'module-registry',
            });
        }

        // Inside a workspace, its admin picks which modules the plan covers.
        // Gated by an ability rather than a permission, so it is injected here
        // instead of being seeded as a menu row.
        if (!isCentral && isAdmin && routeExists('module.modules.index')) {
            items.push({
                name: 'Modul',
                href: route('module.modules.index'),
                icon: <ModulesIcon />,
                current: route().current('module.modules.*'),
                module: 'modules',
            });
        }

        return items;
    }, [user, isCentral, isAdmin]);

    // Split the flat navigation into the standalone Dashboard plus collapsible
    // groups, preserving the module order defined in MENU_GROUPS.
    const dashboardItem = navigation.find((item) => item.module === 'dashboard');
    const menuGroups = useMemo(() => {
        // Tier-derived groups take their members — and their order — from what the
        // modules themselves declare on the server; fixed groups list core
        // features, which are not modules and have no tier.
        const moduleKeysIn = (group: MenuGroup): string[] =>
            'tier' in group
                ? [
                      ...moduleTiers.filter((entry) => entry.tier === group.tier).map((entry) => entry.key),
                      ...(group.also ?? []),
                  ]
                : group.modules;

        return MENU_GROUPS.map((group) => ({
            title: group.title,
            items: moduleKeysIn(group)
                .map((module) => navigation.find((item) => item.module === module))
                .filter((item): item is MenuItem => Boolean(item)),
        })).filter((group) => group.items.length > 0);
    }, [navigation, moduleTiers]);

    // Collapsible group state, persisted so it survives page navigations.
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('sidebarGroups') || '{}');
        } catch {
            return {};
        }
    });
    const isGroupOpen = (title: string) => openGroups[title] ?? true;
    const toggleGroup = (title: string) =>
        setOpenGroups((prev) => {
            const next = { ...prev, [title]: !(prev[title] ?? true) };
            try {
                localStorage.setItem('sidebarGroups', JSON.stringify(next));
            } catch {
                // ignore storage failures (e.g. private mode)
            }
            return next;
        });

    const renderNavLink = (item: MenuItem) => (
        <Link
            key={item.name}
            href={item.href}
            className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${item.current
                ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                : `${theme.text} hover:bg-white/10 hover:text-white`
                }`}
        >
            <span className={`mr-3 ${item.current ? 'text-white' : `${theme.textHover} group-hover:text-white`}`}>
                {item.icon}
            </span>
            {item.name}
        </Link>
    );

    const renderNavigation = () => (
        <>
            {dashboardItem && renderNavLink(dashboardItem)}
            {menuGroups.map((group) => {
                const open = isGroupOpen(group.title);
                const hasActive = group.items.some((item) => item.current);
                return (
                    <div key={group.title} className="pt-3">
                        <button
                            type="button"
                            onClick={() => toggleGroup(group.title)}
                            aria-expanded={open}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${hasActive && !open ? 'text-white' : `${theme.text} hover:text-white`
                                }`}
                        >
                            <span>{group.title}</span>
                            <span className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}>
                                <ChevronDownIcon />
                            </span>
                        </button>
                        {open && <div className="mt-1 space-y-1">{group.items.map(renderNavLink)}</div>}
                    </div>
                );
            })}
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b ${theme.gradient}`}>
                        <div className="flex h-16 items-center justify-between px-4">
                            <Link href={getDashboardRoute(user)} className="flex items-center">
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                                ) : (
                                    <ApplicationLogo className="h-8 w-auto text-white" />
                                )}
                                <span className="ml-2 text-xl font-bold text-white">{siteName}</span>
                            </Link>
                            <button
                                type="button"
                                className="text-white hover:text-gray-200"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                            {renderNavigation()}
                        </nav>
                        {/* Mobile sidebar user section */}
                        <div className={`border-t ${theme.border} p-4`}>
                            <Link href={route('profile.edit')} className="flex items-center hover:opacity-80 transition-opacity">
                                <UserAvatar user={user} size="md" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                                    <p className={`text-xs ${theme.text}`}>{user?.email || 'user@example.com'}</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className={`flex min-h-0 flex-1 flex-col bg-gradient-to-b ${theme.gradient}`}>
                    <div className={`flex h-16 items-center px-4 border-b ${theme.border}`}>
                        <Link href={getDashboardRoute(user)} className="flex items-center">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                            ) : (
                                <ApplicationLogo className="h-8 w-auto text-white" />
                            )}
                            <span className="ml-2 text-xl font-bold text-white">{siteName}</span>
                        </Link>
                    </div>
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {renderNavigation()}
                    </nav>
                    {/* Desktop sidebar user section (kiri bawah) */}
                    <div className={`border-t ${theme.border} p-4`}>
                        <Link href={route('profile.edit')} className="flex items-center hover:opacity-80 transition-opacity">
                            <UserAvatar user={user} size="md" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                                <p className={`text-xs ${theme.text}`}>{user?.email || 'user@example.com'}</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top navigation */}
                <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <MenuIcon />
                    </button>

                    {/* Separator */}
                    <div className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        {/* Global Search */}
                        <div className="relative flex flex-1 items-center">
                            <GlobalSearch />
                        </div>

                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Notifications */}
                            <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                            </button>

                            {/* Separator */}
                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                            {/* Profile dropdown (kanan atas) */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button type="button" className="-m-1.5 flex items-center p-1.5">
                                        <UserAvatar user={user} size="sm" />
                                        <span className="hidden lg:flex lg:items-center">
                                            <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                                                {user?.name || 'User'}
                                            </span>
                                            <svg className="ml-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button">
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Page header */}
                {header && (
                    <header className="bg-white shadow-sm">
                        <div className="px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main content area */}
                <main className="py-6">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

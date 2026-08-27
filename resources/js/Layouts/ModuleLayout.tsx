import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import FlashSnackbar from '@/Components/FlashSnackbar';
import GlobalSearch from '@/Components/GlobalSearch';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import SidebarNavScroll from '@/Components/SidebarNavScroll';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Link, usePage, usePoll } from '@inertiajs/react';
import { ReactNode, useMemo, useState } from 'react';

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
    is_reseller: boolean;
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
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

const InventoryIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const PurchasingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
);

const SalesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const RentalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);

/** Reservation / booking list */
const ReservationIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
);

/** Vehicle availability calendar board */
const AvailabilityIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
);

/** Vehicle usage timeline calendar */
const RentalCalendarIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const CanvassingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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

const PaymentOrdersIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
);

const AccountingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

const InvoicingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const ReceivablesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
    </svg>
);

const PayablesIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H16.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25H9m6 0V3.75m0 4.5l-3-3m3 3l3-3" />
    </svg>
);

const SubscriptionIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3m-3 3h3m-3 3h3m-9-9.75h.375c.621 0 1.125.504 1.125 1.125v.375m0 0h5.25m-5.25 0v.375c0 .621.504 1.125 1.125 1.125h.375m-9-9.75v.375c0 .621.504 1.125 1.125 1.125h.375m0 0h5.25m-5.25 0v.375c0 .621.504 1.125 1.125 1.125h.375M7.5 21h9a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0016.5 3h-9a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21z" />
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
    | { titleKey: string; tier: ModuleTier; also?: string[] }
    | { titleKey: string; modules: string[] };

const MENU_GROUPS: MenuGroup[] = [
    {
        titleKey: 'car_rental',
        modules: [
            'rental-dashboard',
            'rental-reservation',
            'rental-availability',
            'rental-calendar',
            'rental-settings',
        ],
    },
    { titleKey: 'intelligence', modules: ['bi', 'approvals'] },
    { titleKey: 'master_data', modules: ['partners', 'products'] },
    { titleKey: 'finance', modules: ['accounting', 'invoicing', 'receivables', 'payables', 'billing'] },
    { titleKey: 'procurement_warehouse', modules: ['purchasing', 'sales', 'inventory'] },
    { titleKey: 'fleet_compliance', modules: ['fleet', 'document', 'maintenance', 'tracking', 'scoring'] },
    { titleKey: 'distribution_logistics', modules: ['transportation', 'orders', 'outbound', 'routing'] },
    { titleKey: 'sales_commercial', modules: ['pos', 'canvassing', 'shuttle', 'promotions'] },
    { titleKey: 'content', tier: 'content', also: ['media'] },
    // { titleKey: 'insights', modules: ['analytics', 'live-updates'] },
    { titleKey: 'administration', modules: ['roles', 'users', 'modules', 'settings', 'subscription'] },
    { titleKey: 'platform', modules: ['tenants', 'plans', 'subscription-tiers', 'payment-orders', 'module-registry'] },
];

const CENTRAL_MENU_GROUPS: MenuGroup[] = [
    { titleKey: 'finance', modules: ['accounting', 'invoicing', 'receivables', 'payables', 'billing', 'payment-orders'] },
    { titleKey: 'content', modules: ['pages', 'posts', 'carousels', 'media'] },
    { titleKey: 'administration', modules: ['users', 'roles', 'settings'] },
    { titleKey: 'platform', modules: ['tenants', 'plans', 'subscription-tiers', 'module-registry', 'central-modules'] },
];

const CENTRAL_ALLOWED_MODULES = [
    'bi', 'accounting', 'invoicing', 'receivables', 'payables', 'billing', 'payment-orders', 'pages', 'posts',
    'carousels', 'media', 'tenants', 'plans',
    'module-registry', 'settings', 'users', 'roles',
];

// Module to route mapping - use module routes
const moduleRouteMap: Record<string, { route: string; routePattern: string }> = {
    'pages': { route: 'module.pages.index', routePattern: 'module.pages.*' },
    'posts': { route: 'module.posts.index', routePattern: 'module.posts.*' },
    'carousels': { route: 'module.carousels.index', routePattern: 'module.carousels.*' },
    'media': { route: 'module.media.index', routePattern: 'module.media.*' },
    'partners': { route: 'module.partners.dashboard', routePattern: 'module.partners.*' },
    'products': { route: 'module.products.dashboard', routePattern: 'module.products.*' },
    'fleet': { route: 'module.fleet.dashboard', routePattern: 'module.fleet.*' },
    'document': { route: 'module.documents.index', routePattern: 'module.documents.*' },
    'maintenance': { route: 'module.maintenance.index', routePattern: 'module.maintenance.*' },
    'tracking': { route: 'module.tracking.dashboard', routePattern: 'module.tracking.*' },
    'transportation': { route: 'module.transportation.dashboard', routePattern: 'module.transportation.*' },
    'inventory': { route: 'module.inventory.dashboard', routePattern: 'module.inventory.*' },
    'purchasing': { route: 'module.purchasing.dashboard', routePattern: 'module.purchasing.*' },
    'sales': { route: 'module.sales.dashboard', routePattern: 'module.sales.*' },
    'accounting': { route: 'module.accounting.dashboard', routePattern: 'module.accounting.*' },
    'receivables': { route: 'module.receivables.dashboard', routePattern: 'module.receivables.*' },
    'payables': { route: 'module.payables.dashboard', routePattern: 'module.payables.*' },
    'approvals': { route: 'module.approvals.requests.index', routePattern: 'module.approvals.*' },
    'orders': { route: 'module.orders.dashboard', routePattern: 'module.orders.*' },
    'routing': { route: 'module.routing.plans.index', routePattern: 'module.routing.*' },
    'scoring': { route: 'module.scoring.leaderboard', routePattern: 'module.scoring.*' },
    'promotions': { route: 'module.promotions.programs.index', routePattern: 'module.promotions.*' },
    'bi': { route: 'module.bi.dashboard', routePattern: 'module.bi.*' },
    'outbound': { route: 'module.outbound.pick-lists.index', routePattern: 'module.outbound.*' },
    'pos': { route: 'module.pos.terminal', routePattern: 'module.pos.*' },
    'billing': { route: 'module.billing.dashboard', routePattern: 'module.billing.*' },
    'invoicing': { route: 'module.invoicing.dashboard', routePattern: 'module.invoicing.*' },
    'rental': { route: 'module.rental.dashboard', routePattern: 'module.rental.*' },
    'shuttle': { route: 'module.shuttle.dashboard', routePattern: 'module.shuttle.*' },
    'canvassing': { route: 'module.canvassing.index', routePattern: 'module.canvassing.*' },
    'analytics': { route: 'module.analytics.index', routePattern: 'module.analytics.*' },
    'settings': { route: 'module.settings.index', routePattern: 'module.settings.*' },
    'subscription': { route: 'module.subscription.index', routePattern: 'module.subscription.*' },
    'subscription-tiers': { route: 'module.subscription-tiers.index', routePattern: 'module.subscription-tiers.*' },
    'users': { route: 'module.users.index', routePattern: 'module.users.*' },
    'roles': { route: 'module.roles.index', routePattern: 'module.roles.*' },
    'live-updates': { route: 'module.live-updates.index', routePattern: 'module.live-updates.*' },
};

/**
 * Modules that expand into multiple sidebar links under their MENU_GROUPS entry
 * (instead of a single module entry). Permission still comes from the parent key.
 */
type ModuleSidebarChild = {
    key: string;
    labelKey: string;
    route: string;
    routePatterns: string[];
    icon: ReactNode;
    params?: Record<string, string>;
};

const MODULE_SIDEBAR_CHILDREN: Record<string, ModuleSidebarChild[]> = {
    rental: [
        {
            key: 'rental-dashboard',
            labelKey: 'rental.nav.dashboard',
            route: 'module.rental.dashboard',
            routePatterns: ['module.rental.dashboard', 'module.rental.dashboard.*'],
            icon: <DashboardIcon />,
        },
        {
            key: 'rental-reservation',
            labelKey: 'rental.nav.reservation',
            route: 'module.rental.index',
            routePatterns: [
                'module.rental.index',
                'module.rental.create',
                'module.rental.show',
                'module.rental.edit',
            ],
            icon: <ReservationIcon />,
        },
        {
            key: 'rental-availability',
            labelKey: 'rental.nav.availability',
            route: 'module.rental.availability.index',
            routePatterns: ['module.rental.availability.*'],
            icon: <AvailabilityIcon />,
        },
        {
            key: 'rental-calendar',
            labelKey: 'rental.nav.calendar',
            route: 'module.rental.calendar.index',
            routePatterns: ['module.rental.calendar.*'],
            icon: <RentalCalendarIcon />,
        },
        {
            key: 'rental-settings',
            labelKey: 'rental.nav.settings',
            route: 'module.rental.settings.index',
            routePatterns: ['module.rental.settings.*', 'module.rental.rates.*'],
            params: { tab: 'general' },
            icon: <SettingsIcon />,
        },
    ],
};

const isRouteCurrent = (patterns: string[]): boolean =>
    patterns.some(
        (pattern) =>
            route().current(pattern) ||
            route().current(`central.${pattern}`) ||
            false,
    );

// Module to icon mapping
const moduleIconMap: Record<string, ReactNode> = {
    'pages': <PagesIcon />,
    'posts': <PostsIcon />,
    'carousels': <CarouselIcon />,
    'media': <MediaIcon />,
    'partners': <CustomersIcon />,
    'products': <ProductIcon />,
    'fleet': <FleetIcon />,
    'document': <DocumentIcon />,
    'maintenance': <WrenchIcon />,
    'tracking': <TrackingIcon />,
    'transportation': <TransportationIcon />,
    'inventory': <InventoryIcon />,
    'purchasing': <PurchasingIcon />,
    'sales': <SalesIcon />,
    'accounting': <AccountingIcon />,
    'receivables': <ReceivablesIcon />,
    'payables': <PayablesIcon />,
    'approvals': <DocumentIcon />,
    'orders': <OrdersIcon />,
    'routing': <TransportationIcon />,
    'scoring': <FleetIcon />,
    'promotions': <ProductIcon />,
    'bi': <AnalyticsIcon />,
    'outbound': <InventoryIcon />,
    'pos': <SalesIcon />,
    'billing': <BillingIcon />,
    'payment-orders': <PaymentOrdersIcon />,
    'invoicing': <InvoicingIcon />,
    'rental': <RentalIcon />,
    'shuttle': <TransportationIcon />,
    'canvassing': <CanvassingIcon />,
    'analytics': <AnalyticsIcon />,
    'settings': <SettingsIcon />,
    'subscription': <SubscriptionIcon />,
    'subscription-tiers': <SubscriptionIcon />,
    'users': <UsersIcon />,
    'roles': <RolesIcon />,
    'live-updates': <LiveUpdatesIcon />,
};

// Module display names fall back to the module key; prefer t('modules.*') in the layout.
const moduleDisplayNames: Record<string, string> = {};

// Helper function to check if a route exists (tenant name or central.* twin)
const routeExists = (routeName: string): boolean => {
    return route().has(routeName) || route().has(`central.${routeName}`);
};

const resolveNamedRoute = (routeName: string): string => {
    if (route().has(routeName)) {
        return routeName;
    }

    const centralRouteName = `central.${routeName}`;
    if (route().has(centralRouteName)) {
        return centralRouteName;
    }

    return routeName;
};

const BuildingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);

const CommissionIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        return route(resolveNamedRoute('module.dashboard'));
    }

    return route('dashboard');
};

// Sidebar chrome follows Appearance primary/secondary CSS variables.
const getThemeColors = () => {
    return {
        border: 'border-white/15',
        text: 'text-white/75',
        textHover: 'text-[color:var(--brand-sidebar-accent)]',
    };
};

export default function ModuleLayout({ header, children }: Props) {
    const pageProps = usePage().props as any;
    const { t, locale } = useTrans();
    const user = pageProps.auth.user as User | null;
    // Shared public key→value map. Never treat a page-level array as this map.
    const settings = (
        pageProps.settings && !Array.isArray(pageProps.settings)
            ? pageProps.settings
            : undefined
    ) as Record<string, string> | undefined;
    const notifications = pageProps.notificationCenter as {
        unread_count: number;
        recent: Array<{ id: string; title: string; body: string; url: string | null; read_at: string | null; created_at: string | null }>;
    } | null;
    // Each registered module's declared tier, ordered by its menu sort_order.
    const moduleTiers = (pageProps.moduleTiers ?? []) as { key: string; tier: ModuleTier }[];
    // Optional modules the super admin may install onto the central dashboard.
    const centralInstallable = (pageProps.centralInstallableModules ?? []) as string[];
    const subscriptionSummary = pageProps.subscriptionSummary as { plan_name: string | null; status: string } | null;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Keep the bell and payment orders count fresh without a full navigation. Only the specified
    // props are re-fetched, so this is cheap.
    usePoll(60000, { only: ['notificationCenter', 'pendingPaymentOrdersCount', 'pendingRentalApprovalsCount'] });

    // No current-tenant domain context means we are on the central domain (the SaaS control plane).
    const isCentral = !pageProps.currentTenant;
    const isAdmin = user?.is_admin || false;
    const isReseller = user?.is_reseller || false;
    const theme = getThemeColors();
    const panelName = isAdmin ? 'Admin' : 'Module';

    // Get logo and site name from settings
    const siteLogo = settings?.['site.logo'];
    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;

    const moduleLabel = (module: string): string => t(`modules.${module}`, undefined, moduleDisplayNames[module] || module);

    // Build navigation from the user's permissions in the active schema.
    const navigation = useMemo(() => {
        const dashboardRoute = getDashboardRoute(user);
        const items: MenuItem[] = [
            {
                name: t('shell.dashboard'),
                href: dashboardRoute,
                icon: <DashboardIcon />,
                current:
                    route().current('module.dashboard') ||
                    route().current('central.module.dashboard') ||
                    route().current('dashboard') ||
                    false,
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
            if (! modulePermissions.includes('view')) {
                return;
            }

            // Central Admin only allows Central modules (Dashboard, Finance,
            // Contents, Platform) plus any optional module installed onto the
            // central dashboard from the marketplace.
            if (isCentral && !CENTRAL_ALLOWED_MODULES.includes(module) && !centralInstallable.includes(module)) {
                return;
            }

            const children = MODULE_SIDEBAR_CHILDREN[module];
            if (children) {
                children.forEach((child) => {
                    if (! routeExists(child.route)) {
                        return;
                    }

                    items.push({
                        name: t(child.labelKey),
                        href: child.params
                            ? route(resolveNamedRoute(child.route), child.params)
                            : route(resolveNamedRoute(child.route)),
                        icon: child.icon || moduleIconMap[module] || <PagesIcon />,
                        current: isRouteCurrent(child.routePatterns),
                        module: child.key,
                    });
                });

                return;
            }

            // Only add menu item if route mapping exists and route actually exists
            if (moduleRouteMap[module] && routeExists(moduleRouteMap[module].route)) {
                const routeInfo = moduleRouteMap[module];
                items.push({
                    name: moduleLabel(module),
                    href: route(resolveNamedRoute(routeInfo.route)),
                    icon: moduleIconMap[module] || <PagesIcon />,
                    current:
                        route().current(routeInfo.routePattern) ||
                        route().current(`central.${routeInfo.routePattern}`) ||
                        false,
                    module: module,
                });
            }
        });

        // A reseller's own earnings come before the tenant list: the fee is what
        // they log in for, and the tenants are how it is produced.
        if (isCentral && isReseller && routeExists('module.reseller.dashboard')) {
            items.push({
                name: t('shell.reseller_portal'),
                href: route(resolveNamedRoute('module.reseller.dashboard')),
                icon: <CommissionIcon />,
                current:
                    route().current('module.reseller.dashboard') ||
                    route().current('central.module.reseller.dashboard') ||
                    false,
                module: 'reseller',
            });

            items.push({
                name: t('shell.reseller_commissions'),
                href: route(resolveNamedRoute('module.reseller.commissions')),
                icon: <PlansIcon />,
                current:
                    route().current('module.reseller.commissions') ||
                    route().current('central.module.reseller.commissions') ||
                    false,
                module: 'reseller-commissions',
            });

            items.push({
                name: t('shell.reseller_payouts'),
                href: route(resolveNamedRoute('module.reseller.payouts')),
                icon: <BuildingIcon />,
                current:
                    route().current('module.reseller.payouts') ||
                    route().current('central.module.reseller.payouts') ||
                    false,
                module: 'reseller-payouts',
            });
        }

        // On the central domain, super admins and resellers manage tenants.
        if (isCentral && (isAdmin || isReseller) && routeExists('module.tenants.index')) {
            items.push({
                name: t('shell.manage_tenants'),
                href: route(resolveNamedRoute('module.tenants.index')),
                icon: <BuildingIcon />,
                current:
                    route().current('module.tenants.*') ||
                    route().current('central.module.tenants.*') ||
                    false,
                module: 'tenants',
            });
        }

        // Plans decide what every tenant may install, so they sit next to tenants
        // on the control plane rather than inside any one workspace.
        if (isCentral && isAdmin && routeExists('module.plans.index')) {
            items.push({
                name: t('shell.plans'),
                href: route(resolveNamedRoute('module.plans.index')),
                icon: <PlansIcon />,
                current:
                    route().current('module.plans.*') ||
                    route().current('central.module.plans.*') ||
                    false,
                module: 'plans',
            });
        }

        // Platform-global settings (AI master switch, system mode) — central admin only.
        if (isCentral && isAdmin && routeExists('module.platform-settings.index')) {
            items.push({
                name: t('shell.platform_settings', undefined, 'Platform Settings'),
                href: route(resolveNamedRoute('module.platform-settings.index')),
                icon: <SettingsIcon />,
                current:
                    route().current('module.platform-settings.*') ||
                    route().current('central.module.platform-settings.*') ||
                    false,
                module: 'platform-settings',
            });
        }

        // Subscription tiers for PAYG pricing
        if (isCentral && isAdmin && routeExists('module.subscription-tiers.index')) {
            items.push({
                name: t('shell.subscription_tiers', undefined, 'Subscription Tiers'),
                href: route(resolveNamedRoute('module.subscription-tiers.index')),
                icon: <SubscriptionIcon />,
                current:
                    route().current('module.subscription-tiers.*') ||
                    route().current('central.module.subscription-tiers.*') ||
                    false,
                module: 'subscription-tiers',
            });
        }

        // The reseller programme: who the partners are, and what the platform
        // currently owes them.
        if (isCentral && isAdmin && routeExists('module.resellers.index')) {
            items.push({
                name: t('shell.resellers'),
                href: route(resolveNamedRoute('module.resellers.index')),
                icon: <CommissionIcon />,
                current:
                    route().current('module.resellers.*') ||
                    route().current('central.module.resellers.*') ||
                    false,
                module: 'resellers',
            });

            items.push({
                name: t('shell.commission_queue'),
                href: route(resolveNamedRoute('module.reseller-commissions.index')),
                icon: <PlansIcon />,
                current:
                    route().current('module.reseller-commissions.*') ||
                    route().current('central.module.reseller-commissions.*') ||
                    false,
                module: 'reseller-commissions-admin',
            });

            items.push({
                name: t('shell.payout_desk'),
                href: route(resolveNamedRoute('module.reseller-payouts.index')),
                icon: <BuildingIcon />,
                current:
                    route().current('module.reseller-payouts.*') ||
                    route().current('central.module.reseller-payouts.*') ||
                    false,
                module: 'reseller-payouts-admin',
            });
        }

        // Payment order verification for manual transfers.
        if (isCentral && isAdmin && routeExists('module.payment-orders.index')) {
            items.push({
                name: t('shell.payment_orders'),
                href: route(resolveNamedRoute('module.payment-orders.index')),
                icon: <PaymentOrdersIcon />,
                current:
                    route().current('module.payment-orders.*') ||
                    route().current('central.module.payment-orders.*') ||
                    false,
                module: 'payment-orders',
            });
        }

        // The platform-wide module kill switch — distinct from the workspace's
        // own "Modul" catalog below, which only picks among what this switch
        // and the tenant's plan both already allow.
        if (isCentral && isAdmin && routeExists('module.registry.index')) {
            items.push({
                name: t('shell.platform_modules'),
                href: route(resolveNamedRoute('module.registry.index')),
                icon: <ModulesIcon />,
                current:
                    route().current('module.registry.*') ||
                    route().current('central.module.registry.*') ||
                    false,
                module: 'module-registry',
            });
        }

        // The central module marketplace: install optional modules onto the
        // central dashboard itself. Distinct from the kill switch above (every
        // tenant) and the workspace catalog below (one tenant's plan).
        if (isCentral && isAdmin && routeExists('module.marketplace.index')) {
            items.push({
                name: t('shell.central_modules', undefined, 'Central Modules'),
                href: route(resolveNamedRoute('module.marketplace.index')),
                icon: <ModulesIcon />,
                current:
                    route().current('module.marketplace.*') ||
                    route().current('central.module.marketplace.*') ||
                    false,
                module: 'central-modules',
            });
        }

        // Inside a workspace, its admin picks which modules the plan covers.
        // Gated by an ability rather than a permission, so it is injected here
        // instead of being seeded as a menu row.
        if (!isCentral && isAdmin && routeExists('module.modules.index')) {
            items.push({
                name: t('shell.modules'),
                href: route(resolveNamedRoute('module.modules.index')),
                icon: <ModulesIcon />,
                current:
                    route().current('module.modules.*') ||
                    route().current('central.module.modules.*') ||
                    false,
                module: 'modules',
            });
        }

        return items;
    }, [user, isCentral, isAdmin, isReseller, centralInstallable, t, locale]);

    // Split the flat navigation into the standalone Dashboard plus collapsible
    // groups, preserving the module order defined in MENU_GROUPS.
    const dashboardItem = navigation.find((item) => item.module === 'dashboard');
    const menuGroups = useMemo(() => {
        // Surface optional modules installed onto the central dashboard under the
        // same group titles they carry on a tenant, driven by the server
        // allowlist — so a new central-installable module needs no frontend edit.
        // Skip any module a CENTRAL_MENU_GROUPS group already lists, so a module
        // that is both central-installable and already central-grouped (the
        // finance modules) is not duplicated under two headers.
        const centralGroupedKeys = new Set(
            CENTRAL_MENU_GROUPS.flatMap((group) => ('modules' in group ? group.modules : [])),
        );
        const centralInstalledGroups: MenuGroup[] = isCentral
            ? MENU_GROUPS
                .filter((group): group is { titleKey: string; modules: string[] } => 'modules' in group)
                .map((group) => ({
                    titleKey: group.titleKey,
                    modules: group.modules.filter(
                        (module) => centralInstallable.includes(module) && !centralGroupedKeys.has(module),
                    ),
                }))
                .filter((group) => group.modules.length > 0)
            : [];

        const groupsToUse = isCentral ? [...CENTRAL_MENU_GROUPS, ...centralInstalledGroups] : MENU_GROUPS;

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

        return groupsToUse.map((group) => ({
            title: t(`menu_groups.${group.titleKey}`),
            items: moduleKeysIn(group)
                .map((module) => navigation.find((item) => item.module === module))
                .filter((item): item is MenuItem => Boolean(item)),
        })).filter((group) => group.items.length > 0);
    }, [navigation, moduleTiers, centralInstallable, isCentral, t, locale]);

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
            aria-current={item.current ? 'page' : undefined}
            className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${item.current
                ? 'sidebar-nav-active bg-white/20 text-white shadow-lg backdrop-blur-sm'
                : `${theme.text} hover:bg-white/10 hover:text-white`
                }`}
        >
            <div className="flex items-center min-w-0">
                <span className={`mr-3 shrink-0 ${item.current ? 'text-white' : `${theme.textHover} group-hover:text-white`}`}>
                    {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
            </div>
            {item.module === 'payment-orders' && pageProps.pendingPaymentOrdersCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10 animate-pulse">
                    {pageProps.pendingPaymentOrdersCount}
                </span>
            )}
            {item.module === 'rental-reservation' && pageProps.pendingRentalApprovalsCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10 animate-pulse">
                    {pageProps.pendingRentalApprovalsCount}
                </span>
            )}
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
                            className={`flex w-full items-center justify-between gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase leading-snug tracking-wide transition-colors ${hasActive && !open ? 'text-white' : `${theme.text} hover:text-white`
                                }`}
                        >
                            <span className="min-w-0 flex-1 text-left">{group.title}</span>
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="brand-sidebar fixed inset-y-0 left-0 flex w-64 flex-col">
                        <div className="flex h-16 shrink-0 items-center justify-between px-4">
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
                        <SidebarNavScroll>
                            {renderNavigation()}
                        </SidebarNavScroll>
                        {/* Mobile sidebar user section */}
                        <div className={`shrink-0 border-t ${theme.border} p-4`}>
                            <Link href={route('module.profile.edit')} className="flex items-center hover:opacity-80 transition-opacity">
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
                <div className="brand-sidebar flex min-h-0 flex-1 flex-col">
                    <div className={`flex h-16 shrink-0 items-center px-4 border-b ${theme.border}`}>
                        <Link href={getDashboardRoute(user)} className="flex items-center">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-8 w-auto" />
                            ) : (
                                <ApplicationLogo className="h-8 w-auto text-white" />
                            )}
                            <span className="ml-2 text-xl font-bold text-white">{siteName}</span>
                        </Link>
                    </div>
                    <SidebarNavScroll>
                        {renderNavigation()}
                    </SidebarNavScroll>
                    {/* Desktop sidebar user section (kiri bawah) */}
                    <div className={`shrink-0 border-t ${theme.border} p-4`}>
                        <Link href={route('module.profile.edit')} className="flex items-center hover:opacity-80 transition-opacity">
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
                <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
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

                        <div className="flex items-center gap-x-3 sm:gap-x-4 lg:gap-x-5">
                            {/* Notifications Dropdown */}
                            <Menu as="div" className="relative">
                                <MenuButton className="relative -m-1.5 p-2 rounded-2xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                    {!!notifications?.unread_count && (
                                        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900 shadow-xs">
                                            {notifications.unread_count > 9 ? '9+' : notifications.unread_count}
                                        </span>
                                    )}
                                </MenuButton>

                                <MenuItems
                                    transition
                                    className="absolute right-0 z-50 mt-2.5 w-80 sm:w-96 origin-top-right rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 focus:outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">Notifikasi</span>
                                            {!!notifications?.unread_count && (
                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                                    {notifications.unread_count} Baru
                                                </span>
                                            )}
                                        </div>
                                        {!!notifications?.unread_count && (
                                            <Link
                                                href={route('module.notifications.read-all')}
                                                method="post"
                                                as="button"
                                                preserveScroll
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                                            >
                                                {t('shell.mark_all_read')}
                                            </Link>
                                        )}
                                    </div>

                                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-1">
                                        {!notifications?.recent?.length ? (
                                            <div className="py-8 px-4 text-center">
                                                <span className="text-2xl">🔔</span>
                                                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t('shell.no_notifications')}</p>
                                            </div>
                                        ) : (
                                            notifications.recent.map((item) => (
                                                <MenuItem key={item.id}>
                                                    <Link
                                                        href={item.url ?? route('module.notifications.index')}
                                                        className={`block rounded-xl px-3 py-2.5 transition ${
                                                            item.read_at
                                                                ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                                                : 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                                                            {!item.read_at && (
                                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.body}</p>
                                                        <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">{item.created_at}</p>
                                                    </Link>
                                                </MenuItem>
                                            ))
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                                        <Link
                                            href={route('module.notifications.index')}
                                            className="block rounded-xl px-3 py-2 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition"
                                        >
                                            {t('shell.view_all')} →
                                        </Link>
                                    </div>
                                </MenuItems>
                            </Menu>

                            {/* Separator */}
                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-800" />

                            <LanguageSwitcher compact />

                            {/* Separator */}
                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-800" />

                            {/* User Profile Dropdown */}
                            <Menu as="div" className="relative">
                                <MenuButton className="-m-1.5 flex items-center gap-2 rounded-2xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                    <UserAvatar user={user} size="sm" />
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            {user?.name || t('shell.user')}
                                        </span>
                                        <svg className="ml-1.5 h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                </MenuButton>

                                <MenuItems
                                    transition
                                    className="absolute right-0 z-50 mt-2.5 w-72 origin-top-right rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 focus:outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                >
                                    {/* Identity Header */}
                                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                                        <UserAvatar user={user} size="md" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user?.name || t('shell.user')}</p>
                                                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                    {isAdmin ? 'Admin' : isReseller ? 'Reseller' : 'User'}
                                                </span>
                                            </div>
                                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user?.email || ''}</p>
                                        </div>
                                    </div>

                                    <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

                                    {/* Profile */}
                                    <MenuItem>
                                        <Link
                                            href={route('module.profile.edit')}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                        >
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                                👤
                                            </span>
                                            <span>{t('shell.profile')}</span>
                                        </Link>
                                    </MenuItem>

                                    {/* Subscription — tenant only */}
                                    {!isCentral && routeExists('module.subscription.index') && (
                                        <MenuItem>
                                            <Link
                                                href={route('module.subscription.index')}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                            >
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                                                    💳
                                                </span>
                                                <span className="flex-1">Langganan</span>
                                                {subscriptionSummary?.plan_name && (
                                                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                                                        {subscriptionSummary.plan_name}
                                                    </span>
                                                )}
                                            </Link>
                                        </MenuItem>
                                    )}

                                    {/* System Settings — if available */}
                                    {routeExists('module.settings.index') && (
                                        <MenuItem>
                                            <Link
                                                href={route('module.settings.index')}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                            >
                                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    ⚙️
                                                </span>
                                                <span>Pengaturan System</span>
                                            </Link>
                                        </MenuItem>
                                    )}

                                    <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />

                                    {/* Logout */}
                                    <MenuItem>
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                        >
                                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400">
                                                🚪
                                            </span>
                                            <span>{t('shell.log_out')}</span>
                                        </Link>
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
                        </div>
                    </div>
                </div>

                {/* Page header — min-h keeps height stable with/without action buttons */}
                {header && (
                    <header className="bg-white shadow-sm dark:bg-gray-900 dark:shadow-none dark:ring-1 dark:ring-gray-800">
                        <div className="flex min-h-[4.5rem] items-center px-4 py-4 sm:px-6 lg:px-8">
                            <div className="w-full dark:text-gray-100">{header}</div>
                        </div>
                    </header>
                )}

                {/* Main content area */}
                <main className="py-6 dark:text-gray-100">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
                <FlashSnackbar />
            </div>
        </div>
    );
}

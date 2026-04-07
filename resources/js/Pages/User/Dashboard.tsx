import UserLayout from '@/Layouts/UserLayout';
import { Head, Link, usePage } from '@inertiajs/react';

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
}

const WelcomeIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
);

const ProfileIcon = () => (
    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PagesIcon = () => (
    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const MediaIcon = () => (
    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

// Helper function to check if a route exists
const routeExists = (routeName: string): boolean => {
    try {
        route(routeName);
        return true;
    } catch {
        return false;
    }
};

export default function Dashboard({ user }: Props): JSX.Element {
    const { auth } = usePage().props as any;
    const permissions = auth.user?.permissions || {};
    const permissionModules = Object.keys(permissions);

    // Check which modules the user has access to
    const hasPageAccess = permissions['pages']?.includes('view') && routeExists('user.pages.index');
    const hasPostAccess = permissions['posts']?.includes('view') && routeExists('user.posts.index');
    const hasMediaAccess = permissions['media']?.includes('view') && routeExists('user.media.index');
    const hasCarouselAccess = permissions['carousels']?.includes('view') && routeExists('user.carousels.index');
    const hasAnalyticsAccess = permissions['analytics']?.includes('view') && routeExists('user.analytics.index');
    const hasSettingsAccess = permissions['settings']?.includes('view') && routeExists('user.settings.index');

    return (
        <UserLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                </div>
            }
        >
            <Head title="Dashboard" />

            {/* Welcome Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 shadow-lg mb-8">
                <div className="relative z-10">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                            <WelcomeIcon />
                        </div>
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold text-white">
                                Welcome back, {user.name}!
                            </h2>
                            <p className="text-emerald-100">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                            <span
                                key={role}
                                className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                            >
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute right-8 bottom-0 -mb-8 h-24 w-24 rounded-full bg-white/10" />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Profile */}
                    <Link
                        href={route('profile.edit')}
                        className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                            <ProfileIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Edit Profile</p>
                            <p className="text-xs text-gray-500">Update your information</p>
                        </div>
                    </Link>

                    {/* Pages - if user has access */}
                    {hasPageAccess && (
                        <Link
                            href={route('user.pages.index')}
                            className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                <PagesIcon />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">Manage Pages</p>
                                <p className="text-xs text-gray-500">View and edit pages</p>
                            </div>
                        </Link>
                    )}

                    {/* Media - if user has access */}
                    {hasMediaAccess && (
                        <Link
                            href={route('user.media.index')}
                            className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                <MediaIcon />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">Media Library</p>
                                <p className="text-xs text-gray-500">Manage your files</p>
                            </div>
                        </Link>
                    )}

                    {/* Settings - if user has access */}
                    {hasSettingsAccess && (
                        <Link
                            href={route('user.settings.index')}
                            className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <SettingsIcon />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">Settings</p>
                                <p className="text-xs text-gray-500">Configure options</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Permissions Overview Card */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Your Permissions
                    </h3>
                </div>
                <div className="p-6">
                    {permissionModules.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {permissionModules.map((module) => (
                                <div key={module} className="rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-200 hover:shadow-sm">
                                    <h4 className="font-medium text-gray-800 capitalize mb-2">
                                        {module.replace('-', ' ')}
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {permissions[module].map((action: string) => (
                                            <span
                                                key={action}
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">
                                No specific permissions assigned. Contact an administrator for access.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Available Modules */}
            {(hasPageAccess || hasPostAccess || hasMediaAccess || hasCarouselAccess || hasAnalyticsAccess || hasSettingsAccess) && (
                <div className="mt-8 rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Available Modules
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {hasPageAccess && (
                                <Link
                                    href={route('user.pages.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                                        <PagesIcon />
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Pages</p>
                                        <p className="text-sm text-gray-500">Manage website pages</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}

                            {hasPostAccess && (
                                <Link
                                    href={route('user.posts.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Posts</p>
                                        <p className="text-sm text-gray-500">Manage blog posts</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}

                            {hasMediaAccess && (
                                <Link
                                    href={route('user.media.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                                        <MediaIcon />
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Media</p>
                                        <p className="text-sm text-gray-500">Manage media files</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}

                            {hasCarouselAccess && (
                                <Link
                                    href={route('user.carousels.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                                        <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Carousels</p>
                                        <p className="text-sm text-gray-500">Manage carousels</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}

                            {hasAnalyticsAccess && (
                                <Link
                                    href={route('user.analytics.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Analytics</p>
                                        <p className="text-sm text-gray-500">View statistics</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}

                            {hasSettingsAccess && (
                                <Link
                                    href={route('user.settings.index')}
                                    className="group flex items-center rounded-lg border border-gray-200 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                        <SettingsIcon />
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Settings</p>
                                        <p className="text-sm text-gray-500">Configure settings</p>
                                    </div>
                                    <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
}

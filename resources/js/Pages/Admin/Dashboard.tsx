import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link } from '@inertiajs/react';

interface Activity {
    id: string;
    type: string;
    description: string;
    time: string;
}

interface RecentPage {
    id: number;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: string;
}

interface Props {
    stats: {
        totalUsers: number;
        userGrowth: number;
        totalPages: number;
        publishedPages: number;
        pageGrowth: number;
        totalMedia: number;
        mediaGrowth: number;
        totalStorage: string;
        totalCarousels: number;
        activeCarousels: number;
    };
    recentActivity: Activity[];
    quickStats: {
        todos: {
            total: number;
            completed: number;
            pending: number;
            completionRate: number;
        };
        recentPages: RecentPage[];
        trends: {
            labels: string[];
            pages: number[];
            users: number[];
        };
    };
}

const UsersIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const PagesIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const MediaIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const CarouselIcon = () => (
    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
);

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'page_created':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            );
        case 'user_registered':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                </div>
            );
        case 'page_updated':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </div>
            );
        case 'media_uploaded':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                </div>
            );
        case 'carousel_created':
        case 'carousel_updated':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                    </svg>
                </div>
            );
        case 'todo_completed':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        case 'todo_created':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
    }
};

const GrowthBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isPositive
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
            }`}
        >
            {isPositive ? (
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
            ) : (
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            )}
            {isPositive ? '+' : ''}{value}%
        </span>
    );
};

const SimpleBarChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
    const maxValue = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between gap-1 h-20">
            {data.map((value, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                    <div
                        className={`w-full ${color} rounded-t transition-all duration-300`}
                        style={{ height: `${(value / maxValue) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-gray-400 mt-1">{labels[index]}</span>
                </div>
            ))}
        </div>
    );
};

export default function Dashboard({ stats, recentActivity, quickStats }: Props): JSX.Element {
    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Dashboard
                    </h1>
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route('admin.analytics.index')}
                            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                            View Analytics
                        </Link>
                        <Link
                            href={route('admin.pages.create')}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            New Page
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Admin Dashboard" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                            <UsersIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <GrowthBadge value={stats.userGrowth} />
                        <span className="ml-2 text-xs text-gray-500">vs last month</span>
                    </div>
                </div>

                {/* Total Pages */}
                <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                            <PagesIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Pages</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalPages.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <GrowthBadge value={stats.pageGrowth} />
                        <span className="ml-2 text-xs text-gray-500">{stats.publishedPages} published</span>
                    </div>
                </div>

                {/* Total Media */}
                <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30">
                            <MediaIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Media Files</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalMedia.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <GrowthBadge value={stats.mediaGrowth} />
                        <span className="ml-2 text-xs text-gray-500">{stats.totalStorage}</span>
                    </div>
                </div>

                {/* Total Carousels */}
                <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
                            <CarouselIcon />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Carousels</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCarousels.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            {stats.activeCarousels} active
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                                        {getActivityIcon(activity.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-500">{activity.time}</p>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="mt-2 text-sm">No recent activity</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-100 px-6 py-4">
                            <Link href={route('admin.analytics.index')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                View all activity →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Todo Stats */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Todo Progress */}
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Todo Progress</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{quickStats.todos.completionRate}%</p>
                                    <p className="text-sm text-gray-500">Completion Rate</p>
                                </div>
                                <div className="relative h-16 w-16">
                                    <svg className="h-16 w-16 -rotate-90 transform">
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-gray-200"
                                        />
                                        <circle
                                            cx="32"
                                            cy="32"
                                            r="28"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${quickStats.todos.completionRate * 1.76} 176`}
                                            className="text-indigo-600"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-green-50 p-3">
                                    <p className="text-2xl font-bold text-green-700">{quickStats.todos.completed}</p>
                                    <p className="text-xs text-green-600">Completed</p>
                                </div>
                                <div className="rounded-lg bg-orange-50 p-3">
                                    <p className="text-2xl font-bold text-orange-700">{quickStats.todos.pending}</p>
                                    <p className="text-xs text-orange-600">Pending</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <Link
                                href={route('admin.pages.create')}
                                className="flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Create New Page</p>
                                    <p className="text-xs text-gray-500">Add a new page to your site</p>
                                </div>
                            </Link>
                            <Link
                                href={route('admin.users.create')}
                                className="flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Add New User</p>
                                    <p className="text-xs text-gray-500">Invite team members</p>
                                </div>
                            </Link>
                            <Link
                                href={route('admin.media.create')}
                                className="flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Upload Media</p>
                                    <p className="text-xs text-gray-500">Add images and files</p>
                                </div>
                            </Link>
                            <Link
                                href={route('admin.settings.index')}
                                className="flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-900">Site Settings</p>
                                    <p className="text-xs text-gray-500">Configure your website</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Pages & Trends */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Pages */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Pages</h2>
                            <Link
                                href={route('admin.pages.index')}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                View all →
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {quickStats.recentPages.length > 0 ? (
                            quickStats.recentPages.map((page) => (
                                <div key={page.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={route('admin.pages.edit', page.id)}
                                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                                        >
                                            {page.title}
                                        </Link>
                                        <p className="text-xs text-gray-500">/{page.slug} • {page.createdAt}</p>
                                    </div>
                                    <span
                                        className={`ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            page.isPublished
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {page.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <p className="mt-2 text-sm">No pages yet</p>
                                <Link
                                    href={route('admin.pages.create')}
                                    className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Create your first page →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 7-Day Trends */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">7-Day Overview</h2>
                            <Link
                                href={route('admin.analytics.index')}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Full analytics →
                            </Link>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Pages Created</span>
                                <span className="text-sm text-gray-500">{quickStats.trends.pages.reduce((a, b) => a + b, 0)} total</span>
                            </div>
                            <SimpleBarChart data={quickStats.trends.pages} labels={quickStats.trends.labels} color="bg-green-500" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Users Registered</span>
                                <span className="text-sm text-gray-500">{quickStats.trends.users.reduce((a, b) => a + b, 0)} total</span>
                            </div>
                            <SimpleBarChart data={quickStats.trends.users} labels={quickStats.trends.labels} color="bg-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link } from '@inertiajs/react';

interface MediaByType {
    type: string;
    count: number;
    totalSize: number;
    humanSize: string;
}

interface RecentMedia {
    id: number;
    name: string;
    type: string;
    size: number;
    humanSize: string;
    createdAt: string;
}

interface TopContributor {
    id: number;
    name: string;
    email: string;
    pagesCount: number;
    mediaCount: number;
    carouselsCount: number;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

interface Activity {
    id: string;
    type: string;
    description: string;
    time: string;
    timeForHumans: string;
}

interface Props {
    overview: {
        totalUsers: number;
        totalPages: number;
        publishedPages: number;
        totalMedia: number;
        totalCarousels: number;
        totalTodos: number;
        completedTodos: number;
        totalSettings: number;
    };
    contentStats: {
        pages: {
            published: number;
            draft: number;
            total: number;
            hasHomepage: boolean;
        };
        carousels: {
            active: number;
            inactive: number;
            total: number;
            totalImages: number;
        };
        liveUpdates: {
            active: number;
            inactive: number;
            total: number;
        };
        todos: {
            completed: number;
            pending: number;
            total: number;
            completionRate: number;
        };
    };
    mediaStats: {
        byType: MediaByType[];
        totalFiles: number;
        totalStorageUsed: number;
        humanStorageUsed: string;
        recentUploads: RecentMedia[];
    };
    userStats: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        growthRate: number;
        verified: number;
        unverified: number;
        topContributors: TopContributor[];
        recentUsers: RecentUser[];
    };
    recentActivity: Activity[];
    trendsData: {
        labels: string[];
        pages: number[];
        users: number[];
        media: number[];
    };
}

const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: JSX.Element;
    color: string;
}) => (
    <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:shadow-md">
        <div className="flex items-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color} shadow-lg`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
        </div>
    </div>
);

const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="h-2 w-full rounded-full bg-gray-200">
            <div
                className={`h-2 rounded-full ${color}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

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
        case 'page_updated':
            return (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
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

const SimpleBarChart = ({ data, labels, color }: { data: number[]; labels: string[]; color: string }) => {
    const maxValue = Math.max(...data, 1);
    return (
        <div className="flex items-end justify-between gap-2 h-32">
            {data.map((value, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                    <div
                        className={`w-full ${color} rounded-t transition-all duration-300`}
                        style={{ height: `${(value / maxValue) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-gray-500 mt-2">{labels[index]}</span>
                </div>
            ))}
        </div>
    );
};

export default function Index({
    overview,
    contentStats,
    mediaStats,
    userStats,
    recentActivity,
    trendsData,
}: Props): JSX.Element {
    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Overview of your CMS performance and statistics
                        </p>
                    </div>
                    <Link
                        href={route('admin.dashboard')}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Analytics" />

            {/* Overview Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={overview.totalUsers}
                    subtitle={`${userStats.thisMonth} this month`}
                    icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                    }
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Total Pages"
                    value={overview.totalPages}
                    subtitle={`${overview.publishedPages} published`}
                    icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    }
                    color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatCard
                    title="Media Files"
                    value={overview.totalMedia}
                    subtitle={mediaStats.humanStorageUsed}
                    icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    }
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                    title="Carousels"
                    value={overview.totalCarousels}
                    subtitle={`${contentStats.carousels.totalImages} images`}
                    icon={
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
                        </svg>
                    }
                    color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                />
            </div>

            {/* Content & Activity Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Content Statistics */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Content Statistics</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                {/* Pages */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">Pages</h3>
                                        <span className="text-2xl font-bold text-gray-900">{contentStats.pages.total}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Published</span>
                                            <span className="font-medium text-green-600">{contentStats.pages.published}</span>
                                        </div>
                                        <ProgressBar value={contentStats.pages.published} max={contentStats.pages.total} color="bg-green-500" />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Draft</span>
                                            <span className="font-medium text-yellow-600">{contentStats.pages.draft}</span>
                                        </div>
                                        <ProgressBar value={contentStats.pages.draft} max={contentStats.pages.total} color="bg-yellow-500" />
                                    </div>
                                    {contentStats.pages.hasHomepage && (
                                        <div className="mt-3 flex items-center text-xs text-green-600">
                                            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Homepage configured
                                        </div>
                                    )}
                                </div>

                                {/* Carousels */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">Carousels</h3>
                                        <span className="text-2xl font-bold text-gray-900">{contentStats.carousels.total}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Active</span>
                                            <span className="font-medium text-green-600">{contentStats.carousels.active}</span>
                                        </div>
                                        <ProgressBar value={contentStats.carousels.active} max={contentStats.carousels.total} color="bg-green-500" />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Inactive</span>
                                            <span className="font-medium text-gray-600">{contentStats.carousels.inactive}</span>
                                        </div>
                                        <ProgressBar value={contentStats.carousels.inactive} max={contentStats.carousels.total} color="bg-gray-400" />
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">
                                        {contentStats.carousels.totalImages} total images
                                    </div>
                                </div>

                                {/* Todos */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">Todos</h3>
                                        <span className="text-2xl font-bold text-gray-900">{contentStats.todos.total}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Completed</span>
                                            <span className="font-medium text-green-600">{contentStats.todos.completed}</span>
                                        </div>
                                        <ProgressBar value={contentStats.todos.completed} max={contentStats.todos.total} color="bg-green-500" />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Pending</span>
                                            <span className="font-medium text-orange-600">{contentStats.todos.pending}</span>
                                        </div>
                                        <ProgressBar value={contentStats.todos.pending} max={contentStats.todos.total} color="bg-orange-500" />
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">
                                        {contentStats.todos.completionRate}% completion rate
                                    </div>
                                </div>

                                {/* Live Updates */}
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-900">Live Updates</h3>
                                        <span className="text-2xl font-bold text-gray-900">{contentStats.liveUpdates.total}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Active</span>
                                            <span className="font-medium text-green-600">{contentStats.liveUpdates.active}</span>
                                        </div>
                                        <ProgressBar value={contentStats.liveUpdates.active} max={contentStats.liveUpdates.total} color="bg-green-500" />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Inactive</span>
                                            <span className="font-medium text-gray-600">{contentStats.liveUpdates.inactive}</span>
                                        </div>
                                        <ProgressBar value={contentStats.liveUpdates.inactive} max={contentStats.liveUpdates.total} color="bg-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-100 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                                        {getActivityIcon(activity.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-500">{activity.timeForHumans}</p>
                                        </div>
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
                    </div>
                </div>
            </div>

            {/* Trends & User Stats */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Trends Chart */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">7-Day Trends</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Pages Created</span>
                                    <span className="text-sm text-gray-500">{trendsData.pages.reduce((a, b) => a + b, 0)} total</span>
                                </div>
                                <SimpleBarChart data={trendsData.pages} labels={trendsData.labels} color="bg-green-500" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Users Registered</span>
                                    <span className="text-sm text-gray-500">{trendsData.users.reduce((a, b) => a + b, 0)} total</span>
                                </div>
                                <SimpleBarChart data={trendsData.users} labels={trendsData.labels} color="bg-blue-500" />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Media Uploaded</span>
                                    <span className="text-sm text-gray-500">{trendsData.media.reduce((a, b) => a + b, 0)} total</span>
                                </div>
                                <SimpleBarChart data={trendsData.media} labels={trendsData.labels} color="bg-purple-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Statistics */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">User Statistics</h2>
                    </div>
                    <div className="p-6">
                        {/* User Growth */}
                        <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">User Growth</p>
                                    <p className="text-2xl font-bold text-gray-900">{userStats.total} users</p>
                                </div>
                                <div className={`flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                    userStats.growthRate >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {userStats.growthRate >= 0 ? (
                                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                        </svg>
                                    ) : (
                                        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    )}
                                    {userStats.growthRate}%
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <span>{userStats.thisMonth} this month</span>
                                <span>•</span>
                                <span>{userStats.lastMonth} last month</span>
                            </div>
                        </div>

                        {/* Verification Status */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Status</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-500">Verified</span>
                                        <span className="font-medium text-green-600">{userStats.verified}</span>
                                    </div>
                                    <ProgressBar value={userStats.verified} max={userStats.total} color="bg-green-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-500">Unverified</span>
                                        <span className="font-medium text-yellow-600">{userStats.unverified}</span>
                                    </div>
                                    <ProgressBar value={userStats.unverified} max={userStats.total} color="bg-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {/* Top Contributors */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Top Contributors</h3>
                            <div className="space-y-3">
                                {userStats.topContributors.length > 0 ? (
                                    userStats.topContributors.slice(0, 3).map((user, index) => (
                                        <div key={user.id} className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {user.pagesCount} pages • {user.mediaCount} media • {user.carouselsCount} carousels
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No contributors yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Statistics */}
            <div className="mt-8">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
                            <Link
                                href={route('admin.media.index')}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                View all →
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Storage Overview */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Storage Overview</h3>
                                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Total Storage Used</span>
                                        <span className="text-xl font-bold text-gray-900">{mediaStats.humanStorageUsed}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{mediaStats.totalFiles} files uploaded</p>
                                </div>

                                {/* Media by Type */}
                                <div className="mt-4 space-y-3">
                                    {mediaStats.byType.length > 0 ? (
                                        mediaStats.byType.map((item) => (
                                            <div key={item.type} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${
                                                        item.type === 'image' ? 'bg-blue-500' :
                                                        item.type === 'video' ? 'bg-red-500' :
                                                        item.type === 'document' ? 'bg-green-500' : 'bg-gray-500'
                                                    }`} />
                                                    <span className="text-sm text-gray-600 capitalize">{item.type}</span>
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-medium text-gray-900">{item.count}</span>
                                                    <span className="text-gray-500 ml-2">({item.humanSize})</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No media files yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Uploads */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Uploads</h3>
                                <div className="space-y-3">
                                    {mediaStats.recentUploads.length > 0 ? (
                                        mediaStats.recentUploads.map((media) => (
                                            <div key={media.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                                    media.type === 'image' ? 'bg-blue-100' :
                                                    media.type === 'video' ? 'bg-red-100' :
                                                    media.type === 'document' ? 'bg-green-100' : 'bg-gray-100'
                                                }`}>
                                                    {media.type === 'image' ? (
                                                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                        </svg>
                                                    ) : media.type === 'video' ? (
                                                        <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{media.name}</p>
                                                    <p className="text-xs text-gray-500">{media.humanSize} • {media.createdAt}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-500">No media uploaded yet</p>
                                            <Link
                                                href={route('admin.media.create')}
                                                className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                                Upload your first file →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Post {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string;
}

interface Page {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    created_at: string;
}

interface Stats {
    // Absent when the tenant has not installed the Posts module.
    posts?: {
        total: number;
        published: number;
        draft: number;
    };
    // Absent when the tenant has not installed the Pages module.
    pages?: {
        total: number;
        published: number;
        draft: number;
    };
    media: {
        total: number;
        images: number;
        documents: number;
    };
    // Absent when the tenant has not installed the Carousels module.
    carousels?: {
        total: number;
        active: number;
    };
}

interface Props {
    user: {
        name: string;
        email: string;
        roles: string[];
    };
    primaryRole: {
        name: string;
        slug: string;
    } | null;
    stats: Stats;
    recentPosts: Post[];
    recentPages: Page[];
}

// Icon Components
const DocumentTextIcon = () => (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const NewspaperIcon = () => (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

const PhotoIcon = () => (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const RectangleStackIcon = () => (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
);

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

const ClockIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SparklesIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const UserCircleIcon = () => (
    <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    color: 'cyan' | 'emerald' | 'amber' | 'rose';
    href: string;
}

const StatCard = ({ title, value, subtitle, icon, color, href }: StatCardProps) => {
    const colorClasses = {
        cyan: {
            bg: 'bg-cyan-50',
            icon: 'text-cyan-600',
            ring: 'ring-cyan-500/10',
            hover: 'hover:bg-cyan-100',
        },
        emerald: {
            bg: 'bg-emerald-50',
            icon: 'text-emerald-600',
            ring: 'ring-emerald-500/10',
            hover: 'hover:bg-emerald-100',
        },
        amber: {
            bg: 'bg-amber-50',
            icon: 'text-amber-600',
            ring: 'ring-amber-500/10',
            hover: 'hover:bg-amber-100',
        },
        rose: {
            bg: 'bg-rose-50',
            icon: 'text-rose-600',
            ring: 'ring-rose-500/10',
            hover: 'hover:bg-rose-100',
        },
    };

    const classes = colorClasses[color];

    return (
        <Link
            href={href}
            className={`group relative overflow-hidden rounded-2xl ${classes.bg} p-6 ring-1 ${classes.ring} transition-all duration-300 ${classes.hover} hover:shadow-lg hover:scale-[1.02]`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-4xl font-bold text-gray-900">{value}</p>
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                </div>
                <div className={`rounded-xl ${classes.bg} p-3 ${classes.icon}`}>
                    {icon}
                </div>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowRightIcon />
            </div>
        </Link>
    );
};

interface QuickActionProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

const QuickAction = ({ title, description, href, icon, color }: QuickActionProps) => (
    <Link
        href={href}
        className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition-all duration-300 hover:shadow-md hover:ring-gray-900/10"
    >
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white transition-transform duration-300 group-hover:scale-110`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <ArrowRightIcon />
    </Link>
);

interface RecentItemProps {
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: string;
    href: string;
}

const RecentItem = ({ title, isPublished, createdAt, href }: RecentItemProps) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Baru saja';
        if (diffInHours < 24) return `${diffInHours} jam lalu`;
        if (diffInHours < 48) return 'Kemarin';
        return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    };

    return (
        <Link
            href={href}
            className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
        >
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 group-hover:text-cyan-600">
                    {title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <ClockIcon />
                    <span>{formatDate(createdAt)}</span>
                </div>
            </div>
            <span
                className={`ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}
            >
                {isPublished ? 'Terbit' : 'Draft'}
            </span>
        </Link>
    );
};

export default function Dashboard({ user, primaryRole, stats, recentPosts, recentPages }: Props): JSX.Element {
    const { auth } = usePage().props as any;
    const permissions = auth.user?.permissions || {};
    const permissionModules = Object.keys(permissions);
    const [activeTab, setActiveTab] = useState<'posts' | 'pages'>('posts');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 18) return 'Selamat Siang';
        return 'Selamat Malam';
    };

    const getFirstName = (name: string) => name.split(' ')[0];

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {primaryRole ? `Dashboard ${primaryRole.name}` : 'Dashboard Modul'}
                    </h2>
                </div>
            }
        >
            <Head title={primaryRole ? `Dashboard ${primaryRole.name}` : 'Dashboard Modul'} />

            <div className="space-y-8">
                {/* Welcome Section - Sky Track Theme */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-xl">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
                    <div className="relative flex items-center gap-6">
                        <div className="hidden sm:block">
                            <div className="rounded-full bg-white/10 p-2 backdrop-blur-sm border border-white/20">
                                <UserCircleIcon />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <SparklesIcon />
                                <span className="text-sm font-medium text-white/70">
                                    {getGreeting()}
                                </span>
                            </div>
                            <h1 className="mt-1 text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                                Selamat Datang, {getFirstName(user.name)}!
                            </h1>
                            <p className="mt-2 text-white/70">
                                {primaryRole ? (
                                    <>Anda masuk sebagai <span className="font-semibold text-cyan-400">{primaryRole.name}</span></>
                                ) : (
                                    <>Siap mengelola konten Anda?</>
                                )}
                            </p>
                        </div>
                        <div className="hidden lg:block">
                            <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/20">
                                <p className="text-sm text-white/70">Peran</p>
                                <p className="font-semibold text-white">{user.roles.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.posts && (
                        <StatCard
                            title="Total Postingan"
                            value={stats.posts.total}
                            subtitle={`${stats.posts.published} terbit, ${stats.posts.draft} draft`}
                            icon={<NewspaperIcon />}
                            color="cyan"
                            href={route('module.posts.index')}
                        />
                    )}
                    {stats.pages && (
                        <StatCard
                            title="Total Halaman"
                            value={stats.pages.total}
                            subtitle={`${stats.pages.published} terbit, ${stats.pages.draft} draft`}
                            icon={<DocumentTextIcon />}
                            color="emerald"
                            href={route('module.pages.index')}
                        />
                    )}
                    <StatCard
                        title="File Media"
                        value={stats.media.total}
                        subtitle={`${stats.media.images} gambar, ${stats.media.documents} dokumen`}
                        icon={<PhotoIcon />}
                        color="amber"
                        href={route('module.media.index')}
                    />
                    {stats.carousels && (
                        <StatCard
                            title="Carousel"
                            value={stats.carousels.total}
                            subtitle={`${stats.carousels.active} aktif`}
                            icon={<RectangleStackIcon />}
                            color="rose"
                            href={route('module.carousels.index')}
                        />
                    )}
                </div>

                {/* Quick Actions & Recent Activity */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <PlusIcon />
                                Aksi Cepat
                            </h3>
                            <div className="mt-4 space-y-3">
                                {stats.posts && (
                                    <QuickAction
                                        title="Postingan Baru"
                                        description="Buat postingan blog"
                                        href={route('module.posts.create')}
                                        icon={<NewspaperIcon />}
                                        color="bg-gradient-to-r from-cyan-500 to-blue-600"
                                    />
                                )}
                                {stats.pages && (
                                    <QuickAction
                                        title="Halaman Baru"
                                        description="Buat halaman baru"
                                        href={route('module.pages.create')}
                                        icon={<DocumentTextIcon />}
                                        color="bg-gradient-to-r from-emerald-500 to-teal-600"
                                    />
                                )}
                                <QuickAction
                                    title="Upload Media"
                                    description="Tambah gambar atau file"
                                    href={route('module.media.create')}
                                    icon={<PhotoIcon />}
                                    color="bg-gradient-to-r from-amber-500 to-orange-600"
                                />
                                {stats.carousels && (
                                    <QuickAction
                                        title="Carousel Baru"
                                        description="Buat slideshow"
                                        href={route('module.carousels.create')}
                                        icon={<RectangleStackIcon />}
                                        color="bg-gradient-to-r from-rose-500 to-pink-600"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Aktivitas Terbaru
                                </h3>
                                <div className="flex rounded-lg bg-gray-100 p-1">
                                    <button
                                        onClick={() => setActiveTab('posts')}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                            activeTab === 'posts'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Postingan
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pages')}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                            activeTab === 'pages'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Halaman
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                {activeTab === 'posts' ? (
                                    recentPosts.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {recentPosts.map((post) => (
                                                <RecentItem
                                                    key={post.id}
                                                    title={post.title}
                                                    slug={post.slug}
                                                    isPublished={post.is_published}
                                                    createdAt={post.created_at}
                                                    href={route('module.posts.edit', post.id)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <NewspaperIcon />
                                            <p className="mt-2 text-sm text-gray-500">
                                                Belum ada postingan. Buat postingan pertama Anda!
                                            </p>
                                            <Link
                                                href={route('module.posts.create')}
                                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-blue-500"
                                            >
                                                <PlusIcon />
                                                Buat Postingan
                                            </Link>
                                        </div>
                                    )
                                ) : recentPages.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {recentPages.map((page) => (
                                            <RecentItem
                                                key={page.id}
                                                title={page.title}
                                                slug={page.slug}
                                                isPublished={page.is_published}
                                                createdAt={page.created_at}
                                                href={route('module.pages.edit', page.id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <DocumentTextIcon />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Belum ada halaman. Buat halaman pertama Anda!
                                        </p>
                                        <Link
                                            href={route('module.pages.create')}
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-medium text-white hover:from-emerald-400 hover:to-teal-500"
                                        >
                                            <PlusIcon />
                                            Buat Halaman
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {((activeTab === 'posts' && recentPosts.length > 0) ||
                                (activeTab === 'pages' && recentPages.length > 0)) && (
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <Link
                                        href={activeTab === 'posts' ? route('module.posts.index') : route('module.pages.index')}
                                        className="flex items-center justify-center gap-2 text-sm font-medium text-cyan-600 hover:text-cyan-700"
                                    >
                                        Lihat semua {activeTab === 'posts' ? 'postingan' : 'halaman'}
                                        <ArrowRightIcon />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Permissions Overview */}
                {permissionModules.length > 0 && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Izin Akses Anda
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Berikut adalah akses yang Anda miliki dalam sistem ini
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {permissionModules.map((module) => (
                                <div
                                    key={module}
                                    className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-cyan-200 hover:bg-cyan-50/50"
                                >
                                    <h4 className="font-medium capitalize text-gray-800">
                                        {module.replace('-', ' ')}
                                    </h4>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {permissions[module].map((action: string) => (
                                            <span
                                                key={action}
                                                className="inline-flex items-center rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

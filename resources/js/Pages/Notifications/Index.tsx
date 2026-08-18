import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Notification {
    id: string;
    title: string;
    body: string;
    url: string | null;
    icon?: string;
    type?: string;
    read_at: string | null;
    created_at: string | null;
    created_at_human?: string;
}

interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Counts {
    total: number;
    unread: number;
    read: number;
}

interface Filters {
    tab?: 'all' | 'unread' | 'read';
    search?: string | null;
}

interface Props {
    notifications: PaginatedNotifications;
    counts?: Counts;
    filters?: Filters;
}

// Icon helper rendering semantic SVG icons based on type/icon
function NotificationTypeIcon({ icon, type }: { icon?: string; type?: string }) {
    if (icon === 'tracking' || icon === 'location' || type === 'tracking' || type === 'warning') {
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        );
    }

    if (icon === 'payment' || icon === 'dollar' || type === 'success' || type === 'finance') {
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        );
    }

    if (icon === 'document' || icon === 'file' || type === 'document') {
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        );
    }

    if (type === 'danger' || type === 'error') {
        return (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        </div>
    );
}

export default function Index({ notifications, counts, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const currentTab = filters?.tab || 'all';
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

    const totalCount = counts?.total ?? notifications.total;
    const unreadCount = counts?.unread ?? notifications.data.filter((n) => !n.read_at).length;
    const readCount = counts?.read ?? Math.max(0, totalCount - unreadCount);

    const applyFilter = (newTab: 'all' | 'unread' | 'read', search?: string) => {
        router.get(
            route('module.notifications.index'),
            {
                tab: newTab !== 'all' ? newTab : undefined,
                search: search !== undefined ? (search || undefined) : (searchQuery || undefined),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilter(currentTab, searchQuery);
    };

    const open = (notification: Notification) => {
        if (!notification.read_at) {
            router.post(route('module.notifications.read', notification.id), {}, { preserveScroll: true });
        }
        if (notification.url) {
            router.get(notification.url);
        }
    };

    const toggleReadStatus = (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        if (notification.read_at) {
            router.post(route('module.notifications.unread', notification.id), {}, { preserveScroll: true });
        } else {
            router.post(route('module.notifications.read', notification.id), {}, { preserveScroll: true });
        }
    };

    const markAllRead = () => {
        router.post(route('module.notifications.read-all'), {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deletingNotification) return;
        router.delete(route('module.notifications.destroy', deletingNotification.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingNotification(null),
        });
    };

    const confirmDeleteAll = () => {
        router.delete(route('module.notifications.destroy-all'), {
            preserveScroll: true,
            onSuccess: () => setShowDeleteAllModal(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('notifications.title', undefined, 'Pusat Notifikasi')}
                    subtitle={t('notifications.subtitle', undefined, 'Kelola seluruh alert operasional, peringatan GPS, transaksi, dan aktivitas sistem Anda.')}
                    actions={
                        <div className="flex flex-wrap items-center gap-2.5">
                            {unreadCount > 0 && (
                                <PrimaryButton
                                    type="button"
                                    onClick={markAllRead}
                                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('notifications.mark_all_read', undefined, 'Tandai Semua Terbaca')}
                                </PrimaryButton>
                            )}

                            {totalCount > 0 && (
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setShowDeleteAllModal(true)}
                                    className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('notifications.delete_all', undefined, 'Hapus Semua')}
                                </SecondaryButton>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title={t('notifications.title', undefined, 'Pusat Notifikasi')} />

            {/* Quick Metrics Bar */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                    type="button"
                    onClick={() => applyFilter('all')}
                    className={`flex items-center justify-between rounded-2xl p-4 text-left border transition ${
                        currentTab === 'all'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                    <div className="space-y-0.5">
                        <p className={`text-xs font-semibold uppercase tracking-wider ${currentTab === 'all' ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {t('notifications.tabs.all', undefined, 'Semua Notifikasi')}
                        </p>
                        <p className="text-2xl font-black">{totalCount}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        currentTab === 'all' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => applyFilter('unread')}
                    className={`flex items-center justify-between rounded-2xl p-4 text-left border transition ${
                        currentTab === 'unread'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-semibold uppercase tracking-wider ${currentTab === 'unread' ? 'text-amber-100' : 'text-slate-500'}`}>
                                {t('notifications.tabs.unread', undefined, 'Belum Dibaca')}
                            </p>
                            {unreadCount > 0 && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-black">{unreadCount}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        currentTab === 'unread' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                    }`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => applyFilter('read')}
                    className={`flex items-center justify-between rounded-2xl p-4 text-left border transition ${
                        currentTab === 'read'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                    <div className="space-y-0.5">
                        <p className={`text-xs font-semibold uppercase tracking-wider ${currentTab === 'read' ? 'text-emerald-100' : 'text-slate-500'}`}>
                            {t('notifications.tabs.read', undefined, 'Sudah Dibaca')}
                        </p>
                        <p className="text-2xl font-black">{readCount}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        currentTab === 'read' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white p-3 border border-slate-200/80 shadow-sm">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => applyFilter('all')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                            currentTab === 'all'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {t('notifications.tabs.all', undefined, 'Semua')} ({totalCount})
                    </button>

                    <button
                        type="button"
                        onClick={() => applyFilter('unread')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                            currentTab === 'unread'
                                ? 'bg-white text-amber-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {t('notifications.tabs.unread', undefined, 'Belum Dibaca')} ({unreadCount})
                    </button>

                    <button
                        type="button"
                        onClick={() => applyFilter('read')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                            currentTab === 'read'
                                ? 'bg-white text-emerald-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {t('notifications.tabs.read', undefined, 'Sudah Dibaca')} ({readCount})
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder={t('notifications.search_placeholder', undefined, 'Cari notifikasi…')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                applyFilter(currentTab, '');
                            }}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </form>
            </div>

            {/* Notification List Container */}
            <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
                {notifications.data.length === 0 ? (
                    <div className="py-16 text-center px-4">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 mb-4 ring-8 ring-indigo-50/50">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            {filters?.search || filters?.tab
                                ? t('notifications.empty_filter', undefined, 'Tidak ada notifikasi yang cocok dengan filter.')
                                : t('notifications.empty_title', undefined, 'Semua Beres! Tidak Ada Notifikasi')}
                        </h3>
                        <p className="mt-1 max-w-sm mx-auto text-xs text-slate-500 leading-relaxed">
                            {filters?.search || filters?.tab
                                ? 'Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat notifikasi lain.'
                                : t('notifications.empty_hint', undefined, 'Alert operasional, status GPS, dan transaksi baru akan muncul di sini secara realtime.')}
                        </p>
                        {(filters?.search || filters?.tab) && (
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        applyFilter('all', '');
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    🔄 Reset Filter
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {notifications.data.map((notification) => {
                            const isUnread = !notification.read_at;

                            return (
                                <li
                                    key={notification.id}
                                    onClick={() => open(notification)}
                                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 transition cursor-pointer ${
                                        isUnread
                                            ? 'bg-gradient-to-r from-indigo-50/50 via-white to-white hover:bg-indigo-50/70 border-l-4 border-l-indigo-600'
                                            : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent'
                                    }`}
                                >
                                    {/* Content & Icon */}
                                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                        <NotificationTypeIcon icon={notification.icon} type={notification.type} />

                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                                    {notification.title}
                                                </h4>

                                                {isUnread && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                                        BARU
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-600 leading-relaxed break-words">
                                                {notification.body}
                                            </p>

                                            <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {notification.created_at_human || notification.created_at}
                                                </span>

                                                {notification.created_at && (
                                                    <span className="hidden md:inline text-slate-300">·</span>
                                                )}

                                                <span className="hidden md:inline text-slate-400">
                                                    {notification.created_at}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                                        {notification.url && (
                                            <button
                                                type="button"
                                                onClick={() => open(notification)}
                                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                                            >
                                                {t('notifications.open_link', undefined, 'Buka')}
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={(e) => toggleReadStatus(e, notification)}
                                            title={isUnread ? t('notifications.mark_as_read', undefined, 'Tandai sudah dibaca') : t('notifications.mark_as_unread', undefined, 'Tandai belum dibaca')}
                                            className={`rounded-xl p-2 transition ${
                                                isUnread
                                                    ? 'text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'
                                                    : 'text-emerald-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {isUnread ? (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingNotification(notification);
                                            }}
                                            title={t('notifications.delete', undefined, 'Hapus notifikasi')}
                                            className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-600">
                            {t('common.showing_results', {
                                from: (notifications.current_page - 1) * notifications.per_page + 1,
                                to: Math.min(notifications.current_page * notifications.per_page, notifications.total),
                                total: notifications.total,
                            }, `Menampilkan ${(notifications.current_page - 1) * notifications.per_page + 1} - ${Math.min(notifications.current_page * notifications.per_page, notifications.total)} dari ${notifications.total} notifikasi`)}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {notifications.links.map((link, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                                    disabled={!link.url}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : link.url
                                            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                            : 'cursor-not-allowed text-slate-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Single Notification Modal */}
            <Modal show={deletingNotification !== null} onClose={() => setDeletingNotification(null)} maxWidth="md">
                <div className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-8 ring-rose-50/50">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                        {t('notifications.delete_confirm', undefined, 'Hapus notifikasi ini?')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        &ldquo;{deletingNotification?.title}&rdquo; akan dihapus secara permanen dari daftar notifikasi Anda.
                    </p>

                    <div className="mt-6 flex justify-end gap-2.5">
                        <SecondaryButton type="button" onClick={() => setDeletingNotification(null)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <DangerButton type="button" onClick={confirmDelete}>
                            {t('notifications.delete', undefined, 'Hapus')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            {/* Delete All Notifications Modal */}
            <Modal show={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-8 ring-rose-50/50">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                        {t('notifications.delete_all', undefined, 'Hapus Semua Notifikasi')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {t('notifications.delete_all_confirm', undefined, 'Apakah Anda yakin ingin menghapus semua notifikasi? Seluruh riwayat notifikasi yang tersimpan akan dihapus secara permanen.')}
                    </p>

                    <div className="mt-6 flex justify-end gap-2.5">
                        <SecondaryButton type="button" onClick={() => setShowDeleteAllModal(false)}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <DangerButton type="button" onClick={confirmDeleteAll}>
                            {t('notifications.delete_all', undefined, 'Hapus Semua')}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </DynamicLayout>
    );
}

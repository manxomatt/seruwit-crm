import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';

interface Notification {
    id: string;
    title: string;
    body: string;
    url: string | null;
    icon: string;
    type: string;
    read_at: string | null;
    created_at: string | null;
}

interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    notifications: PaginatedNotifications;
}

export default function Index({ notifications }: Props): JSX.Element {
    const hasUnread = notifications.data.some((notification) => !notification.read_at);

    const open = (notification: Notification) => {
        if (!notification.read_at) {
            router.post(route('module.notifications.read', notification.id), {}, { preserveScroll: true });
        }
        if (notification.url) {
            router.get(notification.url);
        }
    };

    const markAllRead = () => {
        router.post(route('module.notifications.read-all'), {}, { preserveScroll: true });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Notifikasi</h2>
                    {hasUnread && <PrimaryButton onClick={markAllRead}>Tandai semua terbaca</PrimaryButton>}
                </div>
            }
        >
            <Head title="Notifikasi" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {notifications.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">Belum ada notifikasi</h3>
                            <p className="mt-1 text-sm text-gray-500">Alert operasional akan muncul di sini.</p>
                        </div>
                    ) : (
                        <>
                            <ul className="divide-y divide-gray-200">
                                {notifications.data.map((notification) => (
                                    <li key={notification.id}>
                                        <button
                                            onClick={() => open(notification)}
                                            className={`flex w-full items-start justify-between gap-4 px-2 py-4 text-left hover:bg-gray-50 ${notification.read_at ? '' : 'bg-indigo-50/40'}`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                <p className="text-sm text-gray-500">{notification.body}</p>
                                                <p className="mt-1 text-xs text-gray-400">{notification.created_at}</p>
                                            </div>
                                            {!notification.read_at && <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {notifications.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Menampilkan {(notifications.current_page - 1) * notifications.per_page + 1}–
                                        {Math.min(notifications.current_page * notifications.per_page, notifications.total)} dari {notifications.total}
                                    </p>
                                    <div className="flex gap-1">
                                        {notifications.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    posts: Post[];
}

const PlusIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

const EllipsisVerticalIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
    </svg>
);

const menuItemClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

const menuItemDangerClassName =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

export default function Index({ posts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [processing, setProcessing] = useState(false);

    const openDeleteDialog = (post: Post) => {
        setPostToDelete(post);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setPostToDelete(null);
    };

    const confirmDelete = () => {
        if (!postToDelete) return;

        setProcessing(true);
        router.delete(prefixedRoute('posts.destroy', postToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const togglePublish = (post: Post) => {
        router.patch(prefixedRoute('posts.toggle-publish', post.id));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {t('posts.index.head')}
                    </h1>
                    <Link
                        href={prefixedRoute('posts.create')}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PlusIcon />
                        <span className="ml-2">{t('posts.index.create')}</span>
                    </Link>
                </div>
            }
        >
            <Head title={t('posts.index.head')} />

            {posts.length === 0 ? (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="text-center py-16">
                        <DocumentIcon />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{t('posts.index.empty_title')}</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('posts.index.empty_hint')}
                        </p>
                        <div className="mt-6">
                            <Link
                                href={prefixedRoute('posts.create')}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <PlusIcon />
                                <span className="ml-2">{t('posts.index.create')}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('posts.index.columns.title')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('posts.index.columns.slug')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('posts.index.columns.status')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('posts.index.columns.published')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {posts.map((post) => (
                                <tr key={post.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {post.title}
                                            </span>
                                            {post.excerpt && (
                                                <span className="text-sm text-gray-500 truncate max-w-xs">
                                                    {post.excerpt}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {t('posts.hints.slug_prefix')}{post.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(post)}
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${post.is_published
                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                }`}
                                        >
                                            {post.is_published ? t('posts.status.published') : t('posts.status.draft')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(post.published_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Menu as="div" className="relative inline-block text-right">
                                            <MenuButton
                                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                title={t('common.actions')}
                                                aria-label={t('common.actions')}
                                            >
                                                <EllipsisVerticalIcon />
                                            </MenuButton>

                                            <MenuItems
                                                transition
                                                anchor="bottom end"
                                                className="z-50 w-52 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                            >
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('posts.show', post.id)}
                                                        className={menuItemClassName}
                                                        title={t('posts.index.preview')}
                                                    >
                                                        <span className="text-gray-500">
                                                            <EyeIcon />
                                                        </span>
                                                        {t('posts.index.preview')}
                                                    </Link>
                                                </MenuItem>
                                                <MenuItem>
                                                    <Link
                                                        href={prefixedRoute('posts.edit', post.id)}
                                                        className={menuItemClassName}
                                                        title={t('common.edit')}
                                                    >
                                                        <span className="text-indigo-600">
                                                            <PencilIcon />
                                                        </span>
                                                        {t('common.edit')}
                                                    </Link>
                                                </MenuItem>
                                                <div className="my-1 border-t border-gray-100" />
                                                <MenuItem>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteDialog(post)}
                                                        className={menuItemDangerClassName}
                                                        title={t('common.delete')}
                                                    >
                                                        <TrashIcon />
                                                        {t('common.delete')}
                                                    </button>
                                                </MenuItem>
                                            </MenuItems>
                                        </Menu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('posts.index.delete_title')}
                message={
                    postToDelete
                        ? t('posts.index.delete_confirm', { title: postToDelete.title })
                        : t('posts.index.delete_confirm_generic')
                }
            />
        </DynamicLayout>
    );
}

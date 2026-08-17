import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

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

export default function Index({ posts }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

    // Stats calculations
    const stats = useMemo(() => {
        const total = posts.length;
        const published = posts.filter((p) => p.is_published).length;
        const draft = total - published;
        return { total, published, draft };
    }, [posts]);

    // Filtered posts
    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchesSearch =
                post.title.toLowerCase().includes(search.toLowerCase()) ||
                post.slug.toLowerCase().includes(search.toLowerCase()) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'published'
                    ? post.is_published
                    : !post.is_published;

            return matchesSearch && matchesStatus;
        });
    }, [posts, search, statusFilter]);

    const menuItemClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition';

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
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('posts.index.head')}
                    actions={
                        <Link href={prefixedRoute('posts.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                ➕ {t('posts.index.create')}
                            </PrimaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('posts.index.head')} />

            <div className="space-y-6">
                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                📝
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Posts</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                🚀
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Published</p>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-lg font-bold">
                                ✏️
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts</p>
                                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.draft}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                🔍
                            </span>
                            <TextInput
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search post title, slug, or excerpt..."
                                className="w-full pl-9 text-xs !rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
                            {(['all', 'published', 'draft'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setStatusFilter(mode)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                                        statusFilter === mode
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl mb-3">
                                📝
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('posts.index.empty_title')}</h3>
                            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                                {t('posts.index.empty_hint')}
                            </p>
                            <div className="mt-5">
                                <Link href={prefixedRoute('posts.create')}>
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                        ➕ {t('posts.index.create')}
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('posts.index.columns.title')}
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('posts.index.columns.slug')}
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('posts.index.columns.status')}
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('posts.index.columns.published')}
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {filteredPosts.map((post) => (
                                        <tr key={post.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {post.title}
                                                    </span>
                                                    {post.excerpt && (
                                                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                                                            {post.excerpt}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {t('posts.hints.slug_prefix')}{post.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => togglePublish(post)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                                                        post.is_published
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100'
                                                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${post.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {post.is_published ? t('posts.status.published') : t('posts.status.draft')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                                {formatDate(post.published_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                        title={t('common.actions')}
                                                    >
                                                        ⚙️
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('posts.show', post.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                👁️ {t('posts.index.preview')}
                                                            </Link>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('posts.edit', post.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                ✏️ {t('common.edit')}
                                                            </Link>
                                                        </MenuItem>
                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(post)}
                                                                className={menuItemDangerClassName}
                                                            >
                                                                🗑️ {t('common.delete')}
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
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('posts.index.delete_title')}
                message={
                    postToDelete
                        ? t('posts.index.delete_message', { title: postToDelete.title })
                        : t('posts.index.delete_generic')
                }
            />
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState, useMemo } from 'react';

interface Page {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    is_homepage: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    pages: Page[];
    can?: {
        create: boolean;
        update: boolean;
        delete: boolean;
        manageComponents: boolean;
    };
}

export default function Index({ pages, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [pageToRename, setPageToRename] = useState<Page | null>(null);

    // Stats calculations
    const stats = useMemo(() => {
        const total = pages.length;
        const published = pages.filter((p) => p.is_published).length;
        const homepage = pages.filter((p) => p.is_homepage).length;
        const draft = total - published;
        return { total, published, homepage, draft };
    }, [pages]);

    // Filtered pages
    const filteredPages = useMemo(() => {
        return pages.filter((page) => {
            const matchesSearch =
                page.title.toLowerCase().includes(search.toLowerCase()) ||
                page.slug.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'published'
                    ? page.is_published
                    : !page.is_published;

            return matchesSearch && matchesStatus;
        });
    }, [pages, search, statusFilter]);

    const renameForm = useForm({
        title: '',
        slug: '',
    });

    const openRenameModal = (page: Page) => {
        setPageToRename(page);
        renameForm.setData({
            title: page.title,
            slug: page.slug,
        });
        renameForm.clearErrors();
        setShowRenameModal(true);
    };

    const closeRenameModal = () => {
        setShowRenameModal(false);
        setPageToRename(null);
        renameForm.reset();
        renameForm.clearErrors();
    };

    const handleRenameTitleChange = (val: string) => {
        const generatedSlug = val
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        renameForm.setData({
            title: val,
            slug: generatedSlug,
        });
    };

    const submitRename: FormEventHandler = (e) => {
        e.preventDefault();
        if (!pageToRename) return;

        renameForm.patch(prefixedRoute('pages.update', pageToRename.id), {
            onSuccess: () => closeRenameModal(),
        });
    };

    const openDeleteDialog = (page: Page) => {
        setPageToDelete(page);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setPageToDelete(null);
    };

    const confirmDelete = () => {
        if (!pageToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('pages.destroy', pageToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const togglePublish = (page: Page) => {
        router.patch(prefixedRoute('pages.update', page.id), {
            is_published: !page.is_published,
        });
    };

    const setHomepage = (page: Page) => {
        router.patch(prefixedRoute('pages.set-homepage', page.id));
    };

    const duplicatePage = (page: Page) => {
        router.post(prefixedRoute('pages.copy', page.id));
    };

    const menuItemClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition';

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('pages.title')}
                    actions={
                        <div className="flex items-center gap-3">
                            {can?.manageComponents && (
                                <Link href={prefixedRoute('pages.components.index')}>
                                    <SecondaryButton className="!rounded-xl text-xs shadow-sm">
                                        🧩 {t('pages.manage_components')}
                                    </SecondaryButton>
                                </Link>
                            )}
                            <Link href={prefixedRoute('pages.create')}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    {t('pages.create_page')}
                                </PrimaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('pages.title')} />

            <div className="space-y-6">
                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                📄
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pages</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                🌐
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Published</p>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-lg font-bold">
                                ⭐
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Homepage</p>
                                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.homepage}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-lg font-bold">
                                📝
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drafts</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.draft}</p>
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
                                placeholder="Search page title or slug..."
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
                    {filteredPages.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl mb-3">
                                📄
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('pages.index.empty_title')}</h3>
                            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                                {t('pages.index.empty_hint')}
                            </p>
                            <div className="mt-5">
                                <Link href={prefixedRoute('pages.create')}>
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                        {t('pages.index.create')}
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('pages.index.columns.title')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('pages.index.columns.slug')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('pages.index.columns.status')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('pages.index.columns.updated')}
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {filteredPages.map((page) => (
                                        <tr key={page.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {page.title}
                                                    </span>
                                                    {page.is_homepage && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                                            ⭐ {t('pages.index.homepage')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    /p/{page.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => togglePublish(page)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                                                        page.is_published
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100'
                                                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 hover:bg-amber-100'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${page.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {page.is_published ? t('pages.status.published') : t('pages.status.draft')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                                {new Date(page.updated_at).toLocaleDateString(localeTag)}
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
                                                        className="z-50 w-52 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('pages.edit', page.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                🎨 {t('pages.index.open_editor')}
                                                            </Link>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('pages.show', page.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                👁️ {t('pages.index.preview')}
                                                            </Link>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openRenameModal(page)}
                                                                className={menuItemClassName}
                                                            >
                                                                ✏️ {t('pages.index.rename')}
                                                            </button>
                                                        </MenuItem>
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => duplicatePage(page)}
                                                                className={menuItemClassName}
                                                            >
                                                                📋 {t('pages.index.copy')}
                                                            </button>
                                                        </MenuItem>
                                                        {!page.is_homepage && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setHomepage(page)}
                                                                    className={menuItemClassName}
                                                                >
                                                                    ⭐ {t('pages.index.set_homepage')}
                                                                </button>
                                                            </MenuItem>
                                                        )}
                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                        <MenuItem>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteDialog(page)}
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

            {/* Rename Modal */}
            <Modal show={showRenameModal} onClose={closeRenameModal} maxWidth="md">
                <form onSubmit={submitRename} className="p-6">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        ✏️ {t('pages.rename.title')}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                        {t('pages.rename.slug_hint')}
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <InputLabel htmlFor="rename_title" value={t('pages.rename.page_title')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="rename_title"
                                type="text"
                                value={renameForm.data.title}
                                onChange={(e) => handleRenameTitleChange(e.target.value)}
                                className="mt-1 block w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                required
                            />
                            <InputError message={renameForm.errors.title} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="rename_slug" value={t('pages.rename.slug')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="rename_slug"
                                type="text"
                                value={renameForm.data.slug}
                                onChange={(e) => renameForm.setData('slug', e.target.value)}
                                className="mt-1 block w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                required
                            />
                            <InputError message={renameForm.errors.slug} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeRenameModal} className="!rounded-xl text-xs">
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={renameForm.processing} className="!rounded-xl text-xs shadow-sm">
                            💾 {t('pages.rename.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('pages.index.delete_title')}
                message={
                    pageToDelete
                        ? t('pages.index.delete_confirm', { title: pageToDelete.title })
                        : t('pages.index.delete_confirm_generic')
                }
            />
        </DynamicLayout>
    );
}




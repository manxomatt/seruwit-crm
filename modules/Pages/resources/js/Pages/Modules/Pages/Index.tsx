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
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

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

const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CopyIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v9.25c0 .621-.504 1.125-1.125 1.125z" />
    </svg>
);

const RenameIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function Index({ pages }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [processing, setProcessing] = useState(false);

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [pageToRename, setPageToRename] = useState<Page | null>(null);

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

    const [showHomepageModal, setShowHomepageModal] = useState(false);
    const [pageToSetHomepage, setPageToSetHomepage] = useState<Page | null>(null);
    const [settingHomepage, setSettingHomepage] = useState(false);

    const openHomepageModal = (page: Page) => {
        setPageToSetHomepage(page);
        setShowHomepageModal(true);
    };

    const closeHomepageModal = () => {
        setShowHomepageModal(false);
        setPageToSetHomepage(null);
    };

    const confirmSetHomepage = () => {
        if (!pageToSetHomepage) return;

        setSettingHomepage(true);
        router.patch(prefixedRoute('pages.set-homepage', pageToSetHomepage.id), {
            onSuccess: () => closeHomepageModal(),
            onFinish: () => setSettingHomepage(false),
        });
    };

    const duplicatePage = (page: Page) => {
        router.post(prefixedRoute('pages.copy', page.id));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {t('pages.index.head')}
                    </h1>
                    <Link
                        href={prefixedRoute('pages.create')}
                        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PlusIcon />
                        <span className="ml-2">{t('pages.index.create')}</span>
                    </Link>
                </div>
            }
        >
            <Head title={t('pages.index.head')} />

            {pages.length === 0 ? (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="text-center py-16">
                        <DocumentIcon />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">{t('pages.index.empty_title')}</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('pages.index.empty_hint')}
                        </p>
                        <div className="mt-6">
                            <Link
                                href={prefixedRoute('pages.create')}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <PlusIcon />
                                <span className="ml-2">{t('pages.index.create')}</span>
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
                                    {t('pages.index.columns.title')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('pages.index.columns.slug')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('pages.index.columns.status')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('pages.index.columns.updated')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('common.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pages.map((page) => (
                                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                {page.title}
                                            </span>
                                            {page.is_homepage && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    <HomeIcon />
                                                    {t('pages.index.homepage')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            /p/{page.slug}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePublish(page)}
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                page.is_published
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                            }`}
                                        >
                                            {page.is_published ? t('pages.status.published') : t('pages.status.draft')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(page.updated_at).toLocaleDateString(localeTag)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={prefixedRoute('pages.show', page.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title={t('pages.index.preview')}
                                            >
                                                <EyeIcon />
                                            </Link>
                                            <Link
                                                href={prefixedRoute('pages.edit', page.id)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title={t('common.edit')}
                                            >
                                                <PencilIcon />
                                            </Link>
                                            <button
                                                onClick={() => openRenameModal(page)}
                                                className="text-amber-600 hover:text-amber-900"
                                                title={t('pages.index.rename')}
                                            >
                                                <RenameIcon />
                                            </button>
                                            <button
                                                onClick={() => duplicatePage(page)}
                                                className="text-emerald-600 hover:text-emerald-900"
                                                title={t('pages.index.copy')}
                                            >
                                                <CopyIcon />
                                            </button>
                                            {!page.is_homepage && (
                                                <button
                                                    onClick={() => openHomepageModal(page)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title={t('pages.index.set_homepage')}
                                                >
                                                    <HomeIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openDeleteDialog(page)}
                                                className="text-red-600 hover:text-red-900"
                                                title={t('common.delete')}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal show={showRenameModal} onClose={closeRenameModal} maxWidth="md">
                <form onSubmit={submitRename} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        {t('pages.rename.title')}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="rename-title" value={t('pages.rename.page_title')} />
                            <TextInput
                                id="rename-title"
                                type="text"
                                value={renameForm.data.title}
                                className="mt-1 block w-full"
                                autoFocus
                                onChange={(e) => handleRenameTitleChange(e.target.value)}
                            />
                            <InputError message={renameForm.errors.title} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="rename-slug" value={t('pages.rename.slug')} />
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                    /p/
                                </span>
                                <TextInput
                                    id="rename-slug"
                                    type="text"
                                    value={renameForm.data.slug}
                                    className="block w-full rounded-l-none"
                                    onChange={(e) => renameForm.setData('slug', e.target.value)}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">{t('pages.rename.slug_hint')}</p>
                            <InputError message={renameForm.errors.slug} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeRenameModal} type="button">
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={renameForm.processing} type="submit">
                            {t('pages.rename.submit')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={showHomepageModal} onClose={closeHomepageModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <HomeIcon />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {t('pages.index.set_homepage_title')}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {t('pages.index.set_homepage')}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        {pageToSetHomepage
                            ? t('pages.index.set_homepage_confirm', { title: pageToSetHomepage.title })
                            : t('pages.index.set_homepage_confirm_generic')}
                    </p>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeHomepageModal} type="button">
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={confirmSetHomepage}
                            disabled={settingHomepage}
                            className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                        >
                            {settingHomepage ? t('common.processing') : t('pages.index.set_homepage')}
                        </PrimaryButton>
                    </div>
                </div>
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

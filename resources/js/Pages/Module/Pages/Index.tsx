import DynamicLayout from '@/Layouts/DynamicLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

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
    can: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
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

const DocumentIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function Index({ pages, can }: Props): JSX.Element {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [processing, setProcessing] = useState(false);

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
        router.delete(route('module.pages.destroy', pageToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const togglePublish = (page: Page) => {
        router.patch(route('module.pages.update', page.id), {
            is_published: !page.is_published,
        });
    };

    const setAsHomepage = (page: Page) => {
        if (confirm('Set this page as the homepage? This will replace the current homepage.')) {
            router.patch(route('module.pages.set-homepage', page.id));
        }
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Pages
                    </h1>
                    {can.create && (
                        <Link
                            href={route('module.pages.create')}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <PlusIcon />
                            <span className="ml-2">Create Page</span>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Pages" />

            {pages.length === 0 ? (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <div className="text-center py-16">
                        <DocumentIcon />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900">No pages yet</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Get started by creating your first page.
                        </p>
                        {can.create && (
                            <div className="mt-6">
                                <Link
                                    href={route('module.pages.create')}
                                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <PlusIcon />
                                    <span className="ml-2">Create Page</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Updated
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
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
                                                    Homepage
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
                                            {page.is_published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(page.updated_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={route('module.pages.show', page.id)}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Preview"
                                            >
                                                <EyeIcon />
                                            </Link>
                                            {can.update && (
                                                <Link
                                                    href={route('module.pages.edit', page.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit"
                                                >
                                                    <PencilIcon />
                                                </Link>
                                            )}
                                            {can.update && !page.is_homepage && (
                                                <button
                                                    onClick={() => setAsHomepage(page)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Set as Homepage"
                                                >
                                                    <HomeIcon />
                                                </button>
                                            )}
                                            {can.delete && (
                                                <button
                                                    onClick={() => openDeleteDialog(page)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            )}
                                        </div>
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
                title="Hapus Halaman"
                message={
                    pageToDelete ? (
                        <>
                            Apakah Anda yakin ingin menghapus halaman{' '}
                            <strong>"{pageToDelete.title}"</strong>? Tindakan ini tidak dapat
                            dibatalkan.
                        </>
                    ) : (
                        'Apakah Anda yakin ingin menghapus halaman ini?'
                    )
                }
            />
        </DynamicLayout>
    );
}

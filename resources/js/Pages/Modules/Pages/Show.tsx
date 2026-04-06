import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface Page {
    id: number;
    title: string;
    slug: string;
    html: string | null;
    css: string | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    page: Page;
}

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const DocumentIcon = () => (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

export default function Show({ page }: Props): JSX.Element {
    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('admin.pages.index')}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                        >
                            <ArrowLeftIcon />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Preview: {page.title}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                View how your page will appear to visitors
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                page.is_published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                            {page.is_published ? 'Published' : 'Draft'}
                        </span>
                        <Link
                            href={route('admin.pages.edit', page.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <PencilIcon />
                            Edit Page
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Preview: ${page.title}`} />

            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                {/* URL Bar */}
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">URL:</span>
                            <code className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700">
                                /p/{page.slug}
                            </code>
                        </div>
                        {page.is_published && (
                            <a
                                href={`/p/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                View Live Page
                                <ExternalLinkIcon />
                            </a>
                        )}
                    </div>
                </div>

                {/* Preview Content */}
                <div className="p-0">
                    {page.html ? (
                        <div className="preview-container h-[600px] overflow-y-auto">
                            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
                            <style dangerouslySetInnerHTML={{ __html: page.css || '' }} />
                            <div dangerouslySetInnerHTML={{ __html: page.html }} />
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <DocumentIcon />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900">No content yet</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                This page doesn't have any content. Open the editor to start building.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route('admin.pages.edit', page.id)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <PencilIcon />
                                    Open Editor
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

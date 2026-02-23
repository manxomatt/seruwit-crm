import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SecondaryButton from '@/Components/SecondaryButton';
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

export default function Show({ page }: Props): JSX.Element {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Preview: {page.title}
                    </h2>
                    <div className="flex items-center gap-4">
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                page.is_published
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                            {page.is_published ? 'Published' : 'Draft'}
                        </span>
                        <Link href={route('pages.edit', page.id)}>
                            <SecondaryButton>Edit Page</SecondaryButton>
                        </Link>
                        <Link href={route('pages.index')}>
                            <SecondaryButton>Back to Pages</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Preview: ${page.title}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    URL: <code className="bg-gray-200 px-2 py-1 rounded">/p/{page.slug}</code>
                                </span>
                                {page.is_published && (
                                    <a
                                        href={`/p/${page.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        View Live Page →
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="p-0">
                            {page.html ? (
                                <div className="preview-container">
                                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
                                    <style dangerouslySetInnerHTML={{ __html: page.css || '' }} />
                                    <div dangerouslySetInnerHTML={{ __html: page.html }} />
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="mt-4">This page has no content yet.</p>
                                    <Link
                                        href={route('pages.edit', page.id)}
                                        className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                                    >
                                        Open Editor to add content
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

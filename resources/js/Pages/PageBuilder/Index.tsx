import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';

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

export default function Index({ pages }: Props): JSX.Element {
    const deletePage = (page: Page) => {
        if (confirm('Are you sure you want to delete this page?')) {
            router.delete(route('pages.destroy', page.id));
        }
    };

    const togglePublish = (page: Page) => {
        router.patch(route('pages.update', page.id), {
            is_published: !page.is_published,
        });
    };

    const setAsHomepage = (page: Page) => {
        if (confirm('Set this page as the homepage? This will replace the current homepage.')) {
            router.patch(route('pages.set-homepage', page.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Page Builder
                    </h2>
                    <Link href={route('pages.create')}>
                        <PrimaryButton>Create New Page</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Page Builder" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {pages.length === 0 ? (
                                <div className="text-center py-12">
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
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pages</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Get started by creating a new page.
                                    </p>
                                    <div className="mt-6">
                                        <Link href={route('pages.create')}>
                                            <PrimaryButton>Create New Page</PrimaryButton>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Slug
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Updated
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {pages.map((page) => (
                                                <tr key={page.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {page.title}
                                                            </span>
                                                            {page.is_homepage && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Homepage
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            /{page.slug}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => togglePublish(page)}
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                page.is_published
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                        >
                                                            {page.is_published ? 'Published' : 'Draft'}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(page.updated_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                        <Link
                                                            href={route('pages.edit', page.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <Link
                                                            href={route('pages.show', page.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            Preview
                                                        </Link>
                                                        {!page.is_homepage && (
                                                            <button
                                                                onClick={() => setAsHomepage(page)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Set as Homepage
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deletePage(page)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

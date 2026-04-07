import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, Link } from '@inertiajs/react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    featured_image: string | null;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    post: Post;
}

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

const PencilIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export default function Show({ post }: Props): JSX.Element {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('module.posts.index')}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                        >
                            <ArrowLeftIcon />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Preview Post
                            </h1>
                            <p className="text-sm text-gray-500">
                                {post.is_published ? 'Published' : 'Draft'} • Last updated: {formatDate(post.updated_at)}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={route('module.posts.edit', post.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PencilIcon />
                        Edit Post
                    </Link>
                </div>
            }
        >
            <Head title={`Preview: ${post.title}`} />

            <div className="max-w-4xl">
                {/* Post Meta */}
                <div className="mb-6 rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 p-6">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    post.is_published
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {post.is_published ? 'Published' : 'Draft'}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Published Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {formatDate(post.published_at)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">URL Slug</dt>
                            <dd className="mt-1">
                                <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    /blog/{post.slug}
                                </code>
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Post Content Preview */}
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="aspect-video bg-gray-100">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-8">
                        {/* Title */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {post.title}
                        </h1>

                        {/* Excerpt */}
                        {post.excerpt && (
                            <p className="text-lg text-gray-600 mb-6 pb-6 border-b border-gray-200">
                                {post.excerpt}
                            </p>
                        )}

                        {/* Content */}
                        {post.content ? (
                            <div className="prose prose-indigo max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700">
                                    {post.content}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p>No content yet.</p>
                                <Link
                                    href={route('module.posts.edit', post.id)}
                                    className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
                                >
                                    Add content →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-4">
                    <Link
                        href={route('module.posts.index')}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Back to Posts
                    </Link>
                    <Link
                        href={route('module.posts.edit', post.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PencilIcon />
                        Edit Post
                    </Link>
                </div>
            </div>
        </DynamicLayout>
    );
}

import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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

export default function Edit({ post }: Props): JSX.Element {
    const { data, setData, patch, processing, errors } = useForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image: post.featured_image || '',
        is_published: post.is_published,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('admin.posts.update', post.id));
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('admin.posts.index')}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                    >
                        <ArrowLeftIcon />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Edit Post
                        </h1>
                        <p className="text-sm text-gray-500">
                            Last updated: {new Date(post.updated_at).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Edit: ${post.title}`} />

            <div className="max-w-4xl">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="title" value="Post Title" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 block w-full"
                                    autoComplete="off"
                                    isFocused={true}
                                    placeholder="Enter post title"
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="slug" value="URL Slug" />
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                        /blog/
                                    </span>
                                    <TextInput
                                        id="slug"
                                        type="text"
                                        name="slug"
                                        value={data.slug}
                                        className="block w-full rounded-l-none"
                                        autoComplete="off"
                                        placeholder="post-url-slug"
                                        onChange={(e) => setData('slug', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.slug} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="excerpt" value="Excerpt" />
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                value={data.excerpt}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Brief description of the post..."
                                onChange={(e) => setData('excerpt', e.target.value)}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                A short summary that appears in post listings.
                            </p>
                            <InputError message={errors.excerpt} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="content" value="Content" />
                            <textarea
                                id="content"
                                name="content"
                                value={data.content}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={12}
                                placeholder="Write your post content here..."
                                onChange={(e) => setData('content', e.target.value)}
                            />
                            <InputError message={errors.content} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="featured_image" value="Featured Image URL" />
                            <TextInput
                                id="featured_image"
                                type="text"
                                name="featured_image"
                                value={data.featured_image}
                                className="mt-1 block w-full"
                                autoComplete="off"
                                placeholder="https://example.com/image.jpg"
                                onChange={(e) => setData('featured_image', e.target.value)}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                URL to the featured image for this post.
                            </p>
                            <InputError message={errors.featured_image} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center">
                                <input
                                    id="is_published"
                                    name="is_published"
                                    type="checkbox"
                                    checked={data.is_published}
                                    onChange={(e) => setData('is_published', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                                    Published
                                </label>
                            </div>
                            {post.published_at && (
                                <span className="text-sm text-gray-500">
                                    Published on: {new Date(post.published_at).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                            <Link
                                href={route('admin.posts.index')}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Cancel
                            </Link>
                            <Link
                                href={route('admin.posts.show', post.id)}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Preview
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

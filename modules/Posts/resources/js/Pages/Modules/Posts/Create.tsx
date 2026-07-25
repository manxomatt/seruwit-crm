import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

const ArrowLeftIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
);

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        is_published: false,
    });

    useEffect(() => {
        const slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        setData('slug', slug);
    }, [data.title]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('posts.store'));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={prefixedRoute('posts.index')}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                    >
                        <ArrowLeftIcon />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {t('posts.create.title')}
                    </h1>
                </div>
            }
        >
            <Head title={t('posts.create.head')} />

            <div className="max-w-4xl">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="title" value={t('posts.fields.title')} />
                                <TextInput
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 block w-full"
                                    autoComplete="off"
                                    isFocused={true}
                                    placeholder={t('posts.placeholders.title')}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="slug" value={t('posts.fields.slug')} />
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                        {t('posts.hints.slug_prefix')}
                                    </span>
                                    <TextInput
                                        id="slug"
                                        type="text"
                                        name="slug"
                                        value={data.slug}
                                        className="block w-full rounded-l-none"
                                        autoComplete="off"
                                        placeholder={t('posts.placeholders.slug')}
                                        onChange={(e) => setData('slug', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.slug} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="excerpt" value={t('posts.fields.excerpt')} />
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                value={data.excerpt}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                placeholder={t('posts.placeholders.excerpt')}
                                onChange={(e) => setData('excerpt', e.target.value)}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                {t('posts.hints.excerpt')}
                            </p>
                            <InputError message={errors.excerpt} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="content" value={t('posts.fields.content')} />
                            <textarea
                                id="content"
                                name="content"
                                value={data.content}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={12}
                                placeholder={t('posts.placeholders.content')}
                                onChange={(e) => setData('content', e.target.value)}
                            />
                            <InputError message={errors.content} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="featured_image" value={t('posts.fields.featured_image')} />
                            <TextInput
                                id="featured_image"
                                type="text"
                                name="featured_image"
                                value={data.featured_image}
                                className="mt-1 block w-full"
                                autoComplete="off"
                                placeholder={t('posts.placeholders.featured_image')}
                                onChange={(e) => setData('featured_image', e.target.value)}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                {t('posts.hints.featured_image')}
                            </p>
                            <InputError message={errors.featured_image} className="mt-2" />
                        </div>

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
                                {t('posts.create.publish_immediately')}
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                            <Link
                                href={prefixedRoute('posts.index')}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {t('common.cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? t('posts.create.creating') : t('posts.create.submit')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

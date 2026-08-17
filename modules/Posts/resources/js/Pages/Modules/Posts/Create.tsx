import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

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
                <PageHeader
                    title={t('posts.create.title')}
                    actions={
                        <Link href={prefixedRoute('posts.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('common.cancel')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('posts.create.head')} />

            <div className="mx-auto max-w-4xl">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="title" value={t('posts.fields.title')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 block w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    autoComplete="off"
                                    isFocused={true}
                                    placeholder={t('posts.placeholders.title')}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="slug" value={t('posts.fields.slug')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <div className="mt-1 flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                    <span className="inline-flex items-center bg-slate-50 dark:bg-slate-800/60 px-3 text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                                        {t('posts.hints.slug_prefix')}
                                    </span>
                                    <input
                                        id="slug"
                                        type="text"
                                        name="slug"
                                        value={data.slug}
                                        className="block w-full border-0 focus:ring-0 text-xs font-mono bg-transparent text-slate-900 dark:text-white"
                                        autoComplete="off"
                                        placeholder={t('posts.placeholders.slug')}
                                        onChange={(e) => setData('slug', e.target.value)}
                                    />
                                </div>
                                <InputError message={errors.slug} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="excerpt" value={t('posts.fields.excerpt')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                value={data.excerpt}
                                className="mt-1 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                rows={3}
                                placeholder={t('posts.placeholders.excerpt')}
                                onChange={(e) => setData('excerpt', e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                                {t('posts.hints.excerpt')}
                            </p>
                            <InputError message={errors.excerpt} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="content" value={t('posts.fields.content')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="content"
                                name="content"
                                value={data.content}
                                className="mt-1 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                rows={10}
                                placeholder={t('posts.placeholders.content')}
                                onChange={(e) => setData('content', e.target.value)}
                            />
                            <InputError message={errors.content} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="featured_image" value={t('posts.fields.featured_image')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="featured_image"
                                type="text"
                                name="featured_image"
                                value={data.featured_image}
                                className="mt-1 block w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                autoComplete="off"
                                placeholder={t('posts.placeholders.featured_image')}
                                onChange={(e) => setData('featured_image', e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                                {t('posts.hints.featured_image')}
                            </p>
                            <InputError message={errors.featured_image} className="mt-1" />
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    id="is_published"
                                    type="checkbox"
                                    className="h-4 w-4 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.is_published}
                                    onChange={(e) => setData('is_published', e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    🚀 {t('posts.fields.publish_immediately')}
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('posts.index')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">
                                    {t('common.cancel')}
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                ➕ {t('posts.create.submit')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}


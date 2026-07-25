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
        post(prefixedRoute('pages.store'));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={prefixedRoute('pages.index')}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                    >
                        <ArrowLeftIcon />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {t('pages.create.title')}
                    </h1>
                </div>
            }
        >
            <Head title={t('pages.create.head')} />

            <div className="max-w-2xl">
                <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="title" value={t('pages.create.page_title')} />
                            <TextInput
                                id="title"
                                type="text"
                                name="title"
                                value={data.title}
                                className="mt-1 block w-full"
                                autoComplete="off"
                                isFocused={true}
                                placeholder={t('pages.create.title_placeholder')}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                            <InputError message={errors.title} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="slug" value={t('pages.create.slug')} />
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                                    /p/
                                </span>
                                <TextInput
                                    id="slug"
                                    type="text"
                                    name="slug"
                                    value={data.slug}
                                    className="block w-full rounded-l-none"
                                    autoComplete="off"
                                    placeholder={t('pages.create.slug_placeholder')}
                                    onChange={(e) => setData('slug', e.target.value)}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                {t('pages.create.slug_hint')}
                            </p>
                            <InputError message={errors.slug} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                            <Link
                                href={prefixedRoute('pages.index')}
                                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {t('common.cancel')}
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? t('pages.create.creating') : t('pages.create.submit')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}

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
                <PageHeader
                    title={t('pages.create.title')}
                    actions={
                        <Link href={prefixedRoute('pages.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('common.cancel')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('pages.create.head')} />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="title" value={t('pages.create.page_title')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="title"
                                type="text"
                                name="title"
                                value={data.title}
                                className="mt-1 block w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                autoComplete="off"
                                isFocused={true}
                                placeholder={t('pages.create.title_placeholder')}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="slug" value={t('pages.create.slug')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1 flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                                <span className="inline-flex items-center bg-slate-50 dark:bg-slate-800/60 px-3 text-slate-400 font-mono text-xs border-r border-slate-200 dark:border-slate-800">
                                    /p/
                                </span>
                                <input
                                    id="slug"
                                    type="text"
                                    name="slug"
                                    value={data.slug}
                                    className="block w-full border-0 focus:ring-0 text-xs font-mono bg-transparent text-slate-900 dark:text-white"
                                    autoComplete="off"
                                    placeholder={t('pages.create.slug_placeholder')}
                                    onChange={(e) => setData('slug', e.target.value)}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                                {t('pages.create.slug_hint')}
                            </p>
                            <InputError message={errors.slug} className="mt-1" />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('pages.index')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">
                                    {t('common.cancel')}
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                ➕ {processing ? t('pages.create.creating') : t('pages.create.submit')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}



import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PageHeader from '@/Components/PageHeader';
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
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={page.title}
                    actions={
                        <div className="flex gap-2">
                            <Link href={prefixedRoute('pages.editor', page.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    🎨 {t('pages.show.open_editor')}
                                </PrimaryButton>
                            </Link>
                            <Link href={prefixedRoute('pages.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('common.back')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('pages.show.preview_title', { title: page.title })} />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Main Card Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {/* Browser Chrome Header */}
                    <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-rose-400/80 inline-block" />
                                <span className="h-3 w-3 rounded-full bg-amber-400/80 inline-block" />
                                <span className="h-3 w-3 rounded-full bg-emerald-400/80 inline-block" />
                            </div>
                            <span className="font-mono text-xs text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                /p/{page.slug}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    page.is_published
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${page.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {page.is_published ? t('pages.status.published') : t('pages.status.draft')}
                            </span>

                            {page.is_published && (
                                <a
                                    href={`/p/${page.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    ↗️ {t('pages.show.view_live')}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Preview Content Area */}
                    <div>
                        {page.html ? (
                            <div className="preview-container min-h-[600px] overflow-y-auto p-6 bg-white dark:bg-slate-950">
                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
                                <style dangerouslySetInnerHTML={{ __html: page.css || '' }} />
                                <div dangerouslySetInnerHTML={{ __html: page.html }} />
                            </div>
                        ) : (
                            <div className="text-center py-20 px-4">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl mb-3">
                                    🎨
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('pages.show.empty_title')}</h3>
                                <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                                    {t('pages.show.empty_hint')}
                                </p>
                                <div className="mt-6">
                                    <Link href={prefixedRoute('pages.editor', page.id)}>
                                        <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                            🎨 {t('pages.show.open_editor')}
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}



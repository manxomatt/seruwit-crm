import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PageHeader from '@/Components/PageHeader';
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

export default function Show({ post }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString(localeTag, {
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
                <PageHeader
                    title={post.title}
                    actions={
                        <div className="flex gap-2">
                            <Link href={prefixedRoute('posts.edit', post.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    ✏️ {t('posts.show.edit_post')}
                                </PrimaryButton>
                            </Link>
                            <Link href={prefixedRoute('posts.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('posts.show.back')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('posts.show.title', { title: post.title })} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Post Meta Info Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('posts.index.columns.status')}</dt>
                            <dd className="mt-1">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    post.is_published
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${post.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {post.is_published ? t('posts.status.published') : t('posts.status.draft')}
                                </span>
                            </dd>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('posts.fields.published_date')}</dt>
                            <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                                {formatDate(post.published_at)}
                            </dd>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('posts.fields.slug')}</dt>
                            <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-white">
                                {t('posts.hints.slug_prefix')}{post.slug}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Main Post Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {post.featured_image && (
                        <div className="aspect-video bg-slate-950 max-h-96">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="p-8">
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">
                            {post.title}
                        </h1>

                        {post.excerpt && (
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 italic">
                                "{post.excerpt}"
                            </p>
                        )}

                        {post.content ? (
                            <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {post.content}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <p className="text-xs font-bold">{t('posts.show.empty_content')}</p>
                                <Link
                                    href={prefixedRoute('posts.edit', post.id)}
                                    className="mt-3 inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    ✏️ {t('posts.show.add_content')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}


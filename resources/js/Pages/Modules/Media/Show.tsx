import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

interface MediaItem {
    id: number;
    name: string;
    original_name: string;
    url: string;
    mime_type: string;
    size: number;
    human_size: string;
    type: string;
    alt_text: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    media: MediaItem;
}

export default function Show({ media }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [copied, setCopied] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const copyUrl = () => {
        navigator.clipboard.writeText(media.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openDeleteDialog = () => {
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
    };

    const confirmDelete = () => {
        setProcessing(true);
        router.delete(prefixedRoute('media.destroy', media.id), {
            onFinish: () => setProcessing(false),
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(localeTag);
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('media.pages.show.head')}
                    actions={
                        <div className="flex gap-2">
                            <Link href={prefixedRoute('media.edit', media.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    ✏️ {t('common.edit')}
                                </PrimaryButton>
                            </Link>
                            <DangerButton onClick={openDeleteDialog} className="!rounded-xl text-xs shadow-sm">
                                🗑️ {t('common.delete')}
                            </DangerButton>
                        </div>
                    }
                />
            }
        >
            <Head title={t('media.pages.show.title', { name: media.original_name })} />

            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Preview Container */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            👁️ {t('media.pages.show.preview')}
                        </h3>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-4 min-h-[340px]">
                            {media.type === 'image' ? (
                                <img
                                    src={media.url}
                                    alt={media.alt_text || media.original_name}
                                    className="max-w-full max-h-[460px] object-contain rounded-lg shadow-sm"
                                />
                            ) : media.type === 'video' ? (
                                <video
                                    src={media.url}
                                    controls
                                    className="max-w-full max-h-[460px] rounded-lg shadow-sm"
                                >
                                    {t('media.video_not_supported')}
                                </video>
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mb-3 shadow-inner">
                                        📄
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        {t('media.pages.show.preview_unavailable')}
                                    </p>
                                    <a
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors"
                                    >
                                        📥 {t('media.pages.show.download')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Container */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            ℹ️ {t('media.pages.show.information')}
                        </h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.original_name')}
                                </dt>
                                <dd className="mt-1 font-bold text-slate-900 dark:text-white truncate" title={media.original_name}>
                                    {media.original_name}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.file_name')}
                                </dt>
                                <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300 truncate" title={media.name}>
                                    {media.name}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.type')}
                                </dt>
                                <dd className="mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50">
                                        {t(`media.type.${media.type}`, undefined, media.type)}
                                    </span>
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.mime_type')}
                                </dt>
                                <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                                    {media.mime_type}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.size')}
                                </dt>
                                <dd className="mt-1 font-mono text-slate-900 dark:text-white font-bold">
                                    {media.human_size}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                    {t('media.pages.show.uploaded')}
                                </dt>
                                <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                                    {formatDate(media.created_at)}
                                </dd>
                            </div>

                            {media.alt_text && (
                                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                                    <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                        {t('media.pages.show.alt_text')}
                                    </dt>
                                    <dd className="mt-1 text-slate-800 dark:text-slate-200">
                                        {media.alt_text}
                                    </dd>
                                </div>
                            )}

                            {media.description && (
                                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                                    <dt className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                        {t('media.pages.show.description')}
                                    </dt>
                                    <dd className="mt-1 text-slate-800 dark:text-slate-200">
                                        {media.description}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        {/* Copyable Public URL */}
                        <div className="pt-2">
                            <label className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                                🔗 {t('media.pages.show.url')}
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={media.url}
                                    className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 select-all"
                                />
                                <button
                                    onClick={copyUrl}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                >
                                    {copied ? (
                                        <>
                                            <span className="text-emerald-600">✓</span>
                                            {t('media.pages.show.copied')}
                                        </>
                                    ) : (
                                        <>
                                            📋 {t('media.pages.show.copy')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Actions */}
                <div className="flex justify-start">
                    <Link href={prefixedRoute('media.index')}>
                        <SecondaryButton className="!rounded-xl text-xs">
                            ← {t('media.pages.show.back')}
                        </SecondaryButton>
                    </Link>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('media.delete_confirm.title')}
                message={t('media.delete_confirm.message', { name: media.original_name })}
            />
        </DynamicLayout>
    );
}


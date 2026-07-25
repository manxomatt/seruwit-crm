import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

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
        return new Date(dateString).toLocaleString();
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('media.pages.show.head')}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={prefixedRoute('media.edit', media.id)}>
                            <PrimaryButton>{t('common.edit')}</PrimaryButton>
                        </Link>
                        <DangerButton onClick={openDeleteDialog}>{t('common.delete')}</DangerButton>
                    </div>
                </div>
            }
        >
            <Head title={t('media.pages.show.title', { name: media.original_name })} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('media.pages.show.preview')}</h3>
                        <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
                            {media.type === 'image' ? (
                                <img
                                    src={media.url}
                                    alt={media.alt_text || media.original_name}
                                    className="max-w-full max-h-[500px] object-contain"
                                />
                            ) : media.type === 'video' ? (
                                <video
                                    src={media.url}
                                    controls
                                    className="max-w-full max-h-[500px]"
                                >
                                    {t('media.video_not_supported')}
                                </video>
                            ) : (
                                <div className="text-center p-8">
                                    <svg
                                        className="mx-auto h-16 w-16 text-gray-400"
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
                                    <p className="mt-2 text-sm text-gray-500">
                                        {t('media.pages.show.preview_unavailable')}
                                    </p>
                                    <a
                                        href={media.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {t('media.pages.show.download')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('media.pages.show.information')}</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.original_name')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{media.original_name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.file_name')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{media.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.type')}</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        media.type === 'image'
                                            ? 'bg-blue-100 text-blue-800'
                                            : media.type === 'video'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {t(`media.type.${media.type}`, undefined, media.type)}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.mime_type')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{media.mime_type}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.size')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{media.human_size}</dd>
                            </div>
                            {media.alt_text && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.alt_text')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{media.alt_text}</dd>
                                </div>
                            )}
                            {media.description && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.description')}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{media.description}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.uploaded')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(media.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.last_modified')}</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(media.updated_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">{t('media.pages.show.url')}</dt>
                                <dd className="mt-1">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={media.url}
                                            className="flex-1 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2"
                                        />
                                        <button
                                            onClick={copyUrl}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            {copied ? (
                                                <>
                                                    <svg className="w-4 h-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {t('media.pages.show.copied')}
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    {t('media.pages.show.copy')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6">
                <Link href={prefixedRoute('media.index')}>
                    <SecondaryButton>{t('media.pages.show.back')}</SecondaryButton>
                </Link>
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

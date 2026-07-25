import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

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
}

interface Props {
    media: MediaItem;
}

export default function Edit({ media }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, patch, processing, errors } = useForm({
        alt_text: media.alt_text || '',
        description: media.description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('media.update', media.id));
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {t('media.pages.edit.head')}
                    </h2>
                </div>
            }
        >
            <Head title={t('media.pages.edit.title', { name: media.original_name })} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('media.pages.edit.preview')}</h3>
                        <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center aspect-square">
                            {media.type === 'image' ? (
                                <img
                                    src={media.url}
                                    alt={media.alt_text || media.original_name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : media.type === 'video' ? (
                                <video
                                    src={media.url}
                                    controls
                                    className="max-w-full max-h-full"
                                >
                                    {t('media.video_not_supported')}
                                </video>
                            ) : (
                                <div className="text-center p-4">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
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
                                    <p className="mt-2 text-xs text-gray-500">
                                        {media.original_name}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">{t('media.pages.edit.file')}:</span> {media.original_name}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">{t('media.pages.edit.type')}:</span> {media.mime_type}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">{t('media.pages.edit.size')}:</span> {media.human_size}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('media.pages.edit.details')}</h3>
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <InputLabel htmlFor="alt_text" value={t('media.fields.alt_text')} />
                                <TextInput
                                    id="alt_text"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.alt_text}
                                    onChange={(e) => setData('alt_text', e.target.value)}
                                    placeholder={t('media.placeholders.alt_text')}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('media.placeholders.alt_text_hint')}
                                </p>
                                <InputError message={errors.alt_text} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value={t('media.fields.description')} />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder={t('media.placeholders.description')}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('media.placeholders.description_hint')}
                                </p>
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    {t('media.pages.edit.submit')}
                                </PrimaryButton>
                                <Link href={prefixedRoute('media.show', media.id)}>
                                    <SecondaryButton type="button">{t('common.cancel')}</SecondaryButton>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Back Link */}
            <div className="mt-6">
                <Link href={prefixedRoute('media.index')}>
                    <SecondaryButton>{t('media.pages.edit.back')}</SecondaryButton>
                </Link>
            </div>
        </DynamicLayout>
    );
}

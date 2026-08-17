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
                <PageHeader
                    title={t('media.pages.edit.head')}
                    actions={
                        <Link href={prefixedRoute('media.show', media.id)}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('media.pages.edit.back')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('media.pages.edit.title', { name: media.original_name })} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            👁️ {t('media.pages.edit.preview')}
                        </h3>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center aspect-square p-2">
                            {media.type === 'image' ? (
                                <img
                                    src={media.url}
                                    alt={media.alt_text || media.original_name}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                />
                            ) : media.type === 'video' ? (
                                <video
                                    src={media.url}
                                    controls
                                    className="max-w-full max-h-full rounded-lg shadow-sm"
                                >
                                    {t('media.video_not_supported')}
                                </video>
                            ) : (
                                <div className="text-center p-4">
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-2 shadow-inner">
                                        📄
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                        {media.original_name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-5 space-y-2 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-slate-900 dark:text-white">{t('media.pages.edit.file')}:</span> {media.original_name}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">{t('media.pages.edit.type')}:</span> {media.mime_type}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">{t('media.pages.edit.size')}:</span> {media.human_size}
                        </p>
                    </div>
                </div>

                {/* Edit Form Container */}
                <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5">
                        ✏️ {t('media.pages.edit.details')}
                    </h3>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="alt_text" value={t('media.fields.alt_text')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="alt_text"
                                type="text"
                                className="mt-1 block w-full !rounded-xl !py-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={data.alt_text}
                                onChange={(e) => setData('alt_text', e.target.value)}
                                placeholder={t('media.placeholders.alt_text')}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                {t('media.placeholders.alt_text_hint')}
                            </p>
                            <InputError message={errors.alt_text} className="mt-1.5" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value={t('media.fields.description')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="description"
                                className="mt-1 block w-full rounded-xl text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                placeholder={t('media.placeholders.description')}
                            />
                            <p className="mt-1 text-[11px] text-slate-500">
                                {t('media.placeholders.description_hint')}
                            </p>
                            <InputError message={errors.description} className="mt-1.5" />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('media.show', media.id)}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                {t('media.pages.edit.submit')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}


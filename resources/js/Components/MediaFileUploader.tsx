import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTrans } from '@/hooks/useTrans';

export interface UploadedMedia {
    id: number;
    original_name: string;
    url: string;
    human_size: string;
    type: string;
}

interface MediaFileUploaderProps {
    value: number | null;
    onChange: (mediaId: number | null) => void;
    media?: UploadedMedia | null;
    accept?: string;
    className?: string;
}

/**
 * Uploads a file to the media library and reports back the stored media id.
 *
 * Use this wherever a form column is a `media_id` foreign key. `ImageUploader`
 * is the URL-based sibling and must not be used for id columns.
 */
export default function MediaFileUploader({
    value,
    onChange,
    media = null,
    accept = 'image/*,application/pdf',
    className = '',
}: MediaFileUploaderProps): JSX.Element {
    const { t } = useTrans();
    const [selected, setSelected] = useState<UploadedMedia | null>(media);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (value === null) {
            setSelected(null);
        }
    }, [value]);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('module.media.upload'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(
                        progressEvent.total
                            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                            : 0,
                    );
                },
            });

            const uploaded = response.data?.media as UploadedMedia | undefined;

            if (response.data?.success && uploaded?.id) {
                setSelected(uploaded);
                onChange(uploaded.id);
            } else {
                setError(t('media.uploader.error_upload'));
            }
        } catch {
            setError(t('media.uploader.error_upload'));
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const clearSelection = () => {
        setSelected(null);
        onChange(null);
        setError(null);
    };

    if (selected) {
        return (
            <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 ${className}`}>
                <div className="flex items-center gap-3">
                    {selected.type === 'image' ? (
                        <img
                            src={selected.url}
                            alt={selected.original_name}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                        />
                    ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg">
                            📄
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <a
                            href={selected.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            {selected.original_name}
                        </a>
                        <p className="text-[11px] text-slate-400">{selected.human_size}</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    >
                        {t('media.uploader.remove')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center transition-colors hover:border-indigo-400"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('media.uploader.uploading', { percent: uploadProgress })}
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className="h-full bg-indigo-500 transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {t('media.uploader.choose')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">{t('media.uploader.hint')}</p>
                    </>
                )}
            </div>

            {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
        </div>
    );
}

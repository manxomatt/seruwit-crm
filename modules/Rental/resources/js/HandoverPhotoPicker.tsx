import { ChangeEvent, useRef, useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export const MAX_HANDOVER_PHOTOS = 5;

/**
 * Downscale + JPEG-encode so several phone photos still fit in one Inertia POST
 * (same approach as Orders POD).
 */
export function downscaleImage(file: File, maxEdge = 1280, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                if (! ctx) {
                    reject(new Error('no canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function filesToCompressedDataUrls(files: FileList | null): Promise<string[]> {
    if (! files || files.length === 0) {
        return [];
    }

    const urls: string[] = [];
    for (const file of Array.from(files)) {
        if (! file.type.startsWith('image/')) {
            continue;
        }
        urls.push(await downscaleImage(file));
    }

    return urls;
}

interface Props {
    id: string;
    label: string;
    value: string[];
    onChange: (photos: string[]) => void;
    error?: string;
    max?: number;
    min?: number;
}

export default function HandoverPhotoPicker({
    id,
    label,
    value,
    onChange,
    error,
    max = MAX_HANDOVER_PHOTOS,
    min = 1,
}: Props): JSX.Element {
    const { t } = useTrans();
    const inputRef = useRef<HTMLInputElement>(null);
    const [processing, setProcessing] = useState(false);
    const remaining = Math.max(0, max - value.length);
    const canAdd = remaining > 0 && ! processing;

    const addPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files;
        if (! selected || selected.length === 0) {
            return;
        }

        setProcessing(true);
        try {
            const incoming = await filesToCompressedDataUrls(selected);
            if (incoming.length > 0) {
                onChange([...value, ...incoming].slice(0, max));
            }
        } finally {
            setProcessing(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const removePhoto = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div>
            <InputLabel htmlFor={id} value={`${label} *`} />
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {t('rental.hints.checkout_photos_count', { min, max })}
            </p>

            {value.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {value.map((photo, index) => (
                        <div
                            key={`${index}-${photo.slice(32, 64)}`}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
                        >
                            <img
                                src={photo}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white opacity-90 hover:bg-red-700"
                                title={t('rental.actions.remove')}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {canAdd ? (
                <label
                    htmlFor={id}
                    className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-gray-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20 ${
                        processing ? 'pointer-events-none opacity-60' : ''
                    }`}
                >
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={processing}
                        onChange={addPhotos}
                    />
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {processing
                            ? t('rental.hints.checkout_photos_processing')
                            : value.length === 0
                                ? t('rental.hints.checkout_photos_add')
                                : t('rental.hints.checkout_photos_add_more')}
                    </span>
                    {! processing && (
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('rental.hints.checkout_photos_remaining', { count: remaining })}
                        </span>
                    )}
                </label>
            ) : processing ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('rental.hints.checkout_photos_processing')}
                </p>
            ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('rental.hints.checkout_photos_full', { max })}
                </p>
            )}

            <InputError message={error} className="mt-1" />
        </div>
    );
}

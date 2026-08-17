import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link } from '@inertiajs/react';
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import PageHeader from '@/Components/PageHeader';

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    preview?: string;
}

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [files, setFiles] = useState<UploadingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
    };

    const addFiles = (newFiles: File[]) => {
        const uploadingFiles: UploadingFile[] = newFiles.map((file) => {
            const uploadFile: UploadingFile = {
                id: generateId(),
                file,
                progress: 0,
                status: 'pending',
            };

            if (file.type.startsWith('image/')) {
                uploadFile.preview = URL.createObjectURL(file);
            }

            return uploadFile;
        });

        setFiles((prev) => [...prev, ...uploadingFiles]);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file?.preview) {
                URL.revokeObjectURL(file.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    };

    const uploadFile = async (uploadFile: UploadingFile) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
            )
        );

        const formData = new FormData();
        formData.append('file', uploadFile.file);

        try {
            const response = await fetch(prefixedRoute('media.upload'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('media.pages.create.upload_failed'));
            }

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
                )
            );
        } catch (error) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : t('media.pages.create.upload_failed') }
                        : f
                )
            );
        }
    };

    const uploadAll = async () => {
        const pendingFiles = files.filter((f) => f.status === 'pending');
        for (const file of pendingFiles) {
            await uploadFile(file);
        }
    };

    const retryUpload = (id: string) => {
        const file = files.find((f) => f.id === id);
        if (file) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === id ? { ...f, status: 'pending' as const, error: undefined } : f
                )
            );
            uploadFile(file);
        }
    };

    const clearCompleted = () => {
        setFiles((prev) => {
            prev.filter((f) => f.status === 'success').forEach((f) => {
                if (f.preview) {
                    URL.revokeObjectURL(f.preview);
                }
            });
            return prev.filter((f) => f.status !== 'success');
        });
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return (
                <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (file.type.startsWith('video/')) {
            return (
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const pendingCount = files.filter((f) => f.status === 'pending').length;
    const successCount = files.filter((f) => f.status === 'success').length;
    const uploadingCount = files.filter((f) => f.status === 'uploading').length;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('media.pages.create.head')}
                    actions={
                        <Link href={prefixedRoute('media.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('media.pages.create.back')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('media.pages.create.title')} />

            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mb-4 shadow-inner">
                        📤
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {t('media.pages.create.dropzone_hint')}{' '}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                        >
                            {t('media.pages.create.browse')}
                        </button>
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        {t('media.pages.create.supported_types')}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{t('media.pages.create.max_size')}</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* File Upload Queue List */}
                {files.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                📋 {t('media.pages.create.files_count', { count: files.length })}
                            </h3>
                            <div className="flex gap-2">
                                {successCount > 0 && (
                                    <button
                                        onClick={clearCompleted}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
                                    >
                                        {t('media.pages.create.clear_completed', { count: successCount })}
                                    </button>
                                )}
                                {pendingCount > 0 && uploadingCount === 0 && (
                                    <PrimaryButton onClick={uploadAll} className="!rounded-xl text-xs shadow-sm">
                                        🚀 {t('media.pages.create.upload_all', { count: pendingCount })}
                                    </PrimaryButton>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {files.map((uploadFile) => (
                                <div
                                    key={uploadFile.id}
                                    className={`flex items-center gap-4 p-4 border rounded-2xl transition-all ${
                                        uploadFile.status === 'error'
                                            ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20'
                                            : uploadFile.status === 'success'
                                            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                                            : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                                    }`}
                                >
                                    {/* File Preview Icon/Image */}
                                    <div className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
                                        {uploadFile.preview ? (
                                            <img
                                                src={uploadFile.preview}
                                                alt={uploadFile.file.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            getFileIcon(uploadFile.file)
                                        )}
                                    </div>

                                    {/* Info & Progress */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {uploadFile.file.name}
                                        </p>
                                        <p className="text-[11px] font-mono text-slate-500">
                                            {formatFileSize(uploadFile.file.size)}
                                        </p>
                                        {uploadFile.status === 'uploading' && (
                                            <div className="mt-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadFile.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        {uploadFile.error && (
                                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">{uploadFile.error}</p>
                                        )}
                                    </div>

                                    {/* Status Indicator & Control Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {uploadFile.status === 'pending' && (
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('media.pages.create.pending')}</span>
                                        )}
                                        {uploadFile.status === 'uploading' && (
                                            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        )}
                                        {uploadFile.status === 'success' && (
                                            <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                                                ✓
                                            </span>
                                        )}
                                        {uploadFile.status === 'error' && (
                                            <button
                                                onClick={() => retryUpload(uploadFile.id)}
                                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                {t('media.pages.create.retry')}
                                            </button>
                                        )}
                                        {uploadFile.status !== 'uploading' && (
                                            <button
                                                onClick={() => removeFile(uploadFile.id)}
                                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Back Button */}
                <div className="mt-6 flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link href={prefixedRoute('media.index')}>
                        <SecondaryButton className="!rounded-xl text-xs">{t('media.pages.create.back')}</SecondaryButton>
                    </Link>
                </div>
            </div>
        </DynamicLayout>
    );
}


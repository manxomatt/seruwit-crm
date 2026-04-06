import AdminLayout from '@/Layouts/AdminLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    preview?: string;
}

export default function Create(): JSX.Element {
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
            const response = await fetch(route('admin.media.upload'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
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
                        ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
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
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (file.type.startsWith('video/')) {
            return (
                <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Upload Media
                    </h2>
                </div>
            }
        >
            <Head title="Upload Media" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDragging
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                    >
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                            Drag and drop files here, or{' '}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                                browse
                            </button>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Supported: Images (JPEG, PNG, GIF, WebP, SVG), Videos (MP4, WebM, MOV), Documents (PDF, DOC, DOCX, XLS, XLSX)
                        </p>
                        <p className="text-xs text-gray-500">Max file size: 50MB</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Files ({files.length})
                                </h3>
                                <div className="flex gap-2">
                                    {successCount > 0 && (
                                        <button
                                            onClick={clearCompleted}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Clear completed ({successCount})
                                        </button>
                                    )}
                                    {pendingCount > 0 && uploadingCount === 0 && (
                                        <PrimaryButton onClick={uploadAll}>
                                            Upload All ({pendingCount})
                                        </PrimaryButton>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {files.map((uploadFile) => (
                                    <div
                                        key={uploadFile.id}
                                        className={`flex items-center gap-4 p-3 border rounded-lg ${
                                            uploadFile.status === 'error'
                                                ? 'border-red-200 bg-red-50'
                                                : uploadFile.status === 'success'
                                                ? 'border-green-200 bg-green-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        {/* Preview */}
                                        <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
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

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {uploadFile.file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(uploadFile.file.size)}
                                            </p>
                                            {uploadFile.status === 'uploading' && (
                                                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${uploadFile.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            {uploadFile.error && (
                                                <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                                            )}
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-2">
                                            {uploadFile.status === 'pending' && (
                                                <span className="text-xs text-gray-500">Pending</span>
                                            )}
                                            {uploadFile.status === 'uploading' && (
                                                <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            )}
                                            {uploadFile.status === 'success' && (
                                                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {uploadFile.status === 'error' && (
                                                <button
                                                    onClick={() => retryUpload(uploadFile.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-500"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                            {uploadFile.status !== 'uploading' && (
                                                <button
                                                    onClick={() => removeFile(uploadFile.id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-4">
                        <Link href={route('admin.media.index')}>
                            <SecondaryButton>Back to Library</SecondaryButton>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

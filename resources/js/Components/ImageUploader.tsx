import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

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
}

interface ImageUploaderProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

type TabType = 'url' | 'upload' | 'library';

export default function ImageUploader({
    value,
    onChange,
    className = '',
}: ImageUploaderProps): JSX.Element {
    const [activeTab, setActiveTab] = useState<TabType>('url');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadMediaLibrary = useCallback(async () => {
        setIsLoadingLibrary(true);
        setError(null);
        try {
            const response = await axios.get(route('module.media.picker'), {
                params: {
                    type: 'image',
                    search: searchQuery || undefined,
                },
            });
            setMediaLibrary(response.data.data || []);
        } catch {
            setError('Failed to load media library');
        } finally {
            setIsLoadingLibrary(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (activeTab === 'library') {
            loadMediaLibrary();
        }
    }, [activeTab, loadMediaLibrary]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(route('module.media.upload'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(progress);
                },
            });

            if (response.data.success && response.data.media?.url) {
                onChange(response.data.media.url);
                setActiveTab('url');
            }
        } catch {
            setError('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    }, []);

    const selectFromLibrary = (media: MediaItem) => {
        onChange(media.url);
        setActiveTab('url');
    };

    const tabButtonClass = (tab: TabType) =>
        `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === tab
                ? 'bg-white text-indigo-600 border-t border-l border-r border-gray-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`;

    return (
        <div className={`border border-gray-300 rounded-md overflow-hidden ${className}`}>
            {/* Tabs */}
            <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={tabButtonClass('url')}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        URL
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={tabButtonClass('upload')}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className={tabButtonClass('library')}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Library
                    </span>
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Tab content */}
            <div className="p-4">
                {/* URL Tab */}
                {activeTab === 'url' && (
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Enter the URL of the image you want to use.
                            </p>
                        </div>
                        {value && (
                            <div className="relative">
                                <img
                                    src={value}
                                    alt="Preview"
                                    className="max-h-48 rounded-lg border border-gray-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => onChange('')}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    title="Remove image"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isUploading ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isUploading}
                        />
                        {isUploading ? (
                            <div className="space-y-3">
                                <div className="w-12 h-12 mx-auto border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Click to upload
                                    </button>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </div>
                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Library Tab */}
                {activeTab === 'library' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search images..."
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={loadMediaLibrary}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>

                        {isLoadingLibrary ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                        ) : mediaLibrary.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>No images found in your library.</p>
                                <p className="text-sm mt-1">Upload some images first!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                                {mediaLibrary.map((media) => (
                                    <button
                                        key={media.id}
                                        type="button"
                                        onClick={() => selectFromLibrary(media)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-indigo-500 ${
                                            value === media.url ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={media.url}
                                            alt={media.alt_text || media.original_name}
                                            className="w-full h-full object-cover"
                                        />
                                        {value === media.url && (
                                            <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

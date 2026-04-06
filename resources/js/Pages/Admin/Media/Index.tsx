import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

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

interface PaginatedMedia {
    data: MediaItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Filters {
    type: string | null;
    search: string | null;
}

interface Props {
    media: PaginatedMedia;
    filters: Filters;
}

export default function Index({ media, filters }: Props): JSX.Element {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.media.index'), {
            search: search || undefined,
            type: typeFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('');
        router.get(route('admin.media.index'));
    };

    const toggleSelectItem = (id: number) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === media.data.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(media.data.map((item) => item.id));
        }
    };

    const openDeleteDialog = (item: MediaItem) => {
        setMediaToDelete(item);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setMediaToDelete(null);
    };

    const confirmDelete = () => {
        if (!mediaToDelete) return;

        setProcessing(true);
        router.delete(route('admin.media.destroy', mediaToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const openBulkDeleteDialog = () => {
        if (selectedItems.length === 0) return;
        setShowBulkDeleteDialog(true);
    };

    const closeBulkDeleteDialog = () => {
        setShowBulkDeleteDialog(false);
    };

    const confirmBulkDelete = () => {
        setProcessing(true);
        router.post(route('admin.media.bulk-destroy'), {
            ids: selectedItems,
        }, {
            onSuccess: () => {
                setSelectedItems([]);
                closeBulkDeleteDialog();
            },
            onFinish: () => setProcessing(false),
        });
    };

    const getFileIcon = (type: string, mimeType: string) => {
        if (type === 'image') {
            return (
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (type === 'video') {
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

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Media Library
                    </h2>
                    <Link href={route('admin.media.create')}>
                        <PrimaryButton>Upload Media</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Media Library" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* Filters */}
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <TextInput
                                type="text"
                                placeholder="Search media..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">All Types</option>
                                <option value="image">Images</option>
                                <option value="video">Videos</option>
                                <option value="document">Documents</option>
                            </select>
                        </div>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                        {(filters.search || filters.type) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Clear filters
                            </button>
                        )}
                    </form>

                    {/* Bulk Actions */}
                    {selectedItems.length > 0 && (
                        <div className="mb-4 flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">
                                {selectedItems.length} item(s) selected
                            </span>
                            <DangerButton onClick={openBulkDeleteDialog}>
                                Delete Selected
                            </DangerButton>
                            <button
                                onClick={() => setSelectedItems([])}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}

                    {media.data.length === 0 ? (
                        <div className="text-center py-12">
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
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by uploading your first media file.
                            </p>
                            <div className="mt-6">
                                <Link href={route('admin.media.create')}>
                                    <PrimaryButton>Upload Media</PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Select All */}
                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.length === media.data.length && media.data.length > 0}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Select all</span>
                            </div>

                            {/* Media Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {media.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`relative group border rounded-lg overflow-hidden ${
                                            selectedItems.includes(item.id) ? 'ring-2 ring-indigo-500' : ''
                                        }`}
                                    >
                                        {/* Checkbox */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => toggleSelectItem(item.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                                            />
                                        </div>

                                        {/* Preview */}
                                        <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                            {item.type === 'image' ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.alt_text || item.original_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                getFileIcon(item.type, item.mime_type)
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-gray-900 truncate" title={item.original_name}>
                                                {item.original_name}
                                            </p>
                                            <p className="text-xs text-gray-500">{item.human_size}</p>
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Link
                                                href={route('admin.media.show', item.id)}
                                                className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
                                                title="View"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={route('admin.media.edit', item.id)}
                                                className="p-2 bg-white rounded-full text-gray-700 hover:text-indigo-600"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => openDeleteDialog(item)}
                                                className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {media.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(media.current_page - 1) * media.per_page + 1} to{' '}
                                        {Math.min(media.current_page * media.per_page, media.total)} of{' '}
                                        {media.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {media.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Single Delete Dialog */}
            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title="Hapus Media"
                message={
                    mediaToDelete ? (
                        <>
                            Apakah Anda yakin ingin menghapus file{' '}
                            <strong>"{mediaToDelete.original_name}"</strong>? Tindakan ini tidak
                            dapat dibatalkan.
                        </>
                    ) : (
                        'Apakah Anda yakin ingin menghapus file ini?'
                    )
                }
            />

            {/* Bulk Delete Dialog */}
            <ConfirmDeleteDialog
                show={showBulkDeleteDialog}
                onClose={closeBulkDeleteDialog}
                onConfirm={confirmBulkDelete}
                processing={processing}
                title="Hapus Media Terpilih"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus{' '}
                        <strong>{selectedItems.length} file</strong> yang dipilih? Tindakan ini
                        tidak dapat dibatalkan.
                    </>
                }
            />
        </AdminLayout>
    );
}

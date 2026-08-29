import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler, useEffect } from 'react';
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

interface MediaStats {
    total_files: number;
    total_images: number;
    total_videos: number;
    total_documents: number;
}

interface Props {
    media: PaginatedMedia;
    stats?: MediaStats;
    filters: Filters;
    can?: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

type ViewMode = 'table' | 'grid';

export default function Index({ media, stats, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const canCreate = can?.create ?? true;
    const canUpdate = can?.update ?? true;
    const canDelete = can?.delete ?? true;
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('mediaViewMode') as ViewMode) || 'table';
        }
        return 'table';
    });

    const EyeIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const PencilIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );

    const TrashIcon = () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    );

    const EllipsisVerticalIcon = () => (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
        </svg>
    );

    const menuItemClassName =
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition data-[focus]:bg-rose-50 dark:data-[focus]:bg-rose-950/30';

    useEffect(() => {
        localStorage.setItem('mediaViewMode', viewMode);
    }, [viewMode]);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('media.index'), {
            search: search || undefined,
            type: typeFilter || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTypeFilter = (type: string) => {
        setTypeFilter(type);
        router.get(prefixedRoute('media.index'), {
            search: search || undefined,
            type: type || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('');
        router.get(prefixedRoute('media.index'));
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
        router.delete(prefixedRoute('media.destroy', mediaToDelete.id), {
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
        router.post(prefixedRoute('media.bulk-destroy'), {
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
                <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }
        if (type === 'video') {
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

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'image':
                return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/50';
            case 'video':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/50';
            default:
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/50';
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('media.pages.index.head')}
                    actions={canCreate && (
                        <Link href={prefixedRoute('media.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                📤 {t('media.pages.index.upload')}
                            </PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('media.pages.index.head')} />

            <div className="space-y-6">
                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-semibold shadow-inner">
                                📁
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_files ?? media.total}
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {t('media.stats.total_files')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-lg font-semibold shadow-inner">
                                🖼️
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_images ?? 0}
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {t('media.stats.images')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg font-semibold shadow-inner">
                                🎥
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_videos ?? 0}
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {t('media.stats.videos')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-semibold shadow-inner">
                                📄
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_documents ?? 0}
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {t('media.stats.documents')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & View Switcher Bar */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        {/* Search & Type Filters */}
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px]">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder={t('media.placeholders.search')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </form>

                            {/* Type Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                {[
                                    { key: '', label: t('media.type.all') },
                                    { key: 'image', label: t('media.type.images') },
                                    { key: 'video', label: t('media.type.videos') },
                                    { key: 'document', label: t('media.type.documents') },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTypeFilter(tab.key)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            typeFilter === tab.key
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mode Switcher & Select All */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                            {media.data.length > 0 && (
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === media.data.length && media.data.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {t('media.pages.index.select_all')}
                                </label>
                            )}

                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    title={t('media.pages.index.view_modes.table', undefined, 'Tampilan Tabel')}
                                    className={`rounded-lg p-1.5 transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5m-16.5-7.5h16.5" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    title={t('media.pages.index.view_modes.grid', undefined, 'Tampilan Kartu')}
                                    className={`rounded-lg p-1.5 transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bulk Selection Bar */}
                    {selectedItems.length > 0 && (
                        <div className="flex items-center justify-between p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                ✨ {t('media.pages.index.selected_count', { count: selectedItems.length })}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedItems([])}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
                                >
                                    {t('media.pages.index.clear_selection')}
                                </button>
                                <DangerButton onClick={openBulkDeleteDialog} className="!rounded-xl text-xs shadow-sm">
                                    🗑️ {t('media.pages.index.delete_selected')}
                                </DangerButton>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {media.data.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-3">
                                🖼️
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('media.pages.index.empty_title')}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {t('media.pages.index.empty_hint')}
                            </p>
                            {canCreate && (
                                <div className="mt-5">
                                    <Link href={prefixedRoute('media.create')}>
                                        <PrimaryButton className="!rounded-xl text-xs">
                                            📤 {t('media.pages.index.upload')}
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {media.data.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`relative group rounded-2xl border overflow-hidden bg-slate-50 dark:bg-slate-800/40 transition-all hover:shadow-md ${
                                                selectedItems.includes(item.id)
                                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/40'
                                                    : 'border-slate-200/80 dark:border-slate-800'
                                            }`}
                                        >
                                            {/* Checkbox Overlay */}
                                            <div className="absolute top-2.5 left-2.5 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => toggleSelectItem(item.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white/90 dark:bg-slate-900/90 shadow-sm"
                                                />
                                            </div>

                                            {/* Type Badge */}
                                            <div className="absolute top-2.5 right-2.5 z-10">
                                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getTypeBadgeClass(item.type)}`}>
                                                    {t(`media.type.${item.type}`, undefined, item.type)}
                                                </span>
                                            </div>

                                            {/* Preview Container */}
                                            <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {item.type === 'image' ? (
                                                    <img
                                                        src={item.url}
                                                        alt={item.alt_text || item.original_name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="p-4 text-center">
                                                        {getFileIcon(item.type, item.mime_type)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Footer */}
                                            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.original_name}>
                                                    {item.original_name}
                                                </p>
                                                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                                                    <span>{item.human_size}</span>
                                                    <span>{new Date(item.created_at).toLocaleDateString(localeTag, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>

                                            {/* Hover Actions Overlay */}
                                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                                <Link
                                                    href={prefixedRoute('media.show', item.id)}
                                                    className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-xl text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-sm transition-transform hover:scale-110"
                                                    title={t('media.actions.view')}
                                                >
                                                    <EyeIcon />
                                                </Link>
                                                {canUpdate && (
                                                    <Link
                                                        href={prefixedRoute('media.edit', item.id)}
                                                        className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-xl text-slate-700 dark:text-slate-200 hover:text-indigo-600 shadow-sm transition-transform hover:scale-110"
                                                        title={t('common.edit')}
                                                    >
                                                        <PencilIcon />
                                                    </Link>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => openDeleteDialog(item)}
                                                        className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-xl text-rose-600 shadow-sm transition-transform hover:scale-110"
                                                        title={t('common.delete')}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Table / List View */}
                            {viewMode === 'table' && (
                                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                <th scope="col" className="w-12 px-4 py-3 text-center">
                                                    <span className="sr-only">{t('media.pages.index.columns.select')}</span>
                                                </th>
                                                <th scope="col" className="w-16 px-4 py-3">
                                                    {t('media.pages.index.columns.preview')}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t('media.pages.index.columns.name')}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t('media.pages.index.columns.type')}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t('media.pages.index.columns.size')}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t('media.pages.index.columns.uploaded')}
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    {t('common.actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {media.data.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                                                        selectedItems.includes(item.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                                    }`}
                                                >
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => toggleSelectItem(item.id)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
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
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs" title={item.original_name}>
                                                                {item.original_name}
                                                            </span>
                                                            {item.alt_text && (
                                                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs" title={item.alt_text}>
                                                                    {item.alt_text}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeBadgeClass(item.type)}`}>
                                                            {t(`media.type.${item.type}`, undefined, item.type)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                                                        {item.human_size}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                                                        {new Date(item.created_at).toLocaleDateString(localeTag, {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Menu as="div" className="relative inline-block text-right">
                                                            <MenuButton
                                                                className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                                                title={t('common.actions')}
                                                            >
                                                                <EllipsisVerticalIcon />
                                                            </MenuButton>

                                                            <MenuItems
                                                                transition
                                                                anchor="bottom end"
                                                                className="z-50 w-44 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                            >
                                                                <MenuItem>
                                                                    <Link
                                                                        href={prefixedRoute('media.show', item.id)}
                                                                        className={menuItemClassName}
                                                                    >
                                                                        <EyeIcon />
                                                                        {t('media.actions.view')}
                                                                    </Link>
                                                                </MenuItem>
                                                                {canUpdate && (
                                                                    <MenuItem>
                                                                        <Link
                                                                            href={prefixedRoute('media.edit', item.id)}
                                                                            className={menuItemClassName}
                                                                        >
                                                                            <PencilIcon />
                                                                            {t('common.edit')}
                                                                        </Link>
                                                                    </MenuItem>
                                                                )}
                                                                {canDelete && (
                                                                    <>
                                                                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                                        <MenuItem>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openDeleteDialog(item)}
                                                                                className={menuItemDangerClassName}
                                                                            >
                                                                                <TrashIcon />
                                                                                {t('common.delete')}
                                                                            </button>
                                                                        </MenuItem>
                                                                    </>
                                                                )}
                                                            </MenuItems>
                                                        </Menu>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {media.last_page > 1 && (
                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 font-medium">
                                        {t('common.showing_results', {
                                            from: (media.current_page - 1) * media.per_page + 1,
                                            to: Math.min(media.current_page * media.per_page, media.total),
                                            total: media.total,
                                        })}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {media.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : link.url
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
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
                title={t('media.delete_confirm.title')}
                message={
                    mediaToDelete
                        ? t('media.delete_confirm.message', { name: mediaToDelete.original_name })
                        : t('media.delete_confirm.message_generic')
                }
            />

            {/* Bulk Delete Dialog */}
            <ConfirmDeleteDialog
                show={showBulkDeleteDialog}
                onClose={closeBulkDeleteDialog}
                onConfirm={confirmBulkDelete}
                processing={processing}
                title={t('media.delete_confirm.bulk_title')}
                message={t('media.delete_confirm.bulk_message', { count: selectedItems.length })}
            />
        </DynamicLayout>
    );
}


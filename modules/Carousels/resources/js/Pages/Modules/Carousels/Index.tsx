import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

interface Carousel {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    images_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    carousels: Carousel[];
    can?: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export default function Index({ carousels, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const canCreate = can?.create ?? true;
    const canUpdate = can?.update ?? true;
    const canDelete = can?.delete ?? true;

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [carouselToDelete, setCarouselToDelete] = useState<Carousel | null>(null);
    const [processing, setProcessing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Stats calculations
    const stats = useMemo(() => {
        const total = carousels.length;
        const active = carousels.filter((c) => c.is_active).length;
        const inactive = total - active;
        const totalImages = carousels.reduce((acc, curr) => acc + (curr.images_count || 0), 0);
        return { total, active, inactive, totalImages };
    }, [carousels]);

    // Filtered carousels
    const filteredCarousels = useMemo(() => {
        return carousels.filter((carousel) => {
            const matchesSearch =
                carousel.name.toLowerCase().includes(search.toLowerCase()) ||
                carousel.slug.toLowerCase().includes(search.toLowerCase()) ||
                (carousel.description && carousel.description.toLowerCase().includes(search.toLowerCase()));

            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'active'
                    ? carousel.is_active
                    : !carousel.is_active;

            return matchesSearch && matchesStatus;
        });
    }, [carousels, search, statusFilter]);

    const menuItemClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition';

    const openDeleteDialog = (carousel: Carousel) => {
        setCarouselToDelete(carousel);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setCarouselToDelete(null);
    };

    const confirmDelete = () => {
        if (!carouselToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('carousels.destroy', carouselToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const toggleActive = (carousel: Carousel) => {
        router.patch(prefixedRoute('carousels.update', carousel.id), {
            is_active: !carousel.is_active,
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('carousels.title')}
                    actions={canCreate && (
                        <Link href={prefixedRoute('carousels.create')}>
                            <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                ➕ {t('carousels.create')}
                            </PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('carousels.title')} />

            <div className="space-y-6">
                {/* Stat Overview Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                🎠
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Carousels</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                ✅
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active</p>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-lg font-bold">
                                ⏸️
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inactive</p>
                                <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.inactive}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-lg font-bold">
                                🖼️
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Images</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.totalImages}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                🔍
                            </span>
                            <TextInput
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search carousel name or slug..."
                                className="w-full pl-9 text-xs !rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
                            {(['all', 'active', 'inactive'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setStatusFilter(mode)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                                        statusFilter === mode
                                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {filteredCarousels.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl mb-3">
                                🎠
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('carousels.empty_title')}</h3>
                            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                                {t('carousels.empty_hint')}
                            </p>
                            {canCreate && (
                                <div className="mt-5">
                                    <Link href={prefixedRoute('carousels.create')}>
                                        <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                            ➕ {t('carousels.create')}
                                        </PrimaryButton>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <tr>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('carousels.columns.name')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('carousels.columns.slug')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('carousels.columns.images')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('carousels.columns.status')}
                                        </th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-400">
                                            {t('carousels.columns.updated')}
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-400">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                    {filteredCarousels.map((carousel) => (
                                        <tr key={carousel.id} className="group hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {carousel.name}
                                                    </span>
                                                    {carousel.description && (
                                                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                                                            {carousel.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {carousel.slug}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-800/50">
                                                    🖼️ {t('carousels.images_count', { count: carousel.images_count })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleActive(carousel)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                                                        carousel.is_active
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100'
                                                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${carousel.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    {carousel.is_active ? t('carousels.active') : t('carousels.inactive')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                                {new Date(carousel.updated_at).toLocaleDateString(localeTag)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                        title={t('common.actions')}
                                                    >
                                                        ⚙️
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-48 origin-top-right rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('carousels.show', carousel.id)}
                                                                className={menuItemClassName}
                                                            >
                                                                👁️ {t('carousels.preview')}
                                                            </Link>
                                                        </MenuItem>
                                                        {canUpdate && (
                                                            <MenuItem>
                                                                <Link
                                                                    href={prefixedRoute('carousels.edit', carousel.id)}
                                                                    className={menuItemClassName}
                                                                >
                                                                    ✏️ {t('common.edit')}
                                                                </Link>
                                                            </MenuItem>
                                                        )}
                                                        {(canUpdate || canDelete) && (
                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                        )}
                                                        {canDelete && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteDialog(carousel)}
                                                                    className={menuItemDangerClassName}
                                                                >
                                                                    🗑️ {t('common.delete')}
                                                                </button>
                                                            </MenuItem>
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
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title={t('carousels.delete.carousel_title')}
                message={
                    carouselToDelete
                        ? t('carousels.delete.carousel_message', { name: carouselToDelete.name })
                        : t('carousels.delete.carousel_generic')
                }
            />
        </DynamicLayout>
    );
}


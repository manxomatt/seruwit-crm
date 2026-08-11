import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import PageHeader from '@/Components/PageHeader';

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

    const EyeIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    const PencilIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );

    const TrashIcon = () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-700 transition data-[focus]:bg-gray-50 data-[focus]:text-gray-900';

    const menuItemDangerClassName =
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-red-600 transition data-[focus]:bg-red-50 data-[focus]:text-red-700';

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
                            <PrimaryButton>{t('carousels.create')}</PrimaryButton>
                        </Link>
                    )}
                />
            }
        >
            <Head title={t('carousels.title')} />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {carousels.length === 0 ? (
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
                            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('carousels.empty_title')}</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('carousels.empty_hint')}
                            </p>
                            {canCreate && (
                                <div className="mt-6">
                                    <Link href={prefixedRoute('carousels.create')}>
                                        <PrimaryButton>{t('carousels.create')}</PrimaryButton>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('carousels.columns.name')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('carousels.columns.slug')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('carousels.columns.images')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('carousels.columns.status')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('carousels.columns.updated')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {carousels.map((carousel) => (
                                        <tr key={carousel.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {carousel.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {carousel.slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {t('carousels.images_count', { count: carousel.images_count })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleActive(carousel)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${carousel.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {carousel.is_active ? t('carousels.active') : t('carousels.inactive')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(carousel.updated_at).toLocaleDateString(localeTag)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Menu as="div" className="relative inline-block text-right">
                                                    <MenuButton
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                                        title={t('common.actions')}
                                                        aria-label={t('common.actions')}
                                                    >
                                                        <EllipsisVerticalIcon />
                                                    </MenuButton>

                                                    <MenuItems
                                                        transition
                                                        anchor="bottom end"
                                                        className="z-50 w-52 origin-top-right rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
                                                    >
                                                        <MenuItem>
                                                            <Link
                                                                href={prefixedRoute('carousels.show', carousel.id)}
                                                                className={menuItemClassName}
                                                                title={t('carousels.preview')}
                                                            >
                                                                <span className="text-gray-500">
                                                                    <EyeIcon />
                                                                </span>
                                                                {t('carousels.preview')}
                                                            </Link>
                                                        </MenuItem>
                                                        {canUpdate && (
                                                            <MenuItem>
                                                                <Link
                                                                    href={prefixedRoute('carousels.edit', carousel.id)}
                                                                    className={menuItemClassName}
                                                                    title={t('common.edit')}
                                                                >
                                                                    <span className="text-indigo-600">
                                                                        <PencilIcon />
                                                                    </span>
                                                                    {t('common.edit')}
                                                                </Link>
                                                            </MenuItem>
                                                        )}
                                                        {(canUpdate || canDelete) && (
                                                            <div className="my-1 border-t border-gray-100" />
                                                        )}
                                                        {canDelete && (
                                                            <MenuItem>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteDialog(carousel)}
                                                                    className={menuItemDangerClassName}
                                                                    title={t('common.delete')}
                                                                >
                                                                    <TrashIcon />
                                                                    {t('common.delete')}
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

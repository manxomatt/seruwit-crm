import AdminLayout from '@/Layouts/AdminLayout';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

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
}

export default function Index({ carousels }: Props): JSX.Element {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [carouselToDelete, setCarouselToDelete] = useState<Carousel | null>(null);
    const [processing, setProcessing] = useState(false);

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
        router.delete(route('admin.carousels.destroy', carouselToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    const toggleActive = (carousel: Carousel) => {
        router.patch(route('admin.carousels.update', carousel.id), {
            is_active: !carousel.is_active,
        });
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Image Carousels
                    </h2>
                    <Link href={route('admin.carousels.create')}>
                        <PrimaryButton>Create New Carousel</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Image Carousels" />

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
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No carousels</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by creating a new image carousel.
                            </p>
                            <div className="mt-6">
                                <Link href={route('admin.carousels.create')}>
                                    <PrimaryButton>Create New Carousel</PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Slug
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Images
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Updated
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {carousels.map((carousel) => (
                                        <tr key={carousel.id}>
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
                                                    {carousel.images_count} images
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleActive(carousel)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        carousel.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {carousel.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(carousel.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Link
                                                    href={route('admin.carousels.edit', carousel.id)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    href={route('admin.carousels.show', carousel.id)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Preview
                                                </Link>
                                                <button
                                                    onClick={() => openDeleteDialog(carousel)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
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
                title="Hapus Carousel"
                message={
                    carouselToDelete ? (
                        <>
                            Apakah Anda yakin ingin menghapus carousel{' '}
                            <strong>"{carouselToDelete.name}"</strong>? Semua gambar dalam
                            carousel ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                        </>
                    ) : (
                        'Apakah Anda yakin ingin menghapus carousel ini?'
                    )
                }
            />
        </AdminLayout>
    );
}

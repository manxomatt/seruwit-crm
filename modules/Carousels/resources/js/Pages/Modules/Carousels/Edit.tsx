import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import CarouselImageUploader from '../../../CarouselImageUploader';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useRef } from 'react';

interface CarouselImage {
    id: number;
    image_path: string;
    title: string | null;
    description: string | null;
    link_url: string | null;
    link_target: string;
    button_text: string | null;
    sort_order: number;
    is_active: boolean;
}

interface Carousel {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    autoplay_interval: number;
    show_navigation: boolean;
    show_indicators: boolean;
    images: CarouselImage[];
}

interface Props {
    carousel: Carousel;
}

export default function Edit({ carousel }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<CarouselImage | null>(null);
    const [deleteProcessing, setDeleteProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, patch, processing, errors } = useForm({
        name: carousel.name,
        slug: carousel.slug,
        description: carousel.description || '',
        is_active: carousel.is_active,
        autoplay_interval: carousel.autoplay_interval,
        show_navigation: carousel.show_navigation,
        show_indicators: carousel.show_indicators,
    });

    const imageForm = useForm({
        image: null as File | null,
        image_url: '',
        title: '',
        description: '',
        link_url: '',
        link_target: '_self',
        button_text: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('carousels.update', carousel.id));
    };

    const openAddImageModal = () => {
        setEditingImage(null);
        imageForm.reset();
        setShowImageModal(true);
    };

    const openEditImageModal = (image: CarouselImage) => {
        setEditingImage(image);
        imageForm.setData({
            image: null,
            image_url: '',
            title: image.title || '',
            description: image.description || '',
            link_url: image.link_url || '',
            link_target: image.link_target,
            button_text: image.button_text || '',
            is_active: image.is_active,
        });
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setEditingImage(null);
        imageForm.reset();
    };

    const submitImage: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (editingImage) {
            imageForm.post(prefixedRoute('carousels.images.update', [carousel.id, editingImage.id]), {
                method: 'patch',
                forceFormData: true,
                onSuccess: () => closeImageModal(),
            });
        } else {
            imageForm.post(prefixedRoute('carousels.images.store', carousel.id), {
                forceFormData: true,
                onSuccess: () => closeImageModal(),
            });
        }
    };

    const openDeleteDialog = (image: CarouselImage) => {
        setImageToDelete(image);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setImageToDelete(null);
    };

    const confirmDeleteImage = () => {
        if (!imageToDelete) return;
        
        setDeleteProcessing(true);
        router.delete(prefixedRoute('carousels.images.destroy', [carousel.id, imageToDelete.id]), {
            onFinish: () => {
                setDeleteProcessing(false);
                closeDeleteDialog();
            },
        });
    };

    const moveImage = (image: CarouselImage, direction: 'up' | 'down') => {
        const images = [...carousel.images];
        const currentIndex = images.findIndex((img) => img.id === image.id);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= images.length) return;

        const reorderedImages = images.map((img, index) => {
            if (index === currentIndex) return { id: img.id, sort_order: newIndex };
            if (index === newIndex) return { id: img.id, sort_order: currentIndex };
            return { id: img.id, sort_order: index };
        });

        router.post(prefixedRoute('carousels.images.reorder', carousel.id), {
            images: reorderedImages,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Edit Carousel: {carousel.name}
                    </h2>
                </div>
            }
        >
            <Head title={`Edit Carousel: ${carousel.name}`} />

            <div className="space-y-6">
                {/* Carousel Settings */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Carousel Settings</h3>
                        <form onSubmit={submit} className="space-y-6 max-w-2xl">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="slug" value="Slug" />
                                <TextInput
                                    id="slug"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    required
                                />
                                <InputError message={errors.slug} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value="Description (optional)" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="autoplay_interval" value="Autoplay Interval (ms)" />
                                <TextInput
                                    id="autoplay_interval"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.autoplay_interval}
                                    onChange={(e) => setData('autoplay_interval', parseInt(e.target.value))}
                                    min={1000}
                                    max={30000}
                                    step={500}
                                />
                                <InputError message={errors.autoplay_interval} className="mt-2" />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Active
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="show_navigation"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={data.show_navigation}
                                        onChange={(e) => setData('show_navigation', e.target.checked)}
                                    />
                                    <label htmlFor="show_navigation" className="ml-2 block text-sm text-gray-900">
                                        Show Navigation Arrows
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="show_indicators"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={data.show_indicators}
                                        onChange={(e) => setData('show_indicators', e.target.checked)}
                                    />
                                    <label htmlFor="show_indicators" className="ml-2 block text-sm text-gray-900">
                                        Show Slide Indicators
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <PrimaryButton disabled={processing}>
                                    Save Settings
                                </PrimaryButton>
                                <Link href={prefixedRoute('carousels.index')}>
                                    <SecondaryButton type="button">Back to List</SecondaryButton>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Carousel Images */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Carousel Images</h3>
                            <PrimaryButton onClick={openAddImageModal}>
                                Add Image
                            </PrimaryButton>
                        </div>

                        {carousel.images.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
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
                                <p className="mt-2 text-sm text-gray-500">No images added yet</p>
                                <button
                                    onClick={openAddImageModal}
                                    className="mt-4 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                                >
                                    Add your first image
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {carousel.images.map((image, index) => (
                                    <div
                                        key={image.id}
                                        className={`relative border rounded-lg overflow-hidden ${
                                            !image.is_active ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <img
                                            src={image.image_path.startsWith('http') ? image.image_path : `/storage/${image.image_path}`}
                                            alt={image.title || 'Carousel image'}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-3">
                                            {image.title && (
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {image.title}
                                                </h4>
                                            )}
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">
                                                    Order: {image.sort_order + 1}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                        image.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {image.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => moveImage(image, 'up')}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        title="Move up"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => moveImage(image, 'down')}
                                                        disabled={index === carousel.images.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        title="Move down"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditImageModal(image)}
                                                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(image)}
                                                        className="text-red-600 hover:text-red-900 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDeleteImage}
                processing={deleteProcessing}
                title="Hapus Gambar"
                message={
                    <>
                        Apakah Anda yakin ingin menghapus gambar
                        {imageToDelete?.title && (
                            <>
                                {' '}<strong>"{imageToDelete.title}"</strong>
                            </>
                        )}
                        ? Gambar akan dihapus secara permanen dari carousel.
                        Tindakan ini tidak dapat dibatalkan.
                    </>
                }
            />

            {/* Image Modal */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={closeImageModal}
                        />
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <form onSubmit={submitImage}>
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        {editingImage ? 'Edit Image' : 'Add Image'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="image" value={editingImage ? 'Replace Image (optional)' : 'Image'} />
                                            <CarouselImageUploader
                                                onFileSelect={(file) => imageForm.setData('image', file)}
                                                onUrlSelect={(url) => imageForm.setData('image_url', url)}
                                                currentImageUrl={editingImage ? (editingImage.image_path.startsWith('http') ? editingImage.image_path : `/storage/${editingImage.image_path}`) : ''}
                                                isEditing={!!editingImage}
                                                className="mt-1"
                                            />
                                            <InputError message={imageForm.errors.image} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="image_title" value="Title (optional)" />
                                            <TextInput
                                                id="image_title"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={imageForm.data.title}
                                                onChange={(e) => imageForm.setData('title', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="image_description" value="Description (optional)" />
                                            <textarea
                                                id="image_description"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={imageForm.data.description}
                                                onChange={(e) => imageForm.setData('description', e.target.value)}
                                                rows={2}
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="link_url" value="Link URL (optional)" />
                                            <TextInput
                                                id="link_url"
                                                type="url"
                                                className="mt-1 block w-full"
                                                value={imageForm.data.link_url}
                                                onChange={(e) => imageForm.setData('link_url', e.target.value)}
                                                placeholder="https://example.com"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="link_target" value="Link Target" />
                                            <Select
                                                id="link_target"
                                                className="mt-1"
                                                value={imageForm.data.link_target}
                                                onChange={(value) => imageForm.setData('link_target', value)}
                                                options={[
                                                    { value: '_self', label: 'Same Window' },
                                                    { value: '_blank', label: 'New Window' },
                                                ]}
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="button_text" value="Button Text (optional)" />
                                            <TextInput
                                                id="button_text"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={imageForm.data.button_text}
                                                onChange={(e) => imageForm.setData('button_text', e.target.value)}
                                                placeholder="Learn More"
                                            />
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                id="image_is_active"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={imageForm.data.is_active}
                                                onChange={(e) => imageForm.setData('is_active', e.target.checked)}
                                            />
                                            <label htmlFor="image_is_active" className="ml-2 block text-sm text-gray-900">
                                                Active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <PrimaryButton
                                        type="submit"
                                        className="w-full sm:ml-3 sm:w-auto"
                                        disabled={imageForm.processing}
                                    >
                                        {editingImage ? 'Update Image' : 'Add Image'}
                                    </PrimaryButton>
                                    <SecondaryButton
                                        type="button"
                                        className="mt-3 w-full sm:mt-0 sm:w-auto"
                                        onClick={closeImageModal}
                                    >
                                        Cancel
                                    </SecondaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DynamicLayout>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';

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

export default function Show({ carousel }: Props): JSX.Element {
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeImages = carousel.images.filter((img) => img.is_active);

    const goToNext = useCallback(() => {
        if (activeImages.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, [activeImages.length]);

    const goToPrev = useCallback(() => {
        if (activeImages.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
    }, [activeImages.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (activeImages.length <= 1) return;

        const interval = setInterval(goToNext, carousel.autoplay_interval);
        return () => clearInterval(interval);
    }, [activeImages.length, carousel.autoplay_interval, goToNext]);

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Preview: {carousel.name}
                    </h2>
                    <div className="flex gap-2">
                        <Link href={route('admin.carousels.edit', carousel.id)}>
                            <SecondaryButton>Edit Carousel</SecondaryButton>
                        </Link>
                        <Link href={route('admin.carousels.index')}>
                            <SecondaryButton>Back to List</SecondaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Preview: ${carousel.name}`} />

            <div className="space-y-6">
                {/* Carousel Preview */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Carousel Preview</h3>
                        
                        {activeImages.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500">No active images to display</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Main Carousel */}
                                <div className="relative overflow-hidden rounded-lg aspect-[16/9] bg-gray-100">
                                    {activeImages.map((image, index) => (
                                        <div
                                            key={image.id}
                                            className={`absolute inset-0 transition-opacity duration-500 ${
                                                index === currentIndex ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        >
                                            <img
                                                src={`/storage/${image.image_path}`}
                                                alt={image.title || 'Carousel image'}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Overlay Content */}
                                            {(image.title || image.description || image.button_text) && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                                    <div className="p-6 text-white">
                                                        {image.title && (
                                                            <h4 className="text-2xl font-bold mb-2">
                                                                {image.title}
                                                            </h4>
                                                        )}
                                                        {image.description && (
                                                            <p className="text-sm mb-4 max-w-xl">
                                                                {image.description}
                                                            </p>
                                                        )}
                                                        {image.button_text && image.link_url && (
                                                            <a
                                                                href={image.link_url}
                                                                target={image.link_target}
                                                                className="inline-block px-6 py-2 bg-white text-gray-900 rounded-md font-medium hover:bg-gray-100 transition-colors"
                                                            >
                                                                {image.button_text}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Navigation Arrows */}
                                    {carousel.show_navigation && activeImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={goToPrev}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={goToNext}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Indicators */}
                                {carousel.show_indicators && activeImages.length > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {activeImages.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToSlide(index)}
                                                className={`w-3 h-3 rounded-full transition-colors ${
                                                    index === currentIndex
                                                        ? 'bg-indigo-600'
                                                        : 'bg-gray-300 hover:bg-gray-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Carousel Info */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Carousel Information</h3>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{carousel.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                                <dd className="mt-1 text-sm text-gray-900">{carousel.slug}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            carousel.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {carousel.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Autoplay Interval</dt>
                                <dd className="mt-1 text-sm text-gray-900">{carousel.autoplay_interval}ms</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Total Images</dt>
                                <dd className="mt-1 text-sm text-gray-900">{carousel.images.length}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Active Images</dt>
                                <dd className="mt-1 text-sm text-gray-900">{activeImages.length}</dd>
                            </div>
                            {carousel.description && (
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{carousel.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Embed Code */}
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Embed Code</h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Use this code to embed the carousel in your pages:
                        </p>
                        <div className="bg-gray-100 rounded-md p-4">
                            <code className="text-sm text-gray-800">
                                {`<Carousel slug="${carousel.slug}" />`}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}

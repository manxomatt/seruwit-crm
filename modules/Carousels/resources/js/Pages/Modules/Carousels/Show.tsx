import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import PageHeader from '@/Components/PageHeader';
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
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
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
                <PageHeader
                    title={t('carousels.preview_title', { name: carousel.name })}
                    actions={
                        <div className="flex gap-2">
                            <Link href={prefixedRoute('carousels.edit', carousel.id)}>
                                <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                    ✏️ {t('carousels.edit_carousel')}
                                </PrimaryButton>
                            </Link>
                            <Link href={prefixedRoute('carousels.index')}>
                                <SecondaryButton className="!rounded-xl text-xs">
                                    ← {t('carousels.back_list')}
                                </SecondaryButton>
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={t('carousels.preview_title', { name: carousel.name })} />

            <div className="space-y-6">
                {/* Carousel Preview Card */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            🖼️ {t('carousels.show.preview')}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            carousel.is_active
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50'
                        }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${carousel.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {carousel.is_active ? t('carousels.active') : t('carousels.inactive')}
                        </span>
                    </div>

                    {activeImages.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <p className="text-xs font-bold text-slate-400">{t('carousels.show.no_active')}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Main Carousel Slider */}
                            <div className="relative overflow-hidden rounded-2xl aspect-[16/9] bg-slate-950">
                                {activeImages.map((image, index) => (
                                    <div
                                        key={image.id}
                                        className={`absolute inset-0 transition-opacity duration-500 ${
                                            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                        }`}
                                    >
                                        <img
                                            src={image.image_path}
                                            alt={image.title || ''}
                                            className="w-full h-full object-cover"
                                        />
                                        {(image.title || image.description || image.button_text) && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                                                <div className="text-white max-w-xl">
                                                    {image.title && <h4 className="text-xl font-extrabold mb-1">{image.title}</h4>}
                                                    {image.description && <p className="text-xs text-slate-200 mb-3">{image.description}</p>}
                                                    {image.button_text && image.link_url && (
                                                        <a
                                                            href={image.link_url}
                                                            target={image.link_target}
                                                            className="inline-flex items-center px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition"
                                                        >
                                                            {image.button_text} →
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
                                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            onClick={goToNext}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}

                                 {/* Slide Indicators */}
                                {carousel.show_indicators && activeImages.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                        {activeImages.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => goToSlide(idx)}
                                                className={`h-2 rounded-full transition-all ${
                                                    idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Carousel Info & Metadata */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        📋 {t('carousels.show.info')}
                    </h3>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('carousels.show.name')}</dt>
                            <dd className="mt-1 font-bold text-slate-900 dark:text-white">{carousel.name}</dd>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('carousels.show.slug')}</dt>
                            <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{carousel.slug}</dd>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('carousels.show.autoplay')}</dt>
                            <dd className="mt-1 font-mono text-slate-700 dark:text-slate-300">{carousel.autoplay_interval} ms</dd>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('carousels.show.total_images')}</dt>
                            <dd className="mt-1 font-bold text-slate-900 dark:text-white">{carousel.images.length} ({activeImages.length} active)</dd>
                        </div>
                        {carousel.description && (
                            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-4">
                                <dt className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t('carousels.show.description')}</dt>
                                <dd className="mt-1 text-slate-800 dark:text-slate-200">{carousel.description}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Embed Code */}
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        💻 {t('carousels.show.embed')}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                        {t('carousels.show.embed_hint')}
                    </p>
                    <div className="bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
                        <code>{`<Carousel slug="${carousel.slug}" />`}</code>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">JSX Component</span>
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}


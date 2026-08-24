import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface TestimonialItem {
    author: string;
    location: string | null;
    rating: number;
    body: string;
    published: boolean;
}

const EMPTY: TestimonialItem = {
    author: '',
    location: '',
    rating: 5,
    body: '',
    published: true,
};

export default function TestimonialsPanel({
    testimonials = [],
}: {
    testimonials?: TestimonialItem[];
}): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful, isDirty } = useForm<{ testimonials: TestimonialItem[] }>({
        testimonials: testimonials.map((item) => ({
            author: item.author ?? '',
            location: item.location ?? '',
            rating: item.rating ?? 5,
            body: item.body ?? '',
            published: item.published ?? true,
        })),
    });

    const update = (index: number, patchItem: Partial<TestimonialItem>): void => {
        setData(
            'testimonials',
            data.testimonials.map((item, i) => (i === index ? { ...item, ...patchItem } : item)),
        );
    };

    const addRow = (): void => setData('testimonials', [...data.testimonials, { ...EMPTY }]);
    const removeRow = (index: number): void =>
        setData('testimonials', data.testimonials.filter((_, i) => i !== index));

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.testimonials.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('rental.settings.testimonials_title', undefined, 'Testimoni Pelanggan')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('rental.settings.testimonials_hint', undefined, 'Kurasi ulasan yang tampil di blok "Ulasan Pelanggan" pada halaman publik.')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addRow}
                    className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300"
                >
                    + {t('rental.settings.testimonials_add', undefined, 'Tambah Testimoni')}
                </button>
            </div>

            {data.testimonials.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                    {t('rental.settings.testimonials_empty', undefined, 'Belum ada testimoni. Klik "Tambah Testimoni" untuk mulai.')}
                </div>
            )}

            <div className="space-y-4">
                {data.testimonials.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                            <div className="sm:col-span-4">
                                <TextInput
                                    value={item.author}
                                    onChange={(e) => update(index, { author: e.target.value })}
                                    placeholder={t('rental.settings.testimonials_author', undefined, 'Nama pelanggan')}
                                    className="w-full text-sm font-semibold"
                                />
                                <InputError message={errors[`testimonials.${index}.author` as keyof typeof errors]} className="mt-1" />
                            </div>
                            <div className="sm:col-span-4">
                                <TextInput
                                    value={item.location ?? ''}
                                    onChange={(e) => update(index, { location: e.target.value })}
                                    placeholder={t('rental.settings.testimonials_location', undefined, 'Kota / asal (opsional)')}
                                    className="w-full text-sm"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <select
                                    value={item.rating}
                                    onChange={(e) => update(index, { rating: Number(e.target.value) })}
                                    className="w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    {[5, 4, 3, 2, 1].map((r) => (
                                        <option key={r} value={r}>
                                            {'★'.repeat(r)} ({r})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between sm:col-span-2">
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={item.published}
                                        onChange={(e) => update(index, { published: e.target.checked })}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {t('rental.settings.testimonials_published', undefined, 'Tampil')}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                    aria-label="Hapus"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="sm:col-span-12">
                                <textarea
                                    value={item.body}
                                    onChange={(e) => update(index, { body: e.target.value })}
                                    rows={2}
                                    placeholder={t('rental.settings.testimonials_body', undefined, 'Isi testimoni…')}
                                    className="w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                                <InputError message={errors[`testimonials.${index}.body` as keyof typeof errors]} className="mt-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
                <span className="text-xs text-slate-500">
                    {isDirty
                        ? t('rental.settings.unsaved', undefined, '⚠️ Ada perubahan belum disimpan')
                        : t('rental.settings.all_saved', undefined, 'Semua perubahan tersimpan')}
                </span>
                <div className="flex items-center gap-3">
                    {recentlySuccessful && (
                        <span className="text-xs font-bold text-emerald-600">✅ {t('rental.messages.settings_updated', undefined, 'Tersimpan')}</span>
                    )}
                    <PrimaryButton type="submit" disabled={processing} className="justify-center py-2.5 text-sm font-bold">
                        💾 {t('rental.settings.save', undefined, 'Simpan Pengaturan')}
                    </PrimaryButton>
                </div>
            </div>
        </form>
    );
}

import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Create(): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        autoplay_interval: 5000,
        show_navigation: true,
        show_indicators: true,
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setData((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('carousels.store'));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('carousels.create_title')}
                    actions={
                        <Link href={prefixedRoute('carousels.index')}>
                            <SecondaryButton className="!rounded-xl text-xs">
                                ← {t('common.cancel')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('carousels.create_title')} />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value={t('carousels.form.name')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full !rounded-xl text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={data.name}
                                onChange={handleNameChange}
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="slug" value={t('carousels.form.slug')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="slug"
                                type="text"
                                className="mt-1 block w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                required
                            />
                            <InputError message={errors.slug} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value={t('carousels.form.description')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <textarea
                                id="description"
                                className="mt-1 block w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="autoplay_interval" value={t('carousels.form.autoplay')} className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <TextInput
                                id="autoplay_interval"
                                type="number"
                                className="mt-1 block w-full !rounded-xl font-mono text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                value={data.autoplay_interval}
                                onChange={(e) => setData('autoplay_interval', parseInt(e.target.value))}
                                min={1000}
                                max={30000}
                                step={500}
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                                {t('carousels.form.autoplay_hint')}
                            </p>
                            <InputError message={errors.autoplay_interval} className="mt-1" />
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    className="h-4 w-4 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {t('carousels.form.active')}
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    id="show_navigation"
                                    type="checkbox"
                                    className="h-4 w-4 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.show_navigation}
                                    onChange={(e) => setData('show_navigation', e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {t('carousels.form.show_navigation')}
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    id="show_indicators"
                                    type="checkbox"
                                    className="h-4 w-4 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.show_indicators}
                                    onChange={(e) => setData('show_indicators', e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {t('carousels.form.show_indicators')}
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link href={prefixedRoute('carousels.index')}>
                                <SecondaryButton type="button" className="!rounded-xl text-xs">
                                    {t('common.cancel')}
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                                ➕ {t('carousels.form.create')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DynamicLayout>
    );
}


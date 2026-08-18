import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ResellerLandingPage } from './types';

interface Props {
    landing: ResellerLandingPage;
}

const MAX_HIGHLIGHTS = 4;

/**
 * A reseller's self-serve editor for their public pitch page. Deliberately
 * small: four text fields and up to four highlight lines, no rich content —
 * the full page-builder (GrapesJS, in the Pages module) is a different,
 * tenant-scoped product.
 */
export default function ResellerLandingPageForm({ landing }: Props): JSX.Element {
    const { t } = useTrans();

    const { data, setData, transform, patch, processing, errors, recentlySuccessful } = useForm({
        landing_is_enabled: landing.is_enabled,
        landing_headline: landing.headline ?? '',
        landing_subheadline: landing.subheadline ?? '',
        landing_cta_text: landing.cta_text ?? '',
        landing_highlights: landing.highlights.length > 0 ? landing.highlights : [''],
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        transform((current) => ({
            ...current,
            landing_highlights: current.landing_highlights.map((h) => h.trim()).filter(Boolean),
        }));
        patch(route('module.reseller.landing-page.update'), { preserveScroll: true });
    };

    const updateHighlight = (index: number, value: string) => {
        setData(
            'landing_highlights',
            data.landing_highlights.map((h, i) => (i === index ? value : h)),
        );
    };

    const addHighlight = () => {
        if (data.landing_highlights.length < MAX_HIGHLIGHTS) {
            setData('landing_highlights', [...data.landing_highlights, '']);
        }
    };

    const removeHighlight = (index: number) => {
        setData(
            'landing_highlights',
            data.landing_highlights.filter((_, i) => i !== index),
        );
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.landing.title')}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('reseller.landing.hint')}</p>
                </div>

                {landing.is_live && (
                    <a
                        href={landing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        {t('reseller.landing.preview')} →
                    </a>
                )}
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Checkbox
                    checked={data.landing_is_enabled}
                    onChange={(event) => setData('landing_is_enabled', event.target.checked)}
                />
                {t('reseller.landing.enable')}
            </label>

            {!landing.is_live && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{t('reseller.landing.disabled_hint')}</p>}

            <div className="mt-4 grid gap-4">
                <div>
                    <InputLabel htmlFor="landing_headline" value={t('reseller.landing.headline')} />
                    <TextInput
                        id="landing_headline"
                        value={data.landing_headline}
                        onChange={(event) => setData('landing_headline', event.target.value)}
                        placeholder={t('reseller.landing.headline_placeholder')}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.landing_headline} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="landing_subheadline" value={t('reseller.landing.subheadline')} />
                    <TextInput
                        id="landing_subheadline"
                        value={data.landing_subheadline}
                        onChange={(event) => setData('landing_subheadline', event.target.value)}
                        placeholder={t('reseller.landing.subheadline_placeholder')}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.landing_subheadline} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="landing_cta_text" value={t('reseller.landing.cta_text')} />
                    <TextInput
                        id="landing_cta_text"
                        value={data.landing_cta_text}
                        onChange={(event) => setData('landing_cta_text', event.target.value)}
                        placeholder={t('reseller.landing.cta_placeholder')}
                        className="mt-1 block w-full"
                    />
                    <InputError message={errors.landing_cta_text} className="mt-1" />
                </div>

                <div>
                    <InputLabel value={t('reseller.landing.highlights')} />
                    <p className="mt-1 text-xs text-slate-400">{t('reseller.landing.highlights_hint')}</p>

                    <div className="mt-2 space-y-2">
                        {data.landing_highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <TextInput
                                    value={highlight}
                                    onChange={(event) => updateHighlight(index, event.target.value)}
                                    placeholder={t('reseller.landing.highlight_placeholder')}
                                    className="block w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeHighlight(index)}
                                    className="shrink-0 text-sm text-slate-400 hover:text-rose-600"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {data.landing_highlights.length < MAX_HIGHLIGHTS && (
                        <button
                            type="button"
                            onClick={addHighlight}
                            className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            {t('reseller.landing.add_highlight')}
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
                <PrimaryButton disabled={processing}>{t('reseller.landing.save')}</PrimaryButton>
                {recentlySuccessful && <span className="text-sm text-emerald-600 dark:text-emerald-400">✓</span>}
            </div>
        </form>
    );
}

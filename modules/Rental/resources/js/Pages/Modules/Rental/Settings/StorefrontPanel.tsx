import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, ReactNode } from 'react';

export interface StorefrontSettings {
    brand_name: string;
    primary_color: string;
    secondary_color: string;
    support_phone: string;
    logo_url: string;
    hero_title: string;
    hero_subtitle: string;
    hero_image_url: string;
    social_instagram: string;
    social_facebook: string;
    social_tiktok: string;
    business_hours: string;
}

export const DEFAULT_STOREFRONT: StorefrontSettings = {
    brand_name: '',
    primary_color: '#0f766e',
    secondary_color: '#0f172a',
    support_phone: '',
    logo_url: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    business_hours: '',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

interface ColorFieldProps {
    id: string;
    label: string;
    hint?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

function ColorField({ id, label, hint, value, onChange, error }: ColorFieldProps): JSX.Element {
    const safeValue = HEX.test(value) ? value : '#000000';

    return (
        <div>
            <InputLabel htmlFor={id} value={label} />
            <div className="mt-1.5 flex items-center gap-3">
                <label
                    className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-inner dark:border-slate-700"
                    style={{ backgroundColor: safeValue }}
                >
                    <input
                        type="color"
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={label}
                    />
                </label>
                <TextInput
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#0f766e"
                    className="w-40 font-mono text-sm font-semibold uppercase"
                    maxLength={7}
                />
            </div>
            {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            <InputError message={error} className="mt-1" />
        </div>
    );
}

interface SectionCardProps {
    icon: string;
    iconClass: string;
    title: string;
    subtitle: string;
    children: ReactNode;
}

function SectionCard({ icon, iconClass, title, subtitle, children }: SectionCardProps): JSX.Element {
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${iconClass}`}>{icon}</div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                </div>
            </div>
            <div className="mt-5 space-y-5">{children}</div>
        </div>
    );
}

export default function StorefrontPanel({
    storefront = DEFAULT_STOREFRONT,
}: {
    storefront?: StorefrontSettings;
}): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful, isDirty } = useForm<StorefrontSettings>({
        brand_name: storefront.brand_name ?? '',
        primary_color: storefront.primary_color || '#0f766e',
        secondary_color: storefront.secondary_color || '#0f172a',
        support_phone: storefront.support_phone ?? '',
        logo_url: storefront.logo_url ?? '',
        hero_title: storefront.hero_title ?? '',
        hero_subtitle: storefront.hero_subtitle ?? '',
        hero_image_url: storefront.hero_image_url ?? '',
        social_instagram: storefront.social_instagram ?? '',
        social_facebook: storefront.social_facebook ?? '',
        social_tiktok: storefront.social_tiktok ?? '',
        business_hours: storefront.business_hours ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.storefront.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left column */}
                <div className="space-y-6 lg:col-span-8">
                    <SectionCard
                        icon="🎨"
                        iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                        title={t('rental.settings.storefront_identity', undefined, 'Identitas Brand')}
                        subtitle={t('rental.settings.storefront_identity_hint', undefined, 'Nama, logo, dan warna yang dipakai portal booking publik & halaman page builder.')}
                    >
                        <div>
                            <InputLabel htmlFor="brand_name" value={t('rental.settings.storefront_brand_name', undefined, 'Nama Brand (opsional)')} />
                            <TextInput
                                id="brand_name"
                                value={data.brand_name}
                                onChange={(e) => setData('brand_name', e.target.value)}
                                placeholder={t('rental.settings.storefront_brand_name_ph', undefined, 'Kosongkan untuk memakai nama situs')}
                                className="mt-1.5 w-full max-w-md text-sm font-semibold"
                            />
                            <InputError message={errors.brand_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="logo_url" value={t('rental.settings.storefront_logo_url', undefined, 'URL Logo')} />
                            <div className="mt-1.5 flex items-center gap-3">
                                {data.logo_url ? (
                                    <img
                                        src={data.logo_url}
                                        alt="Logo"
                                        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-300 dark:border-slate-700">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <TextInput
                                    id="logo_url"
                                    type="url"
                                    value={data.logo_url}
                                    onChange={(e) => setData('logo_url', e.target.value)}
                                    placeholder="https://…/logo.png"
                                    className="w-full text-sm"
                                />
                            </div>
                            <InputError message={errors.logo_url} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <ColorField
                                id="primary_color"
                                label={t('rental.settings.storefront_primary_color', undefined, 'Warna Utama')}
                                hint={t('rental.settings.storefront_primary_color_hint', undefined, 'Tombol, aksen, header.')}
                                value={data.primary_color}
                                onChange={(value) => setData('primary_color', value)}
                                error={errors.primary_color}
                            />
                            <ColorField
                                id="secondary_color"
                                label={t('rental.settings.storefront_secondary_color', undefined, 'Warna Sekunder')}
                                hint={t('rental.settings.storefront_secondary_color_hint', undefined, 'Latar gelap, footer.')}
                                value={data.secondary_color}
                                onChange={(value) => setData('secondary_color', value)}
                                error={errors.secondary_color}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon="🖼️"
                        iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        title={t('rental.settings.storefront_hero', undefined, 'Hero Halaman Depan')}
                        subtitle={t('rental.settings.storefront_hero_hint', undefined, 'Judul, subjudul, dan gambar besar di atas katalog. Kosongkan untuk memakai teks bawaan.')}
                    >
                        <div>
                            <InputLabel htmlFor="hero_title" value={t('rental.settings.storefront_hero_title', undefined, 'Judul Hero')} />
                            <TextInput
                                id="hero_title"
                                value={data.hero_title}
                                onChange={(e) => setData('hero_title', e.target.value)}
                                placeholder={t('rental.settings.storefront_hero_title_ph', undefined, 'Temukan Kendaraan Nyaman Untuk Setiap Perjalanan')}
                                className="mt-1.5 w-full text-sm font-semibold"
                            />
                            <InputError message={errors.hero_title} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="hero_subtitle" value={t('rental.settings.storefront_hero_subtitle', undefined, 'Subjudul Hero')} />
                            <textarea
                                id="hero_subtitle"
                                value={data.hero_subtitle}
                                onChange={(e) => setData('hero_subtitle', e.target.value)}
                                rows={2}
                                placeholder={t('rental.settings.storefront_hero_subtitle_ph', undefined, 'Proses sewa cepat dan transparan. Unit terawat, bersih, bergaransi.')}
                                className="mt-1.5 w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <InputError message={errors.hero_subtitle} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="hero_image_url" value={t('rental.settings.storefront_hero_image_url', undefined, 'URL Gambar Hero')} />
                            <TextInput
                                id="hero_image_url"
                                type="url"
                                value={data.hero_image_url}
                                onChange={(e) => setData('hero_image_url', e.target.value)}
                                placeholder="https://…/hero.jpg"
                                className="mt-1.5 w-full text-sm"
                            />
                            <InputError message={errors.hero_image_url} className="mt-1" />
                        </div>
                    </SectionCard>
                </div>

                {/* Right column */}
                <div className="space-y-6 lg:col-span-4">
                    <SectionCard
                        icon="📞"
                        iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                        title={t('rental.settings.storefront_contact', undefined, 'Kontak & Sosial')}
                        subtitle={t('rental.settings.storefront_contact_hint', undefined, 'Nomor WhatsApp CS dan tautan media sosial di halaman publik.')}
                    >
                        <div>
                            <InputLabel htmlFor="support_phone" value={t('rental.settings.storefront_support_phone', undefined, 'Nomor WhatsApp / CS')} />
                            <TextInput
                                id="support_phone"
                                value={data.support_phone}
                                onChange={(e) => setData('support_phone', e.target.value)}
                                placeholder="+62 812 3456 7890"
                                className="mt-1.5 w-full text-sm font-semibold"
                            />
                            <InputError message={errors.support_phone} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="business_hours" value={t('rental.settings.storefront_business_hours', undefined, 'Jam Operasional')} />
                            <textarea
                                id="business_hours"
                                value={data.business_hours}
                                onChange={(e) => setData('business_hours', e.target.value)}
                                rows={2}
                                placeholder={t('rental.settings.storefront_business_hours_ph', undefined, 'Senin–Sabtu 08.00–20.00')}
                                className="mt-1.5 w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <InputError message={errors.business_hours} className="mt-1" />
                        </div>
                        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div>
                                <InputLabel htmlFor="social_instagram" value="Instagram" />
                                <TextInput
                                    id="social_instagram"
                                    type="url"
                                    value={data.social_instagram}
                                    onChange={(e) => setData('social_instagram', e.target.value)}
                                    placeholder="https://instagram.com/…"
                                    className="mt-1.5 w-full text-sm"
                                />
                                <InputError message={errors.social_instagram} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="social_facebook" value="Facebook" />
                                <TextInput
                                    id="social_facebook"
                                    type="url"
                                    value={data.social_facebook}
                                    onChange={(e) => setData('social_facebook', e.target.value)}
                                    placeholder="https://facebook.com/…"
                                    className="mt-1.5 w-full text-sm"
                                />
                                <InputError message={errors.social_facebook} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="social_tiktok" value="TikTok" />
                                <TextInput
                                    id="social_tiktok"
                                    type="url"
                                    value={data.social_tiktok}
                                    onChange={(e) => setData('social_tiktok', e.target.value)}
                                    placeholder="https://tiktok.com/@…"
                                    className="mt-1.5 w-full text-sm"
                                />
                                <InputError message={errors.social_tiktok} className="mt-1" />
                            </div>
                        </div>
                    </SectionCard>

                    {/* Sticky Action Card */}
                    <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('rental.settings.storefront_confirm', undefined, 'Simpan Tampilan')}
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {isDirty
                                        ? t('rental.settings.unsaved', undefined, '⚠️ Ada perubahan belum disimpan')
                                        : t('rental.settings.all_saved', undefined, 'Semua perubahan tersimpan')}
                                </p>
                            </div>
                            {isDirty && <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />}
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="w-full justify-center py-2.5 text-sm font-bold shadow-md shadow-indigo-500/10"
                            >
                                {processing ? (
                                    <span>{t('rental.settings.saving', undefined, 'Menyimpan…')}</span>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        <span>{t('rental.settings.save', undefined, 'Simpan Pengaturan')}</span>
                                    </>
                                )}
                            </PrimaryButton>
                            {recentlySuccessful && (
                                <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <span>✅</span>
                                    <span>{t('rental.messages.settings_updated', undefined, 'Pengaturan rental berhasil diperbarui.')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

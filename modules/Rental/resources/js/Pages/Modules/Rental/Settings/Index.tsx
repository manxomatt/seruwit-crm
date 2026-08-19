import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import RentalNav from '../../../../RentalNav';
import RatesPanel from '../Rates/RatesPanel';
import DocumentsPanel from './DocumentsPanel';
import { Paginated, Rate, Vehicle } from '../Rates/shared';

interface GeneralSettings {
    default_one_way_fee: string;
    passenger_booking_enabled: boolean;
    pending_reserved_ttl_minutes: string;
    cancellation_fee_type: string;
    cancellation_fee_amount: string;
    no_show_fee_type: string;
    no_show_fee_amount: string;
    passenger_free_cancel_hours: string;
    public_mask_plates: boolean;
    calendar_click_to_book: boolean;
    ai_inspection_enabled: boolean;
    ai_kyc_enabled: boolean;
    ai_pricing_optimizer_enabled: boolean;
}

interface DocumentTemplate {
    name: string;
    layout_preset: string;
    content: Record<string, string>;
    options: Record<string, boolean>;
}

interface Props {
    tab: 'general' | 'rates' | 'documents';
    general?: GeneralSettings;
    rates?: Paginated<Rate>;
    vehicles?: Vehicle[];
    rentalClasses?: Array<{ value: string; label: string }>;
    documents?: Record<string, DocumentTemplate>;
    aiPricingOptimizerEnabled?: boolean;
    aiPricingAnalyzeUrl?: string;
    aiPricingApplyUrl?: string;
}

const DEFAULT_GENERAL: GeneralSettings = {
    default_one_way_fee: '150000',
    passenger_booking_enabled: false,
    pending_reserved_ttl_minutes: '120',
    cancellation_fee_type: 'fixed',
    cancellation_fee_amount: '0',
    no_show_fee_type: 'fixed',
    no_show_fee_amount: '0',
    passenger_free_cancel_hours: '24',
    public_mask_plates: true,
    calendar_click_to_book: true,
    ai_inspection_enabled: true,
    ai_kyc_enabled: true,
    ai_pricing_optimizer_enabled: true,
};

const DEFAULT_DOCUMENTS: Record<string, DocumentTemplate> = {};

const DEFAULT_RATES_PAGINATED: Paginated<Rate> = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    links: [{ url: null, label: '&laquo; Previous', active: false }, { url: '#', label: '1', active: true }, { url: null, label: 'Next &raquo;', active: false }],
};

function GeneralPanel({ general = DEFAULT_GENERAL }: { general?: GeneralSettings }): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        default_one_way_fee: general.default_one_way_fee,
        passenger_booking_enabled: general.passenger_booking_enabled,
        pending_reserved_ttl_minutes: general.pending_reserved_ttl_minutes,
        cancellation_fee_type: general.cancellation_fee_type,
        cancellation_fee_amount: general.cancellation_fee_amount,
        no_show_fee_type: general.no_show_fee_type,
        no_show_fee_amount: general.no_show_fee_amount,
        passenger_free_cancel_hours: general.passenger_free_cancel_hours,
        public_mask_plates: general.public_mask_plates,
        calendar_click_to_book: general.calendar_click_to_book,
        ai_inspection_enabled: general.ai_inspection_enabled ?? true,
        ai_kyc_enabled: general.ai_kyc_enabled ?? true,
        ai_pricing_optimizer_enabled: general.ai_pricing_optimizer_enabled ?? true,
    });

    const feeTypeOptions = [
        { value: 'fixed', label: t('rental.settings.fee_type_fixed') },
        { value: 'percent', label: t('rental.settings.fee_type_percent') },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.general.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="max-w-2xl space-y-6">
            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.pricing_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.pricing_section_hint')}</p>

                <div className="mt-4">
                    <InputLabel htmlFor="default_one_way_fee" value={t('rental.settings.default_one_way_fee')} />
                    <div className="relative mt-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                            Rp
                        </span>
                        <MoneyInput
                            id="default_one_way_fee"
                            value={data.default_one_way_fee}
                            onChange={(value) => setData('default_one_way_fee', value)}
                            className="w-full pl-10"
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('rental.settings.default_one_way_fee_hint')}</p>
                    <InputError message={errors.default_one_way_fee} className="mt-1" />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.booking_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.booking_section_hint')}</p>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="passenger_booking_enabled"
                        checked={data.passenger_booking_enabled}
                        onChange={(e) => setData('passenger_booking_enabled', e.target.checked)}
                        className="mt-0.5"
                    />
                    <div>
                        <InputLabel
                            htmlFor="passenger_booking_enabled"
                            value={t('rental.settings.passenger_booking_enabled')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">{t('rental.settings.passenger_booking_enabled_hint')}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="pending_reserved_ttl_minutes" value={t('rental.settings.pending_reserved_ttl')} />
                    <TextInput
                        id="pending_reserved_ttl_minutes"
                        type="number"
                        min="1"
                        max="10080"
                        value={data.pending_reserved_ttl_minutes}
                        onChange={(e) => setData('pending_reserved_ttl_minutes', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">{t('rental.settings.pending_reserved_ttl_hint')}</p>
                    <InputError message={errors.pending_reserved_ttl_minutes} className="mt-1" />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.cancellation_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.cancellation_section_hint')}</p>

                <div className="mt-4">
                    <InputLabel htmlFor="cancellation_fee_type" value={t('rental.settings.cancellation_fee_type')} />
                    <Select
                        id="cancellation_fee_type"
                        value={data.cancellation_fee_type}
                        onChange={(value) => setData('cancellation_fee_type', value)}
                        options={feeTypeOptions}
                        className="mt-1"
                    />
                    <InputError message={errors.cancellation_fee_type} className="mt-1" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="cancellation_fee_amount" value={t('rental.settings.cancellation_fee_amount')} />
                    <div className="relative mt-1">
                        {data.cancellation_fee_type === 'fixed' && (
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                Rp
                            </span>
                        )}
                        <TextInput
                            id="cancellation_fee_amount"
                            type="number"
                            min="0"
                            step="any"
                            value={data.cancellation_fee_amount}
                            onChange={(e) => setData('cancellation_fee_amount', e.target.value)}
                            className={`block w-full ${data.cancellation_fee_type === 'fixed' ? 'pl-10' : ''}`}
                        />
                    </div>
                    <InputError message={errors.cancellation_fee_amount} className="mt-1" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="no_show_fee_type" value={t('rental.settings.no_show_fee_type')} />
                    <Select
                        id="no_show_fee_type"
                        value={data.no_show_fee_type}
                        onChange={(value) => setData('no_show_fee_type', value)}
                        options={feeTypeOptions}
                        className="mt-1"
                    />
                    <InputError message={errors.no_show_fee_type} className="mt-1" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="no_show_fee_amount" value={t('rental.settings.no_show_fee_amount')} />
                    <div className="relative mt-1">
                        {data.no_show_fee_type === 'fixed' && (
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                Rp
                            </span>
                        )}
                        <TextInput
                            id="no_show_fee_amount"
                            type="number"
                            min="0"
                            step="any"
                            value={data.no_show_fee_amount}
                            onChange={(e) => setData('no_show_fee_amount', e.target.value)}
                            className={`block w-full ${data.no_show_fee_type === 'fixed' ? 'pl-10' : ''}`}
                        />
                    </div>
                    <InputError message={errors.no_show_fee_amount} className="mt-1" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="passenger_free_cancel_hours"
                        value={t('rental.settings.passenger_free_cancel_hours')}
                    />
                    <TextInput
                        id="passenger_free_cancel_hours"
                        type="number"
                        min="0"
                        max="8760"
                        value={data.passenger_free_cancel_hours}
                        onChange={(e) => setData('passenger_free_cancel_hours', e.target.value)}
                        className="mt-1 block w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        {t('rental.settings.passenger_free_cancel_hours_hint')}
                    </p>
                    <InputError message={errors.passenger_free_cancel_hours} className="mt-1" />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.privacy_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.privacy_section_hint')}</p>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="public_mask_plates"
                        checked={data.public_mask_plates}
                        onChange={(e) => setData('public_mask_plates', e.target.checked)}
                        className="mt-0.5"
                    />
                    <div>
                        <InputLabel
                            htmlFor="public_mask_plates"
                            value={t('rental.settings.public_mask_plates')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">{t('rental.settings.public_mask_plates_hint')}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.calendar_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.calendar_section_hint')}</p>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="calendar_click_to_book"
                        checked={data.calendar_click_to_book}
                        onChange={(e) => setData('calendar_click_to_book', e.target.checked)}
                        className="mt-0.5"
                    />
                    <div>
                        <InputLabel
                            htmlFor="calendar_click_to_book"
                            value={t('rental.settings.calendar_click_to_book')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">{t('rental.settings.calendar_click_to_book_hint')}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-6 shadow-sm dark:border-indigo-900/50 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/20">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
                        ✨
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                            {t('rental.settings.ai_features_title', undefined, 'Kecerdasan Buatan (AI Features)')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('rental.settings.ai_features_subtitle', undefined, 'Kelola aktivasi fitur AI otomatis untuk operasional rental Anda.')}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-4">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80">
                        <Checkbox
                            id="ai_inspection_enabled"
                            checked={data.ai_inspection_enabled}
                            onChange={(e) => setData('ai_inspection_enabled', e.target.checked)}
                            className="mt-0.5"
                        />
                        <div>
                            <InputLabel
                                htmlFor="ai_inspection_enabled"
                                value={t('rental.settings.ai_inspection_enabled', undefined, 'AI Visual Inspection Handover')}
                                className="!mb-0 font-semibold"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('rental.settings.ai_inspection_enabled_hint', undefined, 'Otomatisasi pemindaian kerusakan bodi baru, pembacaan odometer & BBM saat pengembalian kendaraan.')}
                            </p>
                            <InputError message={errors.ai_inspection_enabled} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80">
                        <Checkbox
                            id="ai_kyc_enabled"
                            checked={data.ai_kyc_enabled}
                            onChange={(e) => setData('ai_kyc_enabled', e.target.checked)}
                            className="mt-0.5"
                        />
                        <div>
                            <InputLabel
                                htmlFor="ai_kyc_enabled"
                                value={t('rental.settings.ai_kyc_enabled', undefined, 'AI Smart KYC & Document OCR (KTP/SIM)')}
                                className="!mb-0 font-semibold"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('rental.settings.ai_kyc_enabled_hint', undefined, 'Ekstraksi identitas otomatis (NIK, No. SIM, Masa Berlaku) dan penilaian skor risiko (Customer Risk Assessment).')}
                            </p>
                            <InputError message={errors.ai_kyc_enabled} className="mt-1" />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/80">
                        <Checkbox
                            id="ai_pricing_optimizer_enabled"
                            checked={data.ai_pricing_optimizer_enabled}
                            onChange={(e) => setData('ai_pricing_optimizer_enabled', e.target.checked)}
                            className="mt-0.5"
                        />
                        <div>
                            <InputLabel
                                htmlFor="ai_pricing_optimizer_enabled"
                                value={t('rental.settings.ai_pricing_optimizer_enabled', undefined, 'AI Smart Dynamic Pricing & Fleet Optimizer')}
                                className="!mb-0 font-semibold"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('rental.settings.ai_pricing_optimizer_enabled_hint', undefined, 'Analisis utilisasi armada, pola akhir pekan, deteksi unit menganggur, dan rekomendasi penyesuaian tarif otomatis.')}
                            </p>
                            <InputError message={errors.ai_pricing_optimizer_enabled} className="mt-1" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>{t('rental.settings.save')}</PrimaryButton>
                {recentlySuccessful && (
                    <p className="text-sm text-emerald-600">{t('rental.messages.settings_updated')}</p>
                )}
            </div>
        </form>
    );
}

export default function Index({
    tab,
    general = DEFAULT_GENERAL,
    rates = DEFAULT_RATES_PAGINATED,
    vehicles = [],
    rentalClasses = [],
    documents = DEFAULT_DOCUMENTS,
    aiPricingOptimizerEnabled = true,
    aiPricingAnalyzeUrl,
    aiPricingApplyUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const tabs = [
        { key: 'general' as const, label: t('rental.settings.tab_general', undefined, 'General') },
        { key: 'rates' as const, label: t('rental.settings.tab_rates', undefined, 'Rates') },
        { key: 'documents' as const, label: t('rental.settings.tab_documents', undefined, 'Document Templates') },
    ];

    return (
        <DynamicLayout header={<PageHeader title={t('rental.settings.title')} />}>
            <Head title={t('rental.settings.title')} />
            <RentalNav />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {tabs.map((item) => (
                        <Link
                            key={item.key}
                            href={prefixedRoute('rental.settings.index', { tab: item.key })}
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${tab === item.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {tab === 'general' && <GeneralPanel general={general} />}

            {tab === 'rates' && (
                <RatesPanel
                    rates={rates}
                    vehicles={vehicles}
                    rentalClasses={rentalClasses}
                    aiPricingOptimizerEnabled={aiPricingOptimizerEnabled}
                    aiPricingAnalyzeUrl={aiPricingAnalyzeUrl}
                    aiPricingApplyUrl={aiPricingApplyUrl}
                />
            )}

            {tab === 'documents' && (
                <DocumentsPanel documents={documents} prefixedRoute={prefixedRoute} />
            )}
        </DynamicLayout>
    );
}

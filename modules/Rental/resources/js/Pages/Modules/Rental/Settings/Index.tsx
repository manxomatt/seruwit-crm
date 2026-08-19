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
import DocumentsPanel from './DocumentsPanel';

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
    documents?: Record<string, DocumentTemplate>;
    centralAiEnabled?: boolean;
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

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
    badge?: string;
    disabled?: boolean;
}

function ToggleSwitch({
    id,
    checked,
    onChange,
    label,
    description,
    badge,
    disabled = false,
}: ToggleSwitchProps): JSX.Element {
    return (
        <label
            htmlFor={id}
            className={`group flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                checked
                    ? 'border-indigo-200 bg-indigo-50/40 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {label}
                    </span>
                    {badge && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            {badge}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </div>

            <div className="relative shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div className="h-6 w-11 rounded-full bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 peer-checked:bg-indigo-600 transition-colors dark:bg-slate-700" />
                <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm" />
            </div>
        </label>
    );
}

function GeneralPanel({
    general = DEFAULT_GENERAL,
    centralAiEnabled = true,
}: {
    general?: GeneralSettings;
    centralAiEnabled?: boolean;
}): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful, isDirty } = useForm({
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

    const ttlPresets = [
        { label: '30m', minutes: '30' },
        { label: '1 Jam', minutes: '60' },
        { label: '2 Jam', minutes: '120' },
        { label: '6 Jam', minutes: '360' },
        { label: '24 Jam', minutes: '1440' },
    ];

    const freeCancelPresets = [
        { label: '12 Jam', hours: '12' },
        { label: '24 Jam (1 Hari)', hours: '24' },
        { label: '48 Jam (2 Hari)', hours: '48' },
    ];

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.general.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: Operational, Booking & Cancellation Policies (8 cols) */}
                <div className="space-y-6 lg:col-span-8">
                    {/* Section 1: Pricing & Booking Operations */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold">
                                💳
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {t('rental.settings.pricing_section', undefined, 'Operasional Pemesanan & Tarif')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.settings.pricing_section_hint', undefined, 'Atur biaya antar satu arah, batas waktu penahanan booking, dan interaktivitas kalender.')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-5">
                            {/* One Way Fee */}
                            <div>
                                <InputLabel htmlFor="default_one_way_fee" value={t('rental.settings.default_one_way_fee', undefined, 'Biaya Antar / Drop-off Satu Arah (One-Way Fee)')} />
                                <div className="relative mt-1.5 max-w-md">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-slate-400">
                                        Rp
                                    </span>
                                    <MoneyInput
                                        id="default_one_way_fee"
                                        value={data.default_one_way_fee}
                                        onChange={(value) => setData('default_one_way_fee', value)}
                                        className="w-full pl-11 text-sm font-semibold"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.settings.default_one_way_fee_hint', undefined, 'Biaya standar yang dikenakan saat pelanggan mengembalikan kendaraan di lokasi berbeda.')}
                                </p>
                                <InputError message={errors.default_one_way_fee} className="mt-1" />
                            </div>

                            {/* Pending TTL */}
                            <div className="pt-2">
                                <InputLabel htmlFor="pending_reserved_ttl_minutes" value={t('rental.settings.pending_reserved_ttl', undefined, 'Batas Waktu Penahanan Booking Pending (TTL Menit)')} />
                                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                    <div className="relative w-36">
                                        <TextInput
                                            id="pending_reserved_ttl_minutes"
                                            type="number"
                                            min="1"
                                            max="10080"
                                            value={data.pending_reserved_ttl_minutes}
                                            onChange={(e) => setData('pending_reserved_ttl_minutes', e.target.value)}
                                            className="w-full pr-12 text-sm font-semibold"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 font-medium">
                                            menit
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-medium">Pilihan Cepat:</span>
                                        {ttlPresets.map((preset) => (
                                            <button
                                                key={preset.minutes}
                                                type="button"
                                                onClick={() => setData('pending_reserved_ttl_minutes', preset.minutes)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                    data.pending_reserved_ttl_minutes === preset.minutes
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.settings.pending_reserved_ttl_hint', undefined, 'Pemesanan berstatus Reserved Pending yang tidak dibayar depositnya akan kadaluarsa otomatis.')}
                                </p>
                                <InputError message={errors.pending_reserved_ttl_minutes} className="mt-1" />
                            </div>

                            {/* Booking Switches */}
                            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
                                <ToggleSwitch
                                    id="passenger_booking_enabled"
                                    checked={data.passenger_booking_enabled}
                                    onChange={(checked) => setData('passenger_booking_enabled', checked)}
                                    label={t('rental.settings.passenger_booking_enabled', undefined, 'Booking Mandiri Pelanggan')}
                                    description={t('rental.settings.passenger_booking_enabled_hint', undefined, 'Izinkan pelanggan umum melakukan booking langsung lewat portal publik.')}
                                />
                                <ToggleSwitch
                                    id="calendar_click_to_book"
                                    checked={data.calendar_click_to_book}
                                    onChange={(checked) => setData('calendar_click_to_book', checked)}
                                    label={t('rental.settings.calendar_click_to_book', undefined, 'Klik Kalender untuk Booking')}
                                    description={t('rental.settings.calendar_click_to_book_hint', undefined, 'Buka wizard reservasi langsung saat mengklik slot kosong di kalender armada.')}
                                />
                            </div>

                            {/* Privacy Switch */}
                            <div className="pt-1">
                                <ToggleSwitch
                                    id="public_mask_plates"
                                    checked={data.public_mask_plates}
                                    onChange={(checked) => setData('public_mask_plates', checked)}
                                    label={t('rental.settings.public_mask_plates', undefined, 'Sensor Plat Nomor di Halaman Publik')}
                                    description={t('rental.settings.public_mask_plates_hint', undefined, 'Samarkan plat nomor kendaraan (contoh: B 1*** CD) pada katalog publik demi keamanan armada.')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Cancellation & No-Show Policy */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 font-bold">
                                🚫
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {t('rental.settings.cancellation_section', undefined, 'Kebijakan Pembatalan & Denda No-Show')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.settings.cancellation_section_hint', undefined, 'Tentukan denda pembatalan dan jangka waktu pembatalan gratis untuk pelanggan.')}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-6">
                            {/* Cancellation Fee & No-Show Fee Grid */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Cancellation Fee Card */}
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('rental.settings.cancellation_fee', undefined, 'Denda Pembatalan')}
                                        </span>
                                        {/* Type Selector Tabs */}
                                        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setData('cancellation_fee_type', 'fixed')}
                                                className={`rounded-md px-2.5 py-0.5 text-xs font-bold transition ${
                                                    data.cancellation_fee_type === 'fixed'
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                Nominal (Rp)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('cancellation_fee_type', 'percent')}
                                                className={`rounded-md px-2.5 py-0.5 text-xs font-bold transition ${
                                                    data.cancellation_fee_type === 'percent'
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                Persen (%)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative mt-3">
                                        {data.cancellation_fee_type === 'fixed' && (
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-slate-400">
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
                                            className={`block w-full text-sm font-semibold ${
                                                data.cancellation_fee_type === 'fixed' ? 'pl-11' : 'pr-9'
                                            }`}
                                        />
                                        {data.cancellation_fee_type === 'percent' && (
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-slate-400">
                                                %
                                            </span>
                                        )}
                                    </div>
                                    <InputError message={errors.cancellation_fee_amount} className="mt-1" />
                                </div>

                                {/* No-Show Fee Card */}
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4.5 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                            {t('rental.settings.no_show_fee', undefined, 'Denda Tidak Hadir (No-Show)')}
                                        </span>
                                        {/* Type Selector Tabs */}
                                        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setData('no_show_fee_type', 'fixed')}
                                                className={`rounded-md px-2.5 py-0.5 text-xs font-bold transition ${
                                                    data.no_show_fee_type === 'fixed'
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                Nominal (Rp)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('no_show_fee_type', 'percent')}
                                                className={`rounded-md px-2.5 py-0.5 text-xs font-bold transition ${
                                                    data.no_show_fee_type === 'percent'
                                                        ? 'bg-indigo-600 text-white shadow-xs'
                                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                Persen (%)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative mt-3">
                                        {data.no_show_fee_type === 'fixed' && (
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-slate-400">
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
                                            className={`block w-full text-sm font-semibold ${
                                                data.no_show_fee_type === 'fixed' ? 'pl-11' : 'pr-9'
                                            }`}
                                        />
                                        {data.no_show_fee_type === 'percent' && (
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-slate-400">
                                                %
                                            </span>
                                        )}
                                    </div>
                                    <InputError message={errors.no_show_fee_amount} className="mt-1" />
                                </div>
                            </div>

                            {/* Free Cancellation Window */}
                            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                <InputLabel
                                    htmlFor="passenger_free_cancel_hours"
                                    value={t('rental.settings.passenger_free_cancel_hours', undefined, 'Jendela Waktu Bebas Biaya Pembatalan (Jam)')}
                                />
                                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                    <div className="relative w-36">
                                        <TextInput
                                            id="passenger_free_cancel_hours"
                                            type="number"
                                            min="0"
                                            max="8760"
                                            value={data.passenger_free_cancel_hours}
                                            onChange={(e) => setData('passenger_free_cancel_hours', e.target.value)}
                                            className="w-full pr-10 text-sm font-semibold"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 font-medium">
                                            jam
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs text-slate-400 font-medium">Preset:</span>
                                        {freeCancelPresets.map((preset) => (
                                            <button
                                                key={preset.hours}
                                                type="button"
                                                onClick={() => setData('passenger_free_cancel_hours', preset.hours)}
                                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                                    data.passenger_free_cancel_hours === preset.hours
                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.settings.passenger_free_cancel_hours_hint', undefined, 'Pelanggan dapat membatalkan tanpa denda jika dilakukan sebelum batas jam ini menjelang waktu sewa dimulai.')}
                                </p>
                                <InputError message={errors.passenger_free_cancel_hours} className="mt-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Automation Suite & Action Bar (4 cols) */}
                <div className="space-y-6 lg:col-span-4">
                    {/* AI Automation Suite Card */}
                    {centralAiEnabled && (
                        <div className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-6 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900 dark:from-slate-900 dark:to-indigo-950/30">
                            <div className="flex items-center gap-3 border-b border-indigo-100/80 pb-4 dark:border-indigo-900/40">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                                    ✨
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('rental.settings.ai_features_title', undefined, 'AI Automation Suite')}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('rental.settings.ai_features_subtitle', undefined, 'Kecerdasan buatan terintegrasi untuk efisiensi operasional rental.')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <ToggleSwitch
                                    id="ai_inspection_enabled"
                                    checked={data.ai_inspection_enabled}
                                    onChange={(checked) => setData('ai_inspection_enabled', checked)}
                                    label={t('rental.settings.ai_inspection_enabled', undefined, '📸 AI Visual Inspection')}
                                    description={t('rental.settings.ai_inspection_enabled_hint', undefined, 'Deteksi goresan baru, pembacaan KM & BBM saat serah terima.')}
                                    badge="Gemini Vision"
                                />

                                <ToggleSwitch
                                    id="ai_kyc_enabled"
                                    checked={data.ai_kyc_enabled}
                                    onChange={(checked) => setData('ai_kyc_enabled', checked)}
                                    label={t('rental.settings.ai_kyc_enabled', undefined, '🪪 AI Smart KYC & OCR')}
                                    description={t('rental.settings.ai_kyc_enabled_hint', undefined, 'Ekstraksi data KTP/SIM instan & evaluasi skor risiko fraud.')}
                                    badge="OCR & Risk"
                                />

                                <ToggleSwitch
                                    id="ai_pricing_optimizer_enabled"
                                    checked={data.ai_pricing_optimizer_enabled}
                                    onChange={(checked) => setData('ai_pricing_optimizer_enabled', checked)}
                                    label={t('rental.settings.ai_pricing_optimizer_enabled', undefined, '⚡ AI Dynamic Pricing')}
                                    description={t('rental.settings.ai_pricing_optimizer_enabled_hint', undefined, 'Optimasi okupansi armada & saran tarif surge akhir pekan.')}
                                    badge="Optimizer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sticky Action Card */}
                    <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Konfirmasi Pengaturan
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {isDirty ? '⚠️ Ada perubahan yang belum disimpan' : 'Semua perubahan tersimpan'}
                                </p>
                            </div>
                            {isDirty && (
                                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="w-full justify-center py-2.5 text-sm font-bold shadow-md shadow-indigo-500/10"
                            >
                                {processing ? (
                                    <>
                                        <svg className="mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Menyimpan…</span>
                                    </>
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

export default function Index({
    tab,
    general = DEFAULT_GENERAL,
    documents = DEFAULT_DOCUMENTS,
    centralAiEnabled = true,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const tabs = [
        { key: 'general' as const, label: t('rental.settings.tab_general', undefined, 'Umum') },
        { key: 'documents' as const, label: t('rental.settings.tab_documents', undefined, 'Template Dokumen') },
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
                            className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                                tab === item.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {tab === 'general' && <GeneralPanel general={general} centralAiEnabled={centralAiEnabled} />}

            {tab === 'documents' && (
                <DocumentsPanel documents={documents} prefixedRoute={prefixedRoute} />
            )}
        </DynamicLayout>
    );
}

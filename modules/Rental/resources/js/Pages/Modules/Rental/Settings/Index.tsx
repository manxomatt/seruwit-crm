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

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
}

interface Rate {
    id: number;
    name: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: number | null;
    excess_km_rate: string | null;
    late_fee_per_day: string | null;
    deposit_amount: string;
    is_active: boolean;
    notes: string | null;
    vehicle: Vehicle | null;
    vehicle_type: string | null;
    rental_class: string | null;
    valid_from: string | null;
    valid_to: string | null;
    min_periods: number | null;
    priority: number;
}

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
}

interface Props {
    tab: 'general' | 'rates';
    general?: GeneralSettings;
    rates?: Rate[];
    vehicles?: Vehicle[];
    rentalClasses?: Array<{ value: string; label: string }>;
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
};

function GeneralPanel({ general }: { general: GeneralSettings }): JSX.Element {
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
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.booking_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.booking_section_hint')}</p>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="passenger_booking_enabled"
                        checked={data.passenger_booking_enabled}
                        onChange={(e) => setData('passenger_booking_enabled', e.target.checked)}
                    />
                    <div>
                        <InputLabel
                            htmlFor="passenger_booking_enabled"
                            value={t('rental.settings.passenger_booking_enabled')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.settings.passenger_booking_enabled_hint')}
                        </p>
                        <InputError message={errors.passenger_booking_enabled} className="mt-1" />
                    </div>
                </div>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="public_mask_plates"
                        checked={data.public_mask_plates}
                        onChange={(e) => setData('public_mask_plates', e.target.checked)}
                    />
                    <div>
                        <InputLabel
                            htmlFor="public_mask_plates"
                            value={t('rental.settings.public_mask_plates')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.settings.public_mask_plates_hint')}
                        </p>
                        <InputError message={errors.public_mask_plates} className="mt-1" />
                    </div>
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="pending_reserved_ttl_minutes"
                        value={t('rental.settings.pending_reserved_ttl_minutes')}
                    />
                    <TextInput
                        id="pending_reserved_ttl_minutes"
                        type="number"
                        min={1}
                        className="mt-1 w-full"
                        value={data.pending_reserved_ttl_minutes}
                        onChange={(e) => setData('pending_reserved_ttl_minutes', e.target.value)}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        {t('rental.settings.pending_reserved_ttl_minutes_hint')}
                    </p>
                    <InputError message={errors.pending_reserved_ttl_minutes} className="mt-1" />
                </div>
            </section>

            <section className="rounded-xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm dark:border-teal-800 dark:bg-teal-950/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-teal-900 dark:text-teal-200">
                            Setup Rekening Bank Perusahaan (Transfer Manual)
                        </h2>
                        <p className="mt-1 text-xs text-teal-700 dark:text-teal-300">
                            Kelola daftar rekening bank tujuan transfer manual untuk pembayaran deposit sewa kendaraan di PWA publik.
                        </p>
                    </div>
                    <Link
                        href={prefixedRoute('accounting.bank-accounts.index')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-teal-800 shadow-sm"
                    >
                        Kelola Rekening Bank ↗
                    </Link>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.fees_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.fees_section_hint')}</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <InputLabel
                            htmlFor="cancellation_fee_type"
                            value={t('rental.settings.cancellation_fee_type')}
                        />
                        <Select
                            options={feeTypeOptions}
                            value={data.cancellation_fee_type}
                            onChange={(value) => setData('cancellation_fee_type', value)}
                            className="mt-1"
                        />
                        <InputError message={errors.cancellation_fee_type} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="cancellation_fee_amount"
                            value={t('rental.settings.cancellation_fee_amount')}
                        />
                        {data.cancellation_fee_type === 'percent' ? (
                            <TextInput
                                id="cancellation_fee_amount"
                                type="number"
                                min={0}
                                step="0.01"
                                className="mt-1 w-full"
                                value={data.cancellation_fee_amount}
                                onChange={(e) => setData('cancellation_fee_amount', e.target.value)}
                            />
                        ) : (
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                    Rp
                                </span>
                                <MoneyInput
                                    id="cancellation_fee_amount"
                                    value={data.cancellation_fee_amount}
                                    onChange={(value) => setData('cancellation_fee_amount', value)}
                                    className="w-full pl-10"
                                />
                            </div>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.settings.cancellation_fee_amount_hint')}
                        </p>
                        <InputError message={errors.cancellation_fee_amount} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                        <InputLabel
                            htmlFor="passenger_free_cancel_hours"
                            value={t('rental.settings.passenger_free_cancel_hours')}
                        />
                        <TextInput
                            id="passenger_free_cancel_hours"
                            type="number"
                            min={0}
                            className="mt-1 w-full"
                            value={data.passenger_free_cancel_hours}
                            onChange={(e) => setData('passenger_free_cancel_hours', e.target.value)}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.settings.passenger_free_cancel_hours_hint')}
                        </p>
                        <InputError message={errors.passenger_free_cancel_hours} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="no_show_fee_type" value={t('rental.settings.no_show_fee_type')} />
                        <Select
                            options={feeTypeOptions}
                            value={data.no_show_fee_type}
                            onChange={(value) => setData('no_show_fee_type', value)}
                            className="mt-1"
                        />
                        <InputError message={errors.no_show_fee_type} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel
                            htmlFor="no_show_fee_amount"
                            value={t('rental.settings.no_show_fee_amount')}
                        />
                        {data.no_show_fee_type === 'percent' ? (
                            <TextInput
                                id="no_show_fee_amount"
                                type="number"
                                min={0}
                                step="0.01"
                                className="mt-1 w-full"
                                value={data.no_show_fee_amount}
                                onChange={(e) => setData('no_show_fee_amount', e.target.value)}
                            />
                        ) : (
                            <div className="relative mt-1">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
                                    Rp
                                </span>
                                <MoneyInput
                                    id="no_show_fee_amount"
                                    value={data.no_show_fee_amount}
                                    onChange={(value) => setData('no_show_fee_amount', value)}
                                    className="w-full pl-10"
                                />
                            </div>
                        )}
                        <p className="mt-1 text-sm text-gray-500">{t('rental.settings.no_show_fee_amount_hint')}</p>
                        <InputError message={errors.no_show_fee_amount} className="mt-1" />
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('rental.settings.calendar_section')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('rental.settings.calendar_section_hint')}</p>

                <div className="mt-4 flex items-start gap-3">
                    <Checkbox
                        id="calendar_click_to_book"
                        checked={data.calendar_click_to_book}
                        onChange={(e) => setData('calendar_click_to_book', e.target.checked)}
                    />
                    <div>
                        <InputLabel
                            htmlFor="calendar_click_to_book"
                            value={t('rental.settings.calendar_click_to_book')}
                            className="!mb-0"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {t('rental.settings.calendar_click_to_book_hint')}
                        </p>
                        <InputError message={errors.calendar_click_to_book} className="mt-1" />
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
    rates = [],
    vehicles = [],
    rentalClasses = [],
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const tabs = [
        { key: 'general' as const, label: t('rental.settings.tab_general') },
        { key: 'rates' as const, label: t('rental.settings.tab_rates') },
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

            {tab === 'general' && <GeneralPanel general={general} />}

            {tab === 'rates' && (
                <RatesPanel rates={rates} vehicles={vehicles} rentalClasses={rentalClasses} />
            )}
        </DynamicLayout>
    );
}

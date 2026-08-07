import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
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

interface Props {
    tab: 'general' | 'rates';
    general?: {
        calendar_click_to_book: boolean;
    };
    rates?: Rate[];
    vehicles?: Vehicle[];
    rentalClasses?: Array<{ value: string; label: string }>;
}

function GeneralPanel({
    general,
}: {
    general: { calendar_click_to_book: boolean };
}): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        calendar_click_to_book: general.calendar_click_to_book,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.general.update'), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="max-w-2xl space-y-6">
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
    general = { calendar_click_to_book: true },
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

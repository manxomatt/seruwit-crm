import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';
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
    tab: 'rates';
    rates?: Rate[];
    vehicles?: Vehicle[];
    rentalClasses?: Array<{ value: string; label: string }>;
}

export default function Index({
    tab,
    rates = [],
    vehicles = [],
    rentalClasses = [],
}: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <DynamicLayout header={<PageHeader title={t('rental.settings.title')} />}>
            <Head title={t('rental.settings.title')} />
            <RentalNav />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    <span className="whitespace-nowrap border-b-2 border-indigo-600 px-1 py-3 text-sm font-medium text-indigo-600">
                        {t('rental.settings.tab_rates')}
                    </span>
                </nav>
            </div>

            {tab === 'rates' && (
                <RatesPanel rates={rates} vehicles={vehicles} rentalClasses={rentalClasses} />
            )}
        </DynamicLayout>
    );
}

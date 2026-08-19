import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';
import RentalNav from '../../../../RentalNav';
import RatesPanel from './RatesPanel';
import type { Paginated, Rate, Vehicle } from './shared';

interface Props {
    rates: Paginated<Rate>;
    vehicles: Vehicle[];
    rentalClasses: Array<{ value: string; label: string }>;
    aiPricingOptimizerEnabled?: boolean;
    aiPricingAnalyzeUrl?: string;
    aiPricingApplyUrl?: string;
}

export default function RatesIndex({
    rates,
    vehicles = [],
    rentalClasses = [],
    aiPricingOptimizerEnabled = true,
    aiPricingAnalyzeUrl,
    aiPricingApplyUrl,
}: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <DynamicLayout header={<PageHeader title={t('rental.pages.rates.title', undefined, 'Tarif Rental Kendaraan')} />}>
            <Head title={t('rental.pages.rates.head', undefined, 'Tarif Rental')} />
            <RentalNav />

            <RatesPanel
                rates={rates}
                vehicles={vehicles}
                rentalClasses={rentalClasses}
                aiPricingOptimizerEnabled={aiPricingOptimizerEnabled}
                aiPricingAnalyzeUrl={aiPricingAnalyzeUrl}
                aiPricingApplyUrl={aiPricingApplyUrl}
            />
        </DynamicLayout>
    );
}

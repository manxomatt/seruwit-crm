import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head } from '@inertiajs/react';
import RentalNav from '../../../RentalNav';
import ReservationForm from '../../../ReservationWizard/ReservationForm';
import type {
    DriverOption,
    InsurancePackage,
    LocationOption,
    PartnerOption,
    ReservationFormData,
} from '../../../ReservationWizard/types';

interface Props {
    drivers: DriverOption[];
    partners: PartnerOption[];
    selectedPartnerId?: number | null;
    locations?: LocationOption[];
    insurancePackages?: InsurancePackage[];
    defaultOneWayFee?: number;
    availableVehiclesUrl: string;
    quoteUrl: string;
    walkInUrl: string;
}

export default function Create({
    drivers,
    partners,
    selectedPartnerId = null,
    locations = [],
    insurancePackages = [],
    defaultOneWayFee = 150000,
    availableVehiclesUrl,
    quoteUrl,
    walkInUrl,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const initial: ReservationFormData = {
        vehicle_id: '',
        driver_id: '',
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        start_date: '',
        end_date: '',
        period_type: 'daily',
        rate_per_period: '',
        km_limit_per_period: '',
        excess_km_rate: '',
        late_fee_per_day: '',
        deposit_amount: '',
        pickup_location_id: '',
        return_location_id: '',
        pickup_location: '',
        return_location: '',
        one_way_fee_amount: '',
        insurance_package_id: '',
        fuel_policy_notes: '',
        notes: '',
    };

    return (
        <DynamicLayout header={<PageHeader title={t('rental.pages.create.title')} />}>
            <Head title={t('rental.pages.create.title')} />
            <RentalNav />
            <ReservationForm
                mode="create"
                initial={initial}
                partners={partners}
                drivers={drivers}
                locations={locations}
                insurancePackages={insurancePackages}
                defaultOneWayFee={defaultOneWayFee}
                availableVehiclesUrl={availableVehiclesUrl}
                quoteUrl={quoteUrl}
                walkInUrl={walkInUrl}
                submitUrl={prefixedRoute('rental.store')}
                cancelUrl={prefixedRoute('rental.index')}
            />
        </DynamicLayout>
    );
}

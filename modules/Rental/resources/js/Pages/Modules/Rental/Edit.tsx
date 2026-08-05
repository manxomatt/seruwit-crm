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
    VehicleOption,
} from '../../../ReservationWizard/types';

interface Rental {
    id: number;
    code: string;
    vehicle_id: number;
    driver_id: number | null;
    partner_id: number;
    start_date: string;
    end_date: string;
    period_type: string;
    rate_per_period: string;
    km_limit_per_period: number | null;
    excess_km_rate: string | null;
    late_fee_per_day: string | null;
    deposit_amount: string;
    pickup_location_id: number | null;
    return_location_id: number | null;
    pickup_location: string | null;
    return_location: string | null;
    one_way_fee_amount: string | null;
    insurance_package_id: number | null;
    fuel_policy_notes: string | null;
    notes: string | null;
}

interface Props {
    rental: Rental;
    vehicles?: VehicleOption[];
    drivers: DriverOption[];
    partners: PartnerOption[];
    locations?: LocationOption[];
    insurancePackages?: InsurancePackage[];
    defaultOneWayFee?: number;
    availableVehiclesUrl: string;
    quoteUrl: string;
    walkInUrl: string;
}

export default function Edit({
    rental,
    drivers,
    partners,
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
        vehicle_id: String(rental.vehicle_id),
        driver_id: rental.driver_id ? String(rental.driver_id) : '',
        partner_id: String(rental.partner_id),
        start_date: rental.start_date,
        end_date: rental.end_date,
        period_type: rental.period_type,
        rate_per_period: String(rental.rate_per_period),
        km_limit_per_period: rental.km_limit_per_period?.toString() ?? '',
        excess_km_rate: rental.excess_km_rate ?? '',
        late_fee_per_day: rental.late_fee_per_day ?? '',
        deposit_amount: String(rental.deposit_amount ?? ''),
        pickup_location_id: rental.pickup_location_id ? String(rental.pickup_location_id) : '',
        return_location_id: rental.return_location_id ? String(rental.return_location_id) : '',
        pickup_location: typeof rental.pickup_location === 'string' ? rental.pickup_location : '',
        return_location: typeof rental.return_location === 'string' ? rental.return_location : '',
        one_way_fee_amount: rental.one_way_fee_amount ?? '',
        insurance_package_id: rental.insurance_package_id ? String(rental.insurance_package_id) : '',
        fuel_policy_notes: rental.fuel_policy_notes ?? '',
        notes: rental.notes ?? '',
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.edit.title', { code: rental.code })}
                />
            }
        >
            <Head title={t('rental.pages.edit.title', { code: rental.code })} />
            <RentalNav />
            <ReservationForm
                mode="edit"
                initial={initial}
                partners={partners}
                drivers={drivers}
                locations={locations}
                insurancePackages={insurancePackages}
                defaultOneWayFee={defaultOneWayFee}
                availableVehiclesUrl={availableVehiclesUrl}
                quoteUrl={quoteUrl}
                walkInUrl={walkInUrl}
                submitUrl={prefixedRoute('rental.update', rental.id)}
                cancelUrl={prefixedRoute('rental.show', rental.id)}
                excludeRentalId={rental.id}
            />
        </DynamicLayout>
    );
}

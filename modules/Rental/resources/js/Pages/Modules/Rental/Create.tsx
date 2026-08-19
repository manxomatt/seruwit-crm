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
    aiKycEnabled?: boolean;
    aiScanDocUrl?: string;
    prefill?: {
        vehicle_id?: number | null;
        start_date?: string | null;
        end_date?: string | null;
        period_type?: string | null;
        start_step?: number | null;
        pickup_location_id?: number | null;
        return_location_id?: number | null;
        pickup_location?: string | null;
        return_location?: string | null;
    };
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
    aiKycEnabled = true,
    aiScanDocUrl,
    prefill = {},
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const initial: ReservationFormData = {
        vehicle_id: prefill.vehicle_id ? String(prefill.vehicle_id) : '',
        driver_id: '',
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        start_date: prefill.start_date ?? '',
        end_date: prefill.end_date ?? '',
        period_type: prefill.period_type ?? 'daily',
        rate_per_period: '',
        km_limit_per_period: '',
        excess_km_rate: '',
        late_fee_per_day: '',
        deposit_amount: '',
        pickup_location_id: prefill.pickup_location_id ? String(prefill.pickup_location_id) : '',
        return_location_id: prefill.return_location_id ? String(prefill.return_location_id) : '',
        pickup_location: prefill.pickup_location ?? '',
        return_location: prefill.return_location ?? '',
        one_way_fee_amount: '',
        insurance_package_id: '',
        fuel_policy_notes: '',
        notes: '',
    };

    const hasPrefill = Boolean(prefill.vehicle_id || prefill.start_date || prefill.end_date);
    const initialStep = prefill.start_step === 3 || prefill.start_step === 4 ? prefill.start_step : 1;

    return (
        <DynamicLayout header={<PageHeader title={t('rental.pages.create.title')} />}>
            <Head title={t('rental.pages.create.title')} />
            <RentalNav />
            <ReservationForm
                mode="create"
                initial={initial}
                initialStep={initialStep}
                partners={partners}
                drivers={drivers}
                locations={locations}
                insurancePackages={insurancePackages}
                defaultOneWayFee={defaultOneWayFee}
                availableVehiclesUrl={availableVehiclesUrl}
                quoteUrl={quoteUrl}
                walkInUrl={walkInUrl}
                aiKycEnabled={aiKycEnabled}
                aiScanDocUrl={aiScanDocUrl}
                submitUrl={prefixedRoute('rental.store')}
                cancelUrl={prefixedRoute('rental.index')}
                skipDraftRestore={hasPrefill}
            />
        </DynamicLayout>
    );
}

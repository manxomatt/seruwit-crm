import { Head } from '@inertiajs/react';
import LandingApp from './WelcomeLanding/App';
import TenantRentalLandingApp from './TenantRentalLanding/App';
import { DEFAULT_SITE_NAME } from './WelcomeLanding/constants';
import { TenantRentalLandingProps } from './TenantRentalLanding/types';

interface Settings {
    'general.site_name'?: string;
    'general.site_tagline'?: string;
    'general.site_description'?: string;
    'general.date_format'?: string;
    'site.logo'?: string;
    'site.favicon'?: string;
    'site.copyright'?: string;
    'site.phone'?: string;
    'site.address'?: string;
    'site.contact_email'?: string;
    'site.working_hours'?: string;
    [key: string]: string | undefined;
}

interface WelcomeProps {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
    settings: Settings;
    isTenant?: boolean;
    tenantRentalData?: TenantRentalLandingProps | null;
}

export default function Welcome({
    settings,
    canLogin,
    canRegister,
    isTenant = false,
    tenantRentalData,
}: WelcomeProps): JSX.Element {
    const siteName =
        (isTenant && tenantRentalData?.brand?.name) ||
        settings?.['general.site_name'] ||
        DEFAULT_SITE_NAME;

    return (
        <>
            <Head title={siteName} />
            {isTenant ? (
                <TenantRentalLandingApp
                    settings={settings}
                    brand={tenantRentalData?.brand}
                    featuredVehicles={tenantRentalData?.featuredVehicles || []}
                    locations={tenantRentalData?.locations || []}
                    classes={tenantRentalData?.classes || []}
                    customer={tenantRentalData?.customer}
                    passengerBookingEnabled={tenantRentalData?.passengerBookingEnabled ?? true}
                    canLogin={canLogin}
                />
            ) : (
                <LandingApp
                    settings={settings}
                    canLogin={canLogin}
                    canRegister={canRegister}
                />
            )}
        </>
    );
}

import { Head, usePage } from '@inertiajs/react';
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
    const { auth, is_maintenance_mode } = usePage().props as {
        auth?: { user?: { is_admin?: boolean } | null };
        is_maintenance_mode?: boolean;
    };

    const siteName =
        (isTenant && tenantRentalData?.brand?.name) ||
        settings?.['general.site_name'] ||
        DEFAULT_SITE_NAME;

    return (
        <>
            <Head title={siteName} />
            {is_maintenance_mode && auth?.user && (
                <div className="sticky top-0 inset-x-0 z-50 bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm px-4 py-2.5 shadow-md flex items-center justify-between gap-3 border-b border-amber-500">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
                        <span>
                            <strong>Mode Pemeliharaan Aktif (HTTP 503):</strong> Halaman publik saat ini tertutup bagi pengunjung umum. Anda dapat melihat halaman ini karena sedang login.
                        </span>
                    </div>
                    <a
                        href="/module/platform-settings/general"
                        className="shrink-0 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                    >
                        Panel Pengaturan
                    </a>
                </div>
            )}
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

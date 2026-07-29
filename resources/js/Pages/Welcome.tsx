import { Head } from '@inertiajs/react';
import LandingApp from './WelcomeLanding/App';
import { DEFAULT_SITE_NAME } from './WelcomeLanding/constants';

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
}

export default function Welcome({
    settings,
    canLogin,
    canRegister,
}: WelcomeProps): JSX.Element {
    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;

    return (
        <>
            <Head title={siteName} />
            <LandingApp
                settings={settings}
                canLogin={canLogin}
                canRegister={canRegister}
            />
        </>
    );
}

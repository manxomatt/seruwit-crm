import { Head } from '@inertiajs/react';
import LandingApp from './WelcomeLanding/App';

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

export default function Welcome({ settings }: WelcomeProps): JSX.Element {
    const siteName = settings?.['general.site_name'] || 'Sky Track';
    
    return (
        <>
            <Head title={siteName} />
            <LandingApp settings={settings} />
        </>
    );
}

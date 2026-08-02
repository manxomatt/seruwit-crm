import { applyAppearance } from '@/utils/appearance';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect } from 'react';

/**
 * Keeps CSS variables / dark mode in sync with shared Appearance settings.
 */
export default function AppearanceProvider({ children }: PropsWithChildren): JSX.Element {
    const pageProps = usePage().props as { settings?: Record<string, string> };
    const settings = pageProps.settings && !Array.isArray(pageProps.settings) ? pageProps.settings : undefined;

    useEffect(() => {
        applyAppearance(settings);
    }, [
        settings?.['appearance.primary_color'],
        settings?.['appearance.secondary_color'],
        settings?.['appearance.font_family'],
        settings?.['appearance.dark_mode'],
    ]);

    return <>{children}</>;
}

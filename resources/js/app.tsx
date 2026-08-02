import '../css/app.css';
import './bootstrap';

import { applyAppearance } from './utils/appearance';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function settingsFromPageProps(pageProps: unknown): Record<string, string> | undefined {
    if (!pageProps || typeof pageProps !== 'object') {
        return undefined;
    }

    const settings = (pageProps as { settings?: unknown }).settings;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return undefined;
    }

    return settings as Record<string, string>;
}

createInertiaApp({
    title: (title: string) => `${title} - ${appName}`,
    resolve: (name: string) => {
        const pages = {
            ...(import.meta.glob('./Pages/**/*.tsx') as Record<string, () => Promise<any>>),
            ...(import.meta.glob('./Pages/**/*.jsx') as Record<string, () => Promise<any>>),
            ...(import.meta.glob('../../modules/*/resources/js/Pages/**/*.tsx') as Record<
                string,
                () => Promise<any>
            >),
        };

        // A module's Pages directory overlays resources/js/Pages: same internal
        // layout, so a page keeps its name when it moves into a module. For
        // "Modules/<Module>/<Page>", the module's own copy wins and core is the
        // fallback — modules are extracted one at a time, so both are live at once.
        const owned = name.match(/^Modules\/([^/]+)\//);

        const candidates = owned
            ? [`../../modules/${owned[1]}/resources/js/Pages/${name}.tsx`, `./Pages/${name}.tsx`]
            : [`./Pages/${name}.tsx`];

        return resolvePageComponent(candidates, pages as any);
    },
    setup({ el, App, props }) {
        applyAppearance(settingsFromPageProps(props.initialPage.props));

        // Keep theme in sync after Inertia navigations / partial reloads.
        router.on('success', (event) => {
            applyAppearance(settingsFromPageProps(event.detail.page.props));
        });

        const root = createRoot(el as Element);
        root.render(<App {...props} />);
    },
    progress: {
        color: 'var(--color-primary, #3B82F6)',
    },
});

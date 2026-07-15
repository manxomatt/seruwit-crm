import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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
        const root = createRoot(el as Element);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

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
        };

        return resolvePageComponent(`./Pages/${name}.tsx`, pages as any);
    },
    setup({ el, App, props }) {
        const root = createRoot(el as Element);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

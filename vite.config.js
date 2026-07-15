import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx', 'resources/css/app.css'],
            // Spelled out rather than `refresh: true`, whose built-in path list
            // is fixed and knows nothing about modules/ — module views and routes
            // would never trigger a reload.
            refresh: [
                'app/View/Components/**',
                'resources/views/**',
                'routes/**',
                'modules/*/View/Components/**',
                'modules/*/resources/views/**',
            ],
        }),
        react(),
    ],
});

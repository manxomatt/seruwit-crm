import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.js',
        './resources/js/**/*.jsx',
        './resources/js/**/*.ts',
        './resources/js/**/*.tsx',
        './modules/*/resources/views/**/*.blade.php',
        './modules/*/resources/js/**/*.js',
        './modules/*/resources/js/**/*.jsx',
        './modules/*/resources/js/**/*.ts',
        './modules/*/resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', 'Figtree', ...defaultTheme.fontFamily.sans],
                display: ['Plus Jakarta Sans', 'var(--font-sans)', 'Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
                brand: {
                    DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
                    secondary: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
                },
                accent: '#ff6b6b',
                'background-soft': '#f8fafc',
                'background-light': '#f1f5f9',
            },
        },
    },

    darkMode: 'class',

    plugins: [forms],
};

<!DOCTYPE html>
{{-- Dedicated installer root view. Unlike app.blade.php it never touches the
     database (no Appearance::resolve / module page entrypoint), so it renders on
     a fresh, un-migrated deployment. Theme colours fall back to sane defaults. --}}
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600|plus-jakarta-sans:500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Material Symbols -->
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        <style>
            :root {
                --color-primary-rgb: 79 70 229;
                --color-primary: #4f46e5;
                --color-secondary-rgb: 16 185 129;
                --color-secondary: #10b981;
            }
        </style>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

<!DOCTYPE html>
@php
    $appearance = \App\Support\Appearance::resolve();
@endphp
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => $appearance['dark_mode']])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Add to Home Screen (driver portal) -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="{{ $appearance['primary_color'] }}">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <link rel="apple-touch-icon" href="/icons/icon-192.png">

        <!-- Fonts: Outfit (Headings) & Plus Jakarta Sans (Body/Buttons) -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=outfit:400,500,600,700,800,900|plus-jakarta-sans:400,500,600,700,800|figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Material Symbols -->
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

        <style>
            :root {
                {!! \App\Support\Appearance::cssVariablesBlock($appearance) !!}
            }
        </style>

        @if($appearance['custom_css'] !== '')
            <style id="appearance-custom-css">
                {!! $appearance['custom_css'] !!}
            </style>
        @endif

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia

        @if($appearance['custom_js'] !== '')
            <script id="appearance-custom-js">
                {!! $appearance['custom_js'] !!}
            </script>
        @endif
    </body>
</html>

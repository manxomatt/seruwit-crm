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

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600|plus-jakarta-sans:500,600,700,800&display=swap" rel="stylesheet" />

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

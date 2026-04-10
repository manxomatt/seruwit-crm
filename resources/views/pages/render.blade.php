<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $page->title }} - {{ \App\Models\Setting::getValue('general.site_name', config('app.name')) }}</title>
    <meta name="description" content="{{ \App\Models\Setting::getValue('seo.meta_description', '') }}">
    <meta name="keywords" content="{{ \App\Models\Setting::getValue('seo.meta_keywords', '') }}">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{ $page->title }}">
    <meta property="og:description" content="{{ \App\Models\Setting::getValue('seo.meta_description', '') }}">
    <meta property="og:image" content="{{ \App\Models\Setting::getValue('seo.og_image', '') }}">
    
    <!-- Favicon -->
    <link rel="icon" href="{{ \App\Models\Setting::getValue('site.favicon', '/favicon.ico') }}">
    
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        html {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        body {
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
        }
        /* Main content wrapper - grows to fill available space */
        body > *:not(footer):not(script):not(style) {
            flex-grow: 1;
        }
        /* Footer sticks to bottom - both direct child and nested */
        body > footer,
        footer {
            margin-top: auto;
            flex-shrink: 0;
        }
        /* Section containing footer should grow to fill space */
        body > section:last-of-type,
        body > div:last-of-type {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        /* Container inside section should also flex */
        body > section:last-of-type > div,
        body > div:last-of-type > div {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        {!! $page->css !!}
    </style>
    
    @if(\App\Models\Setting::getValue('seo.google_analytics_id'))
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ \App\Models\Setting::getValue('seo.google_analytics_id') }}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '{{ \App\Models\Setting::getValue('seo.google_analytics_id') }}');
    </script>
    @endif
    
    @if(\App\Models\Setting::getValue('appearance.custom_css'))
    <style>
        {!! \App\Models\Setting::getValue('appearance.custom_css') !!}
    </style>
    @endif
</head>
<body>
    @php
        $html = $page->html;
        
        // Extract content from nested <body> tags if present (GrapesJS sometimes includes body tags)
        if (preg_match('/<body[^>]*>([\s\S]*)<\/body>/i', $html, $bodyMatch)) {
            $html = $bodyMatch[1];
        }
        
        // Parse and replace <carousel> tags with Blade component
        $html = preg_replace_callback(
            '/<carousel\s+slug=["\']([^"\']+)["\']\s*(?:\/>|><\/carousel>|>[\s\S]*?<\/carousel>)/i',
            function ($matches) {
                $slug = $matches[1];
                return view('components.carousel', ['slug' => $slug, 'carousel' => \App\Models\Carousel::query()
                    ->where('slug', $slug)
                    ->where('is_active', true)
                    ->with('activeImages')
                    ->first()])->render();
            },
            $html
        );
        
        // Parse and replace {{setting:key}} placeholders with actual setting values
        $html = preg_replace_callback(
            '/\{\{setting:([a-z0-9_\.]+)\}\}/i',
            function ($matches) {
                $key = $matches[1];
                return \App\Models\Setting::getValue($key, '');
            },
            $html
        );
    @endphp
    
    {!! $html !!}
    
    @if(\App\Models\Setting::getValue('appearance.custom_js'))
    <script>
        {!! \App\Models\Setting::getValue('appearance.custom_js') !!}
    </script>
    @endif
    
    <script>
        // Ensure all navigation links work properly without being intercepted
        document.addEventListener('DOMContentLoaded', function() {
            // Find all links that should navigate to other pages
            const navigationLinks = document.querySelectorAll('a[href^="/"], a[href^="http"]');
            navigationLinks.forEach(function(link) {
                // Remove any existing click handlers that might prevent navigation
                link.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    // Only handle links that are not anchor links
                    if (href && !href.startsWith('#')) {
                        // Allow default navigation behavior
                        return true;
                    }
                }, true);
            });
        });
    </script>
</body>
</html>

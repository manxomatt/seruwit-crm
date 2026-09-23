import { useEffect, useRef, useState, useMemo } from 'react';

interface PageThumbnailProps {
    html?: string | null;
    css?: string | null;
    title?: string;
    size?: 'card' | 'mini';
    className?: string;
}

/**
 * Clean and prepare HTML string for safe and clean miniature preview.
 */
function preparePreviewHtml(rawHtml?: string | null): string {
    if (!rawHtml || !rawHtml.trim()) return '';

    let html = rawHtml;

    // Extract body content if whole document is passed
    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    if (bodyMatch) {
        html = bodyMatch[1];
    }

    // Strip out any executable scripts for safety and performance
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Replace bridge blocks with visual representations
    html = html.replace(
        /<carousel\b[^>]*>(?:[\s\S]*?<\/carousel>)?/gi,
        '<div style="background:#e0e7ff;border:2px dashed #818cf8;border-radius:12px;padding:32px 16px;margin:16px 0;text-align:center;color:#4338ca;font-weight:700;font-family:sans-serif;font-size:18px;">📸 [Carousel Banner]</div>'
    );

    html = html.replace(
        /<rental-fleet\b[^>]*>(?:[\s\S]*?<\/rental-fleet>)?/gi,
        '<div style="background:#f1f5f9;border:2px dashed #94a3b8;border-radius:12px;padding:32px 16px;margin:16px 0;text-align:center;color:#475569;font-weight:700;font-family:sans-serif;font-size:18px;">🚗 [Rental Fleet Showcase]</div>'
    );

    html = html.replace(
        /<rental-reviews\b[^>]*>(?:[\s\S]*?<\/rental-reviews>)?/gi,
        '<div style="background:#fef3c7;border:2px dashed #f59e0b;border-radius:12px;padding:32px 16px;margin:16px 0;text-align:center;color:#b45309;font-weight:700;font-family:sans-serif;font-size:18px;">⭐ [Customer Reviews]</div>'
    );

    // Replace template tags {{setting:...}}, {{trans:...}}, etc.
    html = html.replace(/\{\{(?:setting|trans|t):([a-z0-9_\.]+)\}\}/gi, (_m, key: string) => {
        return key.split('.').pop()?.replace(/_/g, ' ') || '';
    });
    html = html.replace(/\{\{pricing_table\}\}/gi, '<div style="background:#f8fafc;border:2px dashed #cbd5e1;padding:24px;border-radius:12px;text-align:center;font-weight:bold;color:#64748b;">🏷️ [Pricing Table]</div>');
    html = html.replace(/\{\{[^}]+\}\}/gi, '');

    return html;
}

export default function PageThumbnail({
    html,
    css,
    title = 'Page',
    size = 'card',
    className = '',
}: PageThumbnailProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(size === 'mini' ? 0.05 : 0.25);

    const hasContent = useMemo(() => {
        return Boolean(html && html.replace(/<[^>]*>/g, '').trim().length > 0 || (html && html.includes('<img')));
    }, [html]);

    // Measure container width and compute exact scale relative to 1200px desktop reference
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                if (width > 0) {
                    setScale(width / 1200);
                }
            }
        };

        updateScale();

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            const observer = new ResizeObserver(updateScale);
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, [size]);

    const srcDoc = useMemo(() => {
        if (!hasContent) return '';

        const cleanHtml = preparePreviewHtml(html);

        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=1200, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/builder/css/custom-builder.css">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 1200px !important;
            min-height: 750px !important;
            overflow: hidden !important;
            pointer-events: none !important;
            user-select: none !important;
            background-color: #ffffff;
            font-family: 'Figtree', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { display: none; }
        ${css || ''}
    </style>
</head>
<body>
    ${cleanHtml}
</body>
</html>`;
    }, [hasContent, html, css]);

    if (!hasContent) {
        // Wireframe Empty / Draft State
        if (size === 'mini') {
            return (
                <div
                    ref={containerRef}
                    className={`relative w-14 h-9 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden ${className}`}
                >
                    <span className="text-[10px]">📄</span>
                </div>
            );
        }

        return (
            <div
                ref={containerRef}
                className={`relative w-full aspect-[16/10] bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${className}`}
            >
                {/* Blueprint grid background */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Wireframe mockup skeleton */}
                <div className="w-full max-w-[180px] space-y-2 opacity-50">
                    <div className="h-2 w-3/4 mx-auto rounded bg-slate-300 dark:bg-slate-700" />
                    <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div className="h-6 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-6 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-6 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>

                <div className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-slate-200/80 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Draft Baru</span>
                </div>
            </div>
        );
    }

    if (size === 'mini') {
        return (
            <div
                ref={containerRef}
                className={`relative w-14 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-xs shrink-0 select-none ${className}`}
            >
                <iframe
                    title={`Thumbnail mini: ${title}`}
                    srcDoc={srcDoc}
                    tabIndex={-1}
                    loading="lazy"
                    sandbox="allow-same-origin"
                    className="absolute top-0 left-0 border-0 pointer-events-none select-none origin-top-left"
                    style={{
                        width: '1200px',
                        height: '750px',
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                    }}
                />
                {/* Transparent glass overlay to guarantee click propagation to parent */}
                <div className="absolute inset-0 bg-transparent pointer-events-none" />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full aspect-[16/10] bg-white dark:bg-slate-950 overflow-hidden select-none border-b border-slate-100 dark:border-slate-800/80 ${className}`}
        >
            <iframe
                title={`Thumbnail: ${title}`}
                srcDoc={srcDoc}
                tabIndex={-1}
                loading="lazy"
                sandbox="allow-same-origin"
                className="absolute top-0 left-0 border-0 pointer-events-none select-none origin-top-left"
                style={{
                    width: '1200px',
                    height: '750px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                }}
            />
            {/* Transparent click shield */}
            <div className="absolute inset-0 bg-transparent pointer-events-none" />
        </div>
    );
}

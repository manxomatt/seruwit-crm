import { Link, usePage } from '@inertiajs/react';
import { CSSProperties, PropsWithChildren, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';

interface FlashProps {
    flash?: { success?: string | null; error?: string | null };
}

interface Props {
    title?: string;
    header?: ReactNode;
    fullBleed?: boolean;
    /** Show enter/exit browser fullscreen control (cashier terminal). */
    allowFullscreen?: boolean;
}

function ExpandIcon(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
        </svg>
    );
}

function CompressIcon(): JSX.Element {
    return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5v4M15 4h4v4M9 20H5v-4M15 20h4v-4" />
        </svg>
    );
}

function getFullscreenElement(): Element | null {
    const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
    };

    return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestFullscreen(el: HTMLElement): Promise<void> {
    const anyEl = el as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
    };

    if (el.requestFullscreen) {
        await el.requestFullscreen();
        return;
    }

    if (anyEl.webkitRequestFullscreen) {
        await anyEl.webkitRequestFullscreen();
    }
}

async function exitFullscreen(): Promise<void> {
    const doc = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
    };

    if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
    }

    if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
    }
}

/**
 * Full-viewport POS chrome — no CRM sidebar. Cool gray-blue ambient with
 * slate accent; pay CTAs stay emerald on the terminal page itself.
 */
export default function PosLayout({
    title,
    header,
    fullBleed = false,
    allowFullscreen = false,
    children,
}: PropsWithChildren<Props>): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { flash } = usePage().props as unknown as FlashProps;
    const rootRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const syncFullscreen = useCallback((): void => {
        const root = rootRef.current;
        setIsFullscreen(Boolean(root && getFullscreenElement() === root));
    }, []);

    useEffect(() => {
        if (!allowFullscreen) {
            return;
        }

        const events = ['fullscreenchange', 'webkitfullscreenchange'] as const;
        events.forEach((event) => document.addEventListener(event, syncFullscreen));
        syncFullscreen();

        return () => {
            events.forEach((event) => document.removeEventListener(event, syncFullscreen));
        };
    }, [allowFullscreen, syncFullscreen]);

    const toggleFullscreen = useCallback(async (): Promise<void> => {
        const root = rootRef.current;
        if (!root) {
            return;
        }

        try {
            if (getFullscreenElement() === root) {
                await exitFullscreen();
            } else {
                await requestFullscreen(root);
            }
        } catch {
            // Browser may deny without a recent user gesture; ignore.
        }
    }, []);

    useEffect(() => {
        if (!allowFullscreen) {
            return;
        }

        const onKey = (event: KeyboardEvent): void => {
            // F11 is reserved by most browsers; F9 toggles POS fullscreen.
            if (event.key === 'F9') {
                event.preventDefault();
                void toggleFullscreen();
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [allowFullscreen, toggleFullscreen]);

    const tabs = [
        { labelKey: 'pos.nav.terminal', route: 'pos.terminal', patterns: ['pos.terminal'] },
        { labelKey: 'pos.nav.shifts', route: 'pos.shifts.index', patterns: ['pos.shifts.*'] },
        { labelKey: 'pos.nav.sales', route: 'pos.sales.index', patterns: ['pos.sales.*'] },
    ] as const;

    return (
        <div
            ref={rootRef}
            className={`flex min-h-screen flex-col ${isFullscreen ? 'h-screen overflow-hidden' : ''}`}
            style={
                {
                    ['--pos-bg' as string]: '#F0F3F7',
                    ['--pos-surface' as string]: '#FFFFFF',
                    ['--pos-ink' as string]: '#0F1D2E',
                    ['--pos-muted' as string]: '#5E7490',
                    ['--pos-accent' as string]: '#1A5C8A',
                    ['--pos-pay' as string]: '#0F7A4A',
                    ['--pos-pay-hover' as string]: '#0C643C',
                    ['--pos-warn' as string]: '#C87C0A',
                    ['--pos-danger' as string]: '#A52020',
                    background: 'var(--pos-bg)',
                    color: 'var(--pos-ink)',
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                } as CSSProperties
            }
        >
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=IBM+Plex+Mono:wght@500;600&display=swap"
            />

            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[var(--pos-surface)]/95 backdrop-blur">
                <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--pos-muted)]">{t('pos.title')}</p>
                            {title && <h1 className="truncate text-lg font-semibold leading-tight text-[var(--pos-ink)]">{title}</h1>}
                        </div>
                        {!fullBleed && (
                            <nav className="hidden items-center gap-1 sm:flex">
                                {tabs.map((tab) => {
                                    const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));

                                    return (
                                        <Link
                                            key={tab.route}
                                            href={prefixedRoute(tab.route)}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-slate-100 text-[var(--pos-accent)]'
                                                    : 'text-[var(--pos-muted)] hover:bg-slate-50 hover:text-[var(--pos-ink)]'
                                            }`}
                                        >
                                            {t(tab.labelKey)}
                                        </Link>
                                    );
                                })}
                            </nav>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {header}
                        {allowFullscreen && (
                            <button
                                type="button"
                                onClick={() => void toggleFullscreen()}
                                title={`${t(isFullscreen ? 'pos.actions.exit_fullscreen' : 'pos.actions.enter_fullscreen')} (F9)`}
                                aria-label={t(isFullscreen ? 'pos.actions.exit_fullscreen' : 'pos.actions.enter_fullscreen')}
                                aria-pressed={isFullscreen}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--pos-muted)] hover:bg-slate-50 hover:text-[var(--pos-ink)]"
                            >
                                {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
                            </button>
                        )}
                        {!isFullscreen && (
                            <Link
                                href={route('module.dashboard')}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--pos-muted)] hover:bg-slate-50 hover:text-[var(--pos-ink)]"
                            >
                                CRM
                            </Link>
                        )}
                    </div>
                </div>
                {!fullBleed && (
                    <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden">
                        {tabs.map((tab) => {
                            const active = tab.patterns.some((pattern) => isCurrentRoute(pattern));

                            return (
                                <Link
                                    key={tab.route}
                                    href={prefixedRoute(tab.route)}
                                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                                        active ? 'bg-slate-100 text-[var(--pos-accent)]' : 'text-[var(--pos-muted)]'
                                    }`}
                                >
                                    {t(tab.labelKey)}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </header>

            <main className={fullBleed ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto max-w-6xl px-4 py-6 lg:px-6'}>
                {flash?.success && (
                    <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{flash.success}</div>
                )}
                {flash?.error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{flash.error}</div>}
                {fullBleed ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
            </main>
        </div>
    );
}

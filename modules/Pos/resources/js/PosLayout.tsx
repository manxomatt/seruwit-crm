import { Link, usePage } from '@inertiajs/react';
import { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';

interface FlashProps {
    flash?: { success?: string | null; error?: string | null };
}

interface Props {
    title?: string;
    header?: ReactNode;
    fullBleed?: boolean;
}

/**
 * Full-viewport POS chrome — no CRM sidebar. Cool gray-blue ambient with
 * slate accent; pay CTAs stay emerald on the terminal page itself.
 */
export default function PosLayout({ title, header, fullBleed = false, children }: PropsWithChildren<Props>): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute, isCurrentRoute } = useRoutePrefix();
    const { flash } = usePage().props as unknown as FlashProps;

    const tabs = [
        { labelKey: 'pos.nav.terminal', route: 'pos.terminal', patterns: ['pos.terminal'] },
        { labelKey: 'pos.nav.shifts', route: 'pos.shifts.index', patterns: ['pos.shifts.*'] },
        { labelKey: 'pos.nav.sales', route: 'pos.sales.index', patterns: ['pos.sales.*'] },
    ] as const;

    return (
        <div
            className="min-h-screen"
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
                        <Link
                            href={route('module.dashboard')}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--pos-muted)] hover:bg-slate-50 hover:text-[var(--pos-ink)]"
                        >
                            CRM
                        </Link>
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

            <main className={fullBleed ? '' : 'mx-auto max-w-6xl px-4 py-6 lg:px-6'}>
                {flash?.success && (
                    <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{flash.success}</div>
                )}
                {flash?.error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{flash.error}</div>}
                {children}
            </main>
        </div>
    );
}

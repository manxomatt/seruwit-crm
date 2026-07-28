import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    children: ReactNode;
    className?: string;
}

/**
 * Sidebar navigation scroller: thin themed scrollbar, edge fades when
 * more items exist above/below, and auto-scrolls the active link into view.
 */
export default function SidebarNavScroll({ children, className = '' }: Props): JSX.Element {
    const ref = useRef<HTMLElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const updateFades = useCallback(() => {
        const el = ref.current;
        if (! el) {
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = el;
        const maxScroll = scrollHeight - clientHeight;
        const overflow = maxScroll > 2;

        setCanScrollUp(overflow && scrollTop > 2);
        setCanScrollDown(overflow && scrollTop < maxScroll - 2);
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (! el) {
            return;
        }

        updateFades();

        const active = el.querySelector<HTMLElement>('[aria-current="page"], .sidebar-nav-active');
        if (active) {
            active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            // Recompute after smooth scroll settles.
            window.setTimeout(updateFades, 320);
        }

        el.addEventListener('scroll', updateFades, { passive: true });

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updateFades)
            : null;
        resizeObserver?.observe(el);

        const mutationObserver = typeof MutationObserver !== 'undefined'
            ? new MutationObserver(updateFades)
            : null;
        mutationObserver?.observe(el, { childList: true, subtree: true });

        return () => {
            el.removeEventListener('scroll', updateFades);
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
        };
    }, [updateFades]);

    return (
        <div className={`relative min-h-0 flex-1 ${className}`}>
            <div
                className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-slate-900/90 to-transparent transition-opacity duration-200 ${
                    canScrollUp ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden
            />
            <nav
                ref={ref}
                className="sidebar-nav-scroll h-full space-y-1 overflow-y-auto overscroll-contain px-3 py-3"
            >
                {children}
            </nav>
            <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-slate-900/90 to-transparent transition-opacity duration-200 ${
                    canScrollDown ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden
            />
        </div>
    );
}

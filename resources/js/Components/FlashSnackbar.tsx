import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type FlashTone = 'success' | 'error' | 'warning';

interface FlashProps {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
}

interface SnackbarItem {
    id: string;
    tone: FlashTone;
    message: string;
}

const TONE_STYLES: Record<FlashTone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

const TONE_ICON: Record<FlashTone, string> = {
    success: '✓',
    error: '!',
    warning: 'i',
};

function dismissMsFor(message: string): number {
    // Longer messages (e.g. optimize summary) stay visible longer.
    const base = 4500;
    const extra = Math.min(6000, Math.max(0, message.length - 80) * 40);
    return base + extra;
}

/**
 * Renders Inertia flash messages as bottom snackbars instead of inline banners.
 * Auto-dismisses; longer text stays visible longer so optimize results stay readable.
 */
export default function FlashSnackbar() {
    const page = usePage();
    const flash = (page.props as { flash?: FlashProps }).flash;
    const [items, setItems] = useState<SnackbarItem[]>([]);

    const incoming = useMemo(() => {
        const next: SnackbarItem[] = [];
        if (flash?.success) {
            next.push({ id: `success-${flash.success}`, tone: 'success', message: flash.success });
        }
        if (flash?.warning) {
            next.push({ id: `warning-${flash.warning}`, tone: 'warning', message: flash.warning });
        }
        if (flash?.error) {
            next.push({ id: `error-${flash.error}`, tone: 'error', message: flash.error });
        }
        return next;
    }, [flash?.success, flash?.warning, flash?.error, page.url]);

    useEffect(() => {
        if (incoming.length === 0) {
            return;
        }

        setItems(incoming);

        const timers = incoming.map((item) =>
            window.setTimeout(() => {
                setItems((current) => current.filter((row) => row.id !== item.id));
            }, dismissMsFor(item.message)),
        );

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [incoming]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-6"
            role="status"
            aria-live="polite"
        >
            {items.map((item) => (
                <div
                    key={item.id}
                    className={`pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ring-1 ring-black/5 ${TONE_STYLES[item.tone]}`}
                >
                    <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 text-xs font-bold"
                        aria-hidden
                    >
                        {TONE_ICON[item.tone]}
                    </span>
                    <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-relaxed">{item.message}</p>
                    <button
                        type="button"
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-base leading-none opacity-60 hover:bg-black/5 hover:opacity-100"
                        aria-label="Dismiss"
                        onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}

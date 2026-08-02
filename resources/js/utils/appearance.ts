const DEFAULT_PRIMARY = '#3B82F6';
const DEFAULT_SECONDARY = '#10B981';
const DEFAULT_FONT = 'Figtree, ui-sans-serif, system-ui, sans-serif';

export type AppearanceSettings = {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
    dark_mode?: string | boolean;
};

function sanitizeColor(value: string | undefined, fallback: string): string {
    const raw = (value ?? '').trim();
    if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(raw)) {
        if (raw.length === 4) {
            return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
        }
        return raw.toUpperCase();
    }
    return fallback;
}

function sanitizeFont(value: string | undefined): string {
    const cleaned = (value ?? '').replace(/[^\w\s\-,.'"\/]/g, '').trim();
    return cleaned || DEFAULT_FONT;
}

function truthy(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') {
        return value;
    }
    const normalized = String(value ?? '').trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const clean = sanitizeColor(hex, DEFAULT_PRIMARY).replace('#', '');
    if (clean.length !== 6) {
        return null;
    }
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

function mixHex(hex: string, withHex: string, ratio: number): string {
    const a = hexToRgb(hex);
    const b = hexToRgb(withHex);
    if (!a || !b) {
        return DEFAULT_PRIMARY;
    }
    const t = Math.max(0, Math.min(1, ratio));
    const r = Math.round(a.r * (1 - t) + b.r * t);
    const g = Math.round(a.g * (1 - t) + b.g * t);
    const bl = Math.round(a.b * (1 - t) + b.b * t);
    return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/**
 * Apply Appearance settings to documentElement (and Inertia progress color).
 */
export function applyAppearance(settings: Record<string, string> | AppearanceSettings | undefined | null): void {
    if (typeof document === 'undefined') {
        return;
    }

    const map = (settings ?? {}) as Record<string, string | boolean | undefined>;
    const primary = sanitizeColor(
        (map['appearance.primary_color'] as string | undefined) ?? (map.primary_color as string | undefined),
        DEFAULT_PRIMARY,
    );
    const secondary = sanitizeColor(
        (map['appearance.secondary_color'] as string | undefined) ?? (map.secondary_color as string | undefined),
        DEFAULT_SECONDARY,
    );
    const font = sanitizeFont(
        (map['appearance.font_family'] as string | undefined) ?? (map.font_family as string | undefined),
    );
    const dark = truthy(
        (map['appearance.dark_mode'] as string | boolean | undefined) ?? (map.dark_mode as string | boolean | undefined),
    );

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    const primaryDark = mixHex(primary, '#0f172a', 0.55);
    const primaryDarker = mixHex(primary, '#020617', 0.72);

    const root = document.documentElement;
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty(
        '--color-primary-rgb',
        primaryRgb ? `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}` : '59 130 246',
    );
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty(
        '--color-secondary-rgb',
        secondaryRgb ? `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}` : '16 185 129',
    );
    root.style.setProperty('--color-primary-dark', primaryDark);
    root.style.setProperty('--color-primary-darker', primaryDarker);
    root.style.setProperty('--font-sans', font);
    root.style.setProperty('--brand-sidebar-from', primaryDarker);
    root.style.setProperty('--brand-sidebar-via', primaryDark);
    root.style.setProperty('--brand-sidebar-to', primaryDarker);
    root.style.setProperty('--brand-sidebar-accent', secondary);

    root.classList.toggle('dark', dark);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        themeMeta.setAttribute('content', primary);
    }
}

export { DEFAULT_PRIMARY, DEFAULT_SECONDARY, DEFAULT_FONT };

import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

type TranslationTree = Record<string, unknown>;

interface SharedPageProps {
    locale?: string;
    translations?: Record<string, TranslationTree>;
    [key: string]: unknown;
}

function dig(tree: TranslationTree | undefined, path: string[]): unknown {
    let current: unknown = tree;

    for (const segment of path) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }

        current = (current as TranslationTree)[segment];
    }

    return current;
}

function replaceParams(template: string, params?: Record<string, string | number>): string {
    if (!params) {
        return template;
    }

    // Longer keys first so `:to` does not eat the start of `:total`.
    return Object.entries(params)
        .sort(([left], [right]) => right.length - left.length)
        .reduce((text, [key, value]) => {
            const pattern = new RegExp(`:${key}(?![A-Za-z0-9_])`, 'g');

            return text.replace(pattern, String(value));
        }, template);
}

/**
 * Translate a dotted key from Inertia-shared Laravel lang groups.
 *
 * Example: t('shell.log_out') → translations.shell.log_out
 */
export function useTrans(): {
    t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
    locale: string;
} {
    const { locale = 'en', translations = {} } = usePage().props as SharedPageProps;

    const t = useCallback(
        (key: string, params?: Record<string, string | number>, fallback?: string): string => {
            const [group, ...rest] = key.split('.');

            if (!group || rest.length === 0) {
                return fallback ?? key;
            }

            const value = dig(translations[group], rest);

            if (typeof value === 'string') {
                return replaceParams(value, params);
            }

            return fallback ?? key;
        },
        [translations],
    );

    return { t, locale };
}

/**
 * BCP 47 locale tag for Intl formatters.
 */
export function useLocaleTag(): string {
    const { locale = 'en' } = usePage().props as SharedPageProps;

    return locale === 'id' ? 'id-ID' : 'en-US';
}

import { router, usePage } from '@inertiajs/react';

interface LocaleOption {
    code: string;
    label: string;
}

interface SharedProps {
    locale?: string;
    availableLocales?: LocaleOption[];
    [key: string]: unknown;
}

/**
 * Compact id/en switcher for the public storefront. Persists the choice via the
 * shared `locale.update` route, then Inertia reloads with fresh translations.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
    const { locale = 'id', availableLocales = [] } = usePage().props as SharedProps;

    const options = availableLocales.length > 0
        ? availableLocales
        : [
              { code: 'id', label: 'Bahasa Indonesia' },
              { code: 'en', label: 'English' },
          ];

    const change = (code: string): void => {
        if (code === locale) {
            return;
        }

        router.patch(route('locale.update'), { locale: code }, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <div className={`inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 ${className}`}>
            {options.map((option) => (
                <button
                    key={option.code}
                    type="button"
                    onClick={() => change(option.code)}
                    aria-pressed={option.code === locale}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition ${
                        option.code === locale
                            ? 'text-white'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                    style={option.code === locale ? { backgroundColor: 'var(--brand-color, #0f766e)' } : undefined}
                >
                    {option.code}
                </button>
            ))}
        </div>
    );
}

import { router, usePage } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';

interface AvailableLocale {
    code: string;
    label: string;
}

interface Props {
    className?: string;
    compact?: boolean;
}

export default function LanguageSwitcher({ className = '', compact = false }: Props): JSX.Element {
    const { t, locale } = useTrans();
    const availableLocales = ((usePage().props as { availableLocales?: AvailableLocale[] }).availableLocales) ?? [];

    const switchLocale = (next: string) => {
        if (next === locale) {
            return;
        }

        router.patch(route('locale.update'), { locale: next }, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    if (compact) {
        return (
            <div className={`inline-flex rounded-lg bg-gray-100 p-0.5 ${className}`}>
                {availableLocales.map((item) => (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => switchLocale(item.code)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold uppercase transition ${
                            locale === item.code
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                        }`}
                        aria-label={item.label}
                    >
                        {item.code}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <label className={`flex items-center gap-2 text-sm text-gray-700 ${className}`}>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('shell.language')}
            </span>
            <select
                value={locale}
                onChange={(e) => switchLocale(e.target.value)}
                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
                {availableLocales.map((item) => (
                    <option key={item.code} value={item.code}>
                        {item.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

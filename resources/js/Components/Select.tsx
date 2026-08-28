import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from '@headlessui/react';
import { useMemo, useState } from 'react';
import { useTrans } from '@/hooks/useTrans';

export interface SelectOption {
    value: string;
    label: string;
    description?: string;
    badge?: string;
    disabled?: boolean;
}

interface Props {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    noResultsText?: string;
    disabled?: boolean;
    /**
     * true — always searchable
     * false — always plain list
     * undefined — searchable automatically when options exceed the visible limit
     */
    searchable?: boolean;
    /** Cap visible rows in searchable mode (default 10). */
    maxVisibleOptions?: number;
    className?: string;
}

const DEFAULT_VISIBLE_OPTIONS = 10;

const ChevronUpDownIcon = () => (
    <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const triggerClassName =
    'w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-3.5 pr-10 text-left text-xs shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-500';

const optionsPanelClassName =
    'z-[1200] mt-1 max-h-72 min-w-[var(--input-width)] w-auto max-w-xl overflow-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-xs shadow-2xl backdrop-blur-md ring-1 ring-black/5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 data-[leave]:duration-75 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-200';

const listboxPanelClassName =
    'z-[1200] mt-1 max-h-72 min-w-[var(--button-width)] w-auto max-w-xl overflow-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 text-xs shadow-2xl backdrop-blur-md ring-1 ring-black/5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 data-[leave]:duration-75 dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-200';

const optionClassName =
    'group relative cursor-default select-none rounded-xl px-3 py-2 text-gray-900 transition-colors data-[focus]:bg-indigo-600 data-[focus]:text-white data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400 dark:text-slate-200 dark:data-[disabled]:text-slate-500';

function shouldUseSearchable(searchable: boolean | undefined, optionCount: number, limit: number): boolean {
    if (searchable === true) {
        return true;
    }

    if (searchable === false) {
        return false;
    }

    return optionCount > limit;
}

function SearchableSelect({
    id,
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder,
    emptyText,
    noResultsText,
    disabled = false,
    maxVisibleOptions = DEFAULT_VISIBLE_OPTIONS,
    className = '',
}: Omit<Props, 'searchable'> & {
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
    noResultsText: string;
}): JSX.Element {
    const { t } = useTrans();
    const [query, setQuery] = useState('');

    const selected = options.find((option) => option.value === value);
    const needle = query.trim().toLowerCase();
    const limit = Math.max(1, maxVisibleOptions);

    const filtered = useMemo(() => {
        if (needle === '') {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(needle) ||
            (option.description && option.description.toLowerCase().includes(needle)) ||
            (option.badge && option.badge.toLowerCase().includes(needle))
        );
    }, [options, needle]);

    const visible = useMemo(() => {
        let list = filtered.slice(0, limit);

        if (value && !list.some((option) => option.value === value)) {
            const selectedOption = filtered.find((option) => option.value === value) ?? selected;
            if (selectedOption) {
                list = [selectedOption, ...list.filter((option) => option.value !== value)].slice(0, limit);
            }
        }

        return {
            list,
            hiddenCount: Math.max(0, filtered.length - list.length),
        };
    }, [filtered, limit, value, selected]);

    return (
        <Combobox
            value={value}
            onChange={(next) => {
                onChange(next ?? '');
                setQuery('');
            }}
            disabled={disabled}
            immediate
            onClose={() => setQuery('')}
        >
            <div className={`relative ${className}`}>
                <div className="relative">
                    <ComboboxInput
                        id={id}
                        className={triggerClassName}
                        displayValue={() => selected?.label ?? ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={selected ? searchPlaceholder : placeholder}
                        autoComplete="off"
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon />
                    </ComboboxButton>
                </div>

                <ComboboxOptions transition anchor="bottom start" className={optionsPanelClassName}>
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                            {options.length === 0 ? emptyText : noResultsText}
                        </div>
                    ) : (
                        <>
                            {visible.list.map((option) => (
                                <ComboboxOption
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                    className={optionClassName}
                                >
                                    <div className="flex flex-col gap-0.5 pr-6">
                                        <div className="flex items-center gap-2">
                                            <span className="block font-bold text-xs text-slate-900 group-data-[focus]:text-white group-data-[selected]:text-indigo-600 dark:text-white dark:group-data-[selected]:text-indigo-400">
                                                {option.label}
                                            </span>
                                            {option.badge && (
                                                <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-data-[focus]:bg-white/20 group-data-[focus]:text-white group-data-[focus]:border-white/30">
                                                    {option.badge}
                                                </span>
                                            )}
                                        </div>
                                        {option.description && (
                                            <span className="block text-[11px] text-slate-500 group-data-[focus]:text-white/80 dark:text-slate-400 leading-snug">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                    <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-indigo-600 group-data-[focus]:text-white group-data-[selected]:flex">
                                        <CheckIcon />
                                    </span>
                                </ComboboxOption>
                            ))}
                            {visible.hiddenCount > 0 && (
                                <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-2 text-xs text-gray-400">
                                    {needle === ''
                                        ? t('common.select_type_to_search', { count: visible.hiddenCount })
                                        : t('common.select_refine_search', { count: visible.hiddenCount })}
                                </div>
                            )}
                        </>
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}

export default function Select({
    id,
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder,
    emptyText,
    noResultsText,
    disabled = false,
    searchable,
    maxVisibleOptions = DEFAULT_VISIBLE_OPTIONS,
    className = '',
}: Props): JSX.Element {
    const { t } = useTrans();

    const resolvedPlaceholder = placeholder ?? t('common.select_placeholder', undefined, 'Select...');
    const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.search', undefined, 'Search…');
    const resolvedEmptyText = emptyText ?? t('common.no_options');
    const resolvedNoResultsText = noResultsText ?? t('common.no_results');
    const limit = Math.max(1, maxVisibleOptions);

    if (shouldUseSearchable(searchable, options.length, limit)) {
        return (
            <SearchableSelect
                id={id}
                value={value}
                onChange={onChange}
                options={options}
                placeholder={resolvedPlaceholder}
                searchPlaceholder={resolvedSearchPlaceholder}
                emptyText={resolvedEmptyText}
                noResultsText={resolvedNoResultsText}
                disabled={disabled}
                maxVisibleOptions={limit}
                className={className}
            />
        );
    }

    const selected = options.find((option) => option.value === value);

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={`relative ${className}`}>
                <ListboxButton id={id} className={`relative cursor-default ${triggerClassName}`}>
                    {selected ? (
                        <div className="flex flex-col text-left pr-4 py-0.5">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {selected.label}
                                </span>
                                {selected.badge && (
                                    <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                        {selected.badge}
                                    </span>
                                )}
                            </div>
                            {selected.description && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {selected.description}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="block truncate text-gray-400 text-xs py-1">
                            {resolvedPlaceholder}
                        </span>
                    )}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon />
                    </span>
                </ListboxButton>

                <ListboxOptions transition anchor="bottom start" className={listboxPanelClassName}>
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">{resolvedEmptyText}</div>
                    )}
                    {options.map((option) => (
                        <ListboxOption
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className={optionClassName}
                        >
                            <div className="flex flex-col gap-0.5 pr-6">
                                <div className="flex items-center gap-2">
                                    <span className="block font-bold text-xs text-slate-900 group-data-[focus]:text-white group-data-[selected]:text-indigo-600 dark:text-white dark:group-data-[selected]:text-indigo-400">
                                        {option.label}
                                    </span>
                                    {option.badge && (
                                        <span className="rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 group-data-[focus]:bg-white/20 group-data-[focus]:text-white group-data-[focus]:border-white/30">
                                            {option.badge}
                                        </span>
                                    )}
                                </div>
                                {option.description && (
                                    <span className="block text-[11px] text-slate-500 group-data-[focus]:text-white/80 dark:text-slate-400 leading-snug">
                                        {option.description}
                                    </span>
                                )}
                            </div>
                            <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-indigo-600 group-data-[focus]:text-white group-data-[selected]:flex">
                                <CheckIcon />
                            </span>
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}

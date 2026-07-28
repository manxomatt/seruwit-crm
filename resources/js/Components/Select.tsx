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
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const triggerClassName =
    'w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm';

const optionsPanelClassName =
    'z-[200] mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 data-[leave]:duration-75 sm:text-sm';

const listboxPanelClassName =
    'z-[200] mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 data-[leave]:duration-75 sm:text-sm';

const optionClassName =
    'group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400';

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

        return options.filter((option) => option.label.toLowerCase().includes(needle));
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
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
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
                                    <span className="block truncate group-data-[selected]:font-semibold">{option.label}</span>
                                    <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-indigo-600 group-data-[focus]:text-white group-data-[selected]:flex">
                                        <CheckIcon />
                                    </span>
                                </ComboboxOption>
                            ))}
                            {visible.hiddenCount > 0 && (
                                <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-400">
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
                    <span className={`block truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selected ? selected.label : resolvedPlaceholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
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
                            <span className="block truncate group-data-[selected]:font-semibold">{option.label}</span>
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

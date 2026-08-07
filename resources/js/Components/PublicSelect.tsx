import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

export interface PublicSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface Props {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    options: PublicSelectOption[];
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
}

const ChevronIcon = () => (
    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

/**
 * Public-booking select (Listbox) without Headless portal/anchor —
 * options stay full-width under the trigger and always render.
 */
export default function PublicSelect({
    id,
    value,
    onChange,
    options,
    placeholder = 'Pilih…',
    emptyText = 'Tidak ada opsi',
    disabled = false,
    className = '',
}: Props): JSX.Element {
    const selected = options.find((option) => option.value === value);

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={`relative ${className}`}>
                <ListboxButton
                    id={id}
                    className="relative w-full cursor-default rounded-md border border-slate-300 bg-white py-2.5 pl-3 pr-10 text-left text-sm shadow-sm transition focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <span className={`block truncate ${selected && selected.value !== '' ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                        {selected?.label ?? placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                        <ChevronIcon />
                    </span>
                </ListboxButton>

                <ListboxOptions
                    modal={false}
                    className="absolute left-0 right-0 z-[80] mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none"
                >
                    {options.length === 0 ? (
                        <div className="px-3 py-2.5 text-slate-400">{emptyText}</div>
                    ) : (
                        options.map((option) => (
                            <ListboxOption
                                key={`${option.value || 'empty'}-${option.label}`}
                                value={option.value}
                                disabled={option.disabled}
                                className="group relative cursor-default select-none py-2.5 pl-3 pr-9 text-slate-900 data-[disabled]:cursor-not-allowed data-[disabled]:text-slate-300 data-[focus]:bg-teal-600 data-[focus]:text-white"
                            >
                                <span className="block truncate group-data-[selected]:font-semibold">{option.label}</span>
                                <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-teal-600 group-data-[focus]:text-white group-data-[selected]:flex">
                                    <CheckIcon />
                                </span>
                            </ListboxOption>
                        ))
                    )}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}

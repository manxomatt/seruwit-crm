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
    buttonClassName?: string;
}

const ChevronIcon = () => (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
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
    buttonClassName,
}: Props): JSX.Element {
    const selected = options.find((option) => option.value === value);

    const defaultBtnClass =
        'relative w-full cursor-pointer rounded-xl border border-slate-250 bg-white py-2.5 pl-3.5 pr-9 text-left text-xs font-bold text-slate-800 shadow-2xs transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={`relative ${className}`}>
                <ListboxButton
                    id={id}
                    className={buttonClassName ? `relative cursor-pointer text-left ${buttonClassName}` : defaultBtnClass}
                >
                    <span className={`block truncate ${selected && selected.value !== '' ? 'font-bold text-slate-900' : 'font-normal text-slate-400'}`}>
                        {selected?.label ?? placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronIcon />
                    </span>
                </ListboxButton>

                <ListboxOptions
                    modal={false}
                    className="absolute left-0 right-0 z-[80] mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-xl focus:outline-none"
                >
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-slate-400 font-medium">{emptyText}</div>
                    ) : (
                        options.map((option) => (
                            <ListboxOption
                                key={`${option.value || 'empty'}-${option.label}`}
                                value={option.value}
                                disabled={option.disabled}
                                className="group relative cursor-pointer select-none rounded-lg py-2 pl-3 pr-8 text-xs font-bold text-slate-800 transition data-[disabled]:cursor-not-allowed data-[disabled]:text-slate-300 data-[focus]:bg-slate-900 data-[focus]:text-white"
                            >
                                <span className="block truncate">{option.label}</span>
                                <span className="absolute inset-y-0 right-0 hidden items-center pr-2.5 text-emerald-600 group-data-[focus]:text-white group-data-[selected]:flex">
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

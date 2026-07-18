import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

interface SelectOption {
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
    disabled?: boolean;
    className?: string;
}

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

export default function Select({ id, value, onChange, options, placeholder = 'Select...', disabled = false, className = '' }: Props): JSX.Element {
    const selected = options.find((option) => option.value === value);

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className={`relative ${className}`}>
                <ListboxButton
                    id={id}
                    className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                >
                    <span className={`block truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon />
                    </span>
                </ListboxButton>

                <ListboxOptions
                    transition
                    anchor="bottom start"
                    className="z-50 mt-1 max-h-60 w-[var(--button-width)] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 transition duration-100 ease-in focus:outline-none data-[closed]:opacity-0 data-[leave]:duration-75 sm:text-sm"
                >
                    {options.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">No options available</div>
                    )}
                    {options.map((option) => (
                        <ListboxOption
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                            className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[disabled]:cursor-not-allowed data-[disabled]:text-gray-400"
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

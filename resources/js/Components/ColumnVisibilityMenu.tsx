import { useEffect, useRef, useState } from 'react';

export type ColumnDef<T extends string = string> = {
    key: T;
    label: string;
    required?: boolean;
    defaultVisible?: boolean;
};

type Props<T extends string> = {
    columns: Array<ColumnDef<T>>;
    visible: Record<T, boolean>;
    onChange: (next: Record<T, boolean>) => void;
    label: string;
    requiredHint?: string;
    /** Show only the columns icon (label stays as aria-label / title). */
    iconOnly?: boolean;
};

/**
 * Dropdown to show/hide table columns. Required columns stay checked and disabled.
 */
export default function ColumnVisibilityMenu<T extends string>({
    columns,
    visible,
    onChange,
    label,
    requiredHint,
    iconOnly = false,
}: Props<T>): JSX.Element {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent): void => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);

        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open]);

    const toggle = (key: T): void => {
        const column = columns.find((item) => item.key === key);
        if (!column || column.required) {
            return;
        }

        onChange({
            ...visible,
            [key]: !visible[key],
        });
    };

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={
                    iconOnly
                        ? 'inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800'
                        : 'inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800'
                }
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={label}
                title={label}
            >
                <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
                    />
                </svg>
                {!iconOnly && (
                    <>
                        {label}
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-200/80 bg-white py-2 shadow-xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900">
                    {requiredHint && <p className="px-3.5 pb-2 text-xs text-slate-500 dark:text-slate-400">{requiredHint}</p>}
                    <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {columns.map((column) => {
                            const checked = Boolean(visible[column.key]);
                            const locked = Boolean(column.required);

                            return (
                                <li key={column.key}>
                                    <label
                                        className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-xs font-semibold ${
                                            locked ? 'cursor-not-allowed text-slate-400 dark:text-slate-500' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-850'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
                                            checked={checked}
                                            disabled={locked}
                                            onChange={() => toggle(column.key)}
                                        />
                                        <span className="flex-1">{column.label}</span>
                                        {locked && (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                                (Wajib)
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function buildColumnVisibility<T extends string>(
    columns: Array<Pick<ColumnDef<T>, 'key' | 'required' | 'defaultVisible'>>,
    stored: Partial<Record<T, boolean>> | null,
): Record<T, boolean> {
    return columns.reduce(
        (visibility, column) => {
            if (column.required) {
                visibility[column.key] = true;
            } else if (typeof stored?.[column.key] === 'boolean') {
                visibility[column.key] = stored[column.key] as boolean;
            } else {
                visibility[column.key] = column.defaultVisible ?? true;
            }

            return visibility;
        },
        {} as Record<T, boolean>,
    );
}

import { ReactNode } from 'react';

interface Props {
    title: ReactNode;
    actions?: ReactNode;
    description?: ReactNode;
    subtitle?: ReactNode;
    className?: string;
}

/**
 * Fixed-height module page header so screens do not jump when some
 * pages omit action buttons.
 */
export default function PageHeader({ title, actions, description, subtitle, className = '' }: Props): JSX.Element {
    const desc = description ?? subtitle;
    return (
        <div className={`flex min-h-10 items-center justify-between gap-4 ${className}`.trim()}>
            <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold leading-tight text-gray-800">{title}</h2>
                {desc ? <div className="mt-1 text-sm text-gray-500">{desc}</div> : null}
            </div>
            <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        </div>
    );
}

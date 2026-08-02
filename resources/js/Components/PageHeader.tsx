import { ReactNode } from 'react';

interface Props {
    title: ReactNode;
    actions?: ReactNode;
    description?: ReactNode;
    className?: string;
}

/**
 * Fixed-height module page header so screens do not jump when some
 * pages omit action buttons.
 */
export default function PageHeader({ title, actions, description, className = '' }: Props): JSX.Element {
    return (
        <div className={`flex min-h-10 items-center justify-between gap-4 ${className}`.trim()}>
            <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold leading-tight text-gray-800">{title}</h2>
                {description ? <div className="mt-1 text-sm text-gray-500">{description}</div> : null}
            </div>
            <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        </div>
    );
}

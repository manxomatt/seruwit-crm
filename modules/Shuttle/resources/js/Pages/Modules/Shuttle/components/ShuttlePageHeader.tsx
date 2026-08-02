import { ReactNode } from 'react';

interface Props {
    title: string;
    actions?: ReactNode;
    description?: ReactNode;
}

/**
 * Fixed-height page header so Shuttle screens do not jump when some
 * pages omit action buttons.
 */
export default function ShuttlePageHeader({ title, actions, description }: Props): JSX.Element {
    return (
        <div className="flex min-h-10 items-center justify-between gap-4">
            <div className="min-w-0">
                <h2 className="text-xl font-semibold leading-tight text-gray-800">{title}</h2>
                {description ? <div className="mt-1 text-sm text-gray-500">{description}</div> : null}
            </div>
            <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
        </div>
    );
}

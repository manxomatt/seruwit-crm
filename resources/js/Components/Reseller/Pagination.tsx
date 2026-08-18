import { Link } from '@inertiajs/react';

interface Props {
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

/**
 * Laravel's paginator links, rendered as-is. Labels arrive HTML-escaped
 * ("&laquo; Previous"), so they are decoded rather than dangerously injected.
 */
export default function Pagination({ links }: Props): JSX.Element | null {
    if (links.length <= 3) {
        return null;
    }

    const decode = (label: string): string =>
        label.replace('&laquo;', '«').replace('&raquo;', '»').replace(/&[a-z]+;/g, ' ').trim();

    return (
        <div className="flex flex-wrap items-center justify-center gap-1">
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={`rounded-lg px-3 py-1.5 text-sm transition ${
                            link.active
                                ? 'bg-indigo-600 font-semibold text-white'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                    >
                        {decode(link.label)}
                    </Link>
                ) : (
                    <span key={index} className="rounded-lg px-3 py-1.5 text-sm text-slate-300 dark:text-slate-600">
                        {decode(link.label)}
                    </span>
                ),
            )}
        </div>
    );
}

import { router } from '@inertiajs/react';
import { useTrans } from '@/hooks/useTrans';

export interface PaginatedMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

export default function ShuttlePagination({ meta }: { meta: PaginatedMeta }) {
    const { t } = useTrans();

    if (meta.last_page <= 1 || meta.total === 0) {
        return null;
    }

    const from = (meta.current_page - 1) * meta.per_page + 1;
    const to = Math.min(meta.current_page * meta.per_page, meta.total);

    return (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
                {t('common.showing_results', { from, to, total: meta.total })}
            </p>
            <div className="flex flex-wrap gap-1">
                {meta.links.map((link, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => link.url && router.get(link.url)}
                        disabled={!link.url}
                        className={`rounded px-3 py-1 text-sm ${
                            link.active
                                ? 'bg-indigo-600 text-white'
                                : link.url
                                  ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

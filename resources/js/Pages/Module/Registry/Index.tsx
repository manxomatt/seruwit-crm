import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const PER_PAGE = 15;

interface ModuleRow {
    key: string;
    label: string;
    description: string;
    requires: string[];
    is_enabled: boolean;
}

interface Props {
    modules: ModuleRow[];
}

const SearchIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
);

export default function Index({ modules }: Props): JSX.Element {
    const { t } = useTrans();
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [processingKey, setProcessingKey] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const sorted = useMemo(
        () => [...modules].sort((a, b) => a.label.localeCompare(b.label)),
        [modules],
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return sorted;
        }
        return sorted.filter(
            (m) =>
                m.label.toLowerCase().includes(q) ||
                m.key.toLowerCase().includes(q) ||
                m.description.toLowerCase().includes(q),
        );
    }, [sorted, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * PER_PAGE;
    const paginated = filtered.slice(from, from + PER_PAGE);

    const handleSearch = (value: string): void => {
        setSearch(value);
        setPage(1);
    };

    const toggle = (module: ModuleRow): void => {
        setProcessingKey(module.key);
        router.patch(route('module.registry.toggle-status', module.key), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingKey(null),
        });
    };

    const showingLabel = t('platform.registry.showing')
        .replace(':from', String(filtered.length === 0 ? 0 : from + 1))
        .replace(':to', String(Math.min(from + PER_PAGE, filtered.length)))
        .replace(':total', String(filtered.length));

    return (
        <DynamicLayout header={<PageHeader title={t('platform.registry.title')} />}>
            <Head title={t('platform.registry.title')} />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 ring-1 ring-green-200">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                        {flash.error}
                    </div>
                )}

                <p className="max-w-2xl text-sm text-gray-600">{t('platform.registry.description')}</p>

                <div className="flex items-center gap-3">
                    <div className="relative max-w-xs flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <SearchIcon />
                        </span>
                        <TextInput
                            type="search"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={t('platform.registry.search_placeholder')}
                            className="w-full pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    {paginated.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {paginated.map((module) => (
                                <li key={module.key} className="flex flex-wrap items-start gap-4 p-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-medium text-gray-900">{module.label}</h3>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                                                {module.key}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    module.is_enabled
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {module.is_enabled
                                                    ? t('platform.registry.status.active')
                                                    : t('platform.registry.status.disabled')}
                                            </span>
                                        </div>

                                        {module.description && (
                                            <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                                        )}

                                        {module.requires.length > 0 && (
                                            <p className="mt-2 text-xs text-gray-400">
                                                {t('platform.registry.requires_prefix')} {module.requires.join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="shrink-0">
                                        <SecondaryButton
                                            disabled={processingKey === module.key}
                                            onClick={() => toggle(module)}
                                            className={module.is_enabled ? '!text-red-700' : '!text-green-700'}
                                        >
                                            {processingKey === module.key
                                                ? t('platform.registry.actions.processing')
                                                : module.is_enabled
                                                  ? t('platform.registry.actions.disable')
                                                  : t('platform.registry.actions.enable')}
                                        </SecondaryButton>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-6 text-sm text-gray-400">{t('platform.registry.empty_search')}</p>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{showingLabel}</p>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                                >
                                    <ChevronIcon direction="left" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm ${
                                            p === safePage
                                                ? 'border-indigo-500 bg-indigo-50 font-medium text-indigo-700'
                                                : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                                >
                                    <ChevronIcon direction="right" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}

import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchResult {
    id: number;
    title: string;
    subtitle: string;
    type: string;
    icon: string;
    url: string;
    thumbnail?: string | null;
}

interface SearchResponse {
    results: SearchResult[];
    query: string;
}

const SearchIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const UserIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const PostIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
);

const PageIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const MediaIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const CarouselIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
);

const RoleIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
);

const SettingIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const getIcon = (iconType: string) => {
    switch (iconType) {
        case 'user':
            return <UserIcon />;
        case 'post':
            return <PostIcon />;
        case 'page':
            return <PageIcon />;
        case 'media':
            return <MediaIcon />;
        case 'carousel':
            return <CarouselIcon />;
        case 'role':
            return <RoleIcon />;
        case 'setting':
            return <SettingIcon />;
        default:
            return <SearchIcon />;
    }
};

const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        user: 'Users',
        post: 'Posts',
        page: 'Pages',
        media: 'Media',
        carousel: 'Carousels',
        role: 'Roles',
        setting: 'Settings',
    };
    return labels[type] || type;
};

const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
        user: 'bg-blue-100 text-blue-800',
        post: 'bg-green-100 text-green-800',
        page: 'bg-purple-100 text-purple-800',
        media: 'bg-yellow-100 text-yellow-800',
        carousel: 'bg-pink-100 text-pink-800',
        role: 'bg-indigo-100 text-indigo-800',
        setting: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
};

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/admin/search?q=${encodeURIComponent(query)}`);
                const data: SearchResponse = await response.json();
                setResults(data.results);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = useCallback((result: SearchResult | null) => {
        if (result) {
            setQuery('');
            setResults([]);
            router.visit(result.url);
        }
    }, []);

    const handleBlur = useCallback(() => {
        // Delay to allow click on options
        setTimeout(() => {
            setIsFocused(false);
        }, 200);
    }, []);

    // Group results by type
    const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
        if (!acc[result.type]) {
            acc[result.type] = [];
        }
        acc[result.type].push(result);
        return acc;
    }, {});

    const showDropdown = isFocused && (query.length >= 2 || results.length > 0);

    return (
        <div className="relative flex flex-1">
            <Combobox<SearchResult | null>
                onChange={handleSelect}
                value={null}
            >
                <div className="relative flex flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        {isLoading ? (
                            <svg className="h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <SearchIcon />
                        )}
                    </div>
                    <ComboboxInput
                        ref={inputRef}
                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-16 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        placeholder="Search..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleBlur}
                        autoComplete="off"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <kbd className="hidden rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500 sm:inline-block">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {showDropdown && (
                    <ComboboxOptions
                        static
                        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                    >
                        {results.length === 0 && query.length >= 2 && !isLoading && (
                            <div className="px-4 py-8 text-center">
                                <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-500">No results found for "{query}"</p>
                            </div>
                        )}

                        {Object.entries(groupedResults).map(([type, items]) => (
                            <div key={type} className="border-b border-gray-100 last:border-b-0">
                                <h3 className="bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    {getTypeLabel(type)}
                                </h3>
                                <ul>
                                    {items.map((result) => (
                                        <ComboboxOption
                                            key={`${result.type}-${result.id}`}
                                            value={result}
                                            className="group flex cursor-pointer items-center gap-x-3 px-3 py-2 data-[focus]:bg-indigo-600"
                                        >
                                            {result.thumbnail ? (
                                                <img
                                                    src={result.thumbnail}
                                                    alt=""
                                                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                                                />
                                            ) : (
                                                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded ${getTypeColor(result.type)} group-data-[focus]:bg-indigo-500 group-data-[focus]:text-white`}>
                                                    {getIcon(result.icon)}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900 group-data-[focus]:text-white">
                                                    {result.title}
                                                </p>
                                                <p className="truncate text-xs text-gray-500 group-data-[focus]:text-indigo-200">
                                                    {result.subtitle}
                                                </p>
                                            </div>
                                        </ComboboxOption>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {results.length > 0 && (
                            <div className="flex items-center gap-x-3 border-t border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                                <span className="flex items-center gap-x-1">
                                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-medium">↑↓</kbd>
                                    navigate
                                </span>
                                <span className="flex items-center gap-x-1">
                                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-medium">↵</kbd>
                                    select
                                </span>
                                <span className="flex items-center gap-x-1">
                                    <kbd className="rounded bg-gray-200 px-1 py-0.5 font-medium">esc</kbd>
                                    close
                                </span>
                            </div>
                        )}
                    </ComboboxOptions>
                )}
            </Combobox>
        </div>
    );
}

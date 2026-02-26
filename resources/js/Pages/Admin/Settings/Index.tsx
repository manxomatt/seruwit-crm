import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useState, FormEventHandler } from 'react';

interface Setting {
    id: number;
    key: string;
    group: string;
    value: string | null;
    type: string;
    label: string;
    description: string | null;
    is_public: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

interface PaginatedSettings {
    data: Setting[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Filters {
    search: string | null;
    group: string | null;
}

interface Props {
    settings: PaginatedSettings;
    groups: string[];
    filters: Filters;
}

export default function Index({ settings, groups, filters }: Props): JSX.Element {
    const [search, setSearch] = useState(filters.search || '');
    const [group, setGroup] = useState(filters.group || '');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(route('admin.settings.index'), {
            search: search || undefined,
            group: group || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setGroup('');
        router.get(route('admin.settings.index'));
    };

    const deleteSetting = (setting: Setting) => {
        if (confirm(`Are you sure you want to delete "${setting.label}"?`)) {
            router.delete(route('admin.settings.destroy', setting.id));
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            text: 'bg-blue-100 text-blue-800',
            textarea: 'bg-purple-100 text-purple-800',
            boolean: 'bg-green-100 text-green-800',
            number: 'bg-yellow-100 text-yellow-800',
            email: 'bg-pink-100 text-pink-800',
            url: 'bg-indigo-100 text-indigo-800',
            select: 'bg-orange-100 text-orange-800',
            json: 'bg-gray-100 text-gray-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const truncateValue = (value: string | null, maxLength: number = 50) => {
        if (!value) {
            return <span className="text-gray-400 italic">Empty</span>;
        }
        if (value.length <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength) + '...';
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Settings
                    </h2>
                    <Link href={route('admin.settings.create')}>
                        <PrimaryButton>Add Setting</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Settings" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    {/* Filters */}
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <TextInput
                                type="text"
                                placeholder="Search settings..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <select
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">All Groups</option>
                            {groups.map((g) => (
                                <option key={g} value={g}>
                                    {g.charAt(0).toUpperCase() + g.slice(1)}
                                </option>
                            ))}
                        </select>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                        {(filters.search || filters.group) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Clear filters
                            </button>
                        )}
                    </form>

                    {settings.data.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No settings found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by creating a new setting.
                            </p>
                            <div className="mt-6">
                                <Link href={route('admin.settings.create')}>
                                    <PrimaryButton>Add Setting</PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Settings Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Key / Label
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Visibility
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {settings.data.map((setting) => (
                                            <tr key={setting.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {setting.label}
                                                    </div>
                                                    <div className="text-sm text-gray-500 font-mono">
                                                        {setting.key}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900 max-w-xs">
                                                        {setting.type === 'boolean' ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                setting.value === '1' || setting.value === 'true'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {setting.value === '1' || setting.value === 'true' ? 'Yes' : 'No'}
                                                            </span>
                                                        ) : (
                                                            truncateValue(setting.value)
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {setting.group}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(setting.type)}`}>
                                                        {setting.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {setting.is_public ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Public
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            Private
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('admin.settings.show', setting.id)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="View"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        <Link
                                                            href={route('admin.settings.edit', setting.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => deleteSetting(setting)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {settings.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(settings.current_page - 1) * settings.per_page + 1} to{' '}
                                        {Math.min(settings.current_page * settings.per_page, settings.total)} of{' '}
                                        {settings.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {settings.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50 border'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

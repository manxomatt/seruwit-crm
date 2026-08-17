import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface ComponentItem {
    id: number;
    key: string;
    label: string;
    category: string;
    content: string;
    media?: string;
    attributes?: Record<string, unknown>;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    components: ComponentItem[];
    categories: string[];
    can: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

export default function Index({ components, categories, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [componentToDelete, setComponentToDelete] = useState<ComponentItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Stats
    const stats = useMemo(() => {
        const total = components.length;
        const active = components.filter((c) => c.is_active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [components]);

    // Filtered components
    const filteredComponents = useMemo(() => {
        return components.filter((comp) => {
            const matchesSearch =
                comp.label.toLowerCase().includes(search.toLowerCase()) ||
                comp.key.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' ? true : comp.category === selectedCategory;

            const matchesStatus =
                statusFilter === 'all'
                    ? true
                    : statusFilter === 'active'
                    ? comp.is_active
                    : !comp.is_active;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [components, search, selectedCategory, statusFilter]);

    const toggleActive = (comp: ComponentItem) => {
        router.patch(prefixedRoute('pages.components.toggle-active', comp.id), {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!componentToDelete) return;

        setDeleting(true);
        router.delete(prefixedRoute('pages.components.destroy', componentToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setComponentToDelete(null);
            },
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Page Components"
                    subtitle="Manage dynamic section templates for GrapesJS Page Builder"
                    actions={
                        <div className="flex items-center gap-3">
                            <Link href={prefixedRoute('pages.index')}>
                                <SecondaryButton className="!rounded-xl text-xs shadow-sm">
                                    ⬅️ Back to Pages
                                </SecondaryButton>
                            </Link>
                            {can.create && (
                                <Link href={prefixedRoute('pages.components.create')}>
                                    <PrimaryButton className="!rounded-xl text-xs shadow-sm">
                                        ➕ Add Component
                                    </PrimaryButton>
                                </Link>
                            )}
                        </div>
                    }
                />
            }
        >
            <Head title="Page Components" />

            <div className="space-y-6">
                {/* Stats Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                                🧩
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Components</p>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                                ✅
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Components</p>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-lg font-bold">
                                ⏸️
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disabled / Draft</p>
                                <p className="text-xl font-extrabold text-slate-500 dark:text-slate-400">{stats.inactive}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                    <div className="relative flex-1">
                        <TextInput
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search components by label or key..."
                            className="w-full pl-10 text-xs !rounded-2xl border-slate-200 dark:border-slate-800"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex rounded-2xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800/50">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                                    statusFilter === 'all'
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('active')}
                                className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                                    statusFilter === 'active'
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('inactive')}
                                className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                                    statusFilter === 'inactive'
                                        ? 'bg-slate-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>
                </div>

                {/* Components Grid */}
                {filteredComponents.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-3xl">
                            📦
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">No components found</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Try adjusting your search query or add a new component.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredComponents.map((comp) => (
                            <div
                                key={comp.id}
                                className={`group flex flex-col justify-between rounded-3xl border p-5 transition-all shadow-sm ${
                                    comp.is_active
                                        ? 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md'
                                        : 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">
                                                📁 {comp.category || 'Sections'}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {comp.label}
                                            </h3>
                                            <p className="text-[11px] font-mono font-medium text-slate-400 mt-0.5">
                                                {comp.key}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => toggleActive(comp)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                comp.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}
                                            title={comp.is_active ? 'Click to disable' : 'Click to enable'}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    comp.is_active ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Snippet preview */}
                                    <div className="rounded-2xl bg-slate-950 p-3 my-3 text-[10px] font-mono text-slate-300 overflow-hidden max-h-24 leading-relaxed opacity-90">
                                        <pre className="whitespace-pre-wrap break-all">{comp.content.slice(0, 140)}...</pre>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-2">
                                    <span className="text-[10px] font-semibold text-slate-400">
                                        Order: <strong className="text-slate-700 dark:text-slate-300">{comp.sort_order}</strong>
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {can.update && (
                                            <Link href={prefixedRoute('pages.components.edit', comp.id)}>
                                                <button
                                                    type="button"
                                                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition"
                                                >
                                                    ✏️ Edit
                                                </button>
                                            </Link>
                                        )}

                                        {can.delete && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setComponentToDelete(comp);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="rounded-xl bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                show={showDeleteModal}
                title="Delete Page Component"
                message={`Are you sure you want to delete "${componentToDelete?.label}" (${componentToDelete?.key})? This component will no longer appear in the GrapesJS Editor block manager.`}
                confirmButtonText="Delete Component"
                onConfirm={handleDelete}
                onClose={() => {
                    setShowDeleteModal(false);
                    setComponentToDelete(null);
                }}
                processing={deleting}
            />
        </DynamicLayout>
    );
}

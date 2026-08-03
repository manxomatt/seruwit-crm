import DynamicLayout from '@/Layouts/DynamicLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import MaintenanceNav from '../../../../MaintenanceNav';
import { MaintenanceCategory } from '../../../../maintenanceUtils';
import PageHeader from '@/Components/PageHeader';

interface CategoryWithCount extends MaintenanceCategory {
    work_orders_count: number;
}

interface PaginatedCategories {
    data: CategoryWithCount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    categories: PaginatedCategories;
}

const COLOR_PRESETS = [
    '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B',
    '#84CC16', '#A78BFA',
];

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default function Index({ categories }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        key: '',
        name: '',
        description: '',
        color: '#6B7280',
        sort_order: '0',
    });

    const openCreate = () => {
        setEditingCategory(null);
        reset();
        setShowModal(true);
    };

    const openEdit = (cat: CategoryWithCount) => {
        setEditingCategory(cat);
        setData({
            key: cat.key,
            name: cat.name,
            description: cat.description ?? '',
            color: cat.color,
            sort_order: String(cat.sort_order),
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            patch(prefixedRoute('maintenance.categories.update', editingCategory.id), {
                onSuccess: closeModal,
            });
        } else {
            post(prefixedRoute('maintenance.categories.store'), {
                onSuccess: closeModal,
            });
        }
    };

    const confirmDelete = () => {
        if (!deletingCategory) return;
        setDeleting(true);
        router.delete(prefixedRoute('maintenance.categories.destroy', deletingCategory.id), {
            onSuccess: () => setDeletingCategory(null),
            onFinish: () => setDeleting(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('maintenance.title')}
                    actions={<PrimaryButton onClick={openCreate}>{t('maintenance.categories.new')}</PrimaryButton>}
                />
            }
        >
            <Head title={t('maintenance.categories.head')} />
            <MaintenanceNav />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">{t('maintenance.categories.section_title')}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('maintenance.categories.section_hint')}
                    </p>
                </div>

                <div className="divide-y divide-gray-100">
                    {categories.data.map((cat) => (
                        <div key={cat.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                            <div
                                className="h-4 w-4 flex-shrink-0 rounded-full border border-white shadow"
                                style={{ backgroundColor: cat.color }}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{cat.name}</span>
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">{cat.key}</span>
                                </div>
                                {cat.description && (
                                    <p className="mt-0.5 truncate text-sm text-gray-500">{cat.description}</p>
                                )}
                            </div>
                            <div className="flex-shrink-0 text-center">
                                <p className="text-lg font-bold text-gray-900">{cat.work_orders_count}</p>
                                <p className="text-xs text-gray-400">{t('maintenance.categories.work_orders')}</p>
                            </div>
                            <div className="flex flex-shrink-0 items-center justify-end gap-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                                <button
                                    type="button"
                                    onClick={() => openEdit(cat)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                    title={t('common.edit')}
                                >
                                    <PencilIcon />
                                </button>
                                {/*
                                    Icon-only leaves the tooltip carrying the whole explanation, so
                                    the disabled reason has to stay in it rather than fall back to a
                                    bare delete label.
                                */}
                                <button
                                    type="button"
                                    onClick={() => setDeletingCategory(cat)}
                                    className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300"
                                    disabled={cat.work_orders_count > 0}
                                    title={cat.work_orders_count > 0 ? t('maintenance.categories.cannot_delete') : t('common.delete')}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                    {categories.data.length === 0 && (
                        <div className="px-6 py-10 text-center text-sm text-gray-500">
                            {t('maintenance.categories.empty', undefined, 'No categories yet.')}
                        </div>
                    )}
                </div>

                {categories.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
                        <p className="text-sm text-gray-700">
                            {t('common.showing_results', {
                                from: (categories.current_page - 1) * categories.per_page + 1,
                                to: Math.min(categories.current_page * categories.per_page, categories.total),
                                total: categories.total,
                            })}
                        </p>
                        <div className="flex gap-1">
                            {categories.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    className={`rounded px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                              ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                              : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        {editingCategory ? t('maintenance.categories.edit_title') : t('maintenance.categories.create_title')}
                    </h3>

                    <div className="space-y-4">
                        {!editingCategory && (
                            <div>
                                <InputLabel htmlFor="key" value={t('maintenance.categories.key')} />
                                <TextInput
                                    id="key"
                                    className="mt-1 block w-full"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value)}
                                    placeholder={t('maintenance.categories.key_placeholder')}
                                    pattern="[a-z0-9_]+"
                                    required
                                />
                                <InputError message={errors.key} className="mt-2" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="name" value={t('maintenance.categories.name')} />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="description" value={t('maintenance.categories.description')} />
                            <textarea
                                id="description"
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                            <InputError message={errors.description} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value={t('maintenance.categories.color')} />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setData('color', color)}
                                        className={`h-8 w-8 rounded-full border-2 transition-transform ${data.color === color ? 'scale-125 border-gray-900' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <InputError message={errors.color} className="mt-2" />
                        </div>

                        <div className="w-32">
                            <InputLabel htmlFor="sort_order" value={t('maintenance.categories.sort_order')} />
                            <TextInput
                                id="sort_order"
                                type="number"
                                className="mt-1 block w-full"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                            />
                            <InputError message={errors.sort_order} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? t('maintenance.actions.saving') : editingCategory ? t('common.save') : t('maintenance.actions.add')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingCategory}
                title={t('maintenance.categories.delete_title')}
                message={t('maintenance.categories.delete_confirm', { name: deletingCategory?.name ?? '' })}
                processing={deleting}
                onConfirm={confirmDelete}
                onClose={() => setDeletingCategory(null)}
            />
        </DynamicLayout>
    );
}

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
import MaintenanceNav from '../../../../MaintenanceNav';
import { MaintenanceCategory } from '../../../../maintenanceUtils';

interface CategoryWithCount extends MaintenanceCategory {
    work_orders_count: number;
}

interface Props {
    categories: CategoryWithCount[];
}

const COLOR_PRESETS = [
    '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#64748B',
    '#84CC16', '#A78BFA',
];

export default function Index({ categories }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance</h2>
                    <PrimaryButton onClick={openCreate}>+ Kategori Baru</PrimaryButton>
                </div>
            }
        >
            <Head title="Kategori Maintenance" />
            <MaintenanceNav />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Kategori Pekerjaan</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Klasifikasi jenis pekerjaan maintenance. Warna digunakan untuk identifikasi visual di seluruh modul.
                    </p>
                </div>

                <div className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-4 px-6 py-4">
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
                                <p className="text-xs text-gray-400">Work Orders</p>
                            </div>
                            <div className="flex-shrink-0 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => openEdit(cat)}
                                    className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingCategory(cat)}
                                    className="rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                    disabled={cat.work_orders_count > 0}
                                    title={cat.work_orders_count > 0 ? 'Tidak dapat dihapus: masih digunakan' : undefined}
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h3>

                    <div className="space-y-4">
                        {!editingCategory && (
                            <div>
                                <InputLabel htmlFor="key" value="Key (unik, huruf kecil & underscore)" />
                                <TextInput
                                    id="key"
                                    className="mt-1 block w-full"
                                    value={data.key}
                                    onChange={(e) => setData('key', e.target.value)}
                                    placeholder="contoh: oil_change"
                                    pattern="[a-z0-9_]+"
                                    required
                                />
                                <InputError message={errors.key} className="mt-2" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="name" value="Nama Kategori" />
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
                            <InputLabel htmlFor="description" value="Deskripsi" />
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
                            <InputLabel value="Warna" />
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
                            <InputLabel htmlFor="sort_order" value="Urutan" />
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
                        <SecondaryButton type="button" onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : editingCategory ? 'Simpan' : 'Tambah'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={!!deletingCategory}
                title="Hapus Kategori"
                description={`Yakin ingin menghapus kategori "${deletingCategory?.name}"?`}
                processing={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeletingCategory(null)}
            />
        </DynamicLayout>
    );
}

import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PlanRow {
    id: number;
    key: string;
    name: string;
    description: string | null;
    modules: string[];
    sort_order: number;
    is_default: boolean;
    tenants: number;
}

interface AvailableModule {
    key: string;
    label: string;
    description: string;
    is_enabled: boolean;
}

interface Props {
    plans: PlanRow[];
    availableModules: AvailableModule[];
}

const inputClass =
    'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';

export default function Index({ plans, availableModules }: Props): JSX.Element {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [editing, setEditing] = useState<PlanRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<PlanRow | null>(null);

    const form = useForm({
        key: '',
        name: '',
        description: '',
        modules: [] as string[],
        sort_order: 0,
        is_default: false,
    });

    const deleteForm = useForm({});

    const openCreate = (): void => {
        form.setData({
            key: '',
            name: '',
            description: '',
            modules: [],
            sort_order: plans.length + 1,
            is_default: false,
        });
        form.clearErrors();
        setCreating(true);
    };

    const openEdit = (plan: PlanRow): void => {
        form.setData({
            key: plan.key,
            name: plan.name,
            description: plan.description ?? '',
            modules: plan.modules,
            sort_order: plan.sort_order,
            is_default: plan.is_default,
        });
        form.clearErrors();
        setEditing(plan);
    };

    const close = (): void => {
        setCreating(false);
        setEditing(null);
    };

    const toggleModule = (key: string): void => {
        form.setData(
            'modules',
            form.data.modules.includes(key)
                ? form.data.modules.filter((m) => m !== key)
                : [...form.data.modules, key],
        );
    };

    const submit = (e: React.FormEvent): void => {
        e.preventDefault();

        if (editing) {
            form.patch(route('module.plans.update', editing.id), {
                preserveScroll: true,
                onSuccess: close,
            });
            return;
        }

        form.post(route('module.plans.store'), { preserveScroll: true, onSuccess: close });
    };

    const destroy = (): void => {
        if (!deleting) return;

        deleteForm.delete(route('module.plans.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    };

    return (
        <DynamicLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Paket</h2>}>
            <Head title="Paket" />

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

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-2xl text-sm text-gray-600">
                        Paket menentukan modul apa yang boleh dipasang tenant. Mengubah paket berlaku untuk semua tenant
                        di dalamnya pada request berikutnya, dan tidak pernah menghapus data — mempersempit paket hanya
                        mengunci modulnya.
                    </p>
                    <PrimaryButton onClick={openCreate}>Tambah Paket</PrimaryButton>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
                    <ul className="divide-y divide-gray-100">
                        {plans.map((plan) => (
                            <li key={plan.id} className="flex flex-wrap items-start gap-4 p-6">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                                            {plan.key}
                                        </span>
                                        {plan.is_default && (
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    {plan.description && (
                                        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {plan.modules.length === 0 ? (
                                            <span className="text-xs text-gray-400">Tanpa modul tambahan</span>
                                        ) : (
                                            plan.modules.map((key) => {
                                                const module = availableModules.find((m) => m.key === key);
                                                const disabled = module?.is_enabled === false;
                                                return (
                                                    <span
                                                        key={key}
                                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                                                            disabled
                                                                ? 'bg-gray-50 text-gray-400 ring-gray-200 line-through'
                                                                : 'bg-sky-50 text-sky-700 ring-sky-200'
                                                        }`}
                                                        title={disabled ? 'Modul ini dinonaktifkan platform' : undefined}
                                                    >
                                                        {module?.label ?? key}
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>

                                    <p className="mt-2 text-xs text-gray-400">
                                        {plan.tenants} tenant di paket ini
                                        {plan.is_default && ' (termasuk yang belum punya paket sendiri)'}
                                    </p>
                                </div>

                                <div className="flex shrink-0 gap-2">
                                    <SecondaryButton onClick={() => openEdit(plan)}>Ubah</SecondaryButton>
                                    <SecondaryButton
                                        disabled={plan.tenants > 0 || plan.is_default}
                                        title={
                                            plan.is_default
                                                ? 'Paket default tidak bisa dihapus'
                                                : plan.tenants > 0
                                                  ? 'Masih dipakai tenant'
                                                  : undefined
                                        }
                                        onClick={() => setDeleting(plan)}
                                    >
                                        Hapus
                                    </SecondaryButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal show={creating || editing !== null} onClose={close} maxWidth="lg">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editing ? `Ubah paket ${editing.name}` : 'Paket baru'}
                    </h2>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Nama
                            <input
                                className={inputClass}
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                required
                            />
                            {form.errors.name && <p className="mt-1 text-xs text-red-500">{form.errors.name}</p>}
                        </label>

                        <label className="block text-sm font-medium text-gray-700">
                            Kunci
                            <input
                                className={`${inputClass} font-mono disabled:bg-gray-100 disabled:text-gray-500`}
                                value={form.data.key}
                                onChange={(e) => form.setData('key', e.target.value.toLowerCase())}
                                disabled={editing !== null}
                                placeholder="enterprise"
                                required
                            />
                            {form.errors.key && <p className="mt-1 text-xs text-red-500">{form.errors.key}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                {editing
                                    ? 'Kunci tidak bisa diubah — tenant menyimpannya sebagai acuan paketnya.'
                                    : 'Huruf kecil, angka, dan tanda hubung. Permanen setelah dibuat.'}
                            </p>
                        </label>

                        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                            Deskripsi
                            <input
                                className={inputClass}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                            {form.errors.description && (
                                <p className="mt-1 text-xs text-red-500">{form.errors.description}</p>
                            )}
                        </label>

                        <label className="block text-sm font-medium text-gray-700">
                            Urutan tampil
                            <input
                                type="number"
                                min={0}
                                className={inputClass}
                                value={form.data.sort_order}
                                onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                            />
                        </label>

                        <label className="flex items-start gap-2 pt-6 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={form.data.is_default}
                                onChange={(e) => form.setData('is_default', e.target.checked)}
                            />
                            <span>
                                Jadikan paket default
                                <span className="block text-xs text-gray-500">
                                    Dipakai tenant yang belum punya paket sendiri. Hanya satu paket bisa jadi default.
                                </span>
                            </span>
                        </label>
                    </div>

                    <fieldset className="mt-5">
                        <legend className="text-sm font-medium text-gray-700">Modul dalam paket ini</legend>
                        {availableModules.length === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">Belum ada modul opsional yang terdaftar.</p>
                        ) : (
                            <div className="mt-2 space-y-2">
                                {availableModules.map((module) => {
                                    const checked = form.data.modules.includes(module.key);
                                    // A disabled module already in the plan stays visible and
                                    // checked (frozen, not silently dropped on save); one not yet
                                    // in the plan simply cannot be added until re-enabled.
                                    const locked = !module.is_enabled;
                                    return (
                                        <label
                                            key={module.key}
                                            className={`flex items-start gap-3 rounded-lg border p-3 ${
                                                locked ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                                checked={checked}
                                                disabled={locked}
                                                onChange={() => toggleModule(module.key)}
                                            />
                                            <span className="text-sm">
                                                <span className="flex items-center gap-2">
                                                    <span className={`font-medium ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                        {module.label}
                                                    </span>
                                                    {locked && (
                                                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                                                            Dinonaktifkan
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="block text-xs text-gray-500">{module.description}</span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {form.errors.modules && <p className="mt-1 text-xs text-red-500">{form.errors.modules}</p>}
                    </fieldset>

                    {editing && editing.tenants > 0 && (
                        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                            {editing.tenants} tenant memakai paket ini. Mencabut modul akan mengunci aksesnya bagi mereka
                            — data mereka tetap utuh dan kembali jika modulnya dimasukkan lagi.
                        </p>
                    )}

                    <div className="mt-6 flex justify-end gap-2">
                        <SecondaryButton type="button" onClick={close}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>
                            {form.processing ? 'Menyimpan…' : 'Simpan'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={deleting !== null}
                title={`Hapus paket ${deleting?.name ?? ''}?`}
                message="Paket ini tidak dipakai tenant mana pun, jadi menghapusnya tidak berdampak pada workspace yang berjalan."
                confirmText="Hapus paket"
                processing={deleteForm.processing}
                onClose={() => setDeleting(null)}
                onConfirm={destroy}
            />
        </DynamicLayout>
    );
}

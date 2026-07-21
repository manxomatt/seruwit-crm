import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type ModuleTier = 'vertical' | 'foundation' | 'content';

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
    tier: ModuleTier;
    is_enabled: boolean;
}

interface Props {
    plans: PlanRow[];
    availableModules: AvailableModule[];
}

// Verticals are the headline products, so they lead; foundations enable them;
// content sits at the bottom. Each tier gets a plain-language heading.
const TIER_ORDER: ModuleTier[] = ['vertical', 'foundation', 'content'];

const TIER_META: Record<ModuleTier, { label: string; hint: string; accent: string }> = {
    vertical: {
        label: 'Fitur Bisnis',
        hint: 'Modul yang dijual sebagai fitur utama',
        accent: 'bg-indigo-500',
    },
    foundation: {
        label: 'Fondasi',
        hint: 'Data & layanan yang menopang fitur bisnis',
        accent: 'bg-sky-500',
    },
    content: {
        label: 'Konten & Situs',
        hint: 'Halaman publik dan CMS',
        accent: 'bg-emerald-500',
    },
};

const inputClass =
    'mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm';

export default function Index({ plans, availableModules }: Props): JSX.Element {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [editing, setEditing] = useState<PlanRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<PlanRow | null>(null);
    const [moduleSearch, setModuleSearch] = useState('');

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
        setModuleSearch('');
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
        setModuleSearch('');
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

    // Only modules that can actually be toggled participate in bulk actions —
    // a locked (platform-disabled) module is never added or removed here.
    const selectableKeys = useMemo(
        () => availableModules.filter((m) => m.is_enabled).map((m) => m.key),
        [availableModules],
    );

    const selectAll = (): void => {
        const merged = new Set([...form.data.modules, ...selectableKeys]);
        form.setData('modules', Array.from(merged));
    };

    const clearAll = (): void => {
        // Keep any locked-but-already-selected modules frozen in place.
        const locked = availableModules.filter((m) => !m.is_enabled).map((m) => m.key);
        form.setData(
            'modules',
            form.data.modules.filter((key) => locked.includes(key)),
        );
    };

    const query = moduleSearch.trim().toLowerCase();

    const groupedModules = useMemo(() => {
        const matches = availableModules.filter(
            (module) =>
                query === '' ||
                module.label.toLowerCase().includes(query) ||
                module.key.toLowerCase().includes(query) ||
                module.description.toLowerCase().includes(query),
        );

        return TIER_ORDER.map((tier) => ({
            tier,
            modules: matches.filter((module) => module.tier === tier),
        })).filter((group) => group.modules.length > 0);
    }, [availableModules, query]);

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

            <Modal show={creating || editing !== null} onClose={close} maxWidth="2xl">
                <form onSubmit={submit} className="flex max-h-[85vh] flex-col">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {editing ? `Ubah paket ${editing.name}` : 'Paket baru'}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div className="mt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Modul dalam paket ini</span>
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                                    {form.data.modules.length} dipilih
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <button
                                    type="button"
                                    onClick={selectAll}
                                    className="rounded-md px-2 py-1 font-medium text-indigo-600 hover:bg-indigo-50"
                                >
                                    Pilih semua
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="rounded-md px-2 py-1 font-medium text-gray-500 hover:bg-gray-100"
                                >
                                    Kosongkan
                                </button>
                            </div>
                        </div>

                        {availableModules.length === 0 ? (
                            <p className="mt-3 text-sm text-gray-500">Belum ada modul opsional yang terdaftar.</p>
                        ) : (
                            <>
                                <div className="relative mt-3">
                                    <svg
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                        placeholder="Cari modul…"
                                        className="block w-full rounded-lg border-gray-300 py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                {groupedModules.length === 0 ? (
                                    <p className="mt-4 text-center text-sm text-gray-400">
                                        Tidak ada modul yang cocok dengan “{moduleSearch}”.
                                    </p>
                                ) : (
                                    <div className="mt-4 space-y-5">
                                        {groupedModules.map(({ tier, modules }) => (
                                            <div key={tier}>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${TIER_META[tier].accent}`} />
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                        {TIER_META[tier].label}
                                                    </span>
                                                    <span className="text-xs text-gray-400">— {TIER_META[tier].hint}</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    {modules.map((module) => {
                                                        const checked = form.data.modules.includes(module.key);
                                                        // A disabled module already in the plan stays
                                                        // visible and checked (frozen, not silently
                                                        // dropped on save); one not yet in the plan
                                                        // simply cannot be added until re-enabled.
                                                        const locked = !module.is_enabled;
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={module.key}
                                                                onClick={() => !locked && toggleModule(module.key)}
                                                                disabled={locked}
                                                                aria-pressed={checked}
                                                                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                                                                    locked
                                                                        ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                                                                        : checked
                                                                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                                                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                                        checked && !locked
                                                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                            : 'border-gray-300 bg-white'
                                                                    }`}
                                                                >
                                                                    {checked && (
                                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <span className="min-w-0 text-sm">
                                                                    <span className="flex items-center gap-2">
                                                                        <span className={`font-medium ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                            {module.label}
                                                                        </span>
                                                                        {locked && (
                                                                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-red-200">
                                                                                Nonaktif
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className="mt-0.5 block text-xs text-gray-500">{module.description}</span>
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {form.errors.modules && <p className="mt-2 text-xs text-red-500">{form.errors.modules}</p>}
                    </div>

                    {editing && editing.tenants > 0 && (
                        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                            {editing.tenants} tenant memakai paket ini. Mencabut modul akan mengunci aksesnya bagi mereka
                            — data mereka tetap utuh dan kembali jika modulnya dimasukkan lagi.
                        </p>
                    )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
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

import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import MaintenanceNav from '../../../../MaintenanceNav';

interface Bay {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    sort_order: number;
    active_work_orders_count: number;
}

interface PaginatedBays {
    data: Bay[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    bays: PaginatedBays;
    can: { manage: boolean };
}

const PencilIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const GridIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const TableIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z" />
    </svg>
);

export default function Index({ bays, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Bay | null>(null);
    const [deleting, setDeleting] = useState<Bay | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        code: '',
        name: '',
        is_active: true as boolean,
        sort_order: '0',
    });

    const kpiStats = useMemo(() => {
        const data = bays.data;
        return {
            total: data.length,
            active: data.filter((b) => b.is_active).length,
            occupied: data.filter((b) => b.active_work_orders_count > 0).length,
            inactive: data.filter((b) => !b.is_active).length,
        };
    }, [bays.data]);

    const openCreate = (): void => {
        setEditing(null);
        reset();
        setData({ code: '', name: '', is_active: true, sort_order: '0' });
        setShowModal(true);
    };

    const openEdit = (bay: Bay): void => {
        setEditing(bay);
        setData({
            code: bay.code,
            name: bay.name,
            is_active: bay.is_active,
            sort_order: String(bay.sort_order),
        });
        setShowModal(true);
    };

    const closeModal = (): void => {
        setShowModal(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (editing) {
            patch(prefixedRoute('maintenance.bays.update', editing.id), { onSuccess: closeModal });
        } else {
            post(prefixedRoute('maintenance.bays.store'), { onSuccess: closeModal });
        }
    };

    const confirmDelete = (): void => {
        if (!deleting) return;
        setProcessingDelete(true);
        router.delete(prefixedRoute('maintenance.bays.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
            onFinish: () => setProcessingDelete(false),
        });
    };

    const kpiCards = [
        { label: 'Total Bay Servis', value: kpiStats.total.toString(), icon: '🏭', color: 'indigo' },
        { label: 'Aktif / Siap Pakai', value: kpiStats.active.toString(), icon: '✅', color: 'emerald' },
        { label: 'Sedang Terisi (Aktif)', value: kpiStats.occupied.toString(), icon: '🔧', color: 'sky' },
        { label: 'Non-Aktif', value: kpiStats.inactive.toString(), icon: '⛔', color: 'slate' },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Lokasi & Bay Servis Bengkel"
                    subtitle="Kelola lokasi stall/bay servis bengkel internal untuk alokasi pengerjaan Surat Perintah Kerja (SPK)."
                    actions={
                        can.manage ? (
                            <PrimaryButton onClick={openCreate} className="rounded-2xl text-xs font-black shadow-md">
                                Tambah Bay Baru
                            </PrimaryButton>
                        ) : undefined
                    }
                />
            }
        >
            <Head title="Bay Servis · Maintenance" />
            <MaintenanceNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 pb-10">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {kpiCards.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</p>
                                <span className="text-base">{kpi.icon}</span>
                            </div>
                            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900 dark:text-white">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Header & View Switcher */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Daftar Stall & Bay Bengkel</h3>
                            <p className="text-xs text-slate-400">Pengaturan bay tempat perbaikan dan servis unit kendaraan.</p>
                        </div>

                        {/* View Mode Switcher */}
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'grid' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                title="Tampilan Grid"
                            >
                                <GridIcon />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-xl transition ${viewMode === 'table' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                title="Tampilan Tabel"
                            >
                                <TableIcon />
                            </button>
                        </div>
                    </div>

                    {bays.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="text-4xl">🏭</span>
                            <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">Belum Ada Bay Servis</h3>
                            <p className="mt-1 text-xs text-slate-400">Tambahkan lokasi bay bengkel internal untuk mulai mengalokasikan SPK.</p>
                            {can.manage && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-indigo-700"
                                >
                                    Tambah Bay Pertama
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {bays.data.map((bay) => {
                                const isOccupied = bay.active_work_orders_count > 0;

                                return (
                                    <div
                                        key={bay.id}
                                        className={`group relative flex flex-col justify-between rounded-3xl border p-5 transition hover:shadow-md ${
                                            isOccupied
                                                ? 'border-sky-300 bg-sky-50/40 dark:border-sky-800 dark:bg-sky-950/20'
                                                : bay.is_active
                                                    ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                                    : 'border-slate-200/60 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-850'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="rounded-xl bg-slate-900 px-2.5 py-1 font-mono text-xs font-black text-white dark:bg-slate-200 dark:text-slate-900">
                                                    {bay.code}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black ${
                                                    bay.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${bay.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {bay.is_active ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </div>

                                            <h4 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{bay.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Urutan Tampilan: #{bay.sort_order}</p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                            <div>
                                                {isOccupied ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 dark:text-sky-300">
                                                        <span>🔧</span>
                                                        <span>{bay.active_work_orders_count} SPK Sedang Berjalan</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        Kosong / Standby
                                                    </span>
                                                )}
                                            </div>

                                            {can.manage && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(bay)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                        title="Edit Bay"
                                                    >
                                                        <PencilIcon />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleting(bay)}
                                                        disabled={bay.active_work_orders_count > 0}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-rose-950/50 dark:text-rose-400"
                                                        title={bay.active_work_orders_count > 0 ? 'Tidak dapat dihapus karena sedang digunakan SPK' : 'Hapus Bay'}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-850/80 text-[10px] font-black uppercase text-slate-400">
                                        <th className="px-6 py-3 text-left">Kode Bay</th>
                                        <th className="px-6 py-3 text-left">Nama Stall / Bay</th>
                                        <th className="px-6 py-3 text-left">Status</th>
                                        <th className="px-6 py-3 text-left">SPK Aktif saat ini</th>
                                        <th className="px-6 py-3 text-left">Urutan</th>
                                        <th className="w-24 px-6 py-3 text-right"><span className="sr-only">Aksi</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {bays.data.map((bay) => (
                                        <tr key={bay.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-850/50">
                                            <td className="whitespace-nowrap px-6 py-3.5 font-mono font-black text-slate-900 dark:text-white">{bay.code}</td>
                                            <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">{bay.name}</td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[10px] font-black ${
                                                    bay.is_active
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${bay.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {bay.is_active ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                                                {bay.active_work_orders_count > 0 ? (
                                                    <span className="text-sky-600 dark:text-sky-400">{bay.active_work_orders_count} SPK</span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 font-mono text-slate-400">#{bay.sort_order}</td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-right">
                                                {can.manage && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEdit(bay)}
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleting(bay)}
                                                            disabled={bay.active_work_orders_count > 0}
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-rose-950/50 dark:text-rose-400"
                                                            title={bay.active_work_orders_count > 0 ? 'Tidak dapat dihapus karena digunakan' : 'Hapus'}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal show={showModal} onClose={closeModal}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            {editing ? `Edit Bay: ${editing.code}` : 'Tambah Bay Bengkel Baru'}
                        </h2>
                        <p className="text-xs text-slate-400">Isi informasi kode unik dan nama stall bay pengerjaan.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="code" value="Kode Bay *" />
                            <TextInput
                                id="code"
                                className="mt-1.5 block w-full !rounded-2xl font-mono uppercase font-black shadow-2xs"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="BAY-01, STALL-A..."
                                required
                            />
                            <InputError message={errors.code} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Nama Bay / Stall *" />
                            <TextInput
                                id="name"
                                className="mt-1.5 block w-full !rounded-2xl font-bold shadow-2xs"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Bay Servis Ringan #1, Stall Hydrolic..."
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sort_order" value="Urutan Tampilan" />
                            <TextInput
                                id="sort_order"
                                type="number"
                                className="mt-1.5 block w-full !rounded-2xl font-mono shadow-2xs"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                            />
                            <InputError message={errors.sort_order} className="mt-1" />
                        </div>

                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer pt-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Bay Aktif & Siap Digunakan</span>
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={closeModal} className="rounded-2xl">
                            Batal
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="rounded-2xl">
                            {processing ? 'Menyimpan...' : editing ? '💾 Simpan Perubahan' : 'Tambah Bay'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <ConfirmDeleteDialog
                show={deleting !== null}
                title="Hapus Bay Servis"
                message={`Apakah Anda yakin ingin menghapus bay "${deleting?.name ?? ''}" (${deleting?.code ?? ''})?`}
                processing={processingDelete}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </DynamicLayout>
    );
}

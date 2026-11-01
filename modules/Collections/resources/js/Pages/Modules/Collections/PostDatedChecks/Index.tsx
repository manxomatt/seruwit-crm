import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface Partner {
    id: number;
    name: string;
}

interface InvoiceOption {
    id: number;
    invoice_number: string;
    partner_id: number;
    total: number;
    balance_due: number;
}

interface PdcRow {
    id: number;
    check_number: string;
    bank_name: string;
    partner_id: number;
    invoice_id?: number | null;
    amount: number;
    issue_date?: string | null;
    due_date: string;
    status: 'received' | 'deposited' | 'cleared' | 'bounced' | 'cancelled';
    bounced_reason?: string | null;
    partner?: Partner | null;
    invoice?: { id: number; invoice_number: string } | null;
    company_bank_account?: { id: number; name: string } | null;
}

interface PaginatedPdc {
    data: PdcRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface BankOption {
    id: number;
    name: string;
    bank_name?: string;
    account_number?: string;
}

interface Props {
    pdcs: PaginatedPdc;
    partners: Partner[];
    invoices: InvoiceOption[];
    companyBankAccounts: BankOption[];
    filters: { status?: string; partner_id?: number };
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

const statusBadge = (status: string) => {
    switch (status) {
        case 'cleared':
            return (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Cair (Cleared)
                </span>
            );
        case 'deposited':
            return (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    Dititipkan ke Bank
                </span>
            );
        case 'bounced':
            return (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    Ditolak (Bounced)
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Diterima (Received)
                </span>
            );
    }
};

export default function PostDatedChecksIndex({
    pdcs,
    partners,
    invoices,
    companyBankAccounts,
    filters,
}: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPdcForClear, setSelectedPdcForClear] = useState<PdcRow | null>(null);
    const [selectedPdcForBounce, setSelectedPdcForBounce] = useState<PdcRow | null>(null);
    const [pdcToDelete, setPdcToDelete] = useState<PdcRow | null>(null);

    const createForm = useForm({
        check_number: '',
        bank_name: 'Bank Mandiri',
        partner_id: partners[0]?.id || '',
        invoice_id: '',
        amount: 0,
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: '',
    });

    const clearForm = useForm({
        company_bank_account_id: companyBankAccounts[0]?.id || '',
    });

    const bounceForm = useForm({
        bounced_reason: 'Saldo tidak mencukupi / Rekening ditutup',
    });

    const deleteForm = useForm({});
    const depositForm = useForm({});

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(prefixedRoute('collections.pdc.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const handleDeposit = (pdc: PdcRow) => {
        depositForm.post(prefixedRoute('collections.pdc.deposit', pdc.id));
    };

    const handleClearSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPdcForClear) return;
        clearForm.post(prefixedRoute('collections.pdc.clear', selectedPdcForClear.id), {
            onSuccess: () => setSelectedPdcForClear(null),
        });
    };

    const handleBounceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPdcForBounce) return;
        bounceForm.post(prefixedRoute('collections.pdc.bounce', selectedPdcForBounce.id), {
            onSuccess: () => setSelectedPdcForBounce(null),
        });
    };

    const handleDelete = () => {
        if (!pdcToDelete) return;
        deleteForm.delete(prefixedRoute('collections.pdc.destroy', pdcToDelete.id), {
            onSuccess: () => setPdcToDelete(null),
        });
    };

    return (
        <DynamicLayout>
            <Head title="Manajemen Bilyet Giro / PDC" />

            <div className="space-y-6">
                <PageHeader
                    title="Bilyet Giro & Cek Mundur (Post-Dated Checks)"
                    subtitle="Pencatatan warkat giro pelanggan, tanggal jatuh tempo, titip kliring bank, dan otomasi pencairan ke kas/bank & piutang."
                    actions={
                        <div className="flex items-center gap-2">
                            <Link
                                href={prefixedRoute('collections.dashboard')}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Dashboard Penagihan
                            </Link>
                            <PrimaryButton onClick={() => setShowCreateModal(true)}>
                                + Terima Bilyet Giro Baru
                            </PrimaryButton>
                        </div>
                    }
                />

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                <tr>
                                    <th className="px-5 py-3.5">No. Bilyet Giro</th>
                                    <th className="px-5 py-3.5">Bank Penerbit</th>
                                    <th className="px-5 py-3.5">Pelanggan</th>
                                    <th className="px-5 py-3.5">Alokasi Invoice</th>
                                    <th className="px-5 py-3.5">Jatuh Tempo Giro</th>
                                    <th className="px-5 py-3.5 text-right">Nominal</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pdcs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            Belum ada data bilyet giro tercatat. Klik "+ Terima Bilyet Giro Baru" untuk mencatat warkat.
                                        </td>
                                    </tr>
                                ) : (
                                    pdcs.data.map((pdc) => (
                                        <tr
                                            key={pdc.id}
                                            className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                        >
                                            <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {pdc.check_number}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                                                {pdc.bank_name}
                                            </td>
                                            <td className="px-5 py-4 text-slate-800 dark:text-slate-200">
                                                {pdc.partner?.name || '-'}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-mono text-slate-500">
                                                {pdc.invoice?.invoice_number || 'Umum (Tanpa Invoice)'}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                {pdc.due_date}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {formatIdr(Number(pdc.amount))}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {statusBadge(pdc.status)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {pdc.status === 'received' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeposit(pdc)}
                                                            className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                                        >
                                                            Titip Bank
                                                        </button>
                                                    )}

                                                    {['received', 'deposited'].includes(pdc.status) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedPdcForClear(pdc)}
                                                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                                            >
                                                                ⚡ Cairkan
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedPdcForBounce(pdc)}
                                                                className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}

                                                    {pdc.status !== 'cleared' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPdcToDelete(pdc)}
                                                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
                                                            title="Hapus Giro"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Terima Giro Baru */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Catat Penerimaan Bilyet Giro / PDC Baru
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Masukkan rincian nomor seri giro, bank penerbit, tanggal jatuh tempo kliring, dan alokasi invoice.
                        </p>

                        <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nomor Seri Bilyet Giro / Cek
                                    </label>
                                    <TextInput
                                        type="text"
                                        placeholder="BG-BCA-981726"
                                        value={createForm.data.check_number}
                                        onChange={(e) =>
                                            createForm.setData('check_number', e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Bank Penerbit
                                    </label>
                                    <TextInput
                                        type="text"
                                        placeholder="BCA, Mandiri, BRI, BNI..."
                                        value={createForm.data.bank_name}
                                        onChange={(e) =>
                                            createForm.setData('bank_name', e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Pelanggan (Partner)
                                    </label>
                                    <select
                                        value={createForm.data.partner_id}
                                        onChange={(e) =>
                                            createForm.setData('partner_id', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                        required
                                    >
                                        {partners.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Alokasi Invoice (Opsional)
                                    </label>
                                    <select
                                        value={createForm.data.invoice_id}
                                        onChange={(e) =>
                                            createForm.setData('invoice_id', e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        <option value="">-- Tanpa Alokasi Tertentu --</option>
                                        {invoices.map((inv) => (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoice_number} ({formatIdr(Number(inv.balance_due || inv.total))})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Nominal Giro (Rp)
                                    </label>
                                    <TextInput
                                        type="number"
                                        value={createForm.data.amount}
                                        onChange={(e) =>
                                            createForm.setData('amount', Number(e.target.value))
                                        }
                                        className="mt-1 block w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Tanggal Jatuh Tempo Warkat
                                    </label>
                                    <TextInput
                                        type="date"
                                        value={createForm.data.due_date}
                                        onChange={(e) =>
                                            createForm.setData('due_date', e.target.value)
                                        }
                                        className="mt-1 block w-full"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={createForm.processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={createForm.processing}>
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Giro'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Cairkan Giro */}
            {selectedPdcForClear && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Pencairan Bilyet Giro / PDC
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Giro No. {selectedPdcForClear.check_number} ({formatIdr(Number(selectedPdcForClear.amount))}) telah kliring di rekening penampung.
                        </p>

                        <form onSubmit={handleClearSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Rekening Bank Penerima (Dana Masuk)
                                </label>
                                <select
                                    value={clearForm.data.company_bank_account_id}
                                    onChange={(e) =>
                                        clearForm.setData('company_bank_account_id', e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {companyBankAccounts.map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.bank_name || 'Bank'} - {acc.account_number || ''})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setSelectedPdcForClear(null)}
                                    disabled={clearForm.processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={clearForm.processing}>
                                    {clearForm.processing ? 'Memproses...' : 'Konfirmasi Cair (Clear)'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tolak Giro */}
            {selectedPdcForBounce && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                            Tolak Bilyet Giro (Bounced / Warkat Kosong)
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Giro No. {selectedPdcForBounce.check_number} ditolak oleh bank kliring. Tagihan invoice akan tetap terbuka sebagai tunggakan.
                        </p>

                        <form onSubmit={handleBounceSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Alasan Penolakan dari Bank
                                </label>
                                <TextInput
                                    type="text"
                                    value={bounceForm.data.bounced_reason}
                                    onChange={(e) =>
                                        bounceForm.setData('bounced_reason', e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setSelectedPdcForBounce(null)}
                                    disabled={bounceForm.processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <button
                                    type="submit"
                                    disabled={bounceForm.processing}
                                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500"
                                >
                                    {bounceForm.processing ? 'Menyimpan...' : 'Tandai Bounced'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteDialog
                show={Boolean(pdcToDelete)}
                onClose={() => setPdcToDelete(null)}
                onConfirm={handleDelete}
                processing={deleteForm.processing}
                message={`Hapus data bilyet giro ${pdcToDelete?.check_number}?`}
            />
        </DynamicLayout>
    );
}

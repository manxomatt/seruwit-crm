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
    phone?: string | null;
}

interface InvoiceRow {
    id: number;
    invoice_number: string;
    partner_id: number;
    total: number;
    balance_due: number;
    due_date: string;
    status: string;
    partner?: Partner | null;
}

interface PromiseRow {
    id: number;
    invoice_id: number;
    partner_id: number;
    promised_amount: number;
    promised_date: string;
    status: string;
    notes?: string | null;
    partner?: Partner | null;
    invoice?: { id: number; invoice_number: string } | null;
}

interface DunningRow {
    id: number;
    stage: string;
    channel: string;
    recipient: string;
    status: string;
    message_body: string;
    sent_at: string;
    partner?: Partner | null;
    invoice?: { id: number; invoice_number: string } | null;
}

interface Stats {
    total_overdue_amount: number;
    overdue_count: number;
    pending_promises_count: number;
    pending_pdc_count: number;
    pending_pdc_amount: number;
}

interface Props {
    overdueInvoices: InvoiceRow[];
    dueSoonInvoices: InvoiceRow[];
    promises: PromiseRow[];
    recentDunnings: DunningRow[];
    stats: Stats;
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export default function CollectionsDashboard({
    overdueInvoices,
    dueSoonInvoices,
    promises,
    recentDunnings,
    stats,
}: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
    const [showPromiseModal, setShowPromiseModal] = useState(false);

    const reminderForm = useForm({});
    const promiseForm = useForm({
        invoice_id: '',
        partner_id: '',
        promised_amount: 0,
        promised_date: '',
        notes: '',
    });

    const handleSendReminder = (invoice: InvoiceRow) => {
        reminderForm.post(prefixedRoute('collections.remind', invoice.id));
    };

    const openPromiseModal = (invoice: InvoiceRow) => {
        setSelectedInvoice(invoice);
        promiseForm.setData({
            invoice_id: String(invoice.id),
            partner_id: String(invoice.partner_id),
            promised_amount: Number(invoice.balance_due || invoice.total),
            promised_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            notes: '',
        });
        setShowPromiseModal(true);
    };

    const handlePromiseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        promiseForm.post(prefixedRoute('collections.promises.store'), {
            onSuccess: () => setShowPromiseModal(false),
        });
    };

    const fulfillPromiseForm = useForm({});
    const handleFulfillPromise = (promiseId: number) => {
        fulfillPromiseForm.post(prefixedRoute('collections.promises.fulfill', promiseId));
    };

    return (
        <DynamicLayout>
            <Head title="Pusat Penagihan AR & Giro (Collections)" />

            <div className="space-y-6">
                <PageHeader
                    title="Pusat Penagihan Piutang (Collections & Dunning)"
                    subtitle="Monitoring tagihan overdue, otomasi reminder WhatsApp, janji bayar, dan manajemen giro mundur."
                    actions={
                        <Link
                            href={prefixedRoute('collections.pdc.index')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            📑 Manajemen Bilyet Giro / PDC →
                        </Link>
                    }
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
                        <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                            Total Piutang Overdue
                        </span>
                        <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                            {formatIdr(stats.total_overdue_amount)}
                        </p>
                        <span className="mt-1 block text-xs text-rose-700/80">
                            {stats.overdue_count} invoice melewati jatuh tempo
                        </span>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                            Janji Bayar Aktif (Promise)
                        </span>
                        <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">
                            {stats.pending_promises_count} Komitmen
                        </p>
                        <span className="mt-1 block text-xs text-amber-700/80">Menunggu konfirmasi pelunasan</span>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
                        <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                            Giro Mundur (PDC) Tertitip
                        </span>
                        <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {stats.pending_pdc_count} Warkat
                        </p>
                        <span className="mt-1 block text-xs text-indigo-700/80">
                            Total warkat: {formatIdr(stats.pending_pdc_amount)}
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-xs font-semibold text-slate-400">Jatuh Tempo 7 Hari Ke Depan</span>
                        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                            {dueSoonInvoices.length} Tagihan
                        </p>
                        <span className="mt-1 block text-xs text-slate-500">Perlu pengingat preventif H-3</span>
                    </div>
                </div>

                {/* Overdue Invoices Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                Antrean Penagihan Invoice Overdue
                            </h3>
                            <p className="text-xs text-slate-400">
                                Kirim reminder otomatis atau catat jadwal komitmen pembayaran pelanggan.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                <tr>
                                    <th className="px-6 py-3.5">No. Invoice</th>
                                    <th className="px-6 py-3.5">Pelanggan</th>
                                    <th className="px-6 py-3.5">Jatuh Tempo</th>
                                    <th className="px-6 py-3.5 text-right">Sisa Tagihan</th>
                                    <th className="px-6 py-3.5 text-right">Aksi Penagihan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {overdueInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400">
                                            Luar biasa! Tidak ada invoice yang melewati jatuh tempo.
                                        </td>
                                    </tr>
                                ) : (
                                    overdueInvoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                                        >
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {inv.invoice_number}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                                {inv.partner?.name || '-'}
                                                {inv.partner?.phone && (
                                                    <span className="block text-xs text-slate-400">
                                                        {inv.partner.phone}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                                {inv.due_date}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {formatIdr(Number(inv.balance_due || inv.total))}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendReminder(inv)}
                                                        disabled={reminderForm.processing}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                    >
                                                        📲 Kirim Reminder WA
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openPromiseModal(inv)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                                                    >
                                                        🤝 Janji Bayar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grid 2 Column: Janji Bayar & Log Reminder */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Janji Bayar Card */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                Janji Bayar (Promise to Pay)
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {promises.length === 0 ? (
                                <p className="p-6 text-center text-xs text-slate-400">
                                    Tidak ada janji bayar aktif.
                                </p>
                            ) : (
                                promises.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-4">
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {p.partner?.name}
                                            </span>
                                            <span className="ml-2 text-xs text-slate-400">
                                                (Inv: {p.invoice?.invoice_number})
                                            </span>
                                            <p className="text-xs text-slate-500">
                                                Dijanjikan tgl: <span className="font-semibold text-indigo-600">{p.promised_date}</span> ({formatIdr(Number(p.promised_amount))})
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleFulfillPromise(p.id)}
                                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                                        >
                                            ✓ Tandai Lunas
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Dunning Log History */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                Riwayat Log Reminder Penagihan
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                            {recentDunnings.length === 0 ? (
                                <p className="p-6 text-center text-xs text-slate-400">
                                    Belum ada log pengiriman reminder.
                                </p>
                            ) : (
                                recentDunnings.map((log) => (
                                    <div key={log.id} className="p-4 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                {log.partner?.name} (Inv {log.invoice?.invoice_number})
                                            </span>
                                            <span className="text-slate-400">{log.sent_at}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-slate-500">{log.message_body}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Catat Janji Bayar */}
            {showPromiseModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Catat Janji Bayar (Promise to Pay)
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Komitmen pelunasan untuk Invoice {selectedInvoice.invoice_number} ({selectedInvoice.partner?.name}).
                        </p>

                        <form onSubmit={handlePromiseSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nominal yang Dijanjikan
                                </label>
                                <TextInput
                                    type="number"
                                    value={promiseForm.data.promised_amount}
                                    onChange={(e) =>
                                        promiseForm.setData('promised_amount', Number(e.target.value))
                                    }
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Tanggal Janji Bayar
                                </label>
                                <TextInput
                                    type="date"
                                    value={promiseForm.data.promised_date}
                                    onChange={(e) =>
                                        promiseForm.setData('promised_date', e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Catatan / Alasan
                                </label>
                                <textarea
                                    value={promiseForm.data.notes}
                                    onChange={(e) => promiseForm.setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Pelanggan menunggu pencairan termin proyek..."
                                    className="mt-1 block w-full rounded-xl border-slate-200 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setShowPromiseModal(false)}
                                    disabled={promiseForm.processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={promiseForm.processing}>
                                    {promiseForm.processing ? 'Menyimpan...' : 'Simpan Janji Bayar'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DynamicLayout>
    );
}

import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';

interface Driver {
    id: number;
    name: string;
    phone: string | null;
}

interface PayrollLine {
    id: number;
    type: string;
    title: string;
    amount: number;
    source_type?: string | null;
    source_id?: number | null;
    notes?: string | null;
}

interface PayrollDetail {
    id: number;
    code: string;
    period_start: string;
    period_end: string;
    status: 'draft' | 'approved' | 'paid' | 'cancelled';
    base_salary: number;
    daily_allowance_total: number;
    overtime_pay_total: number;
    trip_commission_total: number;
    bonus_total: number;
    deductions_total: number;
    net_pay: number;
    payment_method: string;
    payment_reference?: string | null;
    paid_at?: string | null;
    approved_at?: string | null;
    driver?: Driver | null;
    company_bank_account?: { id: number; name: string } | null;
    approver?: { id: number; name: string } | null;
    payer?: { id: number; name: string } | null;
    creator?: { id: number; name: string } | null;
    lines: PayrollLine[];
    notes?: string | null;
}

interface BankOption {
    id: number;
    name: string;
    bank_name?: string;
    account_number?: string;
}

interface Props {
    payroll: PayrollDetail;
    companyBankAccounts: BankOption[];
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export default function DriverPayrollShow({ payroll, companyBankAccounts }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [showDisburseModal, setShowDisburseModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const approveForm = useForm({});
    const deleteForm = useForm({});
    const disburseForm = useForm({
        company_bank_account_id: companyBankAccounts[0]?.id || '',
        payment_method: 'bank_transfer',
        payment_reference: '',
    });

    const handleApprove = () => {
        approveForm.post(prefixedRoute('driver-payroll.approve', payroll.id));
    };

    const handleDisburse = (e: React.FormEvent) => {
        e.preventDefault();
        disburseForm.post(prefixedRoute('driver-payroll.disburse', payroll.id), {
            onSuccess: () => setShowDisburseModal(false),
        });
    };

    const handleDelete = () => {
        deleteForm.delete(prefixedRoute('driver-payroll.destroy', payroll.id));
    };

    return (
        <DynamicLayout>
            <Head title={`Payroll ${payroll.code}`} />

            <div className="space-y-6">
                <PageHeader
                    title={`Payroll ${payroll.code}`}
                    subtitle={`Pengemudi: ${payroll.driver?.name || '-'} | Periode: ${payroll.period_start} s/d ${payroll.period_end}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link
                                href={prefixedRoute('driver-payroll.index')}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← Kembali
                            </Link>

                            <Link
                                href={prefixedRoute('driver-payroll.print', payroll.id)}
                                target="_blank"
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                🖨 Cetak Slip Gaji
                            </Link>

                            {payroll.status === 'draft' && (
                                <>
                                    <PrimaryButton
                                        onClick={handleApprove}
                                        disabled={approveForm.processing}
                                    >
                                        ✓ Setujui Payroll
                                    </PrimaryButton>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400"
                                    >
                                        Hapus
                                    </button>
                                </>
                            )}

                            {payroll.status === 'approved' && (
                                <PrimaryButton onClick={() => setShowDisburseModal(true)}>
                                    ⚡ Cairkan Pembayaran (Disburse)
                                </PrimaryButton>
                            )}
                        </div>
                    }
                />

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-xs font-semibold text-slate-400">Gaji Pokok & Bonus</span>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                            {formatIdr(Number(payroll.base_salary) + Number(payroll.bonus_total))}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-xs font-semibold text-slate-400">Lembur, SPPD & Komisi</span>
                        <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                            {formatIdr(
                                Number(payroll.overtime_pay_total) +
                                    Number(payroll.daily_allowance_total) +
                                    Number(payroll.trip_commission_total)
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-xs font-semibold text-slate-400">Total Potongan (Kasbon)</span>
                        <p className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
                            {Number(payroll.deductions_total) > 0
                                ? `-${formatIdr(Number(payroll.deductions_total))}`
                                : 'Rp 0'}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            Gaji Bersih (Take Home Pay)
                        </span>
                        <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            {formatIdr(Number(payroll.net_pay))}
                        </p>
                    </div>
                </div>

                {/* Line Items Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            Rincian Komponen Gaji & Potongan
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                <tr>
                                    <th className="px-6 py-3.5">Tipe Komponen</th>
                                    <th className="px-6 py-3.5">Keterangan</th>
                                    <th className="px-6 py-3.5 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payroll.lines.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-slate-400">
                                            Tidak ada rincian baris payroll.
                                        </td>
                                    </tr>
                                ) : (
                                    payroll.lines.map((line) => {
                                        const isDeduction = [
                                            'cash_advance_deduction',
                                            'penalty',
                                            'other_deduction',
                                        ].includes(line.type);

                                        return (
                                            <tr
                                                key={line.id}
                                                className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                                                    <span className="capitalize">
                                                        {line.type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                                                    {line.title}
                                                    {line.notes && (
                                                        <span className="block text-xs text-slate-400">
                                                            {line.notes}
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    className={`px-6 py-3.5 text-right font-semibold ${
                                                        isDeduction
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : 'text-slate-900 dark:text-white'
                                                    }`}
                                                >
                                                    {isDeduction ? `-${formatIdr(Number(line.amount))}` : formatIdr(Number(line.amount))}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-700 dark:bg-slate-800/60">
                                <tr>
                                    <td colSpan={2} className="px-6 py-4 text-slate-900 dark:text-white">
                                        TOTAL DITERIMA (NET PAY)
                                    </td>
                                    <td className="px-6 py-4 text-right text-lg text-emerald-600 dark:text-emerald-400">
                                        {formatIdr(Number(payroll.net_pay))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Audit & Disburse Information */}
                {payroll.status === 'paid' && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300">
                            Informasi Pencairan Gaji
                        </h4>
                        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                            Payroll telah dicairkan pada {payroll.paid_at} oleh {payroll.payer?.name || 'Sistem'}.
                            Metode: {payroll.payment_method}. Rekening:{' '}
                            {payroll.company_bank_account?.name || 'Kas Utama'}. Ref:{' '}
                            {payroll.payment_reference || '-'}.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal Pencairan Payroll */}
            {showDisburseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Cairkan Payroll Pengemudi
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Sistem akan mencatat pengeluaran di Buku Bank dan menjurnal ke Buku Besar otomatis.
                        </p>

                        <form onSubmit={handleDisburse} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Rekening Kas / Bank Pembayar
                                </label>
                                <select
                                    value={disburseForm.data.company_bank_account_id}
                                    onChange={(e) =>
                                        disburseForm.setData('company_bank_account_id', e.target.value)
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Metode Pembayaran
                                </label>
                                <select
                                    value={disburseForm.data.payment_method}
                                    onChange={(e) =>
                                        disburseForm.setData('payment_method', e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <option value="bank_transfer">Transfer Bank</option>
                                    <option value="cash">Tunai / Kas Langsung</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Nomor Referensi Transaksi
                                </label>
                                <TextInput
                                    type="text"
                                    placeholder="TRF-BCA-12345"
                                    value={disburseForm.data.payment_reference}
                                    onChange={(e) =>
                                        disburseForm.setData('payment_reference', e.target.value)
                                    }
                                    className="mt-1 block w-full"
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setShowDisburseModal(false)}
                                    disabled={disburseForm.processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={disburseForm.processing}>
                                    {disburseForm.processing ? 'Memproses...' : 'Konfirmasi Pencairan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDeleteDialog
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                processing={deleteForm.processing}
                message={`Hapus draft payroll ${payroll.code}?`}
            />
        </DynamicLayout>
    );
}

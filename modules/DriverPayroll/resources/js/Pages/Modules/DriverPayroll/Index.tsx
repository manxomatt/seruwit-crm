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

interface PayrollRow {
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
    driver?: Driver | null;
    company_bank_account?: { id: number; name: string } | null;
}

interface PaginatedPayrolls {
    data: PayrollRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    payrolls: PaginatedPayrolls;
    drivers: Driver[];
    filters: {
        status?: string;
        driver_id?: number;
    };
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
        case 'paid':
            return (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Lunas (Paid)
                </span>
            );
        case 'approved':
            return (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    Disetujui
                </span>
            );
        case 'cancelled':
            return (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    Dibatalkan
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    Draft
                </span>
            );
    }
};

export default function DriverPayrollIndex({ payrolls, drivers, filters }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        driver_id: drivers[0]?.id || '',
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0],
        period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString()
            .split('T')[0],
        base_salary: 0,
        bonus: 0,
        deduct_cash_advances: true,
        notes: '',
    });

    const submitGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        post(prefixedRoute('driver-payroll.generate'), {
            onSuccess: () => {
                setShowGenerateModal(false);
                reset();
            },
        });
    };

    return (
        <DynamicLayout>
            <Head title="Payroll Pengemudi" />

            <div className="space-y-6">
                <PageHeader
                    title="Payroll & Komisi Pengemudi"
                    subtitle="Konsolidasi gaji pokok, lembur surat jalan (SJO), SPPD, bonus, dan potongan kasbon otomatis."
                    actions={
                        <PrimaryButton onClick={() => setShowGenerateModal(true)}>
                            + Hitung Payroll Baru
                        </PrimaryButton>
                    }
                />

                {/* Table card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 font-semibold text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                                <tr>
                                    <th className="px-5 py-3.5">Kode Payroll</th>
                                    <th className="px-5 py-3.5">Pengemudi</th>
                                    <th className="px-5 py-3.5">Periode</th>
                                    <th className="px-5 py-3.5 text-right">Lembur & Komisi</th>
                                    <th className="px-5 py-3.5 text-right">Potongan</th>
                                    <th className="px-5 py-3.5 text-right">Gaji Bersih</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payrolls.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            Belum ada data payroll pengemudi. Klik "+ Hitung Payroll Baru" untuk memulai kalkulasi.
                                        </td>
                                    </tr>
                                ) : (
                                    payrolls.data.map((payroll) => (
                                        <tr
                                            key={payroll.id}
                                            className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                        >
                                            <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                <Link
                                                    href={prefixedRoute('driver-payroll.show', payroll.id)}
                                                    className="hover:underline"
                                                >
                                                    {payroll.code}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                                                {payroll.driver?.name || '-'}
                                                {payroll.driver?.phone && (
                                                    <span className="block text-xs text-slate-400">
                                                        {payroll.driver.phone}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                                                {payroll.period_start} s/d {payroll.period_end}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                                                {formatIdr(
                                                    Number(payroll.overtime_pay_total) +
                                                        Number(payroll.trip_commission_total) +
                                                        Number(payroll.daily_allowance_total)
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right font-medium text-rose-600 dark:text-rose-400">
                                                {Number(payroll.deductions_total) > 0
                                                    ? `-${formatIdr(Number(payroll.deductions_total))}`
                                                    : 'Rp 0'}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                                                {formatIdr(Number(payroll.net_pay))}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {statusBadge(payroll.status)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Link
                                                    href={prefixedRoute('driver-payroll.show', payroll.id)}
                                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                                >
                                                    Detail →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Hitung Payroll Baru */}
            {showGenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Hitung Payroll Pengemudi Baru
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Sistem akan mengumpulkan lembur dari SJO, komisi ritase, dan memotong kasbon aktif.
                        </p>

                        <form onSubmit={submitGenerate} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Pilih Pengemudi
                                </label>
                                <select
                                    value={data.driver_id}
                                    onChange={(e) => setData('driver_id', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border-slate-200 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {drivers.map((drv) => (
                                        <option key={drv.id} value={drv.id}>
                                            {drv.name} {drv.phone ? `(${drv.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.driver_id && (
                                    <p className="mt-1 text-xs text-rose-500">{errors.driver_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Tanggal Mulai
                                    </label>
                                    <TextInput
                                        type="date"
                                        value={data.period_start}
                                        onChange={(e) => setData('period_start', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    {errors.period_start && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.period_start}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Tanggal Akhir
                                    </label>
                                    <TextInput
                                        type="date"
                                        value={data.period_end}
                                        onChange={(e) => setData('period_end', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    {errors.period_end && (
                                        <p className="mt-1 text-xs text-rose-500">{errors.period_end}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Gaji Pokok (Opsional)
                                    </label>
                                    <TextInput
                                        type="number"
                                        value={data.base_salary}
                                        onChange={(e) => setData('base_salary', Number(e.target.value))}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                        Bonus / Insentif (Opsional)
                                    </label>
                                    <TextInput
                                        type="number"
                                        value={data.bonus}
                                        onChange={(e) => setData('bonus', Number(e.target.value))}
                                        className="mt-1 block w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="deduct_ca"
                                    checked={data.deduct_cash_advances}
                                    onChange={(e) => setData('deduct_cash_advances', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label
                                    htmlFor="deduct_ca"
                                    className="text-xs font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Otomatis potong sisa kasbon pengemudi yang belum lunas
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setShowGenerateModal(false)}
                                    disabled={processing}
                                >
                                    Batal
                                </SecondaryButton>
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Menghitung...' : 'Proses Kalkulasi'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DynamicLayout>
    );
}

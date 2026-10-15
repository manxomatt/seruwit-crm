import DynamicLayout from '@/Layouts/DynamicLayout';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo, FormEventHandler } from 'react';

interface ExpenseItem {
    id: number;
    duty_order_id: number;
    category: string;
    amount: number;
    date: string;
    receipt_number: string | null;
    receipt_url: string | null;
    description: string | null;
}

interface DutyOrderDetail {
    id: number;
    duty_order_number: string;
    rental_id: number | null;
    driver_id: number;
    vehicle_id: number;
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string;
    departure_time: string | null;
    return_time: string | null;
    actual_departure_at: string | null;
    actual_return_at: string | null;
    passenger_name: string | null;
    passenger_phone: string | null;
    status: 'draft' | 'dispatched' | 'completed' | 'settled' | 'cancelled';
    cash_advance_amount: number;
    cash_advance_notes: string | null;
    cash_advance_paid_at: string | null;
    actual_expense_total: number;
    net_balance: number;
    settlement_status: 'pending' | 'submitted' | 'settled';
    settled_at: string | null;
    settlement_notes: string | null;
    standard_hours_per_day: number;
    actual_hours_worked: number;
    overtime_hours: number;
    driver_overtime_rate_per_hour: number;
    total_driver_overtime_pay: number;
    customer_overtime_rate_per_hour: number;
    total_customer_overtime_charge: number;
    is_overtime_billed_to_customer: boolean;
    notes: string | null;
    driver?: {
        id: number;
        name: string;
        phone: string | null;
        license_number: string | null;
        license_type: string | null;
    };
    vehicle?: {
        id: number;
        name: string;
        plate_number: string;
        type: string | null;
        brand: string | null;
        model: string | null;
    };
    rental?: {
        id: number;
        code: string;
        status: string;
        start_date: string;
        end_date: string;
        partner?: {
            id: number;
            name: string;
            phone: string | null;
        };
    };
    creator?: {
        id: number;
        name: string;
    };
    cashAdvancePayer?: {
        id: number;
        name: string;
    };
    settler?: {
        id: number;
        name: string;
    };
    expenses: ExpenseItem[];
}

interface Props {
    dutyOrder: DutyOrderDetail;
    expenseCategories: Record<string, string>;
}

export default function DutyOrderShow({ dutyOrder, expenseCategories }: Props) {
    const { routePrefix } = useRoutePrefix();

    const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);

    // Add Expense Form
    const expenseForm = useForm({
        category: 'fuel',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        receipt_number: '',
        description: '',
        receipt_file: null as File | null,
    });

    // Overtime Form
    const overtimeForm = useForm({
        actual_hours_worked: dutyOrder.actual_hours_worked || '',
        standard_hours_per_day: dutyOrder.standard_hours_per_day || 12,
        driver_overtime_rate_per_hour: dutyOrder.driver_overtime_rate_per_hour || 25000,
        customer_overtime_rate_per_hour: dutyOrder.customer_overtime_rate_per_hour || 50000,
        is_overtime_billed_to_customer: dutyOrder.is_overtime_billed_to_customer || false,
    });

    // Settle Form
    const settleForm = useForm({
        settlement_notes: '',
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleAddExpenseSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        expenseForm.post(route(`${routePrefix}.rental.duty_orders.expenses.store`, dutyOrder.id), {
            onSuccess: () => {
                setIsAddExpenseModalOpen(false);
                expenseForm.reset();
            },
        });
    };

    const handleDeleteExpense = (expenseId: number) => {
        if (confirm('Yakin ingin menghapus bukti pengeluaran ini?')) {
            router.delete(route(`${routePrefix}.rental.duty_orders.expenses.destroy`, [dutyOrder.id, expenseId]));
        }
    };

    const handleUpdateStatus = (newStatus: string) => {
        router.patch(route(`${routePrefix}.rental.duty_orders.status`, dutyOrder.id), {
            status: newStatus,
        });
    };

    const handleOvertimeSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        overtimeForm.post(route(`${routePrefix}.rental.duty_orders.overtime`, dutyOrder.id), {
            onSuccess: () => {
                setIsOvertimeModalOpen(false);
            },
        });
    };

    const handleSettleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        settleForm.post(route(`${routePrefix}.rental.duty_orders.settle`, dutyOrder.id), {
            onSuccess: () => {
                setIsSettleModalOpen(false);
            },
        });
    };

    const categoryOptions: SelectOption[] = useMemo(() => {
        return Object.entries(expenseCategories).map(([key, label]) => ({
            value: key,
            label,
        }));
    }, [expenseCategories]);

    const isSettled = dutyOrder.settlement_status === 'settled';
    const isCashAdvanceSurplus = dutyOrder.net_balance >= 0;

    return (
        <DynamicLayout>
            <Head title={`SPPD ${dutyOrder.duty_order_number} - Rincian & Uang Jalan`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Navigation Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Link
                            href={route(`${routePrefix}.rental.duty_orders.index`)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                            <span>←</span> Kembali
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {dutyOrder.duty_order_number}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={route(`${routePrefix}.rental.duty_orders.print`, dutyOrder.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <SecondaryButton className="inline-flex items-center gap-1.5">
                                <span>🖨️</span> Cetak Lembar SPPD
                            </SecondaryButton>
                        </a>

                        {!isSettled && (
                            <>
                                {dutyOrder.status === 'draft' && (
                                    <PrimaryButton
                                        onClick={() => handleUpdateStatus('dispatched')}
                                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                                    >
                                        🚗 Mulai Jalan (On Duty)
                                    </PrimaryButton>
                                )}

                                {dutyOrder.status === 'dispatched' && (
                                    <PrimaryButton
                                        onClick={() => handleUpdateStatus('completed')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                                    >
                                        🏁 Selesai Tugas (Kembali)
                                    </PrimaryButton>
                                )}

                                <PrimaryButton
                                    onClick={() => setIsSettleModalOpen(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-xs inline-flex items-center gap-1"
                                >
                                    <span>💰</span> Selesaikan Kas (Settle)
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </div>

                {/* Banner Status */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                                {dutyOrder.duty_order_number}
                            </h1>
                            {isSettled ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                    ✓ Settled / Selesai Kas
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    Pending Settlement
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Rute: <strong className="text-slate-700 dark:text-slate-300">{dutyOrder.origin}</strong> ➔ <strong className="text-slate-700 dark:text-slate-300">{dutyOrder.destination}</strong> ({dutyOrder.departure_date} s/d {dutyOrder.return_date})
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Pengemudi</div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{dutyOrder.driver?.name}</div>
                            <div className="text-xs text-slate-500">{dutyOrder.driver?.phone || '-'}</div>
                        </div>
                        <div className="text-right border-l pl-6 border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-400">Unit Kendaraan</div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{dutyOrder.vehicle?.plate_number}</div>
                            <div className="text-xs text-slate-500">{dutyOrder.vehicle?.name}</div>
                        </div>
                    </div>
                </div>

                {/* Hero Financial Reconciliation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Cash Advance Given */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">1. Uang Muka Operasional</span>
                            <span className="text-lg">💵</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(dutyOrder.cash_advance_amount)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            {dutyOrder.cash_advance_notes || 'Kas operasional awal (BBM, Tol, dll)'}
                        </div>
                        {dutyOrder.cash_advance_paid_at && (
                            <div className="mt-2 text-[11px] text-slate-400">
                                Dicairkan: {dutyOrder.cash_advance_paid_at.substring(0, 16)} oleh {dutyOrder.cashAdvancePayer?.name || 'Kasir'}
                            </div>
                        )}
                    </div>

                    {/* 2. Realized Expenses */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">2. Realisasi Pengeluaran Riil</span>
                            <span className="text-lg">🧾</span>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(dutyOrder.actual_expense_total)}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                            Total dari {dutyOrder.expenses.length} bukti nota fisik / struk tercatat
                        </div>
                    </div>

                    {/* 3. Net Balance & Settlement Action */}
                    <div className={`border rounded-xl p-5 shadow-sm ${
                        isCashAdvanceSurplus
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold uppercase tracking-wider ${
                                isCashAdvanceSurplus ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                            }`}>
                                3. Saldo Kas Akhir (Rekonsiliasi)
                            </span>
                            <span className="text-lg">{isCashAdvanceSurplus ? '🟢' : '🔴'}</span>
                        </div>
                        <div className={`mt-2 text-2xl font-bold ${
                            isCashAdvanceSurplus ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                            {formatCurrency(dutyOrder.net_balance)}
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {isCashAdvanceSurplus ? (
                                <span>⚠️ <strong>Sisa Uang Jalan:</strong> Supir wajib mengembalikan uang sisa ini ke kasir.</span>
                            ) : (
                                <span>⚠️ <strong>Talangan Supir:</strong> Kasir wajib mengganti (reimburse) uang supir ini.</span>
                            )}
                        </div>
                        {isSettled && dutyOrder.settled_at && (
                            <div className="mt-3 text-[11px] text-purple-700 dark:text-purple-300 border-t pt-2 border-purple-200 dark:border-purple-800">
                                Diselesaikan pada {dutyOrder.settled_at.substring(0, 16)} oleh {dutyOrder.settler?.name || 'Kasir'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Overtime & Work Hours Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>⏱️</span> Jam Kerja & Perhitungan Lembur Supir
                            </h3>
                            <p className="text-xs text-slate-500">
                                Standar jam kerja: <strong>{dutyOrder.standard_hours_per_day} jam/hari</strong>. Lembur dihitung otomatis berdasarkan total realisasi jam operasional.
                            </p>
                        </div>
                        {!isSettled && (
                            <SecondaryButton onClick={() => setIsOvertimeModalOpen(true)} className="text-xs">
                                ✏️ Input Jam Riil & Lembur
                            </SecondaryButton>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400">Total Jam Kerja Riil</div>
                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                                {dutyOrder.actual_hours_worked || 0} Jam
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400">Kelebihan / Jam Lembur</div>
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                                {dutyOrder.overtime_hours || 0} Jam
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400">Hak Upah Lembur Supir</div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatCurrency(dutyOrder.total_driver_overtime_pay)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                @ {formatCurrency(dutyOrder.driver_overtime_rate_per_hour)}/jam
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400">Tagihan Lembur ke Tamu</div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {formatCurrency(dutyOrder.total_customer_overtime_charge)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {dutyOrder.is_overtime_billed_to_customer ? '✓ Ditagihkan ke Tamu' : 'Belum Ditagihkan'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Itemized Expenses (Nota Riil Lapangan) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span>🧾</span> Rekapitulasi Bukti Nota Riil Pengeluaran Lapangan
                            </h3>
                            <p className="text-xs text-slate-500">
                                Catat setiap nota BBM, e-toll, tiket parkir, makan, dan biaya operasional supir lainnya.
                            </p>
                        </div>
                        {!isSettled && (
                            <PrimaryButton
                                onClick={() => setIsAddExpenseModalOpen(true)}
                                className="inline-flex items-center gap-1.5 text-xs"
                            >
                                <span>＋</span> Tambah Bukti Pengeluaran
                            </PrimaryButton>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="py-2.5 px-4">Tanggal</th>
                                    <th className="py-2.5 px-4">Kategori Biaya</th>
                                    <th className="py-2.5 px-4">No. Struk / Bukti</th>
                                    <th className="py-2.5 px-4">Keterangan</th>
                                    <th className="py-2.5 px-4 text-center">Foto / File Nota</th>
                                    <th className="py-2.5 px-4 text-right">Nominal (Rp)</th>
                                    {!isSettled && <th className="py-2.5 px-4 text-center">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {dutyOrder.expenses.length === 0 ? (
                                    <tr>
                                        <td colSpan={isSettled ? 6 : 7} className="py-8 text-center text-slate-400">
                                            Belum ada nota pengeluaran riil yang dicatat. Klik tombol "+ Tambah Bukti Pengeluaran" di atas.
                                        </td>
                                    </tr>
                                ) : (
                                    dutyOrder.expenses.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                                            <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                                                {exp.date}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {expenseCategories[exp.category] || exp.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-500">
                                                {exp.receipt_number || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {exp.description || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {exp.receipt_url ? (
                                                    <a
                                                        href={exp.receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                                                    >
                                                        <span>📎</span> Lihat Struk
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">Tidak ada file</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                                                {formatCurrency(exp.amount)}
                                            </td>
                                            {!isSettled && (
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                        className="text-rose-500 hover:text-rose-700 text-xs"
                                                        title="Hapus Nota"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-semibold border-t border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan={5} className="py-3 px-4 text-right text-xs uppercase text-slate-600 dark:text-slate-300">
                                        Total Realisasi Pengeluaran:
                                    </td>
                                    <td className="py-3 px-4 text-right text-base text-rose-600 dark:text-rose-400 font-bold">
                                        {formatCurrency(dutyOrder.actual_expense_total)}
                                    </td>
                                    {!isSettled && <td></td>}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* SPPD Trip Information & Passenger Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Informasi Tamu & Booking Rental
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Booking Terkait:</span>
                                {dutyOrder.rental ? (
                                    <Link
                                        href={route(`${routePrefix}.rental.show`, dutyOrder.rental.id)}
                                        className="font-mono text-blue-600 hover:underline"
                                    >
                                        {dutyOrder.rental.code}
                                    </Link>
                                ) : (
                                    <span className="text-slate-500">SPPD Mandiri</span>
                                )}
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Nama Penumpang:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{dutyOrder.passenger_name || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Kontak Penumpang:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{dutyOrder.passenger_phone || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400">Dibuat Oleh:</span>
                                <span className="text-slate-700 dark:text-slate-200">{dutyOrder.creator?.name || 'Staff'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Catatan & Instruksi Khusus
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line min-h-[90px]">
                            {dutyOrder.notes || 'Tidak ada catatan khusus.'}
                        </div>
                        {dutyOrder.settlement_notes && (
                            <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                                <strong>Catatan Settlement:</strong> {dutyOrder.settlement_notes}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Tambah Bukti Pengeluaran */}
            <Modal show={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} maxWidth="lg">
                <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Tambah Bukti Pengeluaran (Nota Riil)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Catat nota pengeluaran operasional supir di perjalanan (BBM, E-Toll, parkir, makan, dll).
                    </p>

                    <div>
                        <InputLabel htmlFor="category" value="Kategori Pengeluaran *" />
                        <Select
                            value={expenseForm.data.category}
                            options={categoryOptions}
                            onChange={(val) => expenseForm.setData('category', val)}
                        />
                        <InputError message={expenseForm.errors.category} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel htmlFor="amount" value="Nominal Pengeluaran (Rp) *" />
                            <TextInput
                                id="amount"
                                type="number"
                                placeholder="Contoh: 150000"
                                value={expenseForm.data.amount}
                                onChange={(e) => expenseForm.setData('amount', e.target.value)}
                                className="w-full text-sm font-bold text-rose-600 dark:text-rose-400"
                                required
                            />
                            <InputError message={expenseForm.errors.amount} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="date" value="Tanggal Transaksi *" />
                            <TextInput
                                id="date"
                                type="date"
                                value={expenseForm.data.date}
                                onChange={(e) => expenseForm.setData('date', e.target.value)}
                                className="w-full text-sm"
                                required
                            />
                            <InputError message={expenseForm.errors.date} className="mt-1" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="receipt_number" value="Nomor Struk / Stempel Nota" />
                        <TextInput
                            id="receipt_number"
                            placeholder="Contoh: TRX-9921 / No Struk SPBU"
                            value={expenseForm.data.receipt_number}
                            onChange={(e) => expenseForm.setData('receipt_number', e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Keterangan Rincian" />
                        <TextInput
                            id="description"
                            placeholder="Contoh: Pertamax 30 Liter SPBU Rest Area KM 45"
                            value={expenseForm.data.description}
                            onChange={(e) => expenseForm.setData('description', e.target.value)}
                            className="w-full text-sm"
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="receipt_file" value="Upload Foto Nota / Struk (JPG, PNG, PDF)" />
                        <input
                            id="receipt_file"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    expenseForm.setData('receipt_file', e.target.files[0]);
                                }
                            }}
                            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        <InputError message={expenseForm.errors.receipt_file} className="mt-1" />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setIsAddExpenseModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={expenseForm.processing}>
                            {expenseForm.processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Input Jam Kerja & Lembur */}
            <Modal show={isOvertimeModalOpen} onClose={() => setIsOvertimeModalOpen(false)} maxWidth="md">
                <form onSubmit={handleOvertimeSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Kalkulator Jam Kerja & Lembur Supir
                    </h3>

                    <div>
                        <InputLabel htmlFor="actual_hours_worked" value="Realisasi Total Jam Kerja Supir (Jam) *" />
                        <TextInput
                            id="actual_hours_worked"
                            type="number"
                            step="0.5"
                            placeholder="Contoh: 16"
                            value={overtimeForm.data.actual_hours_worked}
                            onChange={(e) => overtimeForm.setData('actual_hours_worked', e.target.value)}
                            className="w-full text-sm font-semibold"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel htmlFor="standard_hours_per_day" value="Batas Jam Normal/Hari" />
                            <TextInput
                                id="standard_hours_per_day"
                                type="number"
                                value={overtimeForm.data.standard_hours_per_day}
                                onChange={(e) => overtimeForm.setData('standard_hours_per_day', Number(e.target.value))}
                                className="w-full text-sm"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="driver_overtime_rate_per_hour" value="Upah Lembur Supir/Jam (Rp)" />
                            <TextInput
                                id="driver_overtime_rate_per_hour"
                                type="number"
                                value={overtimeForm.data.driver_overtime_rate_per_hour}
                                onChange={(e) => overtimeForm.setData('driver_overtime_rate_per_hour', Number(e.target.value))}
                                className="w-full text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="customer_overtime_rate_per_hour" value="Tarif Tagih ke Tamu/Jam (Rp)" />
                        <TextInput
                            id="customer_overtime_rate_per_hour"
                            type="number"
                            value={overtimeForm.data.customer_overtime_rate_per_hour}
                            onChange={(e) => overtimeForm.setData('customer_overtime_rate_per_hour', Number(e.target.value))}
                            className="w-full text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_overtime_billed_to_customer"
                            checked={overtimeForm.data.is_overtime_billed_to_customer}
                            onChange={(e) => overtimeForm.setData('is_overtime_billed_to_customer', e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 shadow-sm focus:ring-blue-500"
                        />
                        <label htmlFor="is_overtime_billed_to_customer" className="text-xs text-slate-700 dark:text-slate-300">
                            Tagihkan lembur ini ke tagihan invoice penyewa / tamu
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setIsOvertimeModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={overtimeForm.processing}>
                            {overtimeForm.processing ? 'Menghitung...' : 'Simpan & Hitung Lembur'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Selesaikan Kas (Settle) */}
            <Modal show={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} maxWidth="md">
                <form onSubmit={handleSettleSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        Selesaikan Uang Jalan & SPPD (Settlement)
                    </h3>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Uang Muka Diberikan:</span>
                            <span className="font-semibold">{formatCurrency(dutyOrder.cash_advance_amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Nota Riil:</span>
                            <span className="font-semibold text-rose-600">{formatCurrency(dutyOrder.actual_expense_total)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-slate-800 dark:text-slate-100">Saldo Netto:</span>
                            <span className={`font-bold text-base ${isCashAdvanceSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(dutyOrder.net_balance)}
                            </span>
                        </div>
                        <div className="text-xs mt-2 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                            {isCashAdvanceSurplus ? (
                                <span>💵 <strong>Pengembalian ke Kasir:</strong> Supir mengembalikan uang sisa sebesar <strong>{formatCurrency(dutyOrder.net_balance)}</strong>.</span>
                            ) : (
                                <span>💵 <strong>Reimbursement ke Supir:</strong> Kasir membayarkan talangan supir sebesar <strong>{formatCurrency(Math.abs(dutyOrder.net_balance))}</strong>.</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="settlement_notes" value="Catatan Penyelesaian Kas (Kasir)" />
                        <textarea
                            id="settlement_notes"
                            rows={3}
                            value={settleForm.data.settlement_notes}
                            onChange={(e) => settleForm.setData('settlement_notes', e.target.value)}
                            placeholder="Contoh: Sisa kas Rp 75.000 telah diterima kasir tunai. SPPD selesai."
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <SecondaryButton onClick={() => setIsSettleModalOpen(false)}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={settleForm.processing} className="bg-purple-600 hover:bg-purple-700">
                            {settleForm.processing ? 'Menyelesaikan...' : 'Tutup & Selesaikan SPPD'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}

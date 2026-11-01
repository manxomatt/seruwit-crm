import { Head } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface Driver {
    id: number;
    name: string;
    phone: string | null;
    license_number?: string | null;
}

interface PayrollLine {
    id: number;
    type: string;
    title: string;
    amount: number;
    notes?: string | null;
}

interface PayrollDetail {
    id: number;
    code: string;
    period_start: string;
    period_end: string;
    status: string;
    base_salary: number;
    daily_allowance_total: number;
    overtime_pay_total: number;
    trip_commission_total: number;
    bonus_total: number;
    deductions_total: number;
    net_pay: number;
    paid_at?: string | null;
    driver?: Driver | null;
    lines: PayrollLine[];
}

interface Props {
    payroll: PayrollDetail;
}

function formatIdr(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);
}

export default function DriverPayrollPrint({ payroll }: Props) {
    useEffect(() => {
        window.print();
    }, []);

    const earnings = payroll.lines.filter(
        (l) => !['cash_advance_deduction', 'penalty', 'other_deduction'].includes(l.type)
    );
    const deductions = payroll.lines.filter((l) =>
        ['cash_advance_deduction', 'penalty', 'other_deduction'].includes(l.type)
    );

    return (
        <div className="min-h-screen bg-white p-8 text-slate-800 font-sans print:p-0">
            <Head title={`Slip Gaji - ${payroll.code} - ${payroll.driver?.name}`} />

            <div className="mx-auto max-w-2xl border border-slate-300 p-8 shadow-sm print:border-none print:shadow-none">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
                            SLIP GAJI PENGEMUDI
                        </h1>
                        <p className="text-xs text-slate-500">PT Seruwit Transport & Logistics</p>
                    </div>
                    <div className="text-right">
                        <span className="font-mono text-sm font-bold text-slate-700">{payroll.code}</span>
                        <p className="text-xs text-slate-500">
                            Periode: {payroll.period_start} s/d {payroll.period_end}
                        </p>
                    </div>
                </div>

                {/* Driver Info */}
                <div className="my-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-xs">
                    <div>
                        <span className="font-semibold text-slate-500">Nama Pengemudi:</span>
                        <p className="font-bold text-slate-900">{payroll.driver?.name || '-'}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-slate-500">No. Telepon / SIM:</span>
                        <p className="font-bold text-slate-900">
                            {payroll.driver?.phone || '-'} / {payroll.driver?.license_number || '-'}
                        </p>
                    </div>
                </div>

                {/* Earnings & Deductions Columns */}
                <div className="grid grid-cols-2 gap-6 my-6 text-xs">
                    {/* Penghasilan */}
                    <div className="border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold uppercase tracking-wider text-slate-700 border-b pb-2 mb-2">
                            Penerimaan (Earnings)
                        </h4>
                        <div className="space-y-1.5">
                            {earnings.map((line) => (
                                <div key={line.id} className="flex justify-between">
                                    <span className="text-slate-600">{line.title}</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatIdr(Number(line.amount))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Potongan */}
                    <div className="border border-slate-200 p-4 rounded-lg">
                        <h4 className="font-bold uppercase tracking-wider text-rose-700 border-b pb-2 mb-2">
                            Potongan (Deductions)
                        </h4>
                        <div className="space-y-1.5">
                            {deductions.length === 0 ? (
                                <span className="text-slate-400 italic">Tidak ada potongan</span>
                            ) : (
                                deductions.map((line) => (
                                    <div key={line.id} className="flex justify-between">
                                        <span className="text-slate-600">{line.title}</span>
                                        <span className="font-semibold text-rose-600">
                                            {formatIdr(Number(line.amount))}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Total Net Pay */}
                <div className="my-4 flex items-center justify-between rounded-lg bg-slate-900 px-6 py-4 text-white">
                    <span className="font-bold uppercase tracking-wide text-xs">
                        TOTAL GAJI BERSIH (TAKE HOME PAY)
                    </span>
                    <span className="text-xl font-black">{formatIdr(Number(payroll.net_pay))}</span>
                </div>

                {/* Signatures */}
                <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs">
                    <div>
                        <p className="text-slate-500">Penerima,</p>
                        <div className="mt-16 border-b border-slate-400 mx-8"></div>
                        <p className="mt-1 font-bold text-slate-800">{payroll.driver?.name || 'Pengemudi'}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Finance & Payroll Manager,</p>
                        <div className="mt-16 border-b border-slate-400 mx-8"></div>
                        <p className="mt-1 font-bold text-slate-800">Bagian Keuangan</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

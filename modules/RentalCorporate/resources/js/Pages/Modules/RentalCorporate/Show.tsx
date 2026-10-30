import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';
import RentalNav from '../../../../../../Rental/resources/js/RentalNav';

interface ContractDetail {
    id: number;
    code: string;
    title: string;
    partner_id: number;
    partner_name: string;
    partner_email: string | null;
    partner_phone: string | null;
    partner_address: string | null;
    po_number: string | null;
    pic_name: string | null;
    pic_phone: string | null;
    pic_email: string | null;
    start_date: string | null;
    end_date: string | null;
    billing_cycle: 'monthly' | 'biweekly' | 'per_trip';
    payment_term_days: number;
    credit_limit: number;
    discount_pct: number;
    tax_included: boolean;
    withholding_tax_pct: number;
    sla_replacement_hours: number;
    status: 'draft' | 'active' | 'expired' | 'terminated';
    notes: string | null;
    active_rentals_count: number;
    total_rentals_count: number;
    unbilled_rentals_count: number;
    unbilled_amount: number;
    outstanding_ar: number;
    credit_used: number;
    credit_utilization_pct: number;
}

interface ContractRentalRow {
    id: number;
    code: string;
    client_po_number: string | null;
    vehicle_label: string;
    plate_number: string;
    driver_name: string | null;
    service_type: string;
    start_date: string | null;
    end_date: string | null;
    status: string;
    base_amount: number;
    extra_amount: number;
    duty_overtime_amount: number;
    gross_billable: number;
    billing_status: string;
    can_consolidate: boolean;
    invoice_id: number | null;
    invoice_code: string | null;
}

interface AvailablePartnerRental {
    id: number;
    code: string;
    vehicle_label: string;
    plate_number: string;
    start_date: string | null;
    end_date: string | null;
    total_amount: number;
    status: string;
}

interface ConsolidatedInvoiceRow {
    id: number;
    code: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    lines_count: number;
    subtotal: number;
    tax_amount: number;
    total: number;
    withholding_tax_pct: number;
    withholding_amount: number;
    net_cash_expected: number;
    amount_paid: number;
    balance_due: number;
    notes: string | null;
    lines: Array<{
        id: number;
        description: string;
        amount: number;
    }>;
}

interface Props {
    contract: ContractDetail;
    rentals: ContractRentalRow[];
    availablePartnerRentals: AvailablePartnerRental[];
    invoices: ConsolidatedInvoiceRow[];
    filters: {
        period: string;
    };
}

const formatIdr = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const BILLING_BADGE: Record<string, { label: string; className: string }> = {
    unbilled: {
        label: 'Belum Di-invoice',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    draft_single: {
        label: 'Draft Satuan (Siap Gabung)',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    },
    issued: {
        label: 'Invoice Terbit (TOP)',
        className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    },
    partially_paid: {
        label: 'Dibayar Sebagian',
        className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    paid: {
        label: 'Lunas',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
};

export default function CorporateContractShow({
    contract,
    rentals,
    availablePartnerRentals,
    invoices,
    filters,
}: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [selectedRentalIds, setSelectedRentalIds] = useState<number[]>(() =>
        rentals.filter((r) => r.can_consolidate).map((r) => r.id)
    );
    const [showConsolidateModal, setShowConsolidateModal] = useState(false);
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [statementInvoice, setStatementInvoice] = useState<ConsolidatedInvoiceRow | null>(null);

    const currentMonth = new Date().toISOString().slice(0, 7);

    const consolidateForm = useForm({
        rental_ids: selectedRentalIds,
        billing_period: filters.period !== 'all' ? filters.period : currentMonth,
        issue_immediately: true,
        apply_discount: contract.discount_pct > 0,
        notes: '',
    });

    const attachForm = useForm({
        rental_ids: [] as number[],
        client_po_number: contract.po_number || '',
    });

    const consolidatableRentals = useMemo(
        () => rentals.filter((r) => r.can_consolidate),
        [rentals]
    );

    const selectedRentals = useMemo(
        () => rentals.filter((r) => selectedRentalIds.includes(r.id) && r.can_consolidate),
        [rentals, selectedRentalIds]
    );

    const previewCalculation = useMemo(() => {
        const gross = selectedRentals.reduce((sum, r) => sum + r.gross_billable, 0);
        const discountAmt = consolidateForm.data.apply_discount && contract.discount_pct > 0
            ? Math.round(gross * (contract.discount_pct / 100))
            : 0;
        const dppSubtotal = Math.max(0, gross - discountAmt);
        const ppnAmt = contract.tax_included ? Math.round(dppSubtotal * 0.11) : 0;
        const invoiceTotal = dppSubtotal + ppnAmt;
        const pph23Amt = contract.withholding_tax_pct > 0
            ? Math.round(dppSubtotal * (contract.withholding_tax_pct / 100))
            : 0;
        const netCashReceivable = invoiceTotal - pph23Amt;

        return {
            gross,
            discountAmt,
            dppSubtotal,
            ppnAmt,
            invoiceTotal,
            pph23Amt,
            netCashReceivable,
        };
    }, [selectedRentals, consolidateForm.data.apply_discount, contract]);

    const toggleRentalSelection = (id: number) => {
        setSelectedRentalIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleAllConsolidatable = () => {
        if (selectedRentalIds.length === consolidatableRentals.length) {
            setSelectedRentalIds([]);
        } else {
            setSelectedRentalIds(consolidatableRentals.map((r) => r.id));
        }
    };

    const openConsolidateDialog = () => {
        consolidateForm.setData('rental_ids', selectedRentalIds);
        setShowConsolidateModal(true);
    };

    const submitConsolidation = (e: FormEvent) => {
        e.preventDefault();
        consolidateForm.transform((data) => ({
            ...data,
            rental_ids: selectedRentalIds,
        }));
        consolidateForm.post(prefixedRoute('rental.corporate.consolidate_invoice', contract.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowConsolidateModal(false);
                setSelectedRentalIds([]);
            },
        });
    };

    const submitAttachRentals = (e: FormEvent) => {
        e.preventDefault();
        attachForm.post(prefixedRoute('rental.corporate.attach_rentals', contract.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAttachModal(false);
                attachForm.reset('rental_ids');
            },
        });
    };

    const confirmDeleteContract = () => {
        setIsDeleting(true);
        router.delete(prefixedRoute('rental.corporate.destroy', contract.id), {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteModal(false);
            },
        });
    };

    const handlePeriodChange = (period: string) => {
        router.get(
            prefixedRoute('rental.corporate.show', contract.id),
            { period },
            { preserveState: true, replace: true }
        );
    };

    return (
        <ModuleLayout
            header={
                <PageHeader
                    title={`${contract.code} — ${contract.title}`}
                    subtitle={`Klien B2B: ${contract.partner_name} • TOP Net ${contract.payment_term_days} Hari • SLA Unit Pengganti Maks ${contract.sla_replacement_hours} Jam`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={prefixedRoute('rental.corporate.index')}
                                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                            >
                                ← Daftar Kontrak B2B
                            </Link>
                            <Link
                                href={prefixedRoute('rental.corporate.edit', contract.id)}
                                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                            >
                                ✏️ Edit Kontrak
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                            >
                                🗑️ Hapus Kontrak
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAttachModal(true)}
                                className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                            >
                                + Tautkan Booking Sewa ({availablePartnerRentals.length})
                            </button>
                            <button
                                type="button"
                                disabled={selectedRentals.length === 0}
                                onClick={openConsolidateDialog}
                                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
                            >
                                🧾 Gabungkan ke 1 Invoice ({selectedRentals.length} Sewa)
                            </button>
                        </div>
                    }
                />
            }
        >
            <Head title={`Kontrak B2B ${contract.code}`} />

            <RentalNav />

            {/* Contract Summary & Credit Plafond Card */}
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">
                                    {contract.code}
                                </span>
                                {contract.po_number && (
                                    <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                        PO Induk: {contract.po_number}
                                    </span>
                                )}
                            </div>
                            <h2 className="mt-2 text-base font-black text-slate-900 dark:text-white">
                                {contract.partner_name}
                            </h2>
                            <p className="text-xs text-slate-500">
                                {contract.partner_address || 'Alamat perusahaan belum diisi'}
                            </p>
                        </div>

                        <div className="text-right text-xs">
                            <p className="font-bold text-slate-700 dark:text-slate-300">
                                Masa Kontrak: {contract.start_date} s/d {contract.end_date}
                            </p>
                            <p className="mt-1 text-slate-500">
                                PIC: <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.pic_name || '—'}</span>
                                {contract.pic_phone ? ` (${contract.pic_phone})` : ''}
                            </p>
                            {contract.pic_email && <p className="text-slate-500">{contract.pic_email}</p>}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                        <div>
                            <span className="text-[11px] text-slate-500">Termin Pembayaran (TOP)</span>
                            <p className="mt-0.5 font-black text-slate-900 dark:text-white">
                                Net {contract.payment_term_days} Hari
                            </p>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500">Diskon Korporat</span>
                            <p className="mt-0.5 font-black text-emerald-600 dark:text-emerald-400">
                                {contract.discount_pct}%
                            </p>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500">Skema Pajak B2B</span>
                            <p className="mt-0.5 font-black text-slate-900 dark:text-white">
                                {contract.tax_included ? 'PPN 11%' : 'Non-PPN'} • PPh 23 ({contract.withholding_tax_pct}%)
                            </p>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500">SLA Kendaraan Pengganti</span>
                            <p className="mt-0.5 font-black text-indigo-600 dark:text-indigo-400">
                                Maks {contract.sla_replacement_hours} Jam
                            </p>
                        </div>
                    </div>
                </div>

                {/* Credit Limit Utilization Card */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Utilisasi Plafon Kredit B2B
                        </span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {contract.credit_utilization_pct}%
                        </span>
                    </div>
                    <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                        {formatIdr(contract.credit_used)}
                    </p>
                    <p className="text-xs text-slate-500">
                        dari batas plafon {contract.credit_limit > 0 ? formatIdr(contract.credit_limit) : 'Tanpa Batas'}
                    </p>

                    {contract.credit_limit > 0 && (
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                                className={`h-full rounded-full ${
                                    contract.credit_utilization_pct > 100
                                        ? 'bg-rose-600'
                                        : contract.credit_utilization_pct >= 80
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, contract.credit_utilization_pct)}%` }}
                            />
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                        <div>
                            <span className="text-[11px] text-slate-500">Sewa Belum Ditagih</span>
                            <p className="font-bold text-amber-600 dark:text-amber-400">
                                {formatIdr(contract.unbilled_amount)}
                            </p>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-500">Invoice Terbit (AR)</span>
                            <p className="font-bold text-rose-600 dark:text-rose-400">
                                {formatIdr(contract.outstanding_ar)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Linked Rentals & Consolidation */}
            <div className="mb-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Daftar Unit & Pemakaian Sewa Korporat ({rentals.length} Booking)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Centang booking sewa yang belum di-invoice untuk digabungkan ke dalam 1 Consolidated Monthly Invoice.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handlePeriodChange('all')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                                filters.period === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            Semua Periode
                        </button>
                        <input
                            type="month"
                            value={filters.period !== 'all' ? filters.period : currentMonth}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
                        />
                        {consolidatableRentals.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleAllConsolidatable}
                                className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                            >
                                {selectedRentalIds.length === consolidatableRentals.length
                                    ? 'Batal Pilih Semua'
                                    : `Pilih Semua Siap Tagih (${consolidatableRentals.length})`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Selected Consolidation Summary Bar */}
                {selectedRentals.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/30 px-5 py-3 text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="font-black text-indigo-900 dark:text-indigo-200">
                                ✅ {selectedRentals.length} Booking Dipilih
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                                DPP Tagihan: <strong className="text-slate-900 dark:text-white">{formatIdr(previewCalculation.dppSubtotal)}</strong>
                            </span>
                            {contract.tax_included && (
                                <span className="text-slate-600 dark:text-slate-300">
                                    + PPN 11%: <strong>{formatIdr(previewCalculation.ppnAmt)}</strong>
                                </span>
                            )}
                            <span className="text-indigo-700 dark:text-indigo-300 font-bold">
                                Total Invoice: {formatIdr(previewCalculation.invoiceTotal)}
                            </span>
                            {contract.withholding_tax_pct > 0 && (
                                <span className="text-amber-700 dark:text-amber-300">
                                    (PPh 23 {contract.withholding_tax_pct}%: -{formatIdr(previewCalculation.pph23Amt)} → Kas Bersih: <strong>{formatIdr(previewCalculation.netCashReceivable)}</strong>)
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={openConsolidateDialog}
                            className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                        >
                            Terbitkan Invoice Gabungan Sekarang ➔
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="w-10 px-4 py-3 text-center">Pilih</th>
                                <th className="px-4 py-3">Kode Booking & PO</th>
                                <th className="px-4 py-3">Kendaraan & Layanan</th>
                                <th className="px-4 py-3">Periode Sewa</th>
                                <th className="px-4 py-3 text-right">Sewa Pokok</th>
                                <th className="px-4 py-3 text-right">Biaya Tambahan</th>
                                <th className="px-4 py-3 text-right">Total Tagihan</th>
                                <th className="px-4 py-3 text-center">Status Penagihan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {rentals.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                        Belum ada booking sewa yang ditautkan ke kontrak korporat ini. Klik tombol <strong>+ Tautkan Booking Sewa</strong> di kanan atas.
                                    </td>
                                </tr>
                            ) : (
                                rentals.map((r) => {
                                    const badge = BILLING_BADGE[r.billing_status] || BILLING_BADGE.unbilled;
                                    const checked = selectedRentalIds.includes(r.id);

                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 text-center">
                                                {r.can_consolidate ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleRentalSelection(r.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                                    />
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={prefixedRoute('rental.show', r.id)}
                                                    className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {r.code}
                                                </Link>
                                                {r.client_po_number && (
                                                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                                                        PO: {r.client_po_number}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {r.vehicle_label}{' '}
                                                    <span className="font-mono text-[11px] text-slate-500">({r.plate_number})</span>
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {r.service_type === 'with_driver'
                                                        ? `Dengan Pengemudi${r.driver_name ? `: ${r.driver_name}` : ''}`
                                                        : 'Lepas Kunci (Self-Drive)'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {r.start_date} → {r.end_date}
                                                </p>
                                                <span className="text-[10px] uppercase font-bold text-slate-500">
                                                    Status Unit: {r.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                                {formatIdr(r.base_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                {formatIdr(r.extra_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                                                {formatIdr(r.gross_billable)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                                {r.invoice_code && (
                                                    <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">
                                                        {r.invoice_code}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Consolidated Monthly Invoices History */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 p-5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Riwayat Invoice Gabungan (Consolidated B2B Invoices)
                    </h3>
                    <p className="text-xs text-slate-500">
                        Daftar tagihan gabungan yang telah diterbitkan beserta perhitungan PPN 11%, potongan PPh 23, dan Statement B2B siap cetak.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3">No. Invoice</th>
                                <th className="px-4 py-3">Tgl Terbit & Jatuh Tempo (TOP)</th>
                                <th className="px-4 py-3 text-center">Item Tagihan</th>
                                <th className="px-4 py-3 text-right">DPP (Subtotal)</th>
                                <th className="px-4 py-3 text-right">PPN</th>
                                <th className="px-4 py-3 text-right">Total Invoice</th>
                                <th className="px-4 py-3 text-right">Potongan PPh 23</th>
                                <th className="px-4 py-3 text-right">Kas Bersih Diterima</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center text-slate-500">
                                        Belum ada invoice yang diterbitkan untuk kontrak korporat ini.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                                            {inv.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                Terbit: {inv.issue_date}
                                            </p>
                                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                                                Jatuh Tempo: {inv.due_date}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {inv.lines_count} Baris
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            {formatIdr(inv.subtotal)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                            {formatIdr(inv.tax_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                                            {formatIdr(inv.total)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">
                                            -{formatIdr(inv.withholding_amount)} ({inv.withholding_tax_pct}%)
                                        </td>
                                        <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                                            {formatIdr(inv.net_cash_expected)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setStatementInvoice(inv)}
                                                className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                                            >
                                                🖨️ Statement B2B
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Consolidate Invoice Confirmation */}
            {showConsolidateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Terbitkan Tagihan Bulanan Gabungan (Consolidated Invoice)
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Menggabungkan <strong>{selectedRentals.length} booking sewa</strong> dari kontrak <strong>{contract.code}</strong> ke dalam 1 faktur tagihan korporat.
                        </p>

                        <form onSubmit={submitConsolidation} className="mt-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Label Periode Penagihan
                                </label>
                                <input
                                    type="text"
                                    value={consolidateForm.data.billing_period}
                                    onChange={(e) => consolidateForm.setData('billing_period', e.target.value)}
                                    placeholder="Cth: Oktober 2026"
                                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Tagihan Kotor ({selectedRentals.length} Sewa)</span>
                                    <span className="font-bold">{formatIdr(previewCalculation.gross)}</span>
                                </div>
                                {contract.discount_pct > 0 && (
                                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={consolidateForm.data.apply_discount}
                                                onChange={(e) => consolidateForm.setData('apply_discount', e.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                            />
                                            <span>Diskon Kontrak Korporat ({contract.discount_pct}%)</span>
                                        </label>
                                        <span className="font-bold">-{formatIdr(previewCalculation.discountAmt)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <span className="font-semibold">DPP (Subtotal Invoice)</span>
                                    <span className="font-bold">{formatIdr(previewCalculation.dppSubtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">PPN ({contract.tax_included ? '11%' : '0%'})</span>
                                    <span className="font-semibold">{formatIdr(previewCalculation.ppnAmt)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 text-sm">
                                    <span className="font-black text-slate-900 dark:text-white">Total Tagihan Invoice</span>
                                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                                        {formatIdr(previewCalculation.invoiceTotal)}
                                    </span>
                                </div>
                                {contract.withholding_tax_pct > 0 && (
                                    <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-400 pt-1">
                                        <span>Estimasi Potongan PPh 23 ({contract.withholding_tax_pct}% dari DPP)</span>
                                        <span>-{formatIdr(previewCalculation.pph23Amt)} (Kas Diterima: {formatIdr(previewCalculation.netCashReceivable)})</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="issue_immediately"
                                    type="checkbox"
                                    checked={consolidateForm.data.issue_immediately}
                                    onChange={(e) => consolidateForm.setData('issue_immediately', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                />
                                <label htmlFor="issue_immediately" className="font-semibold text-slate-700 dark:text-slate-200">
                                    Langsung terbitkan sebagai Invoice Aktif (Issued) dengan jatuh tempo TOP Net {contract.payment_term_days} Hari
                                </label>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Catatan Tambahan pada Invoice (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={consolidateForm.data.notes}
                                    onChange={(e) => consolidateForm.setData('notes', e.target.value)}
                                    placeholder="Nomor rekening pembayaran, instruksi pengiriman Bukti Potong PPh 23, dll."
                                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConsolidateModal(false)}
                                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={consolidateForm.processing}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {consolidateForm.processing ? 'Menerbitkan...' : 'Terbitkan Consolidated Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Attach Existing Partner Rentals */}
            {showAttachModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            Tautkan Booking Sewa ke Kontrak {contract.code}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Pilih transaksi sewa milik <strong>{contract.partner_name}</strong> yang belum tertaut ke kontrak korporat.
                        </p>

                        <form onSubmit={submitAttachRentals} className="mt-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Nomor PO Klien untuk Booking Ini
                                </label>
                                <input
                                    type="text"
                                    value={attachForm.data.client_po_number}
                                    onChange={(e) => attachForm.setData('client_po_number', e.target.value)}
                                    placeholder="Kosongkan untuk memakai PO Induk Kontrak"
                                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                {availablePartnerRentals.length === 0 ? (
                                    <p className="p-6 text-center text-slate-500">
                                        Semua booking sewa untuk partner {contract.partner_name} sudah tertaut ke kontrak.
                                    </p>
                                ) : (
                                    availablePartnerRentals.map((item) => {
                                        const isChecked = attachForm.data.rental_ids.includes(item.id);
                                        return (
                                            <label
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            const next = isChecked
                                                                ? attachForm.data.rental_ids.filter((id) => id !== item.id)
                                                                : [...attachForm.data.rental_ids, item.id];
                                                            attachForm.setData('rental_ids', next);
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">
                                                            {item.code} — {item.vehicle_label} ({item.plate_number})
                                                        </p>
                                                        <p className="text-[11px] text-slate-500">
                                                            {item.start_date} s/d {item.end_date} • Status: {item.status}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                    {formatIdr(item.total_amount)}
                                                </span>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAttachModal(false)}
                                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={attachForm.processing || attachForm.data.rental_ids.length === 0}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Tautkan ({attachForm.data.rental_ids.length}) Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Printable B2B Consolidated Statement Modal */}
            {statementInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl">
                        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                                    REKAPITULASI TAGIHAN SEWA KORPORAT (CONSOLIDATED B2B INVOICE)
                                </p>
                                <h2 className="mt-1 text-xl font-black text-slate-900">
                                    INVOICE: {statementInvoice.code}
                                </h2>
                                <p className="text-xs text-slate-600">
                                    Ref Kontrak: <strong>{contract.code}</strong> ({contract.title})
                                    {contract.po_number ? ` • PO Induk: ${contract.po_number}` : ''}
                                </p>
                            </div>
                            <div className="text-right text-xs">
                                <p className="font-bold">Tanggal Terbit: {statementInvoice.issue_date}</p>
                                <p className="font-bold text-rose-600">
                                    Jatuh Tempo (TOP Net {contract.payment_term_days}): {statementInvoice.due_date}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs">
                            <div>
                                <p className="font-bold uppercase text-slate-400 text-[10px]">Ditagihkan Kepada:</p>
                                <p className="mt-0.5 font-black text-sm text-slate-900">{contract.partner_name}</p>
                                {contract.partner_address && <p className="text-slate-600">{contract.partner_address}</p>}
                                {contract.pic_name && <p className="mt-1 text-slate-600">u.p. {contract.pic_name} ({contract.pic_phone || contract.pic_email})</p>}
                            </div>
                            <div className="text-right">
                                <p className="font-bold uppercase text-slate-400 text-[10px]">Ketentuan Pajak & Pembayaran:</p>
                                <p className="mt-0.5 font-semibold text-slate-700">
                                    Termin: Net {contract.payment_term_days} Hari Kalender
                                </p>
                                <p className="text-slate-600">
                                    {contract.tax_included ? 'Termasuk PPN 11%' : 'Tanpa PPN'} • PPh Pasal 23: {statementInvoice.withholding_tax_pct}%
                                </p>
                            </div>
                        </div>

                        <table className="mt-5 w-full border-collapse text-xs">
                            <thead>
                                <tr className="border-b-2 border-slate-300 text-left text-[11px] font-bold uppercase text-slate-600">
                                    <th className="py-2">No</th>
                                    <th className="py-2">Rincian Pemakaian Unit & Referensi Booking / PO</th>
                                    <th className="py-2 text-right">Jumlah (Rp)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {statementInvoice.lines.map((line, idx) => (
                                    <tr key={line.id}>
                                        <td className="py-2.5 text-slate-500">{idx + 1}</td>
                                        <td className="py-2.5 font-medium text-slate-800">{line.description}</td>
                                        <td className="py-2.5 text-right font-semibold text-slate-900">
                                            {formatIdr(line.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-5 flex justify-end">
                            <div className="w-full max-w-sm space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Dasar Pengenaan Pajak (DPP / Subtotal):</span>
                                    <span className="font-bold">{formatIdr(statementInvoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">PPN 11%:</span>
                                    <span className="font-bold">{formatIdr(statementInvoice.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm">
                                    <span className="font-black">Total Tagihan Invoice:</span>
                                    <span className="font-black text-indigo-700">{formatIdr(statementInvoice.total)}</span>
                                </div>
                                {statementInvoice.withholding_amount > 0 && (
                                    <>
                                        <div className="flex justify-between text-amber-700">
                                            <span>Potongan PPh Pasal 23 ({statementInvoice.withholding_tax_pct}% × DPP):</span>
                                            <span>-{formatIdr(statementInvoice.withholding_amount)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-black text-emerald-700">
                                            <span>Nominal Transfer Bersih (+ Bukti Potong):</span>
                                            <span>{formatIdr(statementInvoice.net_cash_expected)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {statementInvoice.notes && (
                            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] whitespace-pre-line text-slate-600">
                                {statementInvoice.notes}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200 pt-4 print:hidden">
                            <button
                                type="button"
                                onClick={() => setStatementInvoice(null)}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                            >
                                🖨️ Cetak / Simpan PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete / Soft Delete Confirmation */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-lg">
                                ⚠️
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Hapus Kontrak Korporat?
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {contract.code} — {contract.title}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                            <p className="font-semibold">
                                Perhatian penting penghapusan (Soft Delete):
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-700 dark:text-amber-300">
                                <li>
                                    Kontrak akan diarsipkan dan disembunyikan dari daftar aktif.
                                </li>
                                {rentals.length > 0 && (
                                    <li>
                                        Tautan <strong>{rentals.length} booking sewa</strong> akan dilepaskan dari kontrak ini (data unit dan sewa tetap tersimpan aman).
                                    </li>
                                )}
                                {invoices.length > 0 && (
                                    <li>
                                        <strong>{invoices.length} invoice</strong> yang pernah diterbitkan tetap aman di pembukuan dan modul Invoicing.
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={confirmDeleteContract}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kontrak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModuleLayout>
    );
}

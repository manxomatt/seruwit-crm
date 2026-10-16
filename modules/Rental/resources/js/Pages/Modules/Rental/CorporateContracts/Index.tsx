import LanguageSwitcher from '@/Components/LanguageSwitcher';
import PageHeader from '@/Components/PageHeader';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import RentalNav from '../../../../RentalNav';

interface ContractRow {
    id: number;
    code: string;
    title: string;
    partner_id: number;
    partner_name: string;
    partner_phone: string | null;
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

interface PartnerOption {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
}

interface Props {
    contracts: ContractRow[];
    kpis: {
        active_contracts: number;
        active_units: number;
        total_unbilled: number;
        total_outstanding_ar: number;
    };
    partners: PartnerOption[];
    filters: {
        status: string;
        billing_cycle: string;
        search: string;
    };
}

const formatIdr = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const CYCLE_LABELS: Record<string, string> = {
    monthly: 'Bulanan (Consolidated)',
    biweekly: '2 Mingguan (Bi-Weekly)',
    per_trip: 'Per Sewa (Per Trip)',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    active: {
        label: 'Aktif',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
    draft: {
        label: 'Draft',
        className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    expired: {
        label: 'Berakhir',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    },
    terminated: {
        label: 'Dihentikan',
        className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    },
};

export default function CorporateContractsIndex({ contracts, kpis, partners, filters }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showModal, setShowModal] = useState(false);
    const [editingContract, setEditingContract] = useState<ContractRow | null>(null);

    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

    const form = useForm({
        partner_id: partners[0]?.id ? String(partners[0].id) : '',
        title: '',
        po_number: '',
        pic_name: '',
        pic_phone: '',
        pic_email: '',
        start_date: today,
        end_date: nextYear,
        billing_cycle: 'monthly',
        payment_term_days: 30,
        credit_limit: 50000000,
        discount_pct: 0,
        tax_included: true,
        withholding_tax_pct: 2,
        sla_replacement_hours: 4,
        status: 'active',
        notes: '',
    });

    const openCreateModal = () => {
        setEditingContract(null);
        form.setData({
            partner_id: partners[0]?.id ? String(partners[0].id) : '',
            title: '',
            po_number: '',
            pic_name: '',
            pic_phone: '',
            pic_email: '',
            start_date: today,
            end_date: nextYear,
            billing_cycle: 'monthly',
            payment_term_days: 30,
            credit_limit: 50000000,
            discount_pct: 0,
            tax_included: true,
            withholding_tax_pct: 2,
            sla_replacement_hours: 4,
            status: 'active',
            notes: '',
        });
        form.clearErrors();
        setShowModal(true);
    };

    const openEditModal = (contract: ContractRow) => {
        setEditingContract(contract);
        form.setData({
            partner_id: String(contract.partner_id),
            title: contract.title,
            po_number: contract.po_number || '',
            pic_name: contract.pic_name || '',
            pic_phone: contract.pic_phone || '',
            pic_email: contract.pic_email || '',
            start_date: contract.start_date || today,
            end_date: contract.end_date || nextYear,
            billing_cycle: contract.billing_cycle,
            payment_term_days: contract.payment_term_days,
            credit_limit: contract.credit_limit,
            discount_pct: contract.discount_pct,
            tax_included: contract.tax_included,
            withholding_tax_pct: contract.withholding_tax_pct,
            sla_replacement_hours: contract.sla_replacement_hours,
            status: contract.status,
            notes: contract.notes || '',
        });
        form.clearErrors();
        setShowModal(true);
    };

    const applyFilter = (next: Partial<typeof filters>) => {
        router.get(
            prefixedRoute('rental.corporate.index'),
            {
                status: next.status ?? filters.status,
                billing_cycle: next.billing_cycle ?? filters.billing_cycle,
                search: next.search ?? search,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const submitContract = (e: FormEvent) => {
        e.preventDefault();
        if (editingContract) {
            form.put(prefixedRoute('rental.corporate.update', editingContract.id), {
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        } else {
            form.post(prefixedRoute('rental.corporate.store'), {
                preserveScroll: true,
                onSuccess: () => setShowModal(false),
            });
        }
    };

    return (
        <ModuleLayout
            header={
                <PageHeader
                    title="Kontrak Sewa Korporat (B2B) & Tagihan Gabungan"
                    subtitle="Kelola kontrak sewa jangka panjang perusahaan, plafon kredit (TOP), SLA unit pengganti, dan penerbitan Consolidated Monthly Invoice."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <LanguageSwitcher compact />
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
                            >
                                <span>+ Kontrak Korporat Baru</span>
                            </button>
                        </div>
                    }
                />
            }
        >
            <Head title="Kontrak Sewa Korporat (B2B)" />

            <RentalNav />

            {/* KPI Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kontrak B2B Aktif</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-lg">🏢</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{kpis.active_contracts}</p>
                    <p className="mt-1 text-xs text-slate-500">Perusahaan dengan kontrak sewa berjalan</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Korporat Berjalan</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-lg">🚘</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.active_units} Unit</p>
                    <p className="mt-1 text-xs text-slate-500">Total kendaraan sedang disewa klien B2B</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Siap Dikonsolidasi (Unbilled)</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-lg">📑</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400">{formatIdr(kpis.total_unbilled)}</p>
                    <p className="mt-1 text-xs text-slate-500">Tagihan sewa berjalan yang belum di-invoice</p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Piutang B2B (Outstanding AR)</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-lg">💳</span>
                    </div>
                    <p className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400">{formatIdr(kpis.total_outstanding_ar)}</p>
                    <p className="mt-1 text-xs text-slate-500">Invoice gabungan terbit menunggu pelunasan TOP</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { key: 'all', label: 'Semua Status' },
                        { key: 'active', label: 'Aktif' },
                        { key: 'draft', label: 'Draft' },
                        { key: 'expired', label: 'Berakhir' },
                        { key: 'terminated', label: 'Dihentikan' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => applyFilter({ status: tab.key })}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                                filters.status === tab.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={filters.billing_cycle}
                        onChange={(e) => applyFilter({ billing_cycle: e.target.value })}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                        <option value="all">Semua Siklus Tagihan</option>
                        <option value="monthly">Bulanan (Consolidated)</option>
                        <option value="biweekly">2 Mingguan (Bi-Weekly)</option>
                        <option value="per_trip">Per Sewa (Per Trip)</option>
                    </select>

                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari perusahaan, kode B2B, No. PO, PIC..."
                            className="w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-slate-900 dark:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                        >
                            Cari
                        </button>
                    </form>
                </div>
            </div>

            {/* Contracts Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-3.5">Kontrak & No. PO</th>
                                <th className="px-4 py-3.5">Perusahaan Klien & PIC</th>
                                <th className="px-4 py-3.5">Periode & SLA</th>
                                <th className="px-4 py-3.5">Termin & Pajak</th>
                                <th className="px-4 py-3.5">Utilisasi Plafon Kredit</th>
                                <th className="px-4 py-3.5 text-center">Unit & Unbilled</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                                <th className="px-4 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Belum ada Kontrak Sewa Korporat (B2B)
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Buat kontrak korporat untuk mengelola sewa bulanan perusahaan, batas kredit TOP, dan penggabungan beberapa sewa ke dalam 1 invoice bulanan.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={openCreateModal}
                                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                                        >
                                            + Buat Kontrak Korporat Pertama
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((c) => {
                                    const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                                    const overLimit = c.credit_limit > 0 && c.credit_used > c.credit_limit;
                                    const nearLimit = c.credit_limit > 0 && c.credit_utilization_pct >= 80 && !overLimit;

                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                            <td className="px-4 py-3.5 align-top">
                                                <Link
                                                    href={prefixedRoute('rental.corporate.show', c.id)}
                                                    className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    {c.code}
                                                </Link>
                                                <p className="mt-0.5 font-bold text-slate-900 dark:text-white">{c.title}</p>
                                                {c.po_number && (
                                                    <span className="mt-1 inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                                        PO: {c.po_number}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 align-top">
                                                <p className="font-bold text-slate-900 dark:text-white">{c.partner_name}</p>
                                                {c.pic_name && (
                                                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                                                        PIC: <span className="font-semibold">{c.pic_name}</span>
                                                    </p>
                                                )}
                                                {(c.pic_phone || c.partner_phone) && (
                                                    <p className="text-[11px] text-slate-500">{c.pic_phone || c.partner_phone}</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 align-top">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {c.start_date} → {c.end_date}
                                                </p>
                                                <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                                    ⚡ SLA Ganti Unit: Maks {c.sla_replacement_hours} Jam
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 align-top">
                                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                                    {CYCLE_LABELS[c.billing_cycle] || c.billing_cycle}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                                                    TOP: <span className="font-bold">Net {c.payment_term_days} Hari</span>
                                                    {c.discount_pct > 0 ? ` • Diskon ${c.discount_pct}%` : ''}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-slate-500">
                                                    {c.tax_included ? 'PPN 11% Aktif' : 'Non-PPN'} • PPh 23: {c.withholding_tax_pct}%
                                                </p>
                                            </td>

                                            <td className="px-4 py-3.5 align-top min-w-[200px]">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        {formatIdr(c.credit_used)}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        / {c.credit_limit > 0 ? formatIdr(c.credit_limit) : 'Tanpa Batas'}
                                                    </span>
                                                </div>
                                                {c.credit_limit > 0 && (
                                                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                overLimit
                                                                    ? 'bg-rose-600'
                                                                    : nearLimit
                                                                      ? 'bg-amber-500'
                                                                      : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${Math.min(100, c.credit_utilization_pct)}%` }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                                    <span>Unbilled: {formatIdr(c.unbilled_amount)}</span>
                                                    <span>AR: {formatIdr(c.outstanding_ar)}</span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 align-top text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {c.active_rentals_count} Aktif / {c.total_rentals_count} Booking
                                                    </span>
                                                    {c.unbilled_rentals_count > 0 && (
                                                        <span className="mt-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                                            {c.unbilled_rentals_count} belum di-invoice
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 align-top text-center">
                                                <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3.5 align-top text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <Link
                                                        href={prefixedRoute('rental.corporate.show', c.id)}
                                                        className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                                                    >
                                                        Kelola & Tagihan ➔
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(c)}
                                                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    {editingContract ? `Edit Kontrak Korporat ${editingContract.code}` : 'Buat Kontrak Sewa Korporat (B2B)'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Atur kesepakatan sewa perusahaan, termin pembayaran (TOP), batas kredit, dan pajak PPh 23.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitContract} className="mt-4 space-y-4 text-xs">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Perusahaan Klien (Partner) *
                                    </label>
                                    <select
                                        value={form.data.partner_id}
                                        onChange={(e) => form.setData('partner_id', e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    >
                                        <option value="">-- Pilih Partner Perusahaan --</option>
                                        {partners.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.phone ? `(${p.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.partner_id && <p className="mt-1 text-rose-600">{form.errors.partner_id}</p>}
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Judul Kontrak / Nama Proyek *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.title}
                                        onChange={(e) => form.setData('title', e.target.value)}
                                        placeholder="Cth: Sewa Kendaraan Operasional Direksi 2026"
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                    {form.errors.title && <p className="mt-1 text-rose-600">{form.errors.title}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Nomor PO Induk / SPK
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.po_number}
                                        onChange={(e) => form.setData('po_number', e.target.value)}
                                        placeholder="Cth: PO/2026/CORP/089"
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Nama PIC Klien (GA / Procurement)
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.pic_name}
                                        onChange={(e) => form.setData('pic_name', e.target.value)}
                                        placeholder="Nama penanggung jawab"
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        No. WhatsApp / Telp PIC
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.pic_phone}
                                        onChange={(e) => form.setData('pic_phone', e.target.value)}
                                        placeholder="0812..."
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Email Finance / Penagihan
                                    </label>
                                    <input
                                        type="email"
                                        value={form.data.pic_email}
                                        onChange={(e) => form.setData('pic_email', e.target.value)}
                                        placeholder="finance@perusahaan.co.id"
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Tanggal Mulai Kontrak *
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(e) => form.setData('start_date', e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Tanggal Berakhir Kontrak *
                                    </label>
                                    <input
                                        type="date"
                                        value={form.data.end_date}
                                        onChange={(e) => form.setData('end_date', e.target.value)}
                                        required
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Siklus Tagihan (Billing Cycle) *
                                    </label>
                                    <select
                                        value={form.data.billing_cycle}
                                        onChange={(e) => form.setData('billing_cycle', e.target.value as any)}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    >
                                        <option value="monthly">Bulanan Gabungan (Consolidated)</option>
                                        <option value="biweekly">2 Mingguan (Bi-Weekly)</option>
                                        <option value="per_trip">Per Perjalanan (Per Trip)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Termin Pembayaran (TOP Hari) *
                                    </label>
                                    <select
                                        value={form.data.payment_term_days}
                                        onChange={(e) => form.setData('payment_term_days', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    >
                                        <option value={7}>Net 7 Hari</option>
                                        <option value={14}>Net 14 Hari</option>
                                        <option value={30}>Net 30 Hari</option>
                                        <option value={45}>Net 45 Hari</option>
                                        <option value={60}>Net 60 Hari</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Plafon Kredit / Credit Limit (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1000000}
                                        value={form.data.credit_limit}
                                        onChange={(e) => form.setData('credit_limit', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Diskon Kontrak (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={form.data.discount_pct}
                                        onChange={(e) => form.setData('discount_pct', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Potongan PPh 23 (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        step={0.5}
                                        value={form.data.withholding_tax_pct}
                                        onChange={(e) => form.setData('withholding_tax_pct', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        SLA Ganti Unit (Jam) *
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={72}
                                        value={form.data.sla_replacement_hours}
                                        onChange={(e) => form.setData('sla_replacement_hours', Number(e.target.value))}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                                        Status Kontrak *
                                    </label>
                                    <select
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value as any)}
                                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="draft">Draft</option>
                                        <option value="expired">Berakhir</option>
                                        <option value="terminated">Dihentikan</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                                <input
                                    id="tax_included"
                                    type="checkbox"
                                    checked={form.data.tax_included}
                                    onChange={(e) => form.setData('tax_included', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                                />
                                <label htmlFor="tax_included" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    Terapkan PPN 11% otomatis saat menerbitkan Consolidated Invoice untuk kontrak ini
                                </label>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 dark:text-slate-300">
                                    Catatan Kontrak / Klausul Khusus
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Catatan ketentuan khusus, kuota kilometer korporat, atau instruksi penagihan faktur pajak..."
                                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {form.processing ? 'Menyimpan...' : editingContract ? 'Simpan Perubahan' : 'Buat Kontrak B2B'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ModuleLayout>
    );
}

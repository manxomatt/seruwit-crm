import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Select, { type SelectOption } from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ModuleLayout from '@/Layouts/ModuleLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import RentalNav from '../../../../../../Rental/resources/js/RentalNav';

interface PartnerOption {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
}

interface ContractPayload {
    id: number;
    code: string;
    partner_id: number;
    title: string;
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
}

interface Props {
    suggestedCode: string;
    partners: PartnerOption[];
    contract: ContractPayload | null;
}

const formatIdr = (value: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value || 0);

const BILLING_CYCLE_OPTIONS: SelectOption[] = [
    {
        value: 'monthly',
        label: 'Bulanan Gabungan (Consolidated Monthly)',
        description: 'Seluruh booking dalam 1 bulan digabung menjadi 1 invoice korporat',
        badge: 'Rekomendasi B2B',
    },
    {
        value: 'biweekly',
        label: '2 Mingguan (Bi-Weekly Consolidated)',
        description: 'Tagihan gabungan diterbitkan setiap 2 minggu sekali',
    },
    {
        value: 'per_trip',
        label: 'Per Perjalanan / Booking (Per Trip)',
        description: 'Setiap booking diterbitkan invoice tersendiri sesuai TOP kontrak',
    },
];

const PAYMENT_TERM_OPTIONS: SelectOption[] = [
    { value: '7', label: 'Net 7 Hari', description: 'Jatuh tempo 7 hari kalender sejak tanggal terbit invoice' },
    { value: '14', label: 'Net 14 Hari', description: 'Jatuh tempo 14 hari kalender sejak tanggal terbit invoice' },
    { value: '30', label: 'Net 30 Hari', description: 'Standar B2B korporat — jatuh tempo 30 hari kalender', badge: 'Populer' },
    { value: '45', label: 'Net 45 Hari', description: 'Jatuh tempo 45 hari kalender sejak tanggal terbit invoice' },
    { value: '60', label: 'Net 60 Hari', description: 'Jatuh tempo 60 hari kalender sejak tanggal terbit invoice' },
];

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Aktif (Active)', description: 'Kontrak berlaku aktif dan siap ditautkan ke booking sewa' },
    { value: 'draft', label: 'Draft / Negosiasi', description: 'Kontrak masih dalam tahap review atau penandatanganan SPK' },
    { value: 'expired', label: 'Berakhir (Expired)', description: 'Masa berlaku kontrak telah selesai' },
    { value: 'terminated', label: 'Dihentikan (Terminated)', description: 'Kontrak dihentikan sebelum masa berakhir' },
];

export default function CorporateContractForm({ suggestedCode, partners, contract }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const isEditing = Boolean(contract);

    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

    const form = useForm({
        partner_id: contract ? String(contract.partner_id) : partners[0]?.id ? String(partners[0].id) : '',
        title: contract?.title ?? '',
        po_number: contract?.po_number ?? '',
        pic_name: contract?.pic_name ?? '',
        pic_phone: contract?.pic_phone ?? (partners[0]?.phone ?? ''),
        pic_email: contract?.pic_email ?? (partners[0]?.email ?? ''),
        start_date: contract?.start_date ?? today,
        end_date: contract?.end_date ?? nextYear,
        billing_cycle: contract?.billing_cycle ?? 'monthly',
        payment_term_days: contract?.payment_term_days ?? 30,
        credit_limit: contract?.credit_limit ?? 50000000,
        discount_pct: contract?.discount_pct ?? 0,
        tax_included: contract?.tax_included ?? true,
        withholding_tax_pct: contract?.withholding_tax_pct ?? 2,
        sla_replacement_hours: contract?.sla_replacement_hours ?? 4,
        status: contract?.status ?? 'active',
        notes: contract?.notes ?? '',
    });

    const partnerOptions: SelectOption[] = useMemo(
        () => [
            { value: '', label: '-- Pilih Perusahaan / Partner Klien --' },
            ...partners.map((p) => ({
                value: String(p.id),
                label: p.name,
                description: [p.phone, p.email].filter(Boolean).join(' • ') || undefined,
                badge: `ID #${p.id}`,
            })),
        ],
        [partners]
    );

    const selectedPartner = useMemo(
        () => partners.find((p) => String(p.id) === String(form.data.partner_id)),
        [partners, form.data.partner_id]
    );

    const handlePartnerChange = (partnerId: string) => {
        const found = partners.find((p) => String(p.id) === partnerId);
        form.setData((prev) => ({
            ...prev,
            partner_id: partnerId,
            pic_phone: !prev.pic_phone && found?.phone ? found.phone : prev.pic_phone,
            pic_email: !prev.pic_email && found?.email ? found.email : prev.pic_email,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isEditing && contract) {
            form.put(prefixedRoute('rental.corporate.update', contract.id));
        } else {
            form.post(prefixedRoute('rental.corporate.store'));
        }
    };

    return (
        <ModuleLayout
            header={
                <PageHeader
                    title={isEditing ? `Edit Kontrak Korporat ${contract?.code}` : 'Buat Kontrak Sewa Korporat (B2B)'}
                    subtitle="Atur kesepakatan sewa jangka panjang perusahaan, plafon kredit (TOP), SLA kendaraan pengganti, dan skema PPN / PPh 23."
                    actions={
                        <Link
                            href={
                                    isEditing && contract
                                        ? prefixedRoute('rental.corporate.show', contract.id)
                                        : prefixedRoute('rental.corporate.index')
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                            >
                                ← {isEditing ? 'Kembali ke Detail Kontrak' : 'Kembali ke Daftar Kontrak B2B'}
                            </Link>
                    }
                />
            }
        >
            <Head title={isEditing ? `Edit Kontrak ${contract?.code}` : 'Buat Kontrak Sewa Korporat (B2B)'} />

            <RentalNav />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Form Column (2/3 width) */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Card 1: Identitas Perusahaan & Kontrak */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>🏢</span> Identitas Perusahaan Klien & Referensi SPK / PO
                                </h3>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Pilih partner perusahaan dan cantumkan nomor PO Induk / SPK yang akan tertera pada setiap Consolidated Invoice.
                                </p>
                            </div>
                            <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">
                                {suggestedCode}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="partner_id" value="Perusahaan Klien (Partner B2B) *" />
                                <div className="mt-1">
                                    <Select
                                        id="partner_id"
                                        value={form.data.partner_id}
                                        onChange={handlePartnerChange}
                                        options={partnerOptions}
                                        searchable
                                        placeholder="-- Pilih Perusahaan Klien --"
                                        searchPlaceholder="Ketik nama perusahaan, nomor telepon, atau email..."
                                    />
                                </div>
                                <InputError message={form.errors.partner_id} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="title" value="Judul Kontrak / Nama Proyek *" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="Cth: Kontrak Sewa Kendaraan Operasional Direksi & Cabang 2026"
                                    className="mt-1 w-full text-xs"
                                    required
                                />
                                <InputError message={form.errors.title} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="po_number" value="Nomor PO Induk / SPK Klien" />
                                <TextInput
                                    id="po_number"
                                    type="text"
                                    value={form.data.po_number}
                                    onChange={(e) => form.setData('po_number', e.target.value)}
                                    placeholder="Cth: PO/2026/GA-CORP/0089"
                                    className="mt-1 w-full font-mono text-xs"
                                />
                                <InputError message={form.errors.po_number} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status Kontrak *" />
                                <div className="mt-1">
                                    <Select
                                        id="status"
                                        value={form.data.status}
                                        onChange={(val) => form.setData('status', val as any)}
                                        options={STATUS_OPTIONS}
                                        searchable={false}
                                    />
                                </div>
                                <InputError message={form.errors.status} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Kontak PIC & Masa Berlaku */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>👤</span> Penanggung Jawab (PIC Klien) & Masa Berlaku Kontrak
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Informasi pejabat GA / Procurement / Finance klien untuk pengiriman tagihan gabungan dan koordinasi operasional.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="pic_name" value="Nama PIC (GA / Procurement)" />
                                <TextInput
                                    id="pic_name"
                                    type="text"
                                    value={form.data.pic_name}
                                    onChange={(e) => form.setData('pic_name', e.target.value)}
                                    placeholder="Nama lengkap PIC"
                                    className="mt-1 w-full text-xs"
                                />
                                <InputError message={form.errors.pic_name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="pic_phone" value="No. WhatsApp / Telepon PIC" />
                                <TextInput
                                    id="pic_phone"
                                    type="text"
                                    value={form.data.pic_phone}
                                    onChange={(e) => form.setData('pic_phone', e.target.value)}
                                    placeholder="0812..."
                                    className="mt-1 w-full text-xs"
                                />
                                <InputError message={form.errors.pic_phone} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="pic_email" value="Email Finance / Penagihan" />
                                <TextInput
                                    id="pic_email"
                                    type="email"
                                    value={form.data.pic_email}
                                    onChange={(e) => form.setData('pic_email', e.target.value)}
                                    placeholder="finance@perusahaan.co.id"
                                    className="mt-1 w-full text-xs"
                                />
                                <InputError message={form.errors.pic_email} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="start_date" value="Tanggal Mulai Kontrak *" />
                                <TextInput
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    required
                                />
                                <InputError message={form.errors.start_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_date" value="Tanggal Berakhir Kontrak *" />
                                <TextInput
                                    id="end_date"
                                    type="date"
                                    value={form.data.end_date}
                                    onChange={(e) => form.setData('end_date', e.target.value)}
                                    className="mt-1 w-full text-xs"
                                    required
                                />
                                <InputError message={form.errors.end_date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="sla_replacement_hours" value="SLA Kendaraan Pengganti (Jam) *" />
                                <TextInput
                                    id="sla_replacement_hours"
                                    type="number"
                                    min={1}
                                    max={72}
                                    value={form.data.sla_replacement_hours}
                                    onChange={(e) => form.setData('sla_replacement_hours', Number(e.target.value))}
                                    className="mt-1 w-full text-xs"
                                    required
                                />
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Batas waktu maksimal penyediaan mobil pengganti saat unit mogok/servis.
                                </p>
                                <InputError message={form.errors.sla_replacement_hours} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Skema Tagihan Gabungan, TOP & Pajak B2B */}
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>💳</span> Skema Tagihan Gabungan (Consolidated Billing), TOP & Pajak
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Konfigurasi siklus penagihan, plafon kredit berjalan, diskon korporat, PPN 11%, dan potongan PPh Pasal 23.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="billing_cycle" value="Siklus Tagihan (Billing Cycle) *" />
                                <div className="mt-1">
                                    <Select
                                        id="billing_cycle"
                                        value={form.data.billing_cycle}
                                        onChange={(val) => form.setData('billing_cycle', val as any)}
                                        options={BILLING_CYCLE_OPTIONS}
                                        searchable={false}
                                    />
                                </div>
                                <InputError message={form.errors.billing_cycle} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="payment_term_days" value="Termin Pembayaran (TOP) *" />
                                <div className="mt-1">
                                    <Select
                                        id="payment_term_days"
                                        value={String(form.data.payment_term_days)}
                                        onChange={(val) => form.setData('payment_term_days', Number(val))}
                                        options={PAYMENT_TERM_OPTIONS}
                                        searchable={false}
                                    />
                                </div>
                                <InputError message={form.errors.payment_term_days} className="mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            <div>
                                <InputLabel htmlFor="credit_limit" value="Plafon Kredit / Credit Limit (Rp) *" />
                                <TextInput
                                    id="credit_limit"
                                    type="number"
                                    min={0}
                                    step={1000000}
                                    value={form.data.credit_limit}
                                    onChange={(e) => form.setData('credit_limit', Number(e.target.value))}
                                    className="mt-1 w-full text-xs font-bold"
                                    required
                                />
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {[25000000, 50000000, 100000000, 250000000].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => form.setData('credit_limit', preset)}
                                            className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"
                                        >
                                            {preset / 1000000} Jt
                                        </button>
                                    ))}
                                </div>
                                <InputError message={form.errors.credit_limit} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="discount_pct" value="Diskon Kontrak Korporat (%)" />
                                <TextInput
                                    id="discount_pct"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={form.data.discount_pct}
                                    onChange={(e) => form.setData('discount_pct', Number(e.target.value))}
                                    className="mt-1 w-full text-xs"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Otomatis memotong subtotal saat konsolidasi invoice.
                                </p>
                                <InputError message={form.errors.discount_pct} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="withholding_tax_pct" value="Potongan PPh Pasal 23 (%)" />
                                <TextInput
                                    id="withholding_tax_pct"
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={0.5}
                                    value={form.data.withholding_tax_pct}
                                    onChange={(e) => form.setData('withholding_tax_pct', Number(e.target.value))}
                                    className="mt-1 w-full text-xs"
                                />
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Umumnya 2% atas jasa sewa kendaraan (dengan Bukti Potong).
                                </p>
                                <InputError message={form.errors.withholding_tax_pct} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 p-3.5">
                            <input
                                id="tax_included"
                                type="checkbox"
                                checked={form.data.tax_included}
                                onChange={(e) => form.setData('tax_included', e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="tax_included" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                                Terapkan PPN 11% (Faktur Pajak) secara otomatis saat menerbitkan Consolidated Invoice untuk kontrak ini
                            </label>
                        </div>

                        <div>
                            <InputLabel htmlFor="notes" value="Catatan Kontrak / Klausul Khusus" />
                            <textarea
                                id="notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Tuliskan klausul khusus, kuota kilometer bulanan, syarat penggantian unit, atau instruksi pengiriman faktur pajak..."
                                className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <InputError message={form.errors.notes} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Summary & Submit Card (1/3 width) */}
                <div className="space-y-6">
                    <div className="sticky top-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                Ringkasan Kontrak B2B
                            </span>
                            <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">
                                {selectedPartner?.name || 'Belum Memilih Perusahaan'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {form.data.title || 'Judul kontrak belum diisi'}
                            </p>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Kode Kontrak</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{suggestedCode}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">No. PO Induk</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                                    {form.data.po_number || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Masa Berlaku</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {form.data.start_date} → {form.data.end_date}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Termin Pembayaran</span>
                                <span className="font-black text-indigo-600 dark:text-indigo-400">
                                    Net {form.data.payment_term_days} Hari
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Plafon Kredit</span>
                                <span className="font-black text-slate-900 dark:text-white">
                                    {formatIdr(Number(form.data.credit_limit) || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Diskon Korporat</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {form.data.discount_pct || 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Skema Pajak</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {form.data.tax_included ? 'PPN 11%' : 'Non-PPN'} • PPh 23 ({form.data.withholding_tax_pct || 0}%)
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">SLA Ganti Unit</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    Maks {form.data.sla_replacement_hours} Jam
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            💡 Setelah kontrak dibuat, Anda dapat menautkan berbagai booking sewa milik <strong>{selectedPartner?.name || 'klien ini'}</strong> dan menerbitkan <strong>1 Consolidated Monthly Invoice</strong> setiap akhir periode.
                        </div>

                        <div className="flex flex-col gap-2.5 pt-2">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {form.processing
                                    ? 'Menyimpan Kontrak...'
                                    : isEditing
                                      ? 'Simpan Perubahan Kontrak B2B'
                                      : 'Buat & Aktifkan Kontrak B2B'}
                            </button>
                            <Link
                                href={
                                    isEditing && contract
                                        ? prefixedRoute('rental.corporate.show', contract.id)
                                        : prefixedRoute('rental.corporate.index')
                                }
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            >
                                Batal
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </ModuleLayout>
    );
}

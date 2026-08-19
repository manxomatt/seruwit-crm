import DangerButton from '@/Components/DangerButton';
import HtmlEditor from '@/Components/HtmlEditor';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import React, { FormEventHandler, useState } from 'react';

interface DocumentTemplate {
    name: string;
    layout_preset: string;
    content: Record<string, string>;
    options: Record<string, boolean>;
}

interface DocumentsPanelProps {
    documents: Record<string, DocumentTemplate>;
    prefixedRoute: (name: string, params?: Record<string, unknown>) => string;
}

interface LayoutOption {
    value: string;
    label: string;
    badge: string;
    description: string;
    icon: string;
    features: string[];
}

const LAYOUT_PRESETS: LayoutOption[] = [
    {
        value: 'classic',
        label: 'Classic Standard',
        badge: 'Formal',
        description: 'Tata letak klasik yang rapi dengan kop dokumen simetris, tabel proporsional, dan garis pembatas bersih.',
        icon: '🏛️',
        features: ['Kop surat standar', 'Tabel data rapi', 'Border elegan'],
    },
    {
        value: 'compact',
        label: 'Compact Efficient',
        badge: 'Hemat Ruang',
        description: 'Format padat dengan margin efisien. Sangat ideal untuk mencetak dokumen dalam 1 halaman tanpa terpotong.',
        icon: '⚡',
        features: ['Margin ringkas', 'Spasi padat', 'Cetak 1 lembar'],
    },
    {
        value: 'corporate',
        label: 'Corporate Modern',
        badge: 'Premium',
        description: 'Gaya modern dengan aksen warna brand profesional, tipografi tegas, dan layout informasi berstruktur tinggi.',
        icon: '🏢',
        features: ['Header beraksen', 'Tipografi modern', 'Struktur premium'],
    },
];

interface DocumentMeta {
    code: string;
    label: string;
    category: string;
    icon: string;
    badge: string;
    description: string;
    color: {
        bg: string;
        text: string;
        badge: string;
        border: string;
        activeRing: string;
    };
}

const DOCUMENT_ITEMS: DocumentMeta[] = [
    {
        code: 'rental_contract',
        label: 'Kontrak Sewa Kendaraan',
        category: 'Perjanjian & Legalitas',
        icon: '📄',
        badge: 'Perjanjian Sewa',
        description: 'Surat perjanjian resmi sewa armada, rincian biaya & deposit, klausul ketentuan hukum, dan tanda tangan para pihak.',
        color: {
            bg: 'bg-indigo-50 dark:bg-indigo-950/40',
            text: 'text-indigo-600 dark:text-indigo-400',
            badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
            border: 'border-indigo-200 dark:border-indigo-800',
            activeRing: 'ring-indigo-500',
        },
    },
    {
        code: 'rental_handover',
        label: 'Berita Acara Serah Terima',
        category: 'Operasional & Inspeksi',
        icon: '📋',
        badge: 'Handover & Return',
        description: 'Formulir serah terima kendaraan saat checkout dan return, checklist kondisi fisik armada, BBM, KM, dan catatan goresan.',
        color: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
            border: 'border-emerald-200 dark:border-emerald-800',
            activeRing: 'ring-emerald-500',
        },
    },
    {
        code: 'rental_invoice',
        label: 'Faktur & Invoice Tagihan',
        category: 'Keuangan & Billing',
        icon: '🧾',
        badge: 'Faktur Pembayaran',
        description: 'Faktur tagihan sewa resmi, rincian item tagihan dan deposit, informasi rekening pembayaran, serta stempel lunas.',
        color: {
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            text: 'text-amber-600 dark:text-amber-400',
            badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
            border: 'border-amber-200 dark:border-amber-800',
            activeRing: 'ring-amber-500',
        },
    },
];

interface PlaceholderDefinition {
    tag: string;
    label: string;
    sample: string;
    category: string;
}

const PLACEHOLDER_DICTIONARY: Record<string, PlaceholderDefinition[]> = {
    rental_contract: [
        { tag: '{{ rental.code }}', label: 'Kode Booking Rental', sample: 'RNT-202608-001', category: 'Penyewaan' },
        { tag: '{{ rental.start_date }}', label: 'Tanggal Mulai Sewa', sample: '19/08/2026', category: 'Penyewaan' },
        { tag: '{{ rental.end_date }}', label: 'Tanggal Selesai Sewa', sample: '22/08/2026', category: 'Penyewaan' },
        { tag: '{{ rental.total_amount }}', label: 'Total Biaya Sewa', sample: 'Rp 1.500.000', category: 'Biaya' },
        { tag: '{{ rental.base_amount }}', label: 'Biaya Dasar Sewa', sample: 'Rp 1.200.000', category: 'Biaya' },
        { tag: '{{ rental.deposit_amount }}', label: 'Deposit Jaminan', sample: 'Rp 300.000', category: 'Biaya' },
        { tag: '{{ partner.name }}', label: 'Nama Lengkap Penyewa', sample: 'PT Maju Jaya Mandiri', category: 'Pihak' },
        { tag: '{{ partner.code }}', label: 'Kode Pelanggan', sample: 'CUST-0082', category: 'Pihak' },
        { tag: '{{ vehicle.name }}', label: 'Model Kendaraan', sample: 'Toyota Innova Zenix', category: 'Armada' },
        { tag: '{{ vehicle.plate_number }}', label: 'Nomor Plat Kendaraan', sample: 'B 1234 CD', category: 'Armada' },
        { tag: '{{ company.name }}', label: 'Nama Perusahaan Anda', sample: 'Seruwit Rental Mobil', category: 'Perusahaan' },
        { tag: '{{ today }}', label: 'Tanggal Cetak Hari Ini', sample: '19/08/2026', category: 'Waktu' },
    ],
    rental_handover: [
        { tag: '{{ rental.code }}', label: 'Kode Booking Rental', sample: 'RNT-202608-001', category: 'Penyewaan' },
        { tag: '{{ partner.name }}', label: 'Nama Lengkap Penyewa', sample: 'PT Maju Jaya Mandiri', category: 'Pihak' },
        { tag: '{{ vehicle.name }}', label: 'Model Kendaraan', sample: 'Toyota Innova Zenix', category: 'Armada' },
        { tag: '{{ vehicle.plate_number }}', label: 'Nomor Plat Kendaraan', sample: 'B 1234 CD', category: 'Armada' },
        { tag: '{{ checkout.time }}', label: 'Waktu Serah / Checkout', sample: '19/08/2026 09:00', category: 'Inspeksi' },
        { tag: '{{ return.time }}', label: 'Waktu Kembali / Return', sample: '22/08/2026 17:00', category: 'Inspeksi' },
        { tag: '{{ company.name }}', label: 'Nama Perusahaan Anda', sample: 'Seruwit Rental Mobil', category: 'Perusahaan' },
    ],
    rental_invoice: [
        { tag: '{{ invoice.code }}', label: 'Nomor Invoice', sample: 'INV-2026-0812', category: 'Invoice' },
        { tag: '{{ invoice.issue_date }}', label: 'Tanggal Terbit Invoice', sample: '19/08/2026', category: 'Invoice' },
        { tag: '{{ invoice.due_date }}', label: 'Tanggal Jatuh Tempo', sample: '26/08/2026', category: 'Invoice' },
        { tag: '{{ invoice.total }}', label: 'Total Tagihan', sample: 'Rp 1.500.000', category: 'Invoice' },
        { tag: '{{ partner.name }}', label: 'Nama Pelanggan / Ditagihkan', sample: 'PT Maju Jaya Mandiri', category: 'Pihak' },
        { tag: '{{ company.name }}', label: 'Nama Perusahaan Anda', sample: 'Seruwit Rental Mobil', category: 'Perusahaan' },
    ],
};

interface ToggleCardProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
    icon: string;
    disabled?: boolean;
}

function ToggleCard({
    id,
    checked,
    onChange,
    label,
    description,
    icon,
    disabled = false,
}: ToggleCardProps): JSX.Element {
    return (
        <label
            htmlFor={id}
            className={`group flex cursor-pointer items-start justify-between gap-3.5 rounded-2xl border p-4 transition-all ${
                checked
                    ? 'border-indigo-200 bg-indigo-50/50 shadow-xs dark:border-indigo-900/60 dark:bg-indigo-950/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
            <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm transition-colors ${
                        checked
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                        {label}
                    </span>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            <div className="relative shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="sr-only peer"
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 peer-checked:bg-indigo-600 transition-colors dark:bg-slate-700" />
                <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 shadow-xs" />
            </div>
        </label>
    );
}

interface SingleFormProps {
    code: string;
    template: DocumentTemplate;
    prefixedRoute: (name: string, params?: Record<string, unknown>) => string;
}

function SingleDocumentEditor({ code, template, prefixedRoute }: SingleFormProps): JSX.Element {
    const [confirmReset, setConfirmReset] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'preview' | 'placeholders'>('preview');
    const [copiedTag, setCopiedTag] = useState<string | null>(null);

    const initialContent = {
        title: template.content?.title || '',
        subtitle: template.content?.subtitle || '',
        intro_html: template.content?.intro_html || '',
        terms_html: template.content?.terms_html || '',
        notes_label: template.content?.notes_label || '',
        footer_html: template.content?.footer_html || '',
        checkout_label: template.content?.checkout_label || '',
        return_label: template.content?.return_label || '',
        bill_to_label: template.content?.bill_to_label || '',
    };

    const initialOptions = {
        show_logo: template.options?.show_logo ?? true,
        show_address: template.options?.show_address ?? true,
        show_phone: template.options?.show_phone ?? true,
        show_footer: template.options?.show_footer ?? true,
        show_signature: template.options?.show_signature ?? true,
        show_company_info: template.options?.show_company_info ?? true,
        show_damage_section: template.options?.show_damage_section ?? true,
        show_paid_stamp: template.options?.show_paid_stamp ?? true,
    };

    const { data, setData, patch, post, processing, errors, recentlySuccessful, isDirty, reset } = useForm({
        name: template.name || '',
        layout_preset: template.layout_preset || 'classic',
        content: initialContent,
        options: initialOptions,
    });

    const docMeta = DOCUMENT_ITEMS.find((d) => d.code === code) || DOCUMENT_ITEMS[0];
    const placeholders = PLACEHOLDER_DICTIONARY[code] || [];

    const handleCopyPlaceholder = (tag: string) => {
        navigator.clipboard.writeText(tag);
        setCopiedTag(tag);
        setTimeout(() => setCopiedTag(null), 2000);
    };

    const updateContentField = (field: keyof typeof initialContent, value: string) => {
        setData('content', {
            ...data.content,
            [field]: value,
        });
    };

    const updateOptionField = (field: keyof typeof initialOptions, value: boolean) => {
        setData('options', {
            ...data.options,
            [field]: value,
        });
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.documents.update', { code }), {
            preserveScroll: true,
        });
    };

    const handleConfirmReset = () => {
        setConfirmReset(false);
        post(prefixedRoute('rental.settings.documents.reset', { code }), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const previewPdf = () => {
        window.open(prefixedRoute('rental.settings.documents.preview', { code }), '_blank');
    };

    // Helper to render live preview subtitle with resolved sample placeholders
    const renderPreviewSubtitle = (text: string) => {
        let resolved = text;
        placeholders.forEach((p) => {
            resolved = resolved.replace(p.tag, p.sample);
        });
        return resolved;
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Top Toolbar / Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-bold shadow-xs ${docMeta.color.bg} ${docMeta.color.text}`}
                    >
                        {docMeta.icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {docMeta.label}
                            </h2>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${docMeta.color.badge}`}>
                                {data.layout_preset.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {docMeta.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={previewPdf}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        <span>👁️</span>
                        <span>Preview PDF Asli</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                        <span>🔄</span>
                        <span>Reset Default</span>
                    </button>

                    <PrimaryButton
                        type="submit"
                        disabled={processing}
                        className="py-2 px-4 text-xs font-bold shadow-md shadow-indigo-500/10"
                    >
                        {processing ? (
                            <>
                                <svg className="mr-1.5 h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Menyimpan…</span>
                            </>
                        ) : (
                            <>
                                <span>💾</span>
                                <span>Simpan Template</span>
                            </>
                        )}
                    </PrimaryButton>
                </div>
            </div>

            {recentlySuccessful && (
                <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-base">✅</span>
                    <span>Template dokumen <strong>{docMeta.label}</strong> berhasil diperbarui dan disimpan.</span>
                </div>
            )}

            {/* Main Studio Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Column: Form Configuration (7 cols) */}
                <div className="space-y-6 lg:col-span-7">
                    {/* Section 1: Template Info & Layout Preset */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold">
                                🎨
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Format & Preset Layout Dokumen
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Pilih gaya tata letak lembar cetak dan tentukan nama identitas template.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-5">
                            <div>
                                <InputLabel htmlFor="template_name" value="Nama Identitas Template" />
                                <TextInput
                                    id="template_name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    maxLength={500}
                                    placeholder="Contoh: Kontrak Rental Reguler Standard"
                                    className="mt-1.5 w-full text-sm font-semibold"
                                />
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                                    Pilihan Preset Layout Dokumen
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {LAYOUT_PRESETS.map((preset) => {
                                        const isSelected = data.layout_preset === preset.value;
                                        return (
                                            <button
                                                key={preset.value}
                                                type="button"
                                                onClick={() => setData('layout_preset', preset.value)}
                                                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                                                        : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-2xl">{preset.icon}</span>
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                isSelected
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}
                                                        >
                                                            {preset.badge}
                                                        </span>
                                                    </div>
                                                    <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                                                        {preset.label}
                                                    </h4>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        {preset.description}
                                                    </p>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                                                    {preset.features.map((feat) => (
                                                        <span
                                                            key={feat}
                                                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                        >
                                                            ✓ {feat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.layout_preset} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Document Content & Typography */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 font-bold">
                                ✍️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Struktur Konten & Teks Dokumen
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Sesuaikan judul, intro pengantar, klausul ketentuan, dan catatan kaki.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 space-y-5">
                            {/* Title & Subtitle */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="content_title" value="Judul Utama Dokumen" />
                                    <TextInput
                                        id="content_title"
                                        value={data.content.title}
                                        onChange={(e) => updateContentField('title', e.target.value)}
                                        maxLength={500}
                                        placeholder="Contoh: Perjanjian Sewa Kendaraan"
                                        className="mt-1.5 w-full text-sm font-semibold"
                                    />
                                    <InputError message={(errors as Record<string, string>)['content.title']} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="content_subtitle" value="Format Subjudul Dokumen" />
                                    <TextInput
                                        id="content_subtitle"
                                        value={data.content.subtitle}
                                        onChange={(e) => updateContentField('subtitle', e.target.value)}
                                        maxLength={1000}
                                        placeholder="Contoh: {{ rental.code }} - {{ today }}"
                                        className="mt-1.5 w-full text-sm font-semibold font-mono"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Mendukung placeholder dinamis seperti <code className="text-indigo-600 dark:text-indigo-400">{'{{ rental.code }}'}</code>
                                    </p>
                                    <InputError message={(errors as Record<string, string>)['content.subtitle']} className="mt-1" />
                                </div>
                            </div>

                            {/* Specific Document Fields */}
                            {code === 'rental_handover' && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <div>
                                        <InputLabel htmlFor="content_checkout_label" value="Label Bagian Checkout" />
                                        <TextInput
                                            id="content_checkout_label"
                                            value={data.content.checkout_label}
                                            onChange={(e) => updateContentField('checkout_label', e.target.value)}
                                            placeholder="Contoh: Checkout (Serah ke Penyewa)"
                                            className="mt-1.5 w-full text-sm"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="content_return_label" value="Label Bagian Return" />
                                        <TextInput
                                            id="content_return_label"
                                            value={data.content.return_label}
                                            onChange={(e) => updateContentField('return_label', e.target.value)}
                                            placeholder="Contoh: Return (Kembali dari Penyewa)"
                                            className="mt-1.5 w-full text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {code === 'rental_invoice' && (
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                                    <InputLabel htmlFor="content_bill_to_label" value="Label Penerima Tagihan (Bill To)" />
                                    <TextInput
                                        id="content_bill_to_label"
                                        value={data.content.bill_to_label}
                                        onChange={(e) => updateContentField('bill_to_label', e.target.value)}
                                        placeholder="Contoh: Ditagihkan kepada / Customer"
                                        className="mt-1.5 w-full text-sm"
                                    />
                                </div>
                            )}

                            {/* Intro HTML Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <InputLabel htmlFor="content_intro_html" value="Teks Pembuka / Pengantar Dokumen (Intro)" />
                                    <span className="text-[11px] font-medium text-slate-400">Rich HTML Format</span>
                                </div>
                                <HtmlEditor
                                    value={data.content.intro_html}
                                    onChange={(val) => updateContentField('intro_html', val)}
                                    minHeight="110px"
                                    placeholder="Tuliskan kata pembuka atau konteks dokumen..."
                                />
                                <InputError message={(errors as Record<string, string>)['content.intro_html']} className="mt-1" />
                            </div>

                            {/* Terms HTML Editor (For Contract) */}
                            {code === 'rental_contract' && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <InputLabel htmlFor="content_terms_html" value="Syarat & Ketentuan Sewa (Terms & Conditions)" />
                                        <span className="text-[11px] font-medium text-slate-400">Klausul Hukum & Poin Perjanjian</span>
                                    </div>
                                    <HtmlEditor
                                        value={data.content.terms_html}
                                        onChange={(val) => updateContentField('terms_html', val)}
                                        minHeight="160px"
                                        placeholder="Tuliskan klausul hak & kewajiban penyewa..."
                                    />
                                    <InputError message={(errors as Record<string, string>)['content.terms_html']} className="mt-1" />
                                </div>
                            )}

                            {/* Footer HTML Editor */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <InputLabel htmlFor="content_footer_html" value="Catatan Kaki / Disclaimer Penutup (Footer)" />
                                    <span className="text-[11px] font-medium text-slate-400">Paling bawah lembar dokumen</span>
                                </div>
                                <HtmlEditor
                                    value={data.content.footer_html}
                                    onChange={(val) => updateContentField('footer_html', val)}
                                    minHeight="90px"
                                    placeholder="Contoh: Dokumen ini sah dan mengikat secara hukum tanpa cap basah..."
                                />
                                <InputError message={(errors as Record<string, string>)['content.footer_html']} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Visual Elements & Display Options */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold">
                                ⚙️
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Opsi Tampilan & Elemen Cetak
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Aktifkan atau sembunyikan komponen spesifik pada lembar dokumen cetak.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ToggleCard
                                id="option_show_logo"
                                checked={data.options.show_logo}
                                onChange={(val) => updateOptionField('show_logo', val)}
                                label="Logo Perusahaan"
                                description="Menampilkan lambang resmi perusahaan di bagian atas kop surat."
                                icon="🖼️"
                            />

                            <ToggleCard
                                id="option_show_company_info"
                                checked={data.options.show_company_info}
                                onChange={(val) => updateOptionField('show_company_info', val)}
                                label="Identitas & Nama Bisnis"
                                description="Mencantumkan nama legal entitas perusahaan penyedia armada."
                                icon="🏢"
                            />

                            <ToggleCard
                                id="option_show_address"
                                checked={data.options.show_address}
                                onChange={(val) => updateOptionField('show_address', val)}
                                label="Alamat Kantor Operasional"
                                description="Menampilkan alamat lengkap kantor cabang pada kop surat."
                                icon="📍"
                            />

                            <ToggleCard
                                id="option_show_phone"
                                checked={data.options.show_phone}
                                onChange={(val) => updateOptionField('show_phone', val)}
                                label="Nomor Kontak & Telepon"
                                description="Mencantumkan nomor customer care atau hotline kantor."
                                icon="📞"
                            />

                            <ToggleCard
                                id="option_show_signature"
                                checked={data.options.show_signature}
                                onChange={(val) => updateOptionField('show_signature', val)}
                                label="Blok Tanda Tangan"
                                description="Menyediakan kolom tanda tangan penyewa dan petugas rental."
                                icon="✍️"
                            />

                            {code === 'rental_handover' && (
                                <ToggleCard
                                    id="option_show_damage_section"
                                    checked={data.options.show_damage_section}
                                    onChange={(val) => updateOptionField('show_damage_section', val)}
                                    label="Daftar Kerusakan (Damage)"
                                    description="Menampilkan tabel catatan goresan dan riwayat kerusakan fisik."
                                    icon="🚗"
                                />
                            )}

                            {code === 'rental_invoice' && (
                                <ToggleCard
                                    id="option_show_paid_stamp"
                                    checked={data.options.show_paid_stamp}
                                    onChange={(val) => updateOptionField('show_paid_stamp', val)}
                                    label="Stempel Lunas (PAID)"
                                    description="Mencetak watermark stempel lunas saat invoice sudah terbayar."
                                    icon="🏷️"
                                />
                            )}

                            <ToggleCard
                                id="option_show_footer"
                                checked={data.options.show_footer}
                                onChange={(val) => updateOptionField('show_footer', val)}
                                label="Catatan Kaki (Footer)"
                                description="Mencetak teks penutup / disclaimer di bagian bawah dokumen."
                                icon="📄"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Blueprint & Interactive Placeholders (5 cols) */}
                <div className="space-y-6 lg:col-span-5">
                    {/* Live Blueprint & Placeholders Card */}
                    <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        {/* Sub-tabs Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveSidebarTab('preview')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                        activeSidebarTab === 'preview'
                                            ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span>👁️</span>
                                    <span>Blueprint Mockup</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveSidebarTab('placeholders')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                        activeSidebarTab === 'placeholders'
                                            ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <span>🏷️</span>
                                    <span>Daftar Variabel ({placeholders.length})</span>
                                </button>
                            </div>

                            {isDirty && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                                    ● Ada Perubahan
                                </span>
                            )}
                        </div>

                        {/* TAB 1: LIVE DOCUMENT BLUEPRINT */}
                        {activeSidebarTab === 'preview' && (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Simulasi Lembar Cetak A4:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        Preset {data.layout_preset.toUpperCase()}
                                    </span>
                                </div>

                                {/* Simulated Paper Sheet */}
                                <div
                                    className={`relative overflow-hidden rounded-2xl border bg-slate-50 p-5 shadow-inner transition-all dark:bg-slate-950/70 ${
                                        data.layout_preset === 'corporate'
                                            ? 'border-t-4 border-t-indigo-600 border-slate-300 dark:border-slate-700'
                                            : 'border-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {/* Company Header Block */}
                                    {(data.options.show_company_info || data.options.show_logo || data.options.show_address || data.options.show_phone) && (
                                        <div className="border-b border-slate-200 pb-3 text-center dark:border-slate-800">
                                            {data.options.show_logo && (
                                                <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                    🚗
                                                </div>
                                            )}
                                            {data.options.show_company_info && (
                                                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                                                    Seruwit Rent Car & Transport
                                                </div>
                                            )}
                                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {data.options.show_address && <span>Jl. Boulevard Utama No. 88, Jakarta • </span>}
                                                {data.options.show_phone && <span>(021) 555-0199</span>}
                                            </div>
                                        </div>
                                    )}

                                    {/* Document Title & Subtitle */}
                                    <div className="my-3 text-center">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                            {data.content.title || 'Judul Dokumen'}
                                        </h4>
                                        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            {renderPreviewSubtitle(data.content.subtitle || 'RNT-202608-001 - 19/08/2026')}
                                        </p>
                                    </div>

                                    {/* Intro Simulation */}
                                    {data.content.intro_html && (
                                        <div className="mb-3 rounded-lg bg-white/70 p-2 text-[10px] italic text-slate-600 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 line-clamp-2">
                                            {data.content.intro_html.replace(/<[^>]*>?/gm, '')}
                                        </div>
                                    )}

                                    {/* Sample Meta Table */}
                                    <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5 text-[10px] dark:border-slate-800 dark:bg-slate-900">
                                        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-1 dark:border-slate-800 font-medium">
                                            <div>
                                                <span className="text-slate-400">Penyewa:</span>{' '}
                                                <span className="font-bold text-slate-800 dark:text-slate-200">PT Maju Jaya Mandiri</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Armada:</span>{' '}
                                                <span className="font-bold text-slate-800 dark:text-slate-200">Innova Zenix (B 1234 CD)</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                                            <div>
                                                <span className="text-slate-400">Periode:</span> 19/08/2026 → 22/08/2026
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Total:</span>{' '}
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">Rp 1.500.000</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Handover Specific Blueprint Check */}
                                    {code === 'rental_handover' && (
                                        <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white/50 p-2 text-[9px] dark:border-slate-800 dark:bg-slate-900/50">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">
                                                {data.content.checkout_label || 'Checkout'} &amp; {data.content.return_label || 'Return'}
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-slate-500">
                                                <span>✓ BBM: Full (100%)</span>
                                                <span>✓ Odo: 12.450 km</span>
                                                <span>✓ Checklist OK</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contract Specific Terms Note */}
                                    {code === 'rental_contract' && data.content.terms_html && (
                                        <div className="mt-2 rounded-lg bg-white/60 p-2 text-[9px] text-slate-600 dark:bg-slate-900/60 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 line-clamp-3">
                                            <strong>Ketentuan:</strong> {data.content.terms_html.replace(/<[^>]*>?/gm, '')}
                                        </div>
                                    )}

                                    {/* Invoice Paid Stamp */}
                                    {code === 'rental_invoice' && data.options.show_paid_stamp && (
                                        <div className="my-2 flex justify-center">
                                            <div className="rounded border-2 border-dashed border-emerald-600 px-3 py-1 text-center font-black uppercase tracking-widest text-emerald-600 rotate-[-4deg] text-[10px] dark:border-emerald-400 dark:text-emerald-400">
                                                ★ LUNAS / PAID ★
                                            </div>
                                        </div>
                                    )}

                                    {/* Signature Section */}
                                    {data.options.show_signature && (
                                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-500 dark:border-slate-800">
                                            <div>
                                                <div className="mb-6 font-semibold">Pihak Penyewa</div>
                                                <div className="border-t border-slate-400 mx-3 pt-0.5 font-bold text-slate-700 dark:text-slate-300">
                                                    ( ________________ )
                                                </div>
                                            </div>
                                            <div>
                                                <div className="mb-6 font-semibold">Petugas Rental</div>
                                                <div className="border-t border-slate-400 mx-3 pt-0.5 font-bold text-slate-700 dark:text-slate-300">
                                                    ( Seruwit Rental )
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Section */}
                                    {data.options.show_footer && (
                                        <div className="mt-3 border-t border-slate-200 pt-1.5 text-center text-[8px] text-slate-400 dark:border-slate-800 line-clamp-1">
                                            {data.content.footer_html ? data.content.footer_html.replace(/<[^>]*>?/gm, '') : 'Dokumen sah tanpa cap basah.'}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={previewPdf}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 underline"
                                    >
                                        Buka Dokumen PDF Penuh di Tab Baru ↗
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: PLACEHOLDERS CHEATSHEET */}
                        {activeSidebarTab === 'placeholders' && (
                            <div className="mt-4 space-y-3">
                                <div className="rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                                    💡 <strong>Klik variabel di bawah</strong> untuk menyalin tag placeholder langsung ke clipboard Anda.
                                </div>

                                <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                                    {placeholders.map((item) => {
                                        const isCopied = copiedTag === item.tag;
                                        return (
                                            <button
                                                key={item.tag}
                                                type="button"
                                                onClick={() => handleCopyPlaceholder(item.tag)}
                                                className={`group flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition ${
                                                    isCopied
                                                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                                                        : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800'
                                                }`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-indigo-600 dark:bg-slate-800 dark:text-indigo-400 font-mono">
                                                            {item.tag}
                                                        </code>
                                                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                                                        <span>{item.label}</span>
                                                        <span className="text-slate-400 italic">e.g. {item.sample}</span>
                                                    </div>
                                                </div>

                                                <div className="ml-2 shrink-0">
                                                    <span
                                                        className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                                                            isCopied
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {isCopied ? 'Tersalin! ✓' : 'Salin 📋'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reset Confirmation Modal */}
            <Modal show={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 font-bold">
                            ⚠️
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Reset Template Dokumen ke Default?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Template: <strong>{docMeta.label}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                        Seluruh kustomisasi judul, teks intro, syarat ketentuan, dan pengaturan opsi pada dokumen ini akan dikembalikan ke konfigurasi standar bawaan sistem.
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={() => setConfirmReset(false)} disabled={processing}>
                            Batal
                        </SecondaryButton>
                        <DangerButton onClick={handleConfirmReset} disabled={processing}>
                            Ya, Reset ke Default
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </form>
    );
}

export default function DocumentsPanel({ documents, prefixedRoute }: DocumentsPanelProps): JSX.Element {
    const [activeCode, setActiveCode] = useState<string>('rental_contract');

    const activeTemplate = documents[activeCode] || {
        name: '',
        layout_preset: 'classic',
        content: {},
        options: {},
    };

    return (
        <div className="space-y-6">
            {/* Top Document Selector Grid Tabs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {DOCUMENT_ITEMS.map((item) => {
                    const isActive = activeCode === item.code;
                    const docData = documents[item.code];
                    const currentPreset = docData?.layout_preset || 'classic';

                    return (
                        <button
                            key={item.code}
                            type="button"
                            onClick={() => setActiveCode(item.code)}
                            className={`group relative flex items-start gap-4 rounded-3xl border p-5 text-left transition-all ${
                                isActive
                                    ? `border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-slate-900`
                                    : `border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700`
                            }`}
                        >
                            <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-105 ${item.color.bg} ${item.color.text}`}
                            >
                                {item.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        {item.category}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            isActive
                                                ? item.color.badge
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}
                                    >
                                        {currentPreset.toUpperCase()}
                                    </span>
                                </div>

                                <h3
                                    className={`mt-1 text-sm font-bold transition-colors ${
                                        isActive
                                            ? 'text-indigo-600 dark:text-indigo-400'
                                            : 'text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400'
                                    }`}
                                >
                                    {item.label}
                                </h3>

                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    {item.description}
                                </p>
                            </div>

                            {isActive && (
                                <span className="absolute -bottom-px left-8 right-8 h-1 rounded-t-full bg-indigo-600 dark:bg-indigo-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Keyed Form to guarantee clean state initialization per document */}
            <SingleDocumentEditor
                key={activeCode}
                code={activeCode}
                template={activeTemplate}
                prefixedRoute={prefixedRoute}
            />
        </div>
    );
}

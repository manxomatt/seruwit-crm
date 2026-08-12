import Checkbox from '@/Components/Checkbox';
import HtmlEditor from '@/Components/HtmlEditor';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import React from 'react';

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

const LAYOUT_OPTIONS = [
    { value: 'classic', label: 'Classic' },
    { value: 'compact', label: 'Compact' },
    { value: 'corporate', label: 'Corporate' },
];

const DOCUMENT_LIST = [
    { code: 'rental_contract', label: 'Kontrak Rental', icon: '📄' },
    { code: 'rental_handover', label: 'Berita Acara Serah Terima', icon: '📋' },
    { code: 'rental_invoice', label: 'Invoice', icon: '🧾' },
];

const PLACEHOLDERS: Record<string, string[]> = {
    rental_contract: [
        '{{ rental.code }}',
        '{{ rental.start_date }}',
        '{{ rental.end_date }}',
        '{{ rental.total_amount }}',
        '{{ partner.name }}',
        '{{ partner.code }}',
        '{{ vehicle.name }}',
        '{{ vehicle.plate_number }}',
        '{{ company.name }}',
        '{{ today }}',
    ],
    rental_handover: [
        '{{ rental.code }}',
        '{{ partner.name }}',
        '{{ vehicle.name }}',
        '{{ vehicle.plate_number }}',
        '{{ checkout.time }}',
        '{{ return.time }}',
        '{{ company.name }}',
    ],
    rental_invoice: [
        '{{ invoice.code }}',
        '{{ invoice.issue_date }}',
        '{{ invoice.due_date }}',
        '{{ invoice.total }}',
        '{{ partner.name }}',
        '{{ company.name }}',
    ],
};

export default function DocumentsPanel({ documents, prefixedRoute }: DocumentsPanelProps): JSX.Element {
    const [activeCode, setActiveCode] = React.useState<string>('rental_contract');
    const template = documents[activeCode] || {
        name: '',
        layout_preset: 'classic',
        content: {
            title: '',
            subtitle: '',
            intro_html: '',
            terms_html: '',
            notes_label: '',
            footer_html: '',
            checkout_label: '',
            return_label: '',
            bill_to_label: '',
        },
        options: {},
    };

    const { data, setData, patch, post, processing, errors, recentlySuccessful, reset } = useForm({
        name: template.name,
        layout_preset: template.layout_preset,
        content_title: template.content.title || '',
        content_subtitle: template.content.subtitle || '',
        content_intro_html: template.content.intro_html || '',
        content_terms_html: template.content.terms_html || '',
        content_notes_label: template.content.notes_label || '',
        content_footer_html: template.content.footer_html || '',
        content_checkout_label: template.content.checkout_label || '',
        content_return_label: template.content.return_label || '',
        content_bill_to_label: template.content.bill_to_label || '',
        option_show_logo: template.options.show_logo ?? true,
        option_show_address: template.options.show_address ?? true,
        option_show_phone: template.options.show_phone ?? true,
        option_show_footer: template.options.show_footer ?? true,
        option_show_signature: template.options.show_signature ?? true,
        option_show_company_info: template.options.show_company_info ?? true,
        option_show_damage_section: template.options.show_damage_section ?? true,
        option_show_paid_stamp: template.options.show_paid_stamp ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('rental.settings.documents.update', { code: activeCode }), {
            preserveScroll: true,
        });
    };

    const resetTemplate = () => {
        if (window.confirm('Reset template ini ke default sistem?')) {
            post(prefixedRoute('rental.settings.documents.reset', { code: activeCode }), {
                preserveScroll: true,
                onSuccess: () => reset(),
            });
        }
    };

    const previewTemplate = () => {
        window.open(prefixedRoute('rental.settings.documents.preview', { code: activeCode }), '_blank');
    };

    const updateOption = (key: string, value: boolean) => {
        setData(key as keyof typeof data, value);
    };

    const updateContent = (key: string, value: string) => {
        setData(key as keyof typeof data, value);
    };

    return (
        <div className="flex gap-6">
            <div className="w-64 shrink-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Dokumen</h3>
                    <div className="space-y-1">
                        {DOCUMENT_LIST.map((doc) => (
                            <button
                                key={doc.code}
                                type="button"
                                onClick={() => setActiveCode(doc.code)}
                                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                                    activeCode === doc.code
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span className="mr-2">{doc.icon}</span>
                                {doc.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <form onSubmit={submit} className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Edit Template — {DOCUMENT_LIST.find((d) => d.code === activeCode)?.label}
                            </h3>
                            <div className="flex gap-2">
                                <PrimaryButton type="button" onClick={previewTemplate} className="text-xs">
                                    Preview
                                </PrimaryButton>
                                <PrimaryButton type="submit" disabled={processing} className="text-xs">
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </PrimaryButton>
                                <SecondaryButton type="button" onClick={resetTemplate} className="text-xs">
                                    Reset ke default
                                </SecondaryButton>
                            </div>
                        </div>

                        {recentlySuccessful && (
                            <p className="text-sm text-emerald-600 mb-4">Template dokumen disimpan.</p>
                        )}

                        <div className="grid gap-4">
                            <div>
                                <InputLabel htmlFor="template_name" value="Nama template" />
                                <TextInput
                                    id="template_name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    maxLength={500}
                                    className="mt-1 w-full"
                                />
                                <InputError message={errors.name as string} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="layout_preset" value="Preset layout" />
                                <Select
                                    id="layout_preset"
                                    options={LAYOUT_OPTIONS}
                                    value={data.layout_preset}
                                    onChange={(value) => setData('layout_preset', value)}
                                    className="mt-1 w-full"
                                />
                                <InputError message={errors.layout_preset as string} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Konten
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="content_title" value="Judul dokumen" />
                                <TextInput
                                    id="content_title"
                                    value={data.content_title}
                                    onChange={(e) => updateContent('content_title', e.target.value)}
                                    maxLength={500}
                                    className="mt-1 w-full"
                                />
                                <InputError message={errors.content_title as string} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="content_subtitle" value="Subjudul" />
                                <TextInput
                                    id="content_subtitle"
                                    value={data.content_subtitle}
                                    onChange={(e) => updateContent('content_subtitle', e.target.value)}
                                    maxLength={1000}
                                    className="mt-1 w-full"
                                />
                                <InputError message={errors.content_subtitle as string} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="content_intro_html" value="Intro" />
                                <HtmlEditor
                                    value={data.content_intro_html}
                                    onChange={(value) => updateContent('content_intro_html', value)}
                                    minHeight="120px"
                                />
                                <InputError message={errors.content_intro_html as string} className="mt-1" />
                            </div>
                            {activeCode === 'rental_contract' && (
                                <div>
                                    <InputLabel htmlFor="content_terms_html" value="Ketentuan" />
                                    <HtmlEditor
                                        value={data.content_terms_html}
                                        onChange={(value) => updateContent('content_terms_html', value)}
                                        minHeight="120px"
                                    />
                                    <InputError message={errors.content_terms_html as string} className="mt-1" />
                                </div>
                            )}
                            {activeCode === 'rental_handover' && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="content_checkout_label" value="Label checkout" />
                                        <TextInput
                                            id="content_checkout_label"
                                            value={data.content_checkout_label}
                                            onChange={(e) => updateContent('content_checkout_label', e.target.value)}
                                            className="mt-1 w-full"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="content_return_label" value="Label return" />
                                        <TextInput
                                            id="content_return_label"
                                            value={data.content_return_label}
                                            onChange={(e) => updateContent('content_return_label', e.target.value)}
                                            className="mt-1 w-full"
                                        />
                                    </div>
                                </div>
                            )}
                            {activeCode === 'rental_invoice' && (
                                <div>
                                    <InputLabel htmlFor="content_bill_to_label" value="Label ditagihkan kepada" />
                                    <TextInput
                                        id="content_bill_to_label"
                                        value={data.content_bill_to_label}
                                        onChange={(e) => updateContent('content_bill_to_label', e.target.value)}
                                        className="mt-1 w-full"
                                    />
                                </div>
                            )}
                            <div>
                                <InputLabel htmlFor="content_footer_html" value="Footer" />
                                <HtmlEditor
                                    value={data.content_footer_html}
                                    onChange={(value) => updateContent('content_footer_html', value)}
                                    minHeight="100px"
                                />
                                <InputError message={errors.content_footer_html as string} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                            Opsi Tampilan
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                { key: 'option_show_logo', label: 'Tampilkan logo' },
                                { key: 'option_show_address', label: 'Tampilkan alamat' },
                                { key: 'option_show_phone', label: 'Tampilkan telepon' },
                                { key: 'option_show_footer', label: 'Tampilkan footer' },
                                { key: 'option_show_signature', label: 'Tampilkan blok tanda tangan' },
                                { key: 'option_show_company_info', label: 'Tampilkan info perusahaan' },
                                { key: 'option_show_damage_section', label: 'Tampilkan section damage' },
                                { key: 'option_show_paid_stamp', label: 'Tampilkan stempel lunas' },
                            ].map((option) => (
                                <div key={option.key} className="flex items-start gap-3">
                                    <Checkbox
                                        id={option.key}
                                        checked={data[option.key as keyof typeof data] as boolean}
                                        onChange={(e) => updateOption(option.key, e.target.checked)}
                                    />
                                    <div>
                                        <InputLabel
                                            htmlFor={option.key}
                                            value={option.label}
                                            className="!mb-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            <div className="w-72 shrink-0">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Placeholder
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        Gunakan placeholder berikut di dalam teks konten.
                    </p>
                    <div className="space-y-1">
                        {(PLACEHOLDERS[activeCode] || []).map((placeholder) => (
                            <code
                                key={placeholder}
                                className="block rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            >
                                {placeholder}
                            </code>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from 'react';
import CustomerPortalLayout from './CustomerPortalLayout';

interface Brand {
    name: string;
    color: string;
    support_phone: string | null;
    logo_url?: string | null;
}

interface PartnerDocuments {
    kyc_status: string;
    kyc_rejected_reason: string | null;
    id_number: string | null;
    license_number: string | null;
    id_card_photo_path: string | null;
    driver_license_photo_path: string | null;
    id_card_url?: string | null;
    driver_license_url?: string | null;
    selfie_photo_path: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

interface Props {
    brand: Brand;
    customer: { id: number; name: string; phone: string };
    partner: PartnerDocuments;
}

interface FileUploaderBoxProps {
    id: string;
    title: string;
    hint: string;
    file: File | null;
    existingUrl?: string | null;
    onFileSelected: (file: File | null) => void;
    error?: string;
}

function DocumentUploadBox({
    id,
    title,
    hint,
    file,
    existingUrl,
    onFileSelected,
    error,
}: FileUploaderBoxProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelected(e.dataTransfer.files[0]);
        }
    };

    const handleClear = () => {
        onFileSelected(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const previewUrl = file ? URL.createObjectURL(file) : existingUrl;
    const isPdf = file ? file.type === 'application/pdf' : (previewUrl?.toLowerCase().endsWith('.pdf') ?? false);

    return (
        <div className="space-y-2">
            <InputLabel htmlFor={id} value={title} />

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {previewUrl ? (
                <div className="relative rounded-2xl border border-slate-250 bg-slate-50/70 p-3 sm:p-4 overflow-hidden transition-all shadow-xs">
                    <div className="flex items-center gap-4">
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                            {isPdf ? (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-rose-50 text-rose-600">
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">Dokumen PDF</span>
                                </div>
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt={title}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    {file ? 'File Baru Dipilih' : 'Tersimpan'}
                                </span>
                            </div>
                            <p className="truncate text-xs font-black text-slate-800">
                                {file ? file.name : 'Dokumen Tersimpan'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Siap diverifikasi tim rental'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-950 transition"
                            >
                                Ganti
                            </button>
                            {file && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        isDragging
                            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 shadow-2xs transition-transform group-hover:scale-105">
                        <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.5V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </div>

                    <div className="mt-3 space-y-1">
                        <div className="text-xs font-black text-slate-800 group-hover:text-teal-700 transition">
                            Klik atau Seret Foto ke Sini
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Format JPG, PNG, WEBP, atau PDF (Maks. 10MB)
                        </p>
                    </div>
                </div>
            )}

            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {hint}
            </p>

            {error && <InputError message={error} className="mt-1" />}
        </div>
    );
}

export default function Documents({ brand, customer, partner }: Props) {
    const isVerified = partner.kyc_status === 'verified';
    const isPending = partner.kyc_status === 'pending';
    const isRejected = partner.kyc_status === 'rejected';

    const form = useForm<{
        id_number: string;
        license_number: string;
        ktp: File | null;
        sim: File | null;
        emergency_contact_name: string;
        emergency_contact_phone: string;
    }>({
        id_number: partner.id_number || '',
        license_number: partner.license_number || '',
        ktp: null,
        sim: null,
        emergency_contact_name: partner.emergency_contact_name || '',
        emergency_contact_phone: partner.emergency_contact_phone || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('book.rental.portal.documents.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <CustomerPortalLayout brand={brand} title="Manajemen Dokumen KYC">
            <div className="max-w-4xl space-y-6">
                {/* Status Notice */}
                {isVerified ? (
                    <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 sm:p-6 text-xs text-emerald-900 space-y-1">
                        <div className="font-black text-sm flex items-center gap-1.5 text-emerald-950">
                            <span>✅</span>
                            <span>Dokumen KYC Anda Sudah Terverifikasi Resmi</span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed">
                            Identitas Anda telah diverifikasi oleh tim rental. Semua pemesanan mobil berikutnya dapat langsung disetujui tanpa perlu mengunggah ulang dokumen.
                        </p>
                    </div>
                ) : isPending ? (
                    <div className="rounded-3xl bg-blue-50 border border-blue-200 p-5 sm:p-6 text-xs text-blue-900 space-y-1">
                        <div className="font-black text-sm flex items-center gap-1.5 text-blue-950">
                            <span>⏳</span>
                            <span>Dokumen Sedang Dalam Proses Peninjauan</span>
                        </div>
                        <p className="text-blue-800 leading-relaxed">
                            Dokumen yang Anda kirimkan sedang diperiksa oleh staf admin kami. Anda dapat memperbarui dokumen di bawah jika ada foto yang buram.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-3xl bg-amber-50 border border-amber-300 p-5 sm:p-6 text-xs text-amber-900 space-y-1">
                        <div className="font-black text-sm flex items-center gap-1.5 text-amber-950">
                            <span>⚠️</span>
                            <span>{isRejected ? 'Dokumen Perlu Diperbaiki' : 'Lengkapi Dokumen Identitas Anda'}</span>
                        </div>
                        <p className="text-amber-800 leading-relaxed">
                            {partner.kyc_rejected_reason
                                ? `Catatan koreksi: ${partner.kyc_rejected_reason}. Silakan unggah foto dokumen yang lebih jelas dan terbaca.`
                                : 'Unggah foto KTP dan SIM Anda satu kali agar akun Anda mendapatkan status verifikasi resmi.'}
                        </p>
                    </div>
                )}

                {/* Form Card */}
                <form onSubmit={submit} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* ID Card / KTP */}
                        <div className="space-y-4">
                            <DocumentUploadBox
                                id="ktp_upload"
                                title="Foto KTP Asli (e-KTP)"
                                hint="Pastikan NIK, nama, dan foto pada KTP terlihat jelas, terang, dan tidak buram."
                                file={form.data.ktp}
                                existingUrl={partner.id_card_url}
                                onFileSelected={(file) => form.setData('ktp', file)}
                                error={form.errors.ktp}
                            />

                            <div>
                                <InputLabel htmlFor="id_number" value="Nomor NIK KTP (16 Digit)" />
                                <TextInput
                                    id="id_number"
                                    value={form.data.id_number}
                                    onChange={(e) => form.setData('id_number', e.target.value)}
                                    placeholder="3201..."
                                    className="w-full mt-1.5 text-sm font-semibold"
                                />
                                <InputError message={form.errors.id_number} className="mt-1" />
                            </div>
                        </div>

                        {/* Driver License / SIM */}
                        <div className="space-y-4">
                            <DocumentUploadBox
                                id="sim_upload"
                                title="Foto SIM A / SIM B Asli"
                                hint="Pastikan masa berlaku SIM masih aktif untuk keperluan sewa kendaraan lepas kunci."
                                file={form.data.sim}
                                existingUrl={partner.driver_license_url}
                                onFileSelected={(file) => form.setData('sim', file)}
                                error={form.errors.sim}
                            />

                            <div>
                                <InputLabel htmlFor="license_number" value="Nomor Surat Izin Mengemudi (SIM)" />
                                <TextInput
                                    id="license_number"
                                    value={form.data.license_number}
                                    onChange={(e) => form.setData('license_number', e.target.value)}
                                    placeholder="1234-5678-..."
                                    className="w-full mt-1.5 text-sm font-semibold"
                                />
                                <InputError message={form.errors.license_number} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="border-t border-slate-100 pt-6 space-y-4">
                        <div>
                            <h4 className="text-sm font-black text-slate-900">Kontak Darurat Keluarga / Kerabat</h4>
                            <p className="text-xs text-slate-500">Dihubungi jika terjadi keadaan darurat selama periode sewa kendaraan.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="emergency_contact_name" value="Nama Kontak Darurat" />
                                <TextInput
                                    id="emergency_contact_name"
                                    value={form.data.emergency_contact_name}
                                    onChange={(e) => form.setData('emergency_contact_name', e.target.value)}
                                    placeholder="Contoh: Istri / Orang Tua / Saudara"
                                    className="w-full mt-1.5 text-sm"
                                />
                                <InputError message={form.errors.emergency_contact_name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="emergency_contact_phone" value="Nomor Telepon Darurat" />
                                <TextInput
                                    id="emergency_contact_phone"
                                    value={form.data.emergency_contact_phone}
                                    onChange={(e) => form.setData('emergency_contact_phone', e.target.value)}
                                    placeholder="08123456789"
                                    className="w-full mt-1.5 text-sm"
                                />
                                <InputError message={form.errors.emergency_contact_phone} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="border-t border-slate-100 pt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:scale-102 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--brand-color)' }}
                        >
                            {form.processing ? 'Menyimpan Dokumen…' : 'Simpan & Ajukan Verifikasi'}
                        </button>
                    </div>
                </form>
            </div>
        </CustomerPortalLayout>
    );
}

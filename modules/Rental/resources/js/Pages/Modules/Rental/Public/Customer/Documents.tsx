import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
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
    ocrEnabled?: boolean;
}

interface KtpOcrData {
    nik?: string;
    name?: string;
    birth_date?: string;
    address?: string;
    religion?: string;
    occupation?: string;
    confidence?: number;
}

interface SimOcrData {
    license_number?: string;
    license_type?: string;
    name?: string;
    birth_date?: string;
    address?: string;
    expires_at?: string;
    confidence?: number;
}

interface FileUploaderBoxProps {
    id: string;
    title: string;
    hint: string;
    file: File | null;
    existingUrl?: string | null;
    onFileSelected: (file: File | null) => void;
    error?: string;
    isScanning?: boolean;
    ocrSupported?: boolean;
    onTriggerScan?: () => void;
}

function DocumentUploadBox({
    id,
    title,
    hint,
    file,
    existingUrl,
    onFileSelected,
    error,
    isScanning,
    ocrSupported,
    onTriggerScan,
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
    const hasImage = Boolean(file || existingUrl);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <InputLabel htmlFor={id} value={title} />
                {ocrSupported && hasImage && !isScanning && onTriggerScan && (
                    <button
                        type="button"
                        onClick={onTriggerScan}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 transition"
                    >
                        <span>⚡ Pindai Ulang OCR</span>
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                className="hidden"
                onChange={handleFileChange}
            />

            {previewUrl ? (
                <div className={`relative rounded-2xl border bg-slate-50/70 p-3 sm:p-4 overflow-hidden transition-all shadow-xs ${
                    isScanning ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-250'
                }`}>
                    {/* Scanning overlay bar */}
                    {isScanning && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600 animate-pulse" />
                    )}

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
                                <>
                                    <img
                                        src={previewUrl}
                                        alt={title}
                                        className="h-full w-full object-cover"
                                    />
                                    {isScanning && (
                                        <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    {file ? 'File Baru Dipilih' : 'Tersimpan'}
                                </span>
                                {isScanning && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 animate-pulse">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                        Membaca OCR...
                                    </span>
                                )}
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
                                disabled={isScanning}
                                className="rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-950 transition disabled:opacity-50"
                            >
                                Ganti
                            </button>
                            {file && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    disabled={isScanning}
                                    className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
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
                        {ocrSupported && (
                            <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                                ✨ Didukung OCR Otomatis: Data NIK / SIM akan terbaca otomatis
                            </p>
                        )}
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

export default function Documents({ brand, customer, partner, ocrEnabled = true }: Props) {
    const isVerified = partner.kyc_status === 'verified';
    const isPending = partner.kyc_status === 'pending';
    const isRejected = partner.kyc_status === 'rejected';

    const [isScanningKtp, setIsScanningKtp] = useState(false);
    const [isScanningSim, setIsScanningSim] = useState(false);
    const [ktpOcr, setKtpOcr] = useState<KtpOcrData | null>(null);
    const [simOcr, setSimOcr] = useState<SimOcrData | null>(null);
    const [ocrFeedback, setOcrFeedback] = useState<{ type: 'ktp' | 'sim'; message: string; isError?: boolean } | null>(null);

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

    const runKtpOcr = async (fileToScan?: File | null) => {
        if (!ocrEnabled || isScanningKtp) return;

        const targetFile = fileToScan ?? form.data.ktp;
        const hasSaved = Boolean(partner.id_card_photo_path);

        if (!targetFile && !hasSaved) {
            return;
        }

        setIsScanningKtp(true);
        setOcrFeedback(null);

        const formData = new FormData();
        formData.append('doc_type', 'ktp');

        if (targetFile) {
            formData.append('file', targetFile);
        } else if (hasSaved) {
            formData.append('source', 'saved_ktp');
        }

        try {
            const res = await axios.post(route('book.rental.portal.documents.scan'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success && res.data?.result) {
                const result = res.data.result;
                const data = result.data || {};
                const confidence = result.confidence || 0.85;

                setKtpOcr({
                    ...data,
                    confidence,
                });

                if (data.nik) {
                    const cleanNik = String(data.nik).replace(/\D/g, '');
                    form.setData('id_number', cleanNik);
                    setOcrFeedback({
                        type: 'ktp',
                        message: `NIK (${cleanNik}) berhasil dibaca via OCR (${Math.round(confidence * 100)}% akurasi).`,
                    });
                } else {
                    setOcrFeedback({
                        type: 'ktp',
                        message: 'Foto KTP terdeteksi, namun nomor NIK belum terbaca jelas. Mohon periksa kembali kolom NIK.',
                    });
                }
            } else {
                setOcrFeedback({
                    type: 'ktp',
                    message: res.data?.message || 'Gagal memindai KTP.',
                    isError: true,
                });
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Gagal menjalankan pemindaian OCR KTP.';
            setOcrFeedback({
                type: 'ktp',
                message,
                isError: true,
            });
        } finally {
            setIsScanningKtp(false);
        }
    };

    const runSimOcr = async (fileToScan?: File | null) => {
        if (!ocrEnabled || isScanningSim) return;

        const targetFile = fileToScan ?? form.data.sim;
        const hasSaved = Boolean(partner.driver_license_photo_path);

        if (!targetFile && !hasSaved) {
            return;
        }

        setIsScanningSim(true);
        setOcrFeedback(null);

        const formData = new FormData();
        formData.append('doc_type', 'sim');

        if (targetFile) {
            formData.append('file', targetFile);
        } else if (hasSaved) {
            formData.append('source', 'saved_sim');
        }

        try {
            const res = await axios.post(route('book.rental.portal.documents.scan'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success && res.data?.result) {
                const result = res.data.result;
                const data = result.data || {};
                const confidence = result.confidence || 0.85;

                setSimOcr({
                    ...data,
                    confidence,
                });

                if (data.license_number) {
                    const cleanSim = String(data.license_number).replace(/\s+/g, '');
                    form.setData('license_number', cleanSim);
                    setOcrFeedback({
                        type: 'sim',
                        message: `Nomor SIM (${cleanSim}) berhasil dibaca via OCR (${Math.round(confidence * 100)}% akurasi).`,
                    });
                } else {
                    setOcrFeedback({
                        type: 'sim',
                        message: 'Foto SIM terdeteksi, namun nomor SIM belum terbaca jelas. Mohon periksa kembali kolom nomor SIM.',
                    });
                }
            } else {
                setOcrFeedback({
                    type: 'sim',
                    message: res.data?.message || 'Gagal memindai SIM.',
                    isError: true,
                });
            }
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Gagal menjalankan pemindaian OCR SIM.';
            setOcrFeedback({
                type: 'sim',
                message,
                isError: true,
            });
        } finally {
            setIsScanningSim(false);
        }
    };

    const handleKtpSelected = (file: File | null) => {
        form.setData('ktp', file);
        setKtpOcr(null);
        if (file && file.type.startsWith('image/') && ocrEnabled) {
            runKtpOcr(file);
        }
    };

    const handleSimSelected = (file: File | null) => {
        form.setData('sim', file);
        setSimOcr(null);
        if (file && file.type.startsWith('image/') && ocrEnabled) {
            runSimOcr(file);
        }
    };

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

                {/* OCR Active Notification */}
                {ocrFeedback && (
                    <div className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between border ${
                        ocrFeedback.isError
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}>
                        <div className="flex items-center gap-2">
                            <span>{ocrFeedback.isError ? '⚠️' : '✨'}</span>
                            <span>{ocrFeedback.message}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOcrFeedback(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
                        >
                            ✕
                        </button>
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
                                onFileSelected={handleKtpSelected}
                                error={form.errors.ktp}
                                isScanning={isScanningKtp}
                                ocrSupported={ocrEnabled}
                                onTriggerScan={() => runKtpOcr()}
                            />

                            {/* KTP OCR Result Preview Box */}
                            {ktpOcr && (
                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-black text-indigo-950">
                                            <span>🪪</span>
                                            <span>Hasil Ekstraksi OCR KTP</span>
                                        </div>
                                        {ktpOcr.confidence && (
                                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                                Akurasi {Math.round(ktpOcr.confidence * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase">NIK Terdeteksi</span>
                                            <span className="font-mono font-bold text-indigo-900">{ktpOcr.nik || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Nama di KTP</span>
                                            <span className="font-semibold text-slate-900">{ktpOcr.name || '-'}</span>
                                        </div>
                                        {ktpOcr.birth_date && (
                                            <div>
                                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Tgl Lahir</span>
                                                <span className="font-medium text-slate-800">{ktpOcr.birth_date}</span>
                                            </div>
                                        )}
                                        {ktpOcr.address && (
                                            <div className="col-span-2">
                                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Alamat</span>
                                                <span className="font-medium text-slate-800 truncate block">{ktpOcr.address}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-indigo-700 font-medium">
                                        ✓ NIK telah otomatis diisikan ke input form di bawah. Anda tetap dapat mengedit jika diperlukan.
                                    </p>
                                </div>
                            )}

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
                                onFileSelected={handleSimSelected}
                                error={form.errors.sim}
                                isScanning={isScanningSim}
                                ocrSupported={ocrEnabled}
                                onTriggerScan={() => runSimOcr()}
                            />

                            {/* SIM OCR Result Preview Box */}
                            {simOcr && (
                                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 text-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-black text-indigo-950">
                                            <span>🚗</span>
                                            <span>Hasil Ekstraksi OCR SIM</span>
                                        </div>
                                        {simOcr.confidence && (
                                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                                                Akurasi {Math.round(simOcr.confidence * 100)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase">No. SIM Terdeteksi</span>
                                            <span className="font-mono font-bold text-indigo-900">{simOcr.license_number || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-slate-400 font-bold uppercase">Golongan SIM</span>
                                            <span className="font-semibold text-slate-900">{simOcr.license_type || 'SIM A'}</span>
                                        </div>
                                        {simOcr.name && (
                                            <div>
                                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Nama di SIM</span>
                                                <span className="font-semibold text-slate-900">{simOcr.name}</span>
                                            </div>
                                        )}
                                        {simOcr.expires_at && (
                                            <div>
                                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Masa Berlaku</span>
                                                <span className="font-bold text-emerald-800">{simOcr.expires_at}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-indigo-700 font-medium">
                                        ✓ Nomor SIM telah otomatis diisikan ke input form di bawah. Anda tetap dapat mengedit jika diperlukan.
                                    </p>
                                </div>
                            )}

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
                            disabled={form.processing || isScanningKtp || isScanningSim}
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

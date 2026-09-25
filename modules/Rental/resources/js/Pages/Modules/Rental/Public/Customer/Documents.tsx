import ImageUploader from '@/Components/ImageUploader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
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
    selfie_photo_path: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

interface Props {
    brand: Brand;
    customer: { id: number; name: string; phone: string };
    partner: PartnerDocuments;
}

export default function Documents({ brand, customer, partner }: Props) {
    const isVerified = partner.kyc_status === 'verified';
    const isPending = partner.kyc_status === 'pending';
    const isRejected = partner.kyc_status === 'rejected';

    const form = useForm({
        id_number: partner.id_number || '',
        license_number: partner.license_number || '',
        id_card_photo_path: partner.id_card_photo_path || '',
        driver_license_photo_path: partner.driver_license_photo_path || '',
        emergency_contact_name: partner.emergency_contact_name || '',
        emergency_contact_phone: partner.emergency_contact_phone || '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('book.rental.portal.documents.update'), {
            preserveScroll: true,
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
                        <div className="space-y-3">
                            <InputLabel htmlFor="id_card_photo_path" value="Foto KTP Asli (e-KTP)" />
                            <div className="mt-1">
                                <ImageUploader
                                    value={form.data.id_card_photo_path}
                                    onChange={(val) => form.setData('id_card_photo_path', val)}
                                />
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                                Pastikan NIK, nama, dan foto pada KTP terlihat jelas dan tidak buram.
                            </span>

                            <div className="pt-2">
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
                        <div className="space-y-3">
                            <InputLabel htmlFor="driver_license_photo_path" value="Foto SIM A / SIM B Asli" />
                            <div className="mt-1">
                                <ImageUploader
                                    value={form.data.driver_license_photo_path}
                                    onChange={(val) => form.setData('driver_license_photo_path', val)}
                                />
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                                Pastikan masa berlaku SIM masih aktif untuk keperluan sewa lepas kunci.
                            </span>

                            <div className="pt-2">
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

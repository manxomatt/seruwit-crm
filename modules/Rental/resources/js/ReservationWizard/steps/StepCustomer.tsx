import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { FormEventHandler, useMemo, useState } from 'react';
import PreviousStepsSummary from '../PreviousStepsSummary';
import type {
    AvailableVehicle,
    DriverOption,
    InsurancePackage,
    PartnerOption,
    ReservationFormData,
} from '../types';
import { csrfToken } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    partners: PartnerOption[];
    setPartners: (partners: PartnerOption[]) => void;
    walkInUrl: string;
    aiKycEnabled?: boolean;
    aiScanDocUrl?: string;
    selectedVehicle: AvailableVehicle | null;
    drivers: DriverOption[];
    insurancePackages: InsurancePackage[];
    isOneWay: boolean;
}

type LicenseAlert = {
    tone: 'danger' | 'warning';
    date: string;
};

const LICENSE_EXPIRING_SOON_DAYS = 30;

function partnerInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function parseDateOnly(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
}

function licenseAlertFor(expiresAt: string | null | undefined): LicenseAlert | null {
    if (!expiresAt) {
        return null;
    }

    const expiry = parseDateOnly(expiresAt);
    if (!expiry) {
        return null;
    }

    const today = startOfToday();
    if (expiry < today) {
        return { tone: 'danger', date: expiresAt };
    }

    const soon = new Date(today);
    soon.setDate(soon.getDate() + LICENSE_EXPIRING_SOON_DAYS);
    if (expiry <= soon) {
        return { tone: 'warning', date: expiresAt };
    }

    return null;
}

function DetailItem({
    label,
    value,
    valueClassName = 'text-slate-900 dark:text-white',
}: {
    label: string;
    value: string | number | null | undefined;
    valueClassName?: string;
}): JSX.Element {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
            <dd className={`mt-0.5 text-xs font-bold ${valueClassName}`}>{value || '-'}</dd>
        </div>
    );
}

export default function StepCustomer({
    data,
    setData,
    errors,
    partners,
    setPartners,
    walkInUrl,
    aiKycEnabled = true,
    aiScanDocUrl,
    selectedVehicle,
    drivers,
    insurancePackages,
    isOneWay,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [showWalkIn, setShowWalkIn] = useState(false);
    const [walkIn, setWalkIn] = useState({ name: '', phone: '', email: '', id_number: '' });
    const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [scanningDoc, setScanningDoc] = useState(false);
    const [docScanMsg, setDocScanMsg] = useState<string | null>(null);
    const [docScanError, setDocScanError] = useState<string | null>(null);

    const partnerOptions = useMemo(
        () => [
            { value: '', label: t('rental.fields.customer', undefined, '-- Pilih Data Pelanggan Terdaftar --') },
            ...partners.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
        ],
        [partners, t],
    );

    const selectedPartner = useMemo(
        () => partners.find((partner) => String(partner.id) === data.partner_id) ?? null,
        [partners, data.partner_id],
    );

    const licenseAlert = licenseAlertFor(selectedPartner?.license_expires_at);

    const handleFileOcr = async (file: File) => {
        if (!aiScanDocUrl || scanningDoc) return;
        setScanningDoc(true);
        setDocScanMsg(null);
        setDocScanError(null);

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result as string;
                try {
                    const response = await fetch(aiScanDocUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken(),
                            Accept: 'application/json',
                        },
                        body: JSON.stringify({
                            image: base64Data,
                            doc_type: 'auto',
                        }),
                    });

                    const json = await response.json();
                    if (response.ok && json.success && json.result?.data) {
                        const d = json.result.data;
                        setWalkIn((prev) => ({
                            ...prev,
                            name: d.name || prev.name,
                            id_number: d.nik || d.license_number || prev.id_number,
                        }));
                        setDocScanMsg(`✨ Berhasil membaca ${json.result.doc_type?.toUpperCase() ?? 'Dokumen'}: ${d.name || d.nik || ''}`);
                    } else {
                        setDocScanError(json.message || 'Gagal membaca dokumen');
                    }
                } catch {
                    setDocScanError('Terjadi kesalahan jaringan saat memindai dokumen.');
                } finally {
                    setScanningDoc(false);
                }
            };
            reader.readAsDataURL(file);
        } catch {
            setScanningDoc(false);
            setDocScanError('Gagal memproses file dokumen.');
        }
    };

    const submitWalkIn: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setWalkInErrors({});

        try {
            const response = await fetch(walkInUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Reservation-Wizard': '1',
                    Accept: 'application/json',
                },
                body: JSON.stringify(walkIn),
            });

            if (!response.ok) {
                if (response.status === 422) {
                    const data = await response.json();
                    setWalkInErrors(data.errors ?? {});
                } else {
                    setWalkInErrors({ name: t('rental.wizard.walk_in_failed', undefined, 'Gagal menyimpan pelanggan walk-in.') });
                }
                setProcessing(false);

                return;
            }

            const payload: { partner: PartnerOption; created: boolean; message: string } = await response.json();
            const created = payload.partner;

            setPartners(
                partners.some((p) => p.id === created.id)
                    ? partners.map((p) => (p.id === created.id ? created : p))
                    : [...partners, created],
            );

            setData('partner_id', String(created.id));
            setShowWalkIn(false);
            setWalkIn({ name: '', phone: '', email: '', id_number: '' });
            setDocScanMsg(null);
            setDocScanError(null);
        } catch {
            setWalkInErrors({ name: t('rental.wizard.walk_in_failed', undefined, 'Gagal menyimpan pelanggan walk-in.') });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('rental.wizard.steps.5', undefined, 'Informasi & Data Pelanggan')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Pilih pelanggan yang sudah terdaftar di CRM atau daftarkan pelanggan baru secara instan.
                </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* Customer Selection & Profile Card */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {t('rental.fields.customer', undefined, 'Pilih Pelanggan')} *
                                </h4>
                                <p className="text-[11px] text-slate-400">Cari berdasarkan nama atau kode pelanggan</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowWalkIn(true)}
                                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                            >
                                <span>{t('rental.actions.walk_in_customer', undefined, 'Pelanggan Baru (Walk-in)')}</span>
                            </button>
                        </div>

                        <div className="mt-4">
                            <Select
                                id="partner_id"
                                options={partnerOptions}
                                value={data.partner_id}
                                onChange={(value) => setData('partner_id', value)}
                                placeholder={t('rental.fields.customer', undefined, '-- Pilih Data Pelanggan Terdaftar --')}
                                className="w-full text-xs"
                            />
                            <InputError message={errors.partner_id} className="mt-1.5" />
                        </div>

                        {selectedPartner && (
                            <div className="mt-5 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-850">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xs">
                                        {partnerInitials(selectedPartner.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                                {selectedPartner.name}
                                            </h4>
                                            <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 shadow-2xs dark:bg-slate-800 dark:text-slate-300">
                                                {selectedPartner.code}
                                            </span>
                                            {selectedPartner.customer_rank && selectedPartner.customer_rank > 1 ? (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                    ⭐ Rank {selectedPartner.customer_rank}
                                                </span>
                                            ) : null}
                                        </div>

                                        <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                            <DetailItem label={t('partners.fields.phone', undefined, 'No. Telepon')} value={selectedPartner.phone} />
                                            <DetailItem label={t('partners.fields.email', undefined, 'Email')} value={selectedPartner.email} />
                                            <DetailItem label={t('partners.fields.id_number', undefined, 'NIK / No. KTP')} value={selectedPartner.id_number} />
                                            <DetailItem
                                                label={t('partners.fields.license_number', undefined, 'No. SIM')}
                                                value={selectedPartner.license_number}
                                            />
                                            <DetailItem
                                                label={t('partners.fields.license_expires_at', undefined, 'Masa Berlaku SIM')}
                                                value={selectedPartner.license_expires_at}
                                                valueClassName={
                                                    licenseAlert?.tone === 'danger'
                                                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                                                        : licenseAlert?.tone === 'warning'
                                                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                                                          : 'text-slate-900 dark:text-white'
                                                }
                                            />
                                            <DetailItem
                                                label={t('partners.fields.status', undefined, 'Status')}
                                                value={selectedPartner.status ? t(`partners.status.${selectedPartner.status}`, undefined, selectedPartner.status) : '-'}
                                            />
                                        </dl>

                                        {selectedPartner.address && (
                                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                📍 {selectedPartner.address}
                                            </p>
                                        )}

                                        {licenseAlert && (
                                            <div
                                                className={`mt-4 rounded-2xl border p-3 text-xs ${
                                                    licenseAlert.tone === 'danger'
                                                        ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                                                        : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                                                }`}
                                            >
                                                <p className="font-bold">
                                                    {licenseAlert.tone === 'danger'
                                                        ? `⚠️ SIM Kedaluwarsa (${licenseAlert.date}). Harap perbarui SIM pelanggan sebelum serah terima.`
                                                        : `⚠️ SIM Segera Berakhir (${licenseAlert.date}).`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <PreviousStepsSummary
                    data={data}
                    selectedVehicle={selectedVehicle}
                    includeExtras={true}
                    drivers={drivers}
                    insurancePackages={insurancePackages}
                    isOneWay={isOneWay}
                />
            </div>

            {/* Walk-in Customer Modal */}
            <Modal show={showWalkIn} onClose={() => !processing && setShowWalkIn(false)} maxWidth="md">
                <form onSubmit={submitWalkIn} className="space-y-4 p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {t('rental.pages.create.walk_in_title', undefined, 'Registrasi Pelanggan Walk-In')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('rental.pages.create.walk_in_hint', undefined, 'Isi data pelanggan baru yang langsung bertransaksi di lokasi.')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowWalkIn(false)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            ✕
                        </button>
                    </div>

                    {/* AI Scan Dropzone/Banner */}
                    {aiKycEnabled && aiScanDocUrl && (
                        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-sky-50/60 p-4 shadow-sm dark:border-indigo-800 dark:bg-slate-900/80">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                                        ✨ Fast-Scan Dokumen KTP / SIM
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Pilih foto KTP atau SIM untuk mengisi data form otomatis.
                                    </p>
                                </div>

                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-300">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={scanningDoc}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleFileOcr(file);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    {scanningDoc ? (
                                        <>
                                            <svg className="h-3.5 w-3.5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Membaca...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>📸</span>
                                            <span>Pindai Foto</span>
                                        </>
                                    )}
                                </label>
                            </div>

                            {docScanMsg && (
                                <p className="mt-2 rounded-xl bg-emerald-100/70 p-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    {docScanMsg}
                                </p>
                            )}
                            {docScanError && (
                                <p className="mt-2 rounded-xl bg-rose-100/70 p-2 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                    {docScanError}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="walk_in_name" value={`${t('partners.fields.name', undefined, 'Nama Lengkap')} *`} />
                        <TextInput
                            id="walk_in_name"
                            className="mt-1 block w-full text-xs"
                            value={walkIn.name}
                            onChange={(e) => setWalkIn((c) => ({ ...c, name: e.target.value }))}
                            required
                        />
                        <InputError message={walkInErrors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_phone" value={`${t('partners.fields.phone', undefined, 'No. Telepon / WhatsApp')} *`} />
                        <TextInput
                            id="walk_in_phone"
                            className="mt-1 block w-full text-xs"
                            value={walkIn.phone}
                            onChange={(e) => setWalkIn((c) => ({ ...c, phone: e.target.value }))}
                            required
                        />
                        <InputError message={walkInErrors.phone} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_email" value={t('partners.fields.email', undefined, 'Email (Opsional)')} />
                        <TextInput
                            id="walk_in_email"
                            type="email"
                            className="mt-1 block w-full text-xs"
                            value={walkIn.email}
                            onChange={(e) => setWalkIn((c) => ({ ...c, email: e.target.value }))}
                        />
                        <InputError message={walkInErrors.email} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_id_number" value={t('partners.fields.id_number', undefined, 'NIK / No. KTP')} />
                        <TextInput
                            id="walk_in_id_number"
                            className="mt-1 block w-full text-xs"
                            value={walkIn.id_number}
                            onChange={(e) => setWalkIn((c) => ({ ...c, id_number: e.target.value }))}
                        />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <SecondaryButton type="button" onClick={() => setShowWalkIn(false)} disabled={processing}>
                            {t('common.cancel', undefined, 'Batal')}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="text-xs font-bold">
                            {t('rental.actions.save_walk_in', undefined, 'Simpan & Pilih')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}


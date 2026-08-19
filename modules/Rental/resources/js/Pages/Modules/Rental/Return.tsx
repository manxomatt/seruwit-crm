import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SignaturePad from '@/Components/SignaturePad';
import HandoverPhotoPicker from '../../../HandoverPhotoPicker';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { ChecklistToggleCard, FuelLevelPicker } from './ShowUi';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string;
    type: string;
    rental_class?: string | null;
    photo_url?: string | null;
}

interface Partner {
    id: number;
    name: string;
    code: string;
    phone?: string | null;
}

interface Driver {
    id: number;
    name: string;
    phone?: string | null;
}

interface Rental {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    total_periods: number;
    period_type: string;
    start_odometer?: number | null;
    start_fuel_level?: string | null;
    total_amount: string;
    deposit_amount: string;
    deposit_status?: string | null;
    deposit_received_at?: string | null;
    vehicle: Vehicle;
    partner: Partner;
    driver?: Driver | null;
}

interface Props {
    rental: Rental;
    fuelLevels: string[];
    checklistItems: string[];
    aiInspectionEnabled: boolean;
    aiInspectLiveUrl: string;
}

interface AiInspectionResult {
    overall_status: string;
    condition_summary: string;
    extracted_odometer?: number | null;
    extracted_fuel_level?: string | null;
    detected_damages?: Array<{
        severity: string;
        location: string;
        description: string;
        estimated_cost?: number;
    }>;
}

export default function ReturnPage({
    rental,
    fuelLevels,
    checklistItems,
    aiInspectionEnabled,
    aiInspectLiveUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const todayDate = new Date().toISOString().split('T')[0];

    const form = useForm({
        actual_return_date: todayDate,
        end_odometer: '',
        end_fuel_level: rental.start_fuel_level || 'full',
        return_checklist: checklistItems.reduce<Record<string, boolean>>((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}),
        return_notes: '',
        deposit_returned: Number(rental.deposit_amount) > 0,
        return_photos: [] as string[],
        return_signature: '',
    });

    const [aiScanning, setAiScanning] = useState(false);
    const [aiResult, setAiResult] = useState<AiInspectionResult | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const deltaKm =
        rental.start_odometer !== null &&
        rental.start_odometer !== undefined &&
        form.data.end_odometer !== ''
            ? Math.max(0, Number(form.data.end_odometer) - Number(rental.start_odometer))
            : null;

    const handleRunAiInspection = async (): Promise<void> => {
        if (form.data.return_photos.length === 0) return;
        setAiScanning(true);
        setAiError(null);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(aiInspectLiveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    return_photos: form.data.return_photos,
                }),
            });

            const data = await res.json();
            if (data.success && data.inspection) {
                setAiResult(data.inspection);
                if (data.inspection.extracted_odometer && !form.data.end_odometer) {
                    form.setData('end_odometer', String(data.inspection.extracted_odometer));
                }
                if (data.inspection.extracted_fuel_level) {
                    form.setData('end_fuel_level', data.inspection.extracted_fuel_level);
                }
            } else {
                setAiError(data.message || 'Gagal menjalankan pemindaian AI.');
            }
        } catch (err: any) {
            setAiError(err.message || 'Terjadi kesalahan saat memproses gambar.');
        } finally {
            setAiScanning(false);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.return', rental.id));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.return.title', undefined, 'Pengembalian Unit Kendaraan (Check-In)')}
                    subtitle={`Pemeriksaan kondisi akhir, odometer, dan penyelesaian sewa untuk Booking ${rental.code}`}
                    actions={
                        <Link href={prefixedRoute('rental.show', rental.id)}>
                            <SecondaryButton type="button" className="rounded-xl px-4 py-2 shadow-2xs font-bold text-xs">
                                ← {t('rental.nav.back_to_detail', undefined, 'Kembali ke Detail Rental')}
                            </SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={`Pengembalian ${rental.code} - ${rental.vehicle.name}`} />

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Info, Odometer & BBM, Checklist, Notes (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        {/* Card: Vehicle & Booking Identity */}
                        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                                        {rental.vehicle.photo_url ? (
                                            <img
                                                src={rental.vehicle.photo_url}
                                                alt={rental.vehicle.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                🚗
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                {rental.vehicle.name}
                                            </h3>
                                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {rental.vehicle.plate_number}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            👤 {rental.partner.name} ({rental.partner.code})
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                                    <span className="text-slate-400 font-bold">Odometer Awal:</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                                        {rental.start_odometer !== null ? `${rental.start_odometer.toLocaleString()} KM` : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card 1: Actual Return Date, Odometer & Fuel Level */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    1
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Tanggal Aktual, Odometer Akhir & Posisi BBM
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Catat waktu aktual pengembalian dan pembacaan meteran saat unit diterima kembali.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="actual_return_date" value="Tanggal Pengembalian *" />
                                    <TextInput
                                        id="actual_return_date"
                                        type="date"
                                        value={form.data.actual_return_date}
                                        onChange={(e) => form.setData('actual_return_date', e.target.value)}
                                        className="mt-1.5 w-full !rounded-2xl font-bold shadow-2xs"
                                        required
                                    />
                                    <InputError message={form.errors.actual_return_date} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <InputLabel htmlFor="end_odometer" value="Odometer Akhir (KM) *" />
                                        {deltaKm !== null && (
                                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                +{deltaKm.toLocaleString()} KM tempuh
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative mt-1.5">
                                        <TextInput
                                            id="end_odometer"
                                            type="number"
                                            min={rental.start_odometer ?? 0}
                                            value={form.data.end_odometer}
                                            onChange={(e) => form.setData('end_odometer', e.target.value)}
                                            className="w-full !rounded-2xl pr-12 font-mono text-sm font-bold shadow-2xs"
                                            placeholder="Contoh: 45450"
                                            required
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-black text-slate-400">
                                            KM
                                        </span>
                                    </div>
                                    <InputError message={form.errors.end_odometer} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Level BBM Saat Pengembalian" />
                                <div className="mt-1.5">
                                    <FuelLevelPicker
                                        value={form.data.end_fuel_level}
                                        onChange={(val) => form.setData('end_fuel_level', val)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Return Checklist */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    2
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Pemeriksaan Fisik & Kelengkapan Unit
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Pastikan seluruh perlengkapan kembali lengkap dalam kondisi baik.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {checklistItems.map((key) => (
                                    <ChecklistToggleCard
                                        key={key}
                                        label={t(`rental.checklist.items.${key}`, undefined, key)}
                                        checked={!!form.data.return_checklist[key]}
                                        onChange={(checked) => form.setData('return_checklist', {
                                            ...form.data.return_checklist,
                                            [key]: checked,
                                        })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Card 3: Notes & Deposit Toggle */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    3
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Catatan & Pengembalian Deposit
                                    </h4>
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="return_notes" value="Catatan Pengembalian Unit" />
                                <textarea
                                    id="return_notes"
                                    rows={3}
                                    value={form.data.return_notes}
                                    onChange={(e) => form.setData('return_notes', e.target.value)}
                                    placeholder="Keterangan tambahan saat serah terima pengembalian..."
                                    className="mt-1.5 block w-full rounded-2xl border-slate-200 bg-white text-sm shadow-2xs focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            {Number(rental.deposit_amount) > 0 && (
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                                    <input
                                        type="checkbox"
                                        checked={form.data.deposit_returned}
                                        onChange={(e) => form.setData('deposit_returned', e.target.checked)}
                                        className="mt-1 h-5 w-5 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                            Kembalikan Deposit Penuh Sekarang ({formatMoney(rental.deposit_amount)})
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-400">
                                            Centang jika uang jaminan / deposit dikembalikan secara utuh kepada pelanggan tanpa potongan.
                                        </p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Photos, AI Scanner & Signature (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Card 4: Return Documentation Photos & AI Inspection */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    4
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Foto Unit & AI Smart Inspection
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Unggah foto unit saat kembali untuk dokumentasi dan deteksi otomatis.
                                    </p>
                                </div>
                            </div>

                            <HandoverPhotoPicker
                                id="return_photos"
                                label="Foto Unit Saat Pengembalian"
                                value={form.data.return_photos}
                                onChange={(photos) => {
                                    form.setData('return_photos', photos);
                                    setAiResult(null);
                                }}
                                error={form.errors.return_photos}
                            />

                            {aiInspectionEnabled && form.data.return_photos.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <button
                                        type="button"
                                        disabled={aiScanning}
                                        onClick={handleRunAiInspection}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50"
                                    >
                                        {aiScanning ? (
                                            <>
                                                <span className="animate-spin">🔄</span>
                                                <span>AI sedang memindai foto unit...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✨</span>
                                                <span>Pindai Kerusakan & Odometer dengan AI</span>
                                            </>
                                        )}
                                    </button>

                                    {aiError && (
                                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                                            ⚠️ {aiError}
                                        </div>
                                    )}

                                    {aiResult && (
                                        <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-4 text-xs dark:border-purple-900/50 dark:bg-purple-950/40">
                                            <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                                                <span>Hasil Analisis AI:</span>
                                                <span className="rounded-md bg-purple-200/80 px-2 py-0.5 text-[10px] uppercase dark:bg-purple-900">
                                                    {aiResult.overall_status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-slate-700 dark:text-slate-300">
                                                {aiResult.condition_summary}
                                            </p>
                                            {aiResult.detected_damages && aiResult.detected_damages.length > 0 && (
                                                <div className="mt-2 space-y-1 border-t border-purple-200/60 pt-2 dark:border-purple-800">
                                                    <p className="font-bold text-rose-700 dark:text-rose-400">
                                                        ⚠️ Kerusakan Terdeteksi ({aiResult.detected_damages.length}):
                                                    </p>
                                                    {aiResult.detected_damages.map((dmg, idx) => (
                                                        <div key={idx} className="rounded-lg bg-white/70 p-2 text-[11px] text-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                                                            <span className="font-bold">{dmg.location}</span>: {dmg.description} ({dmg.severity})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Card 5: Return Signature */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    5
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Tanda Tangan Digital Pengembalian
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Tanda tangan pelanggan atau penerima unit saat mobil selesai diperiksa.
                                    </p>
                                </div>
                            </div>

                            <SignaturePad
                                className="mt-1"
                                value={form.data.return_signature}
                                onChange={(val) => form.setData('return_signature', val)}
                            />
                            <InputError message={form.errors.return_signature} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                        <Link href={prefixedRoute('rental.show', rental.id)}>
                            <SecondaryButton type="button" className="rounded-2xl px-5 py-2.5 text-xs font-bold shadow-2xs">
                                ← {t('common.cancel', undefined, 'Batal & Kembali')}
                            </SecondaryButton>
                        </Link>

                        <PrimaryButton
                            type="submit"
                            disabled={form.processing}
                            className="rounded-2xl px-6 py-3 text-sm font-black shadow-md bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                        >
                            {form.processing
                                ? 'Menyimpan Pengembalian...'
                                : '🏁 Simpan Pengembalian Unit (Check-In)'}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}

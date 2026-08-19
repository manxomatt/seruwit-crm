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
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
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
    total_amount: string;
    deposit_amount: string;
    deposit_status?: string | null;
    deposit_received_at?: string | null;
    pickup_customer_signature_path?: string | null;
    vehicle: Vehicle;
    partner: Partner;
    driver?: Driver | null;
}

interface Props {
    rental: Rental;
    fuelLevels: string[];
    checklistItems: string[];
    depositBlocksCheckout: boolean;
    checkoutBlockedReason?: string | null;
    pickupCustomerSignatureUrl?: string | null;
}

export default function Checkout({
    rental,
    fuelLevels,
    checklistItems,
    depositBlocksCheckout,
    checkoutBlockedReason,
    pickupCustomerSignatureUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

    const form = useForm({
        start_odometer: '',
        start_fuel_level: 'full',
        checkout_checklist: checklistItems.reduce<Record<string, boolean>>((acc, key) => {
            acc[key] = true;
            return acc;
        }, {}),
        checkout_notes: '',
        checkout_photos: [] as string[],
        checkout_signature: '',
        checkout_staff_signature: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(prefixedRoute('rental.checkout', rental.id));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('rental.pages.checkout.title', undefined, 'Serah Terima & Checkout Unit')}
                    subtitle={`Proses serah terima kendaraan kepada pelanggan untuk Booking ${rental.code}`}
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
            <Head title={`Checkout ${rental.code} - ${rental.vehicle.name}`} />

            <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                {/* Warning / Deposit Alert */}
                {depositBlocksCheckout && (
                    <div className="rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 text-xs font-semibold text-amber-900 shadow-2xs dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <div>
                                <p className="font-bold text-sm">Deposit / Pembayaran Awal Diperlukan</p>
                                <p className="mt-0.5 opacity-90">{checkoutBlockedReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Vehicle Info, Odometer, Fuel, Checklist, Notes (7 cols) */}
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
                                            {rental.partner.phone ? ` • 📞 ${rental.partner.phone}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/60">
                                    <span className="text-slate-400 font-bold">Jadwal Sewa:</span>
                                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                        📅 {formatDateDmY(rental.start_date)} → {formatDateDmY(rental.end_date)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card 1: Odometer & Fuel Level */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    1
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Kondisi Awal Odometer & Indikator BBM
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Catat angka odometer awal dan posisi indikator bahan bakar unit.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="start_odometer" value={`${t('rental.fields.start_odometer', undefined, 'Odometer Awal')} (KM) *`} />
                                    <div className="relative mt-1.5">
                                        <TextInput
                                            id="start_odometer"
                                            type="number"
                                            min="0"
                                            value={form.data.start_odometer}
                                            onChange={(e) => form.setData('start_odometer', e.target.value)}
                                            className="w-full !rounded-2xl pr-12 font-mono text-sm font-bold shadow-2xs"
                                            placeholder="Contoh: 45200"
                                            required
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-black text-slate-400">
                                            KM
                                        </span>
                                    </div>
                                    <InputError message={form.errors.start_odometer} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="start_fuel_level" value={t('rental.fields.fuel_level', undefined, 'Level BBM Awal')} />
                                    <div className="mt-1.5">
                                        <FuelLevelPicker
                                            value={form.data.start_fuel_level}
                                            onChange={(val) => form.setData('start_fuel_level', val)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Physical Checklist */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    2
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Checklist Kelengkapan & Kondisi Fisik
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Centang seluruh item kelengkapan dan kondisi fisik yang telah diperiksa bersama.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                {checklistItems.map((key) => (
                                    <ChecklistToggleCard
                                        key={key}
                                        label={t(`rental.checklist.items.${key}`, undefined, key)}
                                        checked={!!form.data.checkout_checklist[key]}
                                        onChange={(checked) => form.setData('checkout_checklist', {
                                            ...form.data.checkout_checklist,
                                            [key]: checked,
                                        })}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Card 3: Notes */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    3
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Catatan Serah Terima
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Catatan khusus, kondisi tambahan, atau barang bawaan penyewa (opsional).
                                    </p>
                                </div>
                            </div>

                            <textarea
                                id="checkout_notes"
                                rows={3}
                                value={form.data.checkout_notes}
                                onChange={(e) => form.setData('checkout_notes', e.target.value)}
                                placeholder="Tuliskan catatan kondisi khusus saat serah terima..."
                                className="block w-full rounded-2xl border-slate-200 bg-white text-sm shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Right Column: Photos & Signatures (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Card 4: Documentation Photos */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    4
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Foto Dokumentasi Unit
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Unggah 1–5 foto bukti serah terima (eksterior 4 sisi, dashboard, interior).
                                    </p>
                                </div>
                            </div>

                            <HandoverPhotoPicker
                                id="checkout_photos"
                                label={t('rental.fields.checkout_photos', undefined, 'Foto Unit Saat Serah Terima')}
                                value={form.data.checkout_photos}
                                onChange={(photos) => form.setData('checkout_photos', photos)}
                                error={form.errors.checkout_photos}
                            />
                        </div>

                        {/* Card 5: Signatures */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-black text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                    5
                                </span>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Tanda Tangan Digital Serah Terima
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        Tanda tangan digital kedua belah pihak sebagai bukti sah serah terima unit.
                                    </p>
                                </div>
                            </div>

                            {/* Customer Signature */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <InputLabel value="Tanda Tangan Penyewa (Pelanggan) *" />
                                    {pickupCustomerSignatureUrl && (
                                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            ✓ Terdaftar via PWA
                                        </span>
                                    )}
                                </div>
                                {pickupCustomerSignatureUrl && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                                        <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">
                                            ✓ Tanda Tangan PWA Pelanggan Tersedia
                                        </p>
                                        <img
                                            src={pickupCustomerSignatureUrl}
                                            alt="Tanda Tangan Pelanggan"
                                            className="h-14 max-w-full object-contain mx-auto bg-white p-1 rounded-xl border border-emerald-100 dark:border-emerald-900 shadow-2xs"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1.5">
                                            Tanda tangan ini akan otomatis digunakan jika tidak digambar ulang di bawah.
                                        </p>
                                    </div>
                                )}
                                <SignaturePad
                                    className="mt-1"
                                    value={form.data.checkout_signature}
                                    onChange={(val) => form.setData('checkout_signature', val)}
                                />
                                <InputError message={form.errors.checkout_signature} className="mt-1" />
                            </div>

                            {/* Staff Signature */}
                            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <InputLabel value="Tanda Tangan Staf / Petugas Penyerah Unit *" />
                                <SignaturePad
                                    className="mt-1"
                                    value={form.data.checkout_staff_signature}
                                    onChange={(val) => form.setData('checkout_staff_signature', val)}
                                />
                                <InputError message={form.errors.checkout_staff_signature} className="mt-1" />
                            </div>
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

                        <div className="flex items-center gap-3">
                            {depositBlocksCheckout ? (
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    ⚠️ Deposit harus diterima sebelum checkout
                                </p>
                            ) : null}
                            <PrimaryButton
                                type="submit"
                                disabled={form.processing || depositBlocksCheckout}
                                className="rounded-2xl px-6 py-3 text-sm font-black shadow-md bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                            >
                                {form.processing
                                    ? 'Menyimpan Serah Terima...'
                                    : '🚗 Selesaikan Serah Terima Unit (Checkout)'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}

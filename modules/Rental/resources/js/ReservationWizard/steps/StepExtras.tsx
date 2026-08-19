import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import MoneyInput from '@/Components/MoneyInput';
import Select from '@/Components/Select';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import PreviousStepsSummary from '../PreviousStepsSummary';
import type { AvailableVehicle, DriverOption, InsurancePackage, ReservationFormData } from '../types';
import { formatMoney } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    drivers: DriverOption[];
    insurancePackages: InsurancePackage[];
    isOneWay: boolean;
    selectedVehicle: AvailableVehicle | null;
}

export default function StepExtras({
    data,
    setData,
    errors,
    drivers,
    insurancePackages,
    isOneWay,
    selectedVehicle,
}: Props): JSX.Element {
    const { t } = useTrans();

    const driverOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.no_driver', undefined, 'Lepas Kunci (Tanpa Supir)') },
            ...drivers.map((d) => ({
                value: String(d.id),
                label: `${d.name}${d.phone ? ` (${d.phone})` : ''}`,
            })),
        ],
        [drivers, t],
    );

    const fuelPresets = [
        'Penuh ke Penuh (Full-to-Full)',
        'Sesuai Posisi Berangkat (Same-to-Same)',
        'Minimal 1/4 Tangki',
        'Bebas / Pengembalian Kosong (Empty Return)',
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('rental.wizard.steps.4', undefined, 'Layanan Tambahan & Asuransi')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Lengkapi paket proteksi kendaraan, layanan supir, serta catatan operasional sewa.
                </p>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    {/* 1. Insurance Package Selection Cards */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-base font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                🛡️
                            </span>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {t('rental.fields.insurance_package', undefined, 'Paket Proteksi & Asuransi')}
                                </h4>
                                <p className="text-[11px] text-slate-400">Perlindungan kendaraan dari risiko kerusakan atau kecelakaan</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* Option: No Insurance */}
                            <button
                                type="button"
                                onClick={() => setData('insurance_package_id', '')}
                                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                                    !data.insurance_package_id
                                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            {t('rental.placeholders.no_insurance', undefined, 'Tanpa Proteksi Tambahan')}
                                        </p>
                                        {!data.insurance_package_id && (
                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">✓</span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Penyewa menanggung penuh risiko kerusakan sesuai kontrak standar.
                                    </p>
                                </div>
                                <span className="mt-3 text-xs font-black text-slate-600 dark:text-slate-300">
                                    Rp 0
                                </span>
                            </button>

                            {/* Options: Dynamic Insurance Packages */}
                            {insurancePackages.map((pkg) => {
                                const active = data.insurance_package_id === String(pkg.id);
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setData('insurance_package_id', String(pkg.id))}
                                        className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                                            active
                                                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs dark:border-slate-800 dark:bg-slate-900'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {pkg.name}
                                                </p>
                                                {active && (
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">✓</span>
                                                )}
                                            </div>
                                            {pkg.description && (
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    {pkg.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                {formatMoney(pkg.amount)}
                                            </span>
                                            <span className="text-[10px] text-slate-400">/hari</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.insurance_package_id} className="mt-1.5" />
                    </div>

                    {/* 2. Driver Service & Route Fee */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-base font-bold text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                                👨‍✈️
                            </span>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {t('rental.fields.driver_optional', undefined, 'Layanan Pengemudi (Driver)')}
                                </h4>
                                <p className="text-[11px] text-slate-400">Pilih supir jika penyewa memesan layanan dengan supir (All-In / With Driver)</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="driver_id" value={t('rental.fields.driver_optional', undefined, 'Pilih Driver')} />
                                <Select
                                    id="driver_id"
                                    className="mt-1 w-full text-xs"
                                    value={data.driver_id}
                                    onChange={(value) => setData('driver_id', value)}
                                    placeholder={t('rental.placeholders.no_driver', undefined, 'Lepas Kunci (Tanpa Supir)')}
                                    options={driverOptions}
                                />
                                <InputError message={errors.driver_id} className="mt-1" />
                            </div>

                            {isOneWay && (
                                <div>
                                    <InputLabel htmlFor="one_way_fee_amount" value={t('rental.fields.one_way_fee', undefined, 'Biaya One-Way (Relokasi Cabang)')} />
                                    <MoneyInput
                                        id="one_way_fee_amount"
                                        value={data.one_way_fee_amount}
                                        onChange={(value) => setData('one_way_fee_amount', value)}
                                        className="mt-1 w-full text-xs"
                                    />
                                    <InputError message={errors.one_way_fee_amount} className="mt-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Fuel Policy & Rental Notes */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                                ⛽
                            </span>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {t('rental.fields.fuel_policy_notes', undefined, 'Kebijakan BBM & Catatan Khusus')}
                                </h4>
                                <p className="text-[11px] text-slate-400">Aturan pengembalian bahan bakar dan instruksi khusus</p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <InputLabel htmlFor="fuel_policy_notes" value={t('rental.fields.fuel_policy_notes', undefined, 'Kebijakan Bahan Bakar (BBM)')} />
                                <div className="mb-2 mt-1.5 flex flex-wrap gap-1.5">
                                    {fuelPresets.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setData('fuel_policy_notes', preset)}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    id="fuel_policy_notes"
                                    rows={2}
                                    value={data.fuel_policy_notes}
                                    onChange={(e) => setData('fuel_policy_notes', e.target.value)}
                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/70 p-3 text-xs font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                    placeholder={t('rental.placeholders.fuel_policy', undefined, 'Misal: Posisi BBM saat serah terima 4 bar, kembali wajib 4 bar...')}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value={t('rental.fields.notes', undefined, 'Catatan Internal & Operasional')} />
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/70 p-3 text-xs font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                                    placeholder="Instruksi serah terima, request khusus customer, dsb..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar */}
                <PreviousStepsSummary data={data} selectedVehicle={selectedVehicle} />
            </div>
        </div>
    );
}


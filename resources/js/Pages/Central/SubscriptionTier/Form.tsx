import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import React, { useMemo } from 'react';

interface Props {
    tier?: {
        id: number;
        name: string;
        min_vehicles: number;
        max_vehicles: number;
        price_per_vehicle: number;
    } | null;
}

const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function TierForm({ tier }: Props): JSX.Element {
    const { t } = useTrans();
    const isEdit = !!tier;
    const title = isEdit ? 'Edit Subscription Tier' : 'Buat Subscription Tier';

    const { data, setData, post, patch, processing, errors } = useForm({
        name: tier?.name || '',
        min_vehicles: tier?.min_vehicles || 1,
        max_vehicles: tier?.max_vehicles || 10,
        price_per_vehicle: tier?.price_per_vehicle || 20000,
    });

    const basePrice = 20000;
    const discountPercent = useMemo(() => {
        const p = Number(data.price_per_vehicle) || 0;
        if (basePrice <= p) return 0;
        return Math.round((1 - p / basePrice) * 100);
    }, [data.price_per_vehicle]);

    const sampleMin = useMemo(() => {
        return (Number(data.min_vehicles) || 1) * (Number(data.price_per_vehicle) || 0);
    }, [data.min_vehicles, data.price_per_vehicle]);

    const sampleMax = useMemo(() => {
        const maxV = Number(data.max_vehicles) || 1;
        if (maxV > 100000) return null;
        return maxV * (Number(data.price_per_vehicle) || 0);
    }, [data.max_vehicles, data.price_per_vehicle]);

    const submit = (e: React.FormEvent): void => {
        e.preventDefault();
        if (isEdit && tier) {
            patch(route('module.subscription-tiers.update', tier.id));
        } else {
            post(route('module.subscription-tiers.store'));
        }
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={title}
                    description="Konfigurasikan rentang armada dan tarif per unit untuk tier langganan"
                />
            }
        >
            <Head title={title} />

            <div className="mx-auto max-w-3xl space-y-6">
                <form onSubmit={submit}>
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
                        {/* Section 1: Tier Identification */}
                        <div>
                            <InputLabel htmlFor="name" value="Nama Tier" />
                            <TextInput
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Tier 1 - Armada Starter (1-10 Unit)"
                                className="mt-1.5 w-full !rounded-xl"
                                required
                            />
                            <InputError message={errors.name} className="mt-1.5" />
                            <p className="mt-1 text-[11px] text-slate-400">
                                Berikan nama deskriptif yang mudah dipahami oleh tenant.
                            </p>
                        </div>

                        {/* Section 2: Vehicle Capacity Range */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="min_vehicles" value="Batas Minimum Unit" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="min_vehicles"
                                        type="number"
                                        min={1}
                                        value={data.min_vehicles}
                                        onChange={(e) => setData('min_vehicles', parseInt(e.target.value) || 1)}
                                        className="w-full !rounded-xl pr-12 font-mono"
                                        required
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                                        Unit
                                    </span>
                                </div>
                                <InputError message={errors.min_vehicles} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="max_vehicles" value="Batas Maksimum Unit" />
                                <div className="relative mt-1.5">
                                    <TextInput
                                        id="max_vehicles"
                                        type="number"
                                        min={Number(data.min_vehicles) || 1}
                                        value={data.max_vehicles}
                                        onChange={(e) => setData('max_vehicles', parseInt(e.target.value) || 1)}
                                        className="w-full !rounded-xl pr-12 font-mono"
                                        required
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                                        Unit
                                    </span>
                                </div>
                                <InputError message={errors.max_vehicles} className="mt-1.5" />
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Gunakan angka besar (contoh: 999999) untuk batas tak terhingga (∞).
                                </p>
                            </div>
                        </div>

                        {/* Section 3: Unit Pricing */}
                        <div>
                            <InputLabel htmlFor="price_per_vehicle" value="Tarif per Kendaraan (Rp / Unit / Bulan)" />
                            <div className="relative mt-1.5">
                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-400">
                                    Rp
                                </span>
                                <TextInput
                                    id="price_per_vehicle"
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={data.price_per_vehicle}
                                    onChange={(e) => setData('price_per_vehicle', parseFloat(e.target.value) || 0)}
                                    className="w-full !rounded-xl pl-10 pr-24 font-mono text-base font-bold"
                                    required
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                                    / unit / bln
                                </span>
                            </div>
                            <InputError message={errors.price_per_vehicle} className="mt-1.5" />

                            {discountPercent > 0 ? (
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>Volume Diskon: Hemat {discountPercent}% dari tarif dasar Tier 1 ({formatRupiah(basePrice)})</span>
                                </div>
                            ) : (
                                <div className="mt-2 text-xs text-slate-400">
                                    Tarif standar (Tier 1 atau tanpa diskon volume).
                                </div>
                            )}
                        </div>

                        {/* Section 4: Live Price Preview */}
                        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                        ⚡
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Pratinjau Kalkulasi Otomatis
                                    </h4>
                                </div>
                                <span className="rounded-md bg-white dark:bg-slate-700 px-2 py-0.5 text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600">
                                    {data.min_vehicles} – {Number(data.max_vehicles) > 100000 ? '∞' : data.max_vehicles} Unit
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 text-xs pt-1">
                                <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200/60 dark:border-slate-800">
                                    <div className="text-slate-400 text-[11px]">Batas Minimum ({data.min_vehicles} unit):</div>
                                    <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                        {formatRupiah(sampleMin)}
                                        <span className="text-xs font-normal text-slate-400"> / bulan</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        Tahunan: {formatRupiah(sampleMin * 10)}
                                    </div>
                                </div>

                                {sampleMax && (
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-200/60 dark:border-slate-800">
                                        <div className="text-slate-400 text-[11px]">Batas Maksimum ({data.max_vehicles} unit):</div>
                                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                            {formatRupiah(sampleMax)}
                                            <span className="text-xs font-normal text-slate-400"> / bulan</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            Tahunan: {formatRupiah(sampleMax * 10)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 5: Notice */}
                        <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 p-4 text-xs text-indigo-900 dark:text-indigo-300">
                            <span className="font-bold">Catatan:</span> Perubahan konfigurasi tier akan langsung berlaku untuk semua kalkulasi langganan tenant baru maupun perpanjangan.
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                            <Link
                                href={route('module.subscription-tiers.index')}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </Link>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="!rounded-xl text-xs shadow-sm"
                            >
                                {processing
                                    ? 'Menyimpan…'
                                    : isEdit
                                    ? 'Perbarui Tier'
                                    : 'Simpan Tier'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}


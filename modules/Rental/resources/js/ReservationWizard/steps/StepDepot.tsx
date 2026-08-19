import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import type { LocationOption, ReservationFormData } from '../types';
import { locationLabel } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    locations: LocationOption[];
    onApplyLocation: (field: 'pickup' | 'return', locationId: string) => void;
}

export default function StepDepot({
    data,
    setData,
    errors,
    locations,
    onApplyLocation,
}: Props): JSX.Element {
    const { t } = useTrans();

    const locationOptions = useMemo(
        () => [
            { value: '', label: t('rental.placeholders.select_location', undefined, '-- Pilih Cabang / Pool --') },
            ...locations.map((location) => ({ value: String(location.id), label: locationLabel(location) })),
        ],
        [locations, t],
    );

    const isSameLocation =
        data.pickup_location_id &&
        data.return_location_id &&
        data.pickup_location_id === data.return_location_id;

    const isOneWay =
        data.pickup_location_id &&
        data.return_location_id &&
        data.pickup_location_id !== data.return_location_id;

    const handleSyncReturn = () => {
        if (data.pickup_location_id) {
            onApplyLocation('return', data.pickup_location_id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {t('rental.wizard.steps.3', undefined, 'Cabang & Lokasi Serah Terima')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Tentukan titik cabang pengambilan unit dan cabang pengembalian akhir.
                    </p>
                </div>

                {data.pickup_location_id && !isSameLocation && (
                    <button
                        type="button"
                        onClick={handleSyncReturn}
                        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
                    >
                        <span>🔄</span>
                        <span>Samakan Lokasi Pengembalian (PP)</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 1. Pickup Branch Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-base font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            📍
                        </span>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                {t('rental.fields.pickup_branch', undefined, 'Cabang Pengambilan (Pickup)')} *
                            </h4>
                            <p className="text-[11px] text-slate-400">Titik serah terima awal kendaraan</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <InputLabel htmlFor="pickup_location_id" value={t('rental.fields.pickup_branch', undefined, 'Pilih Cabang / Pool')} />
                            <Select
                                id="pickup_location_id"
                                options={locationOptions}
                                value={data.pickup_location_id}
                                onChange={(value) => onApplyLocation('pickup', value)}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={errors.pickup_location_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="pickup_location" value={t('rental.fields.pickup_location', undefined, 'Alamat / Catatan Lokasi Jemput')} />
                            <TextInput
                                id="pickup_location"
                                value={typeof data.pickup_location === 'string' ? data.pickup_location : ''}
                                onChange={(e) => setData('pickup_location', e.target.value)}
                                placeholder="Alamat spesifik, hotel, bandara, atau detail jemput..."
                                className="mt-1 w-full text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Return Branch Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base font-bold text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                            🏁
                        </span>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                {t('rental.fields.return_branch', undefined, 'Cabang Pengembalian (Return)')} *
                            </h4>
                            <p className="text-[11px] text-slate-400">Titik akhir pengembalian kendaraan</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <InputLabel htmlFor="return_location_id" value={t('rental.fields.return_branch', undefined, 'Pilih Cabang / Pool')} />
                            <Select
                                id="return_location_id"
                                options={locationOptions}
                                value={data.return_location_id}
                                onChange={(value) => onApplyLocation('return', value)}
                                className="mt-1 w-full text-xs"
                            />
                            <InputError message={errors.return_location_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="return_location" value={t('rental.fields.return_location', undefined, 'Alamat / Catatan Lokasi Kembali')} />
                            <TextInput
                                id="return_location"
                                value={typeof data.return_location === 'string' ? data.return_location : ''}
                                onChange={(e) => setData('return_location', e.target.value)}
                                placeholder="Alamat pengembalian atau catatan drop-off..."
                                className="mt-1 w-full text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* One-Way Fee Detection Alert */}
            {isOneWay && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    <span className="text-lg">⚡</span>
                    <div>
                        <p className="font-bold">Rute Antar Kota / One-Way Terdeteksi</p>
                        <p className="mt-0.5 text-xs opacity-90">
                            {t('rental.wizard.one_way_fee_applied', undefined, 'Biaya relokasi armada (One-Way Fee) akan otomatis ditambahkan karena cabang jemput dan kembali berbeda.')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}


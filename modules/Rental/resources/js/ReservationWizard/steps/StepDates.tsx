import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useMemo } from 'react';
import type { ReservationFormData } from '../types';
import { PERIOD_TYPES, addDays, addMonths, formatDate, todayKey } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
}

export default function StepDates({
    data,
    setData,
    errors,
}: Props): JSX.Element {
    const { t } = useTrans();
    const today = todayKey();

    const periodCards = useMemo(
        () => [
            {
                type: 'daily',
                icon: '📅',
                title: t('rental.period_type.daily', undefined, 'Harian'),
                desc: 'Sewa fleksibel hitungan hari',
            },
            {
                type: 'weekly',
                icon: '🗓️',
                title: t('rental.period_type.weekly', undefined, 'Mingguan'),
                desc: 'Paket hemat 7 hari penuh',
            },
            {
                type: 'monthly',
                icon: '🏢',
                title: t('rental.period_type.monthly', undefined, 'Bulanan'),
                desc: 'Paket jangka panjang 30 hari',
            },
        ],
        [t],
    );

    const calculatedDays = useMemo(() => {
        if (!data.start_date || !data.end_date) return null;
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 0;
    }, [data.start_date, data.end_date]);

    const setQuickDuration = (days: number) => {
        const start = data.start_date ? new Date(data.start_date) : new Date();
        const end = addDays(start, days);
        setData('start_date', formatDate(start));
        setData('end_date', formatDate(end));
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('rental.wizard.steps.1', undefined, 'Tentukan Periode & Tanggal Sewa')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Pilih skema waktu sewa yang diinginkan untuk menentukan ketersediaan unit armada dan kalkulasi tarif.
                </p>
            </div>

            {/* 1. Period Type Cards */}
            <div>
                <InputLabel value={`${t('rental.fields.period_type', undefined, 'Tipe Periode Sewa')} *`} />
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {periodCards.map((card) => {
                        const active = data.period_type === card.type;

                        return (
                            <button
                                key={card.type}
                                type="button"
                                onClick={() => {
                                    setData('period_type', card.type);
                                }}
                                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                                    active
                                        ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/40'
                                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                }`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg shadow-2xs dark:bg-slate-800">
                                    {card.icon}
                                </span>
                                <div>
                                    <p className={`text-sm font-bold ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                        {card.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        {card.desc}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <InputError message={errors.period_type} className="mt-1.5" />
            </div>

            {/* 2. Quick Presets */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        ⚡ Preset Durasi Cepat:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { label: '1 Hari', days: 0 },
                            { label: '3 Hari', days: 2 },
                            { label: '7 Hari (1 Minggu)', days: 6 },
                            { label: '14 Hari (2 Minggu)', days: 13 },
                            { label: '30 Hari (1 Bulan)', days: 29 },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => setQuickDuration(preset.days)}
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 shadow-2xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500 transition"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Date Range Form */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="start_date" value={`${t('rental.fields.start_date', undefined, 'Tanggal Mulai Sewa')} *`} />
                    <TextInput
                        id="start_date"
                        type="date"
                        value={data.start_date}
                        onChange={(e) => setData('start_date', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.start_date} className="mt-1" />
                </div>
                <div>
                    <InputLabel htmlFor="end_date" value={`${t('rental.fields.end_date', undefined, 'Tanggal Selesai Sewa')} *`} />
                    <TextInput
                        id="end_date"
                        type="date"
                        value={data.end_date}
                        min={data.start_date || today}
                        onChange={(e) => setData('end_date', e.target.value)}
                        className="mt-1 w-full"
                    />
                    <InputError message={errors.end_date} className="mt-1" />
                </div>
            </div>

            {/* Calculated Duration Banner */}
            {calculatedDays !== null && (
                <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <div className="flex items-center gap-2">
                        <span className="text-base">⏳</span>
                        <span>
                            Total Durasi Sewa: <strong className="font-black text-indigo-700 dark:text-indigo-300">{calculatedDays === 0 ? '1 Hari (Same-day)' : `${calculatedDays + 1} Hari (${calculatedDays} Malam)`}</strong>
                        </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {data.start_date} ➔ {data.end_date}
                    </span>
                </div>
            )}
        </div>
    );
}


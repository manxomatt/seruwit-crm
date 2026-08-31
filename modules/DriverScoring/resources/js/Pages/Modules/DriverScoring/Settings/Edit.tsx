import InputError from '@/Components/InputError';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import ScoringNav from '../../../../ScoringNav';

interface Settings {
    harsh_brake_kph_per_s: string | number;
    harsh_accel_kph_per_s: string | number;
    speeding_limit_kph: string | number;
    idle_speed_kph: string | number;
    idle_minutes: number;
    min_sample_seconds: number;
    max_sample_seconds: number;
    event_dedupe_seconds: number;
    daily_base_points: number;
    points_harsh_brake: number;
    points_harsh_accel: number;
    points_speeding: number;
    points_idle: number;
}

interface Props {
    settings: Settings;
}

// Preset Configurations
interface PresetConfig {
    name: string;
    description: string;
    badge: string;
    icon: string;
    values: Partial<Record<keyof Settings, string | number>>;
}

const PRESETS: PresetConfig[] = [
    {
        name: 'Standar Logistik',
        description: 'Parameter seimbang untuk armada ekspedisi, kargo umum, dan distribusi harian.',
        badge: 'Rekomendasi',
        icon: '🛡️',
        values: {
            harsh_brake_kph_per_s: '10.00',
            harsh_accel_kph_per_s: '10.00',
            speeding_limit_kph: '80.00',
            idle_speed_kph: '3.00',
            idle_minutes: 10,
            min_sample_seconds: 1,
            max_sample_seconds: 30,
            event_dedupe_seconds: 60,
            daily_base_points: 100,
            points_harsh_brake: -5,
            points_harsh_accel: -4,
            points_speeding: -10,
            points_idle: -3,
        },
    },
    {
        name: 'Ketat / High Safety',
        description: 'Ketegasan tinggi untuk armada muatan berbahaya (B3), tangki BBM/LPG, atau area tambang.',
        badge: 'Sensitif',
        icon: '🚨',
        values: {
            harsh_brake_kph_per_s: '8.00',
            harsh_accel_kph_per_s: '8.00',
            speeding_limit_kph: '70.00',
            idle_speed_kph: '2.00',
            idle_minutes: 5,
            min_sample_seconds: 1,
            max_sample_seconds: 20,
            event_dedupe_seconds: 45,
            daily_base_points: 100,
            points_harsh_brake: -8,
            points_harsh_accel: -6,
            points_speeding: -15,
            points_idle: -5,
        },
    },
    {
        name: 'Fleksibel / Urban',
        description: 'Toleransi lalu lintas padat untuk kurir dalam kota, van penumpang, dan angkutan ringan.',
        badge: 'Toleran',
        icon: '🏙️',
        values: {
            harsh_brake_kph_per_s: '13.00',
            harsh_accel_kph_per_s: '12.00',
            speeding_limit_kph: '90.00',
            idle_speed_kph: '4.00',
            idle_minutes: 15,
            min_sample_seconds: 2,
            max_sample_seconds: 45,
            event_dedupe_seconds: 90,
            daily_base_points: 100,
            points_harsh_brake: -3,
            points_harsh_accel: -2,
            points_speeding: -6,
            points_idle: -2,
        },
    },
];

export default function Edit({ settings }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const { data, setData, patch, processing, errors, isDirty, reset, recentlySuccessful } = useForm({
        harsh_brake_kph_per_s: String(settings.harsh_brake_kph_per_s),
        harsh_accel_kph_per_s: String(settings.harsh_accel_kph_per_s),
        speeding_limit_kph: String(settings.speeding_limit_kph),
        idle_speed_kph: String(settings.idle_speed_kph),
        idle_minutes: String(settings.idle_minutes),
        min_sample_seconds: String(settings.min_sample_seconds),
        max_sample_seconds: String(settings.max_sample_seconds),
        event_dedupe_seconds: String(settings.event_dedupe_seconds),
        daily_base_points: String(settings.daily_base_points),
        points_harsh_brake: String(settings.points_harsh_brake),
        points_harsh_accel: String(settings.points_harsh_accel),
        points_speeding: String(settings.points_speeding),
        points_idle: String(settings.points_idle),
    });

    // Simulation State for Live Score Preview
    const [simHarshBrake, setSimHarshBrake] = useState<number>(1);
    const [simHarshAccel, setSimHarshAccel] = useState<number>(1);
    const [simSpeeding, setSimSpeeding] = useState<number>(1);
    const [simIdle, setSimIdle] = useState<number>(0);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('scoring.settings.update'), {
            preserveScroll: true,
        });
    };

    const applyPreset = (preset: PresetConfig) => {
        Object.entries(preset.values).forEach(([key, val]) => {
            if (val !== undefined) {
                setData(key as keyof typeof data, String(val));
            }
        });
    };

    // Calculate simulated score
    const simulatedScore = useMemo(() => {
        const base = Number(data.daily_base_points) || 100;
        const pBrake = Number(data.points_harsh_brake) || 0;
        const pAccel = Number(data.points_harsh_accel) || 0;
        const pSpeed = Number(data.points_speeding) || 0;
        const pIdle = Number(data.points_idle) || 0;

        const totalDeductions =
            simHarshBrake * Math.abs(pBrake) +
            simHarshAccel * Math.abs(pAccel) +
            simSpeeding * Math.abs(pSpeed) +
            simIdle * Math.abs(pIdle);

        return Math.max(0, base - totalDeductions);
    }, [data, simHarshBrake, simHarshAccel, simSpeeding, simIdle]);

    const scoreGrade = useMemo(() => {
        if (simulatedScore >= 90) {
            return {
                label: 'Sangat Baik (S)',
                color: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-500',
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
            };
        }
        if (simulatedScore >= 80) {
            return {
                label: 'Baik (A)',
                color: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-500',
                badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
            };
        }
        if (simulatedScore >= 65) {
            return {
                label: 'Cukup (B)',
                color: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-500',
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
            };
        }
        return {
            label: 'Perlu Evaluasi (C)',
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-500',
            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        };
    }, [simulatedScore]);

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Pengaturan Parameter Scoring & Telemetri"
                    subtitle="Konfigurasikan batas sensitivitas deteksi GPS Traccar (pengereman, akselerasi, speeding, idle) serta bobot penalti pengurangan skor pengemudi."
                />
            }
        >
            <Head title="Pengaturan Driver Scoring" />

            <ScoringNav />

            <form onSubmit={submit} className="space-y-6">
                {/* Header Action Banner */}
                <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-black text-slate-900 dark:text-white">
                                    Konfigurasi Algoritma Penilaian
                                </h2>
                                {isDirty && (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                        Perubahan Belum Disimpan
                                    </span>
                                )}
                                {recentlySuccessful && (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        ✓ Pengaturan Tersimpan
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Berlaku otomatis untuk pemrosesan telemetri harian semua unit armada.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <SecondaryButton type="button" onClick={() => reset()} disabled={processing}>
                                Batalkan
                            </SecondaryButton>
                        )}
                        <PrimaryButton disabled={processing} className="px-5">
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </PrimaryButton>
                    </div>
                </div>

                {/* Main 2-Column Grid */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    {/* LEFT COLUMN: Main Form Inputs (8 Columns) */}
                    <div className="space-y-6 xl:col-span-8">
                        {/* ========================================================================= */}
                        {/* GROUP 1: DETEKSI EVENT PERILAKU */}
                        {/* ========================================================================= */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-base dark:bg-amber-950/60">
                                    🚗
                                </span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        1. Ambang Batas Deteksi Mengemudi (Telemetry Thresholds)
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Tentukan ambang batas fisika GPS untuk mengklasifikasikan insiden agresif.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                                {/* Harsh Brake */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Pengereman Mendadak (Harsh Brake)
                                        </label>
                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-750 dark:text-slate-300">
                                            km/jam per detik
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Penurunan kecepatan drastis dalam interval 1 detik.
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="1"
                                            value={data.harsh_brake_kph_per_s}
                                            onChange={(e) => setData('harsh_brake_kph_per_s', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <InputError message={errors.harsh_brake_kph_per_s} className="mt-1" />
                                </div>

                                {/* Harsh Accel */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Akselerasi Agresif (Harsh Accel)
                                        </label>
                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-750 dark:text-slate-300">
                                            km/jam per detik
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Hentakan gas spontan dalam interval 1 detik.
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="1"
                                            value={data.harsh_accel_kph_per_s}
                                            onChange={(e) => setData('harsh_accel_kph_per_s', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <InputError message={errors.harsh_accel_kph_per_s} className="mt-1" />
                                </div>

                                {/* Speeding Limit */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Batas Kecepatan Maksimal (Speeding Limit)
                                        </label>
                                        <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                                            Batas Aman Maksimum
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Laju kendaraan di atas batas ini otomatis dicatat sebagai insiden speeding.
                                    </p>
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                step="1"
                                                min="10"
                                                value={data.speeding_limit_kph}
                                                onChange={(e) => setData('speeding_limit_kph', e.target.value)}
                                                className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                km/jam
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {[60, 70, 80, 90, 100].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setData('speeding_limit_kph', String(val))}
                                                    className={`rounded-lg border px-2 py-1 text-xs font-black transition ${
                                                        Number(data.speeding_limit_kph) === val
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <InputError message={errors.speeding_limit_kph} className="mt-1" />
                                </div>

                                {/* Idle Speed Max */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Batas Kecepatan Diam (Idle Max Speed)
                                        </label>
                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-750 dark:text-slate-300">
                                            km/jam
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Kecepatan GPS maksimum sebelum dianggap kendaraan diam di tempat.
                                    </p>
                                    <div className="mt-3">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={data.idle_speed_kph}
                                            onChange={(e) => setData('idle_speed_kph', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <InputError message={errors.idle_speed_kph} className="mt-1" />
                                </div>

                                {/* Idle Duration */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Durasi Minimum Idle (Menit)
                                        </label>
                                        <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-750 dark:text-slate-300">
                                            Menit
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Mesin menyala tanpa gerak sebelum dihitung sebagai pemborosan BBM.
                                    </p>
                                    <div className="mt-3">
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={data.idle_minutes}
                                            onChange={(e) => setData('idle_minutes', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <InputError message={errors.idle_minutes} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* GROUP 2: BOBOT PENGURANGAN SKOR & POIN */}
                        {/* ========================================================================= */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-base dark:bg-rose-950/60">
                                    ⚖️
                                </span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        2. Bobot Penalti & Pengurangan Poin (Score Deductions)
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Skor awal harian diberikan 100 poin, lalu dipotong setiap pelanggaran terdeteksi.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {/* Base Points */}
                                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950 dark:bg-indigo-950/30 sm:flex-row sm:items-center">
                                    <div>
                                        <label className="text-xs font-black text-slate-900 dark:text-white">
                                            Poin Dasar Awal Harian (Daily Base Score)
                                        </label>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Skor awal sempurna sebelum terkena pinalti pelanggaran.
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-36">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data.daily_base_points}
                                                onChange={(e) => setData('daily_base_points', e.target.value)}
                                                className="w-full rounded-xl border-indigo-200 bg-white font-mono text-base font-black text-indigo-700 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                Poin
                                            </span>
                                        </div>
                                        <InputError message={errors.daily_base_points} className="mt-1" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Penalty Harsh Brake */}
                                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 dark:text-white">
                                                Penalti Pengereman Mendadak
                                            </label>
                                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                                per insiden
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Pengurangan nilai per satu kali rem keras.
                                        </p>
                                        <div className="relative mt-3">
                                            <input
                                                type="number"
                                                max="0"
                                                value={data.points_harsh_brake}
                                                onChange={(e) => setData('points_harsh_brake', e.target.value)}
                                                className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-rose-600 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                poin
                                            </span>
                                        </div>
                                        <InputError message={errors.points_harsh_brake} className="mt-1" />
                                    </div>

                                    {/* Penalty Harsh Accel */}
                                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 dark:text-white">
                                                Penalti Akselerasi Agresif
                                            </label>
                                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                                per insiden
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Pengurangan nilai per satu kali hentakan gas.
                                        </p>
                                        <div className="relative mt-3">
                                            <input
                                                type="number"
                                                max="0"
                                                value={data.points_harsh_accel}
                                                onChange={(e) => setData('points_harsh_accel', e.target.value)}
                                                className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-rose-600 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                poin
                                            </span>
                                        </div>
                                        <InputError message={errors.points_harsh_accel} className="mt-1" />
                                    </div>

                                    {/* Penalty Speeding */}
                                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 dark:text-white">
                                                Penalti Melebihi Kecepatan
                                            </label>
                                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                                per insiden
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Pengurangan nilai per satu kejadian overspeed.
                                        </p>
                                        <div className="relative mt-3">
                                            <input
                                                type="number"
                                                max="0"
                                                value={data.points_speeding}
                                                onChange={(e) => setData('points_speeding', e.target.value)}
                                                className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-rose-600 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                poin
                                            </span>
                                        </div>
                                        <InputError message={errors.points_speeding} className="mt-1" />
                                    </div>

                                    {/* Penalty Idle */}
                                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 transition focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-850/50 dark:focus-within:bg-slate-900">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-900 dark:text-white">
                                                Penalti Mesin Diam (Idle Excess)
                                            </label>
                                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                                                per durasi
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            Pengurangan nilai per kelipatan durasi idle.
                                        </p>
                                        <div className="relative mt-3">
                                            <input
                                                type="number"
                                                max="0"
                                                value={data.points_idle}
                                                onChange={(e) => setData('points_idle', e.target.value)}
                                                className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-rose-600 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                                            />
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                                poin
                                            </span>
                                        </div>
                                        <InputError message={errors.points_idle} className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========================================================================= */}
                        {/* GROUP 3: INTERVAL GPS & DEDUPLIKASI EVENT */}
                        {/* ========================================================================= */}
                        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-slate-800">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-base dark:bg-sky-950/60">
                                    🛰️
                                </span>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        3. Parameter Sampel GPS & Anti-Duplikasi (Telemetry Filters)
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Kontrol kualitas data posisi GPS dari server Traccar sebelum dianalisis.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Min Sample Gap */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                                    <label className="text-xs font-black text-slate-900 dark:text-white">
                                        Jeda Sampel Min.
                                    </label>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Interval sinyal GPS terpendek.
                                    </p>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.min_sample_seconds}
                                            onChange={(e) => setData('min_sample_seconds', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                            detik
                                        </span>
                                    </div>
                                    <InputError message={errors.min_sample_seconds} className="mt-1" />
                                </div>

                                {/* Max Sample Gap */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                                    <label className="text-xs font-black text-slate-900 dark:text-white">
                                        Jeda Sampel Maks.
                                    </label>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Batas jeda sebelum sinyal diskip.
                                    </p>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            min="5"
                                            value={data.max_sample_seconds}
                                            onChange={(e) => setData('max_sample_seconds', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                            detik
                                        </span>
                                    </div>
                                    <InputError message={errors.max_sample_seconds} className="mt-1" />
                                </div>

                                {/* Dedupe Window */}
                                <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-850/50">
                                    <label className="text-xs font-black text-slate-900 dark:text-white">
                                        Jendela Deduplikasi
                                    </label>
                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                        Anti-double hit insiden sama.
                                    </p>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            min="5"
                                            value={data.event_dedupe_seconds}
                                            onChange={(e) => setData('event_dedupe_seconds', e.target.value)}
                                            className="w-full rounded-xl border-slate-300 font-mono text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-400">
                                            detik
                                        </span>
                                    </div>
                                    <InputError message={errors.event_dedupe_seconds} className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Live Score Simulator & Presets (4 Columns) */}
                    <div className="space-y-6 xl:col-span-4">
                        {/* SIMULATOR CARD */}
                        <div className="sticky top-6 space-y-6">
                            <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-500/5 via-white to-sky-500/5 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🎯</span>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Simulasi Skor Harian
                                        </h3>
                                    </div>
                                    <span className={`rounded-xl border px-2 py-0.5 text-[11px] font-black ${scoreGrade.badgeBg}`}>
                                        {scoreGrade.label}
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Uji dampak parameter penalti terhadap hasil penilaian skor pengemudi.
                                </p>

                                {/* Live Score Gauge */}
                                <div className="mt-4 rounded-2xl bg-white p-4 text-center shadow-2xs dark:bg-slate-800">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Estimasi Skor Pengemudi
                                    </span>
                                    <div className="mt-1 flex items-baseline justify-center gap-1">
                                        <span className={`font-mono text-4xl font-black ${scoreGrade.color}`}>
                                            {simulatedScore}
                                        </span>
                                        <span className="text-sm font-bold text-slate-400">/ 100</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                        <div
                                            className={`h-full transition-all duration-300 ${scoreGrade.bg}`}
                                            style={{ width: `${Math.min(100, Math.max(0, simulatedScore))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Simulation Controls */}
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">
                                            🛑 Pengereman Keras ({data.points_harsh_brake} pts):
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setSimHarshBrake(Math.max(0, simHarshBrake - 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center font-mono font-black text-slate-900 dark:text-white">
                                                {simHarshBrake}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSimHarshBrake(simHarshBrake + 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">
                                            🚀 Akselerasi Keras ({data.points_harsh_accel} pts):
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setSimHarshAccel(Math.max(0, simHarshAccel - 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center font-mono font-black text-slate-900 dark:text-white">
                                                {simHarshAccel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSimHarshAccel(simHarshAccel + 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">
                                            ⚡ Speeding Overlimit ({data.points_speeding} pts):
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setSimSpeeding(Math.max(0, simSpeeding - 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center font-mono font-black text-slate-900 dark:text-white">
                                                {simSpeeding}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSimSpeeding(simSpeeding + 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">
                                            ⏳ Idle Berlebih ({data.points_idle} pts):
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setSimIdle(Math.max(0, simIdle - 1))}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center font-mono font-black text-slate-900 dark:text-white">
                                                {simIdle}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSimIdle(simIdle + 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRESET PROFILES */}
                            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">⚡</span>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        Preset Profil Standar
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">
                                    Pilih template cepat sesuai karakteristik operasi armada Anda.
                                </p>

                                <div className="mt-4 space-y-2.5">
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className="group flex w-full flex-col gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left transition hover:border-indigo-500 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-850/50 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/30"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-xs font-black text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                                                    <span>{preset.icon}</span>
                                                    <span>{preset.name}</span>
                                                </span>
                                                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                                                    {preset.badge}
                                                </span>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-slate-400">
                                                {preset.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </DynamicLayout>
    );
}


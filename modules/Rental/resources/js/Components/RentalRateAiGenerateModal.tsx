import React, { useState } from 'react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Dialog, DialogPanel } from '@headlessui/react';
import axios from 'axios';
import type { RateTier, Vehicle } from '../Pages/Modules/Rental/Rates/shared';

export interface ExtractedRateData {
    name?: string;
    period_type?: 'daily' | 'weekly' | 'monthly';
    rate_per_period?: number;
    deposit_amount?: number;
    km_limit_per_period?: number | null;
    excess_km_rate?: number;
    late_fee_per_day?: number;
    priority?: number;
    vehicle_id?: string | number;
    rental_class?: string;
    vehicle_type?: string;
    is_active?: boolean;
    tiers?: RateTier[];
    explanation?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vehicles?: Vehicle[];
    rentalClasses?: Array<{ value: string; label: string }>;
    onApply: (data: ExtractedRateData) => void;
}

export default function RentalRateAiGenerateModal({
    isOpen,
    onClose,
    vehicles = [],
    rentalClasses = [],
    onApply,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [extracted, setExtracted] = useState<ExtractedRateData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const samplePrompts = [
        'Tarif Harian Avanza Veloz 450rb lepas kunci deposit 500rb limit 200km kelebihan 2500/km. Sewa 3-6 hari diskon 10%, sewa 7+ hari diskon 20%, loyalty 5x order diskon 15%',
        'Paket Mingguan Innova Zenix Luxury 3.2jt deposit 1.5jt limit 1500km, loyalty pelanggan 3x rental diskon 10%',
        'Tarif Bulanan Truk Canter Box 12jt deposit 3jt tanpa batas kilometer, denda telat 100rb per hari',
        'Tarif Harian Kelas SUV 650rb deposit 750rb limit 250km, sewa 4+ hari diskon 12%',
    ];

    const handleGenerate = async () => {
        const text = prompt.trim();
        if (!text) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(prefixedRoute('rental.rates.ai-generate'), {
                text,
                vehicles: vehicles.map((v) => ({
                    id: v.id,
                    name: v.name,
                    plate_number: v.plate_number,
                    type: v.type,
                })),
                rentalClasses: rentalClasses.map((c) => ({
                    value: c.value,
                    label: c.label,
                })),
            });

            if (response.data?.success && response.data?.data) {
                setExtracted(response.data.data);
            } else {
                setError(response.data?.message || 'Gagal menghasilkan konfigurasi tarif dari AI.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses data AI.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!extracted) return;
        onApply(extracted);
        onClose();
    };

    const matchedVehicle = vehicles.find((v) => String(v.id) === String(extracted?.vehicle_id));
    const matchedClass = rentalClasses.find((c) => c.value === extracted?.rental_class);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <DialogPanel className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white dark:from-slate-800/90 dark:to-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
                                ✨
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                                        {t('rental.ai.generator_title', undefined, 'AI Auto-Fill Form Tarif Rental')}
                                    </h3>
                                    <span className="rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-indigo-800 dark:from-indigo-950 dark:to-purple-950 dark:text-indigo-300">
                                        Gemini 1.5 Flash
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('rental.ai.generator_subtitle', undefined, 'Ketik deskripsi tarif bebas dalam bahasa Indonesia. AI akan mengisi form dan diskon bertingkat secara otomatis.')}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white transition"
                            title="Tutup"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Input Section */}
                        <div className="space-y-3">
                            <label htmlFor="ai_rate_prompt" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                ✍️ Masukkan Teks / Deskripsi Tarif:
                            </label>
                            <div className="relative">
                                <textarea
                                    id="ai_rate_prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    rows={3}
                                    placeholder="Contoh: Tarif Harian Avanza Veloz 450rb lepas kunci deposit 500rb limit 200km. Sewa 3-6 hari diskon 10%, sewa 7+ hari diskon 20%, loyalty 5x order diskon 15%..."
                                    className="w-full rounded-2xl border-slate-200 bg-slate-50/70 p-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-850 dark:text-white"
                                />
                            </div>

                            {/* Sample Prompt Chips */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-slate-400">💡 Contoh Prompt Cepat:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {samplePrompts.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPrompt(p)}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 transition"
                                        >
                                            {p.length > 55 ? `${p.substring(0, 55)}…` : p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt.trim()}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Menganalisis & Menyusun Parameter Tarif…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>✨</span>
                                            <span>{extracted ? 'Generate Ulang dengan AI' : 'Generate Parameter Tarif dengan AI'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Extracted Preview */}
                        {extracted && (
                            <div className="space-y-4 rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/30 p-5 dark:border-indigo-900/60 dark:bg-slate-850 dark:from-slate-850 dark:to-indigo-950/20 shadow-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3 dark:border-indigo-900/40">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                                            ✓
                                        </span>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                                Pratinjau Hasil Ekstraksi AI
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {extracted.explanation || 'Data siap dimasukkan ke formulir input.'}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
                                    >
                                        <span>⚡</span>
                                        <span>Terapkan ke Formulir</span>
                                    </button>
                                </div>

                                {/* Key Fields Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nama Tarif</span>
                                        <span className="text-xs font-black text-slate-900 dark:text-white truncate block mt-0.5">
                                            {extracted.name || '-'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Periode Sewa</span>
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase block mt-0.5">
                                            {extracted.period_type === 'daily' ? '📅 Harian' : extracted.period_type === 'weekly' ? '📆 Mingguan' : '🗓️ Bulanan'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Harga Pokok</span>
                                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                            {formatMoney(extracted.rate_per_period || 0)}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Deposit Jaminan</span>
                                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
                                            {extracted.deposit_amount ? formatMoney(extracted.deposit_amount) : 'Tanpa Deposit'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cakupan Armada</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                                            {matchedVehicle ? `🚗 ${matchedVehicle.name}` : matchedClass ? `🏷️ Kelas ${matchedClass.label}` : '🌐 Semua Armada'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Batas Jarak KM</span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                            {extracted.km_limit_per_period ? `${extracted.km_limit_per_period} KM / periode` : 'Unlimited KM'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kelebihan KM</span>
                                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
                                            {extracted.excess_km_rate ? `${formatMoney(extracted.excess_km_rate)} / KM` : '-'}
                                        </span>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Denda Telat</span>
                                        <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
                                            {extracted.late_fee_per_day ? `${formatMoney(extracted.late_fee_per_day)} / hari` : '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Tier Discounts Preview */}
                                {extracted.tiers && extracted.tiers.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 block">
                                            ⭐ Tier Diskon Bertingkat ({extracted.tiers.length} Tier):
                                        </span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {extracted.tiers.map((t, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white/90 p-2.5 text-xs dark:border-indigo-900/40 dark:bg-slate-800"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                                            {i + 1}
                                                        </span>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white text-[11px]">
                                                                {t.tier_type === 'period_volume' ? '📅 Volume Sewa' : '⭐ Loyalty'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {t.min_threshold}{t.max_threshold ? ` - ${t.max_threshold}` : '+'} {t.tier_type === 'period_volume' ? 'periode' : 'rental'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-bold font-mono text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                        {t.modifier_type === 'percent_discount' ? `Diskon ${t.modifier_value}%` : `Potongan ${formatMoney(t.modifier_value)}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-slate-200/80 px-6 py-3.5 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                        <span className="text-[11px] text-slate-400">
                            💡 Data yang diterapkan dapat disesuaikan kembali pada formulir sebelum disimpan.
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                            >
                                Tutup
                            </button>
                            {extracted && (
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition"
                                >
                                    <span>⚡</span>
                                    <span>Terapkan ke Formulir</span>
                                </button>
                            )}
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import axios from 'axios';
import React, { useState } from 'react';

export interface ExtractedBaseData {
    code?: string;
    name?: string;
    kind?: string;
    status?: string;
    address?: string;
    city?: string;
    province?: string;
    zip?: string;
    latitude?: string;
    longitude?: string;
    phone?: string;
    email?: string;
    opens_at?: string;
    closes_at?: string;
    timezone?: string;
    vehicle_capacity?: number | string | null;
    allows_overnight?: boolean;
    service_radius_km?: number | string | null;
    manager_id?: string;
    notes?: string;
}

interface ManagerOption {
    id: number;
    name: string;
    email: string;
}

interface Props {
    managers?: ManagerOption[];
    onApply: (data: ExtractedBaseData) => void;
}

export default function FleetBaseAiGeneratePanel({ managers = [], onApply }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [isOpen, setIsOpen] = useState(true);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [extracted, setExtracted] = useState<ExtractedBaseData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [appliedSuccess, setAppliedSuccess] = useState(false);

    const samplePrompts = [
        'Depot Utama Cakung kode JKT-CKG-01, Jl. Raya Bekasi KM 24 Jakarta Timur 13910 DKI Jakarta, telp 021-4601234, email pool.cakung@seruwit.com, kapasitas 50 mobil, izin parkir inap 24 jam overnight, radius layanan 35 km, manajer Pak Budi',
        'Pool Satelit Bandara Soetta T2, Jl. Perimeter Selatan Bandara Tangerang Banten, kapasitas 20 mobil, operasional jam 06:00 sampai 23:00, radius antar 15 km',
        'Workshop Maintenance Cikarang, Kawasan Industri Jababeka Blok C2 Bekasi Jawa Barat 17530, khusus perbaikan truk dan service berkala, kapasitas 15 truk, buka jam 08.00 - 17.00 WIB',
        'Cabang Satelit Surabaya Rungkut, Jl. Rungkut Industri III No 12 Surabaya Jawa Timur 60293, kapasitas 25 unit, buka 24 jam',
    ];

    const handleGenerate = async () => {
        const text = prompt.trim();
        if (!text) {
            return;
        }

        setLoading(true);
        setError(null);
        setAppliedSuccess(false);

        try {
            const response = await axios.post(prefixedRoute('fleet.bases.ai-generate'), {
                text,
                managers: managers.map((m) => ({ id: m.id, name: m.name, email: m.email })),
            });

            if (response.data?.success && response.data?.data) {
                setExtracted(response.data.data);
            } else {
                setError(response.data?.message || 'Gagal mengekstrak spesifikasi base/pool.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses data AI.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!extracted) {
            return;
        }
        onApply(extracted);
        setAppliedSuccess(true);
        setTimeout(() => setAppliedSuccess(false), 4000);
    };

    const countExtractedFields = (data: ExtractedBaseData): number => {
        let count = 0;
        Object.entries(data).forEach(([key, val]) => {
            if (val !== null && val !== undefined && val !== '' && val !== 0) {
                count++;
            }
        });
        return count;
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/80 via-sky-50/40 to-slate-50/90 p-5 sm:p-6 shadow-sm transition-all duration-300 dark:border-indigo-900/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-300/25 to-purple-300/20 blur-3xl dark:from-indigo-600/10 dark:to-purple-600/10" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gradient-to-tr from-sky-300/25 to-teal-300/20 blur-3xl dark:from-sky-600/10 dark:to-teal-600/10" />

            <div className="relative z-10 space-y-4">
                {/* Header Title & Collapse Toggle */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-indigo-700 ring-1 ring-indigo-500/20 backdrop-blur-md dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/30">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse dark:bg-indigo-400" />
                            <span>✨ AI SMART BASE QUICK-FILL</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Generate informasi pool, alamat, koordinat peta & kapasitas dari teks bebas
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 shadow-2xs transition dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <span>{isOpen ? 'Sembunyikan' : 'Buka Asisten AI'}</span>
                        <svg
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                </div>

                {isOpen && (
                    <div className="space-y-3.5 pt-1">
                        {/* Textarea Input */}
                        <div>
                            <textarea
                                id="ai-fleet-base-prompt-input"
                                rows={3}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Tempel atau ketik deskripsi pangkalan pool bebas. Contoh: 'Depot Utama Cakung JKT-CKG-01, Jl. Raya Bekasi KM 24 Jakarta Timur 13910, telp 021-4601234, kapasitas 50 armada, buka 24 jam overnight, radius 35 km'..."
                                className="block w-full rounded-2xl border-slate-200/90 bg-white/90 p-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 shadow-xs dark:border-slate-800 dark:bg-slate-800/90 dark:text-white"
                            />
                        </div>

                        {/* Sample Prompt Chips */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Contoh Prompt:
                            </span>
                            {samplePrompts.map((sample, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPrompt(sample)}
                                    className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    {sample.split(',')[0]}
                                </button>
                            ))}
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Action Buttons & Result Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-100/70 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow shadow-indigo-500/20 active:scale-[0.99] transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            <span>Menganalisis Detail Base...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                            </svg>
                                            <span>Generate Data Pool & Base</span>
                                        </>
                                    )}
                                </button>

                                {prompt.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPrompt('');
                                            setExtracted(null);
                                            setError(null);
                                        }}
                                        className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
                                    >
                                        Bersihkan
                                    </button>
                                )}
                            </div>

                            {/* Applied Feedback */}
                            {appliedSuccess && (
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 animate-bounce dark:bg-emerald-950/60 dark:text-emerald-300">
                                    <span>✓ Data Berhasil Diterapkan ke Form Base!</span>
                                </div>
                            )}

                            {/* Extracted Stats & Apply Button */}
                            {extracted && !appliedSuccess && (
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        ✓ {countExtractedFields(extracted)} atribut terdeteksi
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleApply}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:shadow shadow-emerald-600/20 active:scale-[0.99] transition-all"
                                    >
                                        <span>Terapkan ke Form</span>
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Extracted Tags Preview */}
                        {extracted && (
                            <div className="rounded-2xl border border-indigo-100/80 bg-white/70 p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-800/70">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Ringkasan Atribut Base yang Ditemukan:
                                </p>
                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    {extracted.name && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50">
                                            🏢 {extracted.name}
                                        </span>
                                    )}
                                    {extracted.code && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-mono font-black text-slate-800 border border-slate-200 dark:bg-slate-700 dark:text-white">
                                            🏷️ {extracted.code}
                                        </span>
                                    )}
                                    {extracted.kind && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-0.5 font-semibold text-purple-700 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300">
                                            Jenis: {extracted.kind}
                                        </span>
                                    )}
                                    {extracted.city && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 border border-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300">
                                            📍 {extracted.city}
                                        </span>
                                    )}
                                    {extracted.province && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 border border-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300">
                                            {extracted.province}
                                        </span>
                                    )}
                                    {extracted.vehicle_capacity && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            🚗 Kapasitas {extracted.vehicle_capacity} Unit
                                        </span>
                                    )}
                                    {extracted.opens_at && extracted.closes_at && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300">
                                            ⏰ {extracted.opens_at} - {extracted.closes_at}
                                        </span>
                                    )}
                                    {extracted.allows_overnight && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            🌙 Inap 24h
                                        </span>
                                    )}
                                    {extracted.service_radius_km && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300">
                                            🌐 Radius {extracted.service_radius_km} KM
                                        </span>
                                    )}
                                    {extracted.phone && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200">
                                            📞 {extracted.phone}
                                        </span>
                                    )}
                                    {extracted.latitude && extracted.longitude && (
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-slate-200">
                                            🗺️ GPS Set
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

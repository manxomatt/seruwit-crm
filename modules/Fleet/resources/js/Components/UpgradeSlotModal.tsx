import Modal from '@/Components/Modal';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentQuota: number;
    currentUsed: number;
}

interface UpgradePreviewData {
    current_vehicles: number;
    new_vehicles: number;
    additional_vehicles: number;
    days_remaining: number;
    total_days: number;
    old_tier_id: number | null;
    old_tier_name: string | null;
    new_tier_id: number | null;
    new_tier_name: string | null;
    old_price_per_vehicle: number;
    new_price_per_vehicle: number;
    old_monthly_total: number;
    new_monthly_total: number;
    old_daily_rate: number;
    new_daily_rate: number;
    daily_difference: number;
    prorated_amount: number;
    subscription_id: number;
}

export default function UpgradeSlotModal({
    isOpen,
    onClose,
    currentQuota,
    currentUsed,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [addition, setAddition] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [preview, setPreview] = useState<UpgradePreviewData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const targetQuota = Math.max(currentQuota + 1, currentQuota + addition);

    // Fetch live calculation preview when target quota changes
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const url = `${prefixedRoute('subscription.upgrade.preview')}?new_vehicle_quota=${targetQuota}`;

        fetch(url, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Gagal menghitung kalkulasi prorata.');
                }
                return res.json();
            })
            .then((json) => {
                if (isMounted) {
                    if (json.success && json.data) {
                        setPreview(json.data);
                    } else {
                        setError(json.message || 'Gagal memuat preview.');
                    }
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.message || 'Terjadi kesalahan jaringan.');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [targetQuota, isOpen]);

    const handleConfirmUpgrade = () => {
        setSubmitting(true);
        router.post(
            prefixedRoute('subscription.order'),
            {
                type: 'upgrade',
                subscribed_vehicles: targetQuota,
            },
            {
                onFinish: () => {
                    setSubmitting(false);
                    onClose();
                },
            },
        );
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const PRESET_OPTIONS = [1, 5, 10, 20];

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold text-lg">
                            ⚡
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 dark:text-white">
                                Tambah Kapasitas Slot Armada
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Upgrade kuota slot kendaraan dengan perhitungan prorata otomatis.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                        ✕
                    </button>
                </div>

                {/* Current Status Badge */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Kuota Saat Ini
                        </p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {currentQuota} Slot ({currentUsed} Terpakai)
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Target Kuota Baru
                        </p>
                        <p className="text-base font-black text-indigo-600 dark:text-indigo-400">
                            {targetQuota} Slot (+{addition})
                        </p>
                    </div>
                </div>

                {/* Preset Options */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pilih Tambahan Slot:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESET_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setAddition(opt)}
                                className={`rounded-2xl py-2.5 text-xs font-black transition border ${
                                    addition === opt
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
                            >
                                +{opt} Slot
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calculation Breakdown Card */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Sisa Masa Aktif Periode Ini:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {preview ? `${preview.days_remaining} Hari Tersisa` : '...'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">Tier Tarif Armada:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {preview ? `${preview.new_tier_name} (${formatCurrency(preview.new_price_per_vehicle)}/unit)` : '...'}
                        </span>
                    </div>

                    <div className="border-t border-indigo-100/80 dark:border-indigo-900/40 pt-2 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Total Biaya Prorata:
                            </span>
                            <p className="text-[10px] text-slate-400">
                                Hanya bayar selisih sisa hari
                            </p>
                        </div>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {loading ? 'Menghitung...' : preview ? formatCurrency(preview.prorated_amount) : '-'}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmUpgrade}
                        disabled={loading || submitting || !preview}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? 'Memproses...' : 'Lanjut ke Pembayaran →'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

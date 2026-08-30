import Modal from '@/Components/Modal';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
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
    const { t } = useTrans();
    const [addition, setAddition] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [preview, setPreview] = useState<UpgradePreviewData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // If current quota is 0 (trial expired/new), minimum target is addition. Otherwise currentQuota + addition.
    const targetQuota = currentQuota > 0 ? currentQuota + addition : Math.max(1, addition);

    // Fetch live calculation preview with debounce when target quota changes
    useEffect(() => {
        if (!isOpen || addition < 1) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const timeoutId = setTimeout(() => {
            const url = `${prefixedRoute('subscription.upgrade.preview')}?new_vehicle_quota=${targetQuota}`;

            fetch(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then(async (res) => {
                    const json = await res.json().catch(() => null);
                    if (!res.ok) {
                        throw new Error(json?.message || 'Gagal menghitung kalkulasi prorata.');
                    }
                    return json;
                })
                .then((json) => {
                    if (isMounted) {
                        if (json?.success && json.data) {
                            setPreview(json.data);
                        } else {
                            setError(json?.message || 'Gagal memuat preview.');
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
        }, 200);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [targetQuota, addition, isOpen]);

    const handleConfirmUpgrade = () => {
        if (addition < 1) return;

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

    const handleAdditionChange = (val: number) => {
        const normalized = Math.max(1, Math.min(9999, Math.floor(val) || 1));
        setAddition(normalized);
    };

    const adjustAddition = (delta: number) => {
        setAddition((prev) => Math.max(1, Math.min(9999, prev + delta)));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const QUICK_ADD_OPTIONS = [1, 2, 5, 10, 20, 50];

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
                                {t('fleet.quota.modal_title', undefined, 'Tambah Kapasitas Unit Armada')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('fleet.quota.modal_subtitle', undefined, 'Upgrade kuota kapasitas unit kendaraan dengan perhitungan prorata otomatis.')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Current Status & Target Summary Badge */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/60 dark:border-slate-700/60">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {t('fleet.quota.current_capacity', undefined, 'Kapasitas Saat Ini')}
                        </p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">
                            {t('fleet.quota.current_capacity_value', { quota: currentQuota, used: currentUsed }, `${currentQuota} Unit (${currentUsed} Terpakai)`)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {t('fleet.quota.target_capacity', undefined, 'Target Kapasitas Baru')}
                        </p>
                        <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                            {t('fleet.quota.target_capacity_value', { quota: targetQuota, addition }, `${targetQuota} Unit (+${addition})`)}
                        </p>
                    </div>
                </div>

                {/* Flexible Addition / Reduction Stepper & Numeric Input */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {t('fleet.quota.custom_addition_label', undefined, 'Tentukan Jumlah Tambahan Kapasitas Unit:')}
                    </label>

                    {/* Stepper Input Container */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => adjustAddition(-1)}
                            disabled={addition <= 1}
                            aria-label="Kurang 1 unit"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-indigo-300 active:scale-95 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            −
                        </button>

                        <div className="relative flex-1">
                            <input
                                type="number"
                                min={1}
                                max={9999}
                                value={addition}
                                onChange={(e) => handleAdditionChange(parseInt(e.target.value, 10))}
                                className="block w-full rounded-2xl border border-slate-200/80 bg-white py-3 px-4 text-center text-xl font-black text-slate-900 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                {t('fleet.quota.units_label', undefined, 'Unit')}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => adjustAddition(1)}
                            aria-label="Tambah 1 unit"
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-indigo-300 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            +
                        </button>
                    </div>

                    {/* Quick Preset Buttons & Increments / Decrements */}
                    <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>{t('fleet.quota.quick_presets_label', undefined, 'Pilihan Cepat Tambahan / Pengurangan:')}</span>
                            {addition > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setAddition(1)}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
                                >
                                    Reset (1 Unit)
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {/* Decrement shortcuts if addition > 5 */}
                            {addition > 5 && (
                                <button
                                    type="button"
                                    onClick={() => adjustAddition(-5)}
                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    −5
                                </button>
                            )}
                            {addition > 1 && (
                                <button
                                    type="button"
                                    onClick={() => adjustAddition(-1)}
                                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                >
                                    −1
                                </button>
                            )}

                            {/* Preset buttons */}
                            {QUICK_ADD_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAddition(opt)}
                                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition border ${
                                        addition === opt
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-600/30'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    +{opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Calculation Breakdown Card */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                            {t('fleet.quota.days_remaining', undefined, 'Sisa Masa Aktif Periode Ini:')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {preview ? t('fleet.quota.days_remaining_val', { days: preview.days_remaining }, `${preview.days_remaining} Hari Tersisa`) : '...'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                            {t('fleet.quota.tier_rate', undefined, 'Tier Tarif Armada:')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {preview ? `${preview.new_tier_name} (${formatCurrency(preview.new_price_per_vehicle)}/unit)` : '...'}
                        </span>
                    </div>

                    <div className="border-t border-indigo-100/80 dark:border-indigo-900/40 pt-2 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {t('fleet.quota.total_prorated', undefined, 'Total Biaya Prorata:')}
                            </span>
                            <p className="text-[10px] text-slate-400">
                                {t('fleet.quota.prorated_hint', undefined, 'Hanya bayar selisih sisa hari')}
                            </p>
                        </div>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                            {loading ? t('fleet.quota.calculating', undefined, 'Menghitung...') : preview ? formatCurrency(preview.prorated_amount) : '-'}
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
                        {t('common.cancel', undefined, 'Batal')}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmUpgrade}
                        disabled={loading || submitting || !preview || addition < 1}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {submitting ? t('common.processing', undefined, 'Memproses...') : t('fleet.quota.proceed_payment', undefined, 'Lanjut ke Pembayaran →')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

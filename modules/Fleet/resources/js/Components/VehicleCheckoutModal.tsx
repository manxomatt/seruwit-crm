import Modal from '@/Components/Modal';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export interface CheckoutVehicleItem {
    id: number;
    name: string;
    plate_number: string;
    status?: string;
    active_until?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vehicles: CheckoutVehicleItem[];
}

interface PricingData {
    vehicle_count: number;
    duration_months: number;
    price_per_vehicle_per_month: number;
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    total_amount: number;
    tier_name: string;
}

export default function VehicleCheckoutModal({
    isOpen,
    onClose,
    vehicles,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [durationMonths, setDurationMonths] = useState<1 | 3 | 6 | 12>(1);
    const [pricing, setPricing] = useState<PricingData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || vehicles.length === 0) {
            setPricing(null);
            setError(null);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        axios
            .post(prefixedRoute('fleet.vehicles.checkout.calculate'), {
                vehicle_ids: vehicles.map((v) => v.id),
                duration_months: durationMonths,
            })
            .then((response) => {
                if (isMounted && response.data?.success) {
                    setPricing(response.data.data);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err.response?.data?.message || 'Gagal menghitung tarif perpanjangan.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, vehicles, durationMonths]);

    const handleCheckout = () => {
        if (vehicles.length === 0 || submitting) return;

        setSubmitting(true);
        setError(null);

        axios
            .post(prefixedRoute('fleet.vehicles.checkout'), {
                vehicle_ids: vehicles.map((v) => v.id),
                duration_months: durationMonths,
                payment_method: 'manual_transfer',
            })
            .then((response) => {
                if (response.data?.success && response.data?.redirect_url) {
                    onClose();
                    router.visit(response.data.redirect_url);
                }
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'Gagal memproses pesanan perpanjangan.');
                setSubmitting(false);
            });
    };

    const formatCurrency = (val: number): string => {
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    const isMultiple = vehicles.length > 1;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            ⚡
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {isMultiple
                                    ? `Perpanjang Masa Aktif (${vehicles.length} Armada)`
                                    : `Perpanjang Masa Aktif — ${vehicles[0]?.plate_number || 'Armada'}`}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isMultiple
                                    ? 'Perpanjang masa aktif beberapa armada sekaligus dalam 1 invoice pembayaran terpadu.'
                                    : `Aktifkan atau perpanjang masa operasional unit ${vehicles[0]?.name || ''}.`}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        ✕
                    </button>
                </div>

                {/* Vehicle Summary List (Scrollable if multiple) */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Armada yang Dipilih ({vehicles.length} Unit)
                    </h4>
                    <div className="max-h-36 overflow-y-auto space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                        {vehicles.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                                        {v.plate_number}
                                    </span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                                        {v.name}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    {v.active_until ? `Masa aktif: ${new Date(v.active_until).toLocaleDateString('id-ID')}` : 'Habis / Belum Aktif'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Duration Selector Options */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                        Pilih Periode Masa Aktif
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { months: 1, label: '1 Bulan', badge: null },
                            { months: 3, label: '3 Bulan', badge: 'Hemat 5%' },
                            { months: 6, label: '6 Bulan', badge: 'Hemat 10%' },
                            { months: 12, label: '12 Bulan', badge: 'Hemat 20%' },
                        ].map((item) => (
                            <button
                                key={item.months}
                                type="button"
                                onClick={() => setDurationMonths(item.months as any)}
                                className={`relative flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition ${
                                    durationMonths === item.months
                                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-300'
                                }`}
                            >
                                {item.badge && (
                                    <span className="absolute -top-2.5 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                                        {item.badge}
                                    </span>
                                )}
                                <span className="text-sm font-black">{item.label}</span>
                                <span className="mt-0.5 text-[10px] text-slate-500">
                                    {item.months * 30} Hari
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Calculation Breakdown Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/80 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-xs font-bold text-slate-400 animate-pulse">
                            Menghitung rincian tagihan...
                        </div>
                    ) : pricing ? (
                        <>
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>Tarif per Unit per Bulan ({pricing.tier_name})</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(pricing.price_per_vehicle_per_month)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span>
                                    Subtotal ({pricing.vehicle_count} Unit × {pricing.duration_months} Bulan)
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(pricing.subtotal)}
                                </span>
                            </div>
                            {pricing.discount_amount > 0 && (
                                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                                    <span>Diskon Durasi ({pricing.discount_percent}%)</span>
                                    <span className="font-mono">
                                        - {formatCurrency(pricing.discount_amount)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-3 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        Total Pembayaran
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Termasuk kode unik transfer bank
                                    </p>
                                </div>
                                <span className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(pricing.total_amount)}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="py-2 text-center text-xs text-rose-500">
                            {error || 'Data kalkulasi tidak tersedia.'}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                        ⚠️ {error}
                    </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={loading || submitting || !pricing}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? (
                            <span>Memproses Pesanan...</span>
                        ) : (
                            <>
                                <span>⚡</span>
                                <span>Lanjut ke Pembayaran</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

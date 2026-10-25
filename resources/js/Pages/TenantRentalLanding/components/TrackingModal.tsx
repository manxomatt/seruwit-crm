import React, { useState } from 'react';
import { router } from '@inertiajs/react';

interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TrackingModal({ isOpen, onClose }: TrackingModalProps) {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleLookup = (e: React.FormEvent) => {
        e.preventDefault();
        const cleaned = token.trim();
        if (!cleaned) {
            setError('Silakan masukkan kode booking atau token sewa Anda.');
            return;
        }

        // Navigate to booking show or track
        if (cleaned.length >= 8) {
            router.visit(route('book.rental.booking.show', cleaned));
        } else {
            router.visit(route('book.rental.track', { code: cleaned }));
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-teal-700 to-emerald-700 px-6 py-6 text-white">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    >
                        <span className="material-symbols-outlined text-[20px] block">close</span>
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold tracking-wide uppercase mb-2">
                        <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                        <span>Tracking Status</span>
                    </div>
                    <h3 className="text-xl font-bold font-heading">Lacak Pesanan Sewa Mobil</h3>
                    <p className="text-sm text-teal-50 mt-1">
                        Masukkan kode booking atau token untuk memantau status pesanan, pembayaran, dan unit mobil Anda.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLookup} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Kode Booking / Public Token
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                                confirmation_number
                            </span>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => {
                                    setToken(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                placeholder="Contoh: RNT-2024-0012 atau token..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition uppercase"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-teal-600 text-[16px]">info</span>
                            Di mana menemukan kode booking?
                        </p>
                        <p>
                            Kode booking tercantum pada pesan WhatsApp konfirmasi reservasi dan email nota sewa Anda.
                        </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2"
                        >
                            <span>Lacak Sekarang</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

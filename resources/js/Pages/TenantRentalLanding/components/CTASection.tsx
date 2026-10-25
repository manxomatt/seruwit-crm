import React from 'react';
import { router } from '@inertiajs/react';
import { Brand } from '../types';

interface CTASectionProps {
    brand?: Brand;
}

export default function CTASection({ brand }: CTASectionProps) {
    const phone = brand?.support_phone?.replace(/[^0-9]/g, '') || '081234567890';
    const num = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(`Halo ${brand?.name || 'Rental'}, saya ingin konsultasi dan pesan sewa mobil.`)}`;

    return (
        <section className="py-16 sm:py-20 bg-slate-950 text-white relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.3),transparent_70%)]" />
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[48rem] h-[24rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">stars</span>
                    <span>Reservasi Cepat & Aman</span>
                </div>

                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    Siap Memulai Perjalanan Nyaman Bersama Kami?
                </h2>

                <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Pesan unit mobil pilihan Anda sekarang sebelum kehabisan jadwal, atau konsultasikan rute dan paket khusus bersama customer support kami.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.visit(route('book.rental.search'))}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-extrabold shadow-lg shadow-teal-600/30 active:scale-95 transition cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px]">search</span>
                        <span>Cari & Pesan Mobil Sekarang</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>

                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-700/30 active:scale-95 transition"
                    >
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                        <span>Konsultasi WhatsApp 24 Jam</span>
                    </a>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                        Konfirmasi Instan
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                        Bebas Biaya Pembatalan H-2
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                        Bisa Antar ke Lokasi
                    </span>
                </div>
            </div>
        </section>
    );
}

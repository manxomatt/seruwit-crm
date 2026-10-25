import React from 'react';
import { router } from '@inertiajs/react';
import { RENTAL_SERVICES } from '../constants';

export default function ServicesSection() {
    return (
        <section id="layanan" className="py-20 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(15,118,110,0.18),transparent_60%)]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px]">room_service</span>
                        <span>Solusi Perjalanan Lengkap</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Layanan Sewa Kendaraan Sesuai Kebutuhan Anda
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        Mulai dari liburan santai bareng keluarga, antar-jemput bandara tepat waktu, hingga kebutuhan operasional perusahaan jangka panjang.
                    </p>
                </div>

                {/* 4 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {RENTAL_SERVICES.map((srv) => (
                        <div
                            key={srv.id}
                            className="bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 flex flex-col justify-between hover:border-teal-400/60 hover:bg-slate-800 transition-all duration-300 group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-[26px]">
                                            {srv.icon}
                                        </span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-500/30 text-[10px] font-bold tracking-wide">
                                        {srv.badge}
                                    </span>
                                </div>

                                <h3 className="font-heading text-lg font-bold text-white mb-1">
                                    {srv.title}
                                </h3>
                                <p className="text-xs font-semibold text-teal-300 mb-3">
                                    {srv.subtitle}
                                </p>

                                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                                    {srv.description}
                                </p>

                                <ul className="space-y-2 border-t border-slate-700/60 pt-4 mb-6">
                                    {srv.features.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                                            <span className="material-symbols-outlined text-[16px] text-emerald-400">
                                                check
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                type="button"
                                onClick={() => router.visit(route('book.rental.search'))}
                                className="w-full py-2.5 px-4 rounded-xl bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 hover:border-teal-500 text-teal-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Pesan Layanan</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

import React from 'react';
import { ADVANTAGES } from '../constants';

export default function AdvantagesSection() {
    return (
        <section id="keunggulan" className="py-20 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                        <span>Standar Kenyamanan & Keamanan</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Mengapa Ribuan Pelanggan Memilih Kami?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Kami berkomitmen memberikan pengalaman rental mobil terbaik dari awal pemesanan hingga selesai, tanpa rasa cemas dan tanpa komplikasi.
                    </p>
                </div>

                {/* 6 Grid Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {ADVANTAGES.map((adv, idx) => (
                        <div
                            key={idx}
                            className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:border-teal-300 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="h-12 w-12 rounded-2xl bg-teal-100/80 text-teal-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-700 group-hover:text-white transition-all duration-300">
                                        <span className="material-symbols-outlined text-[26px]">
                                            {adv.icon}
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                                        {adv.tag}
                                    </span>
                                </div>

                                <h3 className="font-heading text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-800 transition">
                                    {adv.title}
                                </h3>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {adv.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-bold text-teal-700 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Selengkapnya</span>
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

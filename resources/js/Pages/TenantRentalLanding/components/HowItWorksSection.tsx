import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../constants';

export default function HowItWorksSection() {
    return (
        <section id="cara-sewa" className="py-20 bg-slate-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-teal-600">route</span>
                        <span>Alur Pemesanan Simpel</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Cara Mudah Sewa Mobil dalam 4 Langkah
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Hanya butuh beberapa menit tanpa prosedur rumit. Siapapun dapat memesan mobil kapan saja langsung dari ponsel pintar Anda.
                    </p>
                </div>

                {/* 4 Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {HOW_IT_WORKS_STEPS.map((stepItem, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between"
                        >
                            {/* Step Number Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="font-heading text-3xl font-black text-teal-800/25 tracking-tighter">
                                    {stepItem.step}
                                </span>
                                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[24px]">
                                        {stepItem.icon}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
                                    {stepItem.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {stepItem.description}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-teal-700">
                                <span>Langkah {idx + 1} dari 4</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

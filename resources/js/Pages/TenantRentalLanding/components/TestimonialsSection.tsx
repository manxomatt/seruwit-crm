import React from 'react';
import { TESTIMONIALS } from '../constants';

export default function TestimonialsSection() {
    return (
        <section className="py-20 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-amber-600">reviews</span>
                        <span>Ulasan & Pengalaman Nyata</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Apa Kata Penyewa Kami?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Kepercayaan dan kepuasan pelanggan adalah prioritas utama kami dalam setiap perjalanan.
                    </p>
                </div>

                {/* Testimonial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {TESTIMONIALS.map((t, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                {/* Stars */}
                                <div className="flex items-center gap-1 text-amber-500">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <span key={i} className="material-symbols-outlined text-[18px] fill-current">
                                            star
                                        </span>
                                    ))}
                                    <span className="text-xs font-bold text-slate-400 ml-1.5">5.0 / 5.0</span>
                                </div>

                                <p className="text-sm text-slate-700 leading-relaxed italic">
                                    "{t.comment}"
                                </p>
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                                <img
                                    src={t.avatar}
                                    alt={t.name}
                                    className="h-11 w-11 rounded-full object-cover border-2 border-teal-500/20"
                                />
                                <div>
                                    <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-1.5">
                                        <span>{t.name}</span>
                                        <span className="material-symbols-outlined text-teal-600 text-[16px]" title="Penyewa Terverifikasi">
                                            verified
                                        </span>
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {t.role} • {t.city}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

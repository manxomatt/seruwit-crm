import React, { useState } from 'react';
import { FAQS } from '../constants';

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-20 bg-white relative">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center space-y-3 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-teal-600">help</span>
                        <span>Pertanyaan Umum</span>
                    </div>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Pertanyaan yang Sering Diajukan
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Semua informasi penting seputar persyaratan sewa, jaminan deposit, dan layanan kami ada di sini.
                    </p>
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                    {FAQS.map((item, idx) => {
                        const isOpen = openIndex === idx;

                        return (
                            <div
                                key={idx}
                                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                    isOpen
                                        ? 'border-teal-300 bg-teal-50/20 shadow-sm'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(idx)}
                                    className="w-full py-4 sm:py-5 px-5 sm:px-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                                >
                                    <span className="font-heading font-bold text-sm sm:text-base text-slate-900">
                                        {item.q}
                                    </span>
                                    <span
                                        className={`material-symbols-outlined text-[20px] text-teal-700 transition-transform duration-200 shrink-0 ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                    >
                                        expand_more
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className="px-5 sm:px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-teal-100/60 pt-3">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
